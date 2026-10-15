(() => {
  const preferences = window.axolotlPreferences;
  const themeToggle = document.getElementById('axolotl-theme-toggle');
  const themeControl = document.querySelector('.axolotl-theme-control');
  const themeChoice = document.getElementById('axolotl-theme-choice');
  const textChoice = document.getElementById('axolotl-text-choice');
  const motionChoice = document.getElementById('axolotl-motion-choice');
  const savedMessage = document.getElementById('axolotl-preferences-status');

  function renderPreferences() {
    const state = preferences.get();
    themeToggle.checked = state.resolvedTheme === 'dark';
    themeControl.title = state.resolvedTheme === 'dark' ? 'Přepnout na světlý režim' : 'Přepnout na tmavý režim';
    themeChoice.value = state.theme;
    textChoice.value = state.textSize;
    motionChoice.value = state.motion;
  }

  function saveChoice(name, value) {
    preferences.set(name, value);
    try {
      const saved = localStorage.getItem({ theme: 'axolotl-2-theme', textSize: 'axolotl-2-text-size', motion: 'axolotl-2-motion' }[name]);
      savedMessage.textContent = saved === value ? 'Změny jsou uložené v tomto prohlížeči.' : 'Změna platí nyní. Prohlížeč nepovolil její uložení.';
    } catch { savedMessage.textContent = 'Změna platí nyní. Prohlížeč nepovolil její uložení.'; }
  }

  themeToggle.addEventListener('change', () => saveChoice('theme', themeToggle.checked ? 'dark' : 'light'));
  themeChoice.addEventListener('change', () => saveChoice('theme', themeChoice.value));
  textChoice.addEventListener('change', () => saveChoice('textSize', textChoice.value));
  motionChoice.addEventListener('change', () => saveChoice('motion', motionChoice.value));
  document.addEventListener('axolotl:preferences-change', renderPreferences);
  renderPreferences();

  const settings = document.querySelector('.axolotl-settings');
  const toggle = document.getElementById('axolotl-settings-toggle');
  const panel = document.getElementById('axolotl-settings-panel');
  const home = document.getElementById('axolotl-settings-home');
  const views = [...settings.querySelectorAll('[data-axolotl-settings-view]')];
  const openers = [...settings.querySelectorAll('[data-axolotl-settings-open]')];
  const hoverPointer = matchMedia('(hover: hover) and (pointer: fine)');
  let closeTimer;
  let openedByHover = false;
  let previousOpener = null;

  function showHome(returnFocus = false) {
    home.hidden = false;
    for (const view of views) view.hidden = true;
    settings.dataset.axolotlView = 'home';
    panel.setAttribute('aria-labelledby', 'axolotl-settings-heading');
    panel.scrollTop = 0;
    if (returnFocus) previousOpener?.focus();
  }

  function openView(opener) {
    const view = views.find(view => view.dataset.axolotlSettingsView === opener.dataset.axolotlSettingsOpen);
    if (!view) return;
    previousOpener = opener;
    home.hidden = true;
    for (const item of views) item.hidden = item !== view;
    settings.dataset.axolotlView = view.dataset.axolotlSettingsView;
    panel.setAttribute('aria-labelledby', view.getAttribute('aria-labelledby'));
    panel.scrollTop = 0;
    view.querySelector('[data-axolotl-settings-back]').focus();
    if (view.dataset.axolotlSettingsView === 'integrations') document.dispatchEvent(new Event('axolotl:browser-refresh'));
  }

  function setOpen(open, returnFocus = false) {
    clearTimeout(closeTimer);
    const wasOpen = !panel.hidden;
    toggle.setAttribute('aria-expanded', String(open));
    settings.dataset.axolotlOpen = String(open);
    panel.hidden = !open;
    if (!open) { openedByHover = false; showHome(); }
    else if (!wasOpen) document.dispatchEvent(new Event('axolotl:settings-open'));
    if (returnFocus) toggle.focus();
  }

  for (const opener of openers) opener.addEventListener('click', () => openView(opener));
  for (const back of settings.querySelectorAll('[data-axolotl-settings-back]')) back.addEventListener('click', () => showHome(true));
  for (const event of ['axolotl:navigation-open', 'axolotl:tabs-open']) document.addEventListener(event, () => setOpen(false));
  settings.addEventListener('pointerenter', event => {
    if (event.pointerType !== 'mouse' || !hoverPointer.matches) return;
    clearTimeout(closeTimer);
    if (panel.hidden) { openedByHover = true; setOpen(true); }
  });
  settings.addEventListener('pointerleave', () => {
    closeTimer = setTimeout(() => { if (!panel.contains(document.activeElement)) setOpen(false); }, 150);
  });
  toggle.addEventListener('click', () => {
    if (!panel.hidden && openedByHover) openedByHover = false;
    else setOpen(panel.hidden);
  });
  toggle.addEventListener('keydown', event => {
    if (event.key !== 'ArrowDown') return;
    event.preventDefault();
    setOpen(true);
    showHome();
    openers[0]?.focus();
  });
  document.addEventListener('pointerdown', event => { if (!settings.contains(event.target)) setOpen(false); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) { event.preventDefault(); setOpen(false, true); }
  });
  settings.addEventListener('focusout', () => setTimeout(() => {
    if (!settings.contains(document.activeElement) && !settings.matches(':hover')) setOpen(false);
  }, 0));
  showHome();

  const browserStatus = document.getElementById('axolotl-browser-status');
  const browserDetail = document.getElementById('axolotl-browser-detail');
  const refresh = document.getElementById('axolotl-browser-refresh');
  function renderConnection() {
    const state = window.axolotlBrowserConnection || { status: 'checking', tabCount: 0 };
    browserStatus.dataset.axolotlStatus = state.status;
    browserStatus.textContent = state.status === 'checking' ? 'Ověřuji propojení…' : state.status === 'connected' ? 'Prohlížeč je propojený' : 'Prohlížeč není propojený';
    browserDetail.textContent = state.status === 'connected'
      ? 'Dostupné webové karty v tomto okně: ' + state.tabCount + '. Vybereš je ikonou karet vedle URL.'
      : state.status === 'checking' ? 'Čekám na odpověď rozšíření Axolotl.' : 'Pro výběr otevřených karet načti rozšíření Axolotl do Chrome nebo Edge. URL můžeš dál zadávat ručně.';
    refresh.setAttribute('aria-disabled', String(state.status === 'checking'));
    refresh.textContent = state.status === 'checking' ? 'Ověřuji…' : 'Ověřit propojení';
  }
  refresh.addEventListener('click', () => {
    if (refresh.getAttribute('aria-disabled') !== 'true') document.dispatchEvent(new Event('axolotl:browser-refresh'));
  });
  document.addEventListener('axolotl:browser-connection-change', renderConnection);
  renderConnection();
})();
