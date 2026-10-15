import { makeOptions, validateDimensions } from './policy.js';

/** Small adapter for the pinned libwebp binary. Runs only inside a worker in UI.
 * Export/import ABI and provenance are documented in vendor/webp/README.md.
 */
export async function createEncoder(binary) {
  let api;
  const fail = () => {
    throw new Error('Enkodér WebP nemá dost paměti nebo převod selhal. Zkuste menší obrázek.');
  };
  const imports = {
    a: {
      a: () => 0, // libwebp does not install interval timers
      b: requested => {
        const size = requested >>> 0,
          cap = 768 * 1024 * 1024;
        if (!api || size > cap) return 0;
        const current = api.f.buffer.byteLength;
        const target = Math.min(cap, Math.max(size, Math.ceil(current * 1.2)));
        try {
          api.f.grow(Math.ceil((target - current) / 65536));
          return 1;
        } catch {
          return 0;
        }
      },
      c: fail,
      d: () => {},
      e: fail
    }
  };
  const { instance } = await WebAssembly.instantiate(binary, imports);
  api = instance.exports;
  api.g();
  return function encode({ data, width, height }, options) {
    validateDimensions(width, height);
    if (
      !(data instanceof Uint8Array || data instanceof Uint8ClampedArray) ||
      data.byteLength !== width * height * 4
    )
      throw new Error('Nesouhlasí délka pixelových dat.');
    const settings = makeOptions(options);
    let input = 0,
      size = 0,
      output = 0;
    try {
      input = api.k(data.byteLength);
      size = api.k(4);
      if (!input || !size) fail();
      new Uint8Array(api.f.buffer).set(data, input);
      new DataView(api.f.buffer).setUint32(size, 0, true);
      output = api.h(input, width, height, settings.quality, settings.lossless ? 1 : 0, size);
      const length = new DataView(api.f.buffer).getUint32(size, true);
      if (!output || !length) fail();
      return new Uint8Array(api.f.buffer, output, length).slice();
    } finally {
      if (output) api.j(output);
      if (size) api.l(size);
      if (input) api.l(input);
    }
  };
}
