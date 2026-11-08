import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {browserHarness,identity,read} from './browser-support.mjs';
const report={status:'running',checks:[],viewports:[],pageErrors:[]};
const ready=p=>p.waitForFunction(()=>window.BuzzyView?.state.networkReady&&!document.documentElement.hasAttribute('data-network-busy'));
await test('Player page and confirmed room departure share the existing dialog lifecycle',async()=>{
 const h=await browserHarness();
 try{
  async function page(){const c=await h.browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),p=await c.newPage();p.on('pageerror',e=>report.pageErrors.push(e.message));p.setDefaultTimeout(15000);await p.goto('http://127.0.0.1:5173');return p;}
  const host=await page();await host.locator('#host-entry').click();await ready(host);const code=await host.evaluate(()=>window.BuzzyView.state.code);
  const player=await page();await player.locator('#room-code').fill(code);await player.locator('#player-name').fill('Mobile player');await player.locator('.join-button').click();await ready(player);const uid=await identity(player);
  for(const width of [320,390,430,700,1280]){
   await player.setViewportSize({width,height:844});
   const box=await player.evaluate(()=>{const p=document.querySelector('.phone'),r=p.getBoundingClientRect(),b=getComputedStyle(document.body),s=getComputedStyle(p);return {width:innerWidth,height:innerHeight,bg:b.backgroundColor,border:s.borderTopWidth,radius:s.borderTopLeftRadius,left:r.left,right:r.right,bottom:r.bottom,overflow:document.documentElement.scrollWidth>innerWidth+1,header:getComputedStyle(document.querySelector('.headbar')).display};});
   assert.equal(box.bg,'rgb(11, 25, 45)');assert.equal(box.border,'0px');assert.equal(box.radius,'0px');assert.equal(box.header,'none');assert.equal(box.overflow,false);assert.ok(box.bottom>=box.height-1);if(width<=430){assert.ok(box.left<1);assert.ok(Math.abs(box.right-width)<1);}
   report.viewports.push(box);
  }
  await player.setViewportSize({width:390,height:844});await player.screenshot({path:'reports/player-full-page-295.png',fullPage:true});report.checks.push('Dark player page fills available viewport without prototype frame at 320/390/430/700/1280 widths');
  await player.locator('[data-action="network-open-leave"]').click();let dialog=player.getByRole('dialog',{name:'Leave room?'});await dialog.waitFor();assert.match(await dialog.textContent(),/continue for the other players/);
  await player.keyboard.press('Escape');await dialog.waitFor({state:'detached'});await player.waitForFunction(()=>document.activeElement===document.querySelector('[data-action="network-open-leave"]'));assert.equal(await player.evaluate(()=>window.BuzzyView.state.code),code);
  await player.locator('[data-action="network-open-leave"]').click();dialog=player.getByRole('dialog',{name:'Leave room?'});await dialog.locator('[data-action="network-confirm-exit"]').focus();
  await player.keyboard.press('Tab');assert.equal(await dialog.evaluate(e=>e.contains(document.activeElement)),true);
  await player.evaluate(()=>{window.exitDialog=document.querySelector('#modalroot .modal');});await host.locator('[data-nav="players"]').click();
  await player.evaluate(()=>window.BuzzyView.render());assert.equal(await player.evaluate(()=>window.exitDialog===document.querySelector('#modalroot .modal')),true);
  await dialog.getByRole('button',{name:'Stay in room'}).click();await dialog.waitFor({state:'detached'});assert.equal(await player.evaluate(()=>window.BuzzyView.state.code),code);
  report.checks.push('Player cancel/Escape preserve session, focus returns, Tab stays in reused modal and updates preserve its DOM');
  await player.locator('[data-action="network-open-leave"]').click();await player.locator('[data-action="network-confirm-exit"]').click();await player.locator('#host-entry').waitFor();assert.ok(await read(host,`rooms/${code}/control`));
  await player.locator('#room-code').fill(code);await player.locator('#player-name').fill('Mobile player');await player.locator('.join-button').click();await ready(player);assert.equal(await identity(player),uid);
  report.checks.push('Confirmed player leave returns to start, preserves the game, and permits same-identity rejoin');
  await host.locator('#leave-room').click();dialog=host.getByRole('dialog',{name:'End game and leave?'});await dialog.waitFor();assert.match(await dialog.textContent(),/ends the game for everyone and deletes this room/);await host.waitForTimeout(300);await host.screenshot({path:'reports/host-leave-dialog-296.png',fullPage:true});
  const dangerStyle=await dialog.locator('[data-action="network-confirm-exit"]').evaluate(e=>({color:getComputedStyle(e).color,border:getComputedStyle(e).borderTopColor}));assert.equal(dangerStyle.border,dangerStyle.color);
  await dialog.getByRole('button',{name:'Stay in room'}).click();await dialog.waitFor({state:'detached'});assert.ok(await read(host,`rooms/${code}/control`));assert.equal(await player.getByRole('dialog',{name:'Game ended'}).count(),0);
  await host.evaluate(async()=>{const c=await import('/src/client.js').then(m=>m.getClient());c.setOnline(false);});assert.equal(await player.getByRole('dialog',{name:'Game ended'}).count(),0);
  await host.evaluate(async()=>{const c=await import('/src/client.js').then(m=>m.getClient());c.setOnline(true);});await ready(host);assert.ok(await read(host,`rooms/${code}/control`));
  report.checks.push('Host cancel keeps room alive; a temporary host disconnect does not end the game');
  await host.evaluate(async()=>{const c=await import('/src/client.js').then(m=>m.getClient()),original=c.command;c.command=input=>{if(input.action==='delete')sessionStorage.setItem('deletions',String(Number(sessionStorage.getItem('deletions')||0)+1));return original(input);};});
  await host.locator('#leave-room').click();await host.locator('[data-action="network-confirm-exit"]').evaluate(b=>{b.click();b.click();});await host.locator('#host-entry').waitFor();assert.equal(await host.evaluate(()=>sessionStorage.getItem('deletions')),'1');
  const ended=player.getByRole('dialog',{name:'Game ended'});await ended.waitFor();assert.match(await ended.textContent(),/host has ended this game/);assert.match(await player.locator('#network-status').textContent(),/host has ended/);assert.equal(await player.locator('#network-retry').isVisible(),false);
  const buzz=player.locator('.coin-buzzer');if(await buzz.count())assert.equal(await buzz.getAttribute('aria-disabled'),'true');await player.waitForTimeout(300);await player.screenshot({path:'reports/player-game-ended-297.png',fullPage:true});
  await ended.getByRole('button',{name:'Back to start'}).click();await player.locator('#host-entry').waitFor();report.checks.push('Confirmed host leave deletes once, returns host, notifies player in styled modal, disables buzz and offers Back to start');
  // The separate End game control uses the same custom confirmation, never native confirm.
  let nativeDialogs=0;host.on('dialog',d=>{nativeDialogs++;d.dismiss();});await host.locator('#host-entry').click();await ready(host);await host.locator('[data-nav="more"]').click();await host.locator('[data-action="end-room"]').click();await host.getByRole('dialog',{name:'End game and leave?'}).waitFor();await host.locator('[data-action="network-confirm-exit"]').click();await host.locator('#host-entry').waitFor();assert.equal(nativeDialogs,0);report.checks.push('End game also uses the shared custom confirmation');
  assert.deepEqual(report.pageErrors,[]);report.status='passed';
 }catch(e){report.status='failed';report.error=e.stack;throw e;}finally{await h.close();writeFileSync('reports/room-exit-295-297.json',JSON.stringify(report,null,2)+'\n');}
});
