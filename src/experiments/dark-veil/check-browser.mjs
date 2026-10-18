import { chromium, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir,writeFile } from 'node:fs/promises';
const base=process.env.VEIL_TEST_URL||'http://127.0.0.1:4191/axolotl-preview/dark-veil-lab/';
const evidence='docs/dark-veil';await mkdir(`${evidence}/screenshots`,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROME_EXECUTABLE||undefined,args:['--no-sandbox','--enable-unsafe-swiftshader']});
const report={checks:[],screenshots:[],performance:[],errors:[],axe:[],limitations:['Chromium uses the available GPU backend, not a physical Mac or iPhone.','Fixtures are local demo cards; no real browser-extension integration is asserted.']};
async function instrument(context) {
  await context.addInitScript(()=>{
    window.veilProbe={draws:0,uniforms:{},longTasks:[],times:[]};
    try{new PerformanceObserver(list=>{for(const e of list.getEntries())window.veilProbe.longTasks.push(e.duration);}).observe({type:'longtask',buffered:true});}catch{}
    const proto=WebGL2RenderingContext.prototype, locations=new WeakMap();
    const locate=proto.getUniformLocation;proto.getUniformLocation=function(program,name){const result=locate.call(this,program,name);if(result)locations.set(result,name);return result;};
    const set=proto.uniform1f;proto.uniform1f=function(location,value){window.veilProbe.uniforms[locations.get(location)]=value;return set.call(this,location,value);};
    const draw=proto.drawArrays;proto.drawArrays=function(...args){window.veilProbe.draws++;window.veilProbe.times.push(performance.now());return draw.apply(this,args);};
  });
}
async function range(page,id,value){await page.locator(`#veil-${id}`).fill(String(value));}
async function canvasOK(page){await expect(page.locator('.veil-background canvas')).toBeVisible();await expect.poll(()=>page.locator('.veil-background canvas').evaluate(c=>{const gl=c.getContext('webgl2');return gl&&!gl.isContextLost()&&gl.getParameter(gl.CURRENT_PROGRAM)!==null;})).toBe(true);expect(await page.locator('canvas').evaluate(c=>c.getContext('webgl2').getError())).toBe(0);}
async function shot(page,name){await page.screenshot({path:`${evidence}/screenshots/${name}.png`});report.screenshots.push(`${name}.png`);}
async function measure(page,label){
  const start=await page.evaluate(()=>({draws:window.veilProbe.draws,time:performance.now()}));await page.waitForTimeout(3000);
  const sample=await page.evaluate(start=>{const p=window.veilProbe;const gl=document.querySelector('canvas').getContext('webgl2');const debug=gl.getExtension('WEBGL_debug_renderer_info');const intervals=p.times.filter((_,i)=>i%2===0).slice(-60).map((t,i,a)=>i?t-a[i-1]:0).filter(Boolean).sort((a,b)=>a-b);return{framesPerSecond:Math.round(((p.draws-start.draws)/2)*10000/(performance.now()-start.time))/10,canvas:[gl.canvas.width,gl.canvas.height],renderer:debug?gl.getParameter(debug.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),recentFrameMedianMs:intervals[Math.floor(intervals.length/2)],recentFrameP95Ms:intervals[Math.floor(intervals.length*.95)],longTasks:p.longTasks.length,maxLongTaskMs:Math.max(0,...p.longTasks)};},start);
  report.performance.push({label,...sample});
}
try {
 for(const mobile of [false,true]){
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1366,height:768},deviceScaleFactor:mobile?3:1,isMobile:mobile,hasTouch:mobile,reducedMotion:'no-preference',locale:'cs-CZ'});
  context.setDefaultTimeout(15000);await instrument(context);const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
  await page.goto(base);await canvasOK(page);await page.waitForTimeout(800);
  for(const theme of ['dark','light']){console.log('Checking',mobile?'mobile':'desktop',theme);
   if(mobile&&theme==='light')await page.getByRole('button',{name:'Upravit efekt',exact:true}).click();
   if(!mobile||theme==='light')await page.getByRole('button',{name:theme==='dark'?'Tmavý':'Světlý',exact:true}).click();
   await expect(page.locator('html')).toHaveAttribute('data-theme',theme);
   await expect.poll(()=>page.evaluate(()=>window.veilProbe.uniforms.uLightMode)).toBe(theme==='light'?1:0);
   if(mobile&&theme==='light')await page.getByRole('button',{name:'Skrýt ovládání',exact:true}).click();
   await page.evaluate(()=>scrollTo(0,0));await shot(page,`${theme}-${mobile?'390':'1366'}`);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
   const accessibility=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
   report.axe.push({theme,mobile,violations:accessibility.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>n.target)}))});
   expect(accessibility.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))).toEqual([]);
   for(const name of ['Nastavení','Upozornění','Vybrat kartu prohlížeče',...(mobile?['Otevřít navigaci']:[])]){
    console.log('Popup',name);const trigger=page.getByRole('button',{name,exact:true});if(mobile)await trigger.tap();else await trigger.click();const panel=page.locator('[data-header-panel]');await expect(panel).toBeVisible();
    await expect.poll(async()=>{const p=await panel.boundingBox(),h=await page.getByRole('banner').boundingBox();return p.y-h.y-h.height;}).toBeGreaterThanOrEqual(10);
    if(name==='Nastavení'){
      await page.getByRole('button',{name:'Vzhled a prostředí',exact:true}).click();await page.getByRole('combobox',{name:'Barevný režim',exact:true}).click();await expect(page.getByRole('listbox')).toBeVisible();await page.keyboard.press('Escape');await expect(page.getByRole('listbox')).toBeHidden();await expect(panel).toBeVisible();
    }
    await page.keyboard.press('Escape');await expect(panel).toBeHidden();await page.mouse.move(0,750);
   }
   console.log('Completed check');report.checks.push(`${theme} ${mobile?'mobile touch 390×844':'desktop 1366×768'}: canvas, theme uniform, overflow, accessibility, header popups, nested Radix Select/Escape`);
  }
  await page.getByRole('checkbox',{name:'Tmavý režim',exact:true}).check();
  if(mobile){await page.getByRole('button',{name:'Upravit efekt',exact:true}).tap();await page.locator('.veil-controls').scrollIntoViewIfNeeded();await shot(page,'mobile-controls');}
  await page.locator('#veil-speed').focus();await page.keyboard.press('ArrowRight');await expect(page.locator('#veil-speed')).toHaveValue('0.4');
  await range(page,'brightness',1.5);await expect.poll(()=>page.evaluate(()=>window.veilProbe.uniforms.uGain)).toBeCloseTo(1.725,3);
  await range(page,'glow',0.8);await expect.poll(()=>page.evaluate(()=>window.veilProbe.uniforms.uGlow)).toBe(0.8);
  await page.getByLabel('Barva světla',{exact:true}).fill('#2277cc');await expect(page.locator('.veil-color small')).toHaveText('#2277CC');
  await page.getByText('Jemné doladění',{exact:false}).first().click();
  for(const [name,value,uniform,expected] of [['rotation',125,null,0],['flow',1.4,'uFlow',1.4],['warp',0.4,'uWarp',0.4],['variation',3,null,0],['sheen',0.8,'uSheen',0.4],['grain',0.05,'uGrain',0.05],['fade',0.3,'uFade',0.3],['opacity',0.8,'uOpacity',0.8]]){await range(page,name,value);if(uniform)await expect.poll(()=>page.evaluate(u=>window.veilProbe.uniforms[u],uniform)).toBeCloseTo(expected,3);}
  await range(page,'quality',0.3);await canvasOK(page);
  await page.getByRole('button',{name:'Obnovit nastavení efektu',exact:true}).click();await canvasOK(page);
  console.log('Completed check');report.checks.push(`${mobile?'Mobile':'Desktop'}: original API controls and WebGL uniforms, quality remount, reset`);
  await page.getByRole('button',{name:'Pozastavit',exact:true}).click();await page.waitForTimeout(600);
  const clock=await page.evaluate(()=>window.veilProbe.uniforms.uTime);await page.waitForTimeout(500);expect(await page.evaluate(()=>window.veilProbe.uniforms.uTime)).toBe(clock);
  await page.getByRole('button',{name:'Spustit',exact:true}).click();await expect.poll(()=>page.evaluate(()=>window.veilProbe.uniforms.uTime)).toBeGreaterThan(clock);
  await page.getByLabel('Místo pro myšlenku',{exact:true}).fill('Ověřeno: psaní nad pozadím.');
  await page.getByText('Projít strukturu nadpisů',{exact:true}).click();await expect(page.getByRole('checkbox',{name:'Projít strukturu nadpisů'})).toBeChecked();
  await page.getByRole('button',{name:'Pracovní poznámky: posunout výš'}).click();await expect(page.locator('[data-widget]').first()).toHaveAttribute('data-widget','notes');
  if(!mobile){await page.getByRole('button',{name:'Pracovní poznámky: posunout níž'}).click();await page.getByRole('button',{name:'Přetáhnout Kontrola stránky'}).dragTo(page.locator('[data-widget=notes] .veil-card-heading'));await expect(page.locator('[data-widget]').nth(1)).toHaveAttribute('data-widget','activity');}
  expect(await page.locator('.veil-background').evaluate(el=>getComputedStyle(el).pointerEvents)).toBe('none');
  console.log('Completed check');report.checks.push(`${mobile?'Mobile':'Desktop'}: pause/resume, typing, checkbox, accessible card reorder${mobile?'':', HTML drag & drop'}, background pointer transparency`);
  await page.evaluate(()=>scrollTo(0,0));await measure(page,mobile?'mobile DPR3 capped canvas DPR1':'desktop DPR1');
  await page.getByLabel('Statické pozadí bez WebGL').check();await expect(page.locator('canvas')).toHaveCount(0);const before=await page.evaluate(()=>window.veilProbe.draws);await page.waitForTimeout(300);expect(await page.evaluate(()=>window.veilProbe.draws)).toBe(before);
  await page.getByLabel('Statické pozadí bez WebGL').uncheck();await canvasOK(page);
  await page.emulateMedia({reducedMotion:'reduce'});await expect(page.locator('canvas')).toHaveCount(0);await expect(page.locator('.veil-mode')).toContainText('Omezený pohyb');
  await page.emulateMedia({reducedMotion:'no-preference'});await canvasOK(page);
  await page.locator('canvas').evaluate(c=>c.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());await expect(page.locator('canvas')).toHaveCount(0);await expect(page.locator('.veil-mode')).toContainText('WebGL nedostupné');
  await page.getByRole('button',{name:'Obnovit nastavení efektu',exact:true}).click();await canvasOK(page);
  console.log('Completed check');report.checks.push(`${mobile?'Mobile':'Desktop'}: static no-render fallback, live OS reduced-motion change, context loss and explicit recovery`);
  if(!mobile){for(const width of [320,768,1366,390,1366]){await page.setViewportSize({width,height:768});await expect.poll(()=>page.locator('canvas').evaluate(c=>c.width)).toBe(width);await canvasOK(page);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}console.log('Completed check');report.checks.push('Repeated responsive resize 320/768/1366/390/1366: no GL errors, correctly sized new canvases');}
  await context.close();
 }
 const blocked=await browser.newContext({reducedMotion:'no-preference'});await blocked.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,...args){return kind==='webgl2'?null:original.call(this,kind,...args);};});const page=await blocked.newPage();await page.goto(base);await expect(page.locator('.veil-mode')).toContainText('WebGL nedostupné');await expect(page.locator('canvas')).toHaveCount(0);await expect(page.getByRole('heading',{name:'Prostor, který plyne.'})).toBeVisible();await shot(page,'fallback-no-webgl');await blocked.close();console.log('Completed check');report.checks.push('WebGL2 unavailable: functional app and static fallback');
 expect(report.errors).toEqual([]);
 report.result='PASS';
} catch(error){report.result='FAIL';report.failure=String(error);throw error;}
finally{await writeFile(`${evidence}/results.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));await browser.close();}
