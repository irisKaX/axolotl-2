import { el, button } from '../../shared/ui.js';
import { actionButton, labeledActionButton } from '../../shared/design-system/components.js';
import { cropPng, cropFromPoints, pointOnImage, validateCrop } from './crop.js';
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export function createCropEditor(onApply, { crop = cropPng } = {}) {
  const dialog = el('dialog', 'screenshot-crop-dialog');
  dialog.id = 'screenshot-crop-dialog';
  dialog.setAttribute('aria-labelledby', 'screenshot-crop-title');
  const heading = el('div', 'dialog-heading'),
    title = el('h2', '', 'Oříznout snímek');
  title.id = 'screenshot-crop-title';
  const closeButton = actionButton('close', 'Zavřít ořez', close);
  heading.append(title, closeButton);
  const hint = el(
    'p',
    'helper',
    'Tažením označte oblast. Výběr posuňte myší nebo šipkami; rohy mění velikost. Přesné hodnoty zadejte v pixelech.'
  );
  const viewport = el('div', 'crop-viewport'),
    stage = el('div', 'crop-stage'),
    image = el('img'),
    selection = el('div', 'crop-selection');
  image.alt = 'Screenshot pro výběr ořezu';
  image.draggable = false;
  selection.tabIndex = 0;
  selection.setAttribute('role', 'group');
  selection.setAttribute('aria-label', 'Oblast ořezu. Šipkami posuňte výběr, se Shift po deseti pixelech.');
  const handleLabels = {
    nw: 'Levý horní roh',
    ne: 'Pravý horní roh',
    sw: 'Levý dolní roh',
    se: 'Pravý dolní roh'
  };
  for (const [corner, label] of Object.entries(handleLabels)) {
    const handle = el('button', 'crop-handle crop-handle-' + corner);
    handle.type = 'button';
    handle.dataset.corner = corner;
    handle.setAttribute('aria-label', label + ' ořezu. Velikost změníte šipkami.');
    selection.append(handle);
  }
  stage.append(image, selection);
  viewport.append(stage);
  const fields = el('div', 'crop-fields'),
    inputs = {};
  for (const [key, label] of [
    ['x', 'X'],
    ['y', 'Y'],
    ['width', 'Šířka'],
    ['height', 'Výška']
  ]) {
    const field = el('label'),
      input = el('input');
    input.type = 'number';
    input.step = '1';
    input.min = ['x', 'y'].includes(key) ? '0' : '1';
    input.id = 'screenshot-crop-' + key;
    field.htmlFor = input.id;
    field.append(el('span', '', label + ' (px)'), input);
    fields.append(field);
    inputs[key] = input;
    input.addEventListener('input', () => {
      if (!source || pending) return;
      try {
        rect = validateCrop(
          Object.fromEntries(
            Object.entries(inputs).map(([name, node]) => [name, node.value === '' ? NaN : Number(node.value)])
          ),
          source
        );
        error.textContent = '';
        paint(false);
      } catch (reason) {
        error.textContent = reason.message;
        apply.disabled = true;
      }
    });
  }
  const error = el('p', 'crop-status');
  error.setAttribute('role', 'status');
  error.setAttribute('aria-live', 'polite');
  const actions = el('div', 'crop-actions'),
    cancel = button('Zrušit', close),
    apply = labeledActionButton('crop', 'Použít ořez', () => void commit(), { id: 'screenshot-crop-apply' });
  actions.append(cancel, apply);
  dialog.append(heading, hint, viewport, fields, error, actions);
  let source = null,
    rect = null,
    pending = false,
    revision = 0,
    drag = null,
    frame = 0,
    lastPoint = null;
  function paint(syncFields = true) {
    if (!source || !rect) return;
    Object.assign(selection.style, {
      left: (rect.x / source.width) * 100 + '%',
      top: (rect.y / source.height) * 100 + '%',
      width: (rect.width / source.width) * 100 + '%',
      height: (rect.height / source.height) * 100 + '%'
    });
    if (syncFields) for (const [key, input] of Object.entries(inputs)) input.value = String(rect[key]);
    apply.disabled = pending || (rect.width === source.width && rect.height === source.height);
    for (const input of Object.values(inputs)) input.disabled = pending;
    selection.setAttribute(
      'aria-label',
      `Oblast ořezu ${rect.width} × ${rect.height} px, X ${rect.x}, Y ${rect.y}. Šipkami posuňte výběr.`
    );
    const label = pending ? 'Ořezávám…' : 'Použít ořez';
    apply.querySelector('.ds-action__label').textContent = label;
    apply.setAttribute('aria-label', label);
    apply.setAttribute('aria-busy', String(pending));
    apply.title = label;
  }
  function stopDrag() {
    const pointerId = drag?.pointerId;
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    drag = null;
    lastPoint = null;
    if (pointerId !== undefined && stage.hasPointerCapture(pointerId)) stage.releasePointerCapture(pointerId);
  }
  function close() {
    stopDrag();
    revision++;
    pending = false;
    source = null;
    image.removeAttribute('src');
    if (dialog.open) dialog.close();
  }
  async function commit() {
    if (!source || pending || apply.disabled) return;
    const token = ++revision,
      original = source;
    pending = true;
    error.textContent = '';
    stopDrag();
    paint();
    try {
      const output = await crop(original, rect);
      if (token !== revision || !dialog.open) return;
      onApply(output, original);
      close();
    } catch (reason) {
      if (token === revision) error.textContent = reason.message;
    } finally {
      if (token === revision) {
        pending = false;
        paint();
      }
    }
  }
  function resize(corner, original, point) {
    const fixed = {
      x: corner.includes('w') ? original.x + original.width : original.x,
      y: corner.includes('n') ? original.y + original.height : original.y
    };
    return cropFromPoints(fixed, point, source);
  }
  function updatePointer() {
    if (!drag || !lastPoint || !source) return;
    const point = pointOnImage(lastPoint.x, lastPoint.y, image.getBoundingClientRect(), source);
    if (drag.corner) rect = resize(drag.corner, drag.original, point);
    else if (drag.moving)
      rect = {
        ...drag.original,
        x: clamp(Math.round(drag.original.x + point.x - drag.start.x), 0, source.width - drag.original.width),
        y: clamp(
          Math.round(drag.original.y + point.y - drag.start.y),
          0,
          source.height - drag.original.height
        )
      };
    else rect = cropFromPoints(drag.start, point, source);
    error.textContent = '';
    paint();
  }
  function autoScroll() {
    if (!drag || !lastPoint) return;
    const bounds = viewport.getBoundingClientRect(),
      dy = lastPoint.y < bounds.top + 28 ? -12 : lastPoint.y > bounds.bottom - 28 ? 12 : 0;
    if (dy) {
      viewport.scrollTop += dy;
      updatePointer();
    }
    frame = requestAnimationFrame(autoScroll);
  }
  stage.addEventListener('pointerdown', event => {
    if (!source || pending || event.button !== 0 || !image.complete || !image.naturalWidth) return;
    event.preventDefault();
    const corner = event.target.closest('[data-corner]')?.dataset.corner;
    const full = rect.width === source.width && rect.height === source.height;
    drag = {
      pointerId: event.pointerId,
      start: pointOnImage(event.clientX, event.clientY, image.getBoundingClientRect(), source),
      original: { ...rect },
      corner,
      moving: !corner && !full && selection.contains(event.target)
    };
    lastPoint = { x: event.clientX, y: event.clientY };
    stage.setPointerCapture(event.pointerId);
    selection.focus({ preventScroll: true });
    updatePointer();
    frame = requestAnimationFrame(autoScroll);
  });
  stage.addEventListener('pointermove', event => {
    if (drag?.pointerId === event.pointerId) {
      lastPoint = { x: event.clientX, y: event.clientY };
      updatePointer();
    }
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture'])
    stage.addEventListener(type, () => stopDrag());
  viewport.addEventListener('scroll', updatePointer);
  selection.addEventListener('keydown', event => {
    if (!source || pending || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key))
      return;
    event.preventDefault();
    const step = event.shiftKey ? 10 : 1,
      dx = event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0,
      dy = event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0,
      corner = event.target.dataset.corner;
    if (corner)
      rect = resize(corner, rect, {
        x: (corner.includes('w') ? rect.x : rect.x + rect.width) + dx,
        y: (corner.includes('n') ? rect.y : rect.y + rect.height) + dy
      });
    else
      rect = {
        ...rect,
        x: clamp(rect.x + dx, 0, source.width - rect.width),
        y: clamp(rect.y + dy, 0, source.height - rect.height)
      };
    error.textContent = '';
    paint();
  });
  dialog.addEventListener('cancel', event => {
    event.preventDefault();
    close();
  });
  dialog.addEventListener('close', () => {
    if (source && !dialog.open) close();
  });
  return {
    node: dialog,
    open(value, url) {
      close();
      source = value;
      rect = { x: 0, y: 0, width: source.width, height: source.height };
      error.textContent = '';
      image.src = url;
      inputs.x.max = String(source.width - 1);
      inputs.y.max = String(source.height - 1);
      inputs.width.max = String(source.width);
      inputs.height.max = String(source.height);
      paint();
      dialog.showModal();
      viewport.scrollTop = 0;
      cancel.focus();
    },
    close,
    destroy() {
      close();
      dialog.remove();
    }
  };
}
