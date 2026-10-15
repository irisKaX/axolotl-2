import test from 'node:test';
import assert from 'node:assert/strict';
import * as audit from '../browser-extension/background/audit-runner.js';
const tab={id:9,url:'https://example.test/'};
function setup(){let documentId='doc1';globalThis.chrome={scripting:{async executeScript({func}){return[{frameId:0,documentId,result:func.name==='collect'?{url:tab.url,items:[]}:null}];}},tabs:{async get(){return{...tab,status:'complete'};}}};return{navigate(){documentId='doc2';}};}
function collect(){}
test('audit checks document identity after asynchronous inspection',async()=>{
 assert.equal(typeof audit.runPageAudit,'function');const env=setup();
 await assert.rejects(audit.runPageAudit(tab,collect,{sessionId:'test',scanId:'nav',probe:async result=>{env.navigate();return result;}}),/změnila/);
 delete globalThis.chrome;
});
test('cancellation is scoped to its session and aborts outstanding probes',async()=>{
 assert.equal(typeof audit.runPageAudit,'function');setup();let started;
 const ready=new Promise(r=>started=r);
 const work=audit.runPageAudit(tab,collect,{sessionId:'one',scanId:'cancel',probe:async(result,{signal})=>{started();return new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(new Error('cancelled')),{once:true}));}});
 await ready;audit.cancelAudit('other','cancel');audit.cancelAudit('one','cancel');await assert.rejects(work,/cancelled|zrušena/);delete globalThis.chrome;
});
test('cancel arriving before the scan request prevents collection',async()=>{
 assert.equal(typeof audit.runPageAudit,'function');setup();let called=false;chrome.scripting.executeScript=async()=>{called=true;return[];};
 audit.cancelAudit('early','one');await assert.rejects(audit.runPageAudit(tab,collect,{sessionId:'early',scanId:'one'}),/zrušena/);assert.equal(called,false);delete globalThis.chrome;
});
