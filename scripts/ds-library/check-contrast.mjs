// Browser regression gate for the actual registry, including lazy content and portals.
// No contrast waivers: disabled controls are exempt; loading controls are not.
import assert from 'node:assert/strict';
import { existsSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
const base = process.env.LIBRARY_URL || 'http://127.0.0.1:4185/axolotl-preview/ds-library-v1-1/';
const browser = await chromium.launch({executablePath: process.env.PLAYWRIGHT_CHROME_EXECUTABLE || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined)});
const context = await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
const page = await context.newPage();
const failures=[], coverage=[], errors=[];
page.on('pageerror', e=>errors.push(e.message));
const record=(ok,message,data)=>{if(!ok)failures.push({message,data});};
const choose=async(label,value)=>{await page.getByRole('combobox',{name:label,exact:true}).click();await page.getByRole('option',{name:value,exact:true}).click();};
async function ready(){await page.locator('.ds-catalog h1').waitFor();await page.getByText('Načítám komponenty…',{exact:true}).waitFor({state:'hidden'});await page.evaluate(()=>document.fonts.ready);}
async function audit(label,selector){let builder=new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']);if(selector)builder=builder.include(selector);const r=await builder.analyze();for(const v of r.violations)failures.push({message:label+' '+v.id,nodes:v.nodes.map(n=>({target:n.target,reason:n.failureSummary}))});coverage.push(label);}
// Browser canvas resolves OKLCH to rendered sRGB. Composite transparent ancestors;
// gradients are measured separately from screenshots, never by averaging stops.
async function measure(locator,{property='color',pseudo=null,background='self',against=null,minimum=4.5,label='text'}={}){
 if(!await locator.isVisible())return;
 const data=await locator.evaluate((el,{property,pseudo,background,against})=>{
  const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');canvas.width=canvas.height=1;
  const rgba=value=>{ctx.clearRect(0,0,1,1);ctx.fillStyle=value;ctx.fillRect(0,0,1,1);return [...ctx.getImageData(0,0,1,1).data].map((n,i)=>i===3?n/255:n);};
  const over=(a,b)=>{const alpha=a[3]+b[3]*(1-a[3]);return a.slice(0,3).map((n,i)=>alpha?(n*a[3]+b[i]*b[3]*(1-a[3]))/alpha:0).concat(alpha);};
  const lum=c=>c.slice(0,3).map(n=>n/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4).reduce((s,n,i)=>s+n*[.2126,.7152,.0722][i],0);
  const s=getComputedStyle(el,pseudo),chain=[];let skip=false,gradient=false;
  for(let node=background==='parent'?el.parentElement:el;node;node=node.parentElement){const cs=getComputedStyle(node);if(cs.visibility==='hidden'||+cs.opacity===0)skip=true;if(node.matches(':disabled,[aria-disabled=true],[data-disabled]')&&!node.matches('[aria-busy=true],[data-loading]'))skip=true;chain.push({color:rgba(cs.backgroundColor),opacity:+cs.opacity});if(cs.backgroundImage!=='none')gradient=true;}
  const render=pixel=>{for(const layer of chain){pixel=over(pixel,layer.color);pixel[3]*=layer.opacity;}return over(pixel,[255,255,255,1]);};
  let bg=render([0,0,0,0]);
  if(against)bg=rgba(s.getPropertyValue(against));
  const ink=rgba(property.startsWith('--')?s.getPropertyValue(property):s[property]);
  const fg=against?over(ink,bg):render(ink),a=lum(fg),b=lum(bg);
  return {ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05),fg:s[property],bg,skip,gradient,outline:s.outlineStyle,width:s.outlineWidth,text:el.textContent?.trim().slice(0,60)};
 },{property,pseudo,background,against});
 if(!data.skip&&!data.gradient)record(data.ratio>=minimum,label,data);
 return data;
}
async function textAndIcons(root,label){
 const leaves=root.locator(':scope, *');
 for(let i=0;i<await leaves.count();i++){
  const el=leaves.nth(i);
  const kind=await el.evaluate(e=>{const s=getComputedStyle(e);if(e.closest('svg')&&!e.matches('svg'))return '';if(s.display==='none'||s.visibility==='hidden')return '';if(e.matches('svg')&&e.closest('button,a,[role=option]'))return 'icon';if([...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()))return 'text';if(e.matches('textarea,input:not([type=range]):not([type=checkbox]):not([type=radio])')&&e.value)return 'text';return '';});
  if(kind)await measure(el,{minimum:kind==='icon'?3:4.5,label:label+' '+kind});
 }
}
async function interactions(selector,label){
 const ids=await page.locator(selector).evaluateAll(elements=>elements.map((el,i)=>{el.dataset.contrastTarget=String(i);return String(i);}));const seen=new Set();
 for(const id of ids){
  const el=page.locator(`[data-contrast-target="${id}"]`);if(!await el.count())continue;if(!await el.isVisible()||await el.isDisabled())continue;
  const key=await el.evaluate(e=>[e.tagName,e.className,e.getAttribute('data-variant'),e.getAttribute('data-size'),e.getAttribute('aria-pressed'),e.getAttribute('aria-selected'),e.getAttribute('type')].join('|'));
  if(seen.has(key))continue;seen.add(key);
  await textAndIcons(el,label+' default '+key);
  await el.hover();await textAndIcons(el,label+' hover '+key);
  await page.mouse.down();await textAndIcons(el,label+' active '+key);await page.mouse.move(0,0);await page.mouse.up();
  await page.keyboard.press('Shift');if(!await el.count())continue;await el.focus();
  const focus=await el.evaluate(e=>{let target=e;if(e.matches('.ds-switch input,.ds-segmented input'))target=e.nextElementSibling;const s=getComputedStyle(target);target.dataset.contrastFocus='true';return {visible:e.matches(':focus-visible'),outline:s.outlineStyle,width:parseFloat(s.outlineWidth),shadow:s.boxShadow,background:parseFloat(s.outlineOffset)<0?'self':'parent'};});
  record(focus.visible,label+' keyboard focus-visible '+key);
  record((focus.outline!=='none'&&focus.width>0)||focus.shadow!=='none',label+' visible focus indicator '+key);
  if(focus.visible&&focus.outline!=='none'&&focus.width>0)await measure(page.locator('[data-contrast-focus]'),{property:'outlineColor',background:focus.background,minimum:3,label:label+' focus'});
  await page.locator('[data-contrast-focus]').evaluateAll(nodes=>nodes.forEach(e=>delete e.dataset.contrastFocus));
 }
 await page.mouse.move(0,0);await page.locator('[data-contrast-target]').evaluateAll(elements=>elements.forEach(el=>delete el.dataset.contrastTarget));
}
// Sample the real composited gradient/overlay behind the label with its glyphs
// temporarily hidden. This preserves gradients, backing plates and alpha layers.
async function rasterContrast(locator,label){
 await locator.scrollIntoViewIfNeeded();
 const {foreground,rects}=await locator.evaluate(el=>{const c=document.createElement('canvas').getContext('2d');c.fillStyle=getComputedStyle(el).color;c.fillRect(0,0,1,1);const box=el.getBoundingClientRect(),rects=[],walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);while(walker.nextNode()){if(!walker.currentNode.textContent.trim())continue;const r=document.createRange();r.selectNodeContents(walker.currentNode);for(const b of r.getClientRects())rects.push({x:b.x-box.x,y:b.y-box.y,width:b.width,height:b.height});}return {foreground:[...c.getImageData(0,0,1,1).data].slice(0,3),rects};});
 const styles=await locator.evaluate(el=>[el,...el.querySelectorAll('*')].map(node=>{const old=node.getAttribute('style');node.style.setProperty('color','transparent','important');node.style.setProperty('-webkit-text-fill-color','transparent','important');node.style.setProperty('text-shadow','none','important');return old;}));
 let screenshot;
 try{screenshot=await locator.screenshot({animations:'disabled'});}finally{await locator.evaluate((el,styles)=>[el,...el.querySelectorAll('*')].forEach((node,i)=>styles[i]===null?node.removeAttribute('style'):node.setAttribute('style',styles[i])),styles);}
 const minimum=await page.evaluate(async({png,foreground,rects})=>{
  const bitmap=await createImageBitmap(await (await fetch('data:image/png;base64,'+png)).blob());const c=document.createElement('canvas');c.width=bitmap.width;c.height=bitmap.height;const ctx=c.getContext('2d');ctx.drawImage(bitmap,0,0);const data=ctx.getImageData(0,0,c.width,c.height).data;
  const lum=rgb=>rgb.map(n=>n/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4).reduce((s,n,i)=>s+n*[.2126,.7152,.0722][i],0),fg=lum(foreground);let minimum=21;
  for(const r of rects)for(let y=Math.max(0,Math.ceil(r.y));y<Math.min(c.height,r.y+r.height);y+=2)for(let x=Math.max(0,Math.ceil(r.x));x<Math.min(c.width,r.x+r.width);x+=2){const i=(y*c.width+x)*4,bg=lum([data[i],data[i+1],data[i+2]]);minimum=Math.min(minimum,(Math.max(bg,fg)+.05)/(Math.min(bg,fg)+.05));}return minimum;
 },{png:screenshot.toString('base64'),foreground,rects});
 record(minimum>=4.5,label+' composited gradient',{minimum,foreground});
}
async function nativeBoundary(locator,label){
 const png=await locator.screenshot({animations:'disabled'});
 const contrast=await page.evaluate(async png=>{
  const bitmap=await createImageBitmap(await(await fetch('data:image/png;base64,'+png)).blob()),c=document.createElement('canvas');c.width=bitmap.width;c.height=bitmap.height;const ctx=c.getContext('2d');ctx.drawImage(bitmap,0,0);
  const lum=rgb=>rgb.slice(0,3).map(n=>n/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4).reduce((s,n,i)=>s+n*[.2126,.7152,.0722][i],0),bg=lum([...ctx.getImageData(0,0,1,1).data]);let strongest=1;
  // Radio's outer stroke; range's unfilled track at 90%, away from the thumb.
  const x=c.width>100?Math.round(c.width*.9):2;
  for(let y=0;y<c.height;y++){const fg=lum([...ctx.getImageData(x,y,1,1).data]);strongest=Math.max(strongest,(Math.max(bg,fg)+.05)/(Math.min(bg,fg)+.05));}return strongest;
 },png.toString('base64'));
 record(contrast>=3,label+' native boundary',{contrast});
}
async function components(){const select=page.getByRole('combobox',{name:'Komponenta',exact:true});if(!await select.count())return [];await select.click();const names=await page.getByRole('option').allTextContents();await page.keyboard.press('Escape');return names;}
try{
 await page.goto(base+'#design-system');await ready();
 const sections=await page.locator('.ds-catalog a').evaluateAll(links=>[...new Set(links.map(a=>new URL(a.href).searchParams.get('section')).filter(Boolean))]);
 record(sections.length>=11,'All registered categories must be discovered',sections);
 for(const mode of ['light','dark']){
  for(const section of (process.env.CONTRAST_SECTIONS?process.env.CONTRAST_SECTIONS.split(','):['',...sections])){
   await page.goto(base+(section?'?section='+section:'')+'#design-system');await ready();await page.evaluate(m=>window.axolotlPreferences.set('theme',m),mode);
   const label=mode+'/'+(section||'overview');await audit(label);
   if(!section){
    const scope=page.locator('.ds-catalog');
    for(const surface of ['--background','--card','--popover','--secondary','--muted']){
     await measure(scope,{property:'--input',against:surface,minimum:3,label:label+' input boundary on '+surface});
     await measure(scope,{property:'--ring',against:surface,minimum:3,label:label+' external focus on '+surface});
     await measure(scope,{property:'--muted-foreground',against:surface,label:label+' helper text on '+surface});
    }
    await measure(scope,{property:'--ds-progress',against:'--muted',minimum:3,label:label+' progress fill'});
   }
   if(['brand','foundations'].includes(section))await interactions('.ds-catalog a',label+' links');

   // Real controls in each family, not copies in the test harness.
   if(section==='buttons'){
    await interactions('.axo-button-showcase__matrix .axo-ds-button',label);
    for(const variant of ['primary','secondary','outline','ghost','icon','destructive','split']){
     await page.locator(`input[name=button-variant][value=${variant}]`).check();
     const beforeLoading=await page.locator('#button-playground').boundingBox();
     await page.getByRole('checkbox',{name:'Loading',exact:true}).check();
     const duringLoading=await page.locator('#button-playground').boundingBox();
     record(beforeLoading.width===duringLoading.width && beforeLoading.height===duringLoading.height,label+' '+variant+' stable loading size');
     await textAndIcons(page.locator('.axo-button-showcase__stage'),label+' '+variant+' loading');
     await page.getByRole('checkbox',{name:'Loading',exact:true}).uncheck();
     await page.getByRole('checkbox',{name:'Disabled',exact:true}).check();
     record(await page.locator('.axo-button-showcase__stage .axo-ds-button').first().isDisabled(),label+' disabled');
     await page.getByRole('checkbox',{name:'Disabled',exact:true}).uncheck();
    }
    const trigger=page.locator('.axo-button-showcase__stage [data-split-part=menu]');
    await trigger.focus();await page.keyboard.press('ArrowDown');
    await page.getByRole('menuitem',{name:'CSV',exact:true}).waitFor();
    record(await page.getByRole('menuitem',{name:'CSV',exact:true}).evaluate(el=>el===document.activeElement),label+' split initial focus');
    await audit(label+' split open','.axo-ds-split-menu');
    await interactions('.axo-ds-split-menu [role=menuitem]',label+' split menu');
    await page.keyboard.press('Home');await page.keyboard.press('ArrowDown');
    record(await page.getByRole('menuitem',{name:'XLSX',exact:true}).evaluate(el=>el===document.activeElement),label+' split arrow navigation');
    await page.keyboard.press('End');await page.keyboard.press('Enter');
    record(await page.getByRole('status').filter({hasText:'Ukázkový export: PNG'}).count()===1,label+' split action');
    record(await trigger.evaluate(el=>el===document.activeElement),label+' split returns focus');
    await trigger.click();await page.getByRole('menuitem',{name:'CSV',exact:true}).waitFor();await page.keyboard.press('Escape');
    record(await page.getByRole('menu').count()===0,label+' split Escape');
    await trigger.click();await page.getByRole('menuitem',{name:'CSV',exact:true}).waitFor();await page.keyboard.press('Tab');
    record(await page.getByRole('menu').count()===0,label+' split Tab leaves menu');
   }
   for(const name of await components()){
    await choose('Komponenta',name);await audit(label+'/'+name,'.ds-catalog-playground');
    await interactions('.ds-catalog-playground :is(button,input,textarea,summary):not([type=hidden])',label+'/'+name);
    if(section==='forms'){
     const demo=page.locator('[data-demo=form]');
     if(await page.getByRole('combobox',{name:'Velikost',exact:true}).count())for(const size of ['small','medium','large']){await choose('Velikost',size);await textAndIcons(demo,label+'/'+name+'/'+size);}

     for(const input of await demo.locator('.ds-input,.ax-checkbox,.ds-switch-track').all())await measure(input,{property:'borderTopColor',minimum:3,label:label+'/'+name+' boundary'});
     if(name==='Input'||name==='Textarea'){const input=demo.locator('input,textarea');await input.fill('');await measure(input,{pseudo:'::placeholder',label:label+' placeholder'});await input.fill('Axolotl');}
     if(name==='Select'){await demo.getByRole('combobox').click();await audit(label+' open select','.ds-select-menu');await interactions('.ds-select-item:not([data-disabled])',label+' options');await page.keyboard.press('Escape');}
     if(name==='Checkbox'){await demo.getByRole('checkbox').check();await textAndIcons(demo,label+' checked');await page.getByRole('button',{name:'Nastavit indeterminate'}).click();await textAndIcons(demo,label+' indeterminate');}
     if(name==='Radio'){await nativeBoundary(demo.getByRole('radio',{name:'Tools',exact:true}),label+' radio');await demo.getByRole('radio',{name:'Tools',exact:true}).check();}
     if(name==='Switch'){await demo.getByRole('switch').check();await measure(demo.locator('.ds-switch-track'),{property:'backgroundColor',pseudo:'::before',minimum:3,label:label+' checked thumb'});}
     if(name==='Slider'){await nativeBoundary(demo.getByRole('slider'),label+' slider');await demo.getByRole('slider').focus();await page.keyboard.press('ArrowRight');}
     await page.getByRole('switch',{name:'Invalid',exact:true}).check();await audit(label+'/'+name+' error','.ds-catalog-playground');await page.getByRole('switch',{name:'Invalid',exact:true}).uncheck();
     await page.getByRole('switch',{name:'Disabled',exact:true}).check();record(await demo.locator('input,textarea,button').first().isDisabled(),label+'/'+name+' disabled');await page.getByRole('switch',{name:'Disabled',exact:true}).uncheck();
    }
    if(section==='overlays'){
     const names={'Dialog':'Otevřít dialog','Confirmation Dialog':'Otevřít potvrzení','Popover':'Otevřít popover','Tooltip':'Zobrazit nápovědu'};
     const trigger=page.getByRole('button',{name:names[name],exact:true});
     if(name==='Tooltip')await trigger.hover();else await trigger.click();
     await page.locator('.ds-dialog,.ds-popover,[role=tooltip]').last().waitFor();await audit(label+'/'+name+' open');
     if(name!=='Tooltip')await interactions('.ds-dialog button,.ds-popover button',label+'/'+name+' open');
     await page.keyboard.press('Escape');await page.mouse.move(0,0);
    }
    if(section==='feedback'&&['Badge','Status','Alert'].includes(name))for(const tone of ['Připraveno','Kontrola dokončena','Vyžaduje pozornost','Kontrola selhala']){await choose('Význam',tone);await audit(label+'/'+name+'/'+tone,'.ds-catalog-playground');}
    if(section==='widgets'){
     const stage=page.locator('.ds-catalog-stage');
     if(await stage.locator('[data-widget=search]').count()){
      for(const [scenario,result] of [['Dokončeno','Demo: dokončeno'],['Dokončeno s omezením','Demo: dokončeno s omezením'],['Chyba přístupu','Demo: hledání se nezdařilo']]){
       await choose('Demo scénář',scenario);await stage.getByRole('textbox').fill('Axolotl');await stage.getByRole('button',{name:'Hledat',exact:true}).click();
       record(await stage.locator('button[aria-busy=true]').count()>0,label+' search loading');await textAndIcons(stage,label+' widget loading');
       await stage.getByText(result,{exact:true}).waitFor();await audit(label+' search '+scenario,'.ds-catalog-stage');
      }
     }else{
      await stage.getByRole('textbox').fill('javascript:alert(1)');await stage.getByRole('button',{name:'Vytvořit QR',exact:true}).click();await stage.locator('[aria-invalid=true]').waitFor();await audit(label+' QR invalid','.ds-catalog-stage');
      await stage.getByRole('textbox').fill('https://example.cz');await stage.getByRole('button',{name:'Vytvořit QR',exact:true}).click();await stage.locator('canvas').waitFor();await audit(label+' QR success','.ds-catalog-stage');await interactions('.ds-catalog-stage button',label+' QR actions');
     }
    }
    if(section==='navigation'){
     const demo=page.locator('.ds-catalog-playground .ds-catalog-wide-demo');
     if(name==='Tabs'){await demo.getByRole('tab',{name:'Detaily',exact:true}).click();await audit(label+' selected tab','.ds-catalog-playground');}
     if(name==='Segmented Control'){await demo.getByRole('radio',{name:'Detaily',exact:true}).check();await audit(label+' selected segment','.ds-catalog-playground');const segment=demo.locator('input:checked + span');record(await segment.evaluate(el=>getComputedStyle(el).boxShadow!=='none'),label+' selected segment marker');await measure(segment,{against:'--primary',minimum:3,label:label+' selection marker on primary'});const fill=await measure(segment,{property:'backgroundColor',against:'--muted',minimum:0});if(fill.ratio<3)await measure(segment,{against:'--muted',minimum:3,label:label+' selection marker on muted'});}
     if(name==='Disclosure'){await demo.locator('summary').click();await audit(label+' disclosure open','.ds-catalog-playground');}
     if(name==='Pagination'){await page.getByRole('slider',{name:'Počet stránek',exact:true}).focus();await page.keyboard.press('End');await demo.getByRole('button',{name:'Stránka 2',exact:true}).click();await audit(label+' page selected','.ds-catalog-playground');}
    }
   }
   if(section==='forms'){
    await page.getByRole('button',{name:'Uložit formulář',exact:true}).click();await audit(label+' validation');
    await page.getByRole('textbox',{name:'E-mail',exact:true}).fill('iris@example.cz');await page.getByRole('checkbox',{name:'Souhlasím s uložením ukázky',exact:true}).check();await page.getByRole('button',{name:'Uložit formulář',exact:true}).click();await audit(label+' success');
   }
   if(section==='surfaces'){
    for(const state of ['empty','loading','error','warning','success']){await choose('Stav ukázkových karet',state);await audit(label+'/'+state,'.ds-surface-examples');}
    const studio=page.getByRole('region',{name:'Halo Soft v kontextu',exact:true});
    await studio.getByRole('button',{name:'Uložit poznámku',exact:true}).click();await interactions('.ds-surface-examples [aria-pressed=true]',label+' pressed');
    const card=studio.locator('.ds-interactive-card');await card.click();await card.hover();await textAndIcons(card,label+' selected card');
    await studio.getByRole('switch',{name:'Načítání akcí',exact:true}).check();await textAndIcons(studio,label+' loading surfaces');
    await studio.getByRole('switch',{name:'Načítání akcí',exact:true}).uncheck();
    await studio.getByRole('switch',{name:'Neaktivní akce',exact:true}).check();record(await card.isDisabled(),label+' disabled card');await studio.getByRole('switch',{name:'Neaktivní akce',exact:true}).uncheck();
   }
   if(section==='colors'){
    const ids=await page.locator('.ds-color-sample').evaluateAll(nodes=>nodes.map(n=>n.dataset.paintId));
    for(const id of ids){
     await page.locator(`[data-paint-id="${id}"] .ds-color-swatch`).click();
     for(const labelNode of await page.locator('.ds-paint-button .axo-ds-button__label,.ds-paint-card h3,.ds-paint-text').all())await rasterContrast(labelNode,label+'/'+id);
     await page.locator('.ds-paint-button').hover();await rasterContrast(page.locator('.ds-paint-button .axo-ds-button__label'),label+'/'+id+' hover');
    }
    await audit(label+' creative surfaces');
   }
   if(section==='dashboard'){
    await page.locator('#approved-header header').waitFor();
    for(const title of ['Média','Nastavení','Upozornění']){
     await page.getByRole('button',{name:title,exact:true}).click();await page.locator('[data-header-panel]').waitFor();await audit(label+'/'+title+' open');
     await interactions('[data-header-panel] :is(button,a)',label+'/'+title);
     if(title==='Nastavení'){
      for(const view of ['Vzhled a prostředí','Integrace','O aplikaci']){
       await page.getByRole('button',{name:view,exact:true}).click();await audit(label+' settings '+view);
       for(const trigger of await page.locator('[data-header-select-trigger]').all()){
        await measure(trigger,{property:'borderTopColor',minimum:3,label:label+' header field boundary'});
        await trigger.click();await page.locator('[data-header-select]').waitFor();await audit(label+' header select');await interactions('[data-header-select] [role=option]',label+' header option');await page.keyboard.press('Escape');
       }
       await page.getByRole('button',{name:'Zpět do nastavení',exact:true}).click();
      }
     }
     await page.keyboard.press('Escape');
    }
    await page.getByRole('button',{name:'Média',exact:true}).click();await page.getByRole('link',{name:'QR',exact:true}).click();
    await page.getByRole('button',{name:'Média',exact:true}).click();
    const current=page.locator('[data-header-panel] [aria-current=page]');await current.waitFor();
    await textAndIcons(current,label+' header selected');await current.hover();await textAndIcons(current,label+' header selected hover');
    record(await current.evaluate(el=>{const cs=getComputedStyle(el);const probe=document.createElement('span');probe.style.backgroundColor='var(--primary)';el.append(probe);const primary=getComputedStyle(probe).backgroundColor;probe.remove();return cs.backgroundColor===primary&&[...el.children].some(child=>child.textContent==='✓'&&getComputedStyle(child).display!=='none');}),label+' Header selection must retain primary fill and check');
    await page.keyboard.press('Escape');
    for(const widget of await page.locator('.ds-bento-cell').all()){await widget.hover();await rasterContrast(widget.locator('h2'),label+' widget hover');}
    record(await page.locator('.ds-bento-cell').count()===7,label+' bento geometry');
    await page.screenshot({path:`/tmp/contrast-dashboard-${mode}.png`,fullPage:true});
    await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'Otevřít navigaci',exact:true}).click();await page.getByRole('button',{name:'Média',exact:true}).click();await audit(label+' mobile menu');await textAndIcons(page.locator('[data-header-panel]'),label+' mobile menu');await page.keyboard.press('Escape');
    await page.setViewportSize({width:1440,height:1000});
   }
   for(const summary of await page.locator('.ds-catalog-api details > summary').all())await summary.click();
   if(await page.locator('.ds-catalog-api details').count())await audit(label+' expanded API');
   writeFileSync('/tmp/axolotl-contrast-results.json',JSON.stringify({coverage,failures},null,2));console.log('Checked',label,'failures:',failures.length);
  }
 }
 record(errors.length===0,'Browser runtime errors',errors);
}finally{writeFileSync('/tmp/axolotl-contrast-results.json',JSON.stringify({coverage,failures},null,2));await browser.close();}
assert.deepEqual(failures,[],JSON.stringify(failures,null,2));
console.log(`PASS: ${coverage.length} real component/state audits in light and dark, plus rendered hover/active/icon/focus/boundary checks.`);
