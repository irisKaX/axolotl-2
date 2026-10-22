import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {sha256} from './contract.mjs';
const require=createRequire(import.meta.url);
export const viewports=[[320,800],[390,844],[768,1024],[1180,820],[1366,768],[1440,900]];
export const purple='oklch(0.5547 0.2503 297.0156)';
export async function launch(){
 const executablePath=process.env.PLAYWRIGHT_CHROME_EXECUTABLE||(existsSync('/usr/lib/chromium/chromium')?'/usr/lib/chromium/chromium':chromium.executablePath());
 const fontConfig=fileURLToPath(new URL('./fonts.conf',import.meta.url));
 const environment={...process.env,FONTCONFIG_FILE:fontConfig,XDG_CACHE_HOME:process.env.XDG_CACHE_HOME||'/tmp/axolotl-test-cache'};
 const browser=await chromium.launch({executablePath,env:environment});
 const fonts=execFileSync('fc-list',['--format','%{file}\n'],{encoding:'utf8',env:environment}).trim().split('\n');
 const fontHashes=[...new Set(fonts)].map(p=>sha256(readFileSync(p))).sort();
 const toolchain={browser:browser.version(),browserExecutableSha256:sha256(readFileSync(executablePath)),playwright:require('playwright/package.json').version,node:process.version,platform:process.platform,arch:process.arch,osReleaseSha256:sha256(readFileSync('/etc/os-release')),systemFontsSha256:sha256(JSON.stringify(fontHashes)),fontConfigSha256:sha256(readFileSync(fontConfig))};
 return {browser,toolchain};
}
export function referenceCases(){
 const result=[];
 const add=(section,state,viewport)=>{for(const theme of ['dark','light'])result.push({id:`${section}-${state}-${theme}-${viewport[0]}x${viewport[1]}`,section,state,theme,viewport:{width:viewport[0],height:viewport[1]},dpr:1,locale:'cs-CZ',reducedMotion:'reduce',fixedTime:'2026-10-22T12:00:00.000Z'});};
 for(const vp of viewports)add('dashboard','default',vp);
 for(const state of ['url-hover','url-focus','copy-pressed','media-open','settings-open','seo-tooltip','seo-allowed','seo-blocked'])add('dashboard',state,[1366,768]);
 add('dashboard','compact-open',[390,844]);
 for(const section of ['buttons','forms','surfaces','overlays','navigation','brand','colors','feedback','widgets','foundations']){
  add(section,'default',[1440,900]);add(section,'default',[390,844]);
 }
 for(const state of ['ghost-hover','destructive-hover','primary-pressed','keyboard-focus','loading','disabled','split-open'])add('buttons',state,[1366,768]);
 add('forms','select-open',[1366,768]);add('forms','invalid',[1366,768]);
 add('overlays','dialog-open',[1366,768]);add('navigation','selected',[1366,768]);
 add('lens','default',[1440,900]);add('lens','default',[390,844]);
 return result;
}
const selectors='header[data-header-theme],.axolotl-pill-nav__logo,.axolotl-pill-nav__item,[data-header-url],[data-header-url] label,[data-header-url] svg,[data-header-seo],[data-header-seo]>span,[data-header-panel],[data-header-select],[role=tooltip],.ds-bento,.ds-bento-cell,.axo-animated-mark,.axo-animated-mark__symbol,.axo-animated-mark__orbit,[data-gill],[data-eye],[data-smile],.axo-ds-button,.axo-ds-button__icon,.axo-ds-split,.axo-ds-split-menu,.ds-card,.ds-panel,.ds-input,[role=dialog],[role=combobox],[role=checkbox],[role=radio],[role=switch],[role=slider],[role=tab],.ds-alert,.ds-progress,.ds-color-swatch,.ds-catalog-stage,input,textarea,select';
export async function openCase(browser,base,item){
 const context=await browser.newContext({viewport:item.viewport,deviceScaleFactor:item.dpr,locale:item.locale,timezoneId:'UTC',reducedMotion:item.reducedMotion,permissions:['clipboard-read','clipboard-write']});
 const page=await context.newPage();page.setDefaultTimeout(8000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.clock.setFixedTime(new Date(item.fixedTime));
 await page.addInitScript(({theme,seo})=>{
  localStorage.clear();sessionStorage.clear();localStorage.setItem('axolotl-2-theme',theme);localStorage.setItem('axolotl-2-motion','system');localStorage.setItem('axolotl-2-cursor-effects','false');localStorage.setItem('axolotl-library-v1-1-theme',theme);localStorage.setItem('axolotl-library-v1-1-motion','system');localStorage.setItem('axolotl-library-v1-1-cursor','false');
  if(seo){
   const post=data=>window.postMessage({source:'axolotl-extension',...data},location.origin);
   addEventListener('message',event=>{const m=event.data;if(m?.source!=='axolotl-page')return;
    if(m.type==='AXOLOTL_GET_TABS')post({type:'AXOLOTL_TABS',requestId:m.requestId,ok:true,activeId:8,tabs:[{id:8,title:'Baseline SEO fixture',url:'https://fixture.test/',documentToken:'reference'}]});
    if(m.type==='AXOLOTL_TOOL_REQUEST'&&m.operation==='TARGET_INDEXATION'){
     post({type:'AXOLOTL_TOOL_ACK',requestId:m.requestId});post({type:'AXOLOTL_TOOL_RESPONSE',requestId:m.requestId,ok:true,data:{id:8,url:'https://fixture.test/',documentId:'reference',entries:[{name:'robots',content:seo==='blocked'?'noindex':'index,follow'}],headers:[]}});
    }
   });
  }
 },{theme:item.theme,seo:item.state==='seo-allowed'?'allowed':item.state==='seo-blocked'?'blocked':null});
 const url=item.section==='lens'?(process.env.LENS_URL||new URL('/verification/lens/scripts/button-lens-02/fixture.html',base).href):base+`?catalog=library&section=${item.section}#design-system`;
 await page.goto(url,{waitUntil:'networkidle'});
 await page.locator(item.section==='lens'?'.matrix':item.section==='dashboard'?'#approved-header header':'.ds-catalog h1').waitFor();
 await page.getByText('Načítám komponenty…',{exact:true}).waitFor({state:'hidden'});
 if(item.section==='lens')await page.evaluate(theme=>document.documentElement.dataset.theme=theme,item.theme);
 await page.waitForFunction(theme=>document.documentElement.dataset.theme===theme,item.theme);
 await page.evaluate(()=>document.fonts.ready);
 if(item.section==='dashboard')await page.locator('.ds-dashboard').evaluate(e=>e.scrollIntoView());
 await page.mouse.move(0,0);
 const s=item.state;
 if(s==='url-hover')await page.locator('[data-header-url]').hover();
 if(s==='url-focus')await page.getByRole('textbox',{name:'Aktuální URL'}).focus();
 if(s==='copy-pressed'){await page.getByRole('textbox',{name:'Aktuální URL'}).fill('https://example.cz/');await page.getByRole('button',{name:'Kopírovat URL',exact:true}).hover();await page.mouse.down();}
 if(s==='media-open'||s==='settings-open'){const trigger=page.getByRole('button',{name:s==='media-open'?'Média':'Nastavení',exact:true});await trigger.focus();await trigger.press('ArrowDown');await page.locator('[data-header-panel]').waitFor();}
 if(s==='compact-open'){await page.getByRole('button',{name:'Otevřít navigaci',exact:true}).click();await page.getByRole('navigation',{name:'Kompaktní navigace'}).waitFor();}
 if(s.startsWith('seo-')){if(s!=='seo-tooltip')await page.waitForFunction(state=>document.querySelector('[data-header-seo]')?.dataset.headerSeo===state,s.slice(4));await page.locator('[data-header-seo]').focus();await page.getByRole('tooltip').waitFor();}
 if(['ghost-hover','destructive-hover'].includes(s)){await page.locator(`input[name=button-variant][value=${s.split('-')[0]}]`).check();await page.locator('#button-playground').hover();}
 if(s==='primary-pressed'){await page.locator('#button-playground').hover();await page.mouse.down();}
 if(s==='keyboard-focus'){await page.keyboard.press('Tab');await page.locator('#button-playground').focus();}
 if(['disabled','loading'].includes(s))await page.getByRole('checkbox',{name:s==='disabled'?'Disabled':'Loading',exact:true}).check();
 if(s==='split-open'){await page.locator('input[name=button-variant][value=split]').check();await page.locator('.axo-button-showcase__stage').getByRole('button',{name:'Formát exportu',exact:true}).press('ArrowDown');await page.getByRole('menu',{name:'Formát exportu'}).waitFor();}
 if(s==='select-open'){await page.getByRole('combobox',{name:'Komponenta',exact:true}).click();await page.getByRole('option',{name:'Select',exact:true}).click();await page.getByRole('combobox',{name:'Cílová oblast',exact:true}).click();await page.getByRole('listbox').waitFor();}
 if(s==='invalid')await page.getByRole('switch',{name:'Invalid',exact:true}).check();
 if(s==='dialog-open'){await page.locator('.ds-catalog-stage').getByRole('button',{name:'Otevřít dialog',exact:true}).click();await page.getByRole('dialog',{name:'Upravit workspace',exact:true}).waitFor();}
 if(s==='selected'){await page.locator('.ds-catalog-stage [role=tab]').nth(1).click();}
 await page.waitForTimeout(250);
 await page.evaluate(()=>{for(const a of document.getAnimations()){if(a.effect?.getTiming().iterations===Infinity){a.pause();a.currentTime=0;}else try{a.finish();}catch{}}});
 await page.addStyleTag({content:'input,textarea{caret-color:transparent!important}'});
 assert.deepEqual(errors,[],'Browser runtime errors');
 return {page,context};
}
export async function snapshot(page){
 // Chromium full-page capture temporarily changes its viewport. Suspend page
 // callbacks so resize/media-query handlers cannot change focus mid-capture.
 // DOM, CSS and pixels remain untouched; real motion is tested separately.
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 const captureSession=await page.context().newCDPSession(page);
 if(captureSession)await captureSession.send('Emulation.setScriptExecutionDisabled',{value:true});
 const focused=await page.evaluateHandle(()=>document.activeElement);
 try{
 const data=await page.evaluate(selectors=>{
  const props=['color','backgroundColor','backgroundImage','borderTopWidth','borderTopColor','borderRadius','outlineStyle','outlineWidth','outlineColor','outlineOffset','boxShadow','fontFamily','fontSize','fontWeight','lineHeight','letterSpacing','padding','margin','gap','display','opacity','transform','gridTemplateColumns','gridTemplateRows','fill','stroke'];
  const nodes=[...document.querySelectorAll(selectors)].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0;}).map(e=>{
   const r=e.getBoundingClientRect(),s=getComputedStyle(e);
   return {tag:e.tagName,class:e.getAttribute('class'),role:e.getAttribute('role'),label:e.getAttribute('aria-label'),variant:e.getAttribute('data-variant'),size:e.getAttribute('data-size'),geometry:[r.x+scrollX,r.y+scrollY,r.width,r.height].map(x=>Math.round(x*100)/100),styles:Object.fromEntries(props.map(k=>[k,s[k]])),before:{background:getComputedStyle(e,'::before').backgroundColor,content:getComputedStyle(e,'::before').content},svg:e.matches('.axo-animated-mark__symbol')?e.innerHTML:null};
  });
  return {nodes,theme:document.documentElement.dataset.theme,fonts:[...document.fonts].map(f=>({family:f.family,status:f.status})),dashboardCells:document.querySelectorAll('.ds-bento-cell').length,widgetPositions:[...document.querySelectorAll('[data-widget]')].map(e=>e.getAttribute('data-widget'))};
 },selectors);
  const png=await page.screenshot({fullPage:true,caret:'hide'});
  assert(await focused.evaluate(e=>e===document.activeElement),'Focus changed during screenshot: unstable capture, not a valid baseline');
  return {data,png};
 }finally{await focused.dispose();if(captureSession){await captureSession.send('Emulation.setScriptExecutionDisabled',{value:false});await captureSession.detach();}}
}
export async function checkInvariants(page,item){
 if(item.section==='dashboard'){
  assert.equal(await page.locator('.ds-bento-cell').count(),7,'Office plus six widget positions');
  assert.equal(await page.locator('#approved-header .axo-animated-mark').count(),1);
  assert.equal(await page.locator('#approved-header [data-gill]').count(),6);
  assert.equal(await page.locator('#approved-header header').evaluate(e=>getComputedStyle(e).getPropertyValue('--primary').trim()),purple,'Exact Header violet');
  assert(await page.locator('#approved-header header').evaluate(e=>e.scrollWidth<=e.clientWidth),'Header overflow');
  if(item.viewport.width===1366)assert(await page.locator('.ds-dashboard').evaluate(e=>e.scrollWidth<=e.clientWidth&&e.scrollHeight<=e.clientHeight+1),'Dashboard internal scrolling at 1366x768');
  if(item.state==='url-focus')assert(await page.locator('[data-header-url]').evaluate(e=>{const s=getComputedStyle(e),i=getComputedStyle(e.querySelector('input'));return s.borderTopColor===getComputedStyle(e.querySelector('label')).color&&i.borderTopWidth==='0px'&&i.outlineStyle==='none'&&i.boxShadow==='none';}),'Single capsule focus ring and WWW color');
 }
 if(item.section==='buttons'){
  const ids=await page.locator('input[name=button-variant]').evaluateAll(es=>es.map(e=>e.value));
  assert.deepEqual(ids,['primary','secondary','outline','ghost','icon','destructive','split'],'Button six variants plus separate Split');
  const sizes=await page.locator('input[name=button-size]').evaluateAll(es=>es.map(e=>e.value));assert.deepEqual(sizes,['small','medium','large']);
 }
}
