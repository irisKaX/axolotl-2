import test from 'node:test';import assert from 'node:assert/strict';
import {SearchController} from '../tools/web-search/controller.js';
function setup(crawl){const calls=[],pending=[],locks=new Set();let target={id:1,url:'https://example.test/'};const app={target:()=>target,ensureTarget(){},lock(id){if(locks.size)throw Error('Busy');locks.add(id);},unlock(id){locks.delete(id);},request(type,payload){calls.push({type,payload});if(type==='AUDIT_CANCEL')return Promise.resolve({});return new Promise((resolve,reject)=>pending.push({resolve,reject}));}};const c=new SearchController(app,{...(crawl?{crawl}:{}),hasSiteAccess:async()=>true});return{c,calls,pending,locks,app,setTarget(next){target=next;}};}
const snapshot={url:'https://example.test/',title:'Example',text:'Hello world',references:[{attribute:'src',value:'/a123.png',tag:'img'}],links:[],source:'live'};
test('both modes use page scope and invalid input makes no request',async()=>{
 const t=setup();await t.c.search();assert.equal(t.calls.length,0);assert.match(t.c.state.message.text,/Zadejte/);
 t.c.setForm({query:'Hello'});let p=t.c.search();t.pending[0].resolve(snapshot);await p;assert.equal(t.c.state.result.items[0].count,1);assert.equal(t.locks.size,0);
 t.c.setForm({kind:'asset',query:'a123'});p=t.c.search();t.pending[1].resolve(snapshot);await p;assert.equal(t.c.state.result.items[0].matches[0].attribute,'src');t.c.destroy();
});
test('cancel returns promptly, releases lock and stale response cannot overwrite a newer search',async()=>{
 const t=setup();t.c.setForm({query:'Hello'});const old=t.c.search();t.c.cancel();await old;assert.equal(t.locks.size,0);
 const next=t.c.search();t.pending[1].resolve({...snapshot,title:'New'});await next;t.pending[0].resolve({...snapshot,title:'Old'});await Promise.resolve();
 assert.equal(t.c.state.result.items[0].title,'New');assert.ok(t.calls.some(c=>c.type==='AUDIT_CANCEL'));t.c.destroy();
});
test('site mode receives selected type and retains progressive results after stop',async()=>{
 let finish;const t=setup(async(seed,opts,{onProgress,signal})=>{assert.equal(opts.kind,'asset');onProgress({items:[{url:seed.url,count:1}],scanned:1});await new Promise(r=>{finish=r;signal.addEventListener('abort',r,{once:true});});return{items:[],scanned:0};});
 t.c.setForm({kind:'asset',query:'a123',scope:'site'});const p=t.c.search();await new Promise(r=>setImmediate(r));t.pending[0].resolve(snapshot);await new Promise(r=>setImmediate(r));t.c.cancel();await p;
 assert.equal(t.c.state.result.items.length,1);assert.equal(t.c.state.result.cancelled,true);assert.equal(t.locks.size,0);finish();t.c.destroy();
});
test('site search requires host access before collection or crawling, even if the active tab is readable',async()=>{
 const t=setup();let permission=false,checked;
 t.c.hasSiteAccess=async url=>{checked=url;return permission;};
 t.c.setForm({query:'Hello',scope:'site'});const blocked=t.c.search();await new Promise(r=>setImmediate(r));if(t.pending[0])t.pending[0].reject(Error('Collection ran before checking permission'));await blocked;
 assert.equal(checked,snapshot.url);assert.equal(t.calls.length,0);assert.equal(t.c.state.access?.url,snapshot.url);assert.equal(t.locks.size,0);
 assert.match(t.c.state.message.text,/celém webu/);
 permission=true;t.c.crawl=async()=>({items:[{count:1}],scanned:1});
 const run=t.c.search();await new Promise(r=>setImmediate(r));t.pending[0].resolve(snapshot);await run;assert.equal(t.c.state.result.scanned,1);t.c.destroy();
});
test('cancel while checking host access cannot start a late collection',async()=>{
 const t=setup();let resolve;
 t.c.hasSiteAccess=()=>new Promise(r=>resolve=r);t.c.setForm({query:'Hello',scope:'site'});
 const run=t.c.search();t.c.cancel();resolve?.(true);await run;
 assert.equal(t.calls.some(c=>c.type==='SEARCH_SCAN'),false);assert.equal(t.locks.size,0);t.c.destroy();
});
test('source change clears completed results and destruction ignores late notifications',async()=>{
 const t=setup();t.c.setForm({query:'Hello'});let p=t.c.search();t.pending[0].resolve(snapshot);await p;t.c.onTargetChange();assert.equal(t.c.state.result,null);
 p=t.c.search();t.c.destroy();t.pending[1].resolve(snapshot);await p;assert.equal(t.locks.size,0);assert.equal(t.c.state.result,null);
});
test('denied page access rechecks source-host access through the companion before retrying',async()=>{
 const t=setup();t.c.hasSiteAccess=url=>t.app.request('SITE_ACCESS',{url});t.c.setForm({query:'Hello'});
 const run=t.c.search();t.pending[0].reject(Object.assign(Error('Blocked'),{code:'ACCESS_DENIED',detail:'Missing host permission'}));await run;
 assert.equal(t.c.state.access?.url,snapshot.url);assert.equal(t.c.state.message.detail,'Missing host permission');
 const recovery=t.c.grantAccess();
 assert.deepEqual(t.calls.at(-1),{type:'SITE_ACCESS',payload:{url:snapshot.url}});
 assert.equal(t.c.state.accessPending,true);assert.equal(t.calls.filter(c=>c.type==='SEARCH_SCAN').length,1);
 t.pending[1].resolve(true);await new Promise(r=>setImmediate(r));
 t.pending[2].resolve(snapshot);await recovery;
 assert.equal(t.c.state.result.items[0].count,1);assert.equal(t.c.state.access,null);assert.equal(t.c.state.accessPending,false);t.c.destroy();
});
for(const allowed of [false,undefined,{allowed:true}])test('access recheck requires literal true and never scans when it receives '+JSON.stringify(allowed),async()=>{
 const t=setup();t.c.setForm({query:'Hello'});const run=t.c.search();
 t.pending[0].reject(Object.assign(Error('Blocked'),{code:'ACCESS_DENIED'}));await run;
 t.c.hasSiteAccess=url=>t.app.request('SITE_ACCESS',{url});
 const recovery=t.c.grantAccess();t.pending[1].resolve(allowed);await recovery;
 assert.equal(t.calls.filter(c=>c.type==='SEARCH_SCAN').length,1);assert.equal(t.c.state.accessPending,false);
 assert.equal(t.c.state.access?.url,snapshot.url);assert.match(t.c.state.message.text,/povolte přístup/);t.c.destroy();
});
for(const change of ['same-url target change','different tab with the same URL','different URL','destroy'])test('a stale access recheck cannot scan after '+change,async()=>{
 const t=setup();t.c.setForm({query:'Hello'});const run=t.c.search();
 t.pending[0].reject(Object.assign(Error('Blocked'),{code:'ACCESS_DENIED'}));await run;
 t.c.hasSiteAccess=url=>t.app.request('SITE_ACCESS',{url});
 const recovery=t.c.grantAccess();
 if(change==='same-url target change')t.c.onTargetChange();
 if(change==='different tab with the same URL')t.setTarget({id:2,url:snapshot.url});
 if(change==='different URL')t.setTarget({id:1,url:'https://other.test/'});
 if(change==='destroy')t.c.destroy();
 t.pending[1].resolve(true);await new Promise(r=>setImmediate(r));
 const scans=t.calls.filter(c=>c.type==='SEARCH_SCAN').length;
 t.c.destroy();await recovery;
 assert.equal(scans,1);assert.equal(t.c.state.accessPending,false);assert.equal(t.c.state.result,null);
});
