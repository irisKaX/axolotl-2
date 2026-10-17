import { expect, test } from '@playwright/test';
import { capturePillNav } from '../../scripts/audit-pillnav-regression.mjs';
import { colors } from '../../src/pages/header-visual-lab/design';

// Reintroducing an accent mix, changing reference text/focus/active paint, or adding
// study decorations to navigation must fail against the unchanged C2 entry point.
for (const theme of ['dark', 'light'] as const) {
  for (const width of [1440, 1024, 390]) {
    test(`PillNav reference ${theme} ${width}: protected tokens and interactive paint match C2`, async ({ page }) => {
      test.setTimeout(90_000);
      await page.setViewportSize({ width, height: 844 });
      await page.goto(`header-responsive-lab.html?view=scene&variant=C2&theme=${theme}`);
      const reference = await capturePillNav(page, width);
      // A fixed contract also prevents both lab and reference drifting together.
      expect(reference.tokens['--pn-row-hover']).toBe(theme === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(24, 24, 27, 0.05)');
      for (const variant of ['A', 'B', 'C']) {
        await page.goto(`header-visual-lab.html?view=scene&variant=${variant}&theme=${theme}`);
        const actual = await capturePillNav(page, width);
        expect(actual, `${variant} must preserve reference paint, not only a nominal hover variable`).toEqual(reference);
      }
    });
  }
  test(`PillNav reference ${theme}: right controls use neutral hover and distinct expanded paint`, async ({ page }) => {
    expect(colors[theme].hover).toBe(theme === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(24, 24, 27, 0.05)');
    expect(colors[theme].accent).toBe('#7c3aed');
    for (const variant of ['A','B','C']) {
      await page.goto(`header-visual-lab.html?view=scene&variant=${variant}&theme=${theme}`);
      for (const selector of ['.axolotl-header-icon-button','.axolotl-settings-trigger','.axolotl-tabs-trigger']) {
        const button = page.locator(selector);
        const pseudo = selector === '.axolotl-tabs-trigger' ? null : '::before';
        await button.hover();
        // Existing mouse disclosure opens on hover. Escape closes it while the
        // pointer stays on the button, exposing its genuine closed hover paint.
        await expect(button).toHaveAttribute('aria-expanded','true');
        await button.focus(); // Escape is handled by the existing disclosure root.
        await page.keyboard.press('Escape');
        await expect(button).not.toHaveAttribute('aria-expanded','true');
        const read = () => button.evaluate((el, pseudo) => ({background:getComputedStyle(el,pseudo).backgroundColor,ink:getComputedStyle(el).color}),pseudo);
        const hover = await read();
        expect(hover.background).toBe(colors[theme].hover);
        expect(hover.ink).not.toBe('rgb(255, 255, 255)');
        await button.click();
        await expect(button).toHaveAttribute('aria-expanded','true');
        expect(await read()).toEqual({background:'rgb(124, 58, 237)',ink:'rgb(255, 255, 255)'});
        await page.keyboard.press('Escape');
        await page.mouse.move(1360,750);
      }
    }
  });
}
