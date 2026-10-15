(() => {
  'use strict';
  if (globalThis.__O2Tools?.version === '1.3.4') return;
  const randomToken = () =>
    Array.from(crypto.getRandomValues(new Uint32Array(4)), n => n.toString(16)).join('-');
  const api = { version: '1.3.4', documentId: randomToken(), randomToken };
  api.roots = () => {
    const roots = [document];
    for (let i = 0; i < roots.length && roots.length < 500; i++) {
      for (const el of roots[i].querySelectorAll('*'))
        if (el.shadowRoot && !el.closest('[data-o2-tools-ui]')) roots.push(el.shadowRoot);
    }
    return roots;
  };
  api.emit = (type, session, data = {}) => {
    if (!globalThis.chrome?.runtime?.id) return Promise.resolve();
    return chrome.runtime.sendMessage({ channel: 'o2-content', type, session, data }).catch(() => {});
  };
  api.ui = (name, css = '') => {
    const host = document.createElement('div');
    host.setAttribute('data-o2-tools-ui', name);
    host.style.cssText =
      'all:initial!important;position:fixed!important;left:0!important;top:0!important;width:0!important;height:0!important;z-index:2147483647!important;pointer-events:none!important;';
    const root = host.attachShadow({ mode: 'closed' });
    const style = document.createElement('style');
    style.textContent =
      ':host{color-scheme:light}*{box-sizing:border-box;font-family:Arial,sans-serif}button{font:600 13px Arial;border:0;border-radius:8px;cursor:pointer;padding:10px 14px;background:#F2F6FF;color:#00008C}button:focus-visible{outline:3px solid #82DCFA;outline-offset:2px}button:hover{background:#D9E5FF}.bar{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:10px;padding:12px 14px;background:#00008C;color:white;border:1px solid #6696FF;border-radius:14px;box-shadow:0 8px 30px #00001e33;pointer-events:auto;max-width:calc(100vw - 30px);font-size:14px;white-space:nowrap}.brand{font-weight:700;padding:0 8px}.hint{padding-right:8px;color:#D9E5FF}.primary{background:#FADC00;color:#00001E}.count{min-width:65px;text-align:center}' +
      css + (globalThis.__O2WebOpsScrollbarSkin || '');
    root.append(style);
    document.documentElement.append(host);
    return { host, root };
  };
  api.button = (text, fn, className = '') => {
    const el = document.createElement('button');
    el.type = 'button';
    el.textContent = text;
    el.className = className;
    el.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      fn(event);
    });
    return el;
  };
  globalThis.__O2Tools = api;
})();
