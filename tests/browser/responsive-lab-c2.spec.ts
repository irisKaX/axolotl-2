import { expect, test } from '@playwright/test';

for (const width of [1024, 768, 390, 320]) {
  test(`C2 overlays without moving the workspace at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 600 });
    await page.goto('header-responsive-lab.html?view=scene&variant=C2');
    await expect(page.locator('.hr-scene')).toHaveAttribute('data-variant', 'C2');
    const workspace = page.locator('.hr-workspace');
    const before = await workspace.boundingBox();
    const documentHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    const trigger = page.getByRole('button', { name: 'Otevřít navigaci', exact: true });
    await trigger.click();
    const panel = page.locator('#responsive-navigation');
    await expect(panel).toBeVisible();
    expect(await workspace.boundingBox()).toEqual(before);
    expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(documentHeight);
    const box = (await panel.boundingBox())!;
    const bar = (await page.locator('.hr-bar').boundingBox())!;
    expect(box.y).toBeGreaterThanOrEqual(bar.y + bar.height + 6);
    expect(box.y + box.height).toBeLessThanOrEqual(600 - 12);
    // Hit-testing proves the panel is painted above the overlapping workspace.
    expect(await page.evaluate(({ x, y }) => !!document.elementFromPoint(x, y)?.closest('#responsive-navigation'), { x: box.x + box.width / 2, y: box.y + 30 })).toBe(true);
    await page.keyboard.press('End');
    await expect(panel.getByRole('link', { name: 'Hledání na webu', exact: true })).toBeFocused();
    expect(await page.evaluate(() => scrollY)).toBe(0);
    await page.keyboard.press('Escape');
    await expect(panel).not.toBeVisible();
    await expect(trigger).toBeFocused();
    expect(await workspace.boundingBox()).toEqual(before);
    // Reopening a previously scrolled shelf must expose its initial focus.
    await trigger.click();
    const close = panel.getByRole('button', { name: 'Zavřít nabídku', exact: true });
    await expect(close).toBeFocused();
    expect((await close.boundingBox())!.y).toBeGreaterThanOrEqual((await panel.boundingBox())!.y);
    // Header controls close the nonmodal shelf and remain usable.
    await page.getByRole('button', { name: 'Nastavení', exact: true }).click();
    await expect(panel).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Vzhled a prostředí', exact: true })).toBeVisible();
    expect(await workspace.boundingBox()).toEqual(before);
  });
}

test('C2 opening and closing animations never move dashboard and closed links cannot receive focus', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 900, height: 768 });
  await page.goto('header-responsive-lab.html?view=scene&variant=C2');
  await expect(page.locator('.hr-scene')).toHaveAttribute('data-variant', 'C2');
  const y = (await page.locator('.hr-workspace').boundingBox())!.y;
  const trigger = page.locator('.hr-trigger');
  await trigger.click();
  const samples = await page.evaluate(async () => {
    const values: number[] = [];
    for (let i = 0; i < 24; i++) {
      await new Promise(requestAnimationFrame);
      values.push(document.querySelector('.hr-workspace')!.getBoundingClientRect().y);
    }
    return values;
  });
  expect(samples.every(value => value === y)).toBe(true);
  await page.keyboard.press('Escape');
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => !!document.activeElement?.closest('#responsive-navigation'))).toBe(false);
  const closingSamples = await page.evaluate(async () => {
    const values: number[] = [];
    for (let i = 0; i < 24; i++) {
      await new Promise(requestAnimationFrame);
      values.push(document.querySelector('.hr-workspace')!.getBoundingClientRect().y);
    }
    return values;
  });
  expect(closingSamples.every(value => value === y)).toBe(true);
  await expect(page.locator('#responsive-navigation')).not.toBeVisible();
  expect((await page.locator('.hr-workspace').boundingBox())!.y).toBe(y);
  // Repeated toggles must not leave an invisible panel intercepting the page.
  await trigger.click(); await trigger.click(); await trigger.click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#responsive-navigation')).toBeVisible();
});

test('Lab directly compares the original C with C2 at the same viewport width', async ({ page }) => {
  await page.goto('header-responsive-lab.html');
  await page.getByRole('button', { name: /C2 Command Shelf/ }).click();
  await page.getByRole('button', { name: 'Porovnat C / C2', exact: true }).click();
  await page.getByRole('button', { name: '390', exact: true }).click();
  await expect(page.locator('iframe')).toHaveCount(2);
  for (const variant of ['C', 'C2']) {
    const iframe = page.locator(`iframe[title="Varianta ${variant} – interaktivní header"]`);
    await expect(iframe).toHaveAttribute('width', '390');
    const frame = page.frameLocator(`iframe[title="Varianta ${variant} – interaktivní header"]`);
    const before = await frame.locator('.hr-workspace').evaluate(el => el.getBoundingClientRect().y);
    await frame.getByRole('button', { name: 'Otevřít navigaci', exact: true }).click();
    const after = await frame.locator('.hr-workspace').evaluate(el => el.getBoundingClientRect().y);
    if (variant === 'C') expect(after).toBeGreaterThan(before + 150);
    else expect(after).toBe(before);
  }
});


test('C2 resizes its open panel to a short mobile viewport and closes at the wide breakpoint', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto('header-responsive-lab.html?view=scene&variant=C2');
  await page.locator('.hr-trigger').click();
  await page.setViewportSize({ width: 390, height: 360 });
  const panel = page.locator('#responsive-navigation');
  await expect(panel).toBeVisible();
  await expect.poll(async () => {
    const box = (await panel.boundingBox())!;
    return box.y + box.height;
  }).toBeLessThanOrEqual(344);
  await panel.getByRole('link', { name: 'Hledání na webu', exact: true }).focus();
  const last = (await panel.getByRole('link', { name: 'Hledání na webu', exact: true }).boundingBox())!;
  expect(last.y + last.height).toBeLessThanOrEqual(344);
  expect(await page.evaluate(() => scrollY)).toBe(0);
  await page.setViewportSize({ width: 1366, height: 768 });
  await expect(panel).toHaveCount(0);
  await page.setViewportSize({ width: 900, height: 768 });
  await expect(page.locator('.hr-trigger')).toHaveAttribute('aria-expanded', 'false');
  await expect(panel).not.toBeVisible();
});
