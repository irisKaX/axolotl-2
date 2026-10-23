import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {chromium} from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
{
// Focused Header regression. SEO responses below are explicitly synthetic bridge fixtures.
const base=process.env.LIBRARY_URL||'http://127.0.0.1:4185/axolotl-preview/ds-library-v1-1/';
let proxy;
if(base.startsWith('https:')&&process.env.HTTPS_PROXY){const u=new URL(process.env.HTTPS_PROXY);proxy={server:u.origin,username:decodeURIComponent(u.username),password:decodeURIComponent(u.password)};}
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROME_EXECUTABLE||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),proxy});
const context=await browser.newContext({viewport:{width:1366,height:768},reducedMotion:'reduce',permissions:['clipboard-read','clipboard-write']});
const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
const go=async()=>{await page.goto(base+'?section=dashboard#design-system');await page.locator('[data-header-url]').waitFor();await page.evaluate(()=>document.fonts.ready);await page.locator('.ds-dashboard').evaluate(e=>e.scrollIntoView());};
const token=async(el,prop,name)=>assert(await el.evaluate((e,{prop,name})=>{const p=document.createElement('span');p.style[prop]=getComputedStyle(e).getPropertyValue(name);document.body.append(p);const ok=getComputedStyle(e)[prop]===getComputedStyle(p)[prop];p.remove();return ok;},{prop,name}),`${prop} must use ${name}`);
try {
 await go();
 const capsule=page.locator('[data-header-url]'),input=capsule.getByRole('textbox'),copy=capsule.getByRole('button',{name:'Kopírovat URL'}),tabs=capsule.getByRole('button',{name:'Vybrat kartu prohlížeče'}),dot=page.locator('[data-header-seo]');
 for(const mode of ['dark','light']) {
  await page.getByRole('checkbox',{name:'Tmavý režim',exact:true}).setChecked(mode==='dark');
  await page.waitForFunction(m=>document.documentElement.dataset.theme===m,mode);
  await input.fill('https://example.cz/test');await input.press('Enter');await page.mouse.move(1,1);
  await token(capsule,'borderTopColor','--input');await token(capsule.locator('label'),'color','--muted-foreground');
  const before=await capsule.boundingBox();await capsule.hover();await token(capsule,'borderTopColor','--ring');await token(capsule.locator('label'),'color','--muted-foreground');
  await input.click();await token(capsule,'borderTopColor','--ring');await token(capsule.locator('label'),'color','--ring');
  assert(await capsule.evaluate(e=>getComputedStyle(e).outlineStyle==='none'&&getComputedStyle(e).boxShadow==='none'));
  assert(await input.evaluate(e=>{const s=getComputedStyle(e);return s.borderWidth==='0px'&&s.outlineStyle==='none'&&s.boxShadow==='none';}));
  assert.deepEqual(await capsule.boundingBox(),before,'Focus keeps capsule dimensions');
  await input.press('Tab');assert(await copy.evaluate(e=>e===document.activeElement));
  assert(await copy.evaluate(e=>getComputedStyle(e).outlineStyle==='none'));
  await copy.press('Enter');await page.getByRole('status').filter({hasText:'URL zkopírována.'}).waitFor();
  assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),'https://example.cz/test');
  await copy.press('Tab');assert(await tabs.evaluate(e=>e===document.activeElement));
  await tabs.press('Enter');await page.getByRole('heading',{name:'Otevřené karty',exact:true}).waitFor();
  await page.keyboard.press('Escape');assert(await tabs.evaluate(e=>e===document.activeElement));
  await page.mouse.move(1,1);await dot.focus();await token(capsule,'borderTopColor','--input');await token(capsule.locator('label'),'color','--muted-foreground');
  await page.getByRole('tooltip').waitFor();assert.match(await dot.getAttribute('aria-label'),/nebyla ověřena|nepřipojené|není připojené/);
  await page.keyboard.press('Escape');
  const home=page.getByRole('link',{name:'Dashboard',exact:true});
  const navRadius=await home.evaluate(e=>getComputedStyle(e).borderRadius);
  for(const label of ['Můj workspace','Média','Kontrola','Upozornění','Nastavení']) {
   const button=page.getByRole('button',{name:label,exact:true});await button.focus();
   assert(await button.evaluate(e=>getComputedStyle(e).outlineStyle!=='none'),`${label} focus visible`);
   if(['Můj workspace','Média','Kontrola'].includes(label))assert.equal(await button.evaluate(e=>getComputedStyle(e).borderRadius),navRadius);
   await button.press('ArrowDown');await page.locator('[data-header-panel]').waitFor();
   assert.equal(await button.getAttribute('aria-expanded'),'true');
   await page.keyboard.press('Escape');assert(await button.evaluate(e=>e===document.activeElement));
  }
  await page.mouse.move(1,1);
  for(const label of ['Můj workspace','Média','Kontrola','Upozornění','Nastavení']) {
   const control=page.getByRole('button',{name:label,exact:true});await control.hover();
   await page.waitForFunction(label=>document.querySelector(`button[aria-label="${label}"]`)?.getAttribute('aria-expanded')==='true'||Array.from(document.querySelectorAll('#approved-header button')).some(e=>e.textContent.includes(label)&&e.getAttribute('aria-expanded')==='true'),label);
   if(['Upozornění','Nastavení'].includes(label)) {
    assert(await control.evaluate(e=>{const s=getComputedStyle(e),probe=document.createElement('i');probe.style.backgroundColor=s.getPropertyValue('--primary');e.append(probe);const ok=getComputedStyle(e,'::before').backgroundColor===getComputedStyle(probe).backgroundColor;probe.remove();return ok;}));
   } else await token(control.locator('.axolotl-pill-nav__fill'),'backgroundColor','--primary');
   await page.keyboard.press('Escape');await page.mouse.move(1,1);
  }
  await input.focus();
  const violations=(await new AxeBuilder({page}).include('#approved-header').withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze()).violations;
  assert.deepEqual(violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[]);
  assert(await page.locator('.ds-dashboard').evaluate(e=>e.scrollHeight<=e.clientHeight+1&&e.scrollWidth<=e.clientWidth),'1366×768 Dashboard fits without internal scrolling');
  assert.equal(await page.locator('.ds-bento-cell').count(),7);
  await page.screenshot({path:`/tmp/header-${mode}.png`});
 }
 for(const width of [1180,768,390,320]) {
  await page.setViewportSize({width,height:844});await page.locator('.ds-dashboard').evaluate(e=>e.scrollIntoView());
  assert(await page.locator('#approved-header header').evaluate(e=>e.scrollWidth<=e.clientWidth),`Header fits ${width}`);
  assert(await input.evaluate(e=>e.getBoundingClientRect().width>=24),`URL editable at ${width}`);
  assert(await copy.evaluate(e=>e.getBoundingClientRect().width>=24));
  const menu=page.getByRole('button',{name:'Otevřít navigaci',exact:true});await menu.click();await page.getByRole('navigation',{name:'Kompaktní navigace'}).waitFor();await page.keyboard.press('Escape');
 }
 // Synthetic fixtures exercise the real page store -> transport -> hook -> indicator path.
 const fixture=await context.newPage();
 await fixture.addInitScript(()=>{
  sessionStorage.clear();
  window.__seoFixture={url:'https://fixture.test/allowed',token:'1',content:'index,follow',headers:[],delay:0,error:false,requests:0};
  const post=data=>window.postMessage({source:'axolotl-extension',...data},location.origin);
  window.addEventListener('message',event=>{
   const m=event.data;if(m?.source!=='axolotl-page')return;
   const f={...window.__seoFixture};
   if(m.type==='AXOLOTL_GET_TABS')post({type:'AXOLOTL_TABS',requestId:m.requestId,ok:true,activeId:8,tabs:[{id:8,title:'Synthetic SEO fixture',url:f.url,documentToken:f.token}]});
   if(m.type==='AXOLOTL_TOOL_REQUEST'&&m.operation==='TARGET_INDEXATION'){
    window.__seoFixture.requests++;
    post({type:'AXOLOTL_TOOL_ACK',requestId:m.requestId});
    setTimeout(()=>post({type:'AXOLOTL_TOOL_RESPONSE',requestId:m.requestId,ok:!f.error,error:'Synthetic permission failure',data:{id:8,url:f.url,documentId:f.token,entries:[{name:'robots',content:f.content}],headers:f.headers}}),f.delay);
   }
  });
 });
 await fixture.goto(base+'?section=dashboard#design-system');const state=fixture.locator('[data-header-seo]');
 const expectState=async(expected)=>{await fixture.waitForFunction(expected=>document.querySelector('[data-header-seo]')?.getAttribute('data-header-seo')===expected,expected);};
 const change=async(values)=>fixture.evaluate(v=>{Object.assign(window.__seoFixture,v);document.dispatchEvent(new Event('axolotl:browser-refresh'));},values);
 await expectState('allowed');
 await fixture.getByRole('button',{name:'Kopírovat URL'}).click();await fixture.getByRole('status').filter({hasText:'URL zkopírována.'}).waitFor();
 assert.equal(await state.getAttribute('data-header-seo'),'allowed','Copy preserves selected tab and robots context');
 for(const content of ['noindex','nofollow','none','noindex,nofollow']){await change({content,url:'https://fixture.test/'+content});await expectState('blocked');assert.match(await state.getAttribute('aria-label'),/noindex|nofollow/);}
 await change({content:'index,follow',headers:undefined,url:'https://fixture.test/meta-only'});await expectState('unknown');
 await fixture.waitForFunction(()=>document.querySelector('[data-header-seo]')?.getAttribute('aria-label').includes('X-Robots-Tag není dostupný'));
 await change({error:true,headers:[],url:'https://fixture.test/permission'});await expectState('unknown');
 await fixture.waitForFunction(()=>document.querySelector('[data-header-seo]')?.getAttribute('aria-label').includes('Synthetic permission failure'));
 const requests=await fixture.evaluate(()=>window.__seoFixture.requests);
 await change({error:false,content:'index,follow',delay:500,url:'https://fixture.test/slow'});
 await fixture.waitForFunction(n=>window.__seoFixture.requests>n,requests);
 await change({content:'noindex',delay:0,url:'https://fixture.test/new'});await expectState('blocked');
 await fixture.waitForTimeout(600);assert.equal(await state.getAttribute('data-header-seo'),'blocked','Late old response ignored');
 await change({token:'reloaded',content:'index,follow',delay:100});await expectState('unknown');await expectState('allowed');
 await fixture.getByRole('textbox',{name:'Aktuální URL'}).fill('https://manual.test/');await expectState('unknown');
 await fixture.getByRole('textbox',{name:'Aktuální URL'}).press('Enter');assert.match(await state.getAttribute('aria-label'),/Ručně zadanou/);
 assert.deepEqual(errors,[]);
 console.log('PASS: Header light/dark, single URL border/WWW color, copy, tabs, keyboard, all navigation panels, responsive 320–1366, Dashboard fit, a11y. SEO SYNTHETIC fixtures: directives, partial data, permissions, reload and stale responses; live extension not claimed.');
} finally {await browser.close();}
}
// Approved final-polish assertions, now owned by the canonical Header checker.
{
const source=process.cwd();
const base=process.env.LIBRARY_URL||'http://127.0.0.1:4185/axolotl-preview/ds-library-v1-1/';
let proxy;if(base.startsWith('https:')&&process.env.HTTPS_PROXY){const u=new URL(process.env.HTTPS_PROXY);proxy={server:u.origin,username:decodeURIComponent(u.username),password:decodeURIComponent(u.password)};}
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROME_EXECUTABLE||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),proxy});
const page=await browser.newPage({viewport:{width:1366,height:768},reducedMotion:'reduce'});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const readPaint=()=>page.locator('#approved-header header').evaluate(el=>{
 const s=getComputedStyle(el);const p=document.createElement('span');el.append(p);
 const resolveColor=value=>{p.style.color=value;return getComputedStyle(p).color;};
 const result={primary:resolveColor('var(--primary)'),ring:resolveColor('var(--ring)'),hover:resolveColor('var(--axo-hover)'),hoverInk:resolveColor('var(--axo-hover-ink)')};p.remove();return result;
});
try {
 await page.goto(base+'?catalog=library&section=dashboard#design-system');await page.locator('#approved-header header').waitFor();await page.evaluate(()=>document.fonts.ready);
 const paints={};
 for(const mode of ['light','dark']) {
  await page.getByRole('checkbox',{name:'Tmavý režim',exact:true}).setChecked(mode==='dark');await page.waitForFunction(m=>document.documentElement.dataset.theme===m,mode);
  await page.locator('.ds-dashboard').evaluate(e=>e.scrollIntoView());
  paints[mode]=await readPaint();
  const logo=page.locator('#approved-header .axo-animated-mark');assert.equal(await logo.count(),1,'Header reuses AnimatedAxolotlLogo');
  assert.equal(await logo.locator('[data-gill]').count(),6);assert.equal(await logo.getAttribute('data-size'),'small');
  assert(await logo.locator('svg').evaluate(e=>{const s=getComputedStyle(e);return s.width==='50px'&&s.height==='42px'&&s.fill==='rgb(255, 255, 255)';}),'Header icon rules must not shrink/recolor the canonical SVG');
  const input=page.getByRole('textbox',{name:'Aktuální URL'});await input.fill('https://example.cz/');await input.click();
  assert.equal(await input.locator('..').evaluate(e=>getComputedStyle(e).borderTopColor),paints.light.ring);
  assert.equal(await page.locator('[data-header-url] label').evaluate(e=>getComputedStyle(e).color),paints.light.ring);
  await input.press('Enter');
  for(const title of ['Můj workspace','Média','Kontrola','Upozornění','Nastavení']) {
   const button=page.getByRole('button',{name:title,exact:true});await button.hover();await page.locator('[data-header-panel]').waitFor();
   const color=await button.evaluate(e=>{const fill=e.querySelector('.axolotl-pill-nav__fill');return fill?getComputedStyle(fill).backgroundColor:getComputedStyle(e,'::before').backgroundColor;});
   assert.equal(color,paints.light.primary,`${mode} ${title} open color follows Light reference`);
   await page.keyboard.press('Escape');await page.mouse.move(1,1);await button.focus();
   assert(await button.evaluate(e=>getComputedStyle(e).outlineStyle!=='none'));
  }
  if(mode==='dark') {
   await page.getByRole('button',{name:'Nastavení',exact:true}).click();
   await page.getByRole('button',{name:'Vzhled a prostředí',exact:true}).click();
   const field=page.locator('[data-header-select-trigger]').first();await field.focus();
   assert.equal(await field.evaluate(e=>getComputedStyle(e).backgroundColor),paints.light.hover);
   assert.equal(await field.evaluate(e=>getComputedStyle(e).outlineColor),paints.light.ring);
   assert.equal(await field.evaluate(e=>getComputedStyle(e).outlineOffset),'-2px');
   await page.keyboard.press('Escape');
  }
  // URL actions have hover and pressed states without opening a navigation panel.
  const copy=page.getByRole('button',{name:'Kopírovat URL'});await input.focus();await copy.hover();
  assert.equal(await copy.evaluate(e=>getComputedStyle(e).backgroundColor),paints.light.hover);
  assert.equal(await copy.evaluate(e=>getComputedStyle(e).color),paints.light.hoverInk);
  await page.mouse.down();assert.equal(await copy.evaluate(e=>getComputedStyle(e).backgroundColor),paints.light.primary);await page.mouse.up();
  await page.mouse.move(1,1);await page.locator('.ds-dashboard').screenshot({path:`/tmp/header-polish-${mode}.png`});
 }
  assert.deepEqual(paints.dark,paints.light,'All Header interaction paints match Light, including hover pair');
  const reference=readFileSync(resolve(source,'src/design-system/tokens/tweakcn.export.css'),'utf8').match(/--primary:\s*([^;]+)/)[1];
  const resolvedReference=await page.evaluate(value=>{const el=document.createElement('span');el.style.color=value;document.body.append(el);const color=getComputedStyle(el).color;el.remove();return color;},reference);
  assert.equal(paints.light.primary,resolvedReference);
  await page.emulateMedia({reducedMotion:'no-preference'});
  const link=page.getByRole('link',{name:'O₂ Axolotl – dashboard',exact:true});await link.hover();await page.waitForTimeout(300);
  assert(await link.evaluate(e=>e.getAnimations({subtree:true}).every(a=>a.effect.target.classList.contains('axo-animated-mark__orbit'))),'PillNav must not add a second whole-logo animation');
  await link.click();await page.getByRole('status').filter({hasText:'Navigační ukázka: dashboard.'}).waitFor();
  for(const width of [1180,768,390,320]) {
   await page.setViewportSize({width,height:844});const link=page.getByRole('link',{name:'O₂ Axolotl – dashboard',exact:true});await link.waitFor();
   assert.equal(await link.locator('.axo-animated-mark').count(),1);
   assert(await link.evaluate(e=>{const a=e.getBoundingClientRect(),b=e.querySelector('.axo-animated-mark').getBoundingClientRect();return Math.abs(a.x+a.width/2-b.x-b.width/2)<.5&&Math.abs(a.y+a.height/2-b.y-b.height/2)<.5&&b.width<=a.width+.5;}),'Compact logo centered inside unchanged link');
   assert(await page.locator('#approved-header header').evaluate(e=>e.scrollWidth<=e.clientWidth));
   await link.click();
  }
  await page.screenshot({path:'/tmp/header-polish-mobile.png'});
  assert.deepEqual(errors,[]);console.log('PASS: Light reference colors in both Header themes, canonical SVG/animation reuse, interactions, navigation and responsive logo.');
} finally {await browser.close();}

}
// Release mode always requires the independently pinned reference; no auto-record.
if (process.argv.includes('--release')) {
 const {BASELINE_DIR,BASELINE_SHA256,BASELINE_OUTPUT}=process.env;
 assert(BASELINE_DIR&&BASELINE_SHA256&&BASELINE_OUTPUT,'Pinned baseline inputs are mandatory');
 execFileSync(process.execPath,[resolve('scripts/visual-baseline/check.mjs'),'--baseline',BASELINE_DIR,'--sha256',BASELINE_SHA256,'--url',process.env.LIBRARY_URL,'--output',BASELINE_OUTPUT],{stdio:'inherit'});
}
