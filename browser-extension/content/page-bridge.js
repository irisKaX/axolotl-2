(() => {
  'use strict';
  const api = globalThis.__O2Tools;
  if (!api || api.bridgeInstalled) return;
  api.bridgeInstalled = true;
  chrome.runtime.onMessage.addListener((message, sender, respond) => {
    if (message?.channel !== 'o2-page' || sender.id !== chrome.runtime.id) return false;
    const payload = { ...(message.payload || {}), session: message.session };
    const handlers = {
      PING: () => ({ version: api.version, documentId: api.documentId }),
      PDF_SCAN: () => api.pdfScan(payload),
      PICK_START: () => api.pickStart(payload),
      PICK_CANCEL: () => api.pickCancel(false, message.session),
      CAPTURE_METRICS: () => api.captureMetrics(),
      CAPTURE_BEGIN: () => api.captureBegin(payload),
      CAPTURE_SCROLL: () => api.captureScroll(payload),
      CAPTURE_END: () => api.captureEnd(payload),
      CLEANUP_SESSION: () => {
        api.pickCancel(false, message.session);
        api.captureEnd(payload);
        return {};
      }
    };
    const handler = handlers[message.type];
    if (!handler) {
      respond({ ok: false, error: 'Neznámá operace na stránce.' });
      return false;
    }
    Promise.resolve()
      .then(handler)
      .then(data => respond({ ok: true, data }))
      .catch(error => respond({ ok: false, error: error.message }));
    return true;
  });
})();
