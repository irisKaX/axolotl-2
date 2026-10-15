(() => {
  'use strict';
  const api = globalThis.__O2Tools;
  if (!api || api.captureBegin) return;
  let state = null;
  const parentOf = node => node.parentElement || node.getRootNode()?.host || null;
  const composedContains = (outer, inner) => {
    for (let node = inner; node; node = parentOf(node)) if (node === outer) return true;
    return false;
  };
  const metrics = () => {
    const d = document.documentElement,
      b = document.body,
      // In quirks mode BODY exposes the viewport; HTML exposes content height.
      // Client dimensions exclude native scrollbars from each stitch tile.
      viewport = document.compatMode === 'BackCompat' && b ? b : d;
    return {
      documentId: api.documentId,
      innerWidth,
      innerHeight,
      viewportWidth: viewport.clientWidth,
      viewportHeight: viewport.clientHeight,
      width: Math.max(d.scrollWidth, b?.scrollWidth || 0, d.clientWidth),
      height: Math.max(d.scrollHeight, b?.scrollHeight || 0, d.clientHeight),
      x: scrollX,
      y: scrollY,
      dpr: devicePixelRatio
    };
  };
  const preserve = (el, property) => ({
    el,
    property,
    value: el.style.getPropertyValue(property),
    priority: el.style.getPropertyPriority(property)
  });
  const restoreStyle = entry => {
    if (entry.value) entry.el.style.setProperty(entry.property, entry.value, entry.priority);
    else entry.el.style.removeProperty(entry.property);
  };
  const touch = () => {
    clearTimeout(state.timer);
    state.timer = setTimeout(() => api.captureEnd({ token: state?.token }), 90000);
  };
  const check = token => {
    if (!state || state.token !== token)
      throw new Error('Snímání vypršelo nebo se stránka obnovila. Spusťte ho znovu.');
    touch();
  };
  api.captureMetrics = metrics;
  api.captureBegin = ({ mode, selectionId, session, token }) => {
    if (state) throw new Error('Na stránce už probíhá snímání.');
    const original = metrics(),
      styles = [],
      fixed = [],
      highlights = [];
    let region;
    if (mode === 'element') {
      const selected = api.selectedElement;
      if (!selected || selected.id !== selectionId || !selected.el.isConnected)
        throw new Error('Vybraný prvek už není dostupný. Vyberte ho znovu.');
      const rect = selected.el.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) throw new Error('Vybraný prvek nemá viditelnou plochu.');
      let fixedAncestor = false;
      for (let parent = selected.el; parent; parent = parentOf(parent))
        if (getComputedStyle(parent).position === 'fixed') {
          fixedAncestor = true;
          break;
        }
      if (
        fixedAncestor &&
        (rect.left < 0 ||
          rect.top < 0 ||
          rect.right > original.viewportWidth ||
          rect.bottom > original.viewportHeight)
      )
        throw new Error('Plovoucí prvek není celý vidět. Zmenšete zoom nebo vyberte menší prvek.');
      const left = Math.max(0, Math.floor(rect.left + scrollX)),
        top = Math.max(0, Math.floor(rect.top + scrollY));
      const right = Math.min(original.width, Math.ceil(rect.right + scrollX)),
        bottom = Math.min(original.height, Math.ceil(rect.bottom + scrollY));
      if (right <= left || bottom <= top)
        throw new Error('Vybraný prvek je mimo zachytitelnou plochu dokumentu.');
      region = { x: left, y: top, width: right - left, height: bottom - top, viewportOnly: fixedAncestor };
    } else if (mode === 'visible')
      region = {
        x: scrollX,
        y: scrollY,
        width: original.innerWidth,
        height: original.innerHeight,
        viewportOnly: true
      };
    else if (mode === 'full') region = { x: 0, y: 0, width: original.width, height: original.height };
    else throw new Error('Neznámý režim snímku.');
    state = {
      token,
      session,
      mode,
      original,
      styles,
      fixed,
      region,
      highlights,
      scrolled: false,
      attr: document.documentElement.getAttribute('data-o2-capturing')
    };
    try {
      for (const el of [document.documentElement, document.body].filter(Boolean))
        for (const [property, value] of [
          ['scroll-behavior', 'auto'],
          ['scroll-snap-type', 'none'],
          ['overflow-anchor', 'none']
        ]) {
          styles.push(preserve(el, property));
          el.style.setProperty(property, value, 'important');
        }
      document.documentElement.setAttribute('data-o2-capturing', 'true');
      for (const el of document.querySelectorAll('[data-o2-tools-ui]')) {
        styles.push(preserve(el, 'visibility'));
        el.style.setProperty('visibility', 'hidden', 'important');
      }
      if (CSS.highlights)
        for (const key of ['o2-tools-find', 'o2-tools-current'])
          if (CSS.highlights.has(key)) {
            highlights.push([key, CSS.highlights.get(key)]);
            CSS.highlights.delete(key);
          }
      if (mode === 'full' || (mode === 'element' && !region.viewportOnly)) {
        let visited = 0;
        outer: for (const root of api.roots())
          for (const el of root.querySelectorAll('*')) {
            if (++visited > 20000) break outer;
            if (el.closest('[data-o2-tools-ui]')) continue;
            if (mode === 'element' && composedContains(el, api.selectedElement.el)) continue;
            const style = getComputedStyle(el);
            if (!['fixed', 'sticky'].includes(style.position) || style.display === 'none') continue;
            const rect = el.getBoundingClientRect();
            if (rect.width * rect.height > original.viewportWidth * original.viewportHeight * 0.8) continue;
            fixed.push({
              ...preserve(el, 'visibility'),
              position: style.position,
              natural: null,
              insideSelection: mode === 'element' && composedContains(api.selectedElement.el, el)
            });
          }
      }
      state.escape = event => {
        if (event.key === 'Escape') {
          event.preventDefault();
          event.stopImmediatePropagation();
          api.captureEnd({ token });
          api.emit('CAPTURE_CANCEL', session, { token });
        }
      };
      window.addEventListener('keydown', state.escape, true);
      touch();
      return { token, metrics: original, region };
    } catch (error) {
      api.captureEnd({ token });
      throw error;
    }
  };
  api.captureScroll = async ({ token, x, y, hideFixed = false }) => {
    check(token);
    if (!state.region.viewportOnly) window.scrollTo({ left: x, top: y, behavior: 'instant' });
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    for (const entry of state.fixed) {
      let hide = hideFixed && !(entry.insideSelection && !state.scrolled);
      if ((state.mode === 'full' || entry.insideSelection) && entry.position === 'sticky') {
        const rect = entry.el.getBoundingClientRect();
        const current = { x: rect.left + scrollX, y: rect.top + scrollY };
        if (!hideFixed || !entry.natural) entry.natural = current;
        // Preserve lower sticky content in its natural document position;
        // hide only the duplicate produced after it starts sticking.
        hide =
          hideFixed &&
          (Math.abs(current.x - entry.natural.x) > 1 || Math.abs(current.y - entry.natural.y) > 1);
      }
      if (hide) entry.el.style.setProperty('visibility', 'hidden', 'important');
      else restoreStyle(entry);
    }
    state.scrolled = true;
    return metrics();
  };
  api.captureEnd = ({ token, session } = {}) => {
    if (!state || (token && state.token !== token) || (session && state.session !== session))
      return { restored: false };
    const old = state;
    state = null;
    clearTimeout(old.timer);
    if (old.escape) window.removeEventListener('keydown', old.escape, true);
    for (const entry of old.fixed) restoreStyle(entry);
    window.scrollTo({ left: old.original.x, top: old.original.y, behavior: 'instant' });
    for (const entry of old.styles.reverse()) restoreStyle(entry);
    if (old.attr === null) document.documentElement.removeAttribute('data-o2-capturing');
    else document.documentElement.setAttribute('data-o2-capturing', old.attr);
    if (CSS.highlights) for (const [key, value] of old.highlights) CSS.highlights.set(key, value);
    api.selectedElement = null;
    return { restored: true, x: scrollX, y: scrollY };
  };
})();
