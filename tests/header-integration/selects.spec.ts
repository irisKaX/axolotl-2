import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir } from 'node:fs/promises';

async function appearance(page: Page, theme='dark') {
  await page.clock.setFixedTime(new Date('2026-10-18T10:24:00Z'));
  await page.addInitScript(() => { const theme=new URLSearchParams(location.search).get('theme'); if(theme) localStorage.setItem('axolotl-2-theme',theme); });
  await page.goto(`?theme=${theme}#dashboard`);
  await page.getByRole('button',{name:'Nastavení',exact:true}).click();
  await page.getByRole('button',{name:'Vzhled a prostředí',exact:true}).click();
}

test('settings choice is an in-page listbox; Escape closes only the choice and restores focus',async({page})=>{
  await appearance(page);
  const trigger=page.getByRole('combobox',{name:'Barevný režim',exact:true});
  await trigger.focus(); await page.keyboard.press('Enter');
  await expect(page.getByRole('listbox',{name:'Barevný režim',exact:true})).toBeVisible();
  await expect(page.getByRole('option',{name:'Tmavý',exact:true})).toHaveAttribute('aria-selected','true');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('listbox')).toHaveCount(0); await expect(trigger).toBeFocused();
  await expect(page.getByRole('dialog',{name:'Nastavení',exact:true})).toBeVisible();
  await page.keyboard.press('Escape'); await expect(page.locator('[data-header-panel]')).toHaveCount(0);
});

