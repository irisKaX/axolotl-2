import { expect, test, type Page } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
const references = JSON.parse(readFileSync('docs/header-rebuild/references/computed.json','utf8')) as {records:{variant:string;theme:string;width:number;states:{rowHover:{backgroundColor:string};rowActive:{backgroundColor:string}}}[]};

const output = 'docs/header-rebuild/screenshots';
async function open(page: Page, theme = 'dark', route = 'dashboard') {
  await page.clock.setFixedTime(new Date('2026-10-18T10:24:00Z'));
  await page.goto(`?theme=${theme}#${route}`);
  await expect(page.getByRole('banner')).toBeVisible();
}
const button = (page: Page, name: string) => page.getByRole('button', { name, exact:true });
async function checkPanel(page: Page) {
  const panel = page.locator('[data-header-panel]');
  await expect(panel).toBeVisible();
  await expect(panel).toHaveCount(1);
  const p = (await panel.boundingBox())!, h = (await page.getByRole('banner').boundingBox())!;
  expect(p.y).toBeGreaterThanOrEqual(h.y + h.height + 11);
  expect(p.x).toBeGreaterThanOrEqual(10);
  expect(p.x + p.width).toBeLessThanOrEqual(page.viewportSize()!.width - 10);
  expect(p.y + p.height).toBeLessThanOrEqual(page.viewportSize()!.height - 10);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await panel.evaluate(el => getComputedStyle(el).overflowY)).toBe('auto');
  return panel;
}

for (const theme of ['dark','light']) for (const width of [1440,1024,390]) {
  test(`${theme} ${width}: all panels share materials and remain below the complete header`, async ({ page }, info) => {
    await page.setViewportSize({ width, height:844 });
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    await open(page, theme);
    await mkdir(output, { recursive:true });
    const shot = async (state: string) => { if (info.project.name === 'chromium') await page.screenshot({ path:`${output}/${theme}-${width}-${state}.png` }); };
    await shot('closed');
    const workspace = await page.locator('main').boundingBox();
    const scroll = await page.evaluate(() => ({x:scrollX,y:scrollY,overflow:document.body.style.overflow,width:document.documentElement.clientWidth}));
    const measurements: unknown[] = [];
    for (const [id, name] of [['navigation',width > 1180 ? 'Média' : 'Otevřít navigaci'],['settings','Nastavení'],['notifications','Upozornění'],['tabs','Vybrat kartu prohlížeče']]) {
      await button(page, name).click();
      const panel = await checkPanel(page);
      expect(await page.locator('main').boundingBox()).toEqual(workspace);
      expect(await page.evaluate(() => ({x:scrollX,y:scrollY,overflow:document.body.style.overflow,width:document.documentElement.clientWidth}))).toEqual(scroll);
      measurements.push(await panel.evaluate(el => {
        const s = getComputedStyle(el); return {id:el.getAttribute('data-header-panel'),background:s.backgroundImage,border:s.borderColor,radius:s.borderRadius,padding:s.padding,color:s.color,font:s.fontSize,shadow:s.boxShadow};
      }));
      await shot(id);
      if (id === 'settings') {
        await button(page,'Vzhled a prostředí').click();
        await expect(page.getByLabel('Velikost textu')).toBeVisible();
        await checkPanel(page); await shot('appearance');
        await page.getByLabel('Barevný režim', {exact:true}).focus();
        await page.keyboard.press('ArrowDown');
        await expect(page.getByRole('listbox')).toBeVisible();
        await page.getByRole('option',{name:theme==='dark'?'Tmavý':'Světlý',exact:true}).click();
        await expect(panel).toBeVisible();
      }
      await page.keyboard.press('Escape');
      await expect(panel).not.toBeVisible();
      await page.mouse.move(0,800);
    }
    const materials = (measurements as Record<string,string>[]).map(({id,...style}) => style);
    expect(materials.every(style => JSON.stringify(style) === JSON.stringify(materials[0]))).toBe(true);
    await page.getByRole('textbox',{name:'Aktuální URL'}).focus();
    const focus = await page.locator('[data-header-url]').evaluate(el => ({outer:getComputedStyle(el).outlineWidth,inner:getComputedStyle(el.querySelector('input')!).outlineStyle}));
    expect(focus).toEqual({outer:'2px',inner:'none'});
    await shot('url-focus');
    await writeFile(info.outputPath('computed.json'), JSON.stringify(measurements,null,2));
    expect(errors).toEqual([]);
  });
}

