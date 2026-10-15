// Loaded before painting so restored preferences do not flash the wrong theme.
(() => {
  const schema = {
    theme: { key: 'axolotl-2-theme', values: ['dark', 'light', 'system'], fallback: 'dark' },
    motion: { key: 'axolotl-2-motion', values: ['system', 'full', 'reduced'], fallback: 'system' },
    textSize: { key: 'axolotl-2-text-size', values: ['standard', 'large'], fallback: 'standard' }
  };
  const colorScheme = matchMedia('(prefers-color-scheme: dark)');
  const motionScheme = matchMedia('(prefers-reduced-motion: reduce)');
  const preferences = {};
  let lastSnapshot = '';

  function read(name) {
    const rule = schema[name];
    try {
      const value = localStorage.getItem(rule.key);
      return rule.values.includes(value) ? value : rule.fallback;
    } catch { return rule.fallback; }
  }

  function get() {
    return {
      ...preferences,
      resolvedTheme: preferences.theme === 'system' ? (colorScheme.matches ? 'dark' : 'light') : preferences.theme,
      reducedMotion: preferences.motion === 'reduced' || (preferences.motion === 'system' && motionScheme.matches)
    };
  }

  function apply() {
    const state = get();
    const root = document.documentElement;
    root.dataset.theme = state.resolvedTheme;
    root.dataset.motion = state.reducedMotion ? 'reduced' : 'full';
    root.dataset.textSize = state.textSize;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = state.resolvedTheme === 'dark' ? '#050505' : '#fafafa';
    const snapshot = JSON.stringify(state);
    if (snapshot !== lastSnapshot) {
      lastSnapshot = snapshot;
      document.dispatchEvent(new CustomEvent('axolotl:preferences-change', { detail: state }));
    }
  }

  function set(name, value) {
    if (!Object.hasOwn(schema, name) || !schema[name].values.includes(value)) return false;
    preferences[name] = value;
    try { localStorage.setItem(schema[name].key, value); } catch { /* Preferences still work without storage. */ }
    apply();
    return true;
  }

  for (const name of Object.keys(schema)) preferences[name] = read(name);
  colorScheme.addEventListener('change', apply);
  motionScheme.addEventListener('change', apply);
  window.addEventListener('storage', event => {
    for (const name of Object.keys(schema)) {
      if (event.key === null || event.key === schema[name].key) preferences[name] = read(name);
    }
    apply();
  });
  window.axolotlPreferences = Object.freeze({ get, set });
  apply();
})();
