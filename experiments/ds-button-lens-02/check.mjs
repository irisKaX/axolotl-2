import { chromium, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
const here=path.dirname(new URL(import.meta.url).pathname),out=path.join(here,'evidence');await mkdir(out,{recursive:true});
let server;
if(!process.env.BUTTON_PREVIEW_URL){server=createServer(async(req,res)=>{try{const file=new URL(req.url,'http://localhost').pathname;const target=path.resolve(here,'dist','.'+file+(file.endsWith('/')?'index.html':''));if(!target.startsWith(path.join(here,'dist')+path.sep))throw Error('path');res.setHeader('Content-Type',target.endsWith('.js')?'text/javascript':target.endsWith('.css')?'text/css':target.endsWith('.json')?'application/json':'text/html');res.end(await readFile(target));}catch{res.writeHead(404).end();}});await new Promise(r=>server.listen(4197,'127.0.0.1',r));}
const url=process.env.BUTTON_PREVIEW_URL||'http://127.0.0.1:4197/';
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROME_EXECUTABLE||undefined,args:['--no-sandbox']});
const checks=[],errors=[];const pass=name=>{checks.push(name);console.log('PASS',name);};
try{
 const context=await browser.newContext({viewport:{width:1366,height:768}}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url);await expect(page.locator('#button-playground')).toBeVisible();
 const provenance=await (await context.request.get(url+'provenance.json')).json();
 expect(provenance.component).toBe('src/design-system/Button');expect(provenance.implementationCommit).toBe('8b0bc17fdc381f7db76c750ffc67abcf54e3eb61');expect(provenance.actualSourceBundled).toBe(true);
 pass('Actual DS source provenance, pinned approved implementation');
 const button=page.locator('#button-playground');
 for(const theme of ['dark','light']){
  if(theme==='light')await page.locator('#preview-theme').click();await expect(page.locator('html')).toHaveAttribute('data-theme',theme);
  for(const variant of ['Primary','Secondary','Ghost','Icon','Destructive'])for(const size of ['small','medium','large']){
   await page.getByRole('radio',{name:variant,exact:true}).check();await page.getByRole('radio',{name:size,exact:true}).check();
   await expect(button).toHaveAttribute('data-variant',variant.toLowerCase());await expect(button).toHaveAttribute('data-size',size);
  }
  await page.getByRole('radio',{name:'Primary',exact:true}).check();await page.getByRole('radio',{name:'medium',exact:true}).check();
  await button.focus();await page.keyboard.press('Enter');await page.keyboard.press('Space');
  await expect(page.getByRole('status',{name:'Počet aktivací'})).toHaveText(theme==='dark'?'Aktivace: 2':'Aktivace: 4');
  expect(await button.evaluate(el=>el.matches(':focus-visible'))).toBe(true);
  await page.getByLabel('Star Border',{exact:true}).check();await expect(button.locator('canvas')).toHaveCount(1);await button.scrollIntoViewIfNeeded();
  const frame=await button.locator('canvas').evaluate(c=>c.toDataURL());await page.waitForTimeout(200);expect(await button.locator('canvas').evaluate(c=>c.toDataURL())).not.toBe(frame);
  await page.getByLabel('Barva stopy',{exact:true}).fill('#9966ff');await page.locator('#button-duration').fill('2');
  for(const state of ['Disabled','Loading']){await page.getByLabel(state,{exact:true}).check();await expect(button.locator('canvas')).toHaveCount(0);await expect(button).toHaveAttribute('aria-disabled','true');await page.getByLabel(state,{exact:true}).uncheck();}
  await page.getByLabel('Omezit pohyb',{exact:true}).check();await expect(button.locator('canvas')).toHaveCount(0);await page.getByLabel('Omezit pohyb',{exact:true}).uncheck();
  await page.emulateMedia({reducedMotion:'reduce'});await expect(button.locator('canvas')).toHaveCount(0);await page.emulateMedia({reducedMotion:'no-preference'});await expect(button.locator('canvas')).toHaveCount(1);
  const axe=await new AxeBuilder({page}).analyze();expect(axe.violations,JSON.stringify(axe.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})))).toEqual([]);
  await page.screenshot({path:path.join(out,theme+'-desktop.png'),fullPage:true});await page.getByLabel('Star Border',{exact:true}).uncheck();
  pass(theme+': 15 combinations, Enter/Space/focus, animated original canvas, controls, disabled/loading/reduced motion, axe 0 violations');
 }
 const mobile=await context.newPage();await mobile.setViewportSize({width:390,height:844});await mobile.goto(url);await mobile.getByLabel('Star Border',{exact:true}).check();await expect(mobile.locator('#button-playground canvas')).toHaveCount(1);
 expect(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await mobile.locator('#button-playground').click();await expect(mobile.getByRole('status',{name:'Počet aktivací'})).toHaveText('Aktivace: 1');
 await mobile.screenshot({path:path.join(out,'mobile.png')});pass('390px responsive playground, activation and canvas');expect(errors).toEqual([]);pass('No runtime errors');
 await writeFile(path.join(out,'verification.json'),JSON.stringify({url,checks,errors,provenance,browser:browser.version()},null,2));
}finally{await browser.close();if(server)await new Promise(r=>server.close(r));}
