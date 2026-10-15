/** Asset evidence from document URLs; never infer a file ID from its parent page. */
export function collectPdfAssets({ url, finalUrl }) {
  const assets = new Map();
  function add(id, kind) {
    if (!/^a\d{1,20}$/i.test(id)) return;
    id = id.toLowerCase();
    assets.set(kind + ':' + id, { id, kind });
  }
  for (const value of new Set([url, finalUrl])) {
    if (typeof value !== 'string' || value.length > 8192) continue;
    let parsed;
    try {
      parsed = new URL(value);
    } catch {
      continue;
    }
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) continue;
    // Inspect only the path and explicit identifier parameters. Tokens in a
    // hostname, tracking value, nested return URL or fragment are not evidence.
    for (let segment of parsed.pathname.split('/')) {
      try {
        segment = decodeURIComponent(segment);
      } catch {
        continue;
      }
      for (const match of segment.matchAll(/(?<![\p{L}\p{N}])a\d{1,20}(?![\p{L}\p{N}])/giu))
        add(match[0], 'url');
    }
    for (const [key, id] of parsed.searchParams) {
      if (/^_?linka$/i.test(key)) add(id, 'link');
      else if (/^(?:id|asset(?:_?id)?)$/i.test(key)) add(id, 'url');
    }
  }
  return [...assets.values()];
}
