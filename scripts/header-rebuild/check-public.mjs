import { chromium, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const base='https://iriskax.github.io/axolotl-preview/';
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROME_EXECUTABLE || undefined,args:['--no-sandbox'],proxy:process.env.HTTPS_PROXY?{server:process.env.HTTPS_PROXY}:undefined});
const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
const errors=[];page.on('pageerror',error=>errors.push(error.message));
const report={source:null,checks:[]};
try {
  // Pages publication runs independently of the read-only checks.
  for(let attempt=0;attempt<30;attempt++) {
    const response=await page.request.get(base+'header-rebuild/source-commit.txt?check='+Date.now());
    if(response.ok()) report.source=(await response.text()).trim();
    if(report.source===process.env.EXPECTED_HEADER_SHA) break;
    await new Promise(resolve=>setTimeout(resolve,5000));
  }
  expect(report.source).toBe(process.env.EXPECTED_HEADER_SHA);
  for(const theme of ['dark','light']) {
    await page.goto(base+'header-rebuild/?theme='+theme+'#dashboard');
    await expect(page.getByRole('banner')).toBeVisible();
    for(const name of ['Otevřít navigaci','Nastavení','Upozornění','Vybrat kartu prohlížeče']) {
      await page.getByRole('button',{name,exact:true}).click();
      const panel=page.locator('[data-header-panel]');await expect(panel).toBeVisible();
      const p=await panel.boundingBox(),h=await page.getByRole('banner').boundingBox();
      expect(p.y).toBeGreaterThanOrEqual(h.y+h.height+11);
      await page.keyboard.press('Escape');await expect(panel).not.toBeVisible();await page.mouse.move(0,800);
    }
    const input=page.getByRole('textbox',{name:'Aktuální URL'});await input.fill('example.cz');await input.press('Enter');await expect(input).toHaveValue('https://example.cz/');
    await page.getByRole('button',{name:'Nastavení',exact:true}).click();
    await page.getByRole('button',{name:'Vzhled a prostředí',exact:true}).click();
    for(const label of ['Barevný režim','Velikost textu','Animace']) {
      const trigger=page.getByRole('combobox',{name:label,exact:true});
      await trigger.click();await expect(page.getByRole('listbox',{name:label,exact:true})).toBeVisible();
      const selected=page.locator('[data-header-select] [data-state=checked]');
      expect(await selected.evaluate(el=>getComputedStyle(el).backgroundColor)).toBe('rgb(124, 58, 237)');
      await page.keyboard.press('Escape');await expect(trigger).toBeFocused();
      await expect(page.locator('[data-header-panel=settings]')).toBeVisible();
    }
    await page.keyboard.press('Escape');
    report.checks.push(theme+': public header, four popups, three custom selects, purple selection, nested Escape/focus, manual URL');
  }
  await page.goto(base+'header-rebuild/evidence/');
  await expect(page.getByRole('heading',{name:'Axolotl — izolovaný Header Rebuild'})).toBeVisible();
  await page.locator('#theme').selectOption('light');await page.locator('#width').selectOption('390');
  const images=page.locator('figure:visible img');expect(await images.count()).toBeGreaterThan(5);
  await images.first().scrollIntoViewIfNeeded();await expect(images.first()).toHaveJSProperty('naturalWidth',390);
  report.checks.push('gallery filter and full-resolution image');
  for(const entry of ['header-responsive-lab.html?view=scene&variant=C2&theme=dark','header-visual-lab.html?view=scene&variant=B&theme=light']) {
    await page.goto(base+entry);await expect(page.locator('.hr-bar')).toBeVisible();report.checks.push('original lab preserved: '+entry);
  }
  report.errors=errors;expect(errors).toEqual([]);
  await mkdir('test-results/public',{recursive:true});
  await writeFile('test-results/public/smoke.json',JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
} finally {await browser.close();}
