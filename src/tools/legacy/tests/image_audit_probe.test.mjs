import test from 'node:test';
import assert from 'node:assert/strict';
import {probeImageResources} from '../tools/image-audit/probe.js';
const jpeg=new Uint8Array([255,216,255,0]);
const png=new Uint8Array([137,80,78,71,13,10,26,10]);
function response(chunks, headers={'content-type':'image/jpeg'}, status=200) {
  let next=0;
  return {ok:status>=200&&status<300,status,headers:new Headers(headers),body:{getReader:()=>({
    read:async()=>next<chunks.length?{value:chunks[next++],done:false}:{done:true},cancel:async()=>{}
  })}};
}

test('failed HEAD falls back to bounded GET and its MIME metadata',async()=>{
  const methods=[];
  const s=await probeImageResources({items:[{url:'https://images.test/photo'}]},{fetchImpl:async(_,options)=>{
    methods.push(options.method);
    if(options.method==='HEAD')throw Error('HEAD not supported');
    return response([jpeg],{'content-type':'image/jpeg','content-length':'42'});
  }});
  assert.deepEqual(methods,['HEAD','GET']);
  assert.equal(s.items[0].format,'jpeg'); assert.equal(s.items[0].formatVerified,true);
  assert.equal(s.items[0].declaredFormat,'jpeg'); assert.equal(s.items[0].bytes,42);
});

test('signature split across network chunks is still verified and stream is cancelled',async()=>{
  let cancelled=false;
  const chunks=[png.slice(0,2),png.slice(2)];
  const s=await probeImageResources({items:[{url:'https://images.test/photo'}]},{fetchImpl:async(_,o)=>o.method==='HEAD'
    ?{ok:true,headers:new Headers()}
    :{...response([]),body:{getReader:()=>({read:async()=>chunks.length?{value:chunks.shift(),done:false}:{done:true},cancel:async()=>{cancelled=true;}})}}});
  assert.equal(s.items[0].format,'png');assert.equal(s.items[0].formatVerified,true);assert.equal(cancelled,true);
});

test('wrong partial range never claims its middle bytes are the file signature',async()=>{
  const s=await probeImageResources({items:[{url:'https://images.test/photo'}]},{fetchImpl:async(_,o)=>o.method==='HEAD'
    ?{ok:true,headers:new Headers()}:response([jpeg],{'content-range':'bytes 100-103/1000'},206)});
  assert.equal(s.items[0].formatVerified,false);
});

test('embedded image bytes are verified locally and blob resources remain explicitly unverified',async()=>{
  const s=await probeImageResources({items:[{url:'data:image/png;base64,iVBORw0KGgo='},{url:'blob:https://example.test/id'}]},{fetchImpl:async()=>{assert.fail('local image must not use network');}});
  assert.equal(s.items[0].format,'png');assert.equal(s.items[0].formatVerified,true);assert.equal(s.items[0].bytes,8);
  assert.match(s.items[1].inspectionStatus,/blob|stránk/i);assert.equal(s.items[1].formatVerified,false);
});

test('a truncated PNG prefix is not enough to verify the PNG format',async()=>{
  const s=await probeImageResources({items:[{url:'https://images.test/photo'}]},{fetchImpl:async(_,o)=>o.method==='HEAD'
    ?{ok:true,headers:new Headers()}:response([png.slice(0,4)],{})});
  assert.equal(s.items[0].formatVerified,false);
});

test('local references do not consume the 500 network URL budget',async()=>{
  const items=Array.from({length:501},(_,n)=>({url:`blob:https://example.test/${n}`}));items.push({url:'https://images.test/photo'});
  const s=await probeImageResources({items},{fetchImpl:async()=>({ok:true,headers:new Headers({'content-length':'3000000'})})});
  assert.equal(s.items.at(-1).bytes,3000000);assert.equal(s.inspection.truncated,false);
});
