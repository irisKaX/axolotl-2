import { saveDownload } from '../../shared/download-file.js';
import { paintQr, toSvg } from './model.js';

function checkCancelled(signal) {
  if (signal?.aborted) throw new DOMException('Export byl zrušen.', 'AbortError');
}

function pngBlob(canvas, signal) {
  return new Promise((resolve, reject) => {
    const finish = (error, blob) => {
      signal?.removeEventListener('abort', abort);
      error ? reject(error) : resolve(blob);
    };
    const abort = () => finish(new DOMException('Export byl zrušen.', 'AbortError'));
    signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) { abort(); return; }
    try {
      canvas.toBlob(blob => {
        if (signal?.aborted) { abort(); return; }
        finish(blob ? null : new Error('Obrázek PNG se nepodařilo vytvořit.'), blob);
      }, 'image/png');
    } catch (error) { finish(error); }
  });
}

export async function exportQrOutput(qr, format, {
  signal,
  download = saveDownload,
  createCanvas = () => document.createElement('canvas'),
  clipboard = globalThis.navigator?.clipboard,
  ClipboardItem = globalThis.ClipboardItem
} = {}) {
  checkCancelled(signal);
  let blob;
  if (format === 'svg') blob = new Blob([toSvg(qr)], { type: 'image/svg+xml;charset=utf-8' });
  else {
    const canvas = createCanvas(); canvas.width = canvas.height = qr.size;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Obrázek PNG se nepodařilo vytvořit.');
    paintQr(context, qr);
    blob = await pngBlob(canvas, signal);
  }
  checkCancelled(signal);
  if (format === 'copy') {
    if (!clipboard?.write || !ClipboardItem) throw new Error('Prohlížeč nepovoluje zápis obrázku do schránky. Použijte tlačítko PNG.');
    try { await clipboard.write([new ClipboardItem({ 'image/png': blob })]); }
    catch { throw new Error('Prohlížeč nepovolil zápis do schránky. Použijte tlačítko PNG.'); }
  } else await download(blob, `qr-code.${format}`, { signal });
  checkCancelled(signal);
}