for (const width of [1024,390]) {
  test(`C2 ${width}: exclusive accordion, route restoration, history and same-route close`, async ({ page },info) => {
    await page.setViewportSize({width,height:600}); await open(page);
    const toggle = () => button(page,'Otevřít navigaci');
    await toggle().click();
    for (const name of ['Můj workspace','Média','Kontrola']) await expect(button(page,name)).toHaveAttribute('aria-expanded','false');
    await button(page,'Média').click(); await button(page,'Kontrola').click();
    await expect(button(page,'Média')).toHaveAttribute('aria-expanded','false');
    await button(page,'Kontrola').click(); await expect(button(page,'Kontrola')).toHaveAttribute('aria-expanded','false');
    await button(page,'Kontrola').click();
    await page.getByRole('link',{name:'Nadpisy',exact:true}).click();
    await expect(page).toHaveURL(/#kontrola\/nadpisy$/);
    await expect(page.locator('[data-header-panel]')).toHaveCount(0);
    await toggle().click(); await expect(button(page,'Kontrola')).toHaveAttribute('aria-expanded','true');
    const active = page.locator('[data-header-panel] [aria-current=page]');
    await expect(active).toHaveText(/Nadpisy.*✓/);
    await expect(active).toBeFocused();
    if(info.project.name==='chromium') await page.screenshot({path:`${output}/dark-${width}-active-route.png`});
    await button(page,'Média').click(); await page.keyboard.press('Escape');
    await toggle().click(); await expect(button(page,'Kontrola')).toHaveAttribute('aria-expanded','true');
    await page.getByRole('link',{name:'Nadpisy',exact:true}).click();
    await expect(page.locator('[data-header-panel]')).toHaveCount(0);
    await toggle().click(); await page.getByRole('link',{name:'Dashboard',exact:true}).click();
    await page.goBack(); await toggle().click(); await expect(button(page,'Kontrola')).toHaveAttribute('aria-expanded','true');
  });
}

test('mouse hover crosses the portal gap; click pins; Escape returns focus; outside click keeps its target', async ({ page }) => {
  await open(page);
  const settings=button(page,'Nastavení'); await settings.hover();
  await expect(page.locator('[data-header-panel=settings]')).toBeVisible();
  await button(page,'Vzhled a prostředí').hover();
  await expect(page.locator('[data-header-panel=settings]')).toBeVisible();
  await button(page,'Vzhled a prostředí').click();
  await page.mouse.move(0,800); await expect(page.getByLabel('Velikost textu')).toBeVisible();
  await page.keyboard.press('Escape'); await expect(settings).toBeFocused();
  await settings.click();
  const input=page.getByRole('textbox',{name:'Aktuální URL'}); await input.click();
  await expect(page.locator('[data-header-panel]')).toHaveCount(0); await expect(input).toBeFocused();
});

test('touch menus stay open, active item scrolls only the panel, no document displacement', async ({ browser, browserName }) => {
  const context=await browser.newContext({viewport:{width:390,height:500},hasTouch:true,isMobile:browserName !== 'firefox',reducedMotion:'reduce'});
  const page=await context.newPage();
  await page.goto('http://127.0.0.1:4174/axolotl-2/header-rebuild.html?theme=dark#kontrola/hledani-na-webu');
  const before=await page.evaluate(()=>scrollY);
  await button(page,'Otevřít navigaci').tap();
  const panel=await checkPanel(page), active=panel.locator('[aria-current=page]');
  await expect(active).toBeFocused();
  const a=(await active.boundingBox())!, p=(await panel.boundingBox())!;
  expect(a.y).toBeGreaterThanOrEqual(p.y); expect(a.y+a.height).toBeLessThanOrEqual(p.y+p.height);
  expect(await page.evaluate(()=>scrollY)).toBe(before);
  await button(page,'Nastavení').tap(); await button(page,'Vzhled a prostředí').tap();
  await expect(page.getByLabel('Velikost textu')).toBeVisible();
  await context.close();
});

test('neutral row hover remains distinct from purple active and desktop fill hover', async ({ page },info) => {
  for (const theme of ['dark','light']) {
    const reference=references.records.find(record=>record.variant==='B' && record.theme===theme && record.width===390)!;
    await page.setViewportSize({width:390,height:844}); await open(page,theme);
    await button(page,'Otevřít navigaci').click(); await button(page,'Média').click();
    const link=page.getByRole('link',{name:'QR',exact:true}); await link.hover();
    expect(await link.evaluate(el=>getComputedStyle(el).backgroundColor)).toBe(reference.states.rowHover.backgroundColor);
    if(info.project.name==='chromium') await page.screenshot({path:`${output}/${theme}-390-neutral-hover.png`});
    await link.click(); await button(page,'Otevřít navigaci').click();
    const active=page.locator('[data-header-panel] [aria-current=page]');
    expect(await active.evaluate(el=>getComputedStyle(el).backgroundColor)).toBe(reference.states.rowActive.backgroundColor);
    await active.hover();
    expect(await active.evaluate(el=>getComputedStyle(el).backgroundColor)).toBe(reference.states.rowActive.backgroundColor);
    if(info.project.name==='chromium') await page.screenshot({path:`${output}/${theme}-390-active-hover.png`});
    await page.setViewportSize({width:1440,height:844});
    await button(page,'Média').hover();
    expect(await button(page,'Média').locator('.axolotl-pill-nav__fill').evaluate(el=>getComputedStyle(el).backgroundColor)).toBe('rgb(124, 58, 237)');
  }
});

test('breakpoint edges, enlarged text and URL target sizes do not overlap', async ({ page }) => {
  await open(page);
  for (const width of [320,390,519,520,521,679,680,681,1179,1180,1181,1280,1300,1366,1440]) {
    await page.setViewportSize({width,height:844});
    await expect(page.getByRole('banner')).toHaveAttribute('data-compact',String(width<=1180));
    const url=(await page.locator('[data-header-url]').boundingBox())!, actions=(await button(page,'Upozornění').boundingBox())!;
    expect(url.width).toBeGreaterThanOrEqual(150);
    expect(actions.width).toBeGreaterThanOrEqual(44); expect(actions.height).toBeGreaterThanOrEqual(44);
    if(width>1180) { const nav=(await page.getByRole('navigation',{name:'Hlavní navigace'}).boundingBox())!; expect(nav.x+nav.width).toBeLessThanOrEqual(url.x); }
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
  await button(page,'Nastavení').click(); await button(page,'Vzhled a prostředí').click(); await page.getByLabel('Velikost textu').click(); await page.getByRole('option',{name:'Větší (115 %)'}).click();
  for(const width of [320,390,1024,1181,1360,1440]) { await page.setViewportSize({width,height:844}); expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true); }
});

test('keyboard navigates visible rows, Escape restores trigger, Tab reaches distinct URL controls', async ({ page }) => {
  await page.setViewportSize({width:390,height:844}); await open(page);
  const toggle=button(page,'Otevřít navigaci'); await toggle.focus(); await page.keyboard.press('ArrowDown');
  await page.locator('[data-header-panel] a[href="#dashboard"]').focus();
  await page.keyboard.press('End'); await expect(button(page,'Kontrola')).toBeFocused();
  await page.keyboard.press('Enter'); await page.keyboard.press('ArrowDown'); await expect(page.getByRole('link',{name:'Metadata',exact:true})).toBeFocused();
  await page.keyboard.press('Escape'); await expect(toggle).toBeFocused();
  await page.getByRole('textbox',{name:'Aktuální URL'}).focus(); await page.keyboard.press('Tab');
  const tabs=button(page,'Vybrat kartu prohlížeče'); await expect(tabs).toBeFocused();
  expect(await page.locator('[data-header-url]').evaluate(el=>getComputedStyle(el).outlineStyle)).toBe('none');
  expect(await tabs.evaluate(el=>getComputedStyle(el).outlineWidth)).toBe('2px');
});

test('URL manual validation, blur, Escape and preview storage isolation', async ({ page }) => {
  await page.addInitScript(()=>sessionStorage.setItem('axolotl-2-target-url','https://production.example/'));
  await open(page);
  const input=page.getByRole('textbox',{name:'Aktuální URL'});
  await expect(input).toHaveValue(''); await input.fill('example.cz'); await input.press('Enter');
  await expect(input).toHaveValue('https://example.cz/');
  expect(await page.evaluate(()=>sessionStorage.getItem('axolotl-2-target-url'))).toBe('https://production.example/');
  await input.fill('javascript:alert(1)'); await input.press('Enter'); await expect(input).toHaveAttribute('aria-invalid','true');
  await input.press('Escape'); await expect(input).toHaveValue('https://example.cz/');
  await input.fill('second.example'); await button(page,'Nastavení').click();
  await expect(input).toHaveValue('https://second.example/');
});

test('reduced motion removes panel and bell animation', async ({ page }) => {
  await open(page); await button(page,'Upozornění').click();
  expect(await page.locator('[data-header-panel]').evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
  expect(await button(page,'Upozornění').locator('svg').evaluate(el=>getComputedStyle(el).transform)).toBe('none');
});

test('preview storage quota failure does not invalidate an already committed URL', async ({page}) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('axolotl-2-target-url','https://production.example/');
    const write=Storage.prototype.setItem;
    Storage.prototype.setItem=function(key,value) {
      if(key==='axolotl-header-rebuild-target-url') throw new DOMException('Quota exceeded','QuotaExceededError');
      return write.call(this,key,value);
    };
  });
  await open(page);
  const input=page.getByRole('textbox',{name:'Aktuální URL'});
  await input.fill('example.cz'); await input.press('Enter');
  await expect(input).toHaveValue('https://example.cz/');
  await expect(input).not.toHaveAttribute('aria-invalid','true');
  expect(await page.evaluate(()=>sessionStorage.getItem('axolotl-2-target-url'))).toBe('https://production.example/');
});

