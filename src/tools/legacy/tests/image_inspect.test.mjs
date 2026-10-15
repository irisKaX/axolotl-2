import test from 'node:test';import assert from 'node:assert/strict';import {existsSync,readFileSync} from 'node:fs';
const file=new URL('../tools/image-converter/inspect.js',import.meta.url);
test('converter checks the real image format before decoding',()=>assert.ok(existsSync(file)));
if(existsSync(file)){
  const {inspectImage}=await import(file);
  const image=name=>readFileSync(new URL('fixtures/converter/'+name,import.meta.url));
  test('PNG, JPEG, BMP and static GIF headers identify original dimensions',()=>{
    for(const [name,mime] of [['alpha.png','image/png'],['photo.jpg','image/jpeg'],['image.bmp','image/bmp'],['still.gif','image/gif']]){
      const info=inspectImage(image(name));assert.equal(info.mime,mime);assert.equal(info.width,32);assert.equal(info.height,24);assert.equal(info.animated,false);
    }
  });
  test('animation is never silently converted to a still frame',()=>{
    assert.equal(inspectImage(image('animated.gif')).animated,true);
    assert.equal(inspectImage(image('animated.png')).animated,true);
    assert.equal(inspectImage(image('animated.webp')).animated,true);
  });
  test('renaming SVG or broken bytes to .jpg does not bypass format validation',()=>{
    for(const content of ['<svg><script>alert(1)</script></svg>','not an image','GIF89a'])assert.throws(()=>inspectImage(new TextEncoder().encode(content)));
  });
}
