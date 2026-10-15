import test from 'node:test';
import assert from 'node:assert/strict';
import { captureBegin, captureScroll, captureFrame, captureEnd } from '../browser-extension/background/capture.js';

const metrics = {
  documentId: 'document', x: 0, y: 0,
  innerWidth: 800, innerHeight: 600, viewportWidth: 800, viewportHeight: 600,
  width: 800, height: 600, dpr: 1
};

function fixture(t) {
  const previous = globalThis.chrome;
  const session = { id: 'capture-session', targetId: 1 }, records = {};
  let calls = 0;
  function lease(token) {
    const state = {
      token, session: session.id, targetId: 1, windowId: 1,
      documentId: metrics.documentId, updatedAt: Date.now()
    };
    records['capture:' + token] = state;
    records['capture-window:1'] = state;
  }
  globalThis.chrome = {
    runtime: { id: 'extension' },
    storage: { session: {
      async get(key) { return { [key]: records[key] }; },
      async set(values) { Object.assign(records, structuredClone(values)); },
      async remove(keys) {
        for (const key of Array.isArray(keys) ? keys : [keys]) delete records[key];
      }
    } },
    tabs: {
      async get() { return { id: 1, windowId: 1, url: 'https://source.test/' }; },
      async update() {},
      async query() { return [{ id: 1 }]; },
      async sendMessage(_id, message) {
        if (message.type === 'PING') return { ok: true, data: { version: '1.3.4' } };
        if (message.type === 'CAPTURE_END') return { ok: true, data: { restored: true } };
        assert.equal(message.type, 'CAPTURE_METRICS');
        return { ok: true, data: { ...metrics } };
      },
      async captureVisibleTab() {
        calls++;
        return 'data:image/png;base64,AA==';
      }
    },
    windows: { async update() {} }
  };
  t.after(() => { globalThis.chrome = previous; });
  lease('old');
  return { session, records, lease, calls: () => calls };
}

test('Ending a capture during browser sampling discards its frame and preserves the next lease', async t => {
  const f = fixture(t), sample = chrome.tabs.captureVisibleTab;
  chrome.tabs.captureVisibleTab = async () => {
    const pixels = await sample();
    await captureEnd(f.session, { token: 'old' }, false);
    f.lease('next');
    return pixels;
  };
  await assert.rejects(captureFrame(f.session, { token: 'old' }), /Relace snímání/);
  assert.equal(f.records['capture:old'], undefined);
  assert.equal(f.records['capture-window:1'].token, 'next');
  chrome.tabs.captureVisibleTab = sample;
  const frame = await captureFrame(f.session, { token: 'next' });
  assert.match(frame.dataUrl, /^data:image\/png/);
  assert.equal(f.records['capture-window:1'].token, 'next');
});

for (const operation of ['CAPTURE_BEGIN', 'CAPTURE_SCROLL'])
  test('Ending a capture while ' + operation + ' waits for the page cannot restore its lease', async t => {
    const f = fixture(t), send = chrome.tabs.sendMessage;
    let release, entered, token = 'old', pageCapturing = operation !== 'CAPTURE_BEGIN';
    const pendingPage = new Promise(resolve => { entered = resolve; });
    chrome.tabs.sendMessage = async (id, message) => {
      if (message.type === 'CAPTURE_END') pageCapturing = false;
      if (message.type !== operation) return send(id, message);
      token = message.payload.token;
      entered();
      await new Promise(resolve => { release = resolve; });
      if (operation === 'CAPTURE_BEGIN') pageCapturing = true;
      return { ok: true, data: operation === 'CAPTURE_BEGIN'
        ? { token, metrics: { ...metrics }, region: { x: 0, y: 0, width: 800, height: 600 } }
        : { ...metrics } };
    };
    if (operation === 'CAPTURE_BEGIN') {
      delete f.records['capture:old'];
      delete f.records['capture-window:1'];
    }
    const work = operation === 'CAPTURE_BEGIN'
      ? captureBegin(f.session, { mode: 'visible' })
      : captureScroll(f.session, { token, x: 0, y: 0 });
    const rejected = assert.rejects(work, /Relace snímání/);
    await pendingPage;
    await captureEnd(f.session, { token }, false);
    f.lease('next');
    release();
    await rejected;
    assert.equal(f.records['capture:' + token], undefined);
    assert.equal(f.records['capture-window:1'].token, 'next');
    assert.equal(pageCapturing, false, 'late page setup must also be restored after cancellation');
  });

