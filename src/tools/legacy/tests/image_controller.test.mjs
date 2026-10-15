import test from 'node:test';
import assert from 'node:assert/strict';
import { ImagesController } from '../tools/image-download/controller.js';
const items=[{url:'https://site.test/a.png',name:'a.png',format:'png',width:100,height:100},{url:'https://site.test/b.webp',name:'b.webp',format:'webp',width:10,height:10}];
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
function setup(request=async()=>({items}),deps={}){const locks=new Set();const app={request,ensureTarget(){},lock:id=>{assert.equal(locks.size,0);locks.add(id);},unlock:id=>locks.delete(id)};return {locks,controller:new ImagesController(app,deps)};}
test('scan keeps results and selected files on failed refresh, then clears on a new target',async()=>{
 let fail=false;const {controller:c,locks}=setup(async()=>{if(fail)throw Error('Offline');return {items,truncated:true};});
 await c.scan();c.selectAll(true);fail=true;await c.scan();assert.equal(c.getSnapshot().selected.size,2);assert.equal(c.getSnapshot().truncated,true);assert.match(c.getSnapshot().message.text,/Offline/);assert.equal(locks.size,0);
 c.onTargetChange();assert.equal(c.getSnapshot().items.length,0);assert.equal(c.getSnapshot().selected.size,0);c.destroy();
});
test('late scan after target change never restores old results or unlocks another operation',async()=>{
 const late=deferred();const {controller:c,locks}=setup(()=>late.promise);const scan=c.scan();c.onTargetChange();late.resolve({items});await scan;
 assert.equal(c.getSnapshot().items.length,0);assert.equal(c.getSnapshot().scanned,false);assert.equal(locks.size,0);c.destroy();
});
test('filtered select all retains hidden selection and renames immutably',async()=>{
 const {controller:c}=setup();await c.scan();c.setFilters({format:'png'});c.selectAll(true);assert.deepEqual([...c.getSnapshot().selected],[items[0].url]);
 c.setFilters({format:'webp'});c.selectAll(true);assert.equal(c.getSnapshot().selected.size,2);
 const old=c.getSnapshot();c.rename(items[0].url,'Český banner.png');assert.equal(old.items[0].name,'a.png');assert.equal(c.getSnapshot().items[0].outputName,'Český banner.png');
 assert.throws(()=>c.rename(items[0].url,''),/název/i);c.clearSelection();assert.equal(c.getSnapshot().selected.size,0);c.destroy();
});
test('cancel aborts fetch and prevents late archive from downloading',async()=>{
 const late=deferred();let signal,saves=0;const {controller:c,locks}=setup(undefined,{archive:async(chosen,options)=>{signal=options.signal;return late.promise;},save:async()=>saves++});
 await c.scan();c.selectAll(true);const run=c.download();c.cancel();assert.equal(signal.aborted,true);late.resolve({blob:new Blob(['zip']),succeeded:2,failures:[]});await run;
 assert.equal(saves,0);assert.equal(locks.size,0);c.destroy();
});
test('partial archive failure preserves item errors and passes the successful archive once',async()=>{
 let saves=0;const {controller:c}=setup(undefined,{archive:async(chosen,{onProgress})=>{onProgress({item:chosen[1],ok:false,reason:'Not found',completed:2,total:2});return {blob:new Blob(['zip']),succeeded:1,failures:[{}]};},save:async()=>saves++});
 await c.scan();c.selectAll(true);await c.download();assert.equal(saves,1);assert.equal(c.getSnapshot().states.get(items[1].url).error,true);assert.match(c.getSnapshot().downloadStatus.text,/1 souborů/);c.destroy();
});
test('empty scan is a completed state, unsafe URLs are removed, and destroy blocks late exports',async()=>{
 const {controller:c}=setup(async()=>({items:[{url:'javascript:alert(1)'}]}));await c.scan();assert.equal(c.getSnapshot().scanned,true);assert.equal(c.getSnapshot().items.length,0);c.destroy();
 const late=deferred();let saves=0;const {controller:d}=setup(undefined,{fetch:()=>late.promise,save:()=>saves++});await d.scan();const run=d.download(items[0].url);d.destroy();late.resolve(new Blob(['png']));await run;assert.equal(saves,0);
});

