import test from 'node:test';
import assert from 'node:assert/strict';
import {browserHarness} from './browser-support.mjs';
// #409: the player's view has no selectable or copyable text; the host's view is unchanged.
const ready=p=>p.waitForFunction(()=>window.BuzzyView?.state.networkReady&&!document.documentElement.hasAttribute('data-network-busy'));
await test('Players cannot select or copy text; the host still can',async()=>{
 const h=await browserHarness();
 try{
  const hc=await h.browser.newContext({viewport:{width:1280,height:800}}),host=await hc.newPage();host.setDefaultTimeout(20000);
  await host.goto('http://127.0.0.1:5173');await host.locator('#host-entry').click();await ready(host);const code=await host.evaluate(()=>BuzzyView.state.code);
  const pc=await h.browser.newContext({viewport:{width:1280,height:800}}),player=await pc.newPage();player.setDefaultTimeout(20000);
  await player.goto('http://127.0.0.1:5173');await player.locator('#room-code').fill(code);await player.locator('#player-name').fill('Ada');await player.locator('.join-button').click();await ready(player);
  const probe=async page=>page.evaluate(()=>{
   const el=[...document.querySelectorAll('body *')].find(e=>e.children.length===0&&e.textContent.trim().length>3&&e.offsetParent&&!e.closest('input,textarea,script,style'));
   const r=el.getBoundingClientRect();return {style:getComputedStyle(el).userSelect,x:r.left+2,y:r.top+r.height/2,w:r.width};
  });
  const p=await probe(player);assert.equal(p.style,'none');
  await player.mouse.move(p.x,p.y);await player.mouse.down();await player.mouse.move(p.x+p.w-2,p.y,{steps:5});await player.mouse.up();
  await player.keyboard.press('ControlOrMeta+a');
  assert.equal(await player.evaluate(()=>String(getSelection())),'','No text gets selected');
  assert.equal(await player.evaluate(()=>{const e=new Event('copy',{bubbles:true,cancelable:true});document.body.dispatchEvent(e);return e.defaultPrevented;}),true,'Copy is blocked');
  assert.equal(await player.evaluate(()=>{const e=new Event('contextmenu',{bubbles:true,cancelable:true});document.body.dispatchEvent(e);return e.defaultPrevented;}),true,'Long-press menu is blocked');
  const hp=await probe(host);assert.notEqual(hp.style,'none','The host view keeps normal text selection');
  await hc.close();await pc.close();
 }finally{await h.close();}
});
