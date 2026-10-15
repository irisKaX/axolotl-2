import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {collectSearchPage} from '../tools/web-search/collect.js';
import {searchSnapshot,validateOptions} from '../tools/web-search/model.js';
import {connectionError} from '../../../../browser-extension/background/page-errors.js';
const url='https://www.o2.cz/osobni/volani/datamanie';
function scan(html,live=false){
 const w=new JSDOM(live?html:'',{url,runScripts:'outside-only'}).window;
 const result=w.eval('('+collectSearchPage.toString()+')')(live?{}:{html,url});w.close();return result;
}
const find=(snapshot,id)=>searchSnapshot(snapshot,validateOptions({kind:'asset',query:id}));

test('O2 component IDs and JSON-LD image assets are searchable in live and fetched HTML',()=>{
 // Representative markup from the public Datamanie page, 2026-10-09.
 const html='<meta name="lbxid" content="a20892a256125"><div id="tariff-a341191"></div><div id="m-faq-a260987"></div><script type="application/ld+json">{"image":"https://www.o2.cz/osobni/-a377177?field=data&amp;_linka=a1388149"}</script>';
 for(const live of [false,true]){
  const s=scan(html,live);
  for(const id of ['a20892','a256125','a341191','a260987','a377177','a1388149'])assert.ok(find(s,id).count>0,`${id}, live=${live}`);
  assert.equal(find(s,'a34119').count,0);
 }
});
test('templates, noscript, stylesheet URLs and script src retain asset evidence without phrase text',()=>{
 const html='<template><img src="/a101.webp"><p>Secret phrase</p></template><noscript><img src="/a102.webp"></noscript><style>.example{background:url("/a103.webp")}</style><script src="/a104.js"></script><a href="#faq-a105">Open</a>';
 for(const live of [false,true]){
  const s=scan(html,live);
  for(const id of ['a101','a102','a103','a104','a105'])assert.ok(find(s,id).count>0,`${id}, live=${live}`);
  assert.equal(searchSnapshot(s,validateOptions({query:'Secret phrase'})).count,0);
 }
});
test('large JSON data is inspected as values and evidence includes the matched ID',()=>{
 const value={padding:'x'.repeat(10000),nested:{image:'/a888.webp'}};
 const s=scan('<script type="application/json">'+JSON.stringify(value)+'</script><div data-config="'+(' '.repeat(700)+'a889')+'"></div>');
 assert.ok(find(s,'a888').count>0);
 assert.match(find(s,'a889').matches[0].excerpt,/a889/);
});
test('JavaScript initialization failures must not be reported as host permission failures',()=>{
 assert.notEqual(connectionError(new ReferenceError("Cannot access 'value' before initialization")).code,'ACCESS_DENIED');
 for(const message of ['Cannot access contents of url "https://www.o2.cz/". Extension manifest must request permission to access this host.','Missing host permission for the tab','Cannot access a chrome:// URL'])assert.equal(connectionError(Error(message)).code,'ACCESS_DENIED');
});
