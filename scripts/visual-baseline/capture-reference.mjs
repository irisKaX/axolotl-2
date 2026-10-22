// Explicit S01 operation only. Never called by CI or by the comparison runner.
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {identity,sha256} from './contract.mjs';
import {launch,referenceCases,openCase,snapshot,checkInvariants} from './browser.mjs';
const [base,destination,evidenceFile]=process.argv.slice(2);
assert(base&&destination&&evidenceFile,'Usage: capture-reference URL NEW_DIRECTORY verified-reference-evidence.json');
const evidence=JSON.parse(readFileSync(evidenceFile));assert.deepEqual(evidence.identity,identity);
assert(evidence.publicParity?.every(x=>x.equal)&&evidence.publicParity.length>0,'Verified full public artifact parity is required');
const provenance=await (await fetch(new URL('provenance.json',base))).json();
assert.equal(provenance.previewCommit,identity.source);assert.equal(provenance.previewRepositoryCommit,identity.preview);assert.equal(provenance.previewPatch.sha256,identity.patch);
const out=resolve(destination);mkdirSync(out); // Deliberately refuses to overwrite any existing candidate/approved set.
const {browser,toolchain}=await launch();
const manifest={schema:1,status:'candidate',approval:null,approvalRequest:'Phase 3 Milestone A / explicit screenshot review pending',identity,toolchain,evidence,provenanceSha256:sha256(JSON.stringify(provenance)),stabilization:{date:'2026-10-22T12:00:00.000Z',locale:'cs-CZ',timezone:'UTC',dpr:1,reducedMotion:'reduce',animations:'finite finish; infinite pause at t=0; separate real-time motion test',caret:'hidden; no visual area masked',demo:'default isolated storage; SEO states explicitly synthetic'},cases:[]};
try{
 for(const item of referenceCases()){
  const {page,context}=await openCase(browser,base,item);
  try{
   await checkInvariants(page,item);const {data,png}=await snapshot(page);
   const json=Buffer.from(JSON.stringify(data,null,2)+'\n');
   writeFileSync(resolve(out,item.id+'.json'),json,{flag:'wx'});writeFileSync(resolve(out,item.id+'.png'),png,{flag:'wx'});
   manifest.cases.push({...item,snapshot:{file:item.id+'.json',sha256:sha256(json)},screenshot:{file:item.id+'.png',sha256:sha256(png)}});
   console.log('CAPTURE',item.id);
  }finally{await context.close();}
 }
 writeFileSync(resolve(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
 console.log(`CANDIDATE ONLY: ${manifest.cases.length} cases. Manifest SHA-256 ${sha256(readFileSync(resolve(out,'manifest.json')))}`);
}finally{await browser.close();}
