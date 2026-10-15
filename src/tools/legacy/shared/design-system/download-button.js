/* Classic and module compatible: shared by dashboard, DevTools and Twin. */
(() => {
  'use strict';
  const states = new WeakMap();
  function element(tag, cls, text) {
    const node = document.createElement(tag);
    node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function setLabel(node, label, name = 'Stáhnout ' + label) {
    const state = states.get(node);
    state.caption.textContent = label;
    state.sizer.textContent = label;
    node.setAttribute('aria-label', name);
    node.title = name;
  }
  function setBusy(node, value) {
    const state = states.get(node);
    if (!state) return;
    clearTimeout(state.timer);
    state.running = !!value;
    node.setAttribute('aria-busy', String(!!value));
    if (value) {
      state.started = Date.now();
      node.setAttribute('aria-disabled', 'true');
      node.dataset.loading = 'true';
    } else {
      node.removeAttribute('aria-disabled');
      // Finish the initial click feedback for very fast local exports. No
      // artificial delay is added to the operation or to its completion notice.
      const left = Math.max(0, 650 - (Date.now() - state.started));
      state.timer = setTimeout(() => {
        node.dataset.loading = 'false';
      }, left);
    }
  }
  async function run(node, operation) {
    if (node.disabled || states.get(node)?.running) return;
    setBusy(node, true);
    try {
      return await operation();
    } finally {
      setBusy(node, false);
    }
  }
  function enhance(node, label, { name = 'Stáhnout ' + label } = {}) {
    node.className = 'ds-download';
    node.type = 'button';
    node.setAttribute('aria-busy', 'false');
    const sizer = element('span', 'ds-download-sizer');
    sizer.setAttribute('aria-hidden', 'true');
    const surface = element('span', 'ds-download__surface'),
      circle = element('span', 'ds-download__circle');
    surface.setAttribute('aria-hidden', 'true');
    // The same download path as shared/icons.js; no HTML or page input inserted.
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    for (const [key, value] of Object.entries({
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '1.7',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'aria-hidden': 'true'
    }))
      svg.setAttribute(key, value);
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M12 3v12m-5-5 5 5 5-5M4 16v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4');
    svg.append(path);
    circle.append(svg, element('span', 'ds-download__square'));
    const caption = element('span', 'ds-download__label');
    surface.append(circle, caption, element('span', 'ds-download__orbit'));
    node.replaceChildren(sizer, surface);
    states.set(node, { sizer, caption, running: false, started: 0, timer: null });
    setLabel(node, label, name);
    return node;
  }
  function create(label, onClick, { id, name } = {}) {
    const node = enhance(element('button'), label, { name });
    if (id) node.id = id;
    if (onClick)
      node.addEventListener('click', event => {
        event.preventDefault();
        void run(node, () => onClick(event));
      });
    return node;
  }
  globalThis.__O2WebOpsDownloadButton = { create, enhance, setLabel, setBusy, run };
})();