test('preview never accesses the original URL key, even when storage writes are denied', async ({page}) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('axolotl-header-rebuild-target-url','https://preview.example/longer-url');
    const read=Storage.prototype.getItem;
    Storage.prototype.getItem=function(key) {
      if(key==='axolotl-2-target-url') throw new Error('Production URL must not be read');
      return read.call(this,key);
    };
    Storage.prototype.setItem=function(key) { throw new DOMException(key,'QuotaExceededError'); };
    Storage.prototype.removeItem=function(key) { throw new DOMException(key,'SecurityError'); };
  });
  await open(page);
  const input=page.getByRole('textbox',{name:'Aktuální URL'});
  await expect(input).toHaveValue('https://preview.example/longer-url');
  await input.fill('x.cz'); await input.press('Enter');
  await expect(input).toHaveValue('https://x.cz/');
  await expect(input).not.toHaveAttribute('aria-invalid','true');
});

test('a real tool dialog remains above the header and returns focus to its tool',async({page},info)=>{
  await open(page,'dark','media/konvertor-obrazku');
  const png=await page.evaluate(()=>{const canvas=document.createElement('canvas');canvas.width=40;canvas.height=40;const ctx=canvas.getContext('2d')!;ctx.fillStyle='#7c3aed';ctx.fillRect(0,0,40,40);return canvas.toDataURL().split(',')[1];});
  await page.locator('#convert-files').setInputFiles({name:'header-test.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});
  await page.getByRole('button',{name:/^Převést do WebP/}).click();
  const control=(await page.getByRole('banner').getByRole('button',{name:'Nastavení',exact:true}).boundingBox())!;
  const trigger=page.getByRole('button',{name:'Náhled header-test.webp',exact:true});await trigger.click();
  const dialog=page.getByRole('dialog'); await expect(dialog).toBeVisible();
  expect(await page.evaluate(({x,y})=>!document.elementFromPoint(x,y)?.closest('header'),{x:control.x+10,y:control.y+10})).toBe(true);
  if(info.project.name==='chromium') await page.screenshot({path:`${output}/dark-1440-tool-dialog.png`});
  await page.keyboard.press('Escape'); await expect(dialog).not.toBeVisible(); await expect(trigger).toBeFocused();
});

test('real bridge protocol preserves editing, tab selection, automatic mode and focus after tab removal', async ({ page },info) => {
  await page.addInitScript(() => {
    const fixture = { tabs:[{id:101,title:'První stránka',url:'https://first.example/'},{id:202,title:'Druhá stránka',url:'https://second.example/'}], activeId:101 };
    Object.assign(window,{headerBridgeFixture:fixture});
    window.addEventListener('message',event => {
      if(event.data?.source !== 'axolotl-page' || event.data?.type !== 'AXOLOTL_GET_TABS') return;
      window.postMessage({source:'axolotl-extension',type:'AXOLOTL_TABS',requestId:event.data.requestId,ok:true,...fixture},location.origin);
    });
  });
  await open(page);
  const input=page.getByRole('textbox',{name:'Aktuální URL'});
  await expect(input).toHaveValue('https://first.example/');
  await input.fill('unfinished.example');
  await page.evaluate(()=>{
    const fixture=(window as unknown as {headerBridgeFixture:{activeId:number}}).headerBridgeFixture; fixture.activeId=202;
    document.dispatchEvent(new Event('axolotl:browser-refresh'));
  });
  await expect(input).toHaveValue('unfinished.example');
  await input.press('Escape'); await expect(input).toHaveValue('https://second.example/');
  await button(page,'Vybrat kartu prohlížeče').click();
  await page.getByRole('button',{name:/První stránka/}).click(); await expect(input).toHaveValue('https://first.example/');
  await expect(button(page,'Vybrat kartu prohlížeče')).toBeFocused();
  await button(page,'Vybrat kartu prohlížeče').click();
  const selected=page.getByRole('button',{name:/První stránka/});
  await selected.hover();
  expect(await selected.evaluate(el=>getComputedStyle(el).backgroundColor)).toBe('rgb(124, 58, 237)');
  if(info.project.name==='chromium') await page.screenshot({path:`${output}/dark-1440-tabs-connected.png`});
  await page.getByRole('button',{name:/Druhá stránka/}).focus();
  await page.evaluate(()=>{
    const fixture=(window as unknown as {headerBridgeFixture:{tabs:{id:number}[]}}).headerBridgeFixture;
    fixture.tabs=fixture.tabs.filter(tab=>tab.id!==202); document.dispatchEvent(new Event('axolotl:browser-refresh'));
  });
  const auto=page.getByRole('button',{name:/Aktuální karta/});
  await expect(auto).toBeFocused(); await auto.click(); await expect(input).toHaveValue('https://first.example/');
});

for(const theme of ['dark','light']) {
  test(`${theme}: every desktop navigation group and secondary settings view is usable`,async({page},info)=>{
    await open(page,theme);
    for(const name of ['Můj workspace','Média','Kontrola']) {
      await button(page,name).click();
      const panel=await checkPanel(page);
      await expect(panel.getByRole('heading',{name,exact:true})).toBeVisible();
      await expect(panel.locator('nav a').first()).toBeVisible();
      if(info.project.name==='chromium') await page.screenshot({path:`${output}/${theme}-1440-group-${name==='Můj workspace'?'workspace':name==='Média'?'media':'audit'}.png`});
      await page.keyboard.press('Escape'); await page.mouse.move(0,800);
    }
    for(const name of ['Integrace','O aplikaci']) {
      await button(page,'Nastavení').click(); await button(page,name).click();
      const panel=await checkPanel(page);
      await expect(panel.getByRole('heading',{name,exact:true})).toBeVisible();
      if(name==='Integrace') await expect(panel.getByRole('link',{name:'Stáhnout rozšíření'})).toHaveAttribute('download','');
      else await expect(panel.getByRole('link',{name:'Historie změn ↗'})).toHaveAttribute('target','_blank');
      if(info.project.name==='chromium') await page.screenshot({path:`${output}/${theme}-1440-${name==='Integrace'?'integrations':'about'}.png`});
      await page.keyboard.press('Escape'); await page.mouse.move(0,800);
    }
  });
}

test('portal preserves tab order, closed controls survive stale hover dismissal and breakpoint changes', async ({ page }) => {
  await open(page);
  await button(page,'Nastavení').hover();
  await page.getByRole('banner').getByRole('button',{name:'Upozornění',exact:true}).hover();
  await expect(page.locator('[data-header-panel=notifications]')).toBeVisible();
  await button(page,'Zavřít nabídku').focus(); await page.keyboard.press('Tab');
  await expect(button(page,'Nastavení')).toBeFocused();
  await expect(page.locator('[data-header-panel]')).toHaveCount(0);
  await button(page,'Média').focus(); await page.keyboard.press('ArrowDown');
  await page.setViewportSize({width:390,height:844});
  await expect(button(page,'Otevřít navigaci')).toBeFocused();
  await expect(page.locator('[data-header-panel]')).toHaveCount(0);
});

test('short viewport, text scaling and settings choice retain reachable controls', async ({ page }) => {
  await page.setViewportSize({width:390,height:400}); await open(page);
  await button(page,'Nastavení').click(); await button(page,'Vzhled a prostředí').click();
  await page.getByLabel('Velikost textu').click(); await page.getByRole('option',{name:'Větší (115 %)'}).click();
  const panel=await checkPanel(page);
  expect(await panel.evaluate(el=>el.scrollHeight>el.clientHeight)).toBe(true);
  await page.getByRole('switch',{name:'Efekt kurzoru'}).scrollIntoViewIfNeeded();
  await expect(page.getByRole('switch',{name:'Efekt kurzoru'})).toBeVisible();
  expect(await page.evaluate(()=>scrollY)).toBe(0);
  await page.keyboard.press('Escape'); await expect(button(page,'Nastavení')).toBeFocused();
});

for(const theme of ['dark','light']) {
  test(`${theme}: accessibility scan covers every panel and settings view`, async ({ page },info) => {
    test.setTimeout(90000);
    await page.setViewportSize({width:390,height:844}); await open(page,theme);
    const reports: unknown[]=[];
    for(const name of ['Otevřít navigaci','Nastavení','Upozornění','Vybrat kartu prohlížeče']) {
      await button(page,name).click();
      const scan=async()=>{
        const guards=page.locator('[data-floating-ui-focus-guard]');
        await expect(guards).toHaveCount(4);
        for(const guard of await guards.all()) await expect(guard).toHaveAttribute('aria-label',/^Pokračovat v ovládání:/);
        const result=await new AxeBuilder({page}).include('header').include('[data-header-panel]').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
        reports.push({name,violations:result.violations,incomplete:result.incomplete.map(rule=>rule.id)});
        expect(result.violations).toEqual([]);
      };
      await scan();
      if(name==='Nastavení') { await button(page,'Vzhled a prostředí').click(); await scan(); }
      await page.keyboard.press('Escape'); await page.mouse.move(0,800);
    }
    await writeFile(info.outputPath('accessibility.json'),JSON.stringify(reports,null,2));
  });
}
