/** Self-contained: executed in the selected tab's isolated world, without page mutations. */
export function collectImages() {
  const found = new Map(),
    roots = [document];
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
  function rendered(node) {
    const style = styleOf(node);
    if (style.visibility === 'hidden' || style.visibility === 'collapse') return false;
    if (![...node.getClientRects()].some(rect => rect.width > 0 && rect.height > 0)) return false;
    const rect = node.getBoundingClientRect();
    let left = rect.left, right = rect.right, top = rect.top, bottom = rect.bottom;
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
  const normalize = (raw, base) => {
    if (!raw || typeof raw !== 'string') return null;
    try {
      const url = new URL(raw.trim(), base);
      if (url.username || url.password) return null;
      if (url.protocol === 'data:')
        return /^data:image\/(?:png|jpeg|gif|webp|avif|svg\+xml|bmp|x-icon|vnd.microsoft.icon)[;,]/i.test(
          raw
        ) && raw.length <= 2 * 1024 * 1024
          ? raw
          : null;
      if (!['https:', 'http:'].includes(url.protocol)) {
        if (url.protocol === 'blob:') unsupported++;
        return null;
      }
      if (url.href.length > 8192) {
        truncated = true;
        return null;
      }
      url.hash = '';
      return url.href;
    } catch {
      return null;
    }
  };
  function add(raw, node, source, { variant = false, width = 0, height = 0 } = {}) {
    const url = normalize(raw, node.baseURI);
    if (!url) return;
    const known = found.get(url);
    if (known) {
      if (!known.sources.includes(source)) known.sources.push(source);
      known.variant = known.variant && variant;
      if (!known.alt) known.alt = clean(node.getAttribute('alt'));
      if (width && height) {
        known.width = width;
        known.height = height;
      }
      if (!known.nodes.has(node)) {
        known.nodes.add(node);
        known.occurrences++;
      }
      return;
    }
    if (found.size >= 2000) {
      truncated = true;
      return;
    }
    if (url.startsWith('data:')) {
      if (dataBytes + url.length > 4 * 1024 * 1024) {
        truncated = true;
        return;
      }
      dataBytes += url.length;
    }
    let name = 'Vložený obrázek',
      extension = '';
    if (!url.startsWith('data:')) {
      try {
        name = decodeURIComponent(new URL(url).pathname.split('/').pop() || 'obrazek');
      } catch {
        name = 'obrazek';
      }
      extension = name.match(/\.(webp|jpe?g|png|gif|avif|svg|bmp|ico|tiff?|heic|heif)$/i)?.[1] || '';
    } else extension = url.match(/^data:image\/([^;,]+)/i)?.[1]?.replace('svg+xml', 'svg') || '';
    const format = extension.toLowerCase().replace('jpeg', 'jpg').replace('tiff', 'tif') || 'unknown';
    found.set(url, {
      url,
      name: clean(name),
      alt: clean(node.getAttribute('alt')),
      width,
      height,
      format,
      variant,
      sources: [source],
      occurrences: 1,
      nodes: new Set([node])
    });
  }
  // Srcset URLs may contain commas (CDN transformations, data URIs). A comma
  // inside a URL token is not a separator; descriptors delimit the candidates.
  function srcset(value, node) {
    let rest = String(value || '').trim();
    if (rest.length > 200000) {
      truncated = true;
      return;
    }
    const candidate = token => {
      if (!normalize(token, node.baseURI)) return;
      add(token, node, 'srcset', { variant: true });
    };
    while (rest) {
      rest = rest.replace(/^[\s,]+/, '');
      if (!rest) break;
      const token = rest.match(/^\S+/)?.[0] || '';
      rest = rest.slice(token.length);
      if (token.endsWith(',')) {
        candidate(token.replace(/,+$/, ''));
        continue;
      }
      candidate(token);
      const comma = rest.indexOf(',');
      rest = comma < 0 ? '' : rest.slice(comma + 1);
    }
  }
  for (let index = 0; index < roots.length; index++) {
    for (const node of roots[index].querySelectorAll('*')) {
      if (++examined > 50000) {
        truncated = true;
        break;
      }
      if (hiddenBranch(node)) continue;
      if (node.shadowRoot) roots.push(node.shadowRoot);
      const tag = node.localName;
      if (tag === 'iframe') framesSkipped++;
      const background = styleOf(node).backgroundImage || '';
      if (!['img', 'video', 'input', 'image'].includes(tag) && !/url\(/i.test(background)) continue;
      if (!rendered(node)) continue;
      if (tag === 'img') {
        // Responsive natural dimensions are density-corrected CSS pixels, not
        // the original file dimensions. They can also be rounded, so multiplying
        // by a srcset descriptor cannot recover the exact size. Keep them unknown
        // rather than hiding a large source behind a minimum-size filter.
        const responsive =
          node.getAttribute('srcset')?.trim() ||
          (node.parentElement?.localName === 'picture' &&
            [...node.parentElement.children].some(
              child => child.localName === 'source' && child.getAttribute('srcset')?.trim()
            ));
        const current = node.currentSrc || node.getAttribute('src'),
          width = responsive ? 0 : node.naturalWidth || 0,
          height = responsive ? 0 : node.naturalHeight || 0;
        if (current) add(current, node, 'img', { width, height });
        const fallback = node.getAttribute('src');
        if (fallback && normalize(fallback, node.baseURI) !== normalize(current, node.baseURI))
          add(fallback, node, 'src', { variant: true });
        // data-* values are application metadata, not proof that an image is
        // displayed. Read responsive alternatives only for a rendered img.
        srcset(node.getAttribute('srcset'), node);
        if (node.parentElement?.localName === 'picture')
          for (const source of node.parentElement.children)
            if (source.localName === 'source') srcset(source.getAttribute('srcset'), node);
      } else if (tag === 'video') add(node.getAttribute('poster'), node, 'poster');
      else if (tag === 'input' && node.type === 'image') add(node.getAttribute('src'), node, 'input');
      else if (tag === 'image')
        add(node.getAttribute('href') || node.getAttribute('xlink:href'), node, 'SVG image');
      for (const match of background.matchAll(
        /url\(\s*(?:"((?:\\.|[^"\\])*)"|'((?:\\.|[^'\\])*)'|([^)]*))\s*\)/gi
      )) {
        add((match[1] ?? match[2] ?? match[3]).replace(/\\(["'\\()])/g, '$1').trim(), node, 'pozadí');
      }
    }
    if (examined > 50000) break;
  }
  return {
    items: [...found.values()].map(({ nodes, ...item }) => item),
    url: location.href,
    title: document.title,
    capturedAt: Date.now(),
    truncated,
    unsupported,
    framesSkipped
  };
}
