export const LIMITS = {
  fileBytes: 50 * 1024 * 1024,
  batchBytes: 250 * 1024 * 1024,
  outputBytes: 250 * 1024 * 1024,
  files: 100,
  pixels: 32000000,
  side: 16383
};
export const ACCEPT =
  '.png,.jpg,.jpeg,.webp,.avif,.bmp,.gif,image/png,image/jpeg,image/webp,image/avif,image/bmp,image/gif';
export function makeOptions({ lossless = true, quality = 95 } = {}) {
  if (typeof lossless !== 'boolean') throw new Error('Neplatný režim kvality.');
  const q = Number(quality);
  if (!Number.isFinite(q) || q < 1 || q > 100) throw new Error('Kvalita musí být od 1 do 100.');
  return { lossless, quality: Math.round(q) };
}
export function validateFile(file) {
  if (!file?.size) throw new Error('Soubor je prázdný.');
  if (file.size > LIMITS.fileBytes) throw new Error('Soubor překračuje limit 50 MB.');
}
export function validateDimensions(width, height) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1)
    throw new Error('Obrázek má neplatné rozměry.');
  if (width > LIMITS.side || height > LIMITS.side)
    throw new Error('WebP dovoluje nejvýše 16383 px na každé straně.');
  if (width * height > LIMITS.pixels)
    throw new Error('Obrázek překračuje limit 32 Mpx. Zmenšete jej před nahráním.');
}
export function outputFilename(input, used = new Set()) {
  let base =
    String(input || 'obrazek')
      .split(/[\\/]/)
      .pop()
      .normalize('NFC')
      .replace(/\.[^.]*$/, '')
      .replace(/[\x00-\x1f\x7f<>:"/\\|?*]/g, '-')
      .replace(/^[.\s]+|[.\s]+$/g, '')
      .slice(0, 150) || 'obrazek';
  if (/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\.|$)/i.test(base)) base = '_' + base;
  let name = base + '.webp',
    n = 2;
  while (used.has(name.toLowerCase())) name = `${base}-${n++}.webp`;
  used.add(name.toLowerCase());
  return name;
}
export function sizeLabel(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024)
    return (bytes / 1024).toLocaleString('cs-CZ', { maximumFractionDigits: 1 }) + ' kB';
  return (bytes / (1024 * 1024)).toLocaleString('cs-CZ', { maximumFractionDigits: 2 }) + ' MB';
}
export function sizeChange(before, after) {
  const pct = Math.round((Math.abs(before - after) / before) * 100);
  return after < before
    ? 'O ' + pct + ' % menší'
    : after > before
      ? 'O ' + pct + ' % větší'
      : 'Stejná velikost';
}
