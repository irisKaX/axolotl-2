import { capturePositions, sleep } from '../../shared/utils.js';
const LIMIT_PIXELS = 40000000,
  LIMIT_SIDE = 32760;
function validateSize(width, height) {
  if (width < 1 || height < 1 || width > LIMIT_SIDE || height > LIMIT_SIDE || width * height > LIMIT_PIXELS)
    throw new Error(
      'Snímek je příliš velký. Limit je 40 milionů pixelů a 32 760 px na stranu. Vyberte menší prvek nebo zmenšete zoom stránky.'
    );
}
function abortCheck(signal) {
  if (signal?.aborted) throw new Error('Snímání bylo zrušeno.');
}
export async function captureImage(
  request,
  mode,
  selectionId,
  onProgress,
  signal,
  createCanvas = () => document.createElement('canvas')
) {
  let setup = null,
    canvas = null;
  try {
    abortCheck(signal);
    setup = await request('CAPTURE_BEGIN', { mode, selectionId });
    const { token, metrics: original, region } = setup;
    validateSize(Math.ceil(region.width * original.dpr), Math.ceil(region.height * original.dpr));
    const xs = region.viewportOnly
      ? [original.x]
      : capturePositions(region.x, region.width, original.viewportWidth, original.width);
    const ys = region.viewportOnly
      ? [original.y]
      : capturePositions(region.y, region.height, original.viewportHeight, original.height);
    const count = xs.length * ys.length;
    if (count > 60) throw new Error('Stránka vyžaduje více než 60 záběrů. Vyberte menší prvek.');
    let index = 0,
      scale = 1,
      ctx;
    for (const y of ys)
      for (const x of xs) {
        abortCheck(signal);
        onProgress({ index, count });
        const position = await request('CAPTURE_SCROLL', {
          token,
          x,
          y,
          hideFixed: mode === 'element' || (mode === 'full' && index > 0)
        });
        if (
          Math.abs(position.viewportWidth - original.viewportWidth) > 1 ||
          Math.abs(position.viewportHeight - original.viewportHeight) > 1
        )
          throw new Error('Změnila se velikost okna. Spusťte snímání znovu.');
        if (
          mode !== 'visible' &&
          (Math.abs(position.width - original.width) > 2 || Math.abs(position.height - original.height) > 2)
        )
          throw new Error(
            'Rozvržení stránky se během snímání změnilo. Nechte obsah načíst a zkuste to znovu.'
          );
        await sleep(130);
        abortCheck(signal);
        const frame = await request('CAPTURE_FRAME', { token });
        abortCheck(signal);
        if (Math.abs(frame.metrics.x - position.x) > 1 || Math.abs(frame.metrics.y - position.y) > 1)
          throw new Error('Stránka se během záběru posunula. Spusťte snímání znovu.');
        if (
          [
            'documentId',
            'innerWidth',
            'innerHeight',
            'viewportWidth',
            'viewportHeight',
            'width',
            'height',
            'dpr'
          ].some(field => frame.metrics[field] !== position[field])
        )
          throw new Error('Stránka během záběru změnila rozměry nebo dokument. Spusťte snímání znovu.');
        const blob = await (await fetch(frame.dataUrl)).blob();
        const image = await createImageBitmap(blob);
        try {
          abortCheck(signal);
          if (mode === 'visible') {
            const width = image.width,
              height = image.height;
            onProgress({ index: 1, count: 1 });
            return { blob, width, height };
          }
          if (!canvas) {
            scale = image.width / original.innerWidth;
            const width = Math.round(region.width * scale),
              height = Math.round(region.height * scale);
            validateSize(width, height);
            canvas = createCanvas();
            canvas.width = width;
            canvas.height = height;
            ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Prohlížeč nemá dost paměti na spojení snímku.');
          }
          if (Math.abs(image.width / original.innerWidth - scale) > 0.01)
            throw new Error('Změnilo se rozlišení snímání. Spusťte snímání znovu.');
          const left = Math.max(region.x, position.x),
            top = Math.max(region.y, position.y);
          const right = Math.min(region.x + region.width, position.x + position.viewportWidth),
            bottom = Math.min(region.y + region.height, position.y + position.viewportHeight);
          if (right <= left || bottom <= top) throw new Error('Vybranou oblast se nepodařilo zachytit.');
          const sx = Math.round((left - position.x) * scale),
            sy = Math.round((top - position.y) * scale);
          const dx = Math.round((left - region.x) * scale),
            dy = Math.round((top - region.y) * scale);
          const dw = Math.round((right - region.x) * scale) - dx,
            dh = Math.round((bottom - region.y) * scale) - dy;
          ctx.drawImage(image, sx, sy, dw, dh, dx, dy, dw, dh);
        } finally {
          image.close();
        }
        index++;
        onProgress({ index, count });
      }
    abortCheck(signal);
    const blob = await new Promise((resolve, reject) =>
      canvas.toBlob(
        value =>
          value ? resolve(value) : reject(new Error('PNG se nepodařilo vytvořit. Snižte velikost snímku.')),
        'image/png'
      )
    );
    return { blob, width: canvas.width, height: canvas.height };
  } finally {
    if (setup) await request('CAPTURE_END', { token: setup.token }).catch(() => {});
    if (canvas) {
      canvas.width = 1;
      canvas.height = 1;
    }
    // Cancellation can arrive while PNG encoding or page restoration is pending.
    abortCheck(signal);
  }
}