test('metadata enriches responsive originals incrementally without blocking selection and ignores old targets',async()=>{
 let update,signal,finish;
 const source=[{url:'https://cdn.test/asset/12ab',name:'12ab',format:'unknown',width:0,height:0}];
 const {controller:c}=setup(async()=>({items:source}),{metadata:async(items,options)=>{update=options.onUpdate;signal=options.signal;await new Promise(resolve=>finish=resolve);}});
 await c.scan();assert.equal(c.getSnapshot().running,false);assert.equal(c.getSnapshot().metadataPending,true);c.select(source[0].url,true);
 update(source[0].url,{width:801,height:401,format:'webp'});
 assert.equal(c.getSnapshot().items[0].width,801);assert.equal(c.getSnapshot().items[0].format,'webp');assert.equal(c.getSnapshot().selected.size,1);
 c.onTargetChange();assert.equal(signal.aborted,true);update(source[0].url,{width:9,height:9});finish();await Promise.resolve();
 assert.equal(c.getSnapshot().items.length,0);assert.equal(c.getSnapshot().metadataPending,false);c.destroy();
});

test('plain preview dimensions repair unresolved CSS and responsive URLs without overwriting original headers',async()=>{
 const source=[{url:'https://cdn.test/banner.svg',name:'banner',format:'svg',width:0,height:0}];
 const {controller:c}=setup(async()=>({items:source}),{metadata:async()=>{}});await c.scan();
 c.recordDimensions(source[0].url,1200,600,c.getSnapshot().scanRevision);assert.equal(c.getSnapshot().items[0].width,1200);
 c.recordDimensions(source[0].url,400,200);assert.equal(c.getSnapshot().items[0].width,1200);
 c.recordDimensions(source[0].url,0,0);assert.equal(c.getSnapshot().items[0].height,600);c.destroy();
});

test('canceled Save As keeps selection, passes abort signal and never announces successful download',async()=>{
 let saveSignal;
 const {controller:c,locks}=setup(undefined,{fetch:async()=>new Blob(['image'],{type:'image/png'}),save:async(blob,name,{signal})=>{saveSignal=signal;throw Object.assign(new Error('USER_CANCELED'),{name:'AbortError',code:'USER_CANCELED'});}});
 await c.scan();c.select(items[0].url,true);await c.download(items[0].url);
 assert.ok(saveSignal instanceof AbortSignal);assert.equal(c.getSnapshot().downloadStatus.kind,'info');assert.match(c.getSnapshot().downloadStatus.text,/zrušeno/);assert.equal(c.getSnapshot().states.get(items[0].url).complete,undefined);assert.equal(c.getSnapshot().selected.size,1);assert.equal(c.getSnapshot().running,false);assert.equal(locks.size,0);c.destroy();
});

test('download stays active until the save completion event and a new target unlocks immediately',async()=>{
 const saved=deferred();let saving;
 const {controller:c,locks}=setup(undefined,{fetch:async()=>new Blob(['image']),save:async(blob,name,{signal})=>{saving=signal;return saved.promise;}});
 await c.scan();const running=c.download(items[0].url);await Promise.resolve();await Promise.resolve();
 assert.equal(c.getSnapshot().running,true);assert.equal(c.getSnapshot().downloadStage,'save');assert.notEqual(c.getSnapshot().downloadStatus.kind,'success');
 c.onTargetChange();assert.equal(saving.aborted,true);assert.equal(locks.size,0);assert.equal(c.getSnapshot().running,false);
 saved.resolve({id:3,state:'complete'});await running;assert.equal(c.getSnapshot().downloadStatus,null);c.destroy();
});

test('late metadata and preview dimensions clamp pagination as active filters shrink',async()=>{
 const source=Array.from({length:51},(_,index)=>({url:'https://cdn.test/asset/'+index,name:String(index),format:'unknown',width:0,height:0}));
 const late=deferred();let update;
 const {controller:c}=setup(async()=>({items:source}),{metadata:async(items,{onUpdate})=>{update=onUpdate;return late.promise;}});
 await c.scan();c.setFilters({format:'unknown'});c.setPage(1);assert.equal(c.getSnapshot().page,1);
 for(const item of source.slice(0,3))update(item.url,{format:'png',width:800,height:400});
 assert.equal(c.filtered().length,48);assert.equal(c.getSnapshot().page,0);
 c.setFilters({format:'',minWidth:100});c.setPage(1);assert.equal(c.getSnapshot().page,1);
 for(const item of source.slice(3,6))c.recordDimensions(item.url,32,24);
 assert.equal(c.filtered().length,48);assert.equal(c.getSnapshot().page,0);late.resolve();c.destroy();
});
