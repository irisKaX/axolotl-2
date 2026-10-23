import { safeFilename } from '../../../../../browser-extension/shared/utils.js';
const extensions = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/svg+xml': 'svg',
  'image/bmp': 'bmp',
  'image/x-icon': 'ico',
  'image/vnd.microsoft.icon': 'ico',
  'image/tiff': 'tif',
  'image/heic': 'heic',
  'image/heif': 'heif'
};
export function allowedImageUrl(value) {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return (
      !url.username &&
      !url.password &&
      (['http:', 'https:'].includes(url.protocol) ||
        (/^data:image\/(?:png|jpeg|gif|webp|avif|svg\+xml|bmp|x-icon|vnd.microsoft.icon)[;,]/i.test(value) &&
          value.length <= 2 * 1024 * 1024))
    );
  } catch {
    return false;
  }
}
export function filterImages(
  items,
  { query = '', format = '', minWidth = 0, minHeight = 0, variants = false } = {}
) {
  const needle = query.trim().toLocaleLowerCase('cs');
  return items.filter(
    item =>
      (variants || !item.variant) &&
      (!format || item.format === format) &&
      (!needle || [item.name, item.alt, item.url].join(' ').toLocaleLowerCase('cs').includes(needle)) &&
      (!item.width || item.width >= minWidth) &&
      (!item.height || item.height >= minHeight)
  );
}
export function imageFilename(url, type, used = new Set(), preferredName = '') {
  let name = 'obrazek';
  try {
    if (!url.startsWith('data:'))
      name = decodeURIComponent(new URL(url).pathname.split('/').pop() || 'obrazek');
  } catch {}
  name = safeFilename(preferredName || name, 'obrazek').normalize('NFC');
  const extension = extensions[type] || 'img';
  let base =
    name
      .replace(/\.(?:jpe?g|png|gif|webp|avif|svg|bmp|ico|tiff?|heic|heif)$/i, '')
      .replace(/^[.\s]+|[.\s]+$/g, '')
      .slice(0, 140) || 'obrazek';
  base = safeFilename(base, 'obrazek');
  let filename = base + '.' + extension,
    n = 2;
  while (used.has(filename.toLocaleLowerCase('cs'))) filename = `${base}-${n++}.${extension}`;
  used.add(filename.toLocaleLowerCase('cs'));
  return filename;
}
