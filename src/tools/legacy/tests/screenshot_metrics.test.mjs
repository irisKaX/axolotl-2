import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../../../../browser-extension/tools/screenshot/page.js',import.meta.url),'utf8');
for(const compatMode of ['CSS1Compat','BackCompat'])
test(`Screenshot tiles exclude native scrollbar dimensions in ${compatMode}`,()=>{
  // Geometry boundary for native scrollbars (headless Chromium uses overlays).
  // The rendering engine exposes the viewport on HTML in standards and BODY in quirks.
  const viewport={clientWidth:784,clientHeight:588,scrollWidth:1600,scrollHeight:1800};
  const content={clientWidth:784,clientHeight:1800,scrollWidth:1600,scrollHeight:1800};
  const context=vm.createContext({
    __O2Tools:{documentId:'document'},
    document:{compatMode,documentElement:compatMode==='BackCompat'?content:viewport,
      body:compatMode==='BackCompat'?viewport:content},
    innerWidth:800,innerHeight:600,scrollX:20,scrollY:30,devicePixelRatio:1
  });
  vm.runInContext(source,context);
  const metrics=context.__O2Tools.captureMetrics();
  assert.equal(metrics.viewportWidth,784);
  assert.equal(metrics.viewportHeight,588);
  assert.equal(metrics.width,1600);
  assert.equal(metrics.height,1800);
  assert.equal(metrics.innerWidth,800,'bitmap scale still uses the complete browser viewport');
  assert.equal(metrics.innerHeight,600);
});
