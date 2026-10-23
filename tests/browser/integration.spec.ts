import {test,expect} from '@playwright/test';

test('the workspace keeps one measured header offset and the retired catalog redirects to Library',async({page})=>{
  await page.goto('#dashboard');
  const header=page.getByRole('banner');
  const main=page.getByRole('main');
  const snapshot=()=>header.evaluate(el=>({rect:el.getBoundingClientRect().toJSON(),background:getComputedStyle(el).background,buttons:[...el.querySelectorAll('button')].map(b=>({background:getComputedStyle(b).background,borderRadius:getComputedStyle(b).borderRadius}))}));
  const before=await snapshot();
  await expect(header.locator('.axo-animated-mark')).toHaveCount(1);
  await expect(header.locator('[data-gill]')).toHaveCount(6);
  expect(await main.evaluate(el=>getComputedStyle(el).paddingTop)).toBe('0px');
  expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight)).toBe(true);
  const workspaceUrl=page.url();
  await page.route('https://iriskax.github.io/axolotl-preview/ds-library-v1-1/**',route=>route.fulfill({contentType:'text/html',body:'<title>Canonical Library redirect target</title>'}));
  await page.goto('#design-system');
  await expect(page).toHaveURL(/^https:\/\/iriskax\.github\.io\/axolotl-preview\/ds-library-v1-1\/.*#design-system$/);
  await page.goto(workspaceUrl);
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
