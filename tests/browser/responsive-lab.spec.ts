import { expect, test } from '@playwright/test';

for (const variant of ['A', 'B', 'C', 'C2']) {
  test(`${variant}: compact navigation stays below brand, navigates and restores focus`, async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 800 });
    await page.goto(`header-responsive-lab.html?view=scene&variant=${variant}`);
    const toggle = page.getByRole('button', { name: 'Otevřít navigaci', exact: true });
    await toggle.focus();
    await page.keyboard.press('Enter');
    const panel = page.locator('#responsive-navigation');
    await expect(panel).toBeVisible();
    const brand = await page.locator('.hr-brand').boundingBox();
    const box = await panel.boundingBox();
    expect(box!.y).toBeGreaterThanOrEqual(brand!.y + brand!.height);
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(900);
    const group = panel.getByRole('button', { name: 'Kontrola', exact: true });
    if (await group.getAttribute('aria-expanded') === 'false') await group.click();
    await panel.getByRole('link', { name: 'Metadata', exact: true }).click();
    await expect(page).toHaveURL(/#kontrola\/metadata$/);
    await expect(panel).not.toBeVisible();
    await toggle.click();
    await page.keyboard.press('Escape');
    await expect(toggle).toBeFocused();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });
}

for (const variant of ['A', 'B', 'C', 'C2']) {
  test(`${variant}: real touch events preserve navigation and settings; outside dismisses`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`http://127.0.0.1:4173/axolotl-2/header-responsive-lab.html?view=scene&variant=${variant}`);
    await page.getByRole('button', { name: 'Otevřít navigaci', exact: true }).tap();
    const panel = page.locator('#responsive-navigation');
    const media = panel.getByRole('button', { name: 'Média', exact: true });
    if (await media.getAttribute('aria-expanded') === 'false') await media.tap();
    await page.waitForTimeout(220); // Past the original erroneous 150ms pointerleave timeout.
    await expect(panel.getByRole('link', { name: 'QR', exact: true })).toBeVisible();
    await panel.getByRole('link', { name: 'QR', exact: true }).tap();
    await expect(page.getByRole('heading', { name: 'QR generátor', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Nastavení', exact: true }).tap();
    await page.waitForTimeout(220);
    await expect(page.getByRole('button', { name: 'Vzhled a prostředí', exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Otevřít navigaci', exact: true }).tap();
    if (variant === 'B') await page.touchscreen.tap(385, 400);
    else if ((variant === 'C' || variant === 'C2')) await page.getByRole('textbox', { name: 'Aktuální URL', exact: true }).tap();
    else await page.touchscreen.tap(385, 700);
    await expect(panel).not.toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(errors).toEqual([]);
    await context.close();
  });

  test(`${variant}: breakpoint boundaries, light theme and short viewport geometry`, async ({ page }) => {
    await page.goto(`header-responsive-lab.html?view=scene&variant=${variant}&theme=light`);
    for (const width of [1440, 1366, 1181, 1180, 1101, 1024, 768, 721, 681, 680, 521, 520, 390, 320]) {
      await page.setViewportSize({ width, height: 600 });
      await expect(page.locator('.hr-scene')).toHaveAttribute('data-compact', String(width <= 1180));
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `overflow at ${width}`).toBe(true);
      const url = await page.getByRole('textbox', { name: 'Aktuální URL', exact: true }).boundingBox();
      expect(url!.width, `URL at ${width}`).toBeGreaterThan(35);
      const settings = await page.getByRole('button', { name: 'Nastavení', exact: true }).boundingBox();
      expect(settings!.x + settings!.width).toBeLessThanOrEqual(width);
      if (width <= 1180) {
        await page.getByRole('button', { name: 'Otevřít navigaci', exact: true }).click();
        const panel = page.locator('#responsive-navigation');
        await expect(panel).toBeVisible();
        const box = await panel.boundingBox();
        expect(box!.x).toBeGreaterThanOrEqual(0);
        expect(box!.x + box!.width).toBeLessThanOrEqual(width);
        if (variant !== 'C') expect(box!.y + box!.height).toBeLessThanOrEqual(600);
        await page.keyboard.press('Escape');
      }
    }
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });
}

test('drawer traps Tab, shelf moves workspace, and URL commits without leaving the Lab', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 768 });
  await page.goto('header-responsive-lab.html?view=scene&variant=B');
  await page.getByRole('button', { name: 'Otevřít navigaci', exact: true }).click();
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => !!document.activeElement?.closest('dialog'))).toBe(true);
  }
  await page.keyboard.press('Escape');
  await page.goto('header-responsive-lab.html?view=scene&variant=C');
  const before = (await page.locator('.hr-workspace').boundingBox())!.y;
  await page.getByRole('button', { name: 'Otevřít navigaci', exact: true }).click();
  expect((await page.locator('.hr-workspace').boundingBox())!.y).toBeGreaterThan(before + 150);
  await page.keyboard.press('Escape');
  const url = page.getByRole('textbox', { name: 'Aktuální URL', exact: true });
  await url.fill('o2.cz'); await url.press('Enter');
  await expect(url).toHaveValue('https://o2.cz/');
  await expect(page).toHaveURL(/view=scene&variant=C$/);
});

test('Lab switches variants, compares actual iframe widths and preserves scene while resizing', async ({ page }) => {
  await page.goto('header-responsive-lab.html');
  await expect(page.getByRole('heading', { name: 'Malé okno. Tři směry. Nová C2.' })).toBeVisible();
  await page.getByRole('button', { name: /B Side Drawer/ }).click();
  await expect(page.locator('iframe')).toHaveAttribute('title', /Varianta B/);
  await page.getByRole('button', { name: '390', exact: true }).click();
  await expect(page.locator('iframe')).toHaveAttribute('width', '390');
  expect(await page.frames()[1].evaluate(() => innerWidth)).toBe(390);
  await page.getByRole('checkbox', { name: 'Porovnat všechny varianty' }).check();
  await expect(page.locator('iframe')).toHaveCount(4);
  await page.getByLabel('Téma náhledů').selectOption('light');
  await expect(page.frameLocator('iframe').first().locator('html')).toHaveAttribute('data-theme', 'light');
});
