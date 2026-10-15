// Read synchronously before styles paint. Keep this key in sync with theme.js.
(() => {
  let theme = 'light';
  try {
    if (localStorage.getItem('o2-axolotl-theme') === 'dark') theme = 'dark';
  } catch {}
  document.documentElement.dataset.theme = theme;
})();
