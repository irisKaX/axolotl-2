// Verify the distributed ZIP, not a different source-only fixture.
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';
import JSZip from 'jszip';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
export async function verifyExtensionPackage(file,source='browser-extension') {
 const bytes=readFileSync(file),zip=await JSZip.loadAsync(bytes,{checkCRC32:true});
 const prefix='axolotl-prohlizec/',expected={};
 function walk(dir){for(const e of readdirSync(dir,{withFileTypes:true})){if(e.name==='__pycache__')continue;const p=resolve(dir,e.name);if(e.isDirectory())walk(p);else expected[prefix+relative(resolve(source),p).replaceAll('\\','/')]=hash(readFileSync(p));}}
 walk(resolve(source));
 assert.deepEqual(Object.keys(zip.files).sort(),Object.keys(expected).sort(),'ZIP inventory must exactly match source');
 for(const [name,entry] of Object.entries(zip.files)){
  assert.equal(entry.unsafeOriginalName,name,'Unsafe ZIP path');
  assert(!name.split('/').includes('..')&&!name.startsWith('/'),'Unsafe ZIP path');
  assert.equal(hash(await entry.async('nodebuffer')),expected[name],`Stale ZIP content: ${name}`);
 }
 const manifest=JSON.parse(await zip.file(prefix+'manifest.json').async('string'));
 assert.equal(manifest.manifest_version,3);
 assert.deepEqual(manifest.content_scripts.flatMap(s=>s.matches),['https://iriskax.github.io/axolotl-2/*','https://iriskax.github.io/axolotl-preview/ds-library-v1-1/*']);
 for(const name of [manifest.background.service_worker,...manifest.content_scripts.flatMap(s=>s.js)])assert(zip.file(prefix+name),`Missing manifest asset: ${name}`);
 // Injection files are string dependencies rather than ESM imports.
 const api=await zip.file(prefix+'background/page-api.js').async('string');
 for(const [,name] of api.matchAll(/['"]((?:tools|shared|content)\/[^'"]+\.(?:js|css))['"]/g))assert(zip.file(prefix+name),`Missing injected asset: ${name}`);
 return {sha256:hash(bytes),manifest,files:expected};
}
if(process.argv[1]===new URL(import.meta.url).pathname){
 const result=await verifyExtensionPackage(process.argv[2]||'dist/downloads/axolotl-prohlizec.zip');
 if(process.argv[3])writeFileSync(process.argv[3],JSON.stringify(result,null,2)+'\n');
 console.log(`PASS: actual extension ZIP, ${Object.keys(result.files).length} exact source files, manifest and injection paths (${result.sha256})`);
}
