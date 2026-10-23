import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {collectMetadata} from '../../../../browser-extension/tools/metadata-audit/collect.js';
import {analyzeMetadata} from '../tools/metadata-audit/model.js';
function scan(html,url='https://o2.cz/'){const d=new JSDOM(html,{url});global.document=d.window.document;global.location=d.window.location;try{return analyzeMetadata(collectMetadata());}finally{d.window.close();}}
test('missing and duplicate metadata produce actionable issues',()=>{assert.ok(scan('').issues.some(i=>i.code==='title-missing'));const r=scan('<title>A</title><title>B</title><meta name="description" content="one"><meta name="DESCRIPTION" content="two">');assert.deepEqual(r.titles,['A','B']);assert.ok(r.issues.some(i=>i.code==='description-duplicate'));});
test('Unicode counts code points and title values remain exact',()=>{const r=scan('<title> 😀 - benefit - O₂ </title>');assert.equal(r.title,' 😀 - benefit - O₂ ');assert.equal(r.titleLength,Array.from(r.title).length);assert.equal(r.template.service,'😀');});
test('O2 host matching excludes deceptive suffixes',()=>{assert.equal(scan('<title>Other</title>','https://o2.cz.evil.test/').isO2,false);assert.equal(scan('<title>Other</title>','https://shop.o2.cz/').isO2,true);});
test('document metadata excludes inline SVG titles and retains duplicate HTML titles',()=>{const r=scan('<title>HTML title</title><svg><title>SVG accessible label</title></svg>');assert.deepEqual(r.titles,['HTML title']);assert.ok(!r.issues.some(i=>i.code==='title-duplicate'));const duplicate=scan('<title>First</title><title>Second</title><svg><title>SVG label</title></svg>');assert.deepEqual(duplicate.titles,['First','Second']);assert.ok(duplicate.issues.some(i=>i.code==='title-duplicate'));});
