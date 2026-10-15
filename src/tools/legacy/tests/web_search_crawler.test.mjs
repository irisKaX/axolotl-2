import test from 'node:test';import assert from 'node:assert/strict';import {JSDOM} from 'jsdom';
import {crawlSite,normalizePageUrl,parseSitemap} from '../tools/web-search/crawler.js';
import {fetchSearchText} from '../tools/web-search/network.js';
import {collectSearchPage} from '../tools/web-search/collect.js';import {validateOptions} from '../tools/web-search/model.js';
const base='https://example.test',w=new JSDOM('',{url:base,runScripts:'outside-only'}).window;
const parse=(html,url)=>w.eval('('+collectSearchPage.toString()+')')({html,url});
const xml=s=>parseSitemap(s,w.DOMParser);
const seed=parse('<p>Oneplay</p><a href="/a">A</a><a href="/a#x">A</a><a href="https://evil.test">Other</a>',base+'/start');
const options=validateOptions({query:'Oneplay',scope:'site'});
test('URL policy confines crawl, skips action/binary/tracking duplicates and retains useful queries',()=>{
 for(const url of ['https://evil.test/a','javascript:alert(1)','/logout','/account/delete','/a.pdf','/?action=delete','https://user:pass@example.test/'])assert.equal(normalizePageUrl(url,base),null,url);
 assert.equal(normalizePageUrl('/a?utm_source=x&page=2#anchor',base),base+'/a?page=2');
 assert.equal(normalizePageUrl('/%6cogout',base),null);
});
test('namespaced sitemap extraction ignores image locations and distinguishes index',()=>{
 assert.deepEqual(xml('<urlset xmlns="x" xmlns:image="i"><url><loc>https://example.test/a</loc><image:image><image:loc>https://example.test/b.png</image:loc></image:image></url></urlset>').urls,[base+'/a']);
 assert.equal(xml('<sitemapindex><sitemap><loc>https://example.test/child.xml</loc></sitemap></sitemapindex>').index,true);
 assert.throws(()=>xml('<broken>'));
});
test('crawler uses live seed, links, robots and nested sitemaps exactly once, reports partial failures',async()=>{
 const files={'/robots.txt':'Sitemap: https://example.test/index.xml','/sitemap.xml':'<urlset/>','/index.xml':'<sitemapindex><sitemap><loc>https://example.test/child.xml</loc></sitemap></sitemapindex>','/child.xml':'<urlset><url><loc>https://example.test/map-only</loc></url></urlset>','/':'<a href="/a">A</a>','/a':'<p>Oneplay twice Oneplay</p><a href="/bad">bad</a>','/map-only':'<p>Oneplay sitemap</p>'};const calls=[];
 const result=await crawlSite({...seed,source:'live'},options,{parse,parseMap:xml,fetchText:async url=>{calls.push(url);const text=files[new URL(url).pathname];if(text===undefined)throw Error('HTTP 404');return {text,bytes:text.length};}});
 assert.equal(calls.filter(x=>x===base+'/a').length,1);assert.equal(calls.includes(base+'/start'),false);assert.ok(calls.includes(base+'/map-only'));assert.ok(!calls.some(x=>x.includes('evil')));
 assert.equal(result.items.length,3);assert.equal(result.errors.length,1);assert.equal(result.errors[0].url,base+'/bad');assert.equal(result.running,undefined);
});
test('cancellation retains completed matches and does not schedule further requests',async()=>{
 const controller=new AbortController();let count=0;
 const r=await crawlSite(seed,options,{signal:controller.signal,parse,parseMap:xml,fetchText:async url=>{if(url.endsWith('.xml')||url.endsWith('.txt'))throw Error('HTTP 404');count++;controller.abort();throw new DOMException('Abort','AbortError');}});
 assert.equal(r.cancelled,true);assert.equal(r.items.length,1);assert.ok(count<=2);
});
test('page limit is explicit, never represented as an exhaustive negative result',async()=>{
 const r=await crawlSite(seed,{...options,maxPages:2},{parse,parseMap:xml,fetchText:async url=>{if(url.endsWith('.xml')||url.endsWith('.txt'))throw Error('HTTP 404');return{text:'<p>no match</p><a href="/next">Next</a>',bytes:44};}});
 assert.equal(r.attempted,2);assert.ok(r.remaining>0);assert.match(r.limit,/stránek/);
});
test('network requests omit credentials, follow redirects and reject overlarge/non-HTML bodies',async()=>{
 const seen=[];const fetchImpl=async(url,opts)=>{seen.push(opts);return new Response('<p>ok</p>',{headers:{'content-type':'text/html'}});};
 assert.equal((await fetchSearchText(base,{fetchImpl})).text,'<p>ok</p>');assert.equal(seen[0].credentials,'omit');assert.equal(seen[0].redirect,'follow');
 await assert.rejects(fetchSearchText(base,{maxBytes:5,fetchImpl}),/velikost/);
 await assert.rejects(fetchSearchText(base,{fetchImpl:async()=>new Response('xx',{headers:{'content-type':'image/png'}})}),/HTML/);
});
test('timeout interrupts a stalled request even if the transport fails to honor abort',async()=>{
 await assert.rejects(fetchSearchText(base,{timeoutMs:20,fetchImpl:()=>new Promise(()=>{})}),/limit/);
});

