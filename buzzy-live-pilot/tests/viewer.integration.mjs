import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {browserHarness,read} from './browser-support.mjs';
// #347/#352: read-only viewer screen and its join screen, against the local emulators only.
const report={status:'running',checks:[],layouts:[],pageErrors:[]};
const ready=p=>p.waitForFunction(()=>window.BuzzyView?.state.networkReady&&!document.documentElement.hasAttribute('data-network-busy'));
const idle=p=>p.waitForFunction(()=>!document.documentElement.hasAttribute('data-network-busy'));
const viewerReady=p=>p.waitForFunction(()=>document.documentElement.hasAttribute('data-viewer-ready')&&!!window.BuzzyViewer.state);
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
  await viewer.locator('.viewer-question--waiting').waitFor();assert.equal(await viewer.locator('.viewer-room strong').textContent(),code);
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
  assert.equal(await viewer.locator('.viewer-question-text').count(),0,'Question text must not appear before it is shown');
  await host.locator('.quickplay-main[data-action="present"]').click();await idle(host);
  await viewer.locator('.viewer-question-text',{hasText:'What is the capital of Sweden?'}).waitFor();assert.equal(await viewer.locator('.viewer-timer').count(),0,'No countdown before the buzzers open');
  await host.locator('.quickplay-main[data-action="open"]').click();await viewer.locator('.viewer-timer').waitFor();
  const firstSeconds=Number(await viewer.locator('[data-viewer-seconds]').textContent());assert.ok(firstSeconds>0&&firstSeconds<=30,String(firstSeconds));
  await viewer.waitForFunction(s=>Number(document.querySelector('[data-viewer-seconds]').textContent)<s,firstSeconds,{timeout:4000});
  assert.match(await viewer.locator('.viewer-phase').textContent(),/Buzzers open/);
  report.checks.push('Viewer shows the question text only after the host shows it, and a running countdown');
  for(const [width,height] of [[1280,720],[1920,1080],[1024,768]]){
   await viewer.setViewportSize({width,height});await viewer.waitForTimeout(150);
   const layout=await viewer.evaluate(()=>{const q=document.querySelector('.viewer-question-text').getBoundingClientRect(),t=document.querySelector('.viewer-timer').getBoundingClientRect(),b=document.querySelector('.viewer-buzzes').getBoundingClientRect();return {width:innerWidth,height:innerHeight,overflowX:document.documentElement.scrollWidth>innerWidth+1,overflowY:document.documentElement.scrollHeight>innerHeight+1,questionFont:parseFloat(getComputedStyle(document.querySelector('.viewer-question-text')).fontSize),inside:[q,t,b].every(r=>r.left>=0&&r.top>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1),overlap:!(q.right<=b.left||t.right<=b.left)};});
   report.layouts.push(layout);assert.equal(layout.overflowX,false,JSON.stringify(layout));assert.equal(layout.overflowY,false,JSON.stringify(layout));assert.ok(layout.inside,JSON.stringify(layout));assert.equal(layout.overlap,false,JSON.stringify(layout));assert.ok(layout.questionFont>=28,JSON.stringify(layout));
   await viewer.screenshot({path:`reports/viewer-${width}x${height}.png`});
  }
  await viewer.setViewportSize({width:1280,height:720});
  report.checks.push('Large-screen layout at 1280×720, 1920×1080 and 1024×768: no overflow, question/timer/buzz list inside the screen without overlap, question text at least 28 px');

  await player.waitForFunction(()=>window.BuzzyView.state.phase==='open');await player.locator('.coin-buzzer').focus();await player.keyboard.press('Space');
  await viewer.locator('.viewer-buzz',{hasText:'Ada'}).waitFor();await host.waitForFunction(()=>['closed','locked'].includes(window.BuzzyView.state.phase));await idle(host);
  await viewer.locator('.viewer-buzz--answering',{hasText:'Ada'}).waitFor();
  await host.locator('[data-action="correct"]').first().click();await viewer.locator('.viewer-buzz--correct',{hasText:'Ada'}).waitFor();
  assert.match(await viewer.locator('.viewer-phase').textContent(),/Correct answer/);
  report.checks.push('Viewer follows buzz order with names, the player answering, and the correct-answer mark');

  // Host choices hide and show each part.
  await idle(host);await host.locator('[data-nav="more"]').click();await host.locator('[data-action="toggle-settings-section:viewer"]').click();
  await host.locator('.viewer-settings-count',{hasText:'1 screen connected'}).waitFor();await host.waitForTimeout(400);await host.locator('[data-settings-section="viewer"]').screenshot({path:'reports/host-viewer-settings-390.png'});
  assert.equal(await host.locator('.viewer-settings-actions a').getAttribute('href'),`http://127.0.0.1:5173/viewer?room=${code}`);
  await hostToggle(host,'viewerBuzzOrder',false);await viewer.waitForFunction(()=>!document.querySelector('.viewer-buzzes'));
  await hostToggle(host,'viewerQuestion',false);await viewer.waitForFunction(()=>!document.querySelector('.viewer-question-text')&&!!document.querySelector('.viewer-question--hidden'));
  await hostToggle(host,'viewerBuzzOrder',true);await hostToggle(host,'viewerQuestion',true);await viewer.locator('.viewer-buzzes').waitFor();await viewer.locator('.viewer-question-text').waitFor();
  report.checks.push('Host Settings → Viewer screen shows the screen count and link, and its switches hide and restore question and buzz order');

  await hostToggle(host,'viewerJoinScreen',true);await viewer.locator('.viewer-join-qr svg').waitFor();
  assert.equal(await viewer.locator('.viewer-join-code').textContent(),code);assert.equal(await viewer.locator('.viewer-join-url').textContent(),'127.0.0.1:5173');
  const join=await viewer.evaluate(()=>({overflowX:document.documentElement.scrollWidth>innerWidth+1,overflowY:document.documentElement.scrollHeight>innerHeight+1,qr:document.querySelector('.viewer-join-qr').getBoundingClientRect().width,controls:document.querySelectorAll('#viewer button,#viewer a,#viewer input').length}));
  assert.equal(join.overflowX,false);assert.equal(join.overflowY,false);assert.ok(join.qr>=280,JSON.stringify(join));assert.equal(join.controls,0);
  await viewer.screenshot({path:'reports/viewer-join-1280x720.png'});
  const decoded=await viewer.evaluate(async()=>{const svg=document.querySelector('.viewer-join-qr svg'),img=new Image(),blob=new Blob([new XMLSerializer().serializeToString(svg)],{type:'image/svg+xml'});img.src=URL.createObjectURL(blob);await img.decode();const canvas=document.createElement('canvas');canvas.width=canvas.height=600;const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,600,600);ctx.drawImage(img,0,0,600,600);const {default:jsQR}=await import('/node_modules/jsqr/dist/jsQR.js').catch(()=>import('jsqr'));const data=ctx.getImageData(0,0,600,600);return jsQR(data.data,600,600)?.data||null;}).catch(e=>'decode-error:'+e.message);
  if(decoded&&!decoded.startsWith('decode-error'))assert.equal(decoded,`http://127.0.0.1:5173/?room=${code}`);
  report.checks.push(`Join screen (#352) shows a scannable-size QR code, web address and room code without controls${decoded&&!decoded.startsWith('decode-error')?'; QR decodes to the player join link':''}`);
  // The sharing view toggles the same join screen.
  await host.locator('#room-share-qr').click();const viewerButton=host.locator('.room-share-viewer');await viewerButton.waitFor();
  assert.equal(await viewerButton.textContent(),'Hide from viewer screens');await viewerButton.click();await viewer.waitForFunction(()=>!document.querySelector('.viewer-join'));
  assert.equal(await viewerButton.textContent(),'Show on viewer screens');assert.match(await host.locator('.room-share-viewer-note').textContent(),/1 viewer screen connected/);
  await host.locator('.room-share-close').click();await idle(host);
  report.checks.push('Sharing view button shows and hides the join screen on viewer screens');

  // Shared leaderboard and celebration.
  await host.evaluate(()=>{const s=window.BuzzyView.state;s.hostShowResults=true;s.shareLeaderboard=true;window.BuzzyNetwork.preload();});
  await viewer.locator('.viewer-leaderboard .viewer-rank',{hasText:'Ada'}).waitFor();assert.equal(await viewer.locator('.viewer-rank').count(),1);
  await host.evaluate(()=>{const s=window.BuzzyView.state;s.hostShowResults=false;window.BuzzyNetwork.preload();});await viewer.waitForFunction(()=>!document.querySelector('.viewer-leaderboard'));
  await host.locator('[data-action="toggle-settings-section:effects"]').click();await host.locator('[data-action="celebrate"]').click();
  await viewer.waitForFunction(()=>document.getElementById('confetti').children.length===432);
  report.checks.push('Viewer shows the shared leaderboard with players only, hides it when sharing stops, and plays the celebration');

  // Seat limit, release on disconnect and re-registration after reconnect.
  const extra=[];for(let i=0;i<3;i++){const p=await page({width:1024,height:768,mobile:false,path:`/viewer?room=${code}`});await viewerReady(p);extra.push(p);}
  await host.waitForFunction(()=>window.BuzzyView.state.viewerCount===4);
  const fifth=await page({width:1024,height:768,mobile:false,path:`/viewer?room=${code}`});await fifth.locator('#viewer-status',{hasText:'All four viewer screens'}).waitFor();
  await extra[0].context().close();await host.waitForFunction(()=>window.BuzzyView.state.viewerCount===3);
  await viewer.evaluate(async()=>{const c=await import('/src/client.js').then(m=>m.getClient());c.setOnline(false);});
  await host.waitForFunction(()=>window.BuzzyView.state.viewerCount===2);
  await viewer.evaluate(async()=>{const c=await import('/src/client.js').then(m=>m.getClient());c.setOnline(true);});
  await host.waitForFunction(()=>window.BuzzyView.state.viewerCount===3);await viewerReady(viewer);await viewer.locator('.viewer-question-text').waitFor();
  report.checks.push('At most four viewer screens; a fifth gets a clear message; closing or losing a connection frees the seat and the viewer registers again after reconnecting');

  await host.locator('#leave-room').click();await host.locator('[data-action="network-confirm-exit"]').click();await host.locator('#host-entry').waitFor();
  await viewer.locator('#viewer-status',{hasText:'This game has ended'}).waitFor();
  report.checks.push('Viewer shows that the game has ended when the host ends it');
  const wrong=await page({width:1280,height:720,mobile:false,path:'/viewer'});await wrong.locator('#viewer-status',{hasText:'Open the viewer link'}).waitFor();
  assert.deepEqual(report.pageErrors,[]);report.status='passed';
 }catch(e){report.status='failed';report.error=e.stack;throw e;}
 finally{for(const c of contexts)await c.close().catch(()=>{});await h.close();writeFileSync('reports/viewer-347-352.json',JSON.stringify(report,null,2)+'\n');}
});
