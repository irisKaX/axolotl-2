// Real elapsed-time checks run separately from frozen baseline screenshots.
import assert from 'node:assert/strict';
import {launch,openCase,referenceCases} from './browser.mjs';
const base=process.argv[2];assert(base,'Library URL required');
const {browser}=await launch();
try{
 for(const theme of ['dark','light']){
  const item=referenceCases().find(c=>c.section==='dashboard'&&c.state==='default'&&c.viewport.width===1366&&c.theme===theme);
  const {page,context}=await openCase(browser,base,item);
  try{
   await page.emulateMedia({reducedMotion:'no-preference'});
   const mark=page.locator('#approved-header .axo-animated-mark');
   await page.waitForTimeout(100);
   const read=()=>mark.evaluate(e=>e.getAnimations({subtree:true}).map(a=>({target:a.effect.target.className,time:a.currentTime,state:a.playState,transform:getComputedStyle(a.effect.target).transform})));
   const first=await read();await page.waitForTimeout(150);const second=await read();
   assert.equal(first.length,1);assert.equal(second.length,1);
   assert(first[0].target.includes('axo-animated-mark__orbit'),'Only the orbit animates');
   assert.equal(second[0].state,'running');assert(second[0].time>first[0].time);assert.notEqual(second[0].transform,first[0].transform,'Orbit actually moves');
   await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(100);
   assert.equal((await read()).length,0,'Reduced motion removes orbit animation');
   console.log('PASS real-time orbit + reduced motion',theme);
  }finally{await context.close();}
 }
}finally{await browser.close();}
