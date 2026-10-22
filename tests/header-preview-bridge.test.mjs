import test from 'node:test';
import assert from 'node:assert/strict';
import {isAxolotl,authorizeSender} from '../browser-extension/tool-bridge.js';
import {readFileSync} from 'node:fs';
test('Header bridge allows only canonical preview, retaining production authorization',()=>{
 for(const url of ['https://iriskax.github.io/axolotl-2/','https://iriskax.github.io/axolotl-preview/ds-library-v1-1/?section=dashboard#design-system'])assert.equal(isAxolotl(url),true);
 for(const url of ['https://iriskax.github.io/axolotl-preview/','https://iriskax.github.io/axolotl-preview/ds-library-v1-1/untrusted','https://example.com/axolotl-preview/ds-library-v1-1/'])assert.equal(isAxolotl(url),false);
 globalThis.chrome={runtime:{id:'extension'}};
 const sender={id:'extension',frameId:0,tab:{id:1},url:'https://iriskax.github.io/axolotl-preview/ds-library-v1-1/'};
 assert.doesNotThrow(()=>authorizeSender(sender));
 assert.throws(()=>authorizeSender({...sender,frameId:2}));
 assert.throws(()=>authorizeSender({...sender,tab:{id:1,incognito:true}}));
 const manifest=JSON.parse(readFileSync('browser-extension/manifest.json','utf8'));
 assert.deepEqual(manifest.permissions,['tabs','scripting','downloads','storage']);
 assert(manifest.content_scripts[0].matches.includes(sender.url+'*'));
});
