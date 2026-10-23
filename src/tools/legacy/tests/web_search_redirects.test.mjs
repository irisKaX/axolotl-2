import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {fetchSearchText} from '../tools/web-search/network.js';
import {crawlSite,parseSitemap} from '../tools/web-search/crawler.js';
import {collectSearchPage} from '../../../../browser-extension/tools/web-search/collect.js';
import {validateOptions} from '../tools/web-search/model.js';
const base='https://example.test';
const window=new JSDOM('',{url:base,runScripts:'outside-only'}).window;
const parse=(html,url)=>window.eval('('+collectSearchPage.toString()+')')({html,url});
const parseMap=text=>parseSitemap(text,window.DOMParser);
const options=validateOptions({kind:'asset',query:'a267869',scope:'site'});
const html='<div id="oneplay-a267869">Oneplay</div>';
function response(text,url,redirected=true){const r=new Response(text,{headers:{'content-type':'text/html'}});Object.defineProperties(r,{url:{value:url},redirected:{value:redirected}});return r;}

test('network follows HTTP redirects without credentials or a referrer and returns the final URL',async()=>{
 let init;
 const r=await fetchSearchText(base+'/old',{fetchImpl:async(_,options)=>{init=options;return response(html,base+'/new/');}});
 assert.equal(init.redirect,'follow');assert.equal(init.credentials,'omit');assert.equal(init.referrerPolicy,'no-referrer');
 assert.equal(r.url,base+'/new/');assert.equal(r.redirected,true);assert.equal(r.text,html);
});
test('out-of-scope redirect content is excluded before its body is consumed',async()=>{
 let read=false,cancelled=false;
 await assert.rejects(fetchSearchText(base+'/old',{allowUrl:url=>new URL(url).origin===base,fetchImpl:async()=>({ok:true,url:'https://external.test/page',redirected:true,status:200,body:{cancel(){cancelled=true;},getReader(){read=true;throw Error('Must not read');}}})}),e=>e.code==='REDIRECT_OUTSIDE_SCOPE');
 assert.equal(read,false);assert.equal(cancelled,true);
});
test('crawler uses final page paths for relative links and merges redirected aliases once',async()=>{
 const calls=[];const seed=parse('<a href="/old-one">1</a><a href="/old-two">2</a>',base+'/');
 const r=await crawlSite(seed,options,{parse,parseMap,fetchText:async url=>{
  calls.push(url);
  if(/\.(txt|xml)$/.test(url))throw Error('HTTP 404');
  if(url===base+'/old-one'||url===base+'/old-two')return{text:html+'<a href="child">Child</a>',url:base+'/new/',redirected:true};
  if(url===base+'/new/child')return{text:html,url};
  throw Error('Wrong relative URL: '+url);
 }});
 assert.equal(r.errors.length,0);assert.equal(r.scanned,3);assert.equal(r.items.length,2);
 const result=r.items.find(i=>i.url===base+'/new/');assert.ok(result);assert.equal(result.count,1);
 assert.deepEqual([...result.redirectedFrom].sort(),[base+'/old-one',base+'/old-two']);assert.equal(r.redirected,2);
 assert.ok(calls.includes(base+'/new/child'));assert.equal(calls.includes(base+'/child'),false);
});
test('redirects back to the live seed do not replace or duplicate its result',async()=>{
 const seed={...parse(html+'<a href="/old">Old</a>',base+'/'),source:'live',title:'Live title'};
 const r=await crawlSite(seed,options,{parse,parseMap,fetchText:async url=>{if(url===base+'/old')return{text:html,url:base+'/',redirected:true};throw Error('HTTP 404');}});
 assert.equal(r.scanned,1);assert.equal(r.items.length,1);assert.equal(r.items[0].title,'Live title');assert.equal(r.items[0].source,'live');
});
test('redirected robots and sitemap indexes resolve relative locations using the final URL',async()=>{
 const calls=[],seed=parse('',base+'/');
 const r=await crawlSite(seed,options,{parse,parseMap,fetchText:async url=>{
  calls.push(url);
  if(url===base+'/robots.txt')return{text:'Sitemap: first.xml',url:base+'/maps/robots.txt',redirected:true};
  if(url===base+'/maps/first.xml')return{text:'<sitemapindex><sitemap><loc>leaf.xml</loc></sitemap></sitemapindex>',url:base+'/maps/current/index.xml',redirected:true};
  if(url===base+'/maps/current/leaf.xml')return{text:'<urlset><url><loc>../../target</loc></url></urlset>',url};
  if(url===base+'/target')return{text:html,url};
  throw Error('HTTP 404');
 }});
 assert.equal(r.mapErrors.length,0);assert.deepEqual(r.items.map(i=>i.url),[base+'/target']);assert.ok(calls.includes(base+'/maps/current/leaf.xml'));
});
test('crawler does not search an external or excluded final destination returned by a transport',async()=>{
 for(const destination of ['https://external.test/page',base+'/logout',base+'/login?token=secret']){
  const r=await crawlSite(parse('<a href="/old">Old</a>',base+'/'),options,{parse,parseMap,fetchText:async url=>{if(url===base+'/old')return{text:html,url:destination,redirected:true};throw Error('HTTP 404');}});
  assert.equal(r.items.length,0);assert.equal(r.errors.length,1);assert.equal(r.errors[0].code,'REDIRECT_OUTSIDE_SCOPE');
 }
});
