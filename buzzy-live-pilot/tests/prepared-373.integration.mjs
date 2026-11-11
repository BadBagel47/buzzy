import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {browserHarness} from './browser-support.mjs';
// #373: a prepared question counts as played only after a correct answer or when the host moves on.
const report={status:'running',checks:[],pageErrors:[]};
const ready=p=>p.waitForFunction(()=>window.BuzzyView?.state.networkReady&&!document.documentElement.hasAttribute('data-network-busy'));
const idle=p=>p.waitForFunction(()=>!document.documentElement.hasAttribute('data-network-busy'));
await test('Prepared questions stay in the queue until answered correctly or skipped',async()=>{
 const h=await browserHarness();const contexts=[];
 try{
  async function page(){const c=await h.browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});contexts.push(c);const p=await c.newPage();p.on('pageerror',e=>report.pageErrors.push(e.message));p.setDefaultTimeout(15000);await p.goto('http://127.0.0.1:5173');return p;}
  const host=await page();await host.locator('#host-entry').click();await ready(host);const code=await host.evaluate(()=>window.BuzzyView.state.code);
  const player=await page();await player.locator('#room-code').fill(code);await player.locator('#player-name').fill('Ada');await player.locator('.join-button').click();await ready(player);
  const queue=()=>host.evaluate(()=>window.BuzzyView.state.questions.map(q=>({title:q.title,played:!!q.played,started:!!q.started})));
  const click=async action=>{await host.locator(`[data-action="${action}"]`).first().click();await host.waitForTimeout(450);await idle(host);};
  const confirmIfAsked=async()=>{for(const a of ['confirm-play-mode','confirm-quick','confirm-skip']){if(await host.locator(`#modalroot [data-action="${a}"]`).count()){await click(a);}}};
  for(const [title,text] of [['Q1','First question?'],['Q2','Second question?'],['Q3','Third question?']]){
   await host.locator('[data-nav="questions"]').click();await host.locator('[data-action="new-question"]').click();await host.locator('#qtitle').fill(title);await host.locator('#qtext').fill(text);await host.locator('[data-action="save-question"]').click();await idle(host);
  }
  await host.locator('[data-nav="play"]').click();await idle(host);
  // Shown, then switch mode and back: the question stays and is marked Started.
  await click('set-play-mode:prepared');await confirmIfAsked();
  await host.locator('.quickplay-main[data-action="present"]').click();await idle(host);
  await click('set-play-mode:quick');await confirmIfAsked();await click('set-play-mode:prepared');await confirmIfAsked();
  let q=await queue();assert.deepEqual(q.map(x=>x.played),[false,false,false],JSON.stringify(q));assert.equal(q[0].started,true,JSON.stringify(q));
  await host.locator('[data-nav="questions"]').click();await host.locator('.library-card-overline',{hasText:'Started'}).first().waitFor();
  assert.equal(await host.locator('.library-question-card').count(),3);
  report.checks.push('A shown prepared question survives switching to Quick Play and back, and is marked Started in the queue');
  // Buzzers opened without a correct answer, then switch mode: still in the queue.
  await host.locator('[data-nav="play"]').click();await idle(host);
  await host.locator('.quickplay-main[data-action="present"],.quickplay-main[data-action="present-and-open"],.quickplay-main[data-action="open"]').first().click();await idle(host);
  if(await host.locator('.quickplay-main[data-action="open"]').count()){await click('open');}
  await player.waitForFunction(()=>window.BuzzyView.state.phase==='open');
  await click('set-play-mode:quick');await confirmIfAsked();await click('set-play-mode:prepared');await confirmIfAsked();
  q=await queue();assert.equal(q[0].played,false,'Opening the buzzers without a correct answer does not use the question up: '+JSON.stringify(q));
  report.checks.push('Opening the buzzers without a correct answer and switching mode keeps the question in the queue');
  // Skip & Next uses the question up.
  await click('request-skip');await confirmIfAsked();
  q=await queue();assert.equal(q[0].played,true,'Skip & Next counts as played: '+JSON.stringify(q));assert.equal(q[1].played,false);
  report.checks.push('Skip & Next marks the current question as played');
  // A correct answer uses the question up, even if the host then switches mode.
  await host.locator('.quickplay-main[data-action="present-and-open"],.quickplay-main[data-action="present"]').first().click();await idle(host);
  if(await host.locator('.quickplay-main[data-action="open"]').count()){await click('open');}
  await player.waitForFunction(()=>window.BuzzyView.state.phase==='open');await player.locator('.coin-buzzer').focus();await player.keyboard.press('Space');
  await host.waitForFunction(()=>window.BuzzyView.state.buzzes.length===1);await host.locator('[data-action="stop"],[data-action="close"]').first().click().catch(()=>{});await idle(host);
  await host.waitForFunction(()=>['closed','locked'].includes(window.BuzzyView.state.phase));await click('correct');
  await click('set-play-mode:quick');await confirmIfAsked();
  q=await queue();assert.equal(q[1].played,true,'A correctly answered question is played: '+JSON.stringify(q));assert.equal(q[2].played,false);
  report.checks.push('A correctly answered question is played even when the host then switches mode');
  assert.deepEqual(report.pageErrors,[]);report.status='passed';
 }catch(e){report.status='failed';report.error=e.stack;throw e;}
 finally{for(const c of contexts)await c.close().catch(()=>{});await h.close();writeFileSync('reports/prepared-373.json',JSON.stringify(report,null,2)+'\n');}
});
