import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {chromium} from 'playwright';
import AxeBuilder from '@axe-core/playwright';
const base=process.env.LIBRARY_URL||'http://127.0.0.1:4185/axolotl-preview/ds-library-v1-1/';
const raw=readFileSync('src/design-system/tokens/tweakcn.export.css','utf8');
const parse=block=>Object.fromEntries([...block.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map(m=>[m[1],m[2].trim()]));
const light=parse(raw.match(/:root\s*\{([^}]+)\}/)[1]),dark={...light,...parse(raw.match(/\.dark\s*\{([^}]+)\}/)[1])};
const corrections=JSON.parse(readFileSync('src/design-system/tokens/contrast-corrections.json','utf8'));
const expected={light:{...light,...corrections.light},dark:{...dark,...corrections.dark}};
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROME_EXECUTABLE||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined)});
const context=await browser.newContext({viewport:{width:1366,height:900},reducedMotion:'reduce'});
const page=await context.newPage();
const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
const go=async(section='')=>{await page.goto(base+(section?`?section=${section}`:'')+'#design-system');await page.locator('.ds-catalog h1').waitFor();await page.getByText('Načítám komponenty…',{exact:true}).waitFor({state:'hidden'});await page.evaluate(()=>document.fonts.ready);};
const roleMatches=async(locator,property,token)=>assert(await locator.first().evaluate((el,{property,token})=>{const probe=document.createElement('span');probe.style[property]=getComputedStyle(el).getPropertyValue(token);document.body.append(probe);const expected=getComputedStyle(probe)[property];probe.remove();return getComputedStyle(el)[property]===expected;},{property,token}),`${property} must use ${token}`);
try{
 await go();await page.locator('[data-system-theme="light"] .ds-card').waitFor();
 for(const mode of ['light','dark']){
  const column=page.locator(`[data-system-theme="${mode}"]`);
  const actual=await column.evaluate((el,names)=>Object.fromEntries(names.map(name=>[name,getComputedStyle(el).getPropertyValue(name).trim()])),Object.keys(expected[mode]));
  assert.deepEqual(actual,expected[mode],'Resolved registry must match the original export plus explicit AA corrections');
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
 assert.deepEqual(audit.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.failureSummary)})),[]);
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
 await go('brand');
 const marks=page.locator('.ds-animated-brand .axo-animated-mark');
 for(const mark of await marks.all()){
  const geometry=await mark.evaluate(el=>{const a=el.getBoundingClientRect(),b=el.querySelector('.axo-animated-mark__frame').getBoundingClientRect();return {size:el.dataset.size,w:a.width,h:a.height,dx:(a.left+a.right-b.left-b.right)/2,dy:(a.top+a.bottom-b.top-b.bottom)/2};});
  assert.equal(geometry.w,{small:48,medium:72,large:104}[geometry.size]);assert.equal(geometry.h,geometry.w);
  assert(Math.abs(geometry.dx)<.1 && Math.abs(geometry.dy)<.1,'Every mark size must center its scaled artwork');
 }
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.waitForFunction(()=>getComputedStyle(document.querySelector('.axo-animated-mark__orbit')).animationName==='axo-mark-orbit');
 for(const mark of await marks.all()) {
  const art=await mark.evaluate(el=>{
   const svg=el.querySelector('.axo-animated-mark__symbol');
   return {
    animations:el.getAnimations({subtree:true}).map(a=>[a.animationName,a.effect.target.className]),
    gills:svg.querySelectorAll('[data-gill]').length,
    fills:[...svg.querySelectorAll('[data-head],[data-gill]')].map(e=>getComputedStyle(e).fill),
    eyes:[...svg.querySelectorAll('[data-eye]')].map(e=>getComputedStyle(e).fill),
    transform:getComputedStyle(svg).transform,filter:getComputedStyle(svg).filter,
    orbitDuration:getComputedStyle(el.querySelector('.axo-animated-mark__orbit')).animationDuration,
   };
  });
  assert.deepEqual(art.animations,[['axo-mark-orbit','axo-animated-mark__orbit']],'Only the ring animates; the logo head stays static');
  assert.equal(art.gills,6);assert.deepEqual(art.fills,Array(7).fill('rgb(255, 255, 255)'),'Head and all six gills stay white in both themes');
  assert.deepEqual(art.eyes,['rgb(23, 23, 27)','rgb(23, 23, 27)']);
  assert.equal(art.transform,'none');assert.equal(art.filter,'none');assert.equal(art.orbitDuration,'2.2s');
 }
 await page.getByRole('button',{name:'Pozastavit animaci',exact:true}).click();
 assert(await marks.evaluateAll(es=>es.every(el=>el.getAnimations({subtree:true}).every(a=>a.playState==='paused'))),'Pause every specimen');
 await page.getByRole('button',{name:'Přehrát animaci',exact:true}).press('Enter');
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.waitForFunction(()=>[...document.querySelectorAll('.axo-animated-mark')].every(el=>el.getAnimations({subtree:true}).length===0));
 assert.equal(await page.getByRole('status').filter({hasText:'Ukázka: načítání pracovního prostoru'}).count(),1,'Loader remains announced without motion');
 for(const theme of ['light','dark']) await roleMatches(page.locator(`[data-mark-theme=${theme}] .axo-animated-mark`),'backgroundColor','--card');
 await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Brand mobile overflow');await page.setViewportSize({width:1366,height:900});
 await go('buttons');await page.emulateMedia({reducedMotion:'no-preference'});
 const buttonBox=await page.locator('#button-playground').boundingBox();
 await page.getByRole('checkbox',{name:'Omezit pohyb',exact:true}).uncheck();await page.getByRole('checkbox',{name:'Star Border',exact:true}).check();
 await page.locator('.axo-button-showcase__stage canvas').first().waitFor();
 const motionBox=await page.locator('#button-playground').boundingBox();assert.equal(motionBox.width,buttonBox.width);assert.equal(motionBox.height,buttonBox.height);
 await page.getByRole('checkbox',{name:'Omezit pohyb',exact:true}).check();assert.equal(await page.locator('.axo-button-showcase__stage canvas').count(),0);
 await page.emulateMedia({reducedMotion:'reduce'});
 await go('dashboard');await page.locator('#approved-header header').waitFor();
 for(const mode of ['dark','light']){
  await page.getByRole('checkbox',{name:'Tmavý režim',exact:true}).setChecked(mode==='dark');
  await page.waitForFunction(mode=>document.documentElement.dataset.theme===mode,mode);
  // URL is a compound control: its container owns the input focus ring.
  const url=page.locator('[data-header-url]'),urlInput=url.getByRole('textbox',{name:'Aktuální URL'});
  const dimensions=await url.evaluate(el=>[el.getBoundingClientRect().width,el.getBoundingClientRect().height]);
  const singleUrlRing=async()=>{
   assert(await urlInput.evaluate(el=>{const s=getComputedStyle(el);return s.outlineStyle==='none'&&s.borderTopWidth==='0px'&&s.boxShadow==='none';}),'URL input must not draw a second ring');
   assert(await url.evaluate(el=>{const s=getComputedStyle(el);return s.outlineStyle==='none'&&parseFloat(s.borderTopWidth)>=2&&s.borderTopColor===getComputedStyle(el.querySelector('label')).color;}),'URL capsule must show its focus ring');
   assert.deepEqual(await url.evaluate(el=>[el.getBoundingClientRect().width,el.getBoundingClientRect().height]),dimensions,'Focus must not change URL geometry');
  };
  await urlInput.fill('https://example.cz/');await urlInput.click();await singleUrlRing();
  await urlInput.press('Tab');assert(await url.getByRole('button',{name:'Kopírovat URL'}).evaluate(el=>el===document.activeElement));
  await page.keyboard.press('Shift+Tab');await singleUrlRing();
  await url.locator('label').click();assert(await urlInput.evaluate(el=>el===document.activeElement));
  await context.grantPermissions(['clipboard-read','clipboard-write']);
  await urlInput.selectText();await page.keyboard.press('ControlOrMeta+c');assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),await urlInput.inputValue());
  await url.getByRole('button',{name:'Vybrat kartu prohlížeče'}).click();await page.getByRole('heading',{name:'Otevřené karty',exact:true}).waitFor();await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'Média',exact:true}).focus();assert(await url.evaluate(el=>getComputedStyle(el).outlineStyle==='none'),'URL ring must disappear after focus leaves');
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
 console.log('PASS: resolved light/dark registry, fonts, all families, Header/theme synchronization, focus, URL, mobile, native Dashboard, Star Border and reduced motion.');
}finally{await browser.close();}
