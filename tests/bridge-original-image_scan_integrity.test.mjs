import test from 'node:test';
import assert from 'node:assert/strict';
import { readImages } from '../browser-extension/background/images.js';

test('same-URL document replacement cannot return images from the previous document', async () => {
  const previous = globalThis.chrome;
  const tab = { id: 7, url: 'https://example.test/' };
  let calls = 0;
  globalThis.chrome = {
    scripting: { async executeScript() {
      return [{ frameId: 0, documentId: ++calls === 1 ? 'before' : 'after', result: { url: tab.url, items: [] } }];
    } },
    tabs: { async get() { return { ...tab, status: 'complete' }; } }
  };
  try { await assert.rejects(readImages(tab), /změnila/); }
  finally { globalThis.chrome = previous; }
});
