const MIME = {'image/webp':'webp','image/png':'png','image/jpeg':'jpeg','image/gif':'gif','image/avif':'avif','image/svg+xml':'svg'};
const MAX_BYTES = 2 * 1024 * 1024;
const PREFIX_BYTES = 512;

function signature(bytes) {
  const text = new TextDecoder().decode(bytes.subarray(0, PREFIX_BYTES));
  if (text.slice(0,4) === 'RIFF' && text.slice(8,12) === 'WEBP') return 'webp';
  if ([137,80,78,71,13,10,26,10].every((byte,index) => bytes[index] === byte)) return 'png';
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return 'jpeg';
  if (/^GIF8[79]a/.test(text)) return 'gif';
  if (text.slice(4,8) === 'ftyp' && /avif|avis/.test(text.slice(8,64))) return 'avif';
  if (/^\s*(?:<\?xml[^>]*>\s*|<!--[\s\S]*?-->\s*)*<svg[\s>]/i.test(text)) return 'svg';
  return null;
}
function declaredFormat(result, response) {
  const mime = response.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
  if (MIME[mime]) Object.assign(result, {format:MIME[mime], declaredFormat:MIME[mime], formatSource:'MIME'});
}
function verify(result, bytes) {
  const format = signature(bytes);
  if (format) Object.assign(result, {format, formatVerified:true, formatSource:'Signatura', formatMismatch:!!result.declaredFormat && result.declaredFormat !== format});
}
function inspectLocal(url) {
  const result = {bytes:null, format:null, formatVerified:false, inspectionStatus:'Neověřeno'};
  if (url.startsWith('blob:')) return {...result, inspectionStatus:'Neověřeno: blob je dostupný jen v kontextu zdrojové stránky'};
  const match = url.match(/^data:(image\/[\w.+-]+)((?:;[^,]*)?),(.*)$/is);
  if (!match || url.length > MAX_BYTES) return result;
  try {
    if (MIME[match[1].toLowerCase()]) {
      result.format = result.declaredFormat = MIME[match[1].toLowerCase()];
      result.formatSource = 'data MIME';
    }
    const prefix = new Uint8Array(PREFIX_BYTES);
    let count = 0;
    const append = bytes => {
      if (count < PREFIX_BYTES) prefix.set(bytes.subarray(0, PREFIX_BYTES - count), count);
      count += bytes.length;
    };
    if (/;base64(?:;|$)/i.test(match[2])) {
      const decoded = atob(match[3].replace(/\s/g, ''));
      count = decoded.length;
      for (let i = 0; i < Math.min(count, PREFIX_BYTES); i++) prefix[i] = decoded.charCodeAt(i);
    } else {
      for (const part of match[3].split(/((?:%[\da-f]{2})+)/i)) {
        if (/^(?:%[\da-f]{2})+$/i.test(part)) append(Uint8Array.from(part.match(/[\da-f]{2}/gi), hex => parseInt(hex,16)));
        else append(new TextEncoder().encode(part));
      }
    }
    result.bytes = count;
    result.sizeSource = 'Vložená data';
    verify(result, prefix.subarray(0, Math.min(count, PREFIX_BYTES)));
    result.inspectionStatus = result.formatVerified ? 'Vložený obsah ověřen' : 'Vložený obsah: formát neověřen';
  } catch { result.inspectionStatus = 'Neověřeno: neplatná vložená data'; }
  return result;
}
function resourceKey(url) {
  try {
    const parsed = new URL(url);
    if (!['http:','https:'].includes(parsed.protocol) || parsed.username || parsed.password) return null;
    parsed.hash = '';
    return parsed.href;
  } catch { return null; }
}

