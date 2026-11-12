import test from 'node:test';
import assert from 'node:assert/strict';
import {browserHarness} from './browser-support.mjs';
// #389: with a single player the floor is given in the same update as the press; the pressed buzzer
// and its #position must still be visible for a moment before "Your turn" flips in.
const ready=p=>p.waitForFunction(()=>window.BuzzyView?.state.networkReady&&!document.documentElement.hasAttribute('data-network-busy'));
const idle=p=>p.waitForFunction(()=>!document.documentElement.hasAttribute('data-network-busy'));
await test('Single player: the press and #1 show before Your turn',async()=>{
 const h=await browserHarness();
 try{
  const hc=await h.browser.newContext({viewport:{width:1280,height:800}}),host=await hc.newPage();host.setDefaultTimeout(15000);
  await host.goto('http://127.0.0.1:5173');await host.locator('#host-entry').click();await ready(host);const code=await host.evaluate(()=>BuzzyView.state.code);
  const pc=await h.browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),player=await pc.newPage();player.setDefaultTimeout(15000);
  await player.goto('http://127.0.0.1:5173');await player.locator('#room-code').fill(code);await player.locator('#player-name').fill('Ada');await player.locator('.join-button').click();await ready(player);
  await host.locator('[data-nav="play"]').click();await idle(host);
  assert.equal(await host.evaluate(()=>BuzzyView.state.mode),'timed');
  await host.locator('.quickplay-main[data-action="open"]').click();await idle(host);
  await player.locator('[data-action^="buzz:"]:not([aria-disabled="true"])').first().waitFor();
  await player.locator('[data-action^="buzz:"]').first().click();
  // Within the hold: the pressed buzzer with #1, no Your turn yet, although the host already gave the floor.
  await player.locator('.buzz-stamp-badge',{hasText:'#1'}).waitFor({timeout:1500});
  await host.waitForFunction(()=>BuzzyView.state.phase!=='open');
  const during=await player.evaluate(()=>({turn:!!document.querySelector('.coin-state-label--turn'),stamp:!!document.querySelector('.buzz-stamp-badge')}));
  assert.deepEqual(during,{turn:false,stamp:true});
  await player.waitForTimeout(600);
  assert.equal(await player.locator('.coin-state-label--turn').count(),0,'Still showing the press about one second later');
  // After the hold the floor animation shows.
  await player.locator('.coin-state-label--turn').waitFor({timeout:3000});
  await hc.close();await pc.close();
 }finally{await h.close();}
});
