(() => {
  'use strict';
  const api = globalThis.__O2Tools;
  if (!api || api.pickerVersion === '5') return;
  api.pickCancel?.(false);
  api.pickerVersion = '5';
  let active = null;
  const parentOf = node => node?.parentElement || node?.getRootNode()?.host || null;
  const childrenOf = node =>
    [...(node?.shadowRoot?.children || node?.children || [])].filter(
      el =>
        !el.hasAttribute('data-o2-tools-ui') &&
        el.getBoundingClientRect().width > 0 &&
        el.getBoundingClientRect().height > 0
    );
  const label = el => el.tagName.toLowerCase() + (el.id ? '#' + el.id : '');
  api.describeElement = el => {
    if (!el || el.nodeType !== 1) throw new Error('V panelu Elements vyberte HTML prvek.');
    if (el.ownerDocument !== document)
      throw new Error(
        'Prvek patří do vloženého rámu. Vyberte prvek hlavní stránky nebo otevřete rám v samostatné kartě.'
      );
    if (!el.isConnected) throw new Error('Vybraný prvek už není dostupný. Vyberte ho znovu.');
    const rect = el.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1)
      throw new Error('Vybraný prvek nemá viditelnou plochu. Vyberte jeho viditelný obsah.');
    return {
      tag: el.tagName.toLowerCase(),
      label: label(el),
      width: Math.round(rect.width),
      height: Math.round(rect.height)
    };
  };
  api.selectElement = el => {
    const description = api.describeElement(el);
    if (document.documentElement.hasAttribute('data-o2-capturing'))
      throw new Error('Nejdříve dokončete probíhající snímání.');
    const id = api.randomToken();
    api.selectedElement = { id, el };
    return { ...description, selectionId: id };
  };
  const cleanup = () => {
    if (!active) return null;
    const previous = active;
    active = null;
    clearTimeout(previous.timer);
    const restoreFocus = document.activeElement === previous.ui.host;
    previous.ui.host.remove();
    if (restoreFocus && previous.previousFocus?.isConnected)
      previous.previousFocus.focus({ preventScroll: true });
    for (const [type, handler] of previous.listeners) window.removeEventListener(type, handler, true);
    return previous;
  };
  api.pickCancel = (notify = true, session) => {
    if (session && active?.session !== session) return {};
    const previous = cleanup();
    if (previous && notify) api.emit('PICK_CANCEL', previous.session, { mode: previous.mode });
    return {};
  };
  // Approved catalog skin, bundled inline for injection without page network/CSP dependencies.
  const pickerCSS = `:host{--picker-blue:#0050FF;--picker-pink:#FA96FF;--picker-ink:#18213A;--picker-muted:#626B80;--picker-line:#E7EAF2;color-scheme:light;font:14px/1.45 "Segoe UI",Arial,sans-serif;color:var(--picker-ink);text-align:left;letter-spacing:normal}
*{box-sizing:border-box}button,select{font:inherit}button{cursor:pointer}button:disabled,select:disabled{cursor:default;opacity:.45}button:focus-visible,select:focus-visible,summary:focus-visible{outline:3px solid var(--picker-blue);outline-offset:3px}[hidden]{display:none!important}
.bar{width:calc(100% - 32px);max-width:680px;margin:0 auto;background:#FFFFFF;border:1px solid #DFE5F0;border-radius:22px;box-shadow:0 16px 42px #20325D12,0 2px 5px #20325D06;overflow:hidden}
.heading{display:flex;align-items:center;gap:12px;padding:20px 22px 16px}.heading-icon{display:grid;place-items:center;flex:none;width:40px;height:40px;border-radius:12px;background:#EDF2FF;color:var(--picker-blue)}.heading-icon svg{width:23px;height:23px}.heading-copy{flex:1;min-width:0}.heading h3{font-size:17px;font-weight:650;line-height:1.3;letter-spacing:-.025em;margin:0}.hint{margin:3px 0 0;color:var(--picker-muted);font-size:12px;line-height:1.5}
.icon-button{display:grid;place-items:center;flex:none;width:36px;height:36px;border:0;border-radius:50%;background:transparent;color:var(--picker-muted)}.icon-button:hover{background:#F3F5F9;color:var(--picker-ink)}svg{width:18px;height:18px;flex:none;vertical-align:middle}
.body{padding:0 22px 18px}.selection{display:flex;align-items:center;gap:14px;min-width:0;padding:14px 15px;background:#F7F9FD;border:1px solid #EBEEF5;border-radius:13px}.tag{display:inline-flex;align-items:center;flex:none;border-radius:7px;padding:5px 8px;background:#EAF0FF;color:var(--picker-blue);font:600 12px/1.4 Consolas,monospace}.selection-copy{flex:1;min-width:0}.selection-label{display:block;color:var(--picker-muted);font-size:11px;line-height:1.4;margin-bottom:3px}.selection-name{display:block;font:600 13px/1.4 Consolas,monospace;color:var(--picker-ink);overflow-wrap:anywhere}.selection-check{display:grid;place-items:center;width:23px;height:23px;color:var(--picker-blue);background:#EAF0FF;border-radius:50%;flex:none}.selection-check svg{width:14px;height:14px}
.hierarchy{margin:10px 0 14px}.hierarchy summary{list-style:none;display:flex;align-items:center;gap:7px;width:fit-content;max-width:100%;cursor:pointer;font-size:12px;color:var(--picker-muted);border-radius:5px;padding:4px 0}.hierarchy summary::-webkit-details-marker{display:none}.hierarchy summary::before{content:'›';font-size:18px;line-height:1;color:var(--picker-blue);transform:rotate(0);width:10px;text-align:center}.hierarchy[open] summary::before{transform:rotate(90deg)}.hierarchy-count{font-size:11px;color:#68768C;margin-left:2px}.path{display:grid;gap:4px;margin-top:8px;padding:6px 0 6px 8px;border-left:1px solid var(--picker-line)}.path button{text-align:left;width:100%;border:0;border-radius:7px;background:transparent;color:var(--picker-muted);padding:7px 10px;font:12px/1.4 Consolas,monospace;white-space:normal;overflow-wrap:anywhere}.path button:hover{background:#F2F5FC;color:var(--picker-ink)}.path button[aria-current=true]{background:#EAF0FF;color:var(--picker-blue);font-weight:600}
.controls{display:flex;gap:10px;align-items:stretch}.secondary{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:40px;padding:9px 12px;border:1px solid #DDE3EF;border-radius:999px;background:#FFFFFF;color:var(--picker-blue);font-size:12px;font-weight:600;white-space:nowrap}.secondary:hover:not(:disabled){background:#F5F8FF;border-color:#C6D4FC}.parent-icon{transform:rotate(-90deg);width:16px;height:16px}.child-select{flex:1;min-width:0;min-height:40px;padding:8px 30px 8px 12px;border:1px solid #DDE3EF;border-radius:999px;background:#FFFFFF;color:var(--picker-ink);font-size:12px;text-overflow:ellipsis}.child-select:hover:not(:disabled){border-color:#AABDF1}
.footer{display:flex;align-items:center;justify-content:space-between;gap:12px;border-top:1px solid #EDF0F6;background:#FFFFFF;padding:14px 22px}.keyboard{color:var(--picker-muted);font-size:11px;display:flex;align-items:center;gap:5px;white-space:nowrap}kbd{display:inline-grid;place-items:center;min-width:20px;min-height:21px;border:1px solid #E2E6EF;border-bottom-width:2px;border-radius:5px;background:#FFFFFF;font:11px/1 Arial,sans-serif;color:var(--picker-muted)}.actions{display:flex;align-items:center;gap:10px}.ghost{min-height:42px;padding:9px 8px;border:0;border-radius:999px;background:transparent;color:var(--picker-muted);font-size:12px;font-weight:600;white-space:nowrap}.ghost:hover:not(:disabled){background:#F4F6FA;color:var(--picker-ink)}button.primary{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:42px;padding:10px 16px;border:1px solid transparent;border-radius:999px;background:var(--picker-pink);color:#25172C;font-size:13px;font-weight:650;white-space:nowrap;transition:box-shadow .15s,transform .15s}button.primary:hover:not(:disabled){background:var(--picker-pink);box-shadow:0 0 0 3px #FA96FF33}button.primary:active:not(:disabled){transform:translateY(1px)}button.primary svg{width:17px;height:17px}
@container(max-width:560px){.footer{flex-wrap:wrap}.keyboard{order:2;justify-content:center;width:100%}.actions{width:100%;justify-content:space-between}}
@container(max-width:380px){.bar{width:calc(100% - 20px);border-radius:22px}.heading{padding:16px 16px 14px;gap:9px}.heading-icon{width:34px;height:34px;border-radius:10px}.heading h3{font-size:16px}.body{padding:0 16px 16px}.selection{gap:9px;padding:12px 10px}.selection-check{display:none}.footer{padding:12px 16px}.controls{gap:8px}.secondary{padding:9px;font-size:11px}.child-select{padding-left:9px;font-size:11px}.actions{gap:6px}button.primary{padding:10px 13px;font-size:12px}.ghost{font-size:11px}.hint{font-size:11px}}
@media(prefers-reduced-motion:reduce){button.primary{transition:none}button.primary:active:not(:disabled){transform:none}}
:host(:focus-visible) .bar{outline:3px solid var(--picker-blue);outline-offset:4px}
@container(max-width:320px){.actions{flex-wrap:wrap}.actions .primary{width:100%;order:0}.actions .ghost{width:100%;order:1}.keyboard{display:none}}
@media(pointer:coarse){button.primary,.ghost,.secondary,.child-select{min-height:44px}.icon-button{width:44px;height:44px}}

/* The content host is intentionally 0 × 0. Contain the responsive UI on its own fixed wrapper. */
.picker{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);width:min(100vw,712px);container-type:inline-size;pointer-events:auto;font:14px/1.45 "Segoe UI",Arial,sans-serif;color:var(--picker-ink);text-align:left;direction:ltr;letter-spacing:normal}
.bar{display:flex;flex-direction:column;max-height:calc(100dvh - 48px);outline:none}.bar:focus-visible{outline:3px solid var(--picker-blue);outline-offset:3px}.heading,.footer{flex-shrink:0}.body{min-height:0;overflow:auto;overscroll-behavior:contain}.path{max-height:min(28dvh,216px);overflow:auto;overscroll-behavior:contain;padding-right:5px}.path button:focus-visible{outline-offset:-3px}.controls{margin-top:14px}.tag{max-width:40%;overflow-wrap:anywhere;white-space:normal}.hint[role=alert]{color:#A52238}
.outline{position:fixed;pointer-events:none;border:2px solid #0050FF;outline:1px solid #FFFFFF;background:#0050FF0A;border-radius:3px}
.element-label{position:fixed;padding:6px 9px;border-radius:6px;background:#0050FF;color:#FFFFFF;font:12px/1.4 "Segoe UI",Arial,sans-serif;pointer-events:none;max-width:calc(100vw - 10px);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;direction:ltr}
@media(max-width:560px),(max-height:520px){.picker{bottom:12px}.bar{max-height:calc(100dvh - 24px)}}
`;
  api.pickStart = ({ mode, session }) => {
    if (mode !== 'element') throw new Error('Neznámý režim výběru.');
    if (document.documentElement.hasAttribute('data-o2-capturing'))
      throw new Error('Nejdříve dokončete probíhající snímání.');
    api.pickCancel(false);
    const previousFocus = document.activeElement;
    const ui = api.ui('picker');
    const style = document.createElement('style');
    style.textContent = pickerCSS + (globalThis.__O2WebOpsScrollbarSkin || '');
    // Replace this instance's generic toolbar skin; other content tools retain their own UI.
    ui.root.replaceChildren(style);
    const make = (tag, className = '', text = '') => {
      const node = document.createElement(tag);
      node.className = className;
      node.textContent = text;
      return node;
    };
    const button = (text, fn, className = '') => {
      const node = api.button(text, fn, className);
      node.className = className;
      return node;
    };
    const icon = name => {
      const node = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      for (const [key, value] of Object.entries({
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': '1.7',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'aria-hidden': 'true',
        focusable: 'false'
      }))
        node.setAttribute(key, value);
      const path = document.createElementNS(node.namespaceURI, 'path');
      path.setAttribute(
        'd',
        {
          screenshot:
            'M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3',
          arrow: 'M5 12h14m-6-6 6 6-6 6',
          check: 'm5 12 4 4L19 6',
          close: 'm6 6 12 12M6 18 18 6'
        }[name]
      );
      node.append(path);
      if (name === 'screenshot') {
        const rect = document.createElementNS(node.namespaceURI, 'rect');
        for (const [key, value] of Object.entries({ x: '7', y: '7', width: '10', height: '10', rx: '2' }))
          rect.setAttribute(key, value);
        node.append(rect);
      }
      return node;
    };
    const outline = make('div', 'outline'),
      floatingLabel = make('div', 'element-label');
    outline.hidden = floatingLabel.hidden = true;
    const picker = make('div', 'picker'),
      bar = make('div', 'bar');
    bar.tabIndex = -1;
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Výběr prvku pro screenshot');
    const top = make('div', 'heading'),
      symbol = make('span', 'heading-icon'),
      headingCopy = make('div', 'heading-copy');
    symbol.append(icon('screenshot'));
    const hint = make('p', 'hint');
    headingCopy.append(make('h3', '', 'Screenshot prvku'), hint);
    const body = make('div', 'body'),
      selection = make('div', 'selection'),
      tag = make('span', 'tag'),
      selectionCopy = make('div', 'selection-copy'),
      name = make('strong', 'selection-name'),
      selectionCheck = make('span', 'selection-check');
    selectionCopy.append(make('span', 'selection-label', 'Vybraný prvek'), name);
    selectionCheck.append(icon('check'));
    selection.append(tag, selectionCopy, selectionCheck);
    const hierarchy = make('details', 'hierarchy'),
      summary = make('summary'),
      count = make('span', 'hierarchy-count'),
      path = make('nav', 'path');
    path.setAttribute('aria-label', 'HTML hierarchie');
    summary.append(make('span', '', 'HTML hierarchie'), count);
    hierarchy.append(summary, path);
    const controls = make('div', 'controls'),
      footer = make('div', 'footer'),
      keyboard = make('span', 'keyboard'),
      actions = make('div', 'actions');
    keyboard.append(make('kbd', '', '↑'), make('kbd', '', '↓'), document.createTextNode(' změnit úroveň'));
    let current = null,
      locked = false,
      nested = [];
    const capture = () => {
      if (!current) return;
      try {
        const data = api.selectElement(current);
        cleanup();
        api.emit('PICK_RESULT', session, { mode, ...data });
      } catch (error) {
        hint.textContent = error.message;
        hint.setAttribute('role', 'alert');
      }
    };
    const up = button('', () => select(parentOf(current), true), 'secondary');
    const parentIcon = icon('arrow');
    parentIcon.classList.add('parent-icon');
    up.append(parentIcon, document.createTextNode('Nadřazený'));
    up.title = 'Nadřazený prvek · šipka nahoru';
    const child = make('select', 'child-select');
    child.setAttribute('aria-label', 'Vybrat vnořený prvek');
    child.addEventListener('change', () => {
      if (child.value !== '') {
        const next = nested[Number(child.value)];
        if (next) select(next, true);
      }
    });
    const confirm = button('', capture, 'primary');
    confirm.append(icon('screenshot'), document.createTextNode('Pořídit snímek'));
    confirm.title = 'Pořídit snímek · Enter';
    const reset = button(
      'Vybrat jiný',
      () => {
        select(null);
        bar.focus({ preventScroll: true });
      },
      'ghost'
    );
    const cancel = button('', () => api.pickCancel(), 'icon-button');
    cancel.append(icon('close'));
    cancel.setAttribute('aria-label', 'Zrušit výběr');
    cancel.title = 'Zrušit výběr · Esc';
    top.append(symbol, headingCopy, cancel);
    controls.append(up, child);
    body.append(selection, hierarchy, controls);
    actions.append(reset, confirm);
    footer.append(keyboard, actions);
    bar.append(top, body, footer);
    picker.append(bar);
    ui.root.append(outline, floatingLabel, picker);
    const draw = () => {
      if (!current?.isConnected) {
        outline.hidden = true;
        floatingLabel.hidden = true;
        return;
      }
      const rect = current.getBoundingClientRect();
      Object.assign(outline.style, {
        left: `${rect.left}px`,
        top: `${rect.top}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`
      });
      outline.hidden = false;
      floatingLabel.textContent = `${label(current)} · ${Math.round(rect.width)} × ${Math.round(rect.height)}`;
      Object.assign(floatingLabel.style, {
        left: `${Math.max(5, Math.min(rect.left, innerWidth - 200))}px`,
        top: `${Math.max(5, rect.top - 31)}px`
      });
      floatingLabel.hidden = false;
    };
    function select(el, freeze = false) {
      if (el && !el.isConnected) {
        hint.textContent = 'Prvek už není dostupný. Vyberte jiný.';
        hint.setAttribute('role', 'alert');
        return;
      }
      const refocusPath = path.contains(ui.root.activeElement);
      current = el;
      locked = el ? freeze || locked : false;
      const waiting = !el;
      hint.removeAttribute('role');
      hint.textContent =
        waiting || !locked
          ? 'Kliknutím na stránce označte prvek.'
          : 'Vyberte přesně tu část stránky, kterou potřebujete.';
      tag.textContent = waiting ? '…' : `<${el.tagName.toLowerCase()}>`;
      name.textContent = waiting ? 'Čekám na označení prvku' : el.id ? '#' + el.id : el.tagName.toLowerCase();
      selectionCheck.hidden = hierarchy.hidden = waiting;
      if (waiting) hierarchy.open = false;
      up.disabled = waiting || !parentOf(el);
      confirm.disabled = reset.disabled = waiting;
      const ancestors = [];
      for (let node = el; node; node = parentOf(node)) ancestors.unshift(node);
      count.textContent = `· ${ancestors.length} úrovní`;
      path.replaceChildren(
        ...ancestors.map(node => {
          const b = button(label(node), () => {
            select(node, true);
            path.querySelector('[aria-current=true]')?.focus({ preventScroll: true });
          });
          b.title = label(node);
          b.setAttribute('aria-current', String(node === el));
          return b;
        })
      );
      const placeholder = make('option', '', 'Vnořený prvek');
      placeholder.value = '';
      nested = waiting ? [] : childrenOf(el);
      child.replaceChildren(
        placeholder,
        ...nested.map((node, i) => {
          const option = make('option', '', label(node));
          option.value = String(i);
          return option;
        })
      );
      child.disabled = nested.length === 0;
      draw();
      if (refocusPath) path.querySelector('[aria-current=true]')?.focus({ preventScroll: true });
    }
    select(null);
    const isUI = event => event.composedPath().includes(ui.host);
    const targetOf = event =>
      event.composedPath().find(el => el instanceof Element && !el.hasAttribute('data-o2-tools-ui'));
    const move = event => {
      if (!locked && !isUI(event)) {
        const target = targetOf(event);
        if (target && target !== current) select(target);
      }
    };
    const prevent = event => {
      if (!isUI(event)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };
    const choose = event => {
      if (!isUI(event)) {
        prevent(event);
        if (!locked) select(targetOf(event), true);
      }
    };
    const navigate = event => {
      const target = event.composedPath()[0];
      if (
        event.currentTarget === ui.root &&
        (target?.tagName === 'SELECT' ||
          (event.key === 'Enter' && ['BUTTON', 'SUMMARY'].includes(target?.tagName)))
      )
        return;
      if (!current || !['ArrowUp', 'ArrowDown', 'Enter'].includes(event.key)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (event.key === 'Enter') capture();
      else {
        const next = event.key === 'ArrowUp' ? parentOf(current) : childrenOf(current)[0];
        if (next) select(next, true);
      }
    };
    const key = event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopImmediatePropagation();
        api.pickCancel();
        return;
      }
      if (event.key === 'Tab' && !isUI(event)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        cancel.focus({ preventScroll: true });
        return;
      }
      if (!isUI(event)) navigate(event);
    };
    // Only the shadow listener sees native button/select/summary targets in a closed root.
    ui.root.addEventListener('keydown', navigate);
    const listeners = [
      ['pointermove', move],
      ['pointerdown', prevent],
      ['mousedown', prevent],
      ['mouseup', prevent],
      ['click', choose],
      ['keydown', key],
      ['scroll', draw],
      ['resize', draw]
    ];
    active = {
      session,
      mode,
      ui,
      previousFocus,
      listeners,
      timer: setTimeout(() => api.pickCancel(), 90000)
    };
    for (const [type, handler] of listeners) window.addEventListener(type, handler, true);
    return { started: true, mode };
  };
})();
