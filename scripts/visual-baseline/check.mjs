import assert from 'node:assert/strict';
import {parseArgs} from 'node:util';
import {mkdirSync,writeFileSync,realpathSync} from 'node:fs';
import {resolve,dirname,basename} from 'node:path';
import {loadReference,compareSnapshot,requireApproval} from './contract.mjs';
import {launch,openCase,snapshot,checkInvariants,referenceCases} from './browser.mjs';
const {values}=parseArgs({options:{baseline:{type:'string'},sha256:{type:'string'},url:{type:'string'},output:{type:'string'},diagnostic:{type:'boolean',default:false}}});
assert(values.baseline&&values.sha256&&values.url&&values.output,'Required: --baseline PINNED_DIRECTORY --sha256 EXTERNAL_PIN --url BUILD_URL --output NEW_DIRECTORY');
const requestedOutput=resolve(values.output),output=resolve(realpathSync(dirname(requestedOutput)),basename(requestedOutput)),baseline=realpathSync(values.baseline);assert(!output.startsWith(baseline+'/')&&output!==baseline,'Comparison must not write into reference');mkdirSync(output);
const {browser,toolchain}=await launch();const report={mode:values.diagnostic?'diagnostic-candidate-comparison':'release-gate',compared:[],failed:[],approved:false};
try{
 const reference=loadReference(baseline,values.sha256,toolchain);
 const expected=referenceCases();
 assert.deepEqual(reference.cases.map(c=>Object.fromEntries(Object.keys(expected[0]).map(k=>[k,c[k]]))),expected,'Reference coverage/environment differs from the declared suite');
 for(const item of reference.cases){
  const {page,context}=await openCase(browser,values.url,item);
  try{await checkInvariants(page,item);const actual=await snapshot(page);
   try{compareSnapshot(item.data,actual.data,item.png,actual.png);report.compared.push(item.id);console.log('COMPARE PASS',item.id);}catch(e){writeFileSync(resolve(output,item.id+'-actual.json'),JSON.stringify(actual.data,null,2));writeFileSync(resolve(output,item.id+'-actual.png'),actual.png);report.failed.push({id:item.id,error:e.message});console.error('COMPARE FAIL',item.id,e.message.split('\n')[0]);}
  }finally{await context.close();}
 }
 assert.equal(report.failed.length,0,'Visual comparison failures: '+report.failed.map(x=>x.id).join(', '));
 if(values.diagnostic){report.result='DIAGNOSTIC PASS — NOT RELEASE AUTHORIZATION';console.log(report.result);}
 else{requireApproval(reference.manifest);report.approved=true;report.result='APPROVED BASELINE GATE PASS';console.log(report.result);}
}catch(e){report.result='FAIL / BLOCKED';report.error=e.message;throw e;}
finally{writeFileSync(resolve(output,'comparison.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}
