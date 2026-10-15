import test from 'node:test';
import assert from 'node:assert/strict';
import {validateCrop,cropFromPoints,pointOnImage} from '../tools/screenshot/crop.js';
test('Crop coordinates use original pixels at a scaled preview, including its scroll offset',()=>{
  const size={width:1200,height:8000},bounds={left:100,top:-300,width:600,height:4000};
  assert.deepEqual(pointOnImage(250,200,bounds,size),{x:300,y:1000});
  assert.deepEqual(pointOnImage(-20,9999,bounds,size),{x:0,y:8000});
});
test('Reverse drags and off-image pointers produce an outward rounded in-bounds rectangle',()=>{
  assert.deepEqual(cropFromPoints({x:72.3,y:180.7},{x:10.9,y:20.8},{width:100,height:200}),{x:10,y:20,width:63,height:161});
  assert.deepEqual(cropFromPoints({x:-10,y:-1},{x:200,y:300},{width:100,height:200}),{x:0,y:0,width:100,height:200});
});
test('Invalid, empty and out-of-bounds pixel crops are rejected without silently cropping a different area',()=>{
  const size={width:100,height:200};
  assert.deepEqual(validateCrop({x:2,y:5,width:98,height:195},size),{x:2,y:5,width:98,height:195});
  for(const rect of [{x:0,y:0,width:0,height:1},{x:-1,y:0,width:4,height:4},{x:1,y:1,width:100,height:100},{x:0,y:0,width:2.5,height:4},{x:NaN,y:0,width:4,height:4}])assert.throws(()=>validateCrop(rect,size));
});
