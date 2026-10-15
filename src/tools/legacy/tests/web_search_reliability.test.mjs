import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {gzipSync} from 'node:zlib';
import {collectSearchPage} from '../tools/web-search/collect.js';
import {searchSnapshot,validateOptions} from '../tools/web-search/model.js';
import {crawlSite,parseSitemap} from '../tools/web-search/crawler.js';
import {fetchSearchText} from '../tools/web-search/network.js';
import {buildSearchDiagnostics} from '../tools/web-search/diagnostics.js';

const base='https://example.test';
function scan(html,live=false,prepare=()=>{}){
 const w=new JSDOM(live?html:'',{url:base+'/start',runScripts:'outside-only'}).window;
 prepare(w);
 try{return w.eval('('+collectSearchPage.toString()+')')(live?{}:{html,url:base+'/start'});}finally{w.close();}
}
const find=(snapshot,query,rest={})=>searchSnapshot(snapshot,validateOptions({query,...rest}));

test('encoded asset IDs in metadata and JSON survive collection before URL decoding',()=>{
 const html='<meta property="og:image" content="/img/%61%31%32%33.webp"><script type="application/ld+json">{"image":"/img/%61456.webp"}</script>';
 for(const live of [false,true]){
  const snapshot=scan(html,live);
  assert.equal(find(snapshot,'a123',{kind:'asset'}).count,1,`metadata, live=${live}`);
  assert.equal(find(snapshot,'a456',{kind:'asset'}).count,1,`JSON, live=${live}`);
 }
});

test('block formatting separates adjacent phrase words while inline letters remain joined',()=>{
 const html='<span style="display:block">One<b>play</b></span><span style="display:block">Sport</span>';
 for(const live of [false,true])assert.equal(find(scan(html,live),'Oneplay Sport').count,1,`live=${live}`);
});

test('fetched HTML excludes inline visibility-hidden text but permits visible descendants',()=>{
 const snapshot=scan('<div style="visibility:hidden">Secret <span>inherited secret</span><span style="visibility:visible">Visible phrase</span></div>');
 assert.equal(find(snapshot,'secret').count,0);
 assert.equal(find(snapshot,'Visible phrase').count,1);
});

test('assets in unassigned light DOM remain searchable without adding invisible phrase text',()=>{
 const snapshot=scan('<div id="host"><img src="/a123.webp"><p>Unassigned phrase</p><p slot="visible">Slotted phrase</p></div>',true,w=>{
  w.document.querySelector('#host').attachShadow({mode:'open'}).innerHTML='<slot name="visible"></slot><p>Shadow phrase</p>';
 });
 assert.equal(find(snapshot,'a123',{kind:'asset'}).count,1);
 assert.equal(find(snapshot,'Unassigned phrase').count,0);
 assert.equal(find(snapshot,'Slotted phrase').count,1);
});

test('text cut in the middle of a single node is explicitly marked partial',()=>{
 const snapshot=scan('<span>'+('x'.repeat(1000010))+' never-inspected</span>');
 assert.equal(snapshot.truncated,true);
 assert.equal(find(snapshot,'never-inspected').truncated,true);
});

test('image-map links and document pagination enter page discovery',()=>{
 const snapshot=scan('<link rel="next" href="/page/2"><link rel="stylesheet" href="/style.css"><map><area href="/mapped-page"></map>');
 assert.deepEqual(Array.from(snapshot.links).sort(),[base+'/mapped-page',base+'/page/2']);
});

test('asset result preserves the base used to resolve relative references',()=>{
 const result=find(scan('<base href="https://cdn.example.test/assets/"><img src="a123.webp">'),'a123',{kind:'asset'});
 assert.equal(result.baseUrl,'https://cdn.example.test/assets/');
});

test('advertised sitemap endpoints without XML suffix are crawled under the same URL policy',async()=>{
 const calls=[],w=new JSDOM('').window;
 const seed={url:base+'/',text:'',references:[],links:[]};
 try{
  const result=await crawlSite(seed,validateOptions({query:'Needle',scope:'site'}),{
   parseMap:text=>parseSitemap(text,w.DOMParser),
   parse:(text,url)=>({url,text,references:[],links:[]}),
   fetchText:async url=>{
    calls.push(url);
    if(url===base+'/robots.txt')return{text:'Sitemap: /maps?format=xml\nSitemap: /delete?format=xml'};
    if(url===base+'/maps?format=xml')return{text:'<sitemapindex><sitemap><loc>/maps/leaf</loc></sitemap></sitemapindex>'};
    if(url===base+'/maps/leaf')return{text:'<urlset><url><loc>/unlinked</loc></url></urlset>'};
    if(url===base+'/unlinked')return{text:'Needle'};
    throw Error('HTTP 404');
   }
  });
  assert.deepEqual(result.items.map(item=>item.url),[base+'/unlinked']);
  assert.equal(calls.some(url=>url.includes('/delete')),false);
 }finally{w.close();}
});

test('raw gzip sitemap bodies are decoded and already-decoded responses are not decoded twice',async()=>{
 const xml='<urlset><url><loc>'+base+'/unlinked</loc></url></urlset>';
 for(const type of ['application/gzip','application/x-gzip','application/octet-stream']){
  const result=await fetchSearchText(base+'/sitemap.xml.gz',{kind:'xml',fetchImpl:async()=>new Response(gzipSync(xml),{headers:{'content-type':type}})});
  assert.equal(result.text,xml,type);
 }
 const result=await fetchSearchText(base+'/sitemap.xml.gz',{kind:'xml',fetchImpl:async()=>new Response(xml,{headers:{'content-type':'application/gzip','content-encoding':'gzip'}})});
 assert.equal(result.text,xml);
});

test('gzip sitemap limit applies to expanded content and malformed gzip is a content error',async()=>{
 await assert.rejects(fetchSearchText(base+'/sitemap.xml.gz',{kind:'xml',maxBytes:1000,fetchImpl:async()=>new Response(gzipSync('<urlset>'+('x'.repeat(10000))+'</urlset>'),{headers:{'content-type':'application/gzip'}})}),/velikost/);
 await assert.rejects(fetchSearchText(base+'/sitemap.xml.gz',{kind:'xml',fetchImpl:async()=>new Response(new Uint8Array([31,139,0,0]),{headers:{'content-type':'application/gzip'}})}),error=>error.code==='SITEMAP_ENCODING_ERROR');
});

test('diagnostics retain partial collection and the non-exhaustive fetched HTML scope',()=>{
 const report=JSON.parse(buildSearchDiagnostics({search:{url:base,scope:'site',kind:'phrase',query:'Needle'},result:{scanned:12,truncatedPages:2}}));
 assert.equal(report.summary.truncatedPages,2);
 assert.equal(report.coverage.method,'live-seed-and-fetched-html');
 assert.equal(report.coverage.allExistingUrlsVerified,false);
 assert.equal(report.coverage.rendersFetchedPages,false);
});
