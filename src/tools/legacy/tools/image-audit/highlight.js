/** Self-contained: executed in the same isolated world as collectImageAudit. */
export function highlightImageSource(payload) {
  const stale = 'Stránka nebo obrázek se od kontroly změnily. Spusťte kontrolu znovu.';
  const registry = globalThis.__O2_IMAGE_AUDIT__;
  registry?.cleanup?.();
  if (!registry || registry.document !== document || registry.url !== location.href ||
      payload?.pageUrl !== location.href || payload?.scanToken !== registry.token) return {ok:false, error:stale};
  const source = registry.records.get(payload.sourceId);
  if (!source || source.selector !== payload.selector || source.url !== payload.url || !source.validate()) return {ok:false, error:stale};
  const node = source.node;
  const hasBox = () => {
    const rect = node.getBoundingClientRect(), css = getComputedStyle(node);
    return node.getClientRects().length && rect.width > 0 && rect.height > 0 && css.display !== 'none' && !['hidden','collapse'].includes(css.visibility);
  };
  if (!hasBox()) return {ok:false, error:'Prvek nyní nemá viditelnou plochu. Zkontrolujte stránku znovu.'};
  node.scrollIntoView?.({behavior:'instant', block:'center', inline:'center'});
  if (!source.validate() || location.href !== registry.url) return {ok:false, error:stale};
  const host = document.createElement('div');
  host.setAttribute('data-o2-tools-ui', 'image-highlight');
  host.style.cssText = 'all:initial!important;position:fixed!important;inset:0!important;z-index:2147483647!important;pointer-events:none!important;';
  const shadow = host.attachShadow({mode:'closed'});
  const frame = document.createElement('div'), label = document.createElement('div');
  frame.style.cssText = 'position:fixed;box-sizing:border-box;border-radius:8px;outline:3px solid #147dff;box-shadow:0 0 0 6px #9663ff,0 0 0 9px #ffba87;pointer-events:none;';
  label.textContent = source.pseudo ? `Zdroj obrázku ${source.pseudo}` : 'Zdroj obrázku';
  label.style.cssText = 'position:fixed;padding:6px 10px;border-radius:7px;background:#183360;color:#fff;font:600 12px/1.4 system-ui,sans-serif;box-shadow:0 2px 10px #0003;white-space:nowrap;';
  shadow.append(frame, label);
  document.documentElement.append(host);
  let timer, expiry;
  function cleanup() {
    clearInterval(timer); clearTimeout(expiry);
    globalThis.removeEventListener?.('scroll', update, true);
    globalThis.removeEventListener?.('resize', update);
    globalThis.removeEventListener?.('pagehide', cleanup);
    host.remove();
    if (registry.cleanup === cleanup) registry.cleanup = null;
  }
  function update() {
    if (registry !== globalThis.__O2_IMAGE_AUDIT__ || document !== registry.document || location.href !== registry.url || !source.validate() || !hasBox()) { cleanup(); return; }
    const rect = node.getBoundingClientRect();
    frame.style.left = `${rect.left}px`; frame.style.top = `${rect.top}px`;
    frame.style.width = `${rect.width}px`; frame.style.height = `${rect.height}px`;
    label.style.left = `${Math.max(10, Math.min(rect.left, innerWidth - 170))}px`;
    label.style.top = `${Math.max(10, Math.min(rect.top - 40, innerHeight - 38))}px`;
  }
  registry.cleanup = cleanup;
  globalThis.addEventListener?.('scroll', update, true);
  globalThis.addEventListener?.('resize', update);
  globalThis.addEventListener?.('pagehide', cleanup);
  timer = setInterval(update, 250);
  expiry = setTimeout(cleanup, 6500);
  update();
  return {ok:true, selector:source.selector};
}