for(const theme of ['dark','light']) for(const width of [1440,390]) {
  test(`${theme} ${width}: choices share palette, retain selected paint on hover and fit the viewport`,async({page},info)=>{
    await page.setViewportSize({width,height:844}); await appearance(page,theme);
    for(const label of ['Barevný režim','Velikost textu','Animace']) {
      await page.getByRole('combobox',{name:label,exact:true}).click();
      const list=page.getByRole('listbox',{name:label,exact:true});await expect(list).toBeVisible();
      const chosen=list.locator('[data-state=checked]');await chosen.hover();
      expect(await chosen.evaluate(el=>getComputedStyle(el).backgroundColor)).toBe('rgb(124, 58, 237)');
      const unchosen=list.locator('[data-state=unchecked]').first();await unchosen.hover();
      expect(await unchosen.evaluate(el=>getComputedStyle(el).backgroundColor)).toBe(theme==='dark'?'rgba(255, 255, 255, 0.06)':'rgba(24, 24, 27, 0.05)');
      const box=(await list.boundingBox())!,header=(await page.locator('header').boundingBox())!;
      expect(box.y).toBeGreaterThanOrEqual(header.y+header.height+10);
      expect(box.x).toBeGreaterThanOrEqual(10);expect(box.x+box.width).toBeLessThanOrEqual(width-10);expect(box.y+box.height).toBeLessThanOrEqual(834);
      expect(await chosen.evaluate(el=>el.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
      expect(await list.evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
      const scan=await new AxeBuilder({page}).include('[data-header-select]').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(scan.violations).toEqual([]);
      if(info.project.name==='chromium') {await mkdir('test-results/header-integration/select-screenshots',{recursive:true});await page.screenshot({path:`test-results/header-integration/select-screenshots/${theme}-${width}-${label==='Barevný režim'?'theme':label==='Animace'?'motion':'text'}.png`});}
      await page.keyboard.press('Escape');await page.mouse.move(0,800);
    }
  });
}

test('keyboard choice commits preferences, supports typeahead and retains them on reload',async({page})=>{
  await appearance(page);
  const trigger=page.getByRole('combobox',{name:'Velikost textu',exact:true});
  await trigger.focus(); await page.keyboard.press('Space');
  await expect(page.getByRole('option',{name:'Výchozí',exact:true})).toBeFocused();
  await page.keyboard.press('End');
  await expect(page.getByRole('option',{name:'Větší (115 %)',exact:true})).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(trigger).toHaveText(/Větší/);await expect(trigger).toBeFocused();
  expect(await page.evaluate(()=>localStorage.getItem('axolotl-2-text-size'))).toBe('large');
  const motion=page.getByRole('combobox',{name:'Animace',exact:true});
  await motion.focus();await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('option',{name:'Podle systému',exact:true})).toBeFocused();
  await page.keyboard.type('Ome');
  // Radix schedules typeahead focus; commit only after that focus has settled.
  await expect(page.getByRole('option',{name:'Omezené',exact:true})).toBeFocused();
  await page.keyboard.press('Enter');await expect(motion).toHaveText('Omezené');
  await page.reload();await page.getByRole('button',{name:'Nastavení',exact:true}).click();await page.getByRole('button',{name:'Vzhled a prostředí',exact:true}).click();await expect(trigger).toHaveText(/Větší/);await expect(motion).toHaveText('Omezené');
});

test('touch choice remains usable in a short viewport; outside touch closes only the choice',async({browser,browserName,baseURL})=>{
  const context=await browser.newContext({baseURL,viewport:{width:390,height:400},hasTouch:true,isMobile:browserName!=='firefox',reducedMotion:'reduce'});
  const page=await context.newPage();await appearance(page);
  const trigger=page.getByRole('combobox',{name:'Barevný režim',exact:true});await trigger.tap();
  const light=page.getByRole('option',{name:'Světlý',exact:true});await light.scrollIntoViewIfNeeded();await light.tap();
  await expect(page.locator('html')).toHaveAttribute('data-theme','light');await expect(trigger).toBeFocused();
  await trigger.tap();await page.touchscreen.tap(5,200);await expect(page.getByRole('listbox')).toHaveCount(0);await expect(page.locator('[data-header-panel=settings]')).toBeVisible();
  expect(await page.evaluate(()=>scrollY)).toBe(0);await context.close();
});


test('opening a choice preserves layout and closing releases scroll and pointer locks',async({page})=>{
  await appearance(page);
  await page.evaluate(()=>document.querySelector('main')!.style.minHeight='2400px');
  await page.evaluate(()=>window.scrollTo(0,500));
  const geometry=()=>page.evaluate(()=>({
    header:document.querySelector('header')!.getBoundingClientRect().toJSON(),
    main:document.querySelector('main')!.getBoundingClientRect().toJSON(),
    scroll:scrollY,
  }));
  const before=await geometry();
  const trigger=page.getByRole('combobox',{name:'Barevný režim',exact:true});
  await trigger.focus();await page.keyboard.press('Enter');
  await expect(page.getByRole('listbox')).toBeVisible();expect(await geometry()).toEqual(before);
  await page.keyboard.press('Escape');await expect(trigger).toBeFocused();expect(await geometry()).toEqual(before);
  expect(await page.evaluate(()=>({overflow:document.body.style.overflow,pointerEvents:document.body.style.pointerEvents}))).toEqual({overflow:'',pointerEvents:''});
  await page.keyboard.press('Escape');await page.mouse.move(500,700);await page.mouse.wheel(0,200);
  await expect.poll(()=>page.evaluate(()=>scrollY)).toBeGreaterThan(500);
});

test('all choices fit a narrow short viewport with enlarged text and retain keyboard focus styling',async({page})=>{
  await page.setViewportSize({width:320,height:400});await appearance(page,'light');
  const size=page.getByRole('combobox',{name:'Velikost textu',exact:true});
  await size.focus();await page.keyboard.press('Enter');
  await expect(page.getByRole('option',{name:'Výchozí',exact:true})).toBeFocused();
  await page.keyboard.press('End');
  await expect(page.getByRole('option',{name:'Větší (115 %)',exact:true})).toBeFocused();
  await page.keyboard.press('Enter');
  // Radix restores focus asynchronously; finish closing this choice before
  // programmatically moving to another trigger.
  await expect(size).toHaveText('Větší (115 %)');
  await expect(page.getByRole('listbox')).toHaveCount(0);
  await expect(size).toBeFocused();
  for(const name of ['Barevný režim','Velikost textu','Animace']) {
    const trigger=page.getByRole('combobox',{name,exact:true});await trigger.focus();
    await page.keyboard.press('Enter');
    const list=page.getByRole('listbox');await expect(list).toBeVisible();
    const box=(await list.boundingBox())!,header=(await page.locator('header').boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(10);expect(box.x+box.width).toBeLessThanOrEqual(310);
    expect(box.y).toBeGreaterThanOrEqual(header.y+header.height+10);expect(box.y+box.height).toBeLessThanOrEqual(390);
    await page.keyboard.press('End');await expect(list.getByRole('option').last()).toBeFocused();
    await page.keyboard.press('Escape');await expect(trigger).toBeFocused();
    expect(await trigger.evaluate(el=>({width:getComputedStyle(el).outlineWidth,color:getComputedStyle(el).outlineColor}))).toEqual({width:'2px',color:'rgb(98, 33, 194)'});
  }
});
