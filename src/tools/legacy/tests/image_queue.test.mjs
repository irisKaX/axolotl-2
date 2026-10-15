import JSZip from 'jszip';
import test from 'node:test';import assert from 'node:assert/strict';import {existsSync} from 'node:fs';
const file=new URL('../tools/image-converter/queue.js',import.meta.url);
test('batch converter has an interruptible queue',()=>assert.ok(existsSync(file)));
if(existsSync(file)){
  const {ConversionQueue}=await import(file);
  const files=names=>names.map(name=>({name,size:20}));
  test('one broken image does not stop the batch and duplicate names stay distinct',async()=>{
    const q=new ConversionQueue(async file=>{if(file.name==='bad.jpg')throw new Error('Poškozený soubor');return {blob:new Blob(['webp']),width:2,height:2};});
    q.add(files(['a.jpg','bad.jpg','a.png']));await q.start();
    assert.deepEqual(q.items.map(r=>r.status),['done','error','done']);
    assert.deepEqual(q.items.map(r=>r.outputName),['a.webp','bad.webp','a-2.webp']);
    assert.match(q.items[1].error,/Poškozený/);
  });
  test('stopping preserves completed results and retries the interrupted image on continue',async()=>{
    let signalWorking;const working=new Promise(resolve=>signalWorking=resolve);let first=true;const calls=[];
    const q=new ConversionQueue(async(file,options,{signal})=>{
      calls.push(file.name);
      if(file.name==='b.png'&&first){first=false;signalWorking();await new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(new DOMException('Stop','AbortError')),{once:true}));}
      return {blob:new Blob(['data']),width:2,height:2};
    });
    q.add(files(['a.png','b.png','c.png']));const run=q.start();await working;await q.stop();await run;
    assert.deepEqual(q.items.map(r=>r.status),['done','pending','pending']);
    await q.start();assert.deepEqual(calls,['a.png','b.png','b.png','c.png']);
    assert.ok(q.items.every(r=>r.status==='done'));
  });
  test('clear and remove release files/results and new settings apply on reconversion',async()=>{
    const q=new ConversionQueue(async()=>({blob:new Blob(['ok']),width:1,height:1}));
    q.add(files(['a.jpg']));await q.start();assert.equal(q.items[0].options.lossless,true);
    await q.start({lossless:false,quality:90});assert.equal(q.items[0].options.lossless,false);
    q.remove(q.items[0].id);assert.equal(q.items.length,0);
    q.add(files(['b.png']));q.clear();assert.equal(q.items.length,0);
  });
}

test('renaming converted outputs changes ZIP names without changing image bytes or losing duplicates',async()=>{
  const {ConversionQueue}=await import('../tools/image-converter/queue.js');
  const {buildZip}=await import('../tools/image-converter/zip.js');
  const q=new ConversionQueue(async()=>({blob:new Blob(['converted']),width:1,height:1}));
  q.add([{name:'original.png',size:12},{name:'other.png',size:12}]);await q.start();
  assert.equal(typeof q.rename,'function','Converted files need a rename operation');
  const original=q.items[0].file,result=q.items[0].result;
  assert.equal(q.rename(q.items[0].id,'Náhled.jpg'),'Náhled.webp');
  assert.equal(q.rename(q.items[1].id,'náhled.png'),'náhled-2.webp');
  assert.throws(()=>q.rename(q.items[0].id,'   '));
  assert.equal(q.items[0].file,original);assert.equal(q.items[0].result,result);
  const zip=await JSZip.loadAsync(await (await buildZip(q.items)).arrayBuffer());
  assert.deepEqual(Object.keys(zip.files),['Náhled.webp','náhled-2.webp']);
  assert.equal(await zip.file('Náhled.webp').async('string'),'converted');
  await q.start();assert.equal(q.items[0].outputName,'Náhled.webp');
});
