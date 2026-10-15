import test from 'node:test';
import assert from 'node:assert/strict';
import * as audit from '../shared/audit/controller.js';
function setup(){const pending=[];const calls=[],locks=new Set();const app={target:()=>({url:'https://example.test/'}),ensureTarget(){},lock(id){if(locks.size)throw Error('Busy');locks.add(id);},unlock(id){locks.delete(id);},request(type,payload){calls.push({type,payload});return type==='AUDIT_CANCEL'?Promise.resolve({}):new Promise(r=>{pending.push(r);});}};return{app,calls,locks,resolve:(value,index=pending.length-1)=>pending[index](value)};}
test('cancel releases the lock and ignores a late scan while a newer result wins',async()=>{
 assert.equal(typeof audit.AuditController,'function');
 const t=setup(),c=new audit.AuditController(t.app,{id:'metadata',requestType:'METADATA_SCAN',analyze:s=>s});
 const first=c.scan();const pending=t.calls[0].payload.scanId;c.cancel();assert.equal(t.locks.size,0);
 const second=c.scan();t.resolve({title:'new',url:'https://example.test/'},1);await second;
 t.resolve({title:'old',url:'https://example.test/'},0);await first;
 assert.equal(c.getSnapshot().result.title,'new');assert.equal(t.locks.size,0);
 await Promise.resolve();assert.ok(t.calls.some(x=>x.type==='AUDIT_CANCEL'&&x.payload.scanId===pending));
 c.destroy();
});
test('source changes clear previous results and invalidate an in-flight response',async()=>{
 assert.equal(typeof audit.AuditController,'function');
 const t=setup(),c=new audit.AuditController(t.app,{id:'headings',requestType:'HEADINGS_SCAN'});
 const scan=c.scan();c.onTargetChange();t.resolve({items:['old']});await scan;
 assert.equal(c.getSnapshot().result,null);assert.equal(c.getSnapshot().scanned,false);assert.equal(t.locks.size,0);
 c.destroy();
});
test('failed analysis reports an error, releases the lock and can retry',async()=>{
 assert.equal(typeof audit.AuditController,'function');
 const t=setup(),c=new audit.AuditController(t.app,{id:'metadata',requestType:'METADATA_SCAN',analyze:s=>{if(!s.title)throw Error('Invalid data');return s;}});
 let work=c.scan();t.resolve({});await work;
 assert.match(c.getSnapshot().message.text,/Invalid data/);assert.equal(t.locks.size,0);
 work=c.scan();t.resolve({title:'valid'});await work;assert.equal(c.getSnapshot().result.title,'valid');c.destroy();
});
test('destruction suppresses notifications and late results',async()=>{
 assert.equal(typeof audit.AuditController,'function');
 const t=setup(),c=new audit.AuditController(t.app,{id:'metadata',requestType:'METADATA_SCAN'});let notices=0;c.subscribe(()=>notices++);
 const work=c.scan();c.destroy();const n=notices;t.resolve({title:'late'});await work;
 assert.equal(notices,n);assert.equal(t.locks.size,0);assert.equal(c.getSnapshot().result,null);
});
