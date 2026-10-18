// Run in GitHub Actions. Screenshots and JSON are review evidence, not Safari/device certification.
import {chromium} from 'playwright';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const folder=path.dirname(new URL(import.meta.url).pathname),root=path.join(folder,'dist'),evidence=path.join(folder,'evidence');
await fs.mkdir(evidence,{recursive:true});
const server=http.createServer(async(req,res)=>{try{const p=path.join(root,path.basename(new URL(req.url,'http://localhost').pathname)||'index.html');res.setHeader('Content-Type','text/html; charset=utf-8');res.end(await fs.readFile(p));}catch{res.writeHead(404);res.end();}});
await new Promise(resolve=>server.listen(4188,'127.0.0.1',resolve));
const browser=await chromium.launch({headless:true});
const results=[],errors=[],headers={};
try{for(const direction of ['aperture','atelier','float']){
 const page=await browser.newPage({viewport:{width:1366,height:768},reducedMotion:'reduce'});
 page.on('pageerror',e=>errors.push({direction,message:e.message}));
 await page.goto(`http://127.0.0.1:4188/${direction}.html`);
 const frame=page.frameLocator('iframe[title="Živý náhled produkčního Selectu"]');
 const select=frame.getByRole('combobox');await select.waitFor();
 await select.click();await frame.getByRole('option',{name:'SVG',exact:true}).click();
 await page.getByText('value: "svg"',{exact:true}).waitFor();results.push(`${direction}: real Select selection and event channel`);
 await select.focus();await page.keyboard.press('ArrowDown');await frame.getByRole('listbox').waitFor();await page.keyboard.press('Escape');assert.equal(await frame.getByRole('listbox').count(),0);results.push(`${direction}: keyboard open and Escape`);
 await page.locator('#scenario').selectOption('disabled');assert.equal(await select.isDisabled(),true);
 await page.locator('#scenario').selectOption('disabled-option');await select.click();assert.equal(await frame.getByRole('option',{name:'SVG',exact:true}).getAttribute('data-disabled'),'');await page.keyboard.press('Escape');results.push(`${direction}: disabled control and disabled option`);
 await page.locator('#scenario').selectOption('error');assert.equal(await select.getAttribute('aria-invalid'),'true');await page.getByRole('button',{name:'Obnovit výchozí stav'}).click();await select.waitFor();results.push(`${direction}: Field error and reset`);
 await page.getByRole('combobox',{name:'Šířka náhledu'}).selectOption('768');assert.equal(Math.round((await page.locator('iframe').boundingBox()).width),768);await page.getByRole('combobox',{name:'Šířka náhledu'}).selectOption('available');results.push(`${direction}: real iframe viewport`);
 const before=(await page.locator('.lc-main').boundingBox()).width;await page.getByRole('button',{name:'Skrýt vlastnosti'}).click();assert.equal(await page.locator('#properties-panel').count(),0);assert.ok((await page.locator('.lc-main').boundingBox()).width>before+150);await page.getByRole('button',{name:'Zobrazit vlastnosti'}).click();results.push(`${direction}: properties collapse and restore`);
 for(const category of ['Základy','Vzory','Experimenty','Komponenty']){await page.getByRole('button',{name:category,exact:true}).click();}
 await page.getByRole('heading',{name:'Select.',exact:true}).waitFor();await page.getByRole('textbox',{name:'Hledat v katalogu'}).fill('výběr');await page.locator('.lc-results').getByRole('button').click();results.push(`${direction}: all categories and search`);
 await page.getByRole('button',{name:'Vzory',exact:true}).click();await page.goBack();await page.getByRole('heading',{name:'Select.',exact:true}).waitFor();results.push(`${direction}: browser history`);
 for(const light of [false,true]){
  await page.getByRole('checkbox',{name:'Tmavý režim',exact:true}).setChecked(!light);
  await page.getByRole('button',{name:light?'Světlý náhled':'Tmavý náhled',exact:true}).click();
  await page.waitForTimeout(250);
  const header=await page.locator('header[aria-label="Ovládání Axolotlu"]').evaluate(el=>{const s=getComputedStyle(el);const b=el.getBoundingClientRect();return {height:b.height,top:b.top,left:b.left,width:b.width,background:s.background,borderRadius:s.borderRadius,font:s.font,shadow:s.boxShadow};});
  headers[`${direction}-${light?'light':'dark'}`]=header;
  await select.click();await page.screenshot({path:path.join(evidence,`${direction}-1366-${light?'light':'dark'}.png`),fullPage:true});await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 }
 results.push(`${direction}: dark/light, no horizontal page overflow`);
 await page.setViewportSize({width:1920,height:1080});await page.screenshot({path:path.join(evidence,`${direction}-1920.png`),fullPage:true});
 await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'Otevřít knihovnu'}).click();await page.getByRole('button',{name:'Základy',exact:true}).click();await page.getByRole('button',{name:'Otevřít knihovnu'}).click();await page.getByRole('button',{name:'Komponenty',exact:true}).click();await select.click();await frame.getByRole('option',{name:'WebP',exact:true}).click();
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.getByRole('button',{name:'Otevřít navigaci',exact:true}).click();await page.getByRole('navigation',{name:'Kompaktní navigace'}).waitFor();await page.keyboard.press('Escape');
 await page.screenshot({path:path.join(evidence,`${direction}-390.png`),fullPage:true});results.push(`${direction}: mobile library, Select, header overlay and no overflow`);
 await page.close();
}
for(const theme of ['dark','light']){assert.deepEqual(headers[`aperture-${theme}`],headers[`atelier-${theme}`]);assert.deepEqual(headers[`aperture-${theme}`],headers[`float-${theme}`]);}results.push('Header computed styles and geometry identical across all 3 directions in both themes');
assert.deepEqual(errors,[]);results.push('No browser runtime errors');
await fs.writeFile(path.join(evidence,'report.json'),JSON.stringify({engine:'Chromium (GitHub Actions)',viewports:['1366×768','1920×1080','390×844'],passed:results.length,results,errors,headers},null,2));console.log(JSON.stringify({passed:results.length,results},null,2));
}catch(error){await fs.writeFile(path.join(evidence,'failure.txt'),String(error.stack));for(const context of browser.contexts())for(const page of context.pages())await page.screenshot({path:path.join(evidence,'failure.png'),fullPage:true}).catch(()=>{});throw error;}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
