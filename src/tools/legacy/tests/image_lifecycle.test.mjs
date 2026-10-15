import JSZip from 'jszip';
import test from 'node:test';import assert from 'node:assert/strict';
import {ConverterClient} from '../tools/image-converter/client.js';
import {buildZip} from '../tools/image-converter/zip.js';
import {ConversionQueue} from '../tools/image-converter/queue.js';

test('Stop terminates the pending worker immediately and a later image uses a new worker',async()=>{
  const workers=[];
  const client=new ConverterClient(()=>{const worker={terminated:false,postMessage(m){this.message=m;},terminate(){this.terminated=true;}};workers.push(worker);return worker;});
  const abort=new AbortController();const reading=client.convert({name:'a.png'},{},{signal:abort.signal});abort.abort();
  await assert.rejects(reading,{name:'AbortError'});assert.equal(workers[0].terminated,true);
  const next=client.convert({name:'b.png'},{});
  workers[1].onmessage({data:{id:workers[1].message.id,result:{buffer:new Uint8Array([1,2,3]).buffer,width:1,height:1}}});
  const result=await next;assert.equal(result.blob.size,3);assert.equal('buffer' in result,false);client.close();
});
test('worker error is recoverable and does not leave the next conversion blocked',async()=>{
  const workers=[];const client=new ConverterClient(()=>{const w={postMessage(m){this.message=m;},terminate(){this.terminated=true;}};workers.push(w);return w;});
  const result=client.convert({},{});workers[0].onerror({preventDefault(){}});
  await assert.rejects(result,/Převod selhal/);assert.equal(workers[0].terminated,true);
  const next=client.convert({},{});assert.equal(workers.length,2);client.close();await assert.rejects(next,{name:'AbortError'});
});
test('batch refuses excess input without discarding accepted files',()=>{
  const q=new ConversionQueue(()=>{});
  const errors=q.add(Array.from({length:6},(_,i)=>({name:i+'.png',size:50*1024*1024})));
  assert.equal(q.items.length,5);assert.equal(errors.length,1);assert.match(errors[0],/250 MB/);
  assert.equal(q.add([{name:'empty.png',size:0}]).length,1);assert.equal(q.items.length,5);
});
test('ZIP contains successful results only and keeps Unicode names',async()=>{
  const blob=await buildZip([{status:'done',outputName:'Žlutý.webp',result:{blob:new Blob(['image'])}},{status:'error',outputName:'bad.webp'}]);
  const zip=await JSZip.loadAsync(await blob.arrayBuffer());
  assert.deepEqual(Object.keys(zip.files),['Žlutý.webp']);assert.equal(await zip.file('Žlutý.webp').async('string'),'image');
  await assert.rejects(buildZip([]),/Nejdříve/);
});

test('Chrome receives a local Blob download and the URL is released on completion',async()=>{
  const {saveBlob}=await import('../tools/image-converter/download.js');
  let handler,call;const original=globalThis.chrome;
  globalThis.chrome={downloads:{onChanged:{addListener(fn){handler=fn;},removeListener(fn){if(handler===fn)handler=null;}},async download(value){call=value;return 42;}}};
  try{
    let settled=false;const pending=saveBlob(new Blob(['webp']),'image.webp').then(value=>{settled=true;return value;});
    await new Promise(resolve=>setImmediate(resolve));
    assert.equal(settled,false,'download acceptance must not report completion');
    assert.equal(call.filename,'O2-Axolotl/WebP/image.webp');assert.equal(call.saveAs,true);assert.match(call.url,/^blob:/);
    assert.equal(await (await fetch(call.url)).text(),'webp');
    handler({id:42,state:{current:'complete'}});assert.deepEqual(await pending,{id:42,state:'complete'});assert.equal(handler,null);await assert.rejects(fetch(call.url));
  }finally{handler?.({id:42,state:{current:'complete'}});globalThis.chrome=original;}
});
