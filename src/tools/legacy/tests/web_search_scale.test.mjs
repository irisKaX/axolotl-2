import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {validateOptions} from '../tools/web-search/model.js';
import {SearchController} from '../tools/web-search/controller.js';
import {crawlSite,parseSitemap} from '../tools/web-search/crawler.js';
import {fetchSearchText} from '../tools/web-search/network.js';
import {buildSearchDiagnostics} from '../tools/web-search/diagnostics.js';

const base='https://example.test';
const MiB=1024*1024;
const opts=extra=>validateOptions({query:'target',scope:'site',...extra});
const snapshot=(url,text='',extra={})=>({url,text,links:[],references:[],source:'html',...extra});
const notFound=()=>{throw Error('HTTP 404');};

test('large-site page options default to 5000 and retain legacy small runs',async()=>{
 assert.equal(opts().maxPages,5000);
 for(const maxPages of [100,300,1000,5000,10000,20000])assert.equal(opts({maxPages}).maxPages,maxPages);
 assert.equal(opts({maxPages:999999}).maxPages,5000);
 const c=new SearchController({});assert.equal(c.state.form.maxPages,5000);c.destroy();
 const limits=await import('../tools/web-search/limits.js');
 assert.deepEqual(limits.PAGE_LIMIT_OPTIONS,[1000,5000,10000,20000]);
 assert.equal(limits.DEFAULT_MAX_PAGES,5000);
});

test('a default crawl passes 1000 pages and 100 MiB, keeps late matches, and batches progress',async()=>{
 const pages=1250,progress=[];
 const component={id:'common',kind:'header',label:'Menu',visible:'target in menu',text:'target in menu',html:'<header>target in menu</header>'};
 const seed=snapshot(base+'/','',{source:'live',components:[component],links:Array.from({length:pages},(_,i)=>base+'/p'+i)});
 const r=await crawlSite(seed,opts(),{onProgress:value=>progress.push(value),parse:(html,url)=>snapshot(url,html,{components:[component]}),fetchText:async(url,{kind,onBytes,maxBytes})=>{
  if(kind!=='html')return notFound();assert.equal(maxBytes,2*MiB);onBytes(128*1024);
  return{text:url===base+'/p1249'?'target late article':'unrelated'};
 }});
 assert.equal(r.scanned,pages+1);assert.equal(r.attempted,pages+1);assert.ok(r.bytes>100*MiB);
 assert.deepEqual(r.items.map(i=>i.url),[base+'/p1249']);assert.equal(r.items[0].components,undefined);
 assert.equal(r.components.length,1);assert.equal(r.components[0].pages.length,pages+1);
 assert.equal(r.remaining,0);assert.equal(r.limit,'');assert.equal(r.cancelled,false);
 assert.equal(progress[0].scanned,1);assert.equal(progress[0].components[0].pages.length,1);
 assert.equal(progress.at(-1).phase,'done');assert.equal(progress.at(-1).scanned,pages+1);
 assert.ok(progress.length<100,'Progress must not clone cumulative results after every page');
 assert.equal(r.limits.maxPages,5000);assert.equal(r.limits.deadlineMs,2*60*60*1000);
 assert.ok(r.limits.totalBytes>=5000*2*MiB);
 const report=JSON.parse(buildSearchDiagnostics({search:opts(),result:r}));assert.deepEqual(report.limits,r.limits);assert.equal(report.summary.bytes,r.bytes);
});

test('declared map discovery passes 20 maps and uses a separate 10 MiB map budget',async()=>{
 const calls=[];
 const r=await crawlSite(snapshot(base+'/'),opts(),{parse:(text,url)=>snapshot(url,text),parseMap:text=>JSON.parse(text),fetchText:async(url,{kind,maxBytes})=>{
  calls.push(url);
  if(url===base+'/robots.txt')return{text:Array.from({length:25},(_,i)=>'Sitemap: '+base+'/m'+i+'.xml').join('\n')};
  if(kind==='xml'){assert.equal(maxBytes,10*MiB);return{text:JSON.stringify({index:false,urls:url===base+'/m24.xml'?[base+'/last-map-page']:[]})};}
  if(url===base+'/last-map-page')return{text:'target'};
  return notFound();
 }});
 assert.ok(calls.includes(base+'/m24.xml'));assert.deepEqual(r.items.map(i=>i.url),[base+'/last-map-page']);assert.equal(r.limit,'');
});

test('discovery retains more than 10000 addresses while the selected page limit still stops requests',async()=>{
 const seed=snapshot(base+'/','',{source:'live'});
 const r=await crawlSite(seed,opts({maxPages:1000}),{parse:(text,url)=>snapshot(url,text),parseMap:()=>({index:false,urls:Array.from({length:15000},(_,i)=>base+'/page'+i)}),fetchText:async(url,{kind})=>{
  if(url===base+'/robots.txt')return{text:'Sitemap: '+base+'/large.xml'};
  if(kind==='xml')return{text:'large map'};
  return{text:'unrelated'};
 }});
 assert.equal(r.discovered,15001);assert.equal(r.attempted,1000);assert.equal(r.remaining,14001);
 assert.match(r.limit,/1000|1 000/);assert.equal(r.limits.discoveredUrls,100000);
});