test('robots and nested sitemaps cannot request action or token endpoints',async()=>{
 const calls=[];
 await crawlSite(seed,options,{parse,parseMap:xml,fetchText:async url=>{calls.push(url);if(url.endsWith('/robots.txt'))return {text:'Sitemap: https://example.test/delete/account.xml?token=ABC',bytes:30};if(url.endsWith('/sitemap.xml'))return {text:'<sitemapindex><sitemap><loc>https://example.test/logout.xml</loc></sitemap><sitemap><loc>https://example.test/safe.xml?token=ABC</loc></sitemap></sitemapindex>',bytes:150};throw Error('HTTP 404');}});
 assert.equal(calls.some(url=>/delete|logout|token=/.test(url)),false,calls.join(' '));
});
test('working declared sitemaps take priority over guessed empty default maps on O2',async()=>{
 const calls=[];
 const r=await crawlSite(seed,options,{parse,parseMap:xml,fetchText:async url=>{
  calls.push(url);
  if(url.endsWith('/robots.txt'))return{text:'Sitemap: https://example.test/sitemap/internet.xml'};
  if(url.endsWith('/sitemap/internet.xml'))return{text:'<urlset><url><loc>https://example.test/from-map</loc></url></urlset>'};
  if(url.endsWith('/sitemap.xml'))return{text:''};
  if(url.endsWith('/sitemap_index.xml'))throw Error('HTTP 404');
  return{text:'<p>Oneplay</p>'};
 }});
 assert.ok(calls.includes(base+'/from-map'));assert.equal(calls.includes(base+'/sitemap.xml'),false);assert.equal(r.mapErrors.length,0);
});
test('unusable declared sitemaps still fall back to default discovery',async()=>{
 const calls=[];
 const r=await crawlSite(seed,options,{parse,parseMap:xml,fetchText:async url=>{
  calls.push(url);
  if(url.endsWith('/robots.txt'))return{text:'Sitemap: https://example.test/broken.xml'};
  if(url.endsWith('/broken.xml'))throw Error('HTTP 503');
  if(url.endsWith('/sitemap.xml'))return{text:'<urlset><url><loc>https://example.test/fallback</loc></url></urlset>'};
  if(url.endsWith('/sitemap_index.xml'))throw Error('HTTP 404');
  return{text:'<p>Oneplay</p>'};
 }});
 assert.ok(calls.includes(base+'/fallback'));assert.equal(r.mapErrors[0].reason,'HTTP 503');
});
test('network distinguishes browser-hidden redirects from connection errors and HTTP failures',async()=>{
 await assert.rejects(fetchSearchText(base,{fetchImpl:async()=>({type:'opaqueredirect',status:0,ok:false,body:null})}),e=>e.code==='REDIRECT_FAILED');
 await assert.rejects(fetchSearchText(base,{fetchImpl:async()=>{throw new TypeError('Failed to fetch');}}),e=>e.code==='NETWORK_ERROR');
 await assert.rejects(fetchSearchText(base,{fetchImpl:async()=>new Response('',{status:403})}),e=>e.code==='HTTP_ERROR'&&e.status===403);
});
