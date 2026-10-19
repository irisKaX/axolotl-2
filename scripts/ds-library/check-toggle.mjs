import { expect } from '@playwright/test';

export async function checkTestToggle(page, base, out) {
  const toggle = page.getByRole('switch', { name: 'Zobrazit testovací komponenty', exact: true });
  const route = section => `${base}?catalog=library${section ? `&section=${section}` : ''}#design-system`;
  const choose = async (label, name) => {
    await page.getByRole('combobox', { name: label, exact: true }).click();
    await page.getByRole('option', { name, exact: true }).click();
  };
  await page.goto(route(''));
  await expect(toggle).not.toBeChecked();
  await page.evaluate(() => { window.__catalogDocument = 'same-document'; });
  await toggle.focus();
  await page.keyboard.press('Space');
  await expect(toggle).toBeChecked();
  await expect(page.locator('.ds-catalog-category')).toHaveCount(8);
  expect(new URL(page.url()).searchParams.get('catalogTests')).toBe('1');
  await expect(toggle).toBeFocused();
  await page.goBack();
  await expect(toggle).not.toBeChecked();
  await expect(page.locator('.ds-catalog-category')).toHaveCount(7);
  await page.goForward();
  await expect(toggle).toBeChecked();
  expect(await page.evaluate(() => window.__catalogDocument)).toBe('same-document');

  await page.goto(route('forms'));
  const email = page.getByRole('textbox', { name: 'E-mail', exact: true });
  await email.fill('preserved@example.cz');
  await choose('Komponenta', 'Textarea');
  await page.getByRole('switch', { name: 'Disabled', exact: true }).check();
  await toggle.check();
  await toggle.uncheck();
  await expect(email).toHaveValue('preserved@example.cz');
  await expect(page.getByRole('combobox', { name: 'Komponenta', exact: true })).toContainText('Textarea');
  await expect(page.getByRole('switch', { name: 'Disabled', exact: true })).toBeChecked();
  await page.goBack();
  await expect(toggle).toBeChecked();
  await expect(email).toHaveValue('preserved@example.cz');

  await page.goto(route('surfaces'));
  await choose('Materiál', 'raised');
  await choose('Hustota', 'compact');
  await toggle.check();
  await toggle.uncheck();
  await expect(page.locator('.ds-catalog-stage .ds-card')).toHaveAttribute('data-material', 'raised');
  await expect(page.getByRole('combobox', { name: 'Hustota', exact: true })).toContainText('compact');
  await toggle.check();
  await choose('Materiál', 'Test · obrys');
  await page.locator('.ds-catalog-api > details').first().locator('summary').click();
  await choose('Pravá varianta', 'Test · obrys');
  await toggle.uncheck();
  await expect(page.locator('.ds-card[data-material="outline-test"]')).toHaveCount(0);
  await expect(page.getByRole('combobox', { name: 'Hustota', exact: true })).toContainText('compact');
  await toggle.check();
  await expect(page.locator('.ds-catalog-stage .ds-card')).toHaveAttribute('data-material', 'outline-test');
  await page.getByRole('link', { name: 'Ukončit testovací režim', exact: true }).click();
  await expect(toggle).not.toBeChecked();
  await expect(page.getByRole('combobox', { name: 'Hustota', exact: true })).toContainText('compact');

  await toggle.check();
  await page.getByRole('navigation', { name: 'Kategorie knihovny' }).getByRole('link', { name: 'Test Counter', exact: true }).click();
  await page.reload();
  await expect(toggle).toBeChecked();
  await toggle.uncheck();
  await expect(page.locator('.ds-catalog-category')).toHaveCount(7);
  expect(new URL(page.url()).searchParams.has('section')).toBe(false);
  expect(new URL(page.url()).searchParams.has('catalogTests')).toBe(false);
  await expect(page.getByRole('heading', { name: 'Design System Library V1.1', exact: true })).toBeFocused();
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'Test Counter', exact: true })).toBeVisible();
  await expect(toggle).toBeChecked();
  await page.goForward();
  await expect(toggle).not.toBeChecked();
  await page.screenshot({ path: `${out}/test-toggle-desktop.png`, fullPage: true });
}

export async function checkMobileTestToggle(page, base, out) {
  await page.goto(`${base}?catalog=library#design-system`);
  const toggle = page.getByRole('switch', { name: 'Zobrazit testovací komponenty', exact: true });
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await toggle.tap();
    await expect(toggle).toBeChecked();
    await expect(page.locator('.ds-catalog-category')).toHaveCount(8);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `${out}/test-toggle-mobile-${width}.png` });
    await toggle.tap();
    await expect(toggle).not.toBeChecked();
    await expect(page.locator('.ds-catalog-category')).toHaveCount(7);
  }
}
