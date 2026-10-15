(() => {
  window.addEventListener('message', event => {
    if (event.source !== window || event.origin !== location.origin) return;
    const data = event.data;
    if (!data || data.source !== 'axolotl-page' || data.type !== 'AXOLOTL_GET_TABS' || typeof data.requestId !== 'string' || data.requestId.length > 80) return;
    const reply = result => window.postMessage({
      source: 'axolotl-extension', type: 'AXOLOTL_TABS', requestId: data.requestId,
      ok: result?.ok === true, tabs: result?.tabs || [], activeId: result?.activeId ?? null
    }, location.origin);
    try {
      chrome.runtime.sendMessage({ type: 'AXOLOTL_GET_TABS' }).then(reply).catch(() => reply(null));
    } catch { reply(null); }
  });
})();
