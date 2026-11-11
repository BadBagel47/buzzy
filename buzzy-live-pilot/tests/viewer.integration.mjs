import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {browserHarness,read} from './browser-support.mjs';
// #347/#352: read-only viewer screen and its join screen, against the local emulators only.
const report={status:'running',checks:[],layouts:[],pageErrors:[]};
const ready=p=>p.waitForFunction(()=>window.BuzzyView?.state.networkReady&&!document.documentElement.hasAttribute('data-network-busy'));
const idle=p=>p.waitForFunction(()=>!document.documentElement.hasAttribute('data-network-busy'));
const viewerReady=p=>p.waitForFunction(()=>document.documentElement.hasAttribute('data-viewer-ready')&&!!window.BuzzyViewer.state);
const innerWidthTolerance=()=>40;
async function hostToggle(host,key,checked){
 const box=host.locator(`[data-toggle="${key}"]`);
 if(await box.isChecked()!==checked)await box.click();
 await host.waitForFunction(([k,v])=>window.BuzzyView.state[k]===v,[key,checked]);await idle(host);
}
await test('Viewer screen shows the host-selected question state without becoming a player',async()=>{
 const h=await browserHarness();
 const contexts=[];
 try{
  async function page({width=390,height=844,mobile=true,path='/'}={}){const c=await h.browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile});contexts.push(c);const p=await c.newPage();p.on('pageerror',e=>report.pageErrors.push(e.message));p.setDefaultTimeout(15000);await p.goto(`http://127.0.0.1:5173${path}`);return p;}
  const host=await page();await host.locator('#host-entry').click();await ready(host);const code=await host.evaluate(()=>window.BuzzyView.state.code);
  const player=await page();await player.locator('#room-code').fill(code);await player.locator('#player-name').fill('Ada');await player.locator('.join-button').click();await ready(player);

  const viewer=await page({width:1280,height:720,mobile:false,path:`/viewer?room=${code}`});await viewerReady(viewer);
  // A new viewer starts switched off and shows only the logo until the host turns it on (#355/#356).
  await viewer.locator('#v-off.on .logo-big').waitFor();assert.equal(await viewer.locator('#topbar.on').count(),0);
  await viewer.waitForTimeout(1100);
  const logo=await viewer.evaluate(()=>{const r=document.querySelector('.logo-big').getBoundingClientRect();return {center:((r.top+r.bottom)/2)/innerHeight*100,mid:Math.abs((r.left+r.right)/2-innerWidth/2)};});
  assert.ok(logo.center>38&&logo.center<48&&logo.mid<innerWidthTolerance(),JSON.stringify(logo));
  // The header button opens the viewer settings over the current view (#356); a new viewer starts in Standby (#370).
  await host.locator('#room-viewer').click();await host.locator('.studio-modal [data-action="viewer-view:standby"][aria-pressed="true"]').waitFor();
  assert.equal(await host.locator('#host-view-content .appbar h1').isVisible(),true,'The panel opens over the current view');
  assert.ok(await host.locator('.studio-modal [data-toggle="viewerTimer"]').count()===1,'Game settings are shown even in Standby');
  await host.locator('.studio-modal [data-action="viewer-view:game"]').click();await host.locator('.studio-modal [data-action="viewer-view:game"][aria-pressed="true"]').waitFor();await idle(host);
  await host.locator('.studio-modal .studio-close').click();await host.locator('.studio-modal').waitFor({state:'detached'});
  // Before the first question the viewer shows what the players see (#376).
  await viewer.locator('#v-game.on #qtext.muted').waitFor();
  const playerText=(await player.locator('.ph-question-inner p').first().textContent()).trim();
  assert.equal((await viewer.locator('#qtext').textContent()).trim(),playerText,'Viewer and players show the same text before the first question');
  assert.notEqual(playerText,'Get ready for the next question');assert.equal(await viewer.locator('.room strong').textContent(),code);
  await host.locator('[data-nav="play"]').click();await idle(host);
  await host.waitForFunction(()=>window.BuzzyView.state.viewerCount===1);
  assert.equal(Object.keys(await read(host,`rooms/${code}/members`)).length,1);assert.equal(Object.keys(await read(host,`rooms/${code}/seats`)).length,1);
  assert.equal(await host.evaluate(()=>window.BuzzyView.state.players.length),1);assert.equal(await player.evaluate(()=>window.BuzzyView.state.players.length),1);
  report.checks.push('Viewer opens from /viewer?room=CODE, takes a viewer seat but no player seat, member or score; host sees one connected screen');

  // A viewer may only read round data. It cannot change game state or read host-only data.
  const denied=await viewer.evaluate(async code=>{
   const c=await import('/src/client.js').then(m=>m.getClient()),{ref,set,update}=await import('/tests/raw-client.js');
   const attempt=async fn=>{try{await fn();return 'allowed';}catch(e){return e.code||e.message;}};
   return {
    control:await attempt(()=>update(ref(c.db,`rooms/${code}/control`),{phase:'open'})),
    score:await attempt(()=>set(ref(c.db,`rooms/${code}/scores/${c.uid}`),5)),
    member:await attempt(()=>set(ref(c.db,`rooms/${code}/members/${c.uid}`),{name:'Sneaky'})),
    settings:await attempt(()=>set(ref(c.db,`rooms/${code}/settings/viewerTimer`),false)),
    meta:await attempt(()=>c.read(`rooms/${code}/meta`)),
    priv:await attempt(()=>c.read(`rooms/${code}/private`)),
    archive:await attempt(()=>c.read(`rooms/${code}/archive`)),
    viewers:await attempt(()=>c.read(`rooms/${code}/viewers`)),
   };
  },code);
  for(const [k,v] of Object.entries(denied))assert.notEqual(v,'allowed',`viewer ${k} access must be denied: ${JSON.stringify(denied)}`);
  const outsider=await page();const unregistered=await outsider.evaluate(async code=>{const c=await import('/src/client.js').then(m=>m.getClient());try{await c.read(`rooms/${code}/presentation`);return 'allowed';}catch(e){return e.code||e.message;}},code);
  assert.notEqual(unregistered,'allowed');
  report.checks.push('Viewer is denied writes to control, scores, members and settings and reads of meta, private, archive and the viewer list; an unregistered user cannot read the question');

  // Prepared timed question with a visible timer.
  await host.locator('[data-nav="questions"]').click();await host.locator('[data-action="new-question"]').click();await host.locator('#qtitle').fill('Capital');await host.locator('#qtext').fill('What is the capital of Sweden?');
  await host.locator('.question-editor-options > summary').click();await host.locator('#qmode').selectOption('timed');await host.locator('#qtimer').selectOption('30');await host.locator('[data-action="save-question"]').click();await idle(host);
  await host.locator('[data-nav="play"]').click();await host.locator('[data-action="set-play-mode:prepared"]').click();await host.locator('.quickplay-main[data-action="present"]').waitFor();await idle(host);
  assert.equal(await viewer.locator('#qtext:not(.muted)').count(),0,'Question text must not appear before it is shown');
  await host.locator('.quickplay-main[data-action="present"]').click();await idle(host);
  await viewer.locator('#qtext:not(.muted)',{hasText:'What is the capital of Sweden?'}).waitFor();assert.equal(await viewer.locator('#timer.on').count(),0,'No countdown before the buzzers open');
  await host.locator('.quickplay-main[data-action="open"]').click();await viewer.locator('#timer.on').waitFor();
  const firstSeconds=Number(await viewer.locator('#num').textContent());assert.ok(firstSeconds>0&&firstSeconds<=30,String(firstSeconds));
  await viewer.waitForFunction(s=>Number(document.querySelector('#num').textContent)<s,firstSeconds,{timeout:4000});
  // The ring drains smoothly: its offset keeps changing between frames, not once a second.
  const offsets=await viewer.evaluate(()=>new Promise(res=>{const o=[],bar=document.getElementById('bar');let n=0;(function f(){o.push(parseFloat(getComputedStyle(bar).strokeDashoffset));if(++n<12)requestAnimationFrame(f);else res(o);})();}));
  assert.ok(new Set(offsets.map(v=>v.toFixed(2))).size>=6,'Countdown ring should move continuously: '+JSON.stringify(offsets));
  report.checks.push('Viewer shows the question text only after the host shows it, and a smoothly draining countdown');
  for(const [width,height] of [[1280,720],[1920,1080],[1024,768]]){
   await viewer.setViewportSize({width,height});await viewer.waitForTimeout(150);
   const layout=await viewer.evaluate(()=>{const g=sel=>document.querySelector(sel).getBoundingClientRect(),q=g('#qtext'),t=g('#timer .ring'),room=g('.topbar .room');return {width:innerWidth,height:innerHeight,overflowX:document.documentElement.scrollWidth>innerWidth+1,overflowY:document.documentElement.scrollHeight>innerHeight+1,questionFont:parseFloat(getComputedStyle(document.getElementById('qtext')).fontSize),inside:[q,t].every(r=>r.left>=0&&r.top>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1),clearOfRoom:q.top>room.bottom,textCenterPct:Math.round(((q.top+q.bottom)/2)/innerHeight*100)};});
   report.layouts.push(layout);assert.equal(layout.overflowX,false,JSON.stringify(layout));assert.equal(layout.overflowY,false,JSON.stringify(layout));assert.ok(layout.inside,JSON.stringify(layout));assert.ok(layout.clearOfRoom,JSON.stringify(layout));assert.ok(layout.questionFont>=28,JSON.stringify(layout));assert.ok(layout.textCenterPct>=30&&layout.textCenterPct<=52,JSON.stringify(layout));
   await viewer.screenshot({path:`reports/viewer-${width}x${height}.png`});
  }
  await viewer.setViewportSize({width:1280,height:720});
  report.checks.push('Large-screen layout at 1280×720, 1920×1080 and 1024×768: no overflow, text and countdown inside the screen and below the room code, question text at least 28 px and its centre in the upper middle');

  await player.waitForFunction(()=>window.BuzzyView.state.phase==='open');await player.locator('.coin-buzzer').focus();await player.keyboard.press('Space');
  await viewer.locator('#striplist .chipb',{hasText:'Ada'}).waitFor();
  // Everyone has buzzed: the countdown folds away, the strip slides down and the list slides in on the right.
  await host.waitForFunction(()=>['closed','locked'].includes(window.BuzzyView.state.phase));await idle(host);
  await viewer.waitForFunction(()=>!document.getElementById('timer').classList.contains('on'));
  await viewer.locator('#buzzlist .row.turn',{hasText:'Ada'}).waitFor();await viewer.waitForFunction(()=>document.getElementById('main').classList.contains('res'));
  await host.locator('[data-action="correct"]').first().click();await viewer.locator('#buzzlist .row.ok',{hasText:'Ada'}).waitFor();
  await viewer.locator('.trail').waitFor();assert.ok(await viewer.locator('.trail i').count()>=20,'A glittering trail with sparks runs around the correct answer');
  const okBox=await viewer.evaluate(()=>{const r=document.querySelector('#buzzlist .row.ok'),n=r.querySelector('.n').getBoundingClientRect();return {tag:r.querySelector('.tag').textContent,fontPx:parseFloat(getComputedStyle(r).fontSize),otherPx:parseFloat(getComputedStyle(document.querySelector('.panel h2')).fontSize),nameWidthOk:n.width>0};});
  assert.match(okBox.tag,/Correct/);assert.ok(okBox.fontPx>okBox.otherPx*1.2,'The correct answer keeps its large box: '+JSON.stringify(okBox));
  report.checks.push('Viewer follows buzz order: strip while buzzers are open, countdown folds away when everyone has buzzed, list on the right with the player answering, and a glittering trail around the correct answer');

  // Host choices hide and show each part.
  await idle(host);await host.locator('#room-viewer').click();await host.locator('.studio-modal .viewer-settings').waitFor();
  await host.locator('.studio-modal .viewer-settings-count',{hasText:'1 screen connected'}).waitFor();await host.waitForTimeout(400);await host.locator('.studio-modal').screenshot({path:'reports/host-viewer-settings-390.png'});
  assert.equal(await host.locator('.studio-modal .viewer-settings-actions a').getAttribute('href'),`http://127.0.0.1:5173/viewer?room=${code}`);
  await hostToggle(host,'viewerBuzzOrder',false);await viewer.waitForFunction(()=>!document.querySelector('#buzzlist .row')&&!document.getElementById('main').classList.contains('res'));
  await hostToggle(host,'viewerQuestion',false);await viewer.waitForFunction(()=>document.getElementById('qtext').hidden);
  await hostToggle(host,'viewerQuestionNumber',false);await viewer.waitForFunction(()=>document.getElementById('qnum').hidden);
  await hostToggle(host,'viewerQuestionNumber',true);await viewer.waitForFunction(()=>!document.getElementById('qnum').hidden);
  await hostToggle(host,'viewerBuzzOrder',true);await hostToggle(host,'viewerQuestion',true);await viewer.locator('#buzzlist .row',{hasText:'Ada'}).waitFor();await viewer.locator('#qtext:not([hidden])').waitFor();
  report.checks.push('Host Settings → Viewer screen shows the screen count and link, and its switches hide and restore question and buzz order');

  await host.locator('[data-action="viewer-view:join"]').click();await idle(host);await viewer.locator('#v-join.on #qr svg').waitFor();
  assert.equal(await viewer.locator('.jcode').textContent(),code);assert.equal(await viewer.locator('.jurl').textContent(),'127.0.0.1:5173');
  assert.equal(await viewer.locator('#jcount').textContent(),'1');await viewer.locator('#chips .chip',{hasText:'Ada'}).waitFor();
  await viewer.waitForTimeout(900);
  const join=await viewer.evaluate(()=>({overflowX:document.documentElement.scrollWidth>innerWidth+1,overflowY:document.documentElement.scrollHeight>innerHeight+1,qr:document.querySelector('#qr').getBoundingClientRect().width,heading:parseFloat(getComputedStyle(document.querySelector('.join h1')).fontSize),controls:document.querySelectorAll('#viewer button,#viewer a,#viewer input').length}));
  assert.equal(join.overflowX,false);assert.equal(join.overflowY,false);assert.ok(join.qr>=260,JSON.stringify(join));assert.ok(join.heading>=70,JSON.stringify(join));assert.equal(join.controls,0);
  await viewer.screenshot({path:'reports/viewer-join-1280x720.png'});
  const decoded=await viewer.evaluate(async()=>{const svg=document.querySelector('#qr svg'),img=new Image(),blob=new Blob([new XMLSerializer().serializeToString(svg)],{type:'image/svg+xml'});img.src=URL.createObjectURL(blob);await img.decode();const canvas=document.createElement('canvas');canvas.width=canvas.height=600;const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,600,600);ctx.drawImage(img,0,0,600,600);const {default:jsQR}=await import('/node_modules/jsqr/dist/jsQR.js').catch(()=>import('jsqr'));const data=ctx.getImageData(0,0,600,600);return jsQR(data.data,600,600)?.data||null;}).catch(e=>'decode-error:'+e.message);
  if(decoded&&!decoded.startsWith('decode-error'))assert.equal(decoded,`http://127.0.0.1:5173/?room=${code}`);
  report.checks.push(`Join screen (#352) shows a scannable-size QR code, web address and room code without controls${decoded&&!decoded.startsWith('decode-error')?'; QR decodes to the player join link':''}`);
  // The header button opens the viewer settings; the sharing view has no viewer controls any more (#356, #357).
  await host.locator('.studio-modal [data-action="viewer-view:game"]').click();await idle(host);await viewer.waitForFunction(()=>document.getElementById('v-game').classList.contains('on'));
  await host.locator('.studio-modal .studio-close').click();await host.locator('.studio-modal').waitFor({state:'detached'});
  await host.locator('[data-nav="play"]').click();await idle(host);
  assert.equal(await host.locator('#room-viewer').getAttribute('data-live'),'');
  await host.locator('[data-nav="more"]').click();assert.equal(await host.locator('[data-settings-section="viewer"]').count(),0,'Viewer settings live in the header panel only');await host.locator('[data-action="toggle-settings-section:display"]').click();await host.locator('[data-settings-section="display"][open] .switchrow').first().waitFor();
  // #359: on a wide screen the explanation texts in Settings use the available width instead of wrapping at 260 px.
  await host.setViewportSize({width:1440,height:900});await host.waitForTimeout(400);
  const settingsText=await host.evaluate(()=>{const spans=[...document.querySelectorAll('.settings-main-card .switchrow > span')].filter(e=>e.getBoundingClientRect().width>0);return {max:Math.round(Math.max(...spans.map(e=>e.getBoundingClientRect().width))),count:spans.length};});
  assert.ok(settingsText.count>3&&settingsText.max>300,'Settings texts should be wider than 300 px on a wide screen: '+JSON.stringify(settingsText));
  await host.screenshot({path:'reports/host-settings-wide-1440x900.png'});
  assert.ok(await host.evaluate(()=>document.querySelector('[data-nav="more"] svg path').getAttribute('d').startsWith('M4 7h9')),'Settings uses the sliders icon');
  await host.locator('#room-share-qr').click();const share=host.locator('.room-share-screen');await share.locator('.room-share-code').waitFor();
  assert.equal(await share.locator('.room-share-viewer,.room-share-viewer-note,.room-share-notice').count(),0,'Viewer button and notice text are gone from the sharing view');
  assert.equal(await share.locator('.room-share-copy').count(),1);assert.equal(await share.locator('.brand').count(),0);
  const bar=await share.evaluate(d=>{const c=d.querySelector('.room-share-copy').getBoundingClientRect(),x=d.querySelector('.room-share-close').getBoundingClientRect();const mid=(e,sel)=>{const b=e.getBoundingClientRect(),i=e.querySelector(sel).getBoundingClientRect();return Math.abs((b.left+b.right)/2-(i.left+i.right)/2)+Math.abs((b.top+b.bottom)/2-(i.top+i.bottom)/2);};return {sameSize:Math.round(c.width)===Math.round(x.width)&&Math.round(c.height)===Math.round(x.height),leftOfClose:c.right<=x.left,centered:Math.max(mid(d.querySelector('.room-share-copy'),'svg'),mid(d.querySelector('.room-share-close'),'svg')),h1:parseFloat(getComputedStyle(d.querySelector('h1')).fontSize)};});
  assert.ok(bar.sameSize&&bar.leftOfClose&&bar.centered<1.5&&bar.h1>=36,JSON.stringify(bar));
  await host.setViewportSize({width:1440,height:900});await host.waitForTimeout(300);
  const wide=await share.evaluate(d=>{const g=s=>d.querySelector(s).getBoundingClientRect(),q=g('.room-share-qr'),c=g('.room-share-code');return {qrLeftOfCode:q.right<=c.left,qr:Math.round(q.width),overflow:d.scrollHeight>d.clientHeight+1,fits:[q,c].every(r=>r.top>=0&&r.bottom<=innerHeight)};});
  assert.ok(wide.qrLeftOfCode&&wide.fits&&!wide.overflow&&wide.qr>=400,JSON.stringify(wide));await host.screenshot({path:'reports/host-qr-desktop-1440x900.png'});
  await host.locator('.room-share-close').click();await host.setViewportSize({width:390,height:844});await idle(host);
  report.checks.push('Header viewer button opens the Viewer screen section; the sharing view has only QR, address, room code and Copy room link, with the QR beside the text on a wide screen');

  // Shared leaderboard and celebration.
  // Leaderboard is a viewer mode of its own (#355): it can be shown on viewer screens only, without sharing it with players.
  await host.evaluate(()=>{const s=window.BuzzyView.state;s.hostShowResults=true;s.shareLeaderboard=true;window.BuzzyNetwork.preload();});await idle(host);
  await viewer.waitForTimeout(800);assert.equal(await viewer.evaluate(()=>document.getElementById('v-game').classList.contains('on')),true,'Sharing with players does not change the viewer mode');
  await host.evaluate(()=>{const s=window.BuzzyView.state;s.hostShowResults=false;window.BuzzyNetwork.preload();});await idle(host);
  await host.locator('#room-viewer').click();await host.locator('.studio-modal .viewer-settings').waitFor();await host.locator('.studio-modal [data-action="viewer-view:leaderboard"]').click();await idle(host);
  await viewer.locator('#v-lb.on #lblist .row',{hasText:'Ada'}).waitFor();assert.equal(await viewer.locator('#lblist .row').count(),1);const lbWidth=await viewer.evaluate(()=>document.querySelector('.lb').getBoundingClientRect().width/innerWidth);assert.ok(lbWidth<.5,'Leaderboard is narrow: '+lbWidth);
  assert.equal(await player.evaluate(()=>!!window.BuzzyView.state.hostShowResults),false,'Players do not see the viewer-only leaderboard');
  await host.locator('.studio-modal [data-action="viewer-view:game"]').click();await idle(host);await viewer.waitForFunction(()=>document.getElementById('v-game').classList.contains('on'));
  // Standby shows only the logo again.
  await host.locator('.studio-modal [data-action="viewer-view:standby"]').click();await idle(host);await viewer.locator('#v-off.on').waitFor();
  await host.locator('.studio-modal [data-action="viewer-view:game"]').click();await idle(host);await viewer.locator('#v-game.on').waitFor();
  await host.locator('.studio-modal .studio-close').click();await host.locator('.studio-modal').waitFor({state:'detached'});
  await host.locator('[data-action="toggle-settings-section:effects"]').click();await host.locator('[data-action="celebrate"]').click();
  await viewer.waitForFunction(()=>document.getElementById('confetti').children.length===432);
  report.checks.push('Viewer modes: leaderboard can be shown on viewer screens only (players unaffected), Game returns, Viewer off shows only the logo; celebration plays');

  // A new player joining shows as a notice at the top left, sliding in and fading out again.
  const late=await page();await late.locator('#room-code').fill(code);await late.locator('#player-name').fill('Linus');await late.locator('.join-button').click();await ready(late);
  const note=viewer.locator('#notes .jn',{hasText:'Linus joined'});await note.waitFor();
  const noteBox=await viewer.evaluate(()=>{const n=document.querySelector('#notes .jn').getBoundingClientRect(),r=document.querySelector('.topbar .room').getBoundingClientRect();return {left:n.left,roomLeft:r.left,top:n.top};});
  assert.ok(noteBox.left<noteBox.roomLeft&&noteBox.top<200,JSON.stringify(noteBox));
  await viewer.waitForFunction(()=>!document.querySelector('#notes .jn'),null,{timeout:8000});
  report.checks.push('A new player shows as a short "joined" notice at the top left and disappears by itself');

  // Seat limit, release on disconnect and re-registration after reconnect.
  const extra=[];for(let i=0;i<3;i++){const p=await page({width:1024,height:768,mobile:false,path:`/viewer?room=${code}`});await viewerReady(p);extra.push(p);}
  await host.waitForFunction(()=>window.BuzzyView.state.viewerCount===4);
  const fifth=await page({width:1024,height:768,mobile:false,path:`/viewer?room=${code}`});await fifth.locator('#viewer-status',{hasText:'All four viewer screens'}).waitFor();
  await extra[0].context().close();await host.waitForFunction(()=>window.BuzzyView.state.viewerCount===3);
  await viewer.evaluate(async()=>{const c=await import('/src/client.js').then(m=>m.getClient());c.setOnline(false);});
  await host.waitForFunction(()=>window.BuzzyView.state.viewerCount===2);
  await viewer.evaluate(async()=>{const c=await import('/src/client.js').then(m=>m.getClient());c.setOnline(true);});
  await host.waitForFunction(()=>window.BuzzyView.state.viewerCount===3);await viewerReady(viewer);await viewer.locator('#qtext').waitFor();
  report.checks.push('At most four viewer screens; a fifth gets a clear message; closing or losing a connection frees the seat and the viewer registers again after reconnecting');

  await host.locator('#leave-room').click();await host.locator('[data-action="network-confirm-exit"]').click();await host.locator('#host-entry').waitFor();
  await viewer.locator('#viewer-status',{hasText:'This game has ended'}).waitFor();
  report.checks.push('Viewer shows that the game has ended when the host ends it');
  const wrong=await page({width:1280,height:720,mobile:false,path:'/viewer'});await wrong.locator('#viewer-status',{hasText:'Open the viewer link'}).waitFor();
  assert.deepEqual(report.pageErrors,[]);report.status='passed';
 }catch(e){report.status='failed';report.error=e.stack;throw e;}
 finally{for(const c of contexts)await c.close().catch(()=>{});await h.close();writeFileSync('reports/viewer-347-352.json',JSON.stringify(report,null,2)+'\n');}
});