test('sitemap extraction accepts 50000 URL locations and reports only entries beyond the cap as truncated',()=>{
 const w=new JSDOM('').window;
 try{
  const row=i=>'<url><loc>'+base+'/p'+i+'</loc></url>';
  const body='<urlset>'+Array.from({length:50001},(_,i)=>row(i)).join('')+'</urlset>';
  const map=parseSitemap(body,w.DOMParser);assert.equal(map.urls.length,50000);assert.equal(map.truncated,true);
  assert.equal(map.urls.at(-1),base+'/p49999');
 }finally{w.close();}
});

test('map transport accepts a body over 2 MiB, keeps the page cap, and reports the configured map cap',async()=>{
 const body='<urlset>'+(' '.repeat(2*MiB))+'</urlset>';
 const fetchImpl=async()=>new Response(body,{headers:{'content-type':'application/xml'}});
 assert.equal((await fetchSearchText(base+'/map.xml',{kind:'xml',fetchImpl})).text.length,body.length);
 await assert.rejects(fetchSearchText(base+'/page',{fetchImpl:async()=>new Response(body,{headers:{'content-type':'text/html'}})}),e=>e.code==='CONTENT_TOO_LARGE'&&/2 MiB/.test(e.message));
 await assert.rejects(fetchSearchText(base+'/map.xml',{kind:'xml',fetchImpl:async()=>new Response('',{headers:{'content-type':'application/xml','content-length':String(10*MiB+1)}})}),e=>e.code==='CONTENT_TOO_LARGE'&&/10 MiB/.test(e.message));
});

test('early cancellation still emits initial and terminal counters without starting later requests',async()=>{
 const aborter=new AbortController(),progress=[],calls=[];
 const r=await crawlSite(snapshot(base+'/','target',{links:[base+'/next']}),opts(),{signal:aborter.signal,onProgress:value=>{progress.push(value);if(progress.length===1)aborter.abort();},fetchText:async url=>{calls.push(url);return notFound();}});
 assert.deepEqual(calls,[]);assert.equal(r.cancelled,true);assert.equal(r.scanned,1);
 assert.equal(progress[0].cancelled,false);assert.equal(progress.at(-1).phase,'done');assert.equal(progress.at(-1).cancelled,true);
});

test('custom deadline diagnostics describe the effective deadline instead of an old five-minute limit',async()=>{
 const r=await crawlSite(snapshot(base+'/'),opts(),{deadlineMs:10,fetchText:async(url,{signal})=>new Promise((_,reject)=>signal.addEventListener('abort',()=>reject(Error('aborted')),{once:true}))});
 assert.equal(r.limits.deadlineMs,10);assert.doesNotMatch(r.limit,/5 minut/);assert.match(r.limit,/10 ms/);assert.equal(r.cancelled,false);
});

test('stopping during a throttled update flushes every completed match before abort returns',async()=>{
 const aborter=new AbortController(),progress=[];let resolveSecond;
 const ready=new Promise(resolve=>resolveSecond=resolve);
 const run=crawlSite(snapshot(base+'/','',{links:[base+'/one',base+'/two',base+'/three']}),opts(),{signal:aborter.signal,onProgress:value=>progress.push(value),parse:(text,url)=>snapshot(url,text),fetchText:async(url,{kind,signal})=>{
  if(kind!=='html')return notFound();
  if(url===base+'/one')return {text:'target'};
  resolveSecond();return new Promise((_,reject)=>signal.addEventListener('abort',()=>reject(Error('aborted')),{once:true}));
 }});
 await ready;await Promise.resolve();await Promise.resolve();aborter.abort();
 assert.ok(progress.at(-1).items.some(item=>item.url===base+'/one'));
 const r=await run;assert.equal(r.cancelled,true);assert.equal(r.items.length,1);
});

test('derived transfer budget remains enforced and reports its actual cap',async()=>{
 let calls=0;
 const r=await crawlSite(snapshot(base+'/','target',{links:[base+'/one',base+'/two']}),opts({maxPages:100}),{fetchText:async(url,{onBytes})=>{calls++;onBytes(50000*MiB);return{text:''};}});
 assert.ok(r.limits.totalBytes<50000*MiB);assert.equal(r.bytes,50000*MiB);
 assert.match(r.limit,/načtených dat/);assert.doesNotMatch(r.limit,/Limit 100 MiB/);assert.equal(calls,1);assert.equal(r.cancelled,false);
});
