/** Header inspection only. Browser decoding remains the final validity check. */
export function inspectImage(input) {
  const b = input instanceof Uint8Array ? input : new Uint8Array(input);
  const v = new DataView(b.buffer, b.byteOffset, b.byteLength);
  const text = (at, length) => String.fromCharCode(...b.subarray(at, at + length));
  const bad = () => {
    throw new Error(
      'Nepodporovaný nebo poškozený obrázek. Použijte PNG, JPG, WebP, AVIF, BMP nebo neanimovaný GIF.'
    );
  };
  const result = (mime, width = null, height = null, animated = false) => ({ mime, width, height, animated });
  if (b.length < 12) return bad();
  if (text(0, 8) === '\x89PNG\r\n\x1a\n') {
    if (b.length < 33 || text(12, 4) !== 'IHDR') return bad();
    let animated = false;
    for (let p = 8; p + 8 <= b.length; ) {
      const len = v.getUint32(p);
      if (len > b.length - p - 12) return bad();
      if (text(p + 4, 4) === 'acTL') animated = true;
      p += len + 12;
    }
    return result('image/png', v.getUint32(16), v.getUint32(20), animated);
  }
  if (b[0] === 255 && b[1] === 216) {
    for (let p = 2; p + 4 <= b.length; ) {
      if (b[p++] !== 255) return bad();
      while (b[p] === 255) p++;
      const marker = b[p++];
      if (marker === 217 || marker === 218) break;
      if (marker === 1 || (marker >= 208 && marker <= 215)) continue;
      if (p + 2 > b.length) return bad();
      const len = v.getUint16(p);
      if (len < 2 || p + len > b.length) return bad();
      if ([192, 193, 194, 195, 197, 198, 199, 201, 202, 203, 205, 206, 207].includes(marker)) {
        if (len < 8) return bad();
        return result('image/jpeg', v.getUint16(p + 5), v.getUint16(p + 3));
      }
      p += len;
    }
    return bad();
  }
  if (text(0, 2) === 'BM') {
    if (b.length < 26) return bad();
    const header = v.getUint32(14, true);
    if (header === 12) return result('image/bmp', v.getUint16(18, true), v.getUint16(20, true));
    if (header < 40 || b.length < 54) return bad();
    return result('image/bmp', v.getInt32(18, true), Math.abs(v.getInt32(22, true)));
  }
  if (['GIF87a', 'GIF89a'].includes(text(0, 6))) {
    if (b.length < 13) return bad();
    let p = 13,
      frames = 0;
    if (b[10] & 128) p += 3 * 2 ** ((b[10] & 7) + 1);
    const blocks = () => {
      while (p < b.length) {
        const size = b[p++];
        if (!size) return;
        p += size;
        if (p > b.length) return bad();
      }
      return bad();
    };
    while (p < b.length) {
      const marker = b[p++];
      if (marker === 59) break;
      if (marker === 33) {
        if (p >= b.length) return bad();
        p++;
        blocks();
        continue;
      }
      if (marker !== 44 || p + 9 > b.length) return bad();
      frames++;
      if (frames > 1) return result('image/gif', v.getUint16(6, true), v.getUint16(8, true), true);
      const flags = b[p + 8];
      p += 9;
      if (flags & 128) p += 3 * 2 ** ((flags & 7) + 1);
      if (p >= b.length) return bad();
      p++;
      blocks();
    }
    if (!frames) return bad();
    return result('image/gif', v.getUint16(6, true), v.getUint16(8, true));
  }
  if (text(0, 4) === 'RIFF' && text(8, 4) === 'WEBP') {
    let width = null,
      height = null,
      animated = false,
      found = false;
    const u24 = p => b[p] | (b[p + 1] << 8) | (b[p + 2] << 16);
    for (let p = 12; p + 8 <= b.length; ) {
      const chunk = text(p, 4),
        len = v.getUint32(p + 4, true),
        data = p + 8;
      if (len > b.length - data) return bad();
      if (chunk === 'VP8X' && len >= 10) {
        animated = !!(b[data] & 2);
        width = 1 + u24(data + 4);
        height = 1 + u24(data + 7);
        found = true;
      }
      if (chunk === 'ANIM' || chunk === 'ANMF') animated = true;
      if (chunk === 'VP8L' && len >= 5 && b[data] === 47) {
        const bits = v.getUint32(data + 1, true);
        width = (bits & 16383) + 1;
        height = ((bits >>> 14) & 16383) + 1;
        found = true;
      }
      if (chunk === 'VP8 ' && len >= 10 && text(data + 3, 3) === '\x9d\x01\x2a') {
        width = v.getUint16(data + 6, true) & 16383;
        height = v.getUint16(data + 8, true) & 16383;
        found = true;
      }
      p = data + len + (len & 1);
    }
    if (!found) return bad();
    return result('image/webp', width, height, animated);
  }
  if (text(4, 4) === 'ftyp') {
    const size = v.getUint32(0);
    if (size < 16 || size > b.length) return bad();
    const brands = [text(8, 4)];
    for (let p = 16; p + 4 <= size; p += 4) brands.push(text(p, 4));
    if (brands.includes('avif') || brands.includes('avis'))
      return result('image/avif', null, null, brands.includes('avis'));
  }
  return bad();
}
