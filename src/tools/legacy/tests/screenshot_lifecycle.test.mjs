import test from 'node:test';
import assert from 'node:assert/strict';
import { captureImage } from '../tools/screenshot/capture-client.js';
import { ScreenshotController } from '../tools/screenshot/controller.js';
import { installWorkspaceDOM } from './support/workspace-dom.mjs';
import { byId, emit } from './support/comparison-dom.mjs';

const metrics = {
  documentId: 'document',
  x: 0,
  y: 0,
  width: 100,
  height: 100,
  innerWidth: 100,
  innerHeight: 100,
  viewportWidth: 100,
  viewportHeight: 100,
  dpr: 1
};
function fixture({
  onDecode = () => {},
  onEncode = () => {},
  onEnd = () => {},
  frameMetrics = metrics,
  context = true
} = {}) {
  const previous = globalThis.createImageBitmap,
    calls = [],
    controller = new AbortController();
  let closed = 0;
  globalThis.createImageBitmap = async () => {
    await onDecode(controller);
    return {
      width: 100,
      height: 100,
      close() {
        closed++;
      }
    };
  };
  const request = async (type, payload) => {
    calls.push(type);
    if (type === 'CAPTURE_BEGIN')
      return { token: 'capture', metrics, region: { x: 0, y: 0, width: 100, height: 100 } };
    assert.equal(payload.token, 'capture');
    if (type === 'CAPTURE_SCROLL') return metrics;
    if (type === 'CAPTURE_FRAME') return { metrics: frameMetrics, dataUrl: 'data:image/png;base64,AA==' };
    if (type === 'CAPTURE_END') {
      await onEnd(controller);
      return { restored: true };
    }
    throw new Error('Unexpected request ' + type);
  };
  const canvas = {
    width: 0,
    height: 0,
    getContext: () => (context ? { drawImage() {} } : null),
    toBlob(done) {
      onEncode(controller);
      done(new Blob(['png'], { type: 'image/png' }));
    }
  };
  return {
    request,
    controller,
    calls,
    canvas,
    closed: () => closed,
    restore() {
      globalThis.createImageBitmap = previous;
    },
    capture(mode = 'element') {
      return captureImage(
        request,
        mode,
        null,
        () => {},
        controller.signal,
        () => canvas
      );
    }
  };
}

for (const [stage, options, mode] of [
  ['image decoding', { onDecode: c => c.abort() }, 'visible'],
  ['PNG encoding', { onEncode: c => c.abort() }, 'element'],
  ['page restoration', { onEnd: c => c.abort() }, 'visible']
])
  test('Cancelling during ' + stage + ' never returns a screenshot', async () => {
    const f = fixture(options);
    try {
      await assert.rejects(f.capture(mode), /zrušeno/);
      assert.equal(f.closed(), 1);
      assert.equal(f.calls.at(-1), 'CAPTURE_END');
    } finally {
      f.restore();
    }
  });

test('A failed stitching canvas releases the decoded bitmap and restores the page', async () => {
  const f = fixture({ context: false });
  try {
    await assert.rejects(f.capture(), /paměti/);
    assert.equal(f.closed(), 1);
    assert.equal(f.calls.at(-1), 'CAPTURE_END');
  } finally {
    f.restore();
  }
});

test('A viewport resize between scrolling and frame capture rejects incomplete pixels', async () => {
  const f = fixture({ frameMetrics: { ...metrics, innerHeight: 50, viewportHeight: 50 } });
  try {
    await assert.rejects(f.capture(), /rozměry|velikost/);
    assert.equal(f.calls.at(-1), 'CAPTURE_END');
  } finally {
    f.restore();
  }
});

test('Destroying a screenshot tool during page restoration cannot recreate its preview URL', async () => {
  const dom = installWorkspaceDOM();
  let release, started, work;
  const restoring = new Promise(resolve => (started = resolve));
  const f = fixture({
    onEnd: () => {
      started();
      return new Promise(resolve => (release = resolve));
    }
  });
  const root = dom.host(),
    app = {
      target: () => ({ url: 'https://site.test/' }),
      ensureTarget() {},
      lock() {},
      unlock() {},
      request: f.request,
      run(fn) {
        work = fn();
        return work;
      }
    };
  const tool = new ScreenshotController(app);
  try {
    work = tool.capture('visible');
    await restoring;
    tool.destroy();
    release();
    await work;
    assert.equal(dom.urls.size, 0);
    assert.equal(byId(root, 'screenshot-preview'), null);
  } finally {
    release?.();
    await work;
    tool.destroy();
    f.restore();
    dom.restore();
  }
});
