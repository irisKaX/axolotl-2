import { inspectImage } from './inspect.js';
import { validateFile, validateDimensions, makeOptions } from './policy.js';
import { createEncoder } from './codec.js';

let loading;
function encoder() {
  loading ||= fetch(new URL('../../vendor/webp/webp_codec.wasm', import.meta.url))
    .then(response => {
      if (!response.ok) throw new Error('Chybí lokální enkodér WebP. Znovu rozbalte celý ZIP rozšíření.');
      return response.arrayBuffer();
    })
    .then(createEncoder);
  return loading;
}
self.onmessage = async ({ data: { id, file, options } }) => {
  let bitmap, canvas;
  const phase = text => self.postMessage({ id, phase: text });
  try {
    validateFile(file);
    const settings = makeOptions(options);
    const bytes = await file.arrayBuffer(),
      info = inspectImage(bytes);
    if (info.animated)
      throw new Error(
        'Animované obrázky zatím nepřevádíme. Animace by se ztratila; použijte statický obrázek.'
      );
    if (info.width != null) validateDimensions(info.width, info.height);
    phase('Načítám obrazová data');
    try {
      bitmap = await createImageBitmap(new Blob([bytes], { type: info.mime }), {
        imageOrientation: 'from-image',
        premultiplyAlpha: 'none'
      });
    } catch {
      throw new Error(
        'Prohlížeč tento obrázek nedokáže přečíst. Soubor může být poškozený nebo v nepodporované variantě formátu.'
      );
    }
    const { width, height } = bitmap;
    validateDimensions(width, height);
    canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext('2d', { willReadFrequently: true, colorSpace: 'srgb' });
    if (!context) throw new Error('Prohlížeč nepodporuje zpracování obrázků na pozadí.');
    context.drawImage(bitmap, 0, 0);
    const pixels = context.getImageData(0, 0, width, height);
    phase(settings.lossless ? 'Převádím bezztrátově' : 'Převádím do WebP');
    const encode = await encoder(),
      result = encode(pixels, settings);
    const factor = Math.min(1, 180 / width, 120 / height),
      preview = new OffscreenCanvas(
        Math.max(1, Math.round(width * factor)),
        Math.max(1, Math.round(height * factor))
      );
    preview.getContext('2d').drawImage(bitmap, 0, 0, preview.width, preview.height);
    const thumbnail = await preview.convertToBlob({ type: 'image/png' });
    self.postMessage({ id, result: { buffer: result.buffer, width, height, thumbnail } }, [result.buffer]);
  } catch (error) {
    self.postMessage({ id, error: error.message || 'Převod obrázku selhal.' });
  } finally {
    bitmap?.close();
    if (canvas) {
      canvas.width = 1;
      canvas.height = 1;
    }
  }
};
