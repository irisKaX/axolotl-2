import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {imageMetadata,probeImageMetadata,inspectImageMetadata} from '../tools/image-download/metadata.js';
const asset=name=>new Uint8Array(readFileSync(new URL('fixtures/converter/'+name,import.meta.url)));
const png=asset('alpha.png');

test('metadata reads original dimensions and actual type without a filename extension',async()=>{
 for(const [name,format] of [['alpha.png','png'],['photo.jpg','jpg'],['image.bmp','bmp'],['still.gif','gif'],['animated.webp','webp']]){
  const info=imageMetadata(asset(name));assert.equal(info.format,format);assert.equal(info.width,32);assert.equal(info.height,24);
 }
 const result=await probeImageMetadata('https://www.o2.cz/_pub/asset/4ec7aa',{fetcher:async()=>new Response(png,{headers:{'content-type':'application/octet-stream'}})});
 assert.equal(result.format,'png');assert.equal(result.width,32);assert.equal(result.height,24);
});

test('bounded metadata handles split headers, ignored Range and aborts the remaining stream',async()=>{
 let reads=0,canceled=false,requested;
 const result=await probeImageMetadata('https://cdn.test/asset',{maxBytes:256,fetcher:async(_,options)=>{
  requested=options.headers.Range;
  return {ok:true,status:200,headers:new Headers(),body:{getReader:()=>({
   async read(){reads++;return {done:false,value:reads===1?png.slice(0,3):png.slice(3)};},
   async cancel(){canceled=true;},releaseLock(){}
  })}};
 }});
 assert.equal(requested,'bytes=0-255');assert.equal(reads,2);assert.equal(canceled,true);assert.equal(result.format,'png');assert.equal(result.width,32);
});

test('middle ranges and disguised HTML cannot provide false image metadata',async()=>{
 const result=await probeImageMetadata('https://cdn.test/asset',{fetcher:async()=>new Response(png,{status:206,headers:{'content-range':'bytes 50-100/500'}})});
 assert.equal(result.format,undefined);
 assert.deepEqual(imageMetadata(new TextEncoder().encode('<html>Login</html>')),{});
});

test('header bounds are respected and unknown or corrupt prefixes are safe',async()=>{
 let canceled=false;
 const result=await probeImageMetadata('https://cdn.test/asset',{maxBytes:128,fetcher:async()=>({ok:true,status:200,headers:new Headers(),body:{getReader:()=>({
  async read(){return {done:false,value:new Uint8Array(1024)};},async cancel(){canceled=true;},releaseLock(){}
 })}})});
 assert.equal(result.bytesRead,128);assert.equal(canceled,true);assert.equal(result.width,undefined);
 for(let length=0;length<png.length;length++)assert.doesNotThrow(()=>imageMetadata(png.slice(0,length)));
});

test('aborting or timing out a nonresponsive request settles the metadata operation',async()=>{
 const controller=new AbortController(),fetcher=()=>new Promise(()=>{});
 const pending=probeImageMetadata('https://cdn.test/asset',{signal:controller.signal,fetcher});controller.abort();
 await assert.rejects(pending,{name:'AbortError'});
 assert.deepEqual(await probeImageMetadata('https://cdn.test/asset',{fetcher,timeoutMs:5}),{bytesRead:0});
});

test('gallery metadata has a shared byte and file budget and prioritizes displayed sources',async()=>{
 const calls=[],updates=[];
 const items=Array.from({length:20},(_,i)=>({url:'https://cdn.test/'+i,format:'unknown',variant:i%2===0}));
 await inspectImageMetadata(items,{limits:{concurrency:2,bytes:100,totalBytes:350,files:10},probe:async(url,{maxBytes})=>{calls.push({url,maxBytes});return {bytesRead:maxBytes,format:'webp',width:800,height:400};},onUpdate:(url,result)=>updates.push({url,...result})});
 assert.equal(calls.length,4);assert.equal(calls.reduce((n,item)=>n+item.maxBytes,0),350);assert.ok(calls.every(({url})=>Number(url.split('/').at(-1))%2===1));assert.equal(updates.length,4);
});

test('AVIF spatial extents and WebP binary RIFF sizes are read at byte offsets',()=>{
 const avif=new Uint8Array(48),view=new DataView(avif.buffer);
 view.setUint32(0,24);avif.set(new TextEncoder().encode('ftypavif'),4);view.setUint32(24,20);avif.set(new TextEncoder().encode('ispe'),28);view.setUint32(36,801);view.setUint32(40,401);
 assert.deepEqual(imageMetadata(avif),{format:'avif',width:801,height:401});
 const webp=asset('animated.webp');webp[4]=194;webp[5]=128;
 assert.deepEqual(imageMetadata(webp),{format:'webp',width:32,height:24});
});
