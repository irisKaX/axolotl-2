import test from 'node:test';
import assert from 'node:assert/strict';
import { PdfController } from '../tools/pdf-scout/controller.js';

const source = { url: 'https://site.test/document.pdf', title: 'Dokument', status: 'link', sources: ['a[href]'] };
const deferred = () => { let resolve; const promise = new Promise(r => resolve = r); return { promise, resolve }; };
const until = async predicate => { for (let i = 0; i < 100; i++) { if (predicate()) return; await new Promise(r => setTimeout(r, 0)); } throw Error('Timeout'); };
async function setup({ count = 1, download, searchDownloads, completionDelay = 2600 } = {}) {
  const listeners = new Set();
  let nextId = 10;
  const controller = new PdfController({
    ensureTarget() {}, lock() {}, unlock() {},
    async request(type, payload) {
      if (type === 'PDF_SCAN') return { items: Array.from({ length: count }, (_, i) => ({ ...source, url: source.url + '?id=' + i })) };
      if (type === 'PDF_VERIFY') return { status: 'pdf' };
      return download ? download(payload) : { id: nextId++ };
    }
  }, { downloads: { addListener: fn => listeners.add(fn), removeListener: fn => listeners.delete(fn) }, searchDownloads, completionDelay });
  await controller.scan();
  controller.selectAll(true);
  return { controller, emit: (id, state) => { for (const fn of listeners) fn({ id, state: { current: state } }); } };
}

test('queue acceptance stays downloading until all browser IDs complete, then returns to idle without clearing rows', async () => {
  const { controller: c, emit } = await setup({ count: 2, completionDelay: 5 });
  try {
    await c.download();
    assert.equal(c.getSnapshot().activity.phase, 'download');
    assert.equal(c.getSnapshot().message.kind, 'info');
    emit(10, 'complete');
    assert.equal(c.getSnapshot().activity.phase, 'download');
    emit(11, 'complete');
    assert.equal(c.getSnapshot().activity.phase, 'done');
    assert.ok(c.getSnapshot().items.every(item => item.downloadState === 'Dokončeno'));
    await until(() => c.getSnapshot().activity.phase === 'idle');
    assert.equal(c.getSnapshot().items.length, 2);
    assert.ok(c.getSnapshot().items.every(item => item.selected));
  } finally { c.destroy(); }
});

test('browser interruption never appears as a completed download', async () => {
  const { controller: c, emit } = await setup({ count: 2 });
  try {
    await c.download(); emit(10, 'complete'); emit(11, 'interrupted');
    assert.equal(c.getSnapshot().activity.phase, 'error');
    assert.equal(c.getSnapshot().items[1].downloadState, 'Přerušeno');
    assert.equal(c.getSnapshot().message.kind, 'warning');
    assert.match(c.getSnapshot().message.text, /1 stahování bylo přerušeno/);
  } finally { c.destroy(); }
});

test('completion emitted before the download request returns is matched to its later ID', async () => {
  const accepted = deferred();
  const { controller: c, emit } = await setup({ download: () => accepted.promise });
  try {
    const pending = c.download(); emit(37, 'complete'); accepted.resolve({ id: 37 }); await pending;
    assert.equal(c.getSnapshot().activity.phase, 'done');
    assert.equal(c.getSnapshot().items[0].downloadState, 'Dokončeno');
  } finally { c.destroy(); }
});

test('downloads.search recovers completion that happened before the listener received any event', async () => {
  const queries = [];
  const { controller: c } = await setup({ searchDownloads: async query => { queries.push(query); return [{ id: query.id, state: 'complete' }]; } });
  try {
    await c.download(); await until(() => c.getSnapshot().activity.phase === 'done');
    assert.deepEqual(queries, [{ id: 10 }]);
  } finally { c.destroy(); }
});

test('late search results do not regress a terminal event or resolve unrelated downloads', async () => {
  const search = deferred();
  const { controller: c, emit } = await setup({ count: 2, searchDownloads: () => search.promise });
  try {
    await c.download(); emit(300, 'complete');
    assert.equal(c.getSnapshot().activity.phase, 'download');
    emit(10, 'complete'); search.resolve([{ id: 10, state: 'in_progress' }]);
    await new Promise(r => setTimeout(r, 0));
    assert.equal(c.getSnapshot().items[0].downloadState, 'Dokončeno');
    assert.equal(c.getSnapshot().items[1].downloadState, 'Stahování');
  } finally { c.destroy(); }
});

test('failed search leaves the status pending until a real outcome is reported', async () => {
  const { controller: c } = await setup({ searchDownloads: async () => { throw Error('Unavailable'); } });
  try {
    await c.download(); await new Promise(r => setTimeout(r, 0));
    assert.equal(c.getSnapshot().activity.phase, 'download');
    assert.notEqual(c.getSnapshot().message.kind, 'success');
  } finally { c.destroy(); }
});

test('download IDs are required before reporting accepted downloads', async () => {
  const { controller: c } = await setup({ download: async () => ({}) });
  try {
    await c.download();
    assert.equal(c.getSnapshot().activity.phase, 'error');
    assert.equal(c.getSnapshot().items[0].downloadState, 'Chyba stažení');
    assert.notEqual(c.getSnapshot().message.kind, 'success');
  } finally { c.destroy(); }
});

test('changing the target invalidates events, searches and reset timers from the previous batch', async () => {
  const search = deferred();
  const { controller: c, emit } = await setup({ searchDownloads: () => search.promise });
  try {
    await c.download(); c.onTargetChange(); emit(10, 'complete'); search.resolve([{ id: 10, state: 'complete' }]);
    await new Promise(r => setTimeout(r, 0));
    assert.equal(c.getSnapshot().activity.phase, 'idle');
    assert.equal(c.getSnapshot().message, null);
    assert.equal(c.getSnapshot().items.length, 0);
  } finally { c.destroy(); }
});

test('an unverified .pdf suffix requires the same explicit confirmation as other unverified links', async () => {
  let downloadCalls = 0;
  const c = new PdfController({ ensureTarget() {}, lock() {}, unlock() {}, async request(type) {
    if (type === 'PDF_SCAN') return { items: [source] };
    if (type === 'PDF_VERIFY') return { status: 'possible', reason: 'Server neodpověděl.' };
    downloadCalls++; return { id: 10 };
  } });
  try {
    await c.scan(); c.selectAll(true); await c.download();
    assert.equal(c.getSnapshot().confirmation.count, 1);
    assert.equal(downloadCalls, 0);
    await c.confirmDownload(); assert.equal(downloadCalls, 1);
  } finally { c.destroy(); }
});
