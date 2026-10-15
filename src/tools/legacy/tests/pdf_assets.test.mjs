import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';
import { collectPdfAssets } from '../tools/pdf-scout/assets.js';

test('O2 PDF link assets include the two IDs in the supplied results screenshot', () => {
  for (const id of ['a1200349', 'a1566545']) {
    assert.deepEqual(collectPdfAssets({ url: `https://www.o2.cz/cenik.pdf?_linka=${id}` }), [
      { id, kind: 'link' }
    ]);
  }
});

test('Link and URL evidence stay distinct, normalize encoded IDs and deduplicate redirects', () => {
  assert.deepEqual(
    collectPdfAssets({
      url: 'https://www.o2.cz/files/%61452421/cenik_a285965.pdf?_linka=%41%31%32%30%30%33%34%39&_linka=a1200349&assetId=A269385',
      finalUrl: 'https://www.o2.cz/files/a452421/cenik.pdf?linka=a1200349&asset=a267869'
    }),
    [
      { id: 'a452421', kind: 'url' },
      { id: 'a285965', kind: 'url' },
      { id: 'a1200349', kind: 'link' },
      { id: 'a269385', kind: 'url' },
      { id: 'a267869', kind: 'url' }
    ]
  );
});

test('Asset extraction ignores unrelated URL parts and partial or overlong identifiers', () => {
  for (const url of [
    'https://a452399.example/cenik.pdf?token=a452421&return=/a267869#asset=a285965',
    'https://www.o2.cz/xa452399/ča452421/a285965x/a269385č/a123456789012345678901.pdf',
    'https://www.o2.cz/cenik.pdf?_linka=a452399x&asset_id=a123456789012345678901&id=123',
    'https://www.o2.cz/a452399.pdf?' + 'x'.repeat(8200),
    'javascript:a452399',
    'file:///a452399.pdf',
    '/a452399.pdf',
    '',
    undefined
  ])
    assert.deepEqual(collectPdfAssets({ url }), [], String(url).slice(0, 100));
});

test('A malformed path escape does not hide a valid asset elsewhere in the URL', () => {
  assert.deepEqual(collectPdfAssets({ url: 'https://www.o2.cz/%ZZ/a452421.pdf?_linka=a1200349' }), [
    { id: 'a452421', kind: 'url' },
    { id: 'a1200349', kind: 'link' }
  ]);
});

test('Real O2 document discovery retains the download reference used for PDF asset metadata', () => {
  const dom = new JSDOM(
    readFileSync(new URL('./fixtures/o2-document-downloads.html', import.meta.url), 'utf8'),
    {
      url: 'https://www.o2.cz/osobni/ceniky-a-dokumenty',
      runScripts: 'outside-only'
    }
  );
  try {
    for (const file of ['content/core.js', 'tools/pdf-scout/page.js'])
      vm.runInContext(
        readFileSync(new URL('../../../../browser-extension/' + file, import.meta.url), 'utf8'),
        dom.getInternalVMContext()
      );
    const item = dom.window.__O2Tools.pdfScan().items.find(item => item.title === 'Ceník základních služeb');
    assert.deepEqual(collectPdfAssets(item), [{ id: 'a1588601', kind: 'link' }]);
  } finally {
    dom.window.close();
  }
});