test('Cancellation waits out an in-flight lease commit without allowing it to resurrect the capture', async t => {
  const f = fixture(t), send = chrome.tabs.sendMessage, set = chrome.storage.session.set;
  let release, entered;
  const writing = new Promise(resolve => { entered = resolve; });
  chrome.tabs.sendMessage = async (id, message) => message.type === 'CAPTURE_SCROLL'
    ? { ok: true, data: { ...metrics } } : send(id, message);
  chrome.storage.session.set = async values => {
    entered();
    await new Promise(resolve => { release = resolve; });
    await set(values);
  };
  const scrolling = captureScroll(f.session, { token: 'old', x: 0, y: 0 });
  await writing;
  const ending = captureEnd(f.session, { token: 'old' }, false);
  await new Promise(resolve => setImmediate(resolve));
  release();
  await Promise.all([scrolling, ending]);
  assert.equal(f.records['capture:old'], undefined);
  assert.equal(f.records['capture-window:1'], undefined);
});

test('Cancellation invalidates before page restoration and old cleanup cannot release or focus over a successor', async t => {
  const f = fixture(t), send = chrome.tabs.sendMessage, focused = [];
  f.records['capture:old'].dashboardId = 2;
  chrome.tabs.update = async id => { focused.push(id); };
  let release, entered;
  const restoring = new Promise(resolve => { entered = resolve; });
  chrome.tabs.sendMessage = async (id, message) => {
    if (message.type !== 'CAPTURE_END') return send(id, message);
    entered();
    await new Promise(resolve => { release = resolve; });
    return { ok: true, data: { restored: true } };
  };
  const ending = captureEnd(f.session, { token: 'old' });
  await restoring;
  assert.equal(f.records['capture:old'], undefined);
  await assert.rejects(captureFrame(f.session, { token: 'old' }), /Relace snímání/);
  f.lease('next');
  release();
  await ending;
  assert.equal(f.records['capture-window:1'].token, 'next');
  assert.ok(f.records['capture:next']);
  assert.deepEqual(focused, []);
});

test('Ending a capture during the frame throttle prevents another browser sample', async t => {
  const f = fixture(t);
  await captureFrame(f.session, { token: 'old' });
  const before = f.calls();
  let release, entered;
  const sleeping = new Promise(resolve => { entered = resolve; });
  t.mock.method(globalThis, 'setTimeout', (callback, delay) => {
    assert.ok(delay > 0, 'the second frame should be rate limited');
    release = callback;
    entered();
    return 1;
  });
  const pending = captureFrame(f.session, { token: 'old' });
  const rejected = assert.rejects(pending, /Relace snímání/);
  await sleeping;
  await captureEnd(f.session, { token: 'old' }, false);
  release();
  await rejected;
  assert.equal(f.calls(), before);
  assert.equal(f.records['capture:old'], undefined);
  assert.equal(f.records['capture-window:1'], undefined);
});

test('bridge abort during capture setup restores the page and releases the window', async t => {
  const f = fixture(t), send = chrome.tabs.sendMessage;
  delete f.records['capture:old'];delete f.records['capture-window:1'];
  const controller = new AbortController();let release, entered;
  const ready = new Promise(resolve => { entered=resolve; });
  chrome.tabs.sendMessage=async(id,message)=>{
    if(message.type!=='CAPTURE_BEGIN')return send(id,message);
    entered();await new Promise(resolve=>{release=resolve;});
    return {ok:true,data:{token:message.payload.token,metrics:{...metrics}}};
  };
  const pending=captureBegin(f.session,{mode:'visible'},controller.signal);
  const rejected=assert.rejects(pending,e=>e.name==='AbortError');await ready;controller.abort();release();await rejected;
  assert.equal(Object.keys(f.records).some(key=>key.startsWith('capture:')),false);
  assert.equal(f.records['capture-window:1'],undefined);
});
