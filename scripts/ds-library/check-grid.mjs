import { chromium, expect } from '@playwright/test';
(async()=>{
 const b=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROME_EXECUTABLE || undefined,headless:true});
 try {
 const p=await b.newPage({viewport:{width:1366,height:768},reducedMotion:'reduce'}),errors=[];
 p.on('pageerror',e=>errors.push(e.message));
 await p.goto(`${process.env.LIBRARY_URL || 'https://iriskax.github.io/axolotl-preview/ds-library-v1-1/'}?catalog=library&section=layout#design-system`);
 await p.locator('.dls-board').waitFor();
 await p.getByRole('button',{name:'Upravit Dashboard',exact:true}).click();
 const card=id=>p.locator(`[data-layout-item="${id}"]`);
 const geometry=()=>p.locator('[data-layout-item]').evaluateAll(es=>Object.fromEntries(es.map(e=>[e.dataset.layoutItem,{transform:e.style.transform,w:e.clientWidth,h:e.clientHeight}])));
 const collision=async()=>{
 const all=await p.locator('[data-layout-item]').evaluateAll(es=>es.map(e=>({id:e.dataset.layoutItem,...e.getBoundingClientRect().toJSON()})));
 for(let i=0;i<all.length;i++)for(let j=i+1;j<all.length;j++)expect(all[i].right<=all[j].left+1||all[j].right<=all[i].left+1||all[i].bottom<=all[j].top+1||all[j].bottom<=all[i].top+1).toBe(true);
 };
 const before=await geometry();
 await p.getByRole('switch',{name:'Skutečné UI widgetů'}).click();
 await expect(p.getByLabel('Hledaná fráze',{exact:true})).toBeVisible();
 expect(await geometry()).toEqual(before);
 await p.getByLabel('Hledaná fráze',{exact:true}).fill('Zachovat můj dotaz');
 async function drag(locator,dx,dy){
   await locator.evaluate(e=>window.scrollTo(0,window.scrollY+e.getBoundingClientRect().top-180));
   const r=await locator.boundingBox();
   await p.mouse.move(r.x+r.width/2,r.y+r.height/2);await p.mouse.down();await p.mouse.move(r.x+r.width/2+dx,r.y+r.height/2+dy,{steps:14});await p.mouse.up();
 }
 await drag(card('search-1').locator('.dls-drag'),0,380);
 const moved=await geometry();expect(moved['search-1'].transform).not.toBe(before['search-1'].transform);expect(moved.office).toEqual(before.office);
 await p.getByRole('switch',{name:'Skutečné UI widgetů'}).click();await p.getByRole('switch',{name:'Skutečné UI widgetů'}).click();
 expect(await geometry()).toEqual(moved);await expect(p.getByLabel('Hledaná fráze',{exact:true})).toHaveValue('Zachovat můj dotaz');
 await drag(card('search-1').locator('.dls-resize'),840,80);
 const resized=await geometry();expect(resized['search-1'].w).toBeGreaterThan(1200);expect(resized['search-1'].h).toBeGreaterThan(moved['search-1'].h);
 await collision();console.log('PASS real UI: stable geometry, drag, two-axis full-width resize, state retention');
 // Try dragging QR into the fixed Office. It must not overlap or move the Office.
 await drag(card('qr-2').locator('.dls-drag'),-420,80);
 await collision();expect((await geometry()).office).toEqual(before.office);console.log('PASS collision protection and fixed Office');
 for(const name of ['Obecný widget S · kompaktní','Obecný widget S · kompaktní','Obecný widget L · širší']){
  await p.getByRole('button',{name:'Přidat widget',exact:true}).click();await p.getByRole('button',{name,exact:true}).click();
 }
 async function setPosition(id,values){
   await card(id).getByRole('button',{name:/Poloha a velikost/}).click();
   const panel=p.locator('.dls-inspector');
   for(const [label,value] of values){const input=panel.getByLabel(label,{exact:true});await input.fill(String(value));}
   await panel.getByRole('button',{name:'Použít',exact:true}).click();
   await panel.getByRole('button',{name:'Zavřít ovládání'}).click();
 }
 await setPosition('generic-5',[['Řádek',50],['Sloupec',0],['Šířka',12],['Výška',16]]);
 await setPosition('generic-3',[['Řádek',50],['Sloupec',12],['Šířka',4],['Výška',8]]);
 await setPosition('generic-4',[['Řádek',58],['Sloupec',12],['Šířka',4],['Výška',8]]);
 await collision();
 const rects=await p.locator('[data-layout-item^="generic"]').evaluateAll(es=>es.map(e=>({id:e.dataset.layoutItem,...e.getBoundingClientRect().toJSON()})));
 const large=rects.find(x=>x.id==='generic-5'),small1=rects.find(x=>x.id==='generic-3'),small2=rects.find(x=>x.id==='generic-4');
 expect(Math.abs(large.y-small1.y)).toBeLessThan(1);expect(Math.abs(small2.y-small1.bottom-8)).toBeLessThan(1);expect(small1.x).toBeGreaterThan(large.right);
 // Keyboard alternative and read mode lock.
 await card('generic-4').locator('.dls-drag').focus();await p.keyboard.press('ArrowDown');
 const desktop=await geometry();
 await p.getByRole('button',{name:'Hotovo',exact:true}).click();await expect(p.locator('.dls-drag')).toHaveCount(0);
 expect(await geometry()).toEqual(desktop);
 await p.setViewportSize({width:390,height:844});await expect(p.locator('.dls-board')).toHaveAttribute('data-columns','4');
 await collision();expect(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await p.setViewportSize({width:1366,height:768});await expect(p.locator('.dls-board')).toHaveAttribute('data-columns','24');expect(await geometry()).toEqual(desktop);
 await p.getByRole('button',{name:'Světlý náhled knihovny',exact:true}).click();await collision();

 expect(errors).toEqual([]);console.log('PASS add, asymmetric packing, keyboard, read-mode lock, mobile overflow, desktop restoration, light theme');
 await p.getByRole('button',{name:'Upravit Dashboard',exact:true}).click();await p.getByRole('button',{name:'Obnovit výchozí',exact:true}).click();
 await expect(p.locator('[data-layout-item]')).toHaveCount(3);await expect(p.getByRole('button',{name:'Notebook',exact:true})).toBeVisible();
 console.log('PASS reset and persistent Notebook access');
 } finally {await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
