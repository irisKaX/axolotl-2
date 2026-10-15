import { qrcodegen } from '../../vendor/qrcodegen/qrcodegen.js';

export const QR_SIZES = [256, 512, 1024];
export const MAX_BYTES = 2000;
const BORDER = 4;

function content(value, kind) {
  if (typeof value !== 'string' || !value.trim()) throw new Error('Zadejte odkaz nebo textový obsah.');
  if (kind === 'text') return value;
  if (kind !== 'url') throw new Error('Neznámý typ QR kódu.');
  const text = value.trim();
  try {
    if (/[\u0000-\u0020\u007f]/.test(text)) throw new Error();
    // A domain or localhost followed by a numeric port is not a URI scheme.
    const hostWithPort = /^(?:localhost|[^\s:/?#]+\.[^\s:/?#]+):\d+(?:[/?#]|$)/i.test(text);
    const hasScheme = !hostWithPort && /^[a-z][a-z\d+.-]*:/i.test(text);
    const url = new URL(hasScheme ? text : 'https://' + text);
    if (!['https:', 'http:'].includes(url.protocol) || !url.hostname) throw new Error();
    return url.href;
  } catch {
    throw new Error('Zadejte platný webový odkaz (http:// nebo https://).');
  }
}

function validateColor(color) {
  if (typeof color !== 'string' || !/^#[a-f\d]{6}$/i.test(color))
    throw new Error('Barva musí mít formát #RRGGBB.');
  return color.toLowerCase();
}
function rgb(color) { return color.slice(1).match(/../g).map(hex => parseInt(hex, 16)); }
function luminance(channels) {
  const linear = channels.map(value => {
    const c = value / 255;
    return c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4;
  });
  return linear[0] * .2126 + linear[1] * .7152 + linear[2] * .0722;
}
function normalizeBackground(value) {
  if (!value || typeof value !== 'object') throw new Error('Neplatné nastavení pozadí.');
  if (value.type === 'transparent') return { type: 'transparent' };
  if (!['solid', 'gradient'].includes(value.type)) throw new Error('Neznámý typ pozadí.');
  const background = { type: value.type, color: validateColor(value.color) };
  if (value.type === 'gradient') {
    background.colorEnd = validateColor(value.colorEnd);
    if (typeof value.angle !== 'number' || !Number.isFinite(value.angle))
      throw new Error('Úhel gradientu musí být číslo.');
    background.angle = ((value.angle % 360) + 360) % 360;
  }
  return background;
}
function validateContrast(color, background) {
  // The final surface of transparent exports is chosen outside the app.
  if (background.type === 'transparent') return;
  const foreground = luminance(rgb(color)), start = rgb(background.color),
    end = rgb(background.colorEnd || background.color);
  // Sample the entire sRGB ramp, including potentially darker interior mixes.
  for (let step = 0; step <= 256; step++) {
    const back = luminance(start.map((value, i) => value + (end[i] - value) * step / 256));
    const contrast = (Math.max(foreground, back) + .05) / (Math.min(foreground, back) + .05);
    if (contrast < 4.5) throw new Error('Barva kódu a pozadí mají malý kontrast. Změňte barvu kódu nebo zesvětlete či ztmavte pozadí.');
  }
}
function gradientLine(angle) {
  const radians = angle * Math.PI / 180, dx = Math.sin(radians), dy = -Math.cos(radians),
    extent = Math.abs(dx) + Math.abs(dy);
  return [.5 - dx * extent / 2, .5 - dy * extent / 2, .5 + dx * extent / 2, .5 + dy * extent / 2];
}

export function createQr(value, { kind = 'url', size = 512, color = '#000000', background = { type: 'solid', color: '#ffffff' } } = {}) {
  if (!QR_SIZES.includes(size)) throw new Error('Zvolte velikost 256, 512 nebo 1024 px.');
  const foreground = validateColor(color),
    backdrop = normalizeBackground(background),
    text = content(value, kind);
  validateContrast(foreground, backdrop);
  const bytes = new TextEncoder().encode(text);
  if (bytes.length > MAX_BYTES)
    throw new Error(
      `Obsah je příliš dlouhý. Maximum je ${MAX_BYTES} bajtů; diakritika a emoji zabírají více místa.`
    );
  const { QrCode, QrSegment } = qrcodegen;
  // Explicit UTF-8 ECI preserves non-ASCII text even in readers defaulting to Latin-1.
  const segments = /^[\x00-\x7f]*$/.test(text)
    ? QrSegment.makeSegments(text)
    : [QrSegment.makeEci(26), QrSegment.makeBytes(Array.from(bytes))];
  const symbol = QrCode.encodeSegments(segments, QrCode.Ecc.MEDIUM);
  const modules = symbol.size + BORDER * 2;
  const scale = Math.floor(size / modules);
  if (scale < 2) throw new Error('Pro tento obsah zvolte větší velikost obrázku nebo text zkraťte.');
  return { text, bytes: bytes.length, size, color: foreground, background: backdrop, symbol, modules, scale };
}

export function paintQr(ctx, qr) {
  ctx.clearRect(0, 0, qr.size, qr.size);
  if (qr.background.type !== 'transparent') {
    if (qr.background.type === 'gradient') {
      const gradient = ctx.createLinearGradient(...gradientLine(qr.background.angle).map(v => v * qr.size));
      gradient.addColorStop(0, qr.background.color);
      gradient.addColorStop(1, qr.background.colorEnd);
      ctx.fillStyle = gradient;
    } else ctx.fillStyle = qr.background.color;
    ctx.fillRect(0, 0, qr.size, qr.size);
  }
  ctx.fillStyle = qr.color;
  // Integer pixels preserve crisp modules; the four-module quiet zone stays clear.
  const offset = Math.floor((qr.size - qr.symbol.size * qr.scale) / 2);
  for (let y = 0; y < qr.symbol.size; y++)
    for (let x = 0; x < qr.symbol.size; x++) {
      if (qr.symbol.getModule(x, y))
        ctx.fillRect(offset + x * qr.scale, offset + y * qr.scale, qr.scale, qr.scale);
    }
}

export function toSvg(qr) {
  const paths = [], offset = Math.floor((qr.size - qr.symbol.size * qr.scale) / 2);
  for (let y = 0; y < qr.symbol.size; y++)
    for (let x = 0; x < qr.symbol.size; x++) {
      if (qr.symbol.getModule(x, y)) paths.push(`M${offset + x * qr.scale},${offset + y * qr.scale}h${qr.scale}v${qr.scale}h-${qr.scale}z`);
    }
  let backdrop = '';
  if (qr.background.type === 'solid') backdrop = `<rect width="100%" height="100%" fill="${qr.background.color}"/>`;
  if (qr.background.type === 'gradient') {
    const [x1,y1,x2,y2] = gradientLine(qr.background.angle).map(v => +(v * qr.size).toFixed(5));
    backdrop = `<defs><linearGradient id="qr-background" gradientUnits="userSpaceOnUse" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" color-interpolation="sRGB"><stop stop-color="${qr.background.color}"/><stop offset="1" stop-color="${qr.background.colorEnd}"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#qr-background)"/>`;
  }
  // Payload never enters markup. All attributes use normalized settings only.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${qr.size}" height="${qr.size}" viewBox="0 0 ${qr.size} ${qr.size}" shape-rendering="crispEdges">${backdrop}<path fill="${qr.color}" d="${paths.join('')}"/></svg>`;
}
