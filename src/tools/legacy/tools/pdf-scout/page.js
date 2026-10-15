(() => {
  'use strict';
  const api = globalThis.__O2Tools;
  if (!api || api.pdfScanVersion === '1.9.2') return;
  const normalize = (value, base) => {
    if (!value || typeof value !== 'string' || value.trim().startsWith('#')) return null;
    try {
      const u = new URL(value.trim().replace(/&amp;/gi, '&'), base);
      if (!['http:', 'https:'].includes(u.protocol) || u.username || u.password) return null;
      u.hash = '';
      return u.href;
    } catch {
      return null;
    }
  };
  const hasPdf = value => {
    try {
      return /\.pdf$/i.test(decodeURIComponent(new URL(value).pathname));
    } catch {
      return false;
    }
  };
  const documentHint =
    /pdf|download|st[aá]hn|sta[zž]en|dokument|document|cen[ií]k|podm[ií]nk|smlouv|p[rř][ií]loh|attachment/i;
  const clean = value =>
    String(value || '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 500);
  const meaningful = value => {
    const text = clean(value).replace(
      /^(?:st[aá]hnout|sta[zž]en[ií]|download)(?:\s+(?:souboru?|dokumentu?|file|pdf))?\s*[:–-]?\s*/i,
      ''
    );
    return !text || /^(?:pdf|soubor|dokument|file|otevřít|zde|↓|↧)$/i.test(text) ? '' : text;
  };
  function titleOf(el) {
    if (!el || /^(script|style|template|link)$/i.test(el.tagName)) return '';
    const labelled = clean(el.getAttribute('aria-labelledby'))
      .split(' ')
      .map(id => el.getRootNode().getElementById?.(id)?.textContent || '')
      .join(' ');
    const own =
      meaningful(labelled) ||
      meaningful(el.getAttribute('aria-label')) ||
      meaningful(el.textContent) ||
      meaningful(el.getAttribute('title'));
    if (own) return own;
    // Download buttons often say only "Stáhnout". The document name is in
    // another cell of the same row, not in the link or its filename.
    const row = el.closest('tr,[role="row"]');
    if (row) {
      const cell = [...(row.cells || row.querySelectorAll('[role="cell"],[role="rowheader"]'))].find(
        cell =>
          !cell.contains(el) &&
          meaningful(cell.textContent) &&
          !/^\d[\d\s.,]*\s*(?:[kmgt]?b|bytes?)$/i.test(clean(cell.textContent))
      );
      if (cell) return meaningful(cell.textContent);
    }
    return '';
  }
  api.pdfScan = ({ deep = true } = {}) => {
    const found = new Map();
    let examined = 0,
      truncated = false,
      textTotal = 0;
    const add = (raw, source, el, allowOther = false) => {
      const url = normalize(raw, el?.baseURI || document.baseURI);
      if (!url || url.length > 8192 || (!hasPdf(url) && !allowOther && !/\.pdf(?:\b|%)/i.test(url))) return;
      if (!hasPdf(url) && !deep) return;
      if (!hasPdf(url) && url === normalize(document.URL, document.baseURI)) return;
      if (/(?:[/?&=])(logout|signout|delete|remove|unsubscribe)(?:[/?&=]|$)/i.test(url)) return;
      const title = titleOf(el),
        download = clean(el?.getAttribute?.('download'));
      let filename = '';
      try {
        if (hasPdf(url)) filename = decodeURIComponent(new URL(url).pathname.split('/').pop() || '');
      } catch {}
      if (/\.pdf$/i.test(download)) filename = download.split(/[\\/]/).pop();
      const known = found.get(url);
      if (known) {
        if (!known.sources.includes(source)) known.sources.push(source);
        if (!known.title && title) known.title = title;
        if (!known.filename && filename) known.filename = filename;
        return;
      }
      if (found.size >= 2000) {
        truncated = true;
        return;
      }
      found.set(url, {
        url,
        name: filename || title || 'Dokument',
        title,
        filename,
        sources: [source],
        status: hasPdf(url) ? 'link' : 'possible',
        reason: hasPdf(url)
          ? 'Přípona .pdf v URL. Obsah zatím nebyl ověřen.'
          : 'Odkaz může vést k dokumentu. Typ se ověří podle odpovědi serveru.'
      });
    };
    const extract = (raw, source, el, allowOther = false) => {
      if (!raw || raw.length > 150000) {
        if (raw?.length > 150000) truncated = true;
        return;
      }
      const text = raw
        .replace(/\\\//g, '/')
        .replace(/\\u002[fF]/g, '/')
        .replace(/\\u0026/g, '&')
        .replace(/\\x2[fF]/g, '/');
      // Whole attributes first: preserve query strings and signed URLs exactly.
      if (
        !/[<>"'{}\n\r]/.test(text) &&
        !/^(?:javascript|data|mailto|tel):/i.test(text) &&
        !/^\s*(?:function|window\.|return\b)/.test(text)
      ) {
        const plausible =
          /^(?:https?:\/\/|\/|\.\.?\/)/i.test(text) || /\.pdf(?:[?#]|$)/i.test(text) || allowOther;
        if (plausible && !/[()]/.test(text)) {
          add(text, source, el, allowOther);
          return;
        }
      }
      for (const match of text.matchAll(/["']([^"'<>\r\n]+)["']/g)) {
        const value = match[1];
        if (/\.pdf(?:\b|[?#%])/i.test(value) || (allowOther && /^(https?:\/\/|\/|\.\.?\/)/i.test(value)))
          add(value, source, el, allowOther);
      }
      // Literal URL tokens in text, JSON, and inline handlers. Never eval page code.
      const unquoted = text.replace(/["']([^"'<>\r\n]+)["']/g, ' ');
      for (const match of unquoted.matchAll(
        /(?:https?:\/\/|\/\/|\.{0,2}\/)?[^\s"'<>()[\]{}\\;,=]+\.pdf(?:[?#][^\s"'<>()[\]{}\\;,]*)?/gi
      ))
        add(match[0], source, el);
    };
    for (const root of api.roots()) {
      for (const el of root.querySelectorAll('*')) {
        if (++examined > 50000) {
          truncated = true;
          break;
        }
        if (el.closest('[data-o2-tools-ui]')) continue;
        const tag = el.tagName.toLowerCase();
        const context =
          (el.textContent || '').slice(0, 300) +
          ' ' +
          (el.getAttribute('aria-label') || '') +
          ' ' +
          (el.getAttribute('type') || '');
        for (const attr of el.attributes) {
          const value = attr.value;
          if (/^(?:download|title|alt|aria-.+|class|id|type|style)$/i.test(attr.name)) continue;
          const urlAttribute =
            /^(href|src|data|action|formaction)$/i.test(attr.name) ||
            /^data-(?:href|url|src|file|document|download|pdf)$/i.test(attr.name);
          // Candidates must be actionable references, never canonical URLs or
          // analytics scripts whose referrer happens to contain "dokumenty".
          const candidateElement = !/^(script|style|link|use|img|source)$/i.test(tag);
          const reference = normalize(value, el.baseURI);
          const hinted =
            deep &&
            urlAttribute &&
            candidateElement &&
            (el.hasAttribute('download') ||
              documentHint.test(context) ||
              /(?:^|\/)(?:download|attachment|file|document)(?:[\/.-]|$)/i.test(
                reference ? new URL(reference).pathname : ''
              ));
          const pdfReference =
            /\.pdf(?:\b|%)/i.test(value) || /application\/pdf/i.test(el.getAttribute('type') || '');
          if (pdfReference || hinted || (/onclick/i.test(attr.name) && documentHint.test(value))) {
            // A URL attribute is already a complete value. Do not tokenize its
            // parentheses, apostrophes, query separators or signed parameters.
            if (
              urlAttribute &&
              !/[<>"{}\r\n]/.test(value) &&
              !/^\s*(?:\[|javascript:|data:|mailto:|tel:)/i.test(value)
            )
              add(value, `${tag}[${attr.name}]`, el, hinted);
            else extract(value, `${tag}[${attr.name}]`, el, hinted);
          }
        }
        if (tag === 'script' || tag === 'template') {
          const text = el.textContent || '';
          textTotal += text.length;
          if (textTotal < 2000000) extract(text, `${tag} / text`, el);
          else truncated = true;
        }
      }
      if (examined > 50000) break;
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode()) && textTotal < 2000000) {
        if (node.parentElement?.closest('script,style,[data-o2-tools-ui]')) continue;
        textTotal += node.length;
        if (/\.pdf(?:\b|%)/i.test(node.data)) extract(node.data, 'text / URL', node.parentElement);
      }
      if (textTotal >= 2000000) truncated = true;
    }
    return {
      items: [...found.values()].sort(
        (a, b) =>
          Number(b.status === 'link') - Number(a.status === 'link') ||
          (a.title || a.name).localeCompare(b.title || b.name, 'cs')
      ),
      truncated
    };
  };
  api.pdfScanVersion = '1.9.2';
})();
