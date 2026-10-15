import JSZip from 'jszip';
import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {existsSync} from 'node:fs';
const base=new URL('../tools/image-download/',import.meta.url);
test('bulk image download is available',()=>assert.ok(existsSync(new URL('collect.js',base)),'Image collector has not been implemented'));
if(existsSync(new URL('collect.js',base))){
 const {collectImages}=await import(new URL('collect.js',base));
 const {filterImages,imageFilename}=await import(new URL('model.js',base));
 const {fetchImage,prepareArchive}=await import(new URL('download.js',base));
 function page(html){
  const dom=new JSDOM(html,{url:'https://site.test/articles/page',runScripts:'outside-only'});
  // JSDOM does not lay out elements. URL/parser tests use a visible layout
  // boundary; real hidden/clip/shadow behavior is tested in Chromium.
  const box={left:0,top:0,right:80,bottom:60,width:80,height:60};
  dom.window.Element.prototype.getClientRects=function(){return [box];};
  dom.window.Element.prototype.getBoundingClientRect=function(){return box;};
  return {dom,scan:()=>JSON.parse(dom.window.eval('JSON.stringify(('+collectImages.toString()+')())'))};
 }
 test('collector deduplicates exact URLs, preserves signed queries and collects loaded lazy and shadow images',()=>{
  const {dom,scan}=page(`<base href="https://cdn.test/media/"><img src="hero.webp?sig=a&amp;b=2" alt="Banner"><img src="hero.webp?sig=a&amp;b=2"><img src="lazy.jpg" data-src="lazy.jpg"><div id="shadow"></div><div data-o2-tools-ui><img src="tool.png"></div><img src="javascript:alert(1)">`);
  try{
   dom.window.document.getElementById('shadow').attachShadow({mode:'open'}).innerHTML='<img src="shadow.png">';
   const result=scan();assert.equal(result.items.length,3);
   assert.equal(result.items[0].url,'https://cdn.test/media/hero.webp?sig=a&b=2');
   assert.equal(result.items[0].alt,'Banner');assert.equal(result.items[0].occurrences,2);
   assert.ok(result.items.some(i=>i.url.endsWith('/lazy.jpg')));assert.ok(result.items.some(i=>i.url.endsWith('/shadow.png')));
  }finally{dom.window.close();}
 });
 test('responsive variants keep their own dimensions; commas in URLs and data images are preserved',()=>{
  const {dom,scan}=page(`<picture><source srcset="large.avif 1600w"><img src="small.jpg" srcset="small.jpg 400w, resize,w_800/photo.jpg 800w" width="200" height="100"></picture><img src="data:image/png;base64,iVBORw0KGgo=">`);
  try{
   const img=dom.window.document.querySelector('img');Object.defineProperties(img,{currentSrc:{value:'https://site.test/articles/small.jpg'},naturalWidth:{value:400},naturalHeight:{value:200}});
   const items=scan().items;
   assert.equal(items.find(i=>i.url.endsWith('/small.jpg')).width,0);
   assert.equal(items.find(i=>i.url.endsWith('/large.avif')).height,0);
   assert.equal(items.find(i=>i.url.endsWith('/large.avif')).variant,true);
   assert.ok(items.some(i=>i.url.endsWith('/resize,w_800/photo.jpg')));
   assert.ok(items.some(i=>i.url==='data:image/png;base64,iVBORw0KGgo='));
  }finally{dom.window.close();}
 });
 test('density-corrected responsive dimensions cannot exclude a larger source from size filters',()=>{
  const {dom,scan}=page('<img srcset="/density.png 2x"><img srcset="/width.png 800w" sizes="400px"><picture><source srcset="/picture.png 2x"><img src="/fallback.png"></picture><img src="/small.png">');
  try{
   const imgs=dom.window.document.querySelectorAll('img');
   for(const [index,path] of ['density.png','width.png','picture.png','small.png'].entries())
    Object.defineProperties(imgs[index],{currentSrc:{value:'https://site.test/'+path},naturalWidth:{value:index===3?32:400},naturalHeight:{value:index===3?16:200}});
   const items=scan().items;
   assert.deepEqual(filterImages(items,{minWidth:600}).map(i=>new URL(i.url).pathname).sort(),['/density.png','/picture.png','/width.png']);
   assert.equal(items.find(i=>i.url.endsWith('/density.png')).width,0);
   assert.equal(items.find(i=>i.url.endsWith('/picture.png')).height,0);
   assert.equal(items.find(i=>i.url.endsWith('/small.png')).width,32);
  }finally{dom.window.close();}
 });
 test('an ordinary image can supply true dimensions for a duplicate responsive URL',()=>{
  const {dom,scan}=page('<img src="/same.png"><img srcset="/same.png 2x">');
  try{
   const imgs=dom.window.document.querySelectorAll('img');
   for(const [index,img] of imgs.entries())
    Object.defineProperties(img,{currentSrc:{value:'https://site.test/same.png'},naturalWidth:{value:index?400:801},naturalHeight:{value:index?200:401}});
   const items=scan().items;
   assert.equal(items.length,1);assert.equal(items[0].width,801);assert.equal(items[0].height,401);
   assert.equal(filterImages(items,{minWidth:800}).length,1);
  }finally{dom.window.close();}
 });
 test('CSS backgrounds, posters and SVG image references are included; iframe limits are explicit',()=>{
  const {dom,scan}=page(`<div style="background-image:url('/background.webp')"></div><video poster="/poster.jpg"></video><svg><image href="/vector.svg"/></svg><iframe></iframe>`);
  try{const result=scan();assert.deepEqual(result.items.map(i=>new URL(i.url).pathname).sort(),['/background.webp','/poster.jpg','/vector.svg']);assert.equal(result.framesSkipped,1);}
  finally{dom.window.close();}
 });
 test('unused lazy metadata cannot introduce an image that the page has not displayed',()=>{
  const {dom,scan}=page('<img data-srcset="/lazy-small.webp 400w, /lazy-large.webp 1000w">');
  try{assert.deepEqual(scan().items,[]);}
  finally{dom.window.close();}
 });
 test('stale lazy attributes and image links are not displayed sources',()=>{
  const {dom,scan}=page('<img src="/current.png" data-src="/old.png" data-original="/different.png"><a href="/linked.jpg">Download</a>');
  try{assert.deepEqual(scan().items.map(i=>new URL(i.url).pathname),['/current.png']);}
  finally{dom.window.close();}
 });
 test('filtering distinguishes unknown dimensions from known small images and can include variants',()=>{
  const items=[{url:'https://x/one.webp',name:'Banner',format:'webp',width:1200,height:600,variant:false},{url:'https://x/two',name:'Unknown',format:'unknown',width:0,height:0,variant:false},{url:'https://x/icon.png',name:'Icon',format:'png',width:32,height:32,variant:false},{url:'https://x/large.webp',name:'Alternative',format:'webp',width:0,height:0,variant:true}];
  assert.deepEqual(filterImages(items,{minWidth:100}).map(i=>i.name),['Banner','Unknown']);
  assert.deepEqual(filterImages(items,{query:'banner',format:'webp'}).map(i=>i.name),['Banner']);
  assert.equal(filterImages(items,{variants:true}).length,4);
 });
 test('filenames are safe and case-insensitively unique, and actual image type wins over URL suffix',()=>{
  const used=new Set();assert.equal(imageFilename('https://x/path/CON.jpg','image/webp',used),'_CON.webp');
  assert.equal(imageFilename('https://x/path/logo.png?token=a','image/png',used),'logo.png');
  assert.equal(imageFilename('https://x/path/LOGO.png?token=b','image/png',used),'LOGO-2.png');
  assert.equal(imageFilename('https://x/asset/a452817','image/avif',used),'a452817.avif');
  assert.ok(!/[\\/]/.test(imageFilename('https://x/%2e%2e%2fsecret.png','image/png',used)));
 });
 const png=Uint8Array.from(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6nXcAAAAASUVORK5CYII=','base64'));
 test('download preserves original bytes and detects image type for extensionless assets',async()=>{
  const result=await fetchImage('https://x/a452817',{fetcher:async()=>new Response(png,{headers:{'Content-Type':'application/octet-stream'}})});
  assert.equal(result.type,'image/png');assert.deepEqual(new Uint8Array(await result.arrayBuffer()),png);
 });
 test('WebP signatures use byte offsets even when the RIFF length contains UTF-8 sequences',async()=>{
  const {readFile}=await import('node:fs/promises');
  const {createEncoder}=await import('../tools/image-converter/codec.js');
  const encode=await createEncoder(await readFile(new URL('../vendor/webp/webp_codec.wasm',import.meta.url)));
  const original=encode({width:1,height:1,data:new Uint8Array([255,0,0,255])},{lossless:true});
  // A valid ignored RIFF chunk gives size bytes C2 80 00 00. UTF-8 decoding
  // contracts C2 80 to one character, so character offsets cannot find WEBP.
  const bytes=new Uint8Array(32970),view=new DataView(bytes.buffer);bytes.set(original);
  view.setUint32(4,32962,true);bytes.set(new TextEncoder().encode('JUNK'),original.length);
  view.setUint32(original.length+4,bytes.length-original.length-8,true);
  const result=await fetchImage('https://x/padded.webp',{fetcher:async()=>new Response(bytes)});
  assert.equal(result.type,'image/webp');assert.deepEqual(new Uint8Array(await result.arrayBuffer()),bytes);
 });
 test('HTML/login pages, HTTP errors, empty and oversized responses cannot become downloaded images',async()=>{
  for(const [response,pattern,maxBytes] of [[new Response('<html>Login</html>',{headers:{'Content-Type':'image/png'}}),/obráz/],[new Response('denied',{status:403}),/403/],[new Response(''),/prázd/],[new Response(png),/limit/,4]]){
   await assert.rejects(()=>fetchImage('https://x/a',{fetcher:async()=>response,maxBytes}),pattern);
  }
 });
 test('cancel and timeout terminate in-flight downloads',async()=>{
  const pending=(_,options)=>new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>reject(new DOMException('Cancelled','AbortError'))));
  const controller=new AbortController(),task=fetchImage('https://x/a',{fetcher:pending,signal:controller.signal});controller.abort();await assert.rejects(()=>task,{name:'AbortError'});
  await assert.rejects(()=>fetchImage('https://x/a',{fetcher:pending,timeoutMs:5}),/časový limit/);
 });
 test('partial ZIP contains original images with distinct names and an explicit failure report',async()=>{
  const result=await prepareArchive([{url:'https://a/logo.png'},{url:'https://b/logo.png'},{url:'https://a/fail.png'}],{fetcher:async url=>url.includes('fail')?new Response('no',{status:403}):new Response(png)});
  const zip=await JSZip.loadAsync(await result.blob.arrayBuffer());
  assert.deepEqual(Object.keys(zip.files).sort(),['_chyby-stazeni.txt','logo-2.png','logo.png']);
  assert.deepEqual(await zip.file('logo.png').async('uint8array'),png);assert.equal(result.succeeded,2);assert.equal(result.failures.length,1);
  assert.match(await zip.file('_chyby-stazeni.txt').async('string'),/403/);
 });
 test('cancel never returns a partial ZIP; batch byte cap is enforced',async()=>{
  const controller=new AbortController();
  await assert.rejects(()=>prepareArchive([{url:'https://a/1.png'},{url:'https://a/2.png'}],{signal:controller.signal,fetcher:async()=>{controller.abort();return new Response(png);}}),{name:'AbortError'});
  const result=await prepareArchive([{url:'https://a/1.png'},{url:'https://a/2.png'}],{maxTotalBytes:png.length,fetcher:async()=>new Response(png)});
  assert.equal(result.succeeded,1);assert.equal(result.failures.length,1);assert.match(result.failures[0].reason,/limit/);
 });
 test('cancelling while ZIP is assembled rejects cleanly without an uncaught callback error',{timeout:1000},async()=>{
  const controller=new AbortController();
  await assert.rejects(()=>prepareArchive([{url:'https://x/a.png'}],{signal:controller.signal,fetcher:async()=>new Response(png),onProgress:update=>{if(update.phase==='zip')controller.abort();}}),{name:'AbortError'});
 });
}
