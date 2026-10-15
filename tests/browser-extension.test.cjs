const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../browser-extension/background.js'), 'utf8');
const sender = { id: 'test-extension', frameId: 0, url: 'https://iriskax.github.io/axolotl-2/#dashboard', tab: { windowId: 7 } };

function setup(tabs = [], failure = false) {
  let listener;
  const calls = [];
  const chrome = {
    runtime: { id: sender.id, onMessage: { addListener(fn) { listener = fn; } } },
    tabs: { async query(options) { calls.push(options); if (failure) throw new Error('Unavailable'); return tabs; } }
  };
  vm.runInNewContext(source, { chrome, URL });
  return { listener, calls, request(from = sender) { return new Promise(resolve => listener({ type: 'AXOLOTL_GET_TABS' }, from, result => resolve(JSON.parse(JSON.stringify(result))))); } };
}

test('returns ordinary web tabs from the requesting window, in tab order, and picks last active page', async () => {
  const bridge = setup([
    { id: 1, index: 0, url: sender.url, active: true, lastAccessed: 100 },
    { id: 2, index: 3, url: 'https://example.org/', title: '<b>Page</b>', lastAccessed: 10 },
    { id: 3, index: 1, url: 'https://example.com/', title: 'Current', lastAccessed: 99 },
    { id: 4, index: 2, url: 'chrome://settings', lastAccessed: 105 },
    { id: 5, index: 4, url: 'https://private.example/', incognito: true, lastAccessed: 110 }
  ]);
  assert.deepEqual(await bridge.request(), { ok: true, activeId: 3, tabs: [
    { id: 3, title: 'Current', url: 'https://example.com/' },
    { id: 2, title: '<b>Page</b>', url: 'https://example.org/' }
  ] });
  assert.equal(bridge.calls[0].windowId, 7);
});

test('rejects other origins, projects, frames and extensions before querying tabs', () => {
  const bridge = setup();
  for (const change of [
    { url: 'https://other.example/axolotl-2/' },
    { url: 'https://iriskax.github.io/other-project/' },
    { url: 'https://iriskax.github.io/axolotl-2-malicious/' },
    { frameId: 1 }, { id: 'other-extension' }, { tab: null }
  ]) assert.equal(bridge.listener({ type: 'AXOLOTL_GET_TABS' }, { ...sender, ...change }, () => assert.fail('Unexpected response')), false);
  assert.equal(bridge.calls.length, 0);
});

test('handles an empty window and browser API failure without leaking errors', async () => {
  assert.deepEqual(await setup().request(), { ok: true, tabs: [], activeId: null });
  assert.deepEqual(await setup([], true).request(), { ok: false, tabs: [], activeId: null });
});

test('an active eligible tab wins over last-accessed metadata', async () => {
  const result = await setup([
    { id: 10, index: 0, url: 'https://example.com/', active: true, lastAccessed: 1 },
    { id: 11, index: 1, url: 'https://example.org/', lastAccessed: 20 }
  ]).request();
  assert.equal(result.activeId, 10);
});

test('content bridge accepts only this page and returns correlated responses', async () => {
  let listener;
  const outgoing = [];
  const calls = [];
  const window = { addEventListener(type, fn) { listener = fn; }, postMessage(data, origin) { outgoing.push({ data, origin }); } };
  const chrome = { runtime: { async sendMessage(message) { calls.push(message); return { ok: true, tabs: [], activeId: null }; } } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../browser-extension/content.js'), 'utf8'), { window, chrome, location: { origin: 'https://iriskax.github.io' } });
  const data = { source: 'axolotl-page', type: 'AXOLOTL_GET_TABS', requestId: 'request-123' };
  listener({ source: {}, origin: 'https://iriskax.github.io', data });
  listener({ source: window, origin: 'https://other.example', data });
  listener({ source: window, origin: 'https://iriskax.github.io', data: { ...data, type: 'OTHER' } });
  assert.equal(calls.length, 0);
  listener({ source: window, origin: 'https://iriskax.github.io', data });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(calls.length, 1);
  assert.equal(outgoing[0].data.requestId, 'request-123');
  assert.equal(outgoing[0].data.ok, true);
  assert.equal(outgoing[0].origin, 'https://iriskax.github.io');
});
