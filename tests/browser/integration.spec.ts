import {test,expect} from '@playwright/test';

test('the production workspace uses one measured header offset, including after Header Lab loads',async({page})=>{
  await page.goto('#dashboard');
  const header=page.getByRole('banner');
  const main=page.getByRole('main');
  const snapshot=()=>header.evaluate(el=>({rect:el.getBoundingClientRect().toJSON(),background:getComputedStyle(el).background,buttons:[...el.querySelectorAll('button')].map(b=>({background:getComputedStyle(b).background,borderRadius:getComputedStyle(b).borderRadius}))}));
  const before=await snapshot();
  await expect(header.locator('.axolotl-logo-art')).not.toHaveCSS('mask-image','none');
  expect(await main.evaluate(el=>getComputedStyle(el).paddingTop)).toBe('0px');
  expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight)).toBe(true);
  await page.goto('#design-system');
  await page.getByRole('tab',{name:'Hlavička · A/B',exact:true}).click();
  await expect(page.locator('.axolotl-header-lab')).toBeVisible();
  await page.goto('#dashboard');
  expect(await snapshot()).toEqual(before);
  for(const width of [320,390,768,1024,1440]) {
    await page.setViewportSize({width,height:844});
    await expect.poll(async()=>{
      const h=(await header.boundingBox())!,m=(await main.boundingBox())!;return m.y-h.y-h.height;
    }).toBeGreaterThanOrEqual(23);
    expect(await main.evaluate(el=>getComputedStyle(el).paddingTop)).toBe('0px');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
});
