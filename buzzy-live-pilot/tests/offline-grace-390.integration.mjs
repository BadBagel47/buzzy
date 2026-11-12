import test from 'node:test';
import assert from 'node:assert/strict';
import {browserHarness} from './browser-support.mjs';
// #390: a short connection blip is not shown to the player; a longer outage still is.
const ready=p=>p.waitForFunction(()=>window.BuzzyView?.state.networkReady&&!document.documentElement.hasAttribute('data-network-busy'));
await test('Short blips stay invisible, longer outages are shown',async()=>{
 const h=await browserHarness();
 try{
  const hc=await h.browser.newContext({viewport:{width:1280,height:800}}),host=await hc.newPage();host.setDefaultTimeout(20000);
  await host.goto('http://127.0.0.1:5173');await host.locator('#host-entry').click();await ready(host);const code=await host.evaluate(()=>BuzzyView.state.code);
  const pc=await h.browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),player=await pc.newPage();player.setDefaultTimeout(20000);
  await player.goto('http://127.0.0.1:5173');await player.locator('#room-code').fill(code);await player.locator('#player-name').fill('Ada');await player.locator('.join-button').click();await ready(player);
  await player.evaluate(()=>{window.__seen={status:false,busy:false,text:false};const root=document.documentElement,status=document.getElementById('network-status');
   new MutationObserver(()=>{if(root.hasAttribute('data-player-status-visible'))window.__seen.status=true;if(root.hasAttribute('data-network-busy'))window.__seen.busy=true;if(/Disconnected/.test(status.textContent))window.__seen.text=true;}).observe(document,{subtree:true,attributes:true,childList:true,characterData:true});});
  // Short blip: about one second offline.
  await pc.setOffline(true);await player.waitForTimeout(1000);await pc.setOffline(false);await ready(player);await player.waitForTimeout(3500);
  assert.deepEqual(await player.evaluate(()=>window.__seen),{status:false,busy:false,text:false},'A short blip does not show the reconnect message');
  // Longer outage: shown after the grace period, and recovered afterwards.
  await pc.setOffline(true);
  await player.waitForFunction(()=>document.documentElement.hasAttribute('data-player-status-visible')&&/Disconnected/.test(document.getElementById('network-status').textContent),null,{timeout:8000});
  await pc.setOffline(false);await ready(player);
  await player.waitForFunction(()=>!document.documentElement.hasAttribute('data-player-status-visible'));
  await hc.close();await pc.close();
 }finally{await h.close();}
});
