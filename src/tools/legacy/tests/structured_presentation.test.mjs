import test from 'node:test';
import assert from 'node:assert/strict';
import {buildSync} from 'esbuild';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {analyzeStructuredData} from '../tools/structured-data/model.js';

const dir=mkdtempSync(join(tmpdir(),'axolotl-presentation-'));
const bundle=join(dir,'render.cjs');
buildSync({stdin:{contents:`import React from 'react'; import {renderToStaticMarkup} from 'react-dom/server'; import {StructuredResults} from './tools/structured-data/view.jsx'; export const render=props=>renderToStaticMarkup(React.createElement(StructuredResults,props));`,resolveDir:fileURLToPath(new URL('../',import.meta.url)),loader:'jsx'},bundle:true,platform:'node',format:'cjs',outfile:bundle});
const {render}=createRequire(import.meta.url)(bundle);
rmSync(dir,{recursive:true,force:true});

test('unexpected product name types remain inspectable without crashing results',()=>{
 for(const name of [123,['Alpha','Beta']]){
  const result=analyzeStructuredData({documents:[{raw:JSON.stringify({'@type':'Product',name,offers:{'@type':'Offer',price:42}})}]});
  const html=render({result});
  assert.match(html,/Surová produktová data/);
  assert.match(html,new RegExp(name===123?'123':'Alpha'));
 }
});

test('results omit the removed how-it-works disclosure even for empty or malformed-only data',()=>{
 for(const documents of [[],[{raw:'{bad'}]]){
  const html=render({result:analyzeStructuredData({documents}),help:'Pravidla párování a limity kontroly.'});
  assert.doesNotMatch(html,/Jak kontrola funguje/);
  assert.doesNotMatch(html,/Pravidla párování a limity kontroly/);
 }
});
