import {chromium,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROME_EXECUTABLE||undefined,args:['--no-sandbox']});
const results=[];
try {
  for(const [name,base] of [['main',process.env.REFERENCE_URL||'http://127.0.0.1:4185/axolotl-2/'],['integration',process.env.INTEGRATION_URL||'http://127.0.0.1:4173/axolotl-2/']]) {
    const page=await browser.newPage({viewport:{width:1440,height:1000},locale:'cs-CZ',timezoneId:'Europe/Prague',reducedMotion:'reduce'});
    await page.clock.setFixedTime(new Date('2026-10-18T10:24:00Z'));
    await page.goto(base+'#design-system');await page.getByRole('tab',{name:'Hlavička · A/B'}).click();
    await expect(page.locator('.axolotl-header-lab')).toBeVisible();
    await page.addStyleTag({content:'body > #axolotl-root > header, body > #axolotl-root > [data-header-space] > header { visibility:hidden; }'});
    const swatches=page.locator('.axolotl-lab-swatch');
    const records=[];
    await mkdir('docs/header-integration/lab-comparison',{recursive:true});
    for(let i=0;i<4;i++) {
      const swatch=swatches.nth(i);await swatch.scrollIntoViewIfNeeded();
      const capture=async()=>swatch.locator('button, input, .axolotl-header-control-row').evaluateAll(nodes=>nodes.map(el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return {tag:el.tagName,label:el.getAttribute('aria-label'),width:r.width,height:r.height,background:s.background,color:s.color,border:s.border,borderRadius:s.borderRadius,font:s.font,stroke:s.stroke};}));
      records.push({index:i,state:'closed',elements:await capture()});
      await swatch.screenshot({path:`docs/header-integration/lab-comparison/${name}-${i}-closed.png`});
      await swatch.getByRole('button',{name:'Nastavení',exact:true}).click();
      await expect(swatch.getByRole('button',{name:'Vzhled a prostředí'})).toBeVisible();
      records.push({index:i,state:'settings',elements:await capture()});
      await page.keyboard.press('Escape');
    }
    results.push({name,records});await page.close();
  }
  await writeFile('docs/header-integration/lab-comparison/computed.json',JSON.stringify(results,null,2));
  expect(results[1].records).toEqual(results[0].records);
  console.log('Header Lab A/B dark/light: identical computed styles and control dimensions in 8 states.');
} finally {await browser.close();}
