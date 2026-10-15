import test from 'node:test';
import assert from 'node:assert/strict';
import { createQr } from '../tools/qr-generator/model.js';
import { exportQrOutput } from '../tools/qr-generator/export.js';

const qr = createQr('https://example.test/');
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
function canvasFixture() {
  let encoded;
  const canvas = { width: 0, height: 0, getContext: () => ({ clearRect() {}, fillRect() {} }), toBlob: callback => { encoded = callback; } };
  return { createCanvas: () => canvas, finish: () => encoded(new Blob(['png'], { type: 'image/png' })) };
}

test('editing while PNG encoding is pending cancels immediately and cannot download a stale QR', async () => {
  const c = canvasFixture(), aborter = new AbortController(); let downloads = 0;
  const work = exportQrOutput(qr, 'png', { ...c, signal: aborter.signal, download: async () => { downloads++; } });
  aborter.abort();
  await assert.rejects(work, { name: 'AbortError' });
  c.finish(); await Promise.resolve();
  assert.equal(downloads, 0);
});

for (const format of ['png', 'svg']) test(`QR ${format.toUpperCase()} export remains pending until browser completion`, async () => {
  const c = canvasFixture(), completion = deferred(), aborter = new AbortController(); let saved, finished = false;
  const work = exportQrOutput(qr, format, { ...c, signal: aborter.signal, download: (blob, name, options) => {
    saved = { blob, name, ...options }; return completion.promise;
  } }).then(() => { finished = true; });
  if (format === 'png') c.finish();
  await Promise.resolve(); await Promise.resolve();
  assert.equal(finished, false);
  assert.equal(saved.name, `qr-code.${format}`); assert.equal(saved.signal, aborter.signal);
  assert.ok(saved.blob.size > 0);
  completion.resolve({ id: 4, state: 'complete' }); await work;
  assert.equal(finished, true);
});

test('QR copying waits for clipboard confirmation and does not invoke a download', async () => {
  const c = canvasFixture(), clipboard = deferred(); let item, completed = false;
  const work = exportQrOutput(qr, 'copy', { ...c,
    ClipboardItem: class { constructor(data) { this.data = data; } },
    clipboard: { write: items => { item = items[0]; return clipboard.promise; } },
    download: () => assert.fail('copy must not download')
  }).then(() => { completed = true; });
  c.finish(); await Promise.resolve(); await Promise.resolve();
  assert.equal(completed, false); assert.equal(item.data['image/png'].type, 'image/png');
  clipboard.resolve(); await work; assert.equal(completed, true);
});

test('QR export propagates browser cancellation and failure', async () => {
  const cancelled = Object.assign(new Error('cancelled'), { name: 'AbortError', code: 'USER_CANCELED' });
  await assert.rejects(exportQrOutput(qr, 'svg', { download: async () => { throw cancelled; } }), error => error === cancelled);
  await assert.rejects(exportQrOutput(qr, 'svg', { download: async () => { throw new Error('disk full'); } }), /disk full/);
});
