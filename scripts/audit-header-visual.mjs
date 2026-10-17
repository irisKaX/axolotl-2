/** Reproducible computed-style audit; no live sites, credentials or production writes. */
import { createServer } from 'vite';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const output = resolve(process.argv[2] || '/tmp/axolotl-header-audit');
await mkdir(output, { recursive: true });
const server = await createServer({ server: { host: '127.0.0.1', port: 4175, strictPort: true } });
await server.listen();
let browser;
const records = [];
try {
  browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROME_EXECUTABLE || undefined });
  for (const variant of ['C2', 'A', 'B', 'C']) for (const theme of ['dark', 'light']) for (const width of [1440, 1024, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 844 }, reducedMotion: 'reduce' });
    const entry = variant === 'C2' ? 'header-responsive-lab' : 'header-visual-lab';
    await page.goto(`http://127.0.0.1:4175/axolotl-2/${entry}.html?view=scene&variant=${variant}&theme=${theme}`);
    await page.locator('.hr-bar').waitFor();
    await page.evaluate(() => document.fonts.ready);
    const selectors = { nav: '.axolotl-pill-nav__item', menu: '.hr-trigger', url: '.axolotl-url-bar', input: '.axolotl-url-input', tabs: '.axolotl-tabs-trigger', bell: '.axolotl-header-icon-button', settings: '.axolotl-settings-trigger', theme: '.axolotl-header-theme', track: '.axolotl-header-theme-track', clock: '.axolotl-header-clock', bar: '.hr-bar' };
    const idle = await page.evaluate(selectors => Object.fromEntries(Object.entries(selectors).map(([name, selector]) => {
      const el = document.querySelector(selector); if (!el) return [name, null];
      const c = getComputedStyle(el), b = el.getBoundingClientRect(), p = getComputedStyle(el, '::before');
      return [name, { width: b.width, height: b.height, x: b.x, y: b.y, font: c.fontSize, color: c.color, background: c.background, radius: c.borderRadius, shadow: c.boxShadow, gap: c.gap, display: c.display, insetSurface: p.content !== 'none' ? { inset: p.inset, background: p.background, shadow: p.boxShadow } : null }];
    })), selectors);
    const states = {};
    for (const name of ['Upozornění', 'Nastavení']) {
      const trigger = page.getByRole('button', { name, exact: true });
      await trigger.click();
      states[name] = await trigger.evaluate(el => ({ expanded: el.getAttribute('aria-expanded'), ink: getComputedStyle(el).color, background: getComputedStyle(el).background, insetSurface: getComputedStyle(el, '::before').background }));
      await page.keyboard.press('Escape'); await page.mouse.move(width - 1, 800);
    }
    await page.getByRole('textbox', { name: 'Aktuální URL', exact: true }).focus();
    states.urlFocus = await page.locator('.axolotl-url-bar').evaluate(el => ({ outline: getComputedStyle(el).outline, offset: getComputedStyle(el).outlineOffset }));
    await page.getByRole('textbox', { name: 'Aktuální URL', exact: true }).press('Escape');
    await page.screenshot({ path: `${output}/${variant}-${theme}-${width}.png` });
    records.push({ variant, theme, width, height: 844, idle, states });
    await page.close();
  }
  await writeFile(`${output}/computed.json`, JSON.stringify({ method: 'Chromium getComputedStyle + getBoundingClientRect; reduced motion; real React components. Dimensions in CSS px. C2 reference source unchanged from 5bc0bd8.', records }, null, 2));
  console.log(`Audited ${records.length} scenes. Results: ${output}/computed.json`);
} finally {
  await browser?.close(); await server.close();
}
