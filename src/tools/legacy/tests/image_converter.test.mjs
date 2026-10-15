import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const base=new URL('../tools/image-converter/',import.meta.url);
test('converter exposes its image policy and local codec',()=>{
  assert.ok(existsSync(new URL('policy.js',base)));
  assert.ok(existsSync(new URL('codec.js',base)));
});
if(existsSync(new URL('policy.js',base))&&existsSync(new URL('codec.js',base))){
  const {makeOptions,outputFilename,validateDimensions,validateFile}=await import(new URL('policy.js',base));
  const {createEncoder}=await import(new URL('codec.js',base));
  test('maximum-quality mode is lossless unless the user chooses lossy',()=>{
    assert.equal(makeOptions().lossless,true);
    assert.equal(makeOptions({lossless:false,quality:95}).quality,95);
    assert.throws(()=>makeOptions({lossless:false,quality:101}));
    assert.throws(()=>makeOptions({lossless:false,quality:NaN}));
  });
  test('names cannot escape the download folder or overwrite another conversion',()=>{
    const used=new Set();
    assert.equal(outputFilename('náhled.jpg',used),'náhled.webp');
    assert.equal(outputFilename('náhled.png',used),'náhled-2.webp');
    assert.equal(outputFilename('NÁHLED.gif',used),'NÁHLED-3.webp');
    assert.equal(outputFilename('../../logo.png',used),'logo.webp');
    assert.equal(outputFilename('CON.jpg',used),'_CON.webp');
    assert.ok(!/[\\/:*?"<>|]/.test(outputFilename('bad:?name.jpg',used)));
  });
  test('oversized and empty images get an explicit error; dimensions are never silently resized',()=>{
    assert.throws(()=>validateFile({name:'big.png',size:60*1024*1024}),/50/);
    assert.throws(()=>validateFile({name:'empty.png',size:0}),/prázdn/i);
    assert.throws(()=>validateDimensions(16384,1),/16383/);
    assert.throws(()=>validateDimensions(8000,8000),/pixel|Mpx/);
    assert.throws(()=>validateDimensions(0,100));
    assert.doesNotThrow(()=>validateDimensions(4096,2160));
  });
  const bytes=readFileSync(new URL('../vendor/webp/webp_codec.wasm',import.meta.url));
  test('packaged WASM creates real lossless WebP with dimensions and alpha',async()=>{
    const encode=await createEncoder(bytes);
    const data=new Uint8Array([255,0,0,255,0,255,0,128,0,0,255,255,0,0,0,0]);
    const result=encode({data,width:2,height:2});
    assert.equal(new TextDecoder().decode(result.subarray(0,4)),'RIFF');
    assert.equal(new TextDecoder().decode(result.subarray(8,12)),'WEBP');
    assert.equal(new TextDecoder().decode(result.subarray(12,16)),'VP8L');
    assert.throws(()=>encode({data:data.subarray(0,8),width:2,height:2}),/pixel|délk|dat/i);
    assert.ok(encode({data,width:2,height:2},{lossless:false,quality:95}).length>0);
  });
}
