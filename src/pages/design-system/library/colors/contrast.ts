type RGB = [number, number, number];
/** Only opaque sRGB HEX / hsla / computed rgb. Unsupported syntax fails closed. */
function rgb(css: string): RGB | null {
  if (/^#[\da-f]{6}$/i.test(css))
    return [1, 3, 5].map((i) => parseInt(css.slice(i, i + 2), 16) / 255) as RGB;
  const native = css.match(/^rgb\(\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)\s*\)$/);
  if (native)
    return native
      .slice(1)
      .map(Number)
      .map((n) => n / 255) as RGB;
  const hsl = css.match(
    /^hsla\(\s*([\d.]+),\s*([\d.]+)%,\s*([\d.]+)%,\s*1\s*\)$/,
  );
  if (!hsl) return null;
  const h = Number(hsl[1]) / 60,
    s = Number(hsl[2]) / 100,
    l = Number(hsl[3]) / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s,
    x = c * (1 - Math.abs((h % 2) - 1)),
    m = l - c / 2;
  const channels =
    h < 1
      ? [c, x, 0]
      : h < 2
        ? [x, c, 0]
        : h < 3
          ? [0, c, x]
          : h < 4
            ? [0, x, c]
            : h < 5
              ? [x, 0, c]
              : [c, 0, x];
  return channels.map((n) => n + m) as RGB;
}
function luminance(color: RGB) {
  const channels = color.map((c) =>
    c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  );
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}
const ratio = (a: number, b: number) =>
  (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
/** Conservative luminance interval: includes every sRGB interpolated point,
 * not just stops. Wider than the exact path, so uncertain text is withheld. */
function range(css: string): [number, number] | null {
  const solid = rgb(css);
  if (solid) return [luminance(solid), luminance(solid)];
  if (!css.startsWith("linear-gradient(")) return null;
  const tokens = css.match(/#[\da-f]{6}\b|hsla\([^)]*\)/gi) || [];
  // Reject unknown colors, transparency, custom interpolation, and short HEX.
  const remainder = css
    .replace(/#[\da-f]{6}\b|hsla\([^)]*\)/gi, "")
    .replace(/^linear-gradient\(/, "")
    .replace(/to (right|left|top|bottom)|deg/g, "");
  if (tokens.length < 2 || /[^\d\s.,%()+-]/.test(remainder)) return null;
  const stops = tokens.map(rgb);
  if (stops.some((c) => !c)) return null;
  const colors = stops as RGB[];
  const lo = [0, 1, 2].map((i) => Math.min(...colors.map((c) => c[i]))) as RGB;
  const hi = [0, 1, 2].map((i) => Math.max(...colors.map((c) => c[i]))) as RGB;
  return [luminance(lo), luminance(hi)];
}
export function textContrast(paint: string, background: string): number {
  const interval = range(paint),
    surface = rgb(background);
  if (!interval || !surface) return 1;
  const l = luminance(surface),
    [lo, hi] = interval;
  return l >= lo && l <= hi ? 1 : Math.min(ratio(l, lo), ratio(l, hi));
}
export function paintInk(css: string) {
  const dark = "#101014",
    light = "#FFFFFF";
  const darkRatio = textContrast(css, dark),
    lightRatio = textContrast(css, light);
  const color = darkRatio >= lightRatio ? dark : light;
  const minimum = Math.max(darkRatio, lightRatio);
  return {
    color: minimum >= 4.5 ? color : dark,
    minimum,
    backing: minimum < 4.5,
  };
}
