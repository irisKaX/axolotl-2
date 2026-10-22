// Contract coverage for nonredundant state combinations in both existing environments.
import assert from 'node:assert/strict';
import {launch,openCase,referenceCases} from './browser.mjs';
const base=process.argv[2];assert(base,'Library URL required');
const {browser}=await launch();let combinations=0;
try{
 for(const section of ['buttons','lens'])for(const theme of ['dark','light']){
  const item=referenceCases().find(c=>c.section===section&&c.state==='default'&&c.theme===theme&&c.viewport.width===1440);
  const {page,context}=await openCase(browser,base,item);
  try{
   const stage=page.locator('.axo-button-showcase__stage');
   const activation=page.getByRole('status',{name:'Počet aktivací'});
   for(const variant of ['primary','secondary','outline','ghost','icon','destructive','split'])for(const size of ['small','medium','large']){
    await page.locator(`input[name=button-variant][value=${variant}]`).check();
    await page.locator(`input[name=button-size][value=${size}]`).check();
    const button=stage.locator('#button-playground');
    assert.equal(await button.getAttribute('data-size'),size);
    assert((await button.getAttribute('aria-label'))||await button.innerText(),'Accessible action label');
    const box=await button.boundingBox();assert(box.width>0&&box.height>0);
    await button.hover();assert(await button.evaluate(e=>e.matches(':hover')));
    await page.mouse.down();assert(await button.evaluate(e=>e.matches(':active')));
    await page.mouse.move(0,0);await page.mouse.up();
    await page.keyboard.press('Shift');await button.focus();
    assert(await button.evaluate(e=>{const s=getComputedStyle(e);return e.matches(':focus-visible')&&s.outlineStyle!=='none'&&parseFloat(s.outlineWidth)>0;}),'Visible keyboard focus');
    const before=await activation.textContent();await button.press('Enter');assert.notEqual(await activation.textContent(),before,'Native keyboard activation');
    await page.getByRole('checkbox',{name:'Loading',exact:true}).check();
    assert.equal(await button.getAttribute('aria-busy'),'true');assert.equal(await button.getAttribute('aria-disabled'),'true');
    const busyCount=await activation.textContent();await button.dispatchEvent('click');assert.equal(await activation.textContent(),busyCount,'Loading blocks activation');
    const busyBox=await button.boundingBox();assert.equal(busyBox.width,box.width);assert.equal(busyBox.height,box.height);
    await page.getByRole('checkbox',{name:'Loading',exact:true}).uncheck();
    await page.getByRole('checkbox',{name:'Disabled',exact:true}).check();assert(await button.isDisabled());
    await button.dispatchEvent('click');assert.equal(await activation.textContent(),busyCount,'Disabled blocks activation');
    await page.getByRole('checkbox',{name:'Disabled',exact:true}).uncheck();
    if(variant==='split'){
     const trigger=stage.getByRole('button',{name:'Formát exportu'});
     await trigger.press('ArrowDown');await page.getByRole('menu',{name:'Formát exportu'}).waitFor();
     await page.waitForFunction(()=>document.activeElement?.getAttribute('role')==='menuitem');
     await page.keyboard.press('End');await page.waitForFunction(()=>document.activeElement?.textContent==='PNG');
     await page.keyboard.press('Escape');await page.waitForFunction(()=>document.activeElement?.getAttribute('aria-label')==='Formát exportu');
    }
    combinations++;
   }
   console.log('PASS 7 types × S/M/L × default/hover/pressed/focus/loading/disabled',section,theme);
  }finally{await context.close();}
 }
 assert.equal(combinations,84);
}finally{await browser.close();}
