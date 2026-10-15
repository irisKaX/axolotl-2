import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';

const moduleUrl=new URL('../tools/image-converter/comparison-view.js',import.meta.url);
test('single-image comparison has a shared view for both images',()=>assert.ok(existsSync(moduleUrl)));
if(existsSync(moduleUrl)){
  const {ComparisonView}=await import(moduleUrl);
  test('fit shows the whole image and never enlarges a small original',()=>{
    const v=new ComparisonView(2000,1000);v.resize(1000,500);v.fit();
    assert.ok(v.scale<.5);assert.ok(v.x>=0&&v.y>=0);
    assert.ok(v.x+2000*v.scale<=1000);assert.ok(v.y+1000*v.scale<=500);
    const small=new ComparisonView(200,100);small.resize(1000,500);small.fit();
    assert.equal(small.scale,1);assert.equal(small.x,400);assert.equal(small.y,200);
  });
  test('zoom keeps the detail under the viewport center fixed',()=>{
    const v=new ComparisonView(2000,1000);v.resize(1000,500);v.zoomTo(1);
    const point={x:(500-v.x)/v.scale,y:(250-v.y)/v.scale};
    v.zoomTo(2);
    assert.equal((500-v.x)/v.scale,point.x);assert.equal((250-v.y)/v.scale,point.y);
    assert.equal(v.scale,2);
  });
  test('panning cannot lose the image outside the viewport',()=>{
    const v=new ComparisonView(2000,1000);v.resize(1000,500);v.zoomTo(1);
    v.pan(5000,5000);assert.equal(v.x,0);assert.equal(v.y,0);
    v.pan(-10000,-10000);assert.equal(v.x,-1000);assert.equal(v.y,-500);
    v.zoomTo(.1);v.pan(100,100);assert.equal(v.x,400);assert.equal(v.y,200);
  });
  test('divider uses viewport coordinates even after zoom and pan',()=>{
    const v=new ComparisonView(2000,1000);v.resize(1000,500);v.zoomTo(2);v.pan(300,30);
    v.splitAt(350,100);assert.equal(v.split,25);
    v.splitAt(-500,100);assert.equal(v.split,0);
    v.splitAt(5000,100);assert.equal(v.split,100);
    v.moveSplit(-10);assert.equal(v.split,90);
  });
  test('a hidden or resized tool preserves a usable view',()=>{
    const v=new ComparisonView(1200,900);v.resize(1000,500);const fitScale=v.scale;
    v.resize(0,0);assert.equal(v.scale,fitScale);
    v.resize(500,400);assert.ok(v.scale<fitScale);
    v.zoomTo(1);v.resize(700,500);assert.equal(v.scale,1);
    assert.ok(Number.isFinite(v.x)&&Number.isFinite(v.y));
  });
}
