import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {writeFileSync,existsSync} from 'node:fs';
const reference=process.env.REFERENCE_URL || 'http://127.0.0.1:4191/creative-concepts/modular-playground/';
const library=process.env.LIBRARY_URL || 'http://127.0.0.1:4185/axolotl-preview/ds-library-v1-1/';
const b=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROME_EXECUTABLE || (existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined)});const output=[];
for(const width of [1366,390])for(const theme of ['dark','light']) {
 const pair=[];
 for(const target of ['reference','react']) {
  const c=await b.newContext({viewport:{width,height:width===390?844:768},reducedMotion:'reduce'});const p=await c.newPage();await p.clock.setFixedTime(new Date('2026-10-22T08:00:00Z'));
  await p.goto(target==='reference'?`${reference}?theme=${theme}`:`${library}?section=dashboard#design-system`);
  await p.locator('#approved-header header').waitFor();await p.getByRole('checkbox',{name:'Tmavý režim',exact:true}).setChecked(theme==='dark');await p.evaluate(()=>document.fonts.ready);
  if(target==='react')await p.locator('.ds-dashboard').evaluate(el=>window.scrollTo(0,el.getBoundingClientRect().top+scrollY));
  await p.mouse.move(0,0);await p.waitForTimeout(350);
  const metrics=await p.evaluate(react=>{
   const root=react?document.querySelector('.ds-dashboard'):document.body,top=react?root.getBoundingClientRect().top:0;
   return ['#approved-header header',...(react?['.ds-office','.ds-office .ds-bento-label']:['.office','.office .bento-label']),...Array.from({length:6},(_,i)=>`[data-widget="${i+1}"]`),'.pg-border-beam'].map(sel=>{const el=document.querySelector(sel),r=el.getBoundingClientRect(),s=getComputedStyle(el);return {x:r.x,y:r.y-top,w:r.width,h:r.height,bg:s.background,color:s.color,border:s.border,shadow:s.boxShadow,font:s.font,radius:s.borderRadius,mask:s.maskComposite.replaceAll("xor","exclude"),opacity:s.opacity}});
  },target==='react');
  pair.push(metrics);
  await p.screenshot({path:`/tmp/v2-${target}-${theme}-${width}.png`});await c.close();
 }
 const diff=pair[0].flatMap((a,i)=>Object.keys(a).filter(k=>typeof a[k]==='number'?Math.abs(a[k]-pair[1][i][k])>.25:a[k]!==pair[1][i][k]).map(k=>({i,k,old:a[k],new:pair[1][i][k]})));
 console.log(width,theme,diff);output.push({width,theme,diff});
}
writeFileSync('/tmp/v2-parity.json',JSON.stringify(output,null,2));await b.close();

assert(output.every(result=>result.diff.length===0),'Dashboard must retain approved geometry/materials/type in both themes and widths');
