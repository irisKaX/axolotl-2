/** Shared preference for extension documents and the offline catalogue. */
export const THEME_KEY = 'o2-axolotl-theme';
const eventName = 'webops-theme-change';
const normalize = value => (value === 'dark' ? 'dark' : 'light');
function savedTheme() {
  try {
    return normalize(window.localStorage.getItem(THEME_KEY));
  } catch {
    return normalize(document.documentElement.dataset.theme);
  }
}
function applyTheme(value) {
  const theme = normalize(value);
  document.documentElement.dataset.theme = theme;
  window.dispatchEvent(new window.CustomEvent(eventName, { detail: theme }));
}
export function getTheme() { return normalize(document.documentElement.dataset.theme); }
export function setTheme(value) {
  const theme = normalize(value);
  try { window.localStorage.setItem(THEME_KEY, theme); } catch {}
  applyTheme(theme);
}
export function subscribeTheme(listener) {
  function sync(event) {
    if (event.key === THEME_KEY || event.key === null) applyTheme(savedTheme());
  }
  function restore() { applyTheme(savedTheme()); }
  window.addEventListener(eventName, listener);
  window.addEventListener('storage', sync);
  window.addEventListener('pageshow', restore);
  return () => {
    window.removeEventListener(eventName, listener);
    window.removeEventListener('storage', sync);
    window.removeEventListener('pageshow', restore);
  };
}
const moon = '<path d="M20.5 13A8.5 8.5 0 0 1 11 3.5a8.5 8.5 0 1 0 9.5 9.5Z"/>';
const sun =
  '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>';
export function mountThemeToggle(button) {
  button.type = 'button';
  button.classList.add('ds-action', 'theme-toggle');
  button.removeAttribute('aria-pressed');
  function render() {
    const dark = document.documentElement.dataset.theme === 'dark';
    button.title = dark ? 'Přepnout na světlý režim' : 'Přepnout na tmavý režim';
    button.setAttribute('aria-label', button.title);
    button.innerHTML =
      '<svg class="ds-action__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
      (dark ? sun : moon) +
      '</svg><span class="theme-label">' + (dark ? 'Tmavý' : 'Světlý') + '</span>';
  }
  function toggle() {
    const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    setTheme(theme);
  }
  function sync(event) {
    if (event.key === THEME_KEY || event.key === null) applyTheme(event.newValue);
  }
  function restore() {
    applyTheme(savedTheme());
  }
  button.addEventListener('click', toggle);
  window.addEventListener(eventName, render);
  window.addEventListener('storage', sync);
  window.addEventListener('pageshow', restore);
  restore();
  return {
    destroy() {
      button.removeEventListener('click', toggle);
      window.removeEventListener(eventName, render);
      window.removeEventListener('storage', sync);
      window.removeEventListener('pageshow', restore);
    }
  };
}
