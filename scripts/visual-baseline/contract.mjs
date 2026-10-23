import assert from 'node:assert/strict';
import {readFileSync,realpathSync} from 'node:fs';
import {resolve,relative,isAbsolute} from 'node:path';
import {createHash} from 'node:crypto';
export const identity=Object.freeze({source:'63bda318f5556b12b629016e821e08feb7374281',preview:'0c2bfdcd4ed1a206c23d0988f0c0661c58397f3a',patch:'9293f18080e928225f5da9931153e5df1e5b3f1c3e21f10813505d02c669a6d2'});
export const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
export function loadReference(directory,pin,toolchain){
 assert.match(pin??'',/^[a-f0-9]{64}$/,'An independently pinned manifest hash is required');
 const root=realpathSync(directory),bytes=readFileSync(resolve(root,'manifest.json'));
 assert.equal(sha256(bytes),pin,'Baseline manifest hash mismatch');
 const manifest=JSON.parse(bytes);
 assert.equal(manifest.schema,1,'Unsupported baseline schema');
 assert.deepEqual(manifest.identity,identity,'Wrong reference identity');
 assert(['candidate','approved'].includes(manifest.status),'Invalid reference trust status');
 assert.deepEqual(manifest.toolchain,toolchain,'Baseline toolchain mismatch: BLOCKED');
 assert(Array.isArray(manifest.cases)&&manifest.cases.length>0,'Baseline cases must not be empty');
 const seen=new Set();
 const cases=manifest.cases.map(item=>{
  assert(item.id&&!seen.has(item.id),'Missing or duplicate case id');seen.add(item.id);
  const read=(asset,kind)=>{
   assert(asset&&typeof asset.file==='string'&&!isAbsolute(asset.file),'Invalid baseline path');
   const lexical=relative(root,resolve(root,asset.file));assert(lexical&&!lexical.startsWith('..'),'Invalid baseline path');
   const file=realpathSync(resolve(root,asset.file));assert(!relative(root,file).startsWith('..'),'Baseline symlink path escape');
   const data=readFileSync(file);assert.equal(sha256(data),asset.sha256,`Baseline ${kind} hash mismatch: ${item.id}`);return data;
  };
  return {...item,png:read(item.screenshot,'screenshot'),data:JSON.parse(read(item.snapshot,'snapshot'))};
 });
 return {manifest,cases};
}
// Vite's default scoped name encodes a CSS content hash and declaration line.
// Preserve the local class identity, all ordinary classes and every visual field.
// Raw reference files remain immutable; this is only a comparison projection.
export function visualSnapshot(data){
 if(!Array.isArray(data.nodes))return data;
 return {...data,nodes:data.nodes.map(node=>({...node,class:typeof node.class==='string'
  ?node.class.replace(/(^|\s)_([A-Za-z][\w-]*)_[a-z0-9]{5}_[0-9]+(?=\s|$)/g,'$1_$2_[module]')
  :node.class}))};
}
export function compareSnapshot(expected,actual,expectedPng,actualPng){
 assert.deepEqual(visualSnapshot(actual),visualSnapshot(expected),'Computed/geometry snapshot mismatch');
 assert.equal(sha256(actualPng),sha256(expectedPng),'Exact screenshot mismatch (no tolerance)');
}
export function requireApproval(manifest){
 assert.equal(manifest.status,'approved','Baseline is candidate: release BLOCKED pending explicit approval');
 assert(manifest.approval?.decision&&manifest.approval?.reference,'Explicit baseline approval decision is required');
}
