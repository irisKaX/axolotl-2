import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { verifyPdf } from '../browser-extension/background/network.js';

for (const [label, contentRange, expected] of [
  ['complete size', 'bytes 0-1023/146515', 146515],
  ['unknown complete size', 'bytes 0-1023/*', null],
  ['missing range', null, null],
  ['invalid range', 'bytes 1023-0/146515', null],
  ['range outside the resource', 'bytes 0-1023/100', null]
]) {
  test(`PDF partial response reports ${label} without presenting the chunk as the full file`, async () => {
    const requests = [];
    const server = createServer((req, res) => {
      requests.push({ method: req.method, range: req.headers.range });
      if (req.method === 'HEAD') { res.writeHead(405); res.end(); return; }
      res.writeHead(206, {
        'Content-Type': 'application/pdf', 'Content-Length': '1024',
        ...(contentRange ? { 'Content-Range': contentRange } : {})
      });
      res.end(Buffer.alloc(1024));
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    try {
      const result = await verifyPdf(`http://127.0.0.1:${server.address().port}/document.pdf`);
      assert.equal(result.status, 'pdf');
      assert.equal(result.bytes, expected);
      assert.deepEqual(requests, [{ method: 'HEAD', range: undefined }, { method: 'GET', range: 'bytes=0-1023' }]);
    } finally {
      server.closeAllConnections();
      await new Promise(resolve => server.close(resolve));
    }
  });
}

test('ordinary PDF HEAD response keeps the full Content-Length', async () => {
  const server = createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/pdf', 'Content-Length': '146515' }); res.end();
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    assert.equal((await verifyPdf(`http://127.0.0.1:${server.address().port}/document.pdf`)).bytes, 146515);
  } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
});
