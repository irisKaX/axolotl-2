const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../assets/preferences.js'), 'utf8');

function boot(initial = {}, blocked = false) {
  const storage = new Map(Object.entries(initial));
  const events = [];
  const listeners = {};
  const queries = new Map();
  const document = { documentElement: { dataset: {} }, querySelector: () => ({}), dispatchEvent: event => events.push(event) };
  const window = { addEventListener: (type, listener) => { listeners[type] = listener; } };
  vm.runInNewContext(source, {
    document, window,
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } },
    localStorage: {
      getItem(key) { if (blocked) throw new Error('Blocked'); return storage.get(key) ?? null; },
      setItem(key, value) { if (blocked) throw new Error('Blocked'); storage.set(key, value); }
    },
    matchMedia(query) {
      const media = { matches: false, addEventListener(type, listener) { this.listener = listener; } };
      queries.set(query, media);
      return media;
    }
  });
  return {
    api: window.axolotlPreferences, root: document.documentElement, storage, events,
    system(query, matches) { const media = queries.get(query); media.matches = matches; media.listener(); },
    stored(key, newValue) { if (newValue === null) storage.delete(key); else storage.set(key, newValue); listeners.storage({ key }); }
  };
}

test('defaults remain dark and saved settings survive a fresh page', () => {
  const app = boot();
  assert.equal(app.root.dataset.theme, 'dark');
  app.api.set('theme', 'light');
  app.api.set('textSize', 'large');
  app.api.set('motion', 'reduced');
  const next = boot(Object.fromEntries(app.storage));
  assert.equal(next.root.dataset.theme, 'light');
  assert.equal(next.root.dataset.textSize, 'large');
  assert.equal(next.root.dataset.motion, 'reduced');
});

test('system theme follows live OS changes; manual choice overrides them', () => {
  const app = boot();
  app.api.set('theme', 'system');
  assert.equal(app.root.dataset.theme, 'light');
  app.system('(prefers-color-scheme: dark)', true);
  assert.equal(app.root.dataset.theme, 'dark');
  app.api.set('theme', 'light');
  app.system('(prefers-color-scheme: dark)', false);
  app.system('(prefers-color-scheme: dark)', true);
  assert.equal(app.root.dataset.theme, 'light');
});

test('motion respects the system unless explicitly configured', () => {
  const app = boot();
  app.system('(prefers-reduced-motion: reduce)', true);
  assert.equal(app.root.dataset.motion, 'reduced');
  app.api.set('motion', 'full');
  assert.equal(app.root.dataset.motion, 'full');
  app.api.set('motion', 'reduced');
  app.system('(prefers-reduced-motion: reduce)', false);
  assert.equal(app.root.dataset.motion, 'reduced');
});

test('invalid values are rejected and unavailable storage does not break controls', () => {
  const app = boot({ 'axolotl-2-theme': 'invalid' });
  assert.equal(app.root.dataset.theme, 'dark');
  assert.equal(app.api.set('theme', 'invalid'), false);
  assert.equal(app.api.set('__proto__', 'light'), false);
  const blocked = boot({}, true);
  assert.equal(blocked.api.set('theme', 'light'), true);
  assert.equal(blocked.root.dataset.theme, 'light');
});

test('changes from another app tab are applied without redundant notifications', () => {
  const app = boot();
  app.stored('axolotl-2-theme', 'light');
  assert.equal(app.root.dataset.theme, 'light');
  const count = app.events.length;
  app.stored('axolotl-2-theme', 'light');
  assert.equal(app.events.length, count);
  app.stored('axolotl-2-theme', null);
  assert.equal(app.root.dataset.theme, 'dark');
});
