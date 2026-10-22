// Mutations affect disposable browser documents / temporary fixture copies only.
import assert from 'node:assert/strict';
import {parseArgs} from 'node:util';
import {mkdtempSync,cpSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {loadReference,compareSnapshot,requireApproval} from './contract.mjs';
import {launch,openCase,snapshot,checkInvariants} from './browser.mjs';
const {values}=parseArgs({options:{baseline:{type:'string'},sha256:{type:'string'},url:{type:'string'},report:{type:'string'}}});
assert(values.baseline&&values.sha256&&values.url&&values.report,'Required: --baseline --sha256 --url --report');
const {browser,toolchain}=await launch();const results=[];
const reject=(name,fn,pattern)=>{assert.throws(fn,pattern,name);results.push({name,result:'EXPECTED FAILURE'});console.log('REJECTED',name);};
const temporary=mkdtempSync(join(tmpdir(),'axolotl-baseline-negative-'));
try{
 const reference=loadReference(values.baseline,values.sha256,toolchain);
 reject('1 missing baseline',()=>loadReference(join(temporary,'absent'),values.sha256,toolchain),/ENOENT/);
 reject('2 wrong manifest hash',()=>loadReference(values.baseline,'0'.repeat(64),toolchain),/hash mismatch/);
 cpSync(values.baseline,join(temporary,'copy'),{recursive:true});
 rmSync(join(temporary,'copy',reference.cases[0].screenshot.file));
 reject('3 missing screenshot',()=>loadReference(join(temporary,'copy'),values.sha256,toolchain),/ENOENT/);
 reject('4 wrong browser revision',()=>loadReference(values.baseline,values.sha256,{...toolchain,browser:'wrong-revision'}),/toolchain mismatch/);
 const mutations=[
  ['5 Header geometry','dashboard',()=>{document.querySelector('#approved-header header').style.setProperty('min-height','151px','important');}],
  ['6 Header violet','dashboard',()=>{document.querySelector('#approved-header header').style.setProperty('--primary','rgb(255, 0, 170)','important');}],
  ['7 logo size','dashboard',()=>{document.querySelector('#approved-header .axo-animated-mark').style.setProperty('--mark-size','52px','important');}],
  ['8 Button variant count','buttons',()=>{document.querySelector('input[name=button-variant][value=outline]').closest('label').remove();}],
 ];
 for(const [name,section,mutate] of mutations){
  const item=reference.cases.find(c=>c.section===section&&c.state==='default'&&c.theme==='dark'&&c.viewport.width===(section==='dashboard'?1366:1440));assert(item);
  const {page,context}=await openCase(browser,values.url,item);
  try{
   await checkInvariants(page,item);const before=await snapshot(page);compareSnapshot(item.data,before.data,item.png,before.png);
   await page.evaluate(mutate);const after=await snapshot(page);
   reject(name,()=>compareSnapshot(item.data,after.data,item.png,after.png),/mismatch/);
   if(section==='buttons')await assert.rejects(()=>checkInvariants(page,item),/six variants/);
  }finally{await context.close();}
 }
 // A future approved live reference must still pass this negative suite.
 // Simulate candidate status only on an isolated in-memory copy.
 reject('candidate cannot authorize a release',()=>requireApproval({...reference.manifest,status:'candidate',approval:null}),/candidate/);
 const focusCase=reference.cases.find(c=>c.id==='dashboard-url-focus-dark-1366x768');
 const {page,context}=await openCase(browser,values.url,focusCase);
 try{
  const originalScreenshot=page.screenshot.bind(page);
  page.screenshot=async options=>{const png=await originalScreenshot(options);await page.getByRole('link',{name:'O₂ Axolotl – dashboard',exact:true}).focus();return png;};
  await assert.rejects(()=>snapshot(page),/Focus changed during screenshot/);
  results.push({name:'focus race during capture',result:'EXPECTED FAILURE'});console.log('REJECTED focus race during capture');
 }finally{await context.close();}
 assert.equal(results.length,10);
}finally{await browser.close();rmSync(temporary,{recursive:true,force:true});writeFileSync(values.report,JSON.stringify(results,null,2)+'\n');}
