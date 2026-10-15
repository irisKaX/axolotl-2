import test from 'node:test';
import assert from 'node:assert/strict';
import { ScreenshotController, screenshotActivity } from '../tools/screenshot/controller.js';
const deferred=()=>{let resolve,reject;const promise=new Promise((r,j)=>{resolve=r;reject=j;});return {promise,resolve,reject};};
const shot={blob:new Blob(['png'],{type:'image/png'}),width:100,height:100};
function fixture(takeImage,download){const locks=new Set(),calls=[];const app={target:()=>({url:'https://source.test/'}),ensureTarget(){},lock:id=>{assert.equal(locks.size,0);locks.add(id);},unlock:id=>locks.delete(id),toast(){},run:fn=>fn(),request:async(type,payload)=>{calls.push({type,payload});return {};}};return {app,locks,calls,tool:new ScreenshotController(app,{captureImage:takeImage,saveDownload:download|| (async(blob,name,options)=>{calls.push({blob,name,options});return {id:1,state:'complete'};})})};}
test('screenshot retains actual result through exports and restores original after crop',async()=>{
 const f=fixture(async()=>shot);await f.tool.capture('full');const original=f.tool.getSnapshot().result;
 f.tool.applyCrop({...shot,width:40},original);assert.equal(f.tool.getSnapshot().result.width,40);
 await f.tool.save();assert.match(f.calls.at(-1).name,/^O2-Axolotl\/o2-full-orez/);
 f.tool.restore();assert.equal(f.tool.getSnapshot().result,original);assert.equal(f.locks.size,0);
 f.tool.destroy();assert.equal(f.tool.getSnapshot().result,null);
});
test('cancelled capture cannot overwrite an existing result after its promise resolves',async()=>{
 const pending=deferred();let count=0;const f=fixture(()=>++count===1?shot:pending.promise);
 await f.tool.capture('visible');const first=f.tool.getSnapshot().result;
 const run=f.tool.capture('full');await f.tool.cancel();pending.resolve({...shot,width:500});await run;
 assert.equal(f.tool.getSnapshot().result,first);assert.equal(f.locks.size,0);f.tool.destroy();
});
test('late selection-start failure cannot release a subsequent capture lock',async()=>{
 const start=deferred(),capture=deferred();const f=fixture(()=>capture.promise);
 f.app.request=type=>type==='PICK_START'?start.promise:Promise.resolve({});
 const selection=f.tool.selectElement();await f.tool.cancel();const run=f.tool.capture('visible');
 start.resolve({});await selection;assert.equal(f.locks.size,1);
 capture.resolve(shot);await run;assert.equal(f.locks.size,0);f.tool.destroy();
});
test('destroying during capture releases ownership and blocks later previews',async()=>{
 const pending=deferred();const f=fixture(()=>pending.promise);const run=f.tool.capture('full');
 f.tool.destroy();pending.resolve(shot);await run;assert.equal(f.tool.getSnapshot().result,null);assert.equal(f.locks.size,0);
});

test('screenshot activity waits for browser completion before returning to idle',async()=>{
 const pending=deferred();let saved;
 const f=fixture(async()=>shot,(blob,name,options)=>{saved={blob,name,...options};return pending.promise;});
 assert.equal(screenshotActivity(f.tool.getSnapshot()).phase,'idle');
 await f.tool.capture('visible');assert.equal(screenshotActivity(f.tool.getSnapshot()).phase,'ready');
 const work=f.tool.save();
 assert.equal(screenshotActivity(f.tool.getSnapshot()).phase,'download');
 assert.equal(f.tool.getSnapshot().exporting,true);
 assert.equal(saved.blob,shot.blob);assert.ok(saved.signal instanceof AbortSignal);
 await Promise.resolve();assert.equal(f.tool.getSnapshot().downloaded,false);
 pending.resolve({id:42,state:'complete'});await work;
 assert.equal(f.tool.getSnapshot().exporting,false);
 assert.equal(screenshotActivity(f.tool.getSnapshot()).phase,'idle');
 assert.equal(f.tool.getSnapshot().message.text,'PNG bylo předáno prohlížeči ke stažení.');
 assert.ok(f.tool.getSnapshot().result,'completed download retains useful preview');f.tool.destroy();
});

test('cancelled screenshot download stays ready and a later retry may complete',async()=>{
 let attempt=0;const f=fixture(async()=>shot,async()=>{
  if(!attempt++)throw Object.assign(new Error('cancelled'),{name:'AbortError',code:'USER_CANCELED'});
  return {id:2,state:'complete'};
 });
 await f.tool.capture('full');await f.tool.save();
 assert.equal(screenshotActivity(f.tool.getSnapshot()).phase,'ready');
 assert.equal(f.tool.getSnapshot().message.kind,'info');
 await f.tool.save();assert.equal(screenshotActivity(f.tool.getSnapshot()).phase,'idle');f.tool.destroy();
});

test('destroying a screenshot export aborts its download and ignores late completion',async()=>{
 const pending=deferred();let signal;const f=fixture(async()=>shot,(_blob,_name,options)=>{signal=options.signal;return pending.promise;});
 await f.tool.capture('visible');const work=f.tool.save();f.tool.destroy();
 assert.equal(signal.aborted,true);pending.resolve({id:3,state:'complete'});await work;
 assert.equal(f.tool.getSnapshot().result,null);assert.equal(f.tool.getSnapshot().downloaded,false);
});

test('element selection activity returns to the initial wait after cancellation',async()=>{
 const f=fixture(async()=>shot);await f.tool.selectElement();
 assert.match(screenshotActivity(f.tool.getSnapshot()).label,/označení prvku/);
 await f.tool.cancel();assert.equal(screenshotActivity(f.tool.getSnapshot()).phase,'idle');f.tool.destroy();
});

test('screenshot copy tracks clipboard completion separately from a file download',async()=>{
 const clipboard=deferred(),previousNavigator=Object.getOwnPropertyDescriptor(globalThis,'navigator'),previousItem=globalThis.ClipboardItem;
 Object.defineProperty(globalThis,'navigator',{configurable:true,value:{clipboard:{write:()=>clipboard.promise}}});
 globalThis.ClipboardItem=class{constructor(data){this.data=data;}};
 const f=fixture(async()=>shot,()=>assert.fail('copy must not download a file'));
 try{
  await f.tool.capture('visible');const work=f.tool.copy();
  assert.equal(screenshotActivity(f.tool.getSnapshot()).phase,'working');
  assert.match(screenshotActivity(f.tool.getSnapshot()).label,/Kopíruji/);
  clipboard.resolve();await work;
  assert.equal(screenshotActivity(f.tool.getSnapshot()).phase,'ready');
  assert.equal(f.tool.getSnapshot().downloaded,false);
  assert.match(f.tool.getSnapshot().message.text,/zkopírovaný/);
 }finally{
  f.tool.destroy();
  if(previousNavigator)Object.defineProperty(globalThis,'navigator',previousNavigator);else delete globalThis.navigator;
  if(previousItem===undefined)delete globalThis.ClipboardItem;else globalThis.ClipboardItem=previousItem;
 }
});
