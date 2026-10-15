const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
test('content relay correlates tools and accepts events only from its own runtime and content session',async()=>{
 let pageListener,extensionListener;const outgoing=[],requests=[];
 const window={addEventListener(type,fn){pageListener=fn;},postMessage(message){outgoing.push(message);}};
 const chrome={runtime:{id:'extension',onMessage:{addListener(fn){extensionListener=fn;}},async sendMessage(message){requests.push(message);return {ok:true,data:{items:[]}};}}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../browser-extension/content.js'),'utf8'),{window,chrome,crypto,location:{origin:'https://iriskax.github.io'}});
 pageListener({source:window,origin:'https://iriskax.github.io',data:{source:'axolotl-page',type:'AXOLOTL_TOOL_REQUEST',requestId:'r1',operation:'PDF_SCAN',payload:{},target:{tabId:1,url:'https://example.test/'}}});
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(outgoing[0].type,'AXOLOTL_TOOL_ACK');assert.equal(outgoing[1].requestId,'r1');assert.equal(outgoing[1].ok,true);
 const clientId=requests[0].clientId;assert.equal(typeof clientId,'string');
 const event={type:'AXOLOTL_TOOL_EVENT',clientId,event:{type:'PICK_CANCEL',data:{}}};
 extensionListener({...event,clientId:'another-document'},{id:'extension'});extensionListener(event,{id:'other-extension'});assert.equal(outgoing.length,2);
 extensionListener(event,{id:'extension'});assert.equal(outgoing[2].event.type,'PICK_CANCEL');assert.equal(outgoing[2].clientId,undefined);
});
