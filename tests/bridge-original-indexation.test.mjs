import test from 'node:test';
import assert from 'node:assert/strict';
import { readIndexation } from '../browser-extension/background/indexation.js';
const tab = { id: 12, connected: true, url: 'https://source.test/page', status: 'complete' };
const meta = entries => ({ id: tab.id, url: tab.url, source: 'meta', entries, documentId: 'document-a' });
function background({ documentIds = ['document-a', 'document-a'], resultUrl = tab.url, current = tab, identityUrl = tab.url } = {}) {
  let calls = 0;
  globalThis.chrome = {
    scripting: { async executeScript(options) {
      assert.deepEqual(options.target, { tabId: tab.id, frameIds: [0] });
      assert.equal(options.world, 'ISOLATED');
      return [{ frameId: 0, documentId: documentIds[calls], result: calls++ === 0 ? { ...meta([]), url: resultUrl } : identityUrl }];
    } },
    tabs: { async get(id) { assert.equal(id, tab.id); return { ...current }; } }
  };
  return () => calls;
}

test('background returns metadata only for the requested stable top document', async () => {
  const calls = background();
  const result = await readIndexation(tab, { id: tab.id, url: tab.url });
  assert.equal(calls(), 2);
  assert.equal(result.documentId, 'document-a');
  assert.equal(result.source, 'meta');
});

test('background rejects tab switches, navigations and same-URL reloads', async () => {
  for (const options of [
    { documentIds: ['document-a', 'document-b'] },
    { documentIds: [undefined, undefined] },
    { resultUrl: 'https://different.test/' },
    { current: { ...tab, url: 'https://different.test/' } },
    { current: { ...tab, status: 'loading' } },
    { identityUrl: 'https://different.test/' }
  ]) {
    background(options);
    await assert.rejects(readIndexation(tab, { id: tab.id, url: tab.url }));
  }
  const calls = background();
  await assert.rejects(readIndexation(tab, { id: 999, url: tab.url }));
  await assert.rejects(readIndexation(tab, { id: tab.id, url: 'https://different.test/' }));
  await assert.rejects(readIndexation({ ...tab, status: 'loading' }, tab));
  assert.equal(calls(), 0, 'outdated request cannot read a newly selected tab');
});

test('background permission failure is propagated as unavailable, never allowed', async () => {
  background();
  chrome.scripting.executeScript = async () => { throw Error('Cannot access contents of url'); };
  await assert.rejects(readIndexation(tab, tab), /nepovolil přístup/);
});
