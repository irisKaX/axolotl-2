import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {loadReference,compareSnapshot,requireApproval} from './contract.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex');
const identity={source:'63bda318f5556b12b629016e821e08feb7374281',preview:'0c2bfdcd4ed1a206c23d0988f0c0661c58397f3a',patch:'9293f18080e928225f5da9931153e5df1e5b3f1c3e21f10813505d02c669a6d2'};
function fixture(t){
 const dir=mkdtempSync(join(tmpdir(),'axo-reference-'));t.after(()=>rmSync(dir,{recursive:true,force:true}));
 const png=Buffer.from('fixture screenshot'),snapshot={geometry:[72,48],styles:{primary:'oklch(0.5547 0.2503 297.0156)'}};
 writeFileSync(join(dir,'one.png'),png);writeFileSync(join(dir,'one.json'),JSON.stringify(snapshot));
 const manifest={schema:1,status:'candidate',identity,toolchain:{browser:'154',node:'24'},cases:[{id:'one',screenshot:{file:'one.png',sha256:hash(png)},snapshot:{file:'one.json',sha256:hash(JSON.stringify(snapshot))}}]};
 const save=()=>{const b=JSON.stringify(manifest);writeFileSync(join(dir,'manifest.json'),b);return hash(b)};
 return {dir,png,snapshot,manifest,save,pin:save()};
}
test('missing pinned baseline is a failure',()=>assert.throws(()=>loadReference('/no-such-axo-baseline','a'.repeat(64),{}),/baseline|ENOENT/i));
test('manifest pin is required and cannot be derived from candidate',t=>{const f=fixture(t);assert.throws(()=>loadReference(f.dir,undefined,f.manifest.toolchain),/pin/i)});
test('incorrect manifest hash is a failure',t=>{const f=fixture(t);assert.throws(()=>loadReference(f.dir,'0'.repeat(64),f.manifest.toolchain),/hash/i)});
test('missing screenshot set is a failure',t=>{const f=fixture(t);rmSync(join(f.dir,'one.png'));assert.throws(()=>loadReference(f.dir,f.pin,f.manifest.toolchain),/ENOENT|screenshot/i)});
test('changed screenshot bytes are a failure',t=>{const f=fixture(t);writeFileSync(join(f.dir,'one.png'),'changed');assert.throws(()=>loadReference(f.dir,f.pin,f.manifest.toolchain),/hash/i)});
test('wrong browser or runtime is blocked',t=>{const f=fixture(t);for(const key of ['browser','node'])assert.throws(()=>loadReference(f.dir,f.pin,{...f.manifest.toolchain,[key]:'wrong'}),/toolchain/i)});
test('empty screenshot inventory cannot pass',t=>{const f=fixture(t);f.manifest.cases=[];assert.throws(()=>loadReference(f.dir,f.save(),f.manifest.toolchain),/empty|cases/i)});
test('reference paths cannot escape the pinned directory',t=>{const f=fixture(t);f.manifest.cases[0].screenshot.file='../outside.png';assert.throws(()=>loadReference(f.dir,f.save(),f.manifest.toolchain),/path/i)});
test('exact snapshot and screenshot pass diagnostic comparison',t=>{const f=fixture(t);const r=loadReference(f.dir,f.pin,f.manifest.toolchain);assert.equal(r?.manifest.status,'candidate');assert.doesNotThrow(()=>compareSnapshot(f.snapshot,f.snapshot,f.png,f.png));});
test('Header geometry, purple and logo size regressions fail separately',t=>{const f=fixture(t);for(const actual of [{...f.snapshot,geometry:[73,48]},{...f.snapshot,styles:{primary:'pink'}},{...f.snapshot,geometry:[72,52]}])assert.throws(()=>compareSnapshot(f.snapshot,actual,f.png,f.png),/snapshot/i)});
test('screenshot regression fails even when computed styles match',t=>{const f=fixture(t);assert.throws(()=>compareSnapshot(f.snapshot,f.snapshot,f.png,Buffer.from('other pixels')), /screenshot/i)});
test('candidate can never authorize release',()=>assert.throws(()=>requireApproval({status:'candidate'}),/candidate|approved/i));
test('approved status without explicit review decision is rejected',()=>assert.throws(()=>requireApproval({status:'approved',approval:null}),/approval/i));
test('explicit approved decision is accepted',()=>assert.doesNotThrow(()=>requireApproval({status:'approved',approval:{decision:'user review',reference:'decision-123'}})));

test('negative candidate fixture does not downgrade an approved reference',()=>{const approved=Object.freeze({status:'approved',approval:Object.freeze({decision:'fixture review only',reference:'synthetic-decision'})});assert.throws(()=>requireApproval({...approved,status:'candidate',approval:null}),/candidate/);assert.doesNotThrow(()=>requireApproval(approved));assert.equal(approved.status,'approved');});
