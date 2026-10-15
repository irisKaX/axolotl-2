import test from 'node:test';
import assert from 'node:assert/strict';
import {fetchSearchText} from '../tools/web-search/network.js';
import {crawlSite} from '../tools/web-search/crawler.js';
const base='https://www.o2.cz';
const target='https://other.o2.cz/landing?token=TOP_SECRET&returnUrl=%2Fprivate#access_token=HASH_SECRET';
const seed={url:base+'/osobni/oneplay/sport',text:'Chance liga',references:[],links:[base+'/'],source:'live'};
test('refused redirect includes its redacted destination without consuming the body',async()=>{
 let read=false;
 await assert.rejects(fetchSearchText(base+'/',{fetchImpl:async()=>({url:target,ok:true,status:200,body:{cancel(){},getReader(){read=true;}}})}),e=>{
  assert.equal(e.code,'REDIRECT_OUTSIDE_SCOPE');assert.equal(e.finalUrl,'https://other.o2.cz/landing?token=[skryto]&returnUrl=[skryto]');assert.equal(e.redirectReason,'different-origin');return true;
 });assert.equal(read,false);
});
test('refusal differentiates a same-origin excluded URL from another host',async()=>{
 await assert.rejects(fetchSearchText(base+'/',{allowUrl:url=>url===base+'/',fetchImpl:async()=>({url:base+'/checkout?token=TOP_SECRET',body:{cancel(){}}})}),e=>{
  assert.equal(e.redirectReason,'excluded-url');assert.equal(e.finalUrl,base+'/checkout?token=[skryto]');return true;
 });
});
test('crawler preserves a rejected destination and exact rejection category',async()=>{
 const r=await crawlSite(seed,{kind:'phrase',scope:'site',query:'chance liga',maxPages:100},{fetchText:async url=>{
  if(/\.(xml|txt)$/.test(url))throw Error('HTTP 404');
  throw Object.assign(Error('Refused'),{code:'REDIRECT_OUTSIDE_SCOPE',finalUrl:'https://other.o2.cz/landing?token=[skryto]',redirectReason:'different-origin'});
 }});
 assert.equal(r.errors[0].finalUrl,'https://other.o2.cz/landing?token=[skryto]');assert.equal(r.errors[0].redirectReason,'different-origin');
});
test('diagnostic report includes search context and failures but no collected content or URL secrets',async()=>{
 const {buildSearchDiagnostics}=await import('../tools/web-search/diagnostics.js');
 const payload=JSON.parse(buildSearchDiagnostics({search:{url:base+'/sport?session=SESSION_SECRET',query:'chance liga',kind:'phrase',scope:'site',maxPages:300},result:{scanned:4,discovered:58,errors:[{url:base+'/',reason:'Refused',code:'REDIRECT_OUTSIDE_SCOPE',finalUrl:target}],items:[{matches:[{excerpt:'PRIVATE_CONTENT'}]}]}},{version:'2.4.4',userAgent:'Chrome test',now:'2026-10-09T14:00:00Z'}));
 assert.equal(payload.version,'2.4.4');assert.equal(payload.search.query,'chance liga');assert.equal(payload.summary.scanned,4);assert.equal(payload.failures[0].finalUrl,'https://other.o2.cz/landing?token=[skryto]&returnUrl=[skryto]');
 const json=JSON.stringify(payload);for(const s of ['TOP_SECRET','HASH_SECRET','SESSION_SECRET','PRIVATE_CONTENT'])assert.ok(!json.includes(s),s);
});
