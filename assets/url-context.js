(() => {
  const form = document.getElementById('axolotl-url-form');
  const input = document.getElementById('axolotl-current-url');
  const control = document.getElementById('axolotl-tabs-control');
  const trigger = document.getElementById('axolotl-tabs-toggle');
  const panel = document.getElementById('axolotl-tabs-panel');
  const list = document.getElementById('axolotl-tabs-list');
  const status = document.getElementById('axolotl-url-status');
  const auto = document.getElementById('axolotl-tab-auto');
  const connect = document.getElementById('axolotl-tabs-connect');
  const hoverPointer = matchMedia('(hover: hover) and (pointer: fine)');
  const storageKey = 'axolotl-2-target-url';
  let mode = 'auto';
  let selectedId = null;
  let currentUrl = '';
  let tabs = [];
  let connected = false;
  let automaticId = null;
  let openedByHover = false;
  let closeTimer;
  let pendingRequest = null;
  let requestTimer;
  let listSignature = '';
  let contextSignature = '';

  function normalizeUrl(value) {
    const text = value.trim();
    if (!text) return '';
    if (/\s/.test(text)) throw new Error('URL obsahuje mezery.');
    const hasScheme = /^[a-z][a-z\d+.-]*:/i.test(text) && !/^[^/:]+:\d+(?:[/?#]|$)/.test(text);
    const url = new URL(hasScheme ? text : 'https://' + text);
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname) throw new Error('Použij webovou URL.');
    return url.href;
  }

  try {
    const saved = sessionStorage.getItem(storageKey);
    if (saved) { currentUrl = normalizeUrl(saved); mode = 'manual'; }
  } catch { /* Storage is optional. */ }

  // A shared context for future tools, independent of the active Axolotl section.
  function publishContext() {
    const detail = { url: currentUrl, tabId: mode === 'manual' ? null : selectedId, source: mode };
    const signature = JSON.stringify(detail);
    if (signature === contextSignature) return;
    contextSignature = signature;
    window.axolotlPageContext = Object.freeze(detail);
    document.dispatchEvent(new CustomEvent('axolotl:url-change', { detail }));
  }

  function updateUrl(url, force = false) {
    const changed = currentUrl !== url;
    currentUrl = url;
    if (force || document.activeElement !== input) {
      input.value = url;
      input.removeAttribute('aria-invalid');
      input.setCustomValidity('');
    }
    input.title = url || 'Vlož URL stránky';
    if (changed || force) publishContext();
  }

  function render() {
    if (connected && mode !== 'manual') {
      if (mode === 'tab' && !tabs.some(tab => tab.id === selectedId)) mode = 'auto';
      if (mode === 'auto') selectedId = automaticId;
      updateUrl(tabs.find(tab => tab.id === selectedId)?.url || '');
    }
    auto.hidden = !connected;
    auto.setAttribute('aria-pressed', String(mode === 'auto'));
    connect.hidden = connected;
    const message = connected
      ? (tabs.length ? 'Vyber stránku pro práci v Axolotlu.' : 'V tomto okně zatím není otevřená jiná webová stránka.')
      : 'URL můžeš zadat ručně. Pro výběr karet připoj rozšíření Axolotl.';
    if (status.textContent !== message) status.textContent = message;
    const signature = JSON.stringify([tabs, mode, selectedId, connected]);
    if (signature !== listSignature) {
      const focusedId = document.activeElement?.dataset.axolotlTabId;
      list.replaceChildren();
      if (connected) for (const tab of tabs) {
        const li = document.createElement('li');
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'axolotl-tab-option';
        button.dataset.axolotlTabId = String(tab.id);
        button.setAttribute('aria-pressed', String(selectedId === tab.id && mode !== 'manual'));
        button.title = tab.url;
        const title = document.createElement('span');
        title.textContent = tab.title || new URL(tab.url).hostname;
        const address = document.createElement('small');
        address.textContent = tab.url;
        button.append(title, address);
        button.addEventListener('click', () => {
          mode = 'tab';
          selectedId = tab.id;
          try { sessionStorage.removeItem(storageKey); } catch { /* Optional. */ }
          updateUrl(tab.url, true);
          render();
          setOpen(false, true);
        });
        li.append(button);
        list.append(li);
      }
      if (focusedId && !panel.hidden) {
        const previous = [...list.querySelectorAll('button')].find(button => button.dataset.axolotlTabId === focusedId);
        (previous || auto).focus();
      }
      listSignature = signature;
    }
    publishContext();
  }

  function setOpen(open, returnFocus = false) {
    clearTimeout(closeTimer);
    const wasOpen = !panel.hidden;
    panel.hidden = !open;
    trigger.setAttribute('aria-expanded', String(open));
    if (!open) openedByHover = false;
    if (open && !wasOpen) {
      document.dispatchEvent(new Event('axolotl:tabs-open'));
      requestTabs();
    }
    if (returnFocus) trigger.focus();
  }

  function commitManual() {
    try {
      const url = normalizeUrl(input.value);
      mode = 'manual';
      selectedId = null;
      updateUrl(url, true);
      try {
        if (url) sessionStorage.setItem(storageKey, url);
        else sessionStorage.removeItem(storageKey);
      } catch { /* Optional. */ }
      render();
      return true;
    } catch {
      input.setCustomValidity('Zadej platnou adresu webu, například https://example.cz.');
      input.setAttribute('aria-invalid', 'true');
      input.reportValidity();
      return false;
    }
  }

  input.addEventListener('input', () => { input.setCustomValidity(''); input.removeAttribute('aria-invalid'); });
  input.addEventListener('change', commitManual);
  input.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      updateUrl(currentUrl, true);
      input.blur();
    }
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (commitManual()) input.blur();
  });
  auto.addEventListener('click', () => {
    mode = 'auto';
    try { sessionStorage.removeItem(storageKey); } catch { /* Optional. */ }
    render();
    setOpen(false, true);
  });
  control.addEventListener('pointerenter', event => {
    if (event.pointerType !== 'mouse' || !hoverPointer.matches) return;
    clearTimeout(closeTimer);
    if (panel.hidden) { openedByHover = true; setOpen(true); }
  });
  control.addEventListener('pointerleave', () => {
    closeTimer = setTimeout(() => {
      if (!panel.contains(document.activeElement)) setOpen(false);
    }, 150);
  });
  trigger.addEventListener('click', () => {
    if (!panel.hidden && openedByHover) openedByHover = false;
    else setOpen(panel.hidden);
  });
  control.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) { event.preventDefault(); setOpen(false, true); return; }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    setOpen(true);
    const items = [...panel.querySelectorAll('button:not([hidden]), a:not([hidden])')];
    const index = items.indexOf(document.activeElement);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1
      : event.key === 'ArrowDown' ? (index + 1) % items.length : (index < 0 ? items.length - 1 : (index - 1 + items.length) % items.length);
    items[next]?.focus();
  });
  control.addEventListener('focusout', () => setTimeout(() => {
    if (!control.contains(document.activeElement)) setOpen(false);
  }, 0));
  document.addEventListener('pointerdown', event => { if (!control.contains(event.target)) setOpen(false); });
  for (const name of ['axolotl:settings-open', 'axolotl:navigation-open']) document.addEventListener(name, () => setOpen(false));

  function requestTabs() {
    if (document.hidden || pendingRequest) return;
    pendingRequest = crypto.randomUUID();
    window.postMessage({ source: 'axolotl-page', type: 'AXOLOTL_GET_TABS', requestId: pendingRequest }, location.origin);
    requestTimer = setTimeout(() => {
      pendingRequest = null;
      connected = false;
      tabs = [];
      if (mode !== 'manual') { selectedId = null; updateUrl(''); }
      render();
    }, 1800);
  }

  window.addEventListener('message', event => {
    if (event.source !== window || event.origin !== location.origin) return;
    const data = event.data;
    if (!data || data.source !== 'axolotl-extension' || data.type !== 'AXOLOTL_TABS' || data.requestId !== pendingRequest || !pendingRequest) return;
    clearTimeout(requestTimer);
    pendingRequest = null;
    connected = data.ok === true && Array.isArray(data.tabs);
    tabs = connected ? data.tabs.filter(tab => {
      if (!Number.isInteger(tab.id) || typeof tab.url !== 'string' || typeof tab.title !== 'string') return false;
      try { return /^https?:\/\//.test(tab.url) && normalizeUrl(tab.url) === tab.url; } catch { return false; }
    }) : [];
    automaticId = tabs.some(tab => tab.id === data.activeId) ? data.activeId : tabs[0]?.id ?? null;
    if (!connected && mode !== 'manual') { selectedId = null; updateUrl(''); }
    render();
  });
  window.addEventListener('focus', requestTabs);
  document.addEventListener('visibilitychange', requestTabs);
  input.value = currentUrl;
  render();
  requestTabs();
  setInterval(requestTabs, 2500);
})();
