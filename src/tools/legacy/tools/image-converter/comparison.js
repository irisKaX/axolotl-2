import { el, button } from '../../shared/ui.js';
import { sizeLabel, validateFile, validateDimensions } from './policy.js';
import { inspectImage } from './inspect.js';
import { ComparisonView } from './comparison-view.js';

/** Persistent DOM: progress updates must not reset zoom, drag or image decoding. */
export function mountComparison(host) {
  host.classList.add('convert-comparison');
  host.id = 'convert-comparison';
  host.hidden = true;
  let row = null,
    selected = null,
    sourceFile = null,
    outputBlob = null,
    sourceUrl = null,
    outputUrl = null;
  let original = null,
    output = null,
    view = null,
    sourceReady = false,
    outputReady = false,
    sourceError = '',
    outputError = '';
  let sourceVersion = 0,
    outputVersion = 0,
    drag = null,
    destroyed = false;
  const heading = el('div', 'toolbar between');
  heading.append(el('h2', '', 'Porovnání před / po'), el('span', 'helper', 'Jeden obrázek · stejný detail'));
  const labels = el('div', 'compare-labels'),
    before = el('div'),
    after = el('div');
  const beforeInfo = el('span'),
    afterInfo = el('span');
  before.append(el('strong', '', 'PŘED · Originál'), beforeInfo);
  after.append(el('strong', '', 'PO · WebP'), afterInfo);
  labels.append(before, after);
  const stage = el('div', 'compare-stage');
  stage.tabIndex = 0;
  stage.setAttribute('aria-label', 'Náhled obrázku. Zvětšeným obrázkem lze posouvat tažením nebo šipkami.');
  const left = el('div', 'compare-layer compare-original'),
    right = el('div', 'compare-layer compare-result');
  const blank = el('p', 'compare-blank', 'Načítám náhled…');
  const divider = el('div', 'compare-divider');
  divider.id = 'compare-divider';
  divider.tabIndex = 0;
  divider.setAttribute('role', 'slider');
  divider.setAttribute('aria-label', 'Dělicí čára porovnání před a po');
  divider.setAttribute('aria-orientation', 'horizontal');
  divider.setAttribute('aria-valuemin', '0');
  divider.setAttribute('aria-valuemax', '100');
  // Aceternity Compare's beam and handle, adapted to the shared zoom/pan view.
  // https://ui.aceternity.com/components/compare (Manu Arora / Aceternity)
  const glow = el('span', 'axolotl-compare-glow'),
    core = el('span', 'axolotl-compare-glow-core'),
    sparkles = el('span', 'axolotl-compare-sparkles');
  for (const node of [glow, core, sparkles]) node.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 16; i++) {
    const spark = el('i', 'axolotl-compare-spark');
    spark.style.left = (i * 17 % 37) + 'px';
    spark.style.top = (i * 29 % 100) + '%';
    spark.style.animationDelay = -(i * 0.23) + 's';
    spark.style.animationDuration = (1.7 + i % 4 * 0.3) + 's';
    sparkles.append(spark);
  }
  const handle = el('span', 'compare-handle');
  handle.append(el('span', 'axolotl-compare-grip'));
  handle.setAttribute('aria-hidden', 'true');
  divider.append(glow, core, sparkles, handle);
  stage.append(left, right, blank, divider);
  const bottom = el('div', 'compare-bottom'),
    zoomBar = el('div', 'compare-zoom');
  zoomBar.setAttribute('role', 'group');
  zoomBar.setAttribute('aria-label', 'Zvětšení obou obrázků');
  const minus = button('−', () => zoom(view.scale / 1.5), { id: 'compare-zoom-out' });
  minus.setAttribute('aria-label', 'Oddálit oba obrázky');
  const zoomLabel = el('output', 'compare-zoom-value', '100 %');
  zoomLabel.id = 'compare-zoom-value';
  zoomLabel.setAttribute('aria-label', 'Aktuální zvětšení');
  const plus = button('+', () => zoom(view.scale * 1.5), { id: 'compare-zoom-in' });
  plus.setAttribute('aria-label', 'Přiblížit oba obrázky');
  const actual = button('100 %', () => zoom(1), { kind: 'ghost', id: 'compare-actual' });
  const fit = button(
    'Přizpůsobit',
    () => {
      view.fit();
      paint();
    },
    { kind: 'ghost', id: 'compare-fit' }
  );
  zoomBar.append(minus, zoomLabel, plus, actual, fit);
  const help = el('p', 'helper compare-hint');
  bottom.append(zoomBar, help);
  const status = el('p', 'helper compare-status');
  status.id = 'compare-status';
  status.setAttribute('role', 'status');
  host.append(heading, labels, stage, bottom, status);

  const canCompare = () => sourceReady && outputReady && !sourceError && !outputError;
  function mode(options) {
    return options?.lossless ? 'Bezztrátově' : 'Kvalita ' + options?.quality + ' / 100';
  }
  function settingsChanged() {
    return (
      row?.result &&
      row.options &&
      (row.options.lossless !== selected?.lossless ||
        (!row.options.lossless && row.options.quality !== selected?.quality))
    );
  }
  function message() {
    if (!row) return;
    beforeInfo.textContent =
      sizeLabel(row.file.size) + (sourceReady ? ' · ' + view.width + ' × ' + view.height + ' px' : '');
    afterInfo.textContent = row.result
      ? sizeLabel(row.result.blob.size) + ' · ' + mode(row.options)
      : 'Čeká na převod';
    const error = sourceError || row.error || outputError;
    if (error) status.textContent = error;
    else if (row.status === 'working') status.textContent = (row.phase || 'Převádím obrázek') + '…';
    else if (!row.result)
      status.textContent =
        'Zobrazený je originál. Klikněte na Převést; potom můžete porovnat obě verze posuvnou čárou.';
    else if (!canCompare()) status.textContent = 'Načítám obrázky pro porovnání…';
    else if (settingsChanged())
      status.textContent =
        'Náhled ukazuje poslední převod (' +
        mode(row.options) +
        '). Pro nové nastavení klikněte na Převést do WebP.';
    else
      status.textContent =
        'Vlevo originál, vpravo skutečný výsledný WebP. Pro kontrolu jemných detailů použijte 100 % nebo větší zvětšení.';
    status.classList.toggle('compare-warning', !!error || !!settingsChanged());
    blank.textContent = sourceError || 'Načítám náhled…';
  }
  function paint() {
    if (destroyed) return;
    const comparing = canCompare();
    left.hidden = !sourceReady;
    right.hidden = !comparing;
    divider.hidden = !comparing;
    blank.hidden = sourceReady;
    for (const control of [minus, plus, actual, fit]) control.disabled = !sourceReady;
    if (!view) return;
    stage.setAttribute('data-axolotl-compare-mode', view.fitted ? 'hover' : 'drag');
    help.textContent = view.fitted
      ? 'Pohybem myši nebo tažením porovnáte originál a WebP.'
      : 'Táhněte dělicí čárou. Přiblížený obrázek posunete tažením.';
    if (
      comparing &&
      (original.naturalWidth !== output.naturalWidth || original.naturalHeight !== output.naturalHeight)
    ) {
      outputError =
        'Rozměry náhledů se neshodují. Výsledek lze uložit, ale nelze ho přesně překrýt s originálem.';
      outputReady = false;
      paint();
      message();
      return;
    }
    for (const img of [original, output])
      if (img) {
        img.style.width = view.width * view.scale + 'px';
        img.style.height = view.height * view.scale + 'px';
        img.style.transform = `translate(${view.x}px, ${view.y}px)`;
      }
    // Clip BOTH images. Transparent output must never blend with the original.
    left.style.clipPath = comparing ? `inset(0 ${100 - view.split}% 0 0)` : 'none';
    right.style.clipPath = `inset(0 0 0 ${view.split}%)`;
    divider.style.left = view.split + '%';
    divider.setAttribute('aria-valuenow', String(Math.round(view.split)));
    divider.setAttribute(
      'aria-valuetext',
      Math.round(view.split) + ' % originál, ' + Math.round(100 - view.split) + ' % WebP'
    );
    handle.style.transform = `translateX(-${view.split}%)`;
    stage.classList.toggle('compare-pixelated', view.scale > 1);
    zoomLabel.textContent = (view.scale * 100).toLocaleString('cs-CZ', { maximumFractionDigits: 1 }) + ' %';
    minus.disabled = !sourceReady || view.scale <= 0.001;
    plus.disabled = !sourceReady || view.scale >= 4;
    actual.setAttribute('aria-pressed', String(view.scale === 1 && !view.fitted));
    fit.setAttribute('aria-pressed', String(view.fitted));
  }
  function resize() {
    if (view) {
      view.resize(stage.clientWidth, stage.clientHeight);
      paint();
    }
  }
  function zoom(scale) {
    if (view && sourceReady) {
      view.zoomTo(scale);
      paint();
    }
  }
  function endDrag() {
    if (!drag) return;
    const old = drag;
    drag = null;
    if (old.target.hasPointerCapture?.(old.id)) old.target.releasePointerCapture(old.id);
    stage.classList.remove('compare-dragging');
  }
  function beginDrag(event, kind) {
    if (event.button !== 0 || !sourceReady || drag || (kind === 'divider' && !canCompare())) return;
    event.preventDefault();
    event.stopPropagation();
    const target = event.currentTarget;
    target.focus({ preventScroll: true });
    target.setPointerCapture(event.pointerId);
    drag = { id: event.pointerId, kind, target, x: event.clientX, y: event.clientY };
    stage.classList.add('compare-dragging');
  }
  function moveDrag(event) {
    if (!drag) {
      if (event.pointerType === 'mouse' && view?.fitted && canCompare()) {
        view.splitAt(event.clientX, stage.getBoundingClientRect().left);
        paint();
      }
      return;
    }
    if (event.pointerId !== drag.id) return;
    if (drag.kind === 'divider') view.splitAt(event.clientX, stage.getBoundingClientRect().left);
    else view.pan(event.clientX - drag.x, event.clientY - drag.y);
    drag.x = event.clientX;
    drag.y = event.clientY;
    paint();
  }
  stage.addEventListener('pointerdown', event => beginDrag(event, view?.fitted && canCompare() ? 'divider' : 'pan'));
  stage.addEventListener('pointerleave', event => {
    if (event.pointerType === 'mouse' && !drag && view?.fitted && canCompare()) {
      view.split = 50;
      paint();
    }
  });
  divider.addEventListener('pointerdown', event => beginDrag(event, 'divider'));
  for (const node of [stage, divider]) {
    node.addEventListener('pointermove', moveDrag);
    node.addEventListener('pointerup', endDrag);
    node.addEventListener('pointercancel', endDrag);
    node.addEventListener('lostpointercapture', endDrag);
  }
  divider.addEventListener('keydown', event => {
    if (!canCompare()) return;
    const amount = event.shiftKey ? 10 : 1;
    if (event.key === 'ArrowLeft') view.moveSplit(-amount);
    else if (event.key === 'ArrowRight') view.moveSplit(amount);
    else if (event.key === 'Home') view.split = 0;
    else if (event.key === 'End') view.split = 100;
    else return;
    event.preventDefault();
    event.stopPropagation();
    paint();
  });
  stage.addEventListener('keydown', event => {
    if (event.target !== stage || !sourceReady) return;
    const moves = { ArrowLeft: [40, 0], ArrowRight: [-40, 0], ArrowUp: [0, 40], ArrowDown: [0, -40] };
    if (moves[event.key]) view.pan(...moves[event.key]);
    else if (event.key === '+' || event.key === '=') view.zoomTo(view.scale * 1.5);
    else if (event.key === '-') view.zoomTo(view.scale / 1.5);
    else return;
    event.preventDefault();
    paint();
  });
  const observer = new ResizeObserver(resize);
  observer.observe(stage);
  function releaseSource() {
    sourceVersion++;
    sourceReady = false;
    sourceError = '';
    view = null;
    original?.removeAttribute('src');
    original = null;
    left.replaceChildren();
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    sourceUrl = null;
  }
  function releaseOutput() {
    outputVersion++;
    outputReady = false;
    outputError = '';
    output?.removeAttribute('src');
    output = null;
    right.replaceChildren();
    if (outputUrl) URL.revokeObjectURL(outputUrl);
    outputUrl = null;
  }
  async function loadSource(file) {
    const version = sourceVersion;
    try {
      validateFile(file);
      const bytes = await file.arrayBuffer();
      if (version !== sourceVersion || destroyed) return;
      const info = inspectImage(bytes);
      if (info.animated)
        throw new Error('Animované obrázky nelze porovnat se statickým WebP. Použijte obrázek bez animace.');
      if (info.width != null) validateDimensions(info.width, info.height);
      const img = el('img');
      img.alt = 'Původní obrázek ' + file.name;
      img.draggable = false;
      img.decoding = 'async';
      sourceUrl = URL.createObjectURL(new Blob([bytes], { type: info.mime }));
      original = img;
      left.replaceChildren(img);
      img.src = sourceUrl;
      await img.decode();
      if (version !== sourceVersion || destroyed) return;
      validateDimensions(img.naturalWidth, img.naturalHeight);
      view = new ComparisonView(img.naturalWidth, img.naturalHeight);
      sourceReady = true;
      resize();
      message();
    } catch (error) {
      if (version === sourceVersion && !destroyed) {
        releaseSource();
        sourceError = error.message || 'Originál se nepodařilo zobrazit.';
        message();
        paint();
      }
    }
  }
  async function loadOutput(blob) {
    const version = outputVersion;
    try {
      const img = el('img');
      img.alt = 'Převedený obrázek WebP';
      img.draggable = false;
      img.decoding = 'async';
      outputUrl = URL.createObjectURL(blob);
      output = img;
      right.replaceChildren(img);
      img.src = outputUrl;
      await img.decode();
      if (version !== outputVersion || destroyed) return;
      outputReady = true;
      paint();
      message();
    } catch {
      if (version === outputVersion && !destroyed) {
        releaseOutput();
        outputError = 'WebP se nepodařilo zobrazit v náhledu. Soubor můžete stále uložit.';
        paint();
        message();
      }
    }
  }
  function update(next, options) {
    if (destroyed) return;
    row = next;
    selected = options;
    host.hidden = !row;
    const file = row?.file || null,
      blob = row?.result?.blob || null;
    if (file !== sourceFile) {
      endDrag();
      releaseSource();
      sourceFile = file;
      if (file) loadSource(file);
    }
    if (blob !== outputBlob) {
      endDrag();
      releaseOutput();
      outputBlob = blob;
      if (blob) loadOutput(blob);
    }
    if (row) {
      message();
      resize();
    }
    paint();
  }
  return {
    update,
    destroy() {
      destroyed = true;
      endDrag();
      observer.disconnect();
      releaseSource();
      releaseOutput();
      row = sourceFile = outputBlob = null;
      host.replaceChildren();
      host.hidden = true;
    }
  };
}
