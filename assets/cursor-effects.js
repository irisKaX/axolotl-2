/* Browser-local adaptation of the supplied Firefly / Click Sparks / Light Trail. */
(() => {
  const storageKey = 'axolotl-2-cursor-effects';
  const root = document.documentElement;
  const toggle = document.getElementById('axolotl-cursor-toggle');
  const status = document.getElementById('axolotl-cursor-status');
  const description = document.getElementById('axolotl-cursor-description');
  const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
  const colors = ['#0050ff', '#8154c9', '#c76b47'];
  const maxParticles = 80;
  const particles = new Map();
  let enabled = !motionPreference.matches;
  let hasSavedPreference = false;
  let lastTrailTime = 0;
  let lastPosition = null;
  let haloTimer;

  try {
    const saved = localStorage.getItem(storageKey);
    if (saved === 'true' || saved === 'false') {
      enabled = saved === 'true';
      hasSavedPreference = true;
    }
  } catch {
    // Storage is optional; the toggle remains usable.
  }

  const layer = document.createElement('div');
  layer.className = 'axolotl-cursor-layer';
  layer.id = 'axolotl-cursor-layer';
  layer.setAttribute('aria-hidden', 'true');
  const halo = document.createElement('div');
  halo.className = 'axolotl-cursor-halo';
  layer.appendChild(halo);
  document.body.appendChild(layer);

  const isLight = () => root.dataset.theme === 'light';
  const random = (min, max) => min + Math.random() * (max - min);

  function removeParticle(particle) {
    clearTimeout(particles.get(particle));
    particles.delete(particle);
    particle.remove();
  }

  function clearEffects() {
    for (const particle of particles.keys()) removeParticle(particle);
    clearTimeout(haloTimer);
    halo.style.opacity = '0';
    lastPosition = null;
    lastTrailTime = 0;
  }

  function renderSetting() {
    const reduced = root.dataset.motion === 'reduced';
    const active = enabled && !reduced;
    toggle.checked = enabled;
    toggle.disabled = reduced;
    layer.hidden = !active;
    status.textContent = reduced ? 'Pozastaveno' : enabled ? 'Zapnuto' : 'Vypnuto';
    description.textContent = reduced ? 'Efekt je pozastavený při omezení animací. Tvoje volba zapnutí zůstává zachovaná.' : isLight()
      ? 'Barevná stopa při pohybu a drobné modré, fialové a měděné částice při kliknutí.'
      : 'Jemná stopa světlušek při pohybu a malý světelný ohňostroj při kliknutí.';
    if (!active) clearEffects();
  }

  function addParticle(kind, x, y, size, dx, dy, duration, delay = 0) {
    if (particles.size >= maxParticles) removeParticle(particles.keys().next().value);
    const particle = document.createElement('i');
    particle.className = 'axolotl-cursor-particle axolotl-cursor-' + kind;
    particle.style.left = x + 'px';
    particle.style.top = y + 'px';
    particle.style.width = size + 'px';
    particle.style.height = size + 'px';
    particle.style.setProperty('--axolotl-cursor-dx', dx + 'px');
    particle.style.setProperty('--axolotl-cursor-dy', dy + 'px');
    particle.style.setProperty('--axolotl-cursor-duration', duration + 'ms');
    particle.style.setProperty('--axolotl-cursor-delay', delay + 'ms');
    particle.style.setProperty('--axolotl-cursor-color', colors[Math.floor(Math.random() * colors.length)]);
    layer.appendChild(particle);
    // The fallback also cleans up when a browser suppresses animation events.
    particles.set(particle, setTimeout(() => removeParticle(particle), duration + delay + 100));
    particle.addEventListener('animationend', () => removeParticle(particle), { once: true });
  }

  function canAnimate(event) {
    return enabled && root.dataset.motion !== 'reduced' && !document.hidden && (event.pointerType === 'mouse' || event.pointerType === 'pen');
  }

  window.addEventListener('pointermove', event => {
    if (!canAnimate(event)) return;
    const x = event.clientX;
    const y = event.clientY;
    if (!isLight()) {
      halo.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0) translate(-50%,-50%)';
      halo.style.opacity = '.8';
      clearTimeout(haloTimer);
      haloTimer = setTimeout(() => { halo.style.opacity = '0'; }, 180);
    }
    const now = performance.now();
    if (now - lastTrailTime < 32) return;
    if (lastPosition && Math.hypot(x - lastPosition.x, y - lastPosition.y) < 3) return;
    lastTrailTime = now;
    lastPosition = { x, y };
    addParticle('trail', x, y, random(2, isLight() ? 3.6 : 3), random(-7, 7), random(6, 20), 650);
  }, { passive: true });

  window.addEventListener('pointerdown', event => {
    if (event.button !== 0 || !canAnimate(event)) return;
    const count = 12;
    for (let i = 0; i < count; i++) {
      const angle = Math.PI * 2 * i / count + random(-.275, .275);
      const distance = random(22, 46);
      addParticle('spark', event.clientX, event.clientY, random(2, 4),
        Math.cos(angle) * distance, Math.sin(angle) * distance, 560, random(0, 45));
    }
  }, { passive: true });

  toggle.addEventListener('change', () => {
    enabled = toggle.checked;
    hasSavedPreference = true;
    renderSetting();
    try { localStorage.setItem(storageKey, String(enabled)); } catch { /* Optional. */ }
  });

  document.addEventListener('axolotl:preferences-change', () => {
    clearEffects();
    renderSetting();
  });

  motionPreference.addEventListener('change', event => {
    if (!hasSavedPreference) {
      enabled = !event.matches;
      renderSetting();
    }
  });

  document.documentElement.addEventListener('pointerleave', clearEffects);
  window.addEventListener('blur', clearEffects);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clearEffects();
  });

  renderSetting();
})();
