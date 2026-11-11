import test from 'node:test';
import assert from 'node:assert/strict';
import {browserHarness} from './browser-support.mjs';
// #367: while Quick Play question content collapses, nothing from the collapsing panel may spill over the content below it.
const ready=p=>p.waitForFunction(()=>window.BuzzyView?.state.networkReady&&!document.documentElement.hasAttribute('data-network-busy'));
const idle=p=>p.waitForFunction(()=>!document.documentElement.hasAttribute('data-network-busy'));
await test('Collapsing Quick Play content stays inside its own box',async()=>{
 const h=await browserHarness();
 try{
  for(const [width,height,mobile] of [[1280,900,false],[390,844,true]]){
   const c=await h.browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile}),p=await c.newPage();p.setDefaultTimeout(15000);
   await p.goto('http://127.0.0.1:5173');await p.locator('#host-entry').click();await ready(p);
   const button=p.locator('[data-action="set-play-mode:quick"]').first();
   await button.click();await p.waitForTimeout(900);await idle(p);
   await p.locator('#quick-text').fill('Some text for the quick question');await p.waitForTimeout(300);
   await button.click();
   let checked=0;
   for(let i=0;i<10;i++){
    const spill=await p.evaluate(()=>{const clone=document.querySelector('[data-ui-closing="true"]');if(!clone)return null;const box=clone.getBoundingClientRect();return {overflow:getComputedStyle(clone).overflow,spill:Math.max(0,...[...clone.querySelectorAll('*')].map(e=>{const r=e.getBoundingClientRect();return r.height>0&&getComputedStyle(clone).overflow!=='hidden'?r.bottom-box.bottom:0;}))};});
    if(spill){checked++;assert.equal(spill.overflow,'hidden',JSON.stringify(spill));assert.ok(spill.spill<=1,JSON.stringify(spill));}
    await p.waitForTimeout(25);
   }
   assert.ok(checked>=2,'The collapse animation was observed at '+width);
   await c.close();
  }
 }finally{await h.close();}
});
