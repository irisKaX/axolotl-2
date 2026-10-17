import { expect, test } from '@playwright/test';

test('Visual Lab compares three independent viewports side by side and preserves C2 reference', async ({ page }) => {
  await page.goto('header-visual-lab.html');
  await expect(page.getByRole('heading', { name: 'Jeden jazyk. Tři interpretace.' })).toBeVisible({ timeout: 3000 });
  await page.getByRole('button', { name: 'Vedle sebe', exact: true }).click();
  await expect(page.locator('iframe')).toHaveCount(3);
  const positions = await page.locator('.vu-study').evaluateAll(els => els.map(el => el.getBoundingClientRect().x));
  expect(positions[1]).toBeGreaterThan(positions[0]);
  expect(positions[2]).toBeGreaterThan(positions[1]);
  await page.getByRole('button', { name: '390', exact: true }).click();
  for (const frame of page.frames().slice(1)) expect(await frame.evaluate(() => innerWidth)).toBe(390);
  await page.getByLabel('Téma náhledů').selectOption('light');
  await expect(page.frameLocator('iframe').first().locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.getByRole('link', { name: 'Původní C2 ↗', exact: true })).toHaveAttribute('href', 'header-responsive-lab.html?variant=C2');
});

for (const variant of ['A', 'B', 'C']) {
  for (const theme of ['dark', 'light']) {
    test(`${variant} ${theme}: geometry, hierarchy, focus and contrast at all breakpoint boundaries`, async ({ page }) => {
      await page.goto(`header-visual-lab.html?view=scene&variant=${variant}&theme=${theme}`);
      for (const width of [1440, 1366, 1181, 1180, 1024, 768, 681, 680, 521, 520, 390, 320]) {
        await page.setViewportSize({ width, height: 600 });
        await expect(page.locator('.hr-scene')).toHaveAttribute('data-compact', String(width <= 1180));
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `page overflow at ${width}`).toBe(true);
        for (const selector of ['.axolotl-header-icon-button', '.axolotl-settings-trigger', '.axolotl-header-theme', '.axolotl-tabs-trigger']) {
          const box = (await page.locator(selector).boundingBox())!;
          expect(box.width, `${selector} width at ${width}`).toBeGreaterThanOrEqual(44);
          expect(box.height, `${selector} height at ${width}`).toBeGreaterThanOrEqual(44);
          expect(box.x).toBeGreaterThanOrEqual(0);
          expect(box.x + box.width).toBeLessThanOrEqual(width);
        }
        const url = (await page.getByRole('textbox', { name: 'Aktuální URL', exact: true }).boundingBox())!;
        expect(url.width, `URL text at ${width}`).toBeGreaterThan(35);
        if (width > 1180) {
          await expect(page.locator('.axolotl-pill-nav__toggle')).not.toBeVisible();
          const nav = (await page.locator('.axolotl-lab-navigation').boundingBox())!;
          const capsule = (await page.locator('.axolotl-url-bar').boundingBox())!;
          expect(nav.x + nav.width).toBeLessThanOrEqual(capsule.x);
        } else {
          const before = await page.locator('.hr-workspace').boundingBox();
          await page.locator('.hr-trigger').click();
          const panel = page.locator('#responsive-navigation');
          await expect(panel).toBeVisible();
          await panel.getByRole('button', { name: 'Kontrola', exact: true }).click();
          const box = (await panel.boundingBox())!, bar = (await page.locator('.hr-bar').boundingBox())!;
          expect(box.y).toBeGreaterThanOrEqual(bar.y + bar.height);
          expect(box.y + box.height).toBeLessThanOrEqual(600);
          expect(await page.locator('.hr-workspace').boundingBox()).toEqual(before);
          // Hit test confirms panel paints above workspace, not merely z-index declarations.
          expect(await panel.evaluate(el => { const b = el.getBoundingClientRect(); return el.contains(document.elementFromPoint(b.x + 30, b.y + 30)); })).toBe(true);
          await page.keyboard.press('Escape');
          await expect(page.locator('.hr-trigger')).toBeFocused();
          await expect(panel).not.toBeVisible();
          expect(await page.locator('.hr-workspace').boundingBox()).toEqual(before);
        }
      }
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      const ratios = await page.locator('.vu-scene').evaluate(el => {
        const s = getComputedStyle(el);
        const luminance = (hex: string) => { const nums = hex.trim().replace('#', '').match(/../g)!.map(h => parseInt(h, 16) / 255).map(c => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4); return .2126 * nums[0] + .7152 * nums[1] + .0722 * nums[2]; };
        const ratio = (a: string, b: string) => { const x = luminance(a), y = luminance(b); return (Math.max(x,y) + .05) / (Math.min(x,y) + .05); };
        const token = (name: string) => s.getPropertyValue(`--vu-${name}`);
        return [ratio(token('ink'),token('base')), ratio(token('muted'),token('base')), ratio('#ffffff',token('accent')), ratio(token('muted'),token('raised'))];
      });
      for (const ratio of ratios) expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  }
  for (const touch of [false, true]) {
    test(`${variant} ${touch ? 'touch' : 'desktop'}: approved C2 accordion, active routes and history`, async ({ browser }) => {
      const context = await browser.newContext({ viewport: { width: touch ? 390 : 1024, height: 844 }, isMobile: touch, hasTouch: touch, reducedMotion: 'reduce' });
      const page = await context.newPage();
      const activate = async (label: string) => { const button = page.getByRole('button', { name: label, exact: true }); if (touch) await button.tap(); else await button.click(); };
      await page.goto(`http://127.0.0.1:4173/axolotl-2/header-visual-lab.html?view=scene&variant=${variant}`);
      const panel = page.locator('#responsive-navigation');
      await activate('Otevřít navigaci');
      await expect(panel.locator('[aria-expanded=true]')).toHaveCount(0);
      for (const name of ['Můj workspace','Média','Kontrola']) {
        await activate(name);
        await expect(panel.locator('[aria-expanded=true]')).toHaveCount(1);
      }
      await activate('Kontrola'); await expect(panel.locator('[aria-expanded=true]')).toHaveCount(0);
      await activate('Kontrola');
      const choose = async (name: string) => { const link = panel.getByRole('link', { name, exact: true }); if(touch) await link.tap(); else await link.click(); };
      await choose('Nadpisy');
      await expect(panel).not.toBeVisible();
      await expect(page).toHaveURL(/#kontrola\/nadpisy$/);
      await activate('Otevřít navigaci');
      await expect(page.getByRole('button', { name: 'Kontrola', exact: true })).toHaveAttribute('aria-expanded','true');
      const active = panel.getByRole('link',{name:'Nadpisy',exact:true});
      await expect(active).toHaveAttribute('aria-current','page'); await expect(active.getByText('✓')).toBeVisible();
      await activate('Média'); await page.keyboard.press('Escape'); await activate('Otevřít navigaci');
      await expect(page.getByRole('button', { name: 'Kontrola', exact: true })).toHaveAttribute('aria-expanded','true');
      await choose('Nadpisy'); await expect(panel).not.toBeVisible(); // Same route closes too.
      await activate('Otevřít navigaci'); await activate('Média'); await choose('QR');
      await expect(page.getByRole('heading', {name:'QR generátor',exact:true})).toBeVisible();
      await page.goBack(); await activate('Otevřít navigaci'); await expect(active).toHaveAttribute('aria-current','page');
      await page.goForward(); await expect(panel).not.toBeVisible(); await activate('Otevřít navigaci');
      await expect(panel.getByRole('link',{name:'QR',exact:true})).toHaveAttribute('aria-current','page');
      await choose('Dashboard'); await activate('Otevřít navigaci'); await expect(panel.locator('[aria-expanded=true]')).toHaveCount(0);
      await context.close();
    });

    test(`${variant} ${touch ? 'touch' : 'mouse'}: all header controls, theme, outside dismissal and keyboard`, async ({ browser }) => {
      const context = await browser.newContext({ viewport: {width: touch ? 390 : 1024,height:844}, hasTouch:touch, isMobile:touch, reducedMotion:'reduce' });
      const page = await context.newPage(); const errors: string[] = []; page.on('pageerror',e=>errors.push(e.message));
      await page.goto(`http://127.0.0.1:4173/axolotl-2/header-visual-lab.html?view=scene&variant=${variant}`);
      const click = async (name: string) => { const el = page.getByRole('button',{name,exact:true}); if(touch) await el.tap(); else await el.click(); };
      await click('Otevřít navigaci'); await click('Upozornění');
      await expect(page.locator('#responsive-navigation')).not.toBeVisible();
      await expect(page.getByText('Zatím žádná upozornění')).toBeVisible();
      await click('Zavřít upozornění'); await click('Nastavení');
      await page.waitForTimeout(220); // Catch the original touch pointerleave regression.
      await expect(page.getByRole('button',{name:'Vzhled a prostředí',exact:true})).toBeVisible();
      await page.keyboard.press('Escape');
      await click('Vybrat kartu prohlížeče'); await expect(page.getByRole('heading',{name:'Otevřené karty',exact:true})).toBeVisible();
      await page.keyboard.press('Escape');
      const input = page.getByRole('textbox',{name:'Aktuální URL',exact:true});
      await input.fill('o2.cz'); await input.press('Enter'); await expect(input).toHaveValue('https://o2.cz/');
      const theme = page.getByRole('checkbox',{name:'Tmavý režim',exact:true}); if(touch) await theme.tap(); else await theme.click();
      await expect(page.locator('html')).toHaveAttribute('data-theme','light');
      await page.locator('.hr-trigger').focus(); await page.keyboard.press('ArrowDown'); await page.keyboard.press('End');
      await expect(page.getByRole('button',{name:'Kontrola',exact:true})).toBeFocused();
      await page.keyboard.press('Enter'); await page.keyboard.press('ArrowDown');
      await expect(page.getByRole('link',{name:'Metadata',exact:true})).toBeFocused();
      await page.keyboard.press('Escape'); await expect(page.locator('.hr-trigger')).toBeFocused();
      await click('Otevřít navigaci'); if(touch) await input.tap(); else await input.click();
      await expect(page.locator('#responsive-navigation')).not.toBeVisible();
      expect(errors).toEqual([]); await context.close();
    });
  }
  test(`${variant}: animation and short mobile active item preserve document position`, async ({ page }) => {
    await page.emulateMedia({reducedMotion:'no-preference'}); await page.setViewportSize({width:390,height:600});
    await page.goto(`header-visual-lab.html?view=scene&variant=${variant}#kontrola/hledani-na-webu`);
    const before = await page.locator('.hr-workspace').boundingBox();
    await page.locator('.hr-trigger').click();
    for (let i=0;i<4;i++) { expect(await page.locator('.hr-workspace').boundingBox()).toEqual(before); await page.waitForTimeout(50); }
    const active = page.getByRole('link',{name:'Hledání na webu',exact:true}); await expect(active).toBeFocused();
    const item=(await active.boundingBox())!, panel=(await page.locator('#responsive-navigation').boundingBox())!;
    expect(item.y).toBeGreaterThanOrEqual(panel.y); expect(item.y+item.height).toBeLessThanOrEqual(panel.y+panel.height);
    expect(await page.evaluate(()=>scrollY)).toBe(0);
    await page.keyboard.press('Escape'); await expect(page.locator('#responsive-navigation')).not.toBeVisible();
    await page.emulateMedia({reducedMotion:'reduce'});
    expect(await page.locator('#responsive-navigation').evaluate(el=>getComputedStyle(el).transitionDuration)).toBe('0s');
  });
}

for (const variant of ['A','B','C']) {
  test(`${variant}: light expanded icon surfaces retain contrast with white icons`, async ({page}) => {
    await page.setViewportSize({width:1024,height:768});
    await page.goto(`header-visual-lab.html?view=scene&variant=${variant}&theme=light`);
    for (const name of ['Upozornění','Nastavení']) {
      const trigger=page.getByRole('button',{name,exact:true}); await trigger.click();
      await expect(trigger).toHaveAttribute('aria-expanded','true');
      const styles=await trigger.evaluate(el=>({ink:getComputedStyle(el).color,background:getComputedStyle(el,'::before').backgroundColor}));
      expect(styles.ink).toBe('rgb(255, 255, 255)');
      // Inspect the rendered inset surface: a later transparent override would
      // leave the white icon illegible on the light parent control capsule.
      expect(styles.background).toBe('rgb(124, 58, 237)');
      await page.keyboard.press('Escape');
    }
  });
}
