import JSZip from 'jszip';
import { saveDownload } from '../../shared/download-file.js';
import { allowedImageUrl, imageFilename } from './model.js';
export const DOWNLOAD_LIMITS = { fileBytes: 25 * 1024 * 1024, totalBytes: 200 * 1024 * 1024, files: 500 };
const aborted = signal => {
  if (signal?.aborted) throw new DOMException('Stahování zrušeno.', 'AbortError');
};
export function imageType(bytes) {
  // Binary format offsets count bytes, not decoded UTF-8 characters.
  const head = String.fromCharCode(...bytes.subarray(0, 64));
  if (
    bytes[0] === 137 &&
    head.slice(1, 4) === 'PNG' &&
    bytes[4] === 13 &&
    bytes[5] === 10 &&
    bytes[6] === 26 &&
    bytes[7] === 10
  )
    return 'image/png';
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return 'image/jpeg';
  if (/^GIF8[79]a/.test(head)) return 'image/gif';
  if (head.startsWith('RIFF') && head.slice(8, 12) === 'WEBP') return 'image/webp';
  if (head.startsWith('BM')) return 'image/bmp';
  if (bytes[0] === 0 && bytes[1] === 0 && bytes[2] === 1 && bytes[3] === 0) return 'image/x-icon';
  if (
    (head.startsWith('II') && bytes[2] === 42 && bytes[3] === 0) ||
    (head.startsWith('MM') && bytes[2] === 0 && bytes[3] === 42)
  )
    return 'image/tiff';
  if (head.slice(4, 8) === 'ftyp') {
    const brands = head.slice(8, 64);
    if (/avif|avis/.test(brands)) return 'image/avif';
    if (/heic|heix|hevc|hevx/.test(brands)) return 'image/heic';
    if (/mif1|msf1/.test(brands)) return 'image/heif';
  }
  const xml = new TextDecoder()
    .decode(bytes.subarray(0, 4096))
    .replace(/^\uFEFF/, '')
    .trim()
    .replace(/^<\?xml[^>]*>\s*/i, '')
    .replace(/^(?:<!--[\s\S]*?-->\s*)+/, '')
    .replace(/^<!DOCTYPE\s+svg[^>]*>\s*/i, '');
  if (/^<svg[\s>]/i.test(xml)) return 'image/svg+xml';
  throw new Error('Server nevrátil rozpoznaný obrázek. Může jít o přihlášení nebo chybovou stránku.');
}
/** Public asset fetch, original bytes, bounded memory, abortable even during streaming. */
export async function fetchImage(
  url,
  { signal, fetcher = globalThis.fetch, timeoutMs = 20000, maxBytes = DOWNLOAD_LIMITS.fileBytes } = {}
) {
  if (!allowedImageUrl(url)) throw new Error('Nepodporovaná adresa obrázku.');
  aborted(signal);
  const controller = new AbortController(),
    abort = () => controller.abort();
  let timedOut = false;
  signal?.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(() => {
    timedOut = true;
    abort();
  }, timeoutMs);
  let response, reader;
  try {
    response = await fetcher(url, {
      signal: controller.signal,
      credentials: 'omit',
      redirect: 'follow',
      referrerPolicy: 'no-referrer'
    });
    aborted(controller.signal);
    if (!response.ok) throw new Error('Obrázek vrátil HTTP ' + response.status + '.');
    if (Number(response.headers.get('content-length')) > maxBytes)
      throw new Error('Obrázek překročil limit velikosti pro stažení.');
    if (!response.body) throw new Error('Server vrátil prázdný obrázek.');
    reader = response.body.getReader();
    const chunks = [];
    let size = 0;
    while (true) {
      aborted(controller.signal);
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) throw new Error('Obrázek překročil limit velikosti pro stažení.');
      chunks.push(value);
    }
    aborted(controller.signal);
    if (!size) throw new Error('Server vrátil prázdný obrázek.');
    const blob = new Blob(chunks),
      head = new Uint8Array(await blob.slice(0, 4096).arrayBuffer());
    return new Blob(chunks, { type: imageType(head) });
  } catch (error) {
    aborted(signal);
    if (timedOut) throw new Error('Načtení obrázku překročilo časový limit.');
    throw error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
    if (reader) {
      await reader.cancel().catch(() => {});
      reader.releaseLock();
    } else await response?.body?.cancel().catch(() => {});
  }
}
export async function prepareArchive(
  items,
  {
    signal,
    fetcher = globalThis.fetch,
    maxTotalBytes = DOWNLOAD_LIMITS.totalBytes,
    onProgress = () => {}
  } = {}
) {
  if (!items.length) throw new Error('Vyberte alespoň jeden obrázek.');
  if (items.length > DOWNLOAD_LIMITS.files)
    throw new Error('Do jednoho ZIPu lze vybrat nejvýše 500 obrázků.');
  const zip = new JSZip(),
    used = new Set(),
    failures = [];
  let bytes = 0,
    succeeded = 0;
  // Sequential transfers keep retained image data plus one response bounded.
  for (const [index, item] of items.entries()) {
    aborted(signal);
    onProgress({ phase: 'download', completed: index, total: items.length, item });
    try {
      const remaining = maxTotalBytes - bytes;
      if (remaining <= 0) throw new Error('Dávka překročila limit celkové velikosti ZIPu.');
      const blob = await fetchImage(item.url, {
        signal,
        fetcher,
        maxBytes: Math.min(DOWNLOAD_LIMITS.fileBytes, remaining)
      });
      aborted(signal);
      const name = imageFilename(item.url, blob.type, used, item.outputName);
      zip.file(name, await blob.arrayBuffer(), { binary: true });
      bytes += blob.size;
      succeeded++;
      onProgress({
        phase: 'download',
        completed: index + 1,
        total: items.length,
        item,
        ok: true,
        name,
        bytes: blob.size
      });
    } catch (error) {
      aborted(signal);
      const failure = { url: item.url, reason: error.message };
      failures.push(failure);
      onProgress({
        phase: 'download',
        completed: index + 1,
        total: items.length,
        item,
        ok: false,
        reason: error.message
      });
    }
  }
  aborted(signal);
  if (!succeeded)
    throw new Error('Nepodařilo se stáhnout žádný obrázek. Zkontrolujte chyby u jednotlivých souborů.');
  if (failures.length)
    zip.file(
      '_chyby-stazeni.txt',
      'Obrázky, které nejsou součástí ZIPu:\n\n' +
        failures
          .map(i => (i.url.startsWith('data:') ? 'Vložený obrázek' : i.url) + '\n' + i.reason)
          .join('\n\n')
    );
  const blob = await archiveBlob(zip, signal, onProgress);
  aborted(signal);
  return { blob, succeeded, failures, bytes };
}
function archiveBlob(zip, signal, onProgress) {
  // JSZip's progress callbacks run outside the generation promise. Throwing
  // from them leaves that promise pending, so cancellation owns the stream.
  return new Promise((resolve, reject) => {
    const stream = zip.generateInternalStream({
        type: 'uint8array',
        compression: 'STORE',
        streamFiles: true
      }),
      chunks = [];
    let settled = false;
    const cleanup = () => signal?.removeEventListener('abort', cancel);
    function fail(error) {
      if (settled) return;
      settled = true;
      stream.pause();
      chunks.length = 0;
      cleanup();
      reject(error);
    }
    function cancel() {
      fail(new DOMException('Stahování zrušeno.', 'AbortError'));
    }
    stream.on('data', (chunk, metadata) => {
      if (settled) return;
      chunks.push(chunk);
      try {
        onProgress({ phase: 'zip', percent: Math.round(metadata.percent) });
      } catch (error) {
        fail(error);
      }
    });
    stream.on('error', fail);
    stream.on('end', () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(new Blob(chunks, { type: 'application/zip' }));
    });
    signal?.addEventListener('abort', cancel, { once: true });
    if (signal?.aborted) cancel();
    else stream.resume();
  });
}
/** The shared saver resolves only after Chrome reports a completed download. */
export function saveImageBlob(blob, filename, options = {}) {
  return saveDownload(blob, 'O2-Axolotl/Images/' + filename, options);
}
