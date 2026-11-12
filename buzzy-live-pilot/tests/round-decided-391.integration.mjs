import test from 'node:test';
import assert from 'node:assert/strict';
import {browserHarness,read} from './browser-support.mjs';
// #391: when every player has answered wrong and nobody may answer again, Next moves on without the
// confirmation and the round is recorded as "No correct answer". The confirmation stays while someone can answer.
const ready=p=>p.waitForFunction(()=>window.BuzzyView?.state.networkReady&&!document.documentElement.hasAttribute('data-network-busy'));
const idle=p=>p.waitForFunction(()=>!document.documentElement.hasAttribute('data-network-busy'));
await test('Round with no one left to answer ends without confirmation',async()=>{
 const h=await browserHarness();
 try{
  const hc=await h.browser.newContext({viewport:{width:1280,height:900}}),host=await hc.newPage();host.setDefaultTimeout(15000);
  await host.goto('http://127.0.0.1:5173');await host.locator('#host-entry').click();await ready(host);const code=await host.evaluate(()=>BuzzyView.state.code);
  const players=[];
  for(const name of ['Ada','Bo']){const c=await h.browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const p=await c.newPage();p.setDefaultTimeout(15000);await p.goto('http://127.0.0.1:5173');await p.locator('#room-code').fill(code);await p.locator('#player-name').fill(name);await p.locator('.join-button').click();await ready(p);players.push(p);}
  await host.locator('[data-nav="play"]').click();await idle(host);
  assert.equal(await host.evaluate(()=>BuzzyView.state.allowRepeat),false);
  // No countdown, so the host decides when the buzzers close and time never runs out in this test.
  await host.evaluate(()=>{BuzzyView.state.timer=false;BuzzyView.render();});await idle(host);await host.waitForTimeout(500);
  // Round 1: only Ada buzzes and is wrong; Bo could still answer, so Next asks first.
  await host.locator('.quickplay-main[data-action="open"]').click();await idle(host);
  await players[0].locator('[data-action^="buzz:"]').first().click();
  await host.waitForFunction(()=>BuzzyView.state.buzzes.length===1);
  await host.locator('.quickplay-main[data-action="close"]').click();if(await host.locator('[data-action="confirm-stop-buzzers"]').count())await host.locator('[data-action="confirm-stop-buzzers"]').click();await idle(host);
  await host.waitForFunction(()=>BuzzyView.state.phase!=='open');
  await host.locator('[data-action="incorrect"]').first().click();await idle(host);
  await host.locator('[data-action="next-quick"], [data-action="next-question"]').first().click();
  await host.locator('#modalroot h2',{hasText:'Move to the next question?'}).waitFor();
  assert.equal(await host.evaluate(()=>BuzzyView.state.modal),'next-confirm');
  await host.locator('.studio-modal [data-action="close-modal"]').first().click();await host.waitForFunction(()=>!BuzzyView.state.modal);
  // Ask Bo too: reopen the buzzers for the same question, Bo is wrong as well. Nobody is left.
  await host.locator('[data-action="reset"]').first().click();await idle(host);
  await host.locator('.quickplay-main[data-action="open"]').click();await idle(host);
  await host.waitForFunction(()=>BuzzyView.state.phase==='open');
  await players[1].locator('[data-action^="buzz:"]').first().click();
  // Bo is the last eligible player, so the buzzers close by themselves once Bo has buzzed.
  await host.waitForFunction(()=>BuzzyView.state.buzzes.length>=1&&BuzzyView.state.phase!=='open');await idle(host);
  await host.locator('[data-action="incorrect"]').first().click();await idle(host);
  assert.equal(await host.evaluate(()=>window.BuzzyRound.noOneLeft()),true);
  const round=await host.evaluate(()=>BuzzyView.state.countQuestion);
  await host.locator('[data-action="next-quick"], [data-action="next-question"]').first().click();
  await host.waitForFunction(r=>BuzzyView.state.countQuestion===r+1,round);
  assert.equal(await host.evaluate(()=>BuzzyView.state.modal),'');
  await idle(host);
  const archived=await read(host,`rooms/${code}/archive/round-${round}`);
  assert.equal(archived?.status,'No correct answer');
  await hc.close();
 }finally{await h.close();}
});
