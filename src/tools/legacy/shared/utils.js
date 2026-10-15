/** Pure helpers shared by the dashboard and the service worker. */
export function normalizeHttpUrl(value, base) {
  if (typeof value !== 'string') return null;
  const input = value.trim().replace(/&amp;/gi, '&');
  if (!input || input.startsWith('#')) return null;
  try {
    const url = new URL(input, base);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return null;
    url.hash = '';
    return url.href;
  } catch {
    return null;
  }
}

export function supportedUrl(value) {
  const normalized = normalizeHttpUrl(value);
  if (!normalized) return false;
  const url = new URL(normalized);
  return !(
    url.hostname === 'chromewebstore.google.com' ||
    (url.hostname === 'chrome.google.com' && url.pathname.startsWith('/webstore')) ||
    (url.hostname === 'microsoftedge.microsoft.com' && url.pathname.startsWith('/addons'))
  );
}

export function safeFilename(value, fallback = 'dokument.pdf') {
  let name = String(value || '')
    .split(/[\\/]/)
    .pop()
    .replace(/[<>:"|?*\x00-\x1f\x7f]/g, '_')
    .trim()
    .replace(/[ .]+$/g, '');
  if (!name || name === '.' || name === '..') name = fallback;
  if (/^(con|prn|aux|nul|com[0-9]|lpt[0-9])(?:\.|$)/i.test(name)) name = '_' + name;
  if (name.length > 160) {
    const suffix = /\.[a-z0-9]{1,6}$/i.exec(name)?.[0] || '';
    name = name.slice(0, 160 - suffix.length) + suffix;
  }
  return name;
}

/** Scroll offsets which cover a document-space region, including a clamped last tile. */
export function capturePositions(start, length, viewport, total) {
  if (
    ![start, length, viewport, total].every(Number.isFinite) ||
    start < 0 ||
    length <= 0 ||
    viewport <= 0 ||
    total <= 0
  )
    throw new Error('Neplatné rozměry snímku.');
  const max = Math.max(0, total - viewport);
  const out = [Math.min(start, max)];
  while (out.at(-1) + viewport < start + length - 0.5) {
    const next = Math.min(out.at(-1) + viewport, max);
    if (next <= out.at(-1)) break;
    out.push(next);
    if (out.length > 120) throw new Error('Stránka je pro jeden snímek příliš dlouhá. Vyberte menší prvek.');
  }
  return out;
}

export const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
export function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return 'Nezjištěno';
  return bytes < 1024
    ? `${bytes} B`
    : bytes < 1048576
      ? `${(bytes / 1024).toFixed(1)} kB`
      : `${(bytes / 1048576).toFixed(1)} MB`;
}
export function timestamp() {
  return new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
}
