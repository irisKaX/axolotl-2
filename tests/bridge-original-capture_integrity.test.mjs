import assert from 'node:assert/strict';
import test from 'node:test';

const store={};
let metrics={documentId:'doc',x:0,y:0,width:800,height:1800,innerWidth:800,innerHeight:600,viewportWidth:800,viewportHeight:600,dpr:1},change={};
const session={id:'session-a'};
const token='token-a';
store['capture:'+token]={token,session:session.id,targetId:1,windowId:1,dashboardId:2,documentId:'doc',updatedAt:Date.now()};

globalThis.chrome={
  runtime:{id:'test'},
  storage:{session:{
    async get(key){if(key===null)return {...store};return {[key]:store[key]};},
    async set(values){Object.assign(store,values);},
    async remove(keys){for(const key of Array.isArray(keys)?keys:[keys])delete store[key];}
  }},
  scripting:{async executeScript(){},async insertCSS(){}},
  tabs:{
    async query(){return [{id:1,windowId:1,active:true,url:'https://site.test/'}];},
    async sendMessage(_id,message){
      if(message.type==='PING')return {ok:true,data:{version:'1.3.4'}};
      if(message.type==='CAPTURE_METRICS')return {ok:true,data:structuredClone(metrics)};
      throw new Error('unexpected '+message.type);
    },
    async captureVisibleTab(){
      // Model a script/user scroll after the pre-capture metrics read but before pixels are sampled.
      Object.assign(metrics,change);return 'data:image/png;base64,AA==';
    }
  }
};

const {captureFrame}=await import('../browser-extension/background/capture.js');
test('Frame validates geometry after the browser samples pixels',async t=>{
  const original=structuredClone(metrics);
  await t.test('Stable frame succeeds',async()=>{const frame=await captureFrame(session,{token});assert.deepEqual(frame.metrics,original);});
  for(const update of [{y:600},{x:20},{documentId:'new-document'},{innerWidth:700},{innerHeight:500},{viewportWidth:790},{viewportHeight:590},{dpr:2},{height:2000},{width:900}]){
    await t.test(JSON.stringify(update),async()=>{metrics=structuredClone(original);change=update;await assert.rejects(captureFrame(session,{token}),/během snímání/);});
  }
});
