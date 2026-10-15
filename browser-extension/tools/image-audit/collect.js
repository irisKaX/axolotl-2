/** Self-contained: executed in the selected tab's isolated world, without page mutations. */
export function collectImageAudit() {
  const found = new WeakMap(), roots = [document];
  // This registry lives only in the extension's isolated world. A new scan
  // invalidates old cards, and a same-URL navigation gets a different registry.
  globalThis.__O2_IMAGE_AUDIT__?.cleanup?.();
  const registry = {document, url:location.href, token:globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`, records:new Map()};
  globalThis.__O2_IMAGE_AUDIT__ = registry;
  function locator(node) {
    const path = [];
    while (node?.nodeType === 1) {
      const parts = [];
      let current = node;
      while (current?.nodeType === 1) {
        const parent = current.parentNode;
        parts.unshift(`*:nth-child(${[...(parent?.children || [])].indexOf(current) + 1})`);
        current = current.parentElement;
      }
      path.unshift(parts.join(' > '));
      node = node.getRootNode()?.host;
    }
    return path;
  }
  function resolve(path) {
    let root = document, node;
    for (const part of path) {
      if (!root) return null;
      node = root.querySelector(part);
      root = node?.shadowRoot;
    }
    return node;
  }
  function sourceSignature(node, kind, pseudo) {
    const attributes = names => names.map(name => node.getAttribute(name));
    if (kind === 'img') {
      const names = ['src','srcset','sizes','data-src','data-lazy-src','data-original','data-original-src','data-srcset','data-lazy-srcset'];
      return JSON.stringify([node.baseURI, attributes(names), node.parentElement?.localName === 'picture'
        ? [...node.parentElement.children].filter(child => child.localName === 'source').map(child => names.concat('media','type').map(name => child.getAttribute(name))) : []]);
    }
    if (kind === 'input') return JSON.stringify([node.baseURI, node.type, node.getAttribute('src')]);
    if (kind === 'svg-image') return JSON.stringify([node.baseURI, attributes(['href','xlink:href'])]);
    if (kind === 'poster') return JSON.stringify([node.baseURI, node.getAttribute('poster')]);
    const css = getComputedStyle(node, pseudo || null);
    const properties = {background:['backgroundImage'],content:['content'],mask:['maskImage','webkitMaskImage'],border:['borderImageSource'],list:['listStyleImage']};
    return JSON.stringify([node.baseURI, ...(properties[kind] || []).map(name => css[name]), pseudo ? css.content : '']);
  }
  let examined = 0,
    truncated = false,
    unsupported = 0,
    dataBytes = 0,
    framesSkipped = 0;
  const clean = value =>
    String(value || '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 500);
  // Follow the rendered tree, including slots and shadow hosts. aria-hidden is
  // intentionally not a visual filter: decorative images can still be visible.
  const styles = new WeakMap(), hiddenBranches = new WeakMap();
  const styleOf = node => {
    if (!styles.has(node)) styles.set(node, getComputedStyle(node));
    return styles.get(node);
  };
  const parentOf = node => node.assignedSlot || node.parentElement || node.getRootNode()?.host;
  function hiddenBranch(node) {
    const path = [];
    let hidden = false;
    for (let parent = node; parent; parent = parentOf(parent)) {
      const style = styleOf(parent);
      // content-visibility suppresses descendants, not the element's own
      // background. Box effects do not apply to display:contents wrappers.
      if (parent !== node && style.display !== 'contents' && style.contentVisibility === 'hidden') {
        hidden = true;
        break;
      }
      if (hiddenBranches.has(parent)) {
        hidden = hiddenBranches.get(parent);
        break;
      }
      path.push(parent);
      if (parent.hasAttribute('data-o2-tools-ui') || style.display === 'none' ||
          (style.display !== 'contents' && parseFloat(style.opacity) === 0)) {
        hidden = true;
        break;
      }
      const container = parentOf(parent);
      if (container?.localName === 'details' && !container.open &&
          [...container.children].find(child => child.localName === 'summary') !== parent) {
        hidden = true;
        break;
      }
    }
    for (const parent of path) hiddenBranches.set(parent, hidden);
    return hidden;
  }
  const hasBox = node => [...node.getClientRects()].some(rect => rect.width > 0 && rect.height > 0);
  function rendered(node, allowEmpty = false) {
    const style = styleOf(node);
    if (style.visibility === 'hidden' || style.visibility === 'collapse') return false;
    if (!allowEmpty && !hasBox(node)) return false;
    const rect = node.getBoundingClientRect();
    let left = rect.left, right = Math.max(rect.right, rect.left + (allowEmpty ? 1 : 0)),
      top = rect.top, bottom = Math.max(rect.bottom, rect.top + (allowEmpty ? 1 : 0));
    // Clip inactive carousel slides, but do not restrict collection to the
    // viewport: ordinary content below the fold still belongs to this page.
    let escapesClip = false, containingBlock;
    for (let child = node, parent = parentOf(node); parent; child = parent, parent = parentOf(parent)) {
      // Out-of-flow boxes escape overflow clips between themselves and their
      // containing block. A fixed box can also escape every ancestor's clip.
      if (!escapesClip && /^(absolute|fixed)$/.test(styleOf(child).position) && 'offsetParent' in child) {
        containingBlock = child.offsetParent;
        escapesClip = true;
      }
      if (escapesClip) {
        if (parent !== containingBlock) continue;
        escapesClip = false;
      }
      if (parent === document.documentElement || parent === document.body) continue;
      const css = styleOf(parent), box = parent.getBoundingClientRect();
      if (css.display === 'inline' || !parent.getClientRects().length) continue;
      const scaleX = parent.offsetWidth ? box.width / parent.offsetWidth : 1;
      const scaleY = parent.offsetHeight ? box.height / parent.offsetHeight : 1;
      if (/^(hidden|clip)$/.test(css.overflowX)) {
        const edge = box.left + parent.clientLeft * scaleX;
        left = Math.max(left, edge);
        right = Math.min(right, edge + parent.clientWidth * scaleX);
      }
      if (/^(hidden|clip)$/.test(css.overflowY)) {
        const edge = box.top + parent.clientTop * scaleY;
        top = Math.max(top, edge);
        bottom = Math.min(bottom, edge + parent.clientHeight * scaleY);
      }
      if (right <= left || bottom <= top) return false;
    }
    return true;
  }
  const items = [];
  function normalize(raw, node) {
    if (!raw || typeof raw !== 'string') return null;
    raw = raw.trim();
    if (!raw) return null;
    try {
      const url = new URL(raw, node.baseURI);
      if (url.username || url.password) return null;
      if (url.protocol === 'data:') {
        if (!/^data:image\/(?:png|jpeg|gif|webp|avif|svg\+xml|bmp|x-icon|vnd.microsoft.icon)[;,]/i.test(raw)) return null;
        if (raw.length > 2 * 1024 * 1024) { truncated = true; return null; }
        return raw;
      }
      if (!['http:', 'https:', 'blob:'].includes(url.protocol)) { unsupported++; return null; }
      if (url.href.length > 8192) { truncated = true; return null; }
      return url.href;
    } catch { return null; }
  }
  function add(raw, node, sourceKind, {source = sourceKind, variant = false, usage = 'selected', pseudo = ''} = {}) {
    const url = normalize(raw, node);
    if (!url) return false;
    let occurrences = found.get(node);
    if (!occurrences) found.set(node, occurrences = new Map());
    const key = sourceKind + pseudo + ':' + url;
    const known = occurrences.get(key);
    if (known) {
      if (!known.sources.includes(source)) known.sources.push(source);
      return true;
    }
    if (items.length >= 2000) { truncated = true; return false; }
    if (url.startsWith('data:')) {
      if (dataBytes + url.length > 4 * 1024 * 1024) { truncated = true; return false; }
      dataBytes += url.length;
    }
    const rect = node.getBoundingClientRect();
    const resourceUrl = url.startsWith('http') ? url.split('#')[0] : url;
    const timing = performance.getEntriesByName(resourceUrl).find(entry => entry.encodedBodySize > 0);
    const altApplicable = !variant && ['img', 'input'].includes(sourceKind);
    const lazyApplicable = !variant && sourceKind === 'img';
    const path = locator(node), selector = path.join(' >>> ') + pseudo;
    const sourceId = String(items.length), signature = sourceSignature(node, sourceKind, pseudo);
    const selectedUrl = sourceKind === 'img' ? normalize(node.currentSrc, node) || '' : '';
    const item = {url, sourceKind, sources:[source], variant, usage,
      sourceId,
      currentSrc:sourceKind === 'img' ? node.currentSrc || '' : null,
      alt:altApplicable ? node.getAttribute('alt') : null, altApplicable, lazyApplicable,
      loading:lazyApplicable ? node.getAttribute('loading') || 'eager' : null,
      naturalWidth:!variant && sourceKind === 'img' ? node.naturalWidth || null : null,
      naturalHeight:!variant && sourceKind === 'img' ? node.naturalHeight || null : null,
      displayWidth:rect.width, displayHeight:rect.height,
      aboveFold:rect.bottom > 0 && rect.right > 0 && rect.top < innerHeight && rect.left < innerWidth,
      selector,
      label:clean(node.getAttribute('aria-label') || node.getAttribute('alt') || node.localName) + pseudo,
      bytes:timing?.encodedBodySize || null, sizeSource:timing ? 'resourceTiming encodedBodySize' : null};
    items.push(item);
    registry.records.set(sourceId, {node, url, selector, pseudo,
      validate:() => {
        const current = sourceKind === 'img' ? normalize(node.currentSrc, node) || '' : '';
        // Native lazy images may acquire currentSrc only after scrolling them
        // into view. Accept that transition solely for this exact resource.
        const selectionMatches = current === selectedUrl || (!selectedUrl && current === url);
        return selectionMatches && node.ownerDocument === document && node.isConnected && resolve(path) === node && sourceSignature(node, sourceKind, pseudo) === signature;
      }});
    occurrences.set(key, item);
    return true;
  }
  // A comma inside a srcset URL token may be a CDN transformation or data URI.
  // Descriptor-separated candidates are parsed without splitting such URLs.
  function srcset(value, emit) {
    let rest = String(value || '').trim();
    if (rest.length > 200000) { truncated = true; return; }
    while (rest) {
      rest = rest.replace(/^[\s,]+/, '');
      if (!rest) break;
      const token = rest.match(/^\S+/)?.[0] || '';
      rest = rest.slice(token.length);
      emit(token.replace(/,+$/, ''));
      if (!token.endsWith(',')) {
        const comma = rest.indexOf(',');
        rest = comma < 0 ? '' : rest.slice(comma + 1);
      }
    }
  }
  function unescapeCss(value) {
    return value.replace(/\\([\da-f]{1,6}\s?|\r\n|[\n\r\f]|.)/gi, (_, escaped) => {
      if (/^[\da-f]/i.test(escaped)) {
        const code = parseInt(escaped.trim(), 16);
        return code && code <= 0x10ffff ? String.fromCodePoint(code) : '\uFFFD';
      }
      return /^[\n\r\f]/.test(escaped) ? '' : escaped;
    });
  }
  function stringEnd(text, start) {
    const quote = text[start];
    let i = start + 1;
    for (; i < text.length; i++) {
      if (text[i] === '\\') i++;
      else if (text[i] === quote) return i;
    }
    return text.length;
  }
  // Walk CSS functions rather than matching all quotes: type("image/webp") and
  // content text are not URLs. image-set candidates cannot prove selection.
  function cssImages(value, emit, candidate = false) {
    const text = String(value || '');
    if (text.length > 200000) { truncated = true; return; }
    for (let i = 0; i < text.length; i++) {
      if (text[i] === '"' || text[i] === "'") { i = stringEnd(text, i); continue; }
      const match = text.slice(i).match(/^([-a-z]+)\(/i);
      if (!match) continue;
      const name = match[1].toLowerCase(), start = i + match[0].length;
      let end = start, depth = 1;
      for (; end < text.length; end++) {
        if (text[end] === '"' || text[end] === "'") end = stringEnd(text, end);
        else if (text[end] === '\\') end++;
        else if (text[end] === '(') depth++;
        else if (text[end] === ')' && --depth === 0) break;
      }
      const body = text.slice(start, end).trim();
      if (name === 'url') {
        const quoted = body[0] === '"' || body[0] === "'";
        emit(unescapeCss(quoted ? body.slice(1, stringEnd(body, 0)) : body), candidate);
      } else if (name === 'image-set' || name === '-webkit-image-set') {
        let part = 0, nesting = 0;
        for (let j = 0; j <= body.length; j++) {
          if (body[j] === '"' || body[j] === "'") j = stringEnd(body, j);
          else if (body[j] === '(') nesting++;
          else if (body[j] === ')') nesting--;
          if (j === body.length || (body[j] === ',' && nesting === 0)) {
            const entry = body.slice(part, j).trim();
            if (entry[0] === '"' || entry[0] === "'") emit(unescapeCss(entry.slice(1, stringEnd(entry, 0))), true);
            else cssImages(entry, emit, true);
            part = j + 1;
          }
        }
      } else if (name !== 'type') cssImages(body, emit, candidate);
      i = end;
    }
  }
  function collectCss(node, style, pseudo = '') {
    for (const [property, kind] of [['backgroundImage','background'],['content','content'],['maskImage','mask'],['webkitMaskImage','mask'],['borderImageSource','border'],['listStyleImage','list']]) {
      if (property === 'listStyleImage' && !style.display?.includes('list-item')) continue;
      if (property === 'content' && !pseudo && ['img','video','input'].includes(node.localName)) continue;
      cssImages(style[property], (raw, variant) => add(raw, node, kind, {
        source:property, variant, usage:variant ? 'declared' : 'selected', pseudo
      }));
    }
  }
  for (let index = 0; index < roots.length; index++) {
    for (const node of roots[index].querySelectorAll('*')) {
      if (++examined > 50000) { truncated = true; break; }
      if (hiddenBranch(node)) continue;
      if (node.shadowRoot) roots.push(node.shadowRoot);
      if (node.localName === 'iframe') framesSkipped++;
      const tag = node.localName, hasLayout = hasBox(node);
      const svgDefinition = tag === 'image' && !!node.closest('defs, symbol, pattern, marker, mask, clipPath');
      // A broken or JS-lazy img can have no box before its resource is loaded.
      // Keep its declared references without calling them rendered images.
      // SVG definitions have no painted box until referenced, but their image
      // resources are still useful declared sources, never selected images.
      if (!rendered(node, (tag === 'img' || svgDefinition) && !hasLayout)) continue;
      if (tag === 'img') {
        let primary = false;
        const collect = (raw, source, selected = false) => {
          if (add(raw, node, 'img', {source, variant:primary, usage:selected && hasLayout ? 'selected' : 'declared'})) primary = true;
        };
        collect(node.currentSrc, 'currentSrc', true);
        collect(node.getAttribute('src'), 'src', !node.currentSrc);
        for (const name of ['data-src','data-lazy-src','data-original','data-original-src']) collect(node.getAttribute(name), name);
        for (const name of ['srcset','data-srcset','data-lazy-srcset']) srcset(node.getAttribute(name), raw => collect(raw, name));
        if (node.parentElement?.localName === 'picture') {
          for (const source of node.parentElement.children) {
            if (source.localName !== 'source') continue;
            for (const name of ['srcset','data-srcset','data-lazy-srcset']) srcset(source.getAttribute(name), raw => collect(raw, 'picture ' + name));
          }
        }
      } else if (tag === 'input' && node.type === 'image') add(node.getAttribute('src'), node, 'input');
      else if (tag === 'image') {
        add(node.getAttribute('href') || node.getAttribute('xlink:href'), node, 'svg-image', {
          source:svgDefinition ? 'SVG definice' : 'svg-image', usage:svgDefinition ? 'declared' : 'selected'
        });
      }
      // The poster attribute remains present while video plays; do not claim it
      // is the current frame. It is still a useful declared image resource.
      else if (tag === 'video') add(node.getAttribute('poster'), node, 'poster', {usage:'declared'});
      collectCss(node, styleOf(node));
      for (const pseudo of ['::before','::after','::marker']) {
        const style = getComputedStyle(node, pseudo);
        if (!style || !style.content || ['none','normal'].includes(style.content) ||
            style.display === 'none' || /^(hidden|collapse)$/.test(style.visibility) || parseFloat(style.opacity) === 0) continue;
        collectCss(node, style, pseudo);
      }
    }
    if (examined > 50000) break;
  }
  return {items, url:location.href, title:document.title, capturedAt:Date.now(), scanToken:registry.token, truncated, framesSkipped, unsupported};
}
