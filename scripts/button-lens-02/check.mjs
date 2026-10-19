// Start `npm run dev -- --port 4192`, then run this script. No deployment.
import { chromium, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { build } from 'esbuild';
import path from 'node:path';
const base=process.env.BUTTON_TEST_URL||'http://127.0.0.1:4192/axolotl-2/';
const out='docs/button-lens-02/evidence'; await mkdir(out,{recursive:true});
const sha='0428979396961c7c0c4c6ecd2fc726164c2c457f';
const tmp='.button-check'; await mkdir(`${tmp}/vendor`,{recursive:true});
for(const file of ['Button.jsx','studio.css','vendor/StarBorder.jsx','vendor/StarBorder.css']) {
 await writeFile(`${tmp}/${file}`,execFileSync('git',['show',`${sha}:experiments/button-studio-01/${file}`]));
}
await build({jsx:'automatic',stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';import {Button} from './Button';import './studio.css';createRoot(document.getElementById('root')).render(<main>{['primary','secondary','ghost','icon','destructive'].map(v=><section key={v}>{['s','m','l'].map((s,i)=><Button id={v+'-'+['small','medium','large'][i]} key={s} family="lens" variant={v} size={s} className="lens-clean"/>)}</section>)}</main>);`,loader:'jsx',resolveDir:path.resolve(tmp)},bundle:true,outfile:`${tmp}/reference.js`});
await writeFile(`${tmp}/index.html`,'<!doctype html><html data-theme="dark"><head><title>Approved reference</title><link rel="stylesheet" href="./reference.css"><style>.lab-button[data-family=lens].lens-clean .button-icon{background:none;border:0;box-shadow:none;border-radius:0}main{padding:32px}section{display:flex;gap:24px;margin:32px}</style></head><body><div id="root"></div><script type="module" src="./reference.js"></script></body></html>');
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROME_EXECUTABLE||'/usr/bin/chromium',args:['--no-sandbox']});
const report={reference:sha,checks:[],computed:[],browser:browser.version(),errors:[]};
const check=(name)=>{report.checks.push(name);console.log('PASS',name);};
const capture=el=>el.evaluate(node=>{const s=getComputedStyle(node),r=node.getBoundingClientRect();return Object.fromEntries(['color','backgroundImage','backgroundColor','borderTopColor','borderRadius','fontFamily','fontSize','fontWeight','letterSpacing','boxShadow','paddingLeft','paddingRight','gap','transform','outlineColor','outlineWidth','outlineOffset'].map(k=>[k,s[k]]).concat([['width',+r.width.toFixed(3)],['height',+r.height.toFixed(3)]]));});
try {
 const context=await browser.newContext({viewport:{width:1366,height:768},locale:'cs-CZ'});
 const page=await context.newPage();
 page.on('pageerror',e=>report.errors.push(e.message));
 const ref=await browser.newPage({viewport:{width:1366,height:768}});
 await Promise.all([page.goto(base+'scripts/button-lens-02/fixture.html'),ref.goto(base+'.button-check/index.html')]);
 await expect(page.locator('#primary-small')).toBeVisible();
 for(const theme of ['dark','light']) {
  for(const p of [page,ref]) { await p.evaluate(t=>{document.documentElement.dataset.theme=t;document.activeElement?.blur();},theme);await p.mouse.move(0,0); }
  await page.waitForTimeout(250);
  for(const variant of ['primary','secondary','ghost','icon','destructive']) for(const size of ['small','medium','large']) {
   const id=`#${variant}-${size}`;await page.mouse.move(0,0);await ref.mouse.move(0,0);
   const a=await capture(page.locator(id)),b=await capture(ref.locator(id));expect(a).toEqual(b);report.computed.push({theme,variant,size,styles:a});
  }
  for(const state of ['hover','pressed','focus-visible']) {
   for(const p of [page,ref]) {
    const el=p.locator('#primary-medium');
    if(state==='hover') await el.hover();
    if(state==='pressed') await p.mouse.down();
    if(state==='focus-visible'){await p.mouse.up();await p.mouse.move(0,0);await p.keyboard.press('Tab');await el.focus();}
   }
   await page.waitForTimeout(250);
   expect(await capture(page.locator('#primary-medium'))).toEqual(await capture(ref.locator('#primary-medium')));
   const box=await page.locator('.matrix').boundingBox();
   await page.screenshot({path:`${out}/${theme}-${state}.png`,clip:{x:box.x-8,y:box.y-8,width:box.width+16,height:box.height+16}});
  }
  check(`${theme}: 15 variants/sizes + real hover/pressed/focus match pinned reference computed styles`);
  await page.screenshot({path:`${out}/${theme}-desktop.png`,fullPage:true});
  const axe=await new AxeBuilder({page}).include('.axo-button-showcase').analyze();
  expect(axe.violations,JSON.stringify(axe.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})))).toEqual([]);
  check(`${theme}: catalog axe WCAG checks: 0 violations`);
 }
 await ref.close();
 await page.locator('#stable').evaluate(el=>window.__button=el);
 const width=await page.locator('#stable').evaluate(el=>el.getBoundingClientRect().width);
 await page.locator('#toggle-motion').check();await expect(page.locator('#stable canvas')).toHaveCount(1);
 expect(await page.locator('#stable').evaluate(el=>el===window.__button)).toBe(true);
 const sample=()=>page.locator('#stable canvas').evaluate(c=>c.toDataURL());
 const frame=await sample();await page.waitForTimeout(180);expect(await sample()).not.toBe(frame);
 expect(await page.locator('#stable canvas').evaluate(c=>c.getContext('2d').getImageData(0,0,c.width,c.height).data.some(v=>v>0))).toBe(true);
 await page.locator('#stable').focus();await page.keyboard.press('Enter');await page.keyboard.press('Space');await expect(page.locator('#count')).toHaveText('2');
 await page.locator('#toggle-busy').evaluate(el=>el.click());
 await expect(page.locator('#stable canvas')).toHaveCount(0);await expect(page.locator('#stable')).toBeFocused();
 await page.keyboard.press('Enter');await page.keyboard.press('Space');await expect(page.locator('#count')).toHaveText('2');
 expect(await page.locator('#stable').evaluate(el=>el.getBoundingClientRect().width)).toBe(width);
 await page.locator('#toggle-busy').uncheck();await expect(page.locator('#stable canvas')).toHaveCount(1);
 await page.emulateMedia({reducedMotion:'reduce'});await expect(page.locator('#stable canvas')).toHaveCount(0);
 expect(await page.locator('#stable').evaluate(el=>getComputedStyle(el).transitionDuration)).toBe('0s');
 await page.emulateMedia({reducedMotion:'no-preference'});await expect(page.locator('#stable canvas')).toHaveCount(1);
 await page.evaluate(()=>document.documentElement.dataset.motion='reduced');await expect(page.locator('#stable canvas')).toHaveCount(0);
 await page.evaluate(()=>delete document.documentElement.dataset.motion);await expect(page.locator('#stable canvas')).toHaveCount(1);
 await page.emulateMedia({forcedColors:'active'});await expect(page.locator('#stable canvas')).toHaveCount(0);
 await page.emulateMedia({forcedColors:'none'});await expect(page.locator('#stable canvas')).toHaveCount(1);
 check('Original canvas changes over time; stable native node; Enter/Space; loading focus + no duplicate action/width shift; live OS/app reduced motion + forced colors stop engine');
 await page.locator('#button-playground').scrollIntoViewIfNeeded();await page.getByLabel('Star Border',{exact:true}).check();await expect(page.locator('#button-playground canvas')).toHaveCount(1);
 await page.getByLabel('Barva stopy',{exact:true}).fill('#ff3300');await page.locator('#button-duration').fill('1');
 await page.getByLabel('Disabled',{exact:true}).check();await expect(page.locator('#button-playground canvas')).toHaveCount(0);await expect(page.locator('#button-playground')).toBeDisabled();
 await page.getByLabel('Disabled',{exact:true}).uncheck();await page.getByLabel('Loading',{exact:true}).check();await expect(page.locator('#button-playground canvas')).toHaveCount(0);
 await page.getByLabel('Loading',{exact:true}).uncheck();
 await page.locator('#button-async').click();await expect(page.locator('#button-async')).toBeFocused();await expect(page.locator('#button-async')).toHaveAttribute('aria-busy','true');
 await expect(page.locator('.axo-button-showcase [role=status]')).toHaveText('Kontrola dokončena.');await expect(page.locator('#button-async')).toBeFocused();
 await page.getByRole('button',{name:'Uložit workspace',exact:true}).click();await expect(page.locator('.axo-button-showcase [role=status]')).toHaveText('Formulář odeslán: Můj workspace');
 check('Interactive color/duration, disabled/loading stop canvas, async focus restoration, native form submit');
 for(const width of [390,320]) {
  const mobile=await browser.newPage({viewport:{width,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
  mobile.on('pageerror',e=>report.errors.push(e.message));await mobile.goto(base+'scripts/button-lens-02/fixture.html');
  for(const theme of ['dark','light']) {
   await mobile.evaluate(t=>document.documentElement.dataset.theme=t,theme);
   expect(await mobile.locator('#primary-small').evaluate(el=>el.getBoundingClientRect().height)).toBe(44);
   expect(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
   await mobile.locator('#button-playground').tap();await expect(mobile.getByRole('status').last()).toHaveText('Akce byla aktivována.');
   if(width===390){await mobile.locator('.axo-button-showcase__heading').scrollIntoViewIfNeeded();await mobile.screenshot({path:`${out}/${theme}-mobile.png`});}
  }
  await mobile.evaluate(()=>document.documentElement.style.setProperty('--axolotl-text-scale','2'));
  expect(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  check(`${width}px touch: both themes, 44px small targets, activation and 200% text without horizontal overflow`);await mobile.close();
 }
 await page.goto(base+'app.html?catalog=buttons#design-system');await expect(page.locator('#button-playground')).toBeVisible();
 await expect(page.getByRole('banner',{name:'Ovládání Axolotlu'})).toBeVisible();
 await page.screenshot({path:`${out}/application-catalog.png`,fullPage:true});
 await page.getByRole('button',{name:'Světlý náhled',exact:true}).click();
 await expect(page.locator('html')).toHaveAttribute('data-theme','light');
 const secondary=page.locator('.axo-button-showcase__matrix [data-variant=secondary]').first();
 await expect(secondary).toHaveCSS('color','rgb(37, 37, 44)');
 await page.getByRole('button',{name:'Nastavení',exact:true}).click();await page.getByRole('button',{name:'Vzhled a prostředí',exact:true}).click();
 await page.getByRole('combobox',{name:'Velikost textu',exact:true}).click();await page.getByRole('option',{name:'Větší (115 %)',exact:true}).click();
 await expect(secondary).toHaveCSS('font-size','13.8px');
 await page.getByRole('combobox',{name:'Animace',exact:true}).click();await page.getByRole('option',{name:'Omezené',exact:true}).click();await page.keyboard.press('Escape');
 await expect(page.locator('.axo-button-showcase canvas')).toHaveCount(0);
 await page.screenshot({path:`${out}/application-light-115.png`,fullPage:true});
 await page.setViewportSize({width:390,height:844});await page.locator('.axo-button-showcase__heading').scrollIntoViewIfNeeded();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`${out}/application-mobile.png`});
 check('Actual catalog: unchanged AppHeader, real provider theme/text-size/motion through Radix Settings; 390px layout');
 expect(report.errors).toEqual([]);check('No browser runtime errors');
} finally {await writeFile(`${out}/verification.json`,JSON.stringify(report,null,2));await browser.close();}
