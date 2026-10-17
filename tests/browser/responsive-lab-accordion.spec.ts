import { expect, test, type Page, type Locator } from '@playwright/test';

const groupNames = ['Můj workspace', 'Média', 'Kontrola'];
async function expectGroups(page: Page, expanded: string | null) {
  const panel = page.locator('#responsive-navigation');
  for (const name of groupNames) {
    await expect(panel.getByRole('button', { name, exact: true })).toHaveAttribute('aria-expanded', String(name === expanded));
  }
}

for (const touch of [false, true]) {
  test(`C2 ${touch ? 'touch' : 'desktop'}: dashboard groups are exclusive, collapsible and reset on reopen`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: touch ? 390 : 1024, height: 844 }, hasTouch: touch, isMobile: touch, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const activate = (el: Locator) => touch ? el.tap() : el.click();
    await page.goto('http://127.0.0.1:4173/axolotl-2/header-responsive-lab.html?view=scene&variant=C2');
    const workspaceY = (await page.locator('.hr-workspace').boundingBox())!.y;
    const trigger = page.locator('.hr-trigger');
    await activate(trigger);
    await expectGroups(page, null);
    const home = page.locator('#responsive-navigation').getByRole('link', { name: 'Dashboard', exact: true });
    await expect(home).toHaveAttribute('aria-current', 'page');
    await expect(home.getByText('✓', { exact: true })).toBeVisible();
    for (const name of groupNames) {
      await activate(page.getByRole('button', { name, exact: true }));
      await expectGroups(page, name);
      expect((await page.locator('.hr-workspace').boundingBox())!.y).toBe(workspaceY);
    }
    await activate(page.getByRole('button', { name: 'Kontrola', exact: true }));
    await expectGroups(page, null);
    await activate(page.getByRole('button', { name: 'Média', exact: true }));
    await activate(page.getByRole('button', { name: 'Zavřít nabídku', exact: true }));
    await activate(trigger);
    await expectGroups(page, null);
    expect((await page.locator('.hr-workspace').boundingBox())!.y).toBe(workspaceY);
    await context.close();
  });

  test(`C2 ${touch ? 'touch' : 'desktop'}: active route wins over manual expansion across navigation and history`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: touch ? 390 : 1024, height: 844 }, hasTouch: touch, isMobile: touch, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const activate = (el: Locator) => touch ? el.tap() : el.click();
    await page.goto('http://127.0.0.1:4173/axolotl-2/header-responsive-lab.html?view=scene&variant=C2#kontrola/nadpisy');
    const trigger = page.locator('.hr-trigger');
    const panel = page.locator('#responsive-navigation');
    await activate(trigger);
    await expectGroups(page, 'Kontrola');
    const headings = panel.getByRole('link', { name: 'Nadpisy', exact: true });
    await expect(headings).toHaveAttribute('aria-current', 'page');
    await expect(headings.getByText('✓', { exact: true })).toBeVisible();
    await expect(panel.locator('[aria-current=page]')).toHaveCount(1);
    // Manually close the active group, then browse another: neither is persisted.
    await activate(page.getByRole('button', { name: 'Kontrola', exact: true }));
    await expectGroups(page, null);
    await activate(page.getByRole('button', { name: 'Média', exact: true }));
    await page.keyboard.press('Escape');
    await activate(trigger);
    await expectGroups(page, 'Kontrola');
    // Same-group navigation, another group, workspace and dashboard.
    for (const [group, label, route] of [
      ['Kontrola', 'Metadata', 'kontrola/metadata'],
      ['Média', 'QR', 'media/qr'],
      ['Můj workspace', 'Poznámky', 'osobni-prostor/poznamky'],
    ]) {
      const toggle = panel.getByRole('button', { name: group, exact: true });
      if (await toggle.getAttribute('aria-expanded') !== 'true') await activate(toggle);
      await activate(panel.getByRole('link', { name: label, exact: true }));
      await expect(page).toHaveURL(new RegExp(`#${route}$`));
      await expect(panel).not.toBeVisible();
      await activate(trigger);
      await expectGroups(page, group);
      const active = panel.getByRole('link', { name: label, exact: true });
      await expect(active).toHaveAttribute('aria-current', 'page');
      await expect(active.getByText('✓', { exact: true })).toBeVisible();
      await expect(panel.locator('[aria-current=page]')).toHaveCount(1);
    }
    // Clicking the current link still closes the menu (no hashchange event).
    await activate(panel.getByRole('link', { name: 'Poznámky', exact: true }));
    await expect(panel).not.toBeVisible();
    await activate(trigger);
    await activate(panel.getByRole('link', { name: 'Dashboard', exact: true }));
    await expect(panel).not.toBeVisible();
    await activate(trigger);
    await expectGroups(page, null);
    await page.goBack();
    await expect(page).toHaveURL(/#osobni-prostor\/poznamky$/);
    await expect(panel).not.toBeVisible();
    await activate(trigger);
    await expectGroups(page, 'Můj workspace');
    await page.goForward();
    await expect(panel).not.toBeVisible();
    await activate(trigger);
    await expectGroups(page, null);
    await context.close();
  });
}

test('C2 keyboard skips collapsed links and toggles one section with Enter/Space', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 600 });
  await page.goto('header-responsive-lab.html?view=scene&variant=C2');
  await page.locator('.hr-trigger').focus();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('End');
  const control = page.getByRole('button', { name: 'Kontrola', exact: true });
  await expect(control).toBeFocused();
  await page.keyboard.press('Enter');
  await expectGroups(page, 'Kontrola');
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('link', { name: 'Metadata', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Média', exact: true }).focus();
  await page.keyboard.press('Space');
  await expectGroups(page, 'Média');
  await page.keyboard.press('Space');
  await expectGroups(page, null);
  await page.keyboard.press('Escape');
  await expect(page.locator('.hr-trigger')).toBeFocused();
});

test('C2 reveals the current tool inside a short mobile panel without scrolling the page', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 600 });
  await page.goto('header-responsive-lab.html?view=scene&variant=C2#kontrola/hledani-na-webu');
  const workspace = await page.locator('.hr-workspace').boundingBox();
  await page.locator('.hr-trigger').click();
  await expectGroups(page, 'Kontrola');
  const active = page.getByRole('link', { name: 'Hledání na webu', exact: true });
  await expect(active).toBeFocused();
  const box = (await active.boundingBox())!;
  const panel = (await page.locator('#responsive-navigation').boundingBox())!;
  expect(box.y).toBeGreaterThanOrEqual(panel.y);
  expect(box.y + box.height).toBeLessThanOrEqual(panel.y + panel.height);
  expect(await page.evaluate(() => scrollY)).toBe(0);
  expect(await page.locator('.hr-workspace').boundingBox()).toEqual(workspace);
  await page.keyboard.press('Escape');
  await expect(page.locator('.hr-trigger')).toBeFocused();
});