export async function probeImageResources(snapshot, {signal, fetchImpl = fetch, deadlineMs = 25000, requestTimeoutMs = 5000} = {}) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, {once:true});
  if (signal?.aborted) abort();
  const timer = setTimeout(abort, deadlineMs);
  const knownSizes = new Map();
  for (const item of snapshot.items || []) if (item.bytes > 0) {
    const key = resourceKey(item.url);
    knownSizes.set(key, Math.max(knownSizes.get(key) || 0, item.bytes));
  }
  const urls = [...new Set((snapshot.items || []).map(item => item.url))];
  const networkUrls = [...new Set(urls.map(resourceKey).filter(Boolean))];
  const selected = networkUrls.slice(0, 500), results = new Map();
  let next = 0, completed = 0;
  for (const url of urls) if (!resourceKey(url)) { results.set(url, inspectLocal(url || '')); completed++; }

  async function request(url, options, read) {
    const local = new AbortController();
    const stop = () => local.abort();
    controller.signal.addEventListener('abort', stop, {once:true});
    if (controller.signal.aborted) stop();
    let rejectAbort;
    const aborted = new Promise((_,reject) => {
      rejectAbort = () => reject(new Error('timeout/abort'));
      local.signal.addEventListener('abort', rejectAbort, {once:true});
      if (local.signal.aborted) rejectAbort();
    });
    const timeout = setTimeout(stop, requestTimeoutMs);
    try {
      if (local.signal.aborted) throw new Error('timeout/abort');
      return await Promise.race([(async () => {
        const response = await fetchImpl(url, {...options, signal:local.signal, credentials:'omit', redirect:'follow'});
        return read ? await read(response) : response;
      })(), aborted]);
    } finally {
      clearTimeout(timeout);
      controller.signal.removeEventListener('abort', stop);
      local.signal.removeEventListener('abort', rejectAbort);
    }
  }
  async function inspect(url) {
    const result = {bytes:null, format:null, formatVerified:false, inspectionStatus:'Neověřeno'};
    try {
      // Some servers reject HEAD or apply different CORS rules to it. A failed
      // metadata request must not suppress the bounded content request.
      try {
        const head = await request(url, {method:'HEAD'});
        if (head.ok) {
          const size = Number(head.headers.get('content-length'));
          if (Number.isFinite(size) && size > 0) {
            result.bytes = size;
            result.sizeSource = head.headers.get('content-encoding') ? 'Content-Length (komprimovaný přenos)' : 'Content-Length';
          }
          declaredFormat(result, head);
        }
      } catch {
        if (controller.signal.aborted) throw new Error('abort');
      }
      if (!(result.bytes > MAX_BYTES) && !(knownSizes.get(url) > MAX_BYTES)) {
        await request(url, {method:'GET', headers:{Range:'bytes=0-511'}}, async response => {
          if (!response.ok) return;
          declaredFormat(result, response);
          const range = response.headers.get('content-range')?.match(/^bytes\s+(\d+)-(\d+)\/(\d+|\*)$/i);
          if (range && Number(range[3]) > 0) { result.bytes = Number(range[3]); result.sizeSource = 'Content-Range'; }
          else if (response.status === 200) {
            const size = Number(response.headers.get('content-length'));
            if (Number.isFinite(size) && size > 0) { result.bytes = size; result.sizeSource = 'Content-Length'; }
          }
          if (result.bytes > MAX_BYTES || (response.status === 206 && (!range || Number(range[1]) !== 0))) {
            await response.body?.cancel?.();
            return;
          }
          const reader = response.body?.getReader();
          if (!reader) return;
          try {
            const bytes = new Uint8Array(PREFIX_BYTES);
            let length = 0;
            while (length < PREFIX_BYTES) {
              const chunk = await reader.read();
              if (chunk.done) break;
              if (!chunk.value?.length) continue;
              const part = chunk.value.subarray(0, PREFIX_BYTES - length);
              bytes.set(part, length);
              length += part.length;
              // Stop as soon as the prefix is decisive, even when the server
              // ignored Range; otherwise join short chunks up to 512 bytes.
              if (signature(bytes.subarray(0, length))) break;
            }
            verify(result, bytes.subarray(0, length));
          } finally { await reader.cancel().catch(() => {}); }
        });
      }
      result.inspectionStatus = result.formatVerified ? 'Obsah ověřen' : result.declaredFormat ? 'Formát deklarovaný serverem; obsah neověřen' : 'Částečně ověřeno';
    } catch { result.inspectionStatus = controller.signal.aborted ? 'Přerušeno' : 'Neověřeno (síť / oprávnění / časový limit)'; }
    return result;
  }
  try {
    await Promise.all(Array.from({length:Math.min(4, selected.length)}, async () => {
      while (next < selected.length && !controller.signal.aborted) {
        const url = selected[next++];
        results.set(url, await inspect(url));
        completed++;
      }
    }));
  } finally { clearTimeout(timer); signal?.removeEventListener('abort', abort); }
  return {...snapshot,
    items:(snapshot.items || []).map(item => {
      const result = results.get(resourceKey(item.url) || item.url) || {bytes:null, inspectionStatus:'Neověřeno'};
      return {...item, ...result, bytes:item.bytes > 0 ? item.bytes : result.bytes, sizeSource:item.bytes > 0 ? item.sizeSource : result.sizeSource};
    }),
    inspection:{total:networkUrls.length + urls.filter(url => !resourceKey(url)).length, completed, cap:500, truncated:networkUrls.length > 500, aborted:controller.signal.aborted},
    truncated:snapshot.truncated || networkUrls.length > 500
  };
}
