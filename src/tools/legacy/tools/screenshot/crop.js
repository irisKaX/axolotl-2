const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export function pointOnImage(clientX, clientY, bounds, size) {
  return {
    x: clamp(((clientX - bounds.left) / bounds.width) * size.width, 0, size.width),
    y: clamp(((clientY - bounds.top) / bounds.height) * size.height, 0, size.height)
  };
}
export function cropFromPoints(a, b, size) {
  const x = clamp(Math.floor(Math.min(a.x, b.x)), 0, size.width - 1),
    y = clamp(Math.floor(Math.min(a.y, b.y)), 0, size.height - 1);
  return {
    x,
    y,
    width: Math.max(1, clamp(Math.ceil(Math.max(a.x, b.x)), 0, size.width) - x),
    height: Math.max(1, clamp(Math.ceil(Math.max(a.y, b.y)), 0, size.height) - y)
  };
}
export function validateCrop(rect, size) {
  if (!rect || !['x', 'y', 'width', 'height'].every(key => Number.isSafeInteger(rect[key])))
    throw new Error('Zadejte celé hodnoty v pixelech.');
  const { x, y, width, height } = rect;
  if (x < 0 || y < 0 || width < 1 || height < 1 || x + width > size.width || y + height > size.height)
    throw new Error(`Výřez musí být uvnitř snímku ${size.width} × ${size.height} px.`);
  return { x, y, width, height };
}
export async function cropPng(source, rect) {
  const area = validateCrop(rect, source),
    image = await createImageBitmap(source.blob);
  try {
    if (image.width !== source.width || image.height !== source.height)
      throw new Error('Rozměry snímku se změnily. Otevřete ořez znovu.');
    const canvas = document.createElement('canvas');
    canvas.width = area.width;
    canvas.height = area.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Prohlížeč nepovolil vytvoření výřezu.');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, area.width, area.height);
    const blob = await new Promise((resolve, reject) =>
      canvas.toBlob(
        value => (value ? resolve(value) : reject(new Error('Výřez se nepodařilo uložit.'))),
        'image/png'
      )
    );
    return { blob, width: area.width, height: area.height };
  } finally {
    image.close();
  }
}
