import assert from 'node:assert/strict';
import {readFileSync,existsSync,writeFileSync} from 'node:fs';
import {chromium} from 'playwright';
import AxeBuilder from '@axe-core/playwright';
const base=process.env.LIBRARY_URL||'http://127.0.0.1:4185/axolotl-preview/ds-library-v1-1/';
const raw=readFileSync('src/design-system/tokens/tweakcn.export.css','utf8');
const parse=block=>Object.fromEntries([...block.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map(m=>[m[1],m[2].trim()]));
const light=parse(raw.match(/:root\s*\{([^}]+)\}/)[1]),dark={...light,...parse(raw.match(/\.dark\s*\{([^}]+)\}/)[1])};
const expected={light,dark};
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROME_EXECUTABLE||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined)});
const context=await browser.newContext({viewport:{width:1366,height:900},reducedMotion:'reduce'});
const page=await context.newPage();
const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
const go=async(section='')=>{await page.goto(base+(section?`?section=${section}`:'')+'#design-system');await page.locator('.ds-catalog h1').waitFor();};
const roleMatches=async(locator,property,token)=>assert(await locator.first().evaluate((el,{property,token})=>{const probe=document.createElement('span');probe.style[property]=getComputedStyle(el).getPropertyValue(token);document.body.append(probe);const expected=getComputedStyle(probe)[property];probe.remove();return getComputedStyle(el)[property]===expected;},{property,token}),`${property} must use ${token}`);
try{
 await go();await page.locator('[data-system-theme="light"] .ds-card').waitFor();
 for(const mode of ['light','dark']){
  const column=page.locator(`[data-system-theme="${mode}"]`);
  const actual=await column.evaluate((el,names)=>Object.fromEntries(names.map(name=>[name,getComputedStyle(el).getPropertyValue(name).trim()])),Object.keys(expected[mode]));
  assert.deepEqual(actual,expected[mode],'All export values must remain exact, including inherited dark values');
  await roleMatches(column.locator('[data-variant="primary"]'),'backgroundColor','--primary');
  await roleMatches(column.locator('[data-variant="primary"]'),'color','--primary-foreground');
  await roleMatches(column.locator('.ds-card'),'backgroundColor','--card');
  await roleMatches(column.locator('.ds-input'),'borderTopColor','--input');
  await column.getByRole('button',{name:'Rychlá volba',exact:true}).click();
  await roleMatches(page.locator('.ds-popover'),'backgroundColor','--popover');
  await roleMatches(page.locator('.ds-popover'),'color','--popover-foreground');
  await page.keyboard.press('Escape');
  await column.getByRole('button',{name:'Otevřít dialog',exact:true}).click();
  await roleMatches(page.locator('.ds-dialog'),'backgroundColor','--card');
  await page.keyboard.press('Escape');
 }
 await page.locator('.ds-system-columns').scrollIntoViewIfNeeded();
 await page.screenshot({path:'/tmp/axolotl-theme-components.png'});
 await page.evaluate(()=>document.fonts.ready);
 assert(await page.evaluate(()=>Array.from(document.fonts).some(f=>f.family==='Montserrat'&&f.status==='loaded')),'Montserrat must load');
 const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
 // Exact user-supplied pairs are not silently recolored to pass a contrast gate.
 writeFileSync('/tmp/axolotl-theme-contrast.json',JSON.stringify(audit.violations.filter(v=>v.id==='color-contrast'),null,2));
 assert.deepEqual(audit.violations.filter(v=>v.id!=='color-contrast').map(v=>v.id),[]);
 console.log('Exact export contrast findings:',audit.violations.filter(v=>v.id==='color-contrast').flatMap(v=>v.nodes).length);
 await go('foundations');await page.getByRole('heading',{name:'Chart Colors',exact:true}).waitFor();
 assert.equal(await page.locator('.ds-foundations-inventory > section').count(),13);
 await page.evaluate(()=>document.fonts.ready);
 assert(await page.evaluate(()=>Array.from(document.fonts).some(f=>f.family==='Fira Code'&&f.status==='loaded')),'Fira Code must load');
 for(const section of ['buttons','forms','surfaces','navigation','overlays','feedback','widgets','colors','brand']){
  await go(section);await page.getByRole('heading',{name:'API, zdroj a použití',exact:true}).waitFor();
  for(const mode of ['light','dark']){
   await page.evaluate(mode=>window.axolotlPreferences.set('theme',mode),mode);
   await page.waitForFunction(mode=>document.documentElement.dataset.theme===mode,mode);
   await roleMatches(page.locator('.ds-catalog'),'color','--foreground');
  }
 }
 await go('buttons');await page.emulateMedia({reducedMotion:'no-preference'});
 await page.getByRole('checkbox',{name:'Omezit pohyb',exact:true}).uncheck();await page.getByRole('checkbox',{name:'Star Border',exact:true}).check();
 await page.locator('.axo-button-showcase__stage canvas').first().waitFor();
 await page.getByRole('checkbox',{name:'Omezit pohyb',exact:true}).check();assert.equal(await page.locator('.axo-button-showcase__stage canvas').count(),0);
 await page.emulateMedia({reducedMotion:'reduce'});
 await go('dashboard');await page.locator('#approved-header header').waitFor();
 for(const mode of ['dark','light']){
  await page.getByRole('checkbox',{name:'Tmavý režim',exact:true}).setChecked(mode==='dark');
  await page.waitForFunction(mode=>document.documentElement.dataset.theme===mode,mode);
  await roleMatches(page.locator('#approved-header header'),'backgroundColor','--card');
  await roleMatches(page.locator('[data-widget="2"]'),'backgroundColor','--card');
  await roleMatches(page.locator('.axolotl-pill-nav__slot[data-on] .axolotl-pill-nav__fill'),'backgroundColor','--primary');
  assert.equal(await page.locator('.ds-bento-cell').count(),7);assert.equal(await page.locator('iframe').count(),0);
  await page.locator('.ds-dashboard').evaluate(el=>scrollTo(0,scrollY+el.getBoundingClientRect().top));
  await page.screenshot({path:`/tmp/axolotl-theme-dashboard-${mode}.png`});
  await page.getByRole('button',{name:'Média',exact:true}).focus();await page.keyboard.press('ArrowDown');
  const panel=page.locator('[data-header-panel="group:media"]');await panel.waitFor();
  await roleMatches(panel,'backgroundColor','--popover');
  await page.waitForFunction(()=>document.activeElement?.matches('[data-header-panel] [data-nav-item]'));
  await page.keyboard.press('Escape');
 }
 const input=page.getByRole('textbox',{name:'Aktuální URL'});await input.fill('example.cz');await input.press('Enter');assert.equal(await input.inputValue(),'https://example.cz/');
 await page.setViewportSize({width:390,height:844});
 await page.getByRole('button',{name:'Otevřít navigaci',exact:true}).click();await page.getByRole('button',{name:'Média',exact:true}).click();await page.getByRole('link',{name:'QR',exact:true}).click();
 assert.equal(await page.locator('.ds-bento-cell').count(),7);
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Mobile overflow');
 await page.screenshot({path:'/tmp/axolotl-theme-dashboard-mobile.png'});
 assert.deepEqual(errors,[]);
 console.log('PASS: exact light/dark export, fonts, all families, Header/theme synchronization, focus, URL, mobile, native Dashboard, Star Border and reduced motion.');
}finally{await browser.close();}
