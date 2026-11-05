import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {browserHarness,call,read,identity} from './browser-support.mjs';
import {counter} from './traffic.mjs';
const report={status:'running',checks:[],metrics:{},pageErrors:[]};
const state=p=>p.evaluate(()=>structuredClone(window.BuzzyView.state));
const ready=p=>p.waitForFunction(()=>window.BuzzyView?.state.networkReady===true);
async function idle(p){await p.waitForFunction(()=>!document.documentElement.hasAttribute('data-network-busy'));}
await test('Existing Buzzy UI connected to independent Spark identities',async t=>{
 const traffic=counter(),h=await browserHarness(p=>traffic.attach(p));
 try{
  const page=async()=>{const context=await h.browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const p=await context.newPage();await traffic.attach(p);p.on('pageerror',e=>report.pageErrors.push(e.message));p.setDefaultTimeout(12000);await p.goto('http://127.0.0.1:5173');return p;};
  const step=async(name,fn)=>{let failed;await t.test(name,async()=>{try{await fn();}catch(e){failed=e;throw e;}});if(failed)throw failed;report.checks.push(name);};
  let host,a,b,code;
  await step('Start page connects only on interaction, creates real room, joins two empty-score players',async()=>{
   host=await page();await host.locator('#host-entry').waitFor();await new Promise(r=>setTimeout(r,350));assert.equal(traffic.value.connections,0);
   await host.locator('#host-entry').click();await ready(host);code=(await state(host)).code;assert.match(code,/^[A-HJ-NP-Z2-9]{4}$/);assert.deepEqual((await state(host)).players,[]);
   for(const name of ['Alex','Anna']){const p=await page();await p.locator('#room-code').fill(code.toLowerCase());await p.locator('#player-name').fill(name);await p.locator('.join-button').click();await ready(p);if(name==='Alex')a=p;else b=p;}
   await host.waitForFunction(()=>window.BuzzyView.state.players.length===2);
   assert.deepEqual((await state(host)).players.map(p=>p.score),[0,0]);assert.deepEqual((await state(host)).questions,[]);
   assert.equal(await host.locator('.lab-controls').count(),0);assert.equal(await a.locator('.lab-view-switch').count(),0);
   await host.waitForFunction(async()=>{const c=await import('/src/client.js').then(m=>m.getClient());const code=window.BuzzyView.state.code,p=await c.read(`rooms/${code}/presentation`),loads=await c.read(`rooms/${code}/loads/${p.loadKey}`);return Object.keys(loads||{}).length===2;});
  });
  await step('Native Timed buzzes share order, automatic close and authoritative score feedback',async()=>{
   await host.locator('.quickplay-main[data-action="open"]').click();await a.waitForFunction(()=>window.BuzzyView.state.phase==='open');await b.waitForFunction(()=>window.BuzzyView.state.phase==='open');
   await a.evaluate(()=>window.originalBuzzer=document.querySelector('.coin-buzzer'));
   await Promise.all([a.locator('.coin-buzzer').click(),b.locator('.coin-buzzer').click()]);
   await host.waitForFunction(()=>window.BuzzyView.state.buzzes.length===2&&window.BuzzyView.state.phase==='closed');await idle(host);
   const hs=await state(host);assert.deepEqual(hs.buzzes.map(b=>b.order),[1,2]);
   await a.waitForFunction(()=>window.BuzzyView.state.buzzes.length===2);assert.deepEqual((await state(a)).buzzes,hs.buzzes);
   const winner=hs.buzzes[0].id;await host.locator('[data-action="correct"]').first().click();
   for(const p of [host,a,b])await p.waitForFunction(id=>window.BuzzyView.state.players.find(p=>p.id===id)?.score===1,winner);
   assert.equal(await a.evaluate(()=>window.originalBuzzer===document.querySelector('.coin-buzzer')),true,'Retain actual buzzer DOM node');
   assert.equal((await state(a)).lastDecision,'correct');
   const other=hs.buzzes[1].id;await idle(host);await host.locator(`[data-pick="${other}"]`).click();await idle(host);await host.locator('[data-action="correct"]').first().click();for(const p of [host,a,b])await p.waitForFunction(()=>window.BuzzyView.state.players.every(p=>p.score===1));
   report.metrics.nativeTimedRanks=hs.buzzes.map(b=>b.order);report.metrics.timedRankingGradedAfterFirstCorrect=true;
  });
  await step('Reload restores host and player identity, question state, and saved score',async()=>{
   const hostId=await identity(host),aId=await identity(a);await host.reload();await ready(host);await a.reload();await ready(a);
   assert.equal(await identity(host),hostId);assert.equal(await identity(a),aId);assert.equal((await state(host)).code,code);assert.equal((await state(a)).players.reduce((n,p)=>n+p.score,0),2);
  });
  await step('First Buzz, incorrect answer, Retry exclusion and next-round admission use native controls',async()=>{
   await idle(host);await host.locator('.quickplay-main[data-action="next-question"]').click();await host.waitForFunction(()=>window.BuzzyView.state.countQuestion===2);await idle(host);
   await host.locator('[data-action="switch-mode"]').click();await host.waitForFunction(()=>window.BuzzyView.state.mode==='first');await idle(host);
   await host.locator('.quickplay-main[data-action="open"]').click();await a.waitForFunction(()=>window.BuzzyView.state.phase==='open');await a.locator('.coin-buzzer').click();
   await host.waitForFunction(()=>window.BuzzyView.state.phase==='locked');await idle(host);await host.locator('[data-action="incorrect"]').first().click();await host.waitForFunction(()=>window.BuzzyView.state.lastDecision==='incorrect');await idle(host);
   await host.locator('.quickplay-main[data-action="reset"]').click();await host.waitForFunction(()=>window.BuzzyView.state.attemptNumber===2);assert.equal(await host.locator('.previous-attempts').count(),1);assert.deepEqual((await state(host)).playerEffects,{});assert.equal((await state(host)).feedDecision,null);await idle(host);await host.locator('.quickplay-main[data-action="open"]').click();
   await a.waitForFunction(()=>window.BuzzyView.state.attemptNumber===2&&window.BuzzyView.state.phase==='open');assert.equal(await a.locator('.coin-buzzer').getAttribute('aria-disabled'),'true');
   const blocked=await call(a,{action:'buzz',code,roundId:2,attempt:2});assert.equal(blocked.ok,false);
   await b.waitForFunction(()=>window.BuzzyView.state.phase==='open');await b.locator('.coin-buzzer').click();await host.waitForFunction(()=>window.BuzzyView.state.phase==='locked');await idle(host);await host.locator('[data-action="correct"]').first().click();await host.waitForFunction(()=>window.BuzzyView.state.lastDecision==='correct');
  });
  await step('Private prepared library survives reload and host-only text never reaches players',async()=>{
   await idle(host);await host.locator('[data-nav="questions"]').click();await host.locator('[data-action="new-question"]').click();await host.locator('#qtitle').fill('Private internal title');await host.locator('#qtext').fill('A private spoken clue');await host.locator('#qpoints').fill('3');await host.locator('#qpenalty').fill('-2');
   await host.locator('.question-editor-options > summary').click();await host.locator('#qvisibility').selectOption('host');await host.locator('[data-action="save-question"]').click();
   await host.waitForFunction(()=>window.BuzzyView.state.questions.length===1);await new Promise(r=>setTimeout(r,250));await idle(host);await host.reload();await ready(host);assert.equal((await state(host)).questions[0].title,'Private internal title');
   await host.locator('[data-nav="play"]').click();await host.locator('[data-action="set-play-mode:prepared"]').click();
   await host.locator('[data-action="confirm-play-mode"]').click();await host.waitForFunction(()=>!window.BuzzyView.state.quickQuestion&&window.BuzzyView.state.countQuestion===3);await idle(host);
   const presentation=await read(a,`rooms/${code}/presentation`);assert.equal(presentation.text,'');assert.equal('title' in presentation,false);
   assert.equal(await a.evaluate(()=>document.body.textContent.includes('A private spoken clue')||document.body.textContent.includes('Private internal title')),false);
   const deny=await a.evaluate(async code=>{const c=await import('/src/client.js').then(m=>m.getClient());try{await c.read(`rooms/${code}/private/ui`);return false;}catch{return true;}},code);assert.equal(deny,true);
  });
  await step('Prepared custom points, zero floor and untimed First Buzz keep the prototype behavior',async()=>{
   await host.locator('[data-nav="more"]').click();await host.locator('[data-toggle="allowNegativeScores"]').uncheck();await idle(host);await host.locator('[data-nav="play"]').click();
   if((await state(host)).mode!=='first')await host.locator('[data-action="switch-mode"]').click();
   await host.locator('[data-action="option:timer"]').click();await host.locator('#play-custom-seconds').fill('1');await host.locator('#play-custom-seconds').press('Tab');await host.locator('[data-action="set-timer:0"]').click();
   await host.waitForFunction(()=>window.BuzzyView.state.timer===false);await new Promise(r=>setTimeout(r,120));await idle(host);await host.locator('.quickplay-main[data-action="open"]').click();
   await a.waitForFunction(()=>window.BuzzyView.state.countQuestion===3&&window.BuzzyView.state.phase==='open');await new Promise(r=>setTimeout(r,1200));
   assert.equal((await state(host)).phase,'open');assert.equal((await state(a)).timer,false);
   await a.locator('.coin-buzzer').click();await host.waitForFunction(()=>window.BuzzyView.state.phase==='locked');await idle(host);await host.locator('[data-action="incorrect"]').first().click();
   await a.waitForFunction(()=>window.BuzzyView.state.lastDecision==='incorrect');
   const aId=await identity(a);await a.waitForFunction(id=>window.BuzzyView.state.players.find(p=>p.id===id)?.score===0,aId);
   await idle(host);await host.locator('.quickplay-main[data-action="reset"]').click();await host.waitForFunction(()=>window.BuzzyView.state.attemptNumber===2);assert.equal(await host.locator('.previous-attempts').count(),1);assert.deepEqual((await state(host)).playerEffects,{});assert.equal((await state(host)).feedDecision,null);await idle(host);await host.locator('.quickplay-main[data-action="open"]').click();
   await b.waitForFunction(()=>window.BuzzyView.state.countQuestion===3&&window.BuzzyView.state.attemptNumber===2&&window.BuzzyView.state.phase==='open');
   const bId=await identity(b),before=(await state(b)).players.find(p=>p.id===bId).score;await b.locator('.coin-buzzer').click();await host.waitForFunction(()=>window.BuzzyView.state.phase==='locked');await idle(host);await host.locator('[data-action="correct"]').first().click();
   await b.waitForFunction(({id,target})=>window.BuzzyView.state.players.find(p=>p.id===id)?.score===target,{id:bId,target:before+3});
   report.metrics.preparedCorrectAward=3;report.metrics.untimedStayedOpenBeyondConfiguredDuration=true;
  });
  await step('Real image readiness, question reveal and one-second timer work across devices',async()=>{
   let release;const gate=new Promise(r=>release=r);await a.route('**/test-question.svg',async route=>{await gate;await route.continue();});
   await host.locator('[data-nav="questions"]').click();await host.locator('[data-action="new-question"]').click();await host.locator('#qtitle').fill('Image readiness question');await host.locator('#qtext').fill('Find the white circle');await host.locator('#qimage').fill('http://127.0.0.1:5173/test-question.svg');
   await host.locator('[data-action="save-question"]').click();await host.waitForFunction(()=>window.BuzzyView.state.questions.length===2);await idle(host);await host.locator('[data-nav="play"]').click();await host.locator('.quickplay-main[data-action="next-question"]').click();
   await host.waitForFunction(()=>window.BuzzyView.state.countQuestion===4);await idle(host);await host.waitForFunction(()=>window.BuzzyView.state.preload&&Object.values(window.BuzzyView.state.preload.statuses).includes('loading'));
   assert.equal(await host.locator('.quickplay-main').isDisabled(),true);release();await host.waitForFunction(()=>Object.values(window.BuzzyView.state.preload.statuses).length===2&&Object.values(window.BuzzyView.state.preload.statuses).every(v=>v==='ready'));await a.unroute('**/test-question.svg');
   if((await state(host)).mode!=='timed')await host.locator('[data-action="switch-mode"]').click();await host.locator('[data-action="option:timer"]').click();await host.locator('#play-custom-seconds').fill('1');await host.locator('#play-custom-seconds').press('Tab');await host.locator('[data-action="close-option"]').click();await new Promise(r=>setTimeout(r,150));await idle(host);
   await host.locator('.quickplay-main[data-action="present"]').click();await a.waitForFunction(()=>document.querySelector('#playercontent .ph-question').textContent.includes('Find the white circle'));await idle(host);
   const before=traffic.value.databaseWrites;await host.locator('.quickplay-main[data-action="open"]').click();await host.waitForFunction(()=>window.BuzzyView.state.phase==='closed'&&window.BuzzyView.state.remainingAtClose===0);
   await a.waitForFunction(()=>document.querySelector('#playercontent .coin-back')?.textContent.replace(/\s+/g,'').toUpperCase().includes('TIMEISUP'));assert.equal(traffic.value.databaseWrites-before,2,'Only Start and Expire writes');report.metrics.nativeOneSecondTimerDatabaseWrites=2;
   const image=await a.locator('#playercontent .ph-question img').evaluate(e=>({complete:e.complete,width:e.naturalWidth}));assert.equal(image.complete,true);assert.equal(image.width,64);
  });
  await step('Player deadline locks locally while the host browser is frozen, with zero player timer writes',async()=>{
   await idle(host);await host.locator('.quickplay-main[data-action="finish-set"]').click();await host.locator('.modal [data-action="confirm-quick"]').click();await host.waitForFunction(()=>window.BuzzyView.state.countQuestion===5);await idle(host);
   await host.locator('[data-action="option:timer"]').click();await host.locator('#play-custom-seconds').fill('3');await host.locator('#play-custom-seconds').press('Tab');await host.locator('[data-action="close-option"]').click();await new Promise(r=>setTimeout(r,120));await idle(host);
   await host.locator('.quickplay-main[data-action="open"]').click();await a.waitForFunction(()=>window.BuzzyView.state.countQuestion===5&&window.BuzzyView.state.phase==='open');await idle(host);await host.waitForFunction(()=>Object.values(window.BuzzyView.state.preload.statuses).length===2&&Object.values(window.BuzzyView.state.preload.statuses).every(v=>v==='ready'));
   const cdp=await host.context().newCDPSession(host);await cdp.send('Debugger.enable');const paused=new Promise(resolve=>cdp.once('Debugger.paused',resolve));await cdp.send('Debugger.pause');await paused;
   try{
    assert.equal((await read(a,`rooms/${code}/control`)).phase,'open','Freeze must happen before the server deadline');
    const writes=traffic.value.databaseWrites;await a.waitForFunction(()=>window.BuzzyView.state.phase==='closed'&&window.BuzzyView.state.remainingAtClose===0);assert.equal(await a.locator('.coin-buzzer').getAttribute('aria-disabled'),'true');assert.equal((await read(a,`rooms/${code}/control`)).phase,'open');assert.equal(traffic.value.databaseWrites-writes,0);
    report.metrics.frozenHostPlayerDeadlineWrites=0;
   }finally{await cdp.send('Debugger.resume');await cdp.detach();}
   await host.waitForFunction(()=>window.BuzzyView.state.phase==='closed');await idle(host);
  });
  await step('Leaderboard sharing reaches player devices and can be shared again after dismissal',async()=>{
   await idle(host);await host.locator('[data-action="show-scores"]').first().click();await host.locator('[data-share-leaderboard]').check();
   await a.locator('.player-leaderboard-overlay').waitFor();await a.locator('.player-leaderboard-overlay .lb-close').click();await a.locator('.player-leaderboard-overlay').waitFor({state:'detached'});
   await host.locator('[data-share-leaderboard]').uncheck();await a.waitForFunction(()=>!window.BuzzyView.state.shareLeaderboard);await host.locator('[data-share-leaderboard]').check();await a.locator('.player-leaderboard-overlay').waitFor();
   await host.keyboard.press('Escape');await host.locator('.host-leaderboard-overlay').waitFor({state:'detached'});await a.locator('.player-leaderboard-overlay').waitFor({state:'detached'});await idle(host);
  });
  await step('Score adjustments and bans use the host UI and preserve the player identity on rejoin',async()=>{
   await b.evaluate(()=>{window.qaSounds=[];const original=window.BuzzyView.playSound;window.BuzzyView.playSound=kind=>{window.qaSounds.push(kind);original(kind);};});const uid=await identity(b),before=(await state(b)).players.find(p=>p.id===uid).score;
   await host.locator('[data-nav="players"]').click();await host.locator(`[data-action="manage:${uid}"]`).click();await host.locator(`[data-action="adjust:${uid}"]`).click();await host.locator('#adjustval').fill('2');await host.locator(`[data-action="apply-adjust:${uid}"]`).click();
   await b.waitForFunction(({id,target})=>window.BuzzyView.state.players.find(p=>p.id===id)?.score===target,{id:uid,target:before+2});await idle(host);assert.equal(await b.evaluate(()=>window.qaSounds.filter(k=>k==='correct').length),1);assert.equal((await state(b)).playerEffects[uid].points,2);
   await host.locator(`[data-action="manage:${uid}"]`).click();await host.locator(`[data-action="ban:${uid}"]`).click();await b.waitForFunction(()=>document.getElementById('network-status').textContent.includes('banned'));
   await b.locator('#leave-room').click();await b.locator('#room-code').fill(code);await b.locator('#player-name').fill('Anna');await b.locator('.join-button').click();await b.waitForFunction(()=>document.getElementById('entry-status').textContent.includes('banned'));assert.equal(new URL(b.url()).pathname,'/');
   await idle(host);await host.locator(`[data-action="unban:${uid}"]`).click();await idle(host);await b.locator('.join-button').click();await ready(b);assert.equal(await identity(b),uid);assert.equal((await state(b)).players.find(p=>p.id===uid).score,before+2);
   await host.locator('[data-nav="play"]').click();
  });
  await step('Offline/online disables and restores controls without losing the room',async()=>{
   const uid=await identity(a);await a.evaluate(async()=>{const c=await import('/src/client.js').then(m=>m.getClient());c.setOnline(false);});await a.waitForFunction(()=>document.getElementById('network-status').textContent.includes('Disconnected'));
   assert.equal(await a.locator('.coin-buzzer').getAttribute('aria-disabled'),'true');
   await a.evaluate(async()=>{const c=await import('/src/client.js').then(m=>m.getClient());c.setOnline(true);});await a.waitForFunction(()=>document.getElementById('network-status').textContent.includes('Connected'));
   assert.equal(await identity(a),uid);assert.equal((await state(a)).code,code);
   await host.evaluate(async()=>{const c=await import('/src/client.js').then(m=>m.getClient());c.setOnline(false);});await host.waitForFunction(()=>document.getElementById('network-status').textContent.includes('Disconnected'));
   await host.evaluate(async()=>{const c=await import('/src/client.js').then(m=>m.getClient());c.setOnline(true);});await host.waitForFunction(()=>document.getElementById('network-status').textContent.includes('Connected'));await idle(host);
   assert.equal(await host.locator('[data-nav="players"]').isEnabled(),true);
  });
  await step('Host-only stored round overview is readable after reload; stationary idle writes nothing',async()=>{
   await host.reload();await ready(host);await host.locator('[data-action="round-overview"]').click();await host.locator('.round-overview-sheet').waitFor();const text=await host.locator('.round-overview-sheet').textContent();assert.match(text,/Private internal title/);assert.match(text,/Attempt 1/);assert.match(text,/Attempt 2/);await host.keyboard.press('Escape');await host.locator('.round-overview-overlay').waitFor({state:'detached'});await idle(host);
   await new Promise(r=>setTimeout(r,200));const before=traffic.value.databaseWrites;await new Promise(r=>setTimeout(r,2200));assert.equal(traffic.value.databaseWrites-before,0);report.metrics.idle2200msDatabaseWrites=0;
  });
  await step('Invalid room and forged host route never fall back to a demo session',async()=>{
   const p=await page();await p.evaluate(()=>sessionStorage.setItem('buzzy-spark-ui-session',JSON.stringify({role:'player',code:'ZZZZ'})));await p.goto('http://127.0.0.1:5173/player.html');await p.waitForFunction(()=>document.getElementById('network-status').textContent.includes('no longer available'));assert.equal(await p.evaluate(()=>!!window.BuzzyView.state.networkReady),false);assert.equal((await state(p)).code,'');
   await a.evaluate(code=>sessionStorage.setItem('buzzy-spark-ui-session',JSON.stringify({role:'host',code})),code);await a.goto('http://127.0.0.1:5173/host.html');await a.waitForFunction(()=>document.getElementById('network-status').dataset.error==='true');assert.equal(await a.evaluate(()=>!!window.BuzzyView.state.networkReady),false);assert.equal((await state(a)).players.length,0);
   await p.context().close();
  });
  await step('End game deletes the room and disables remaining player controls',async()=>{
   await host.locator('[data-nav="more"]').click();host.once('dialog',d=>d.accept());await host.locator('[data-action="end-room"]').click();await host.locator('#host-entry').waitFor();await b.waitForFunction(()=>document.getElementById('network-status').dataset.error==='true');assert.equal(await b.locator('.coin-buzzer').getAttribute('aria-disabled'),'true');
  });
  assert.deepEqual(report.pageErrors,[]);assert.deepEqual(h.pageErrors,[]);report.status='passed';report.metrics.traffic=traffic.value;
 }catch(e){report.status='failed';report.error=e.stack;report.views=[];for(const context of h.browser.contexts()){for(const p of context.pages()){try{report.views.push(await p.evaluate(()=>({url:location.pathname,status:document.getElementById('network-status')?.textContent,entry:document.getElementById('entry-status')?.textContent,busy:document.documentElement.hasAttribute('data-network-busy'),phase:window.BuzzyView?.state.phase,toast:document.getElementById('toast')?.textContent,overview:window.BuzzyView?.state.roundOverviewOpen,players:window.BuzzyView?.state.players?.map(p=>({id:p.id,status:p.status})),own:window.BuzzyView?.state.viewAs,coin:document.querySelector('.coin-buzzer')?.getAttribute('aria-disabled')})));}catch{}}}throw e;}finally{await h.close();writeFileSync('reports/ui-integration.json',JSON.stringify(report,null,2)+'\n');}
});
