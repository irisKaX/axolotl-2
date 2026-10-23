import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {collectSearchPage} from '../../../../browser-extension/tools/web-search/collect.js';
import {searchSnapshot,validateOptions} from '../tools/web-search/model.js';
import {crawlSite} from '../tools/web-search/crawler.js';

const base='https://example.test';
function collect(html,url=base+'/',live=false){
 const w=new JSDOM(live?html:'',{url,runScripts:'outside-only'}).window;
 try{return w.eval('('+collectSearchPage.toString()+')')(live?{}:{html,url});}finally{w.close();}
}
const options=extra=>validateOptions({query:'Chance liga',scope:'site',...extra});
const find=(html,extra={},live=false)=>searchSnapshot(collect(html,base+'/',live),options(extra));
const menu='<header class="o3-v1-header"><nav><a href="/fotbal">Chance liga</a></nav></header>';

test('phrase modes distinguish visible, hidden text, and source attributes/data',()=>{
 const html='<main><p>Viditelný text</p><p hidden>Chance liga</p><script>const sport="Chance liga";</script><img alt="Chance liga"></main>';
 for(const live of [false,true]){
  assert.equal(find(html,{},live).count,0);
  assert.equal(find(html,{phraseSource:'text'},live).count,1);
  assert.equal(find(html,{phraseSource:'html'},live).count,3);
 }
});
test('shared header matches are separated while real article and local navigation matches stay on page',()=>{
 const r=find(menu+'<main><article><header>Chance liga</header></article><nav>Chance liga</nav></main>');
 assert.equal(r.count,2);
 assert.equal(r.components.length,1);
 assert.equal(r.components[0].count,1);
 assert.equal(r.components[0].label,'Hlavička a menu');
 assert.equal(find(menu,{sharedComponents:'exclude'}).components.length,0);
 assert.equal(find(menu,{sharedComponents:'include'}).count,1);
});
test('separation works in HTML mode without losing metadata or including menu twice',()=>{
 const r=find('<meta content="Chance liga">'+menu+'<main><img alt="Chance liga"></main>',{phraseSource:'html'});
 assert.equal(r.count,2);
 assert.equal(r.components.length,1);
 assert.equal(r.components[0].count,1);
});
test('hidden menu still groups in hidden-text mode and link discovery is unaffected',()=>{
 const html='<header hidden><a href="/fotbal">Chance liga</a></header><main>Other</main>';
 assert.equal(find(html).components.length,0);
 assert.equal(find(html,{phraseSource:'text'}).components[0].count,1);
 assert.ok(collect(html).links.includes(base+'/fotbal'));
});
test('wrappers around main content and local article headers are not treated as shared chrome',()=>{
 const r=find('<header><main><article><header>Chance liga</header></article></main></header>');
 assert.equal(r.count,1);assert.equal(r.components.length,0);
});
test('same shared component is counted once across URLs, unequal content remains separate',async()=>{
 const html=menu+'<a href="/other">Other</a><a href="/variant">Variant</a>';
 const seed=collect(html);
 const result=await crawlSite(seed,options(),{parse:collect,fetchText:async url=>{
  if(url===base+'/other')return {text:menu+'<main>Chance liga article</main>'};
  if(url===base+'/variant')return {text:menu.replace('Chance liga','Chance liga extra')};
  throw Error('HTTP 404');
 }});
 assert.deepEqual(result.items.map(x=>x.url),[base+'/other']);
 assert.equal(result.components.length,2);
 assert.equal(result.components[0].pages.length,2);
 assert.deepEqual(result.components[0].pages.map(x=>x.url).sort(),[base+'/',base+'/other']);
 assert.equal(result.components[0].count,1);
});
test('pending HTTP seed is actually fetched and never counted as a scanned empty page',async()=>{
 const calls=[];
 const result=await crawlSite({url:base+'/start',source:'fetch-pending'},options(),{parse:collect,fetchText:async url=>{
  calls.push(url);if(url===base+'/start')return {text:'<main>Chance liga</main>'};throw Error('HTTP 404');
 }});
 assert.ok(calls.includes(base+'/start'));
 assert.equal(result.scanned,1);
 assert.equal(result.items[0].url,base+'/start');
 assert.equal(result.attempted,result.scanned+result.errors.length);
});
test('failed pending seed reports failure instead of a successful scan',async()=>{
 const result=await crawlSite({url:base+'/start',source:'fetch-pending'},options(),{fetchText:async()=>{throw Error('HTTP 403');}});
 assert.equal(result.scanned,0);
 assert.ok(result.errors.some(x=>x.url===base+'/start'));
});
test('same-document anchor links do not split an otherwise identical shared menu by page URL',()=>{
 const html='<header><a href="#sport">Chance liga</a></header>';
 const first=searchSnapshot(collect(html,base+'/one'),options());
 const second=searchSnapshot(collect(html,base+'/two'),options());
 assert.equal(first.components[0].id,second.components[0].id);
});
test('HTML mode includes open shadow markup without duplicating slotted source nodes',()=>{
 const w=new JSDOM('<div id="host"><p>Slotted phrase</p></div>',{url:base,runScripts:'outside-only'}).window;
 try{
  w.document.querySelector('#host').attachShadow({mode:'open'}).innerHTML='<main data-note="Chance liga"><slot></slot></main>';
  const snapshot=w.eval('('+collectSearchPage.toString()+')')();
  assert.equal(searchSnapshot(snapshot,options({phraseSource:'html'})).count,1);
  assert.equal(searchSnapshot(snapshot,options({phraseSource:'html',query:'Slotted phrase'})).count,1);
 }finally{w.close();}
});
test('pending source is fetched before maps so discovery cannot consume its entire time budget',async()=>{
 const calls=[];
 const result=await crawlSite({url:base+'/start',source:'fetch-pending'},options(),{parse:collect,deadlineMs:30,fetchText:async(url,{signal})=>{
  calls.push(url);if(url===base+'/start')return {text:'<main>Chance liga</main>'};
  await new Promise(resolve=>signal.addEventListener('abort',resolve,{once:true}));throw Error('stopped');
 }});
 assert.equal(calls[0],base+'/start');assert.equal(result.scanned,1);assert.equal(result.cancelled,false);assert.match(result.limit,/Časový limit/);
});
test('slotted source content belongs to its shared shadow component in HTML mode',()=>{
 const w=new JSDOM('<div id="host"><p>Chance liga</p></div>',{url:base,runScripts:'outside-only'}).window;
 try{
  w.document.querySelector('#host').attachShadow({mode:'open'}).innerHTML='<header><slot></slot></header>';
  const snapshot=w.eval('('+collectSearchPage.toString()+')')();
  const separate=searchSnapshot(snapshot,options({phraseSource:'html'}));
  assert.equal(separate.count,0);assert.equal(separate.components[0].count,1);
  assert.equal(searchSnapshot(snapshot,options({phraseSource:'html',sharedComponents:'exclude'})).count,0);
 }finally{w.close();}
});
