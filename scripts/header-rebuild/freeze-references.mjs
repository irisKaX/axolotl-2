import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const referenceRoot = process.argv[2];
if (!referenceRoot) throw new Error('Pass the pinned visual-lab checkout path. Serve B on 4175 and C2 on 4176.');
const { capturePillNav } = await import(pathToFileURL(`${referenceRoot}/scripts/audit-pillnav-regression.mjs`));
const output = 'docs/header-rebuild/references';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROME_EXECUTABLE || '/usr/bin/chromium', args: ['--no-sandbox'] });
const records = [];
try {
  for (const variant of ['C2', 'B']) for (const theme of ['dark', 'light']) for (const width of [1440, 1024, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 844 }, reducedMotion: 'reduce', locale: 'cs-CZ', timezoneId: 'Europe/Prague' });
    await page.clock.setFixedTime(new Date('2026-10-18T10:24:00Z'));
    const entry = variant === 'C2' ? 'header-responsive-lab' : 'header-visual-lab';
    const url = `http://127.0.0.1:${variant === 'C2' ? 4176 : 4175}/axolotl-2/${entry}.html?view=scene&variant=${variant}&theme=${theme}`;
    await page.goto(url);
    await page.locator('.hr-bar').waitFor();
    await page.screenshot({ path: `${output}/${variant}-${theme}-${width}-closed.png` });
    const geometry = await page.locator('.hr-bar').evaluate(el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return { x:r.x,y:r.y,width:r.width,height:r.height,background:s.background,shadow:s.boxShadow }; });
    const states = await capturePillNav(page, width);
    await page.screenshot({ path: `${output}/${variant}-${theme}-${width}-navigation.png` });
    records.push({ variant, theme, width, geometry, states });
    if (variant === 'B') {
      for (const [name, label] of [['settings','Nastavení'],['notifications','Upozornění'],['tabs','Vybrat kartu prohlížeče']]) {
        await page.goto(url);
        await page.getByRole('button', { name: label, exact: true }).click();
        await page.screenshot({ path: `${output}/B-${theme}-${width}-${name}.png` });
      }
      await page.goto(url);
      await page.getByRole('textbox', { name: 'Aktuální URL' }).focus();
      await page.screenshot({ path: `${output}/B-${theme}-${width}-url-focus.png` });
    }
    await page.close();
  }
  await writeFile(`${output}/computed.json`, JSON.stringify({ c2:'5bc0bd8fc6463fa8ad7d8e051e181386da2af486', b:'f25ab73bfb4f7d1de6bc63215c6247dc91bd29d6', method:'Chromium screenshots + computed styles; fixed clock; real pinned reference applications', records }, null, 2));
  console.log(`Frozen ${records.length} reference scenes and panel screenshots.`);
} finally { await browser.close(); }
