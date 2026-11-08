import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {browserHarness,identity,read,call} from './browser-support.mjs';
const report={status:'running',checks:[],realCloudRequests:0,pageErrors:[]};
const record=message=>{report.checks.push(message);console.log(message);};
const remove=async(p,code)=>{const c=await read(p,`rooms/${code}/control`);const result=await call(p,{action:'delete',code,roundId:c.r,attempt:c.a});assert.equal(result.ok,true,JSON.stringify(result));};
const ready=async p=>{try{return await p.waitForFunction(()=>window.BuzzyView?.state.networkReady&&!document.documentElement.hasAttribute('data-network-busy'),{},{timeout:30000});}catch(e){console.error('Room readiness timeout:',await p.evaluate(()=>({path:location.pathname,visibility:document.visibilityState,entry:document.querySelector('#entry-status')?.textContent,status:document.querySelector('#network-status')?.textContent,networkReady:!!window.BuzzyView?.state.networkReady,busy:document.documentElement.hasAttribute('data-network-busy')})).catch(()=>({pageUnavailable:true})));throw e;}};
await test('Network interruption restores real emulator sessions and bounded startup',async()=>{
 const h=await browserHarness();let debugPage;
 try{
  const hc=await h.browser.newContext(),pc=await h.browser.newContext();
  const sockets=[];await hc.routeWebSocket('**',ws=>{sockets.push(ws);ws.connectToServer();});
  const host=await hc.newPage(),player=await pc.newPage();debugPage=host;for(const p of [host,player])p.on('pageerror',e=>report.pageErrors.push(e.message));
  await host.goto('http://127.0.0.1:5173');await host.locator('#host-entry').click();await ready(host);
  const code=await host.evaluate(()=>window.BuzzyView.state.code),uid=await identity(host);
  await player.goto('http://127.0.0.1:5173');await player.locator('#room-code').fill(code);await player.locator('#player-name').fill('Network player');await player.locator('.join-button').click();await ready(player);const playerId=await identity(player);
  for(const [context,page,id] of [[hc,host,uid],[pc,player,playerId]]){
   await context.setOffline(true);await page.waitForFunction(()=>document.documentElement.hasAttribute('data-network-busy'));
   await context.setOffline(false);await ready(page);assert.equal(await identity(page),id);assert.equal(await page.evaluate(()=>window.BuzzyView.state.code),code);
  }
  record('Host and player: offline/online restores same identity and room');
  // A suspended host tab is not needed to restore an existing player session.
  const hostDebugger=await hc.newCDPSession(host);await hostDebugger.send('Debugger.enable');await hostDebugger.send('Debugger.pause');
  let holdPlayer=true;await pc.routeWebSocket('**',ws=>{if(holdPlayer)ws.close();else ws.connectToServer();});
  await pc.route('http://127.0.0.1:9000/**',route=>holdPlayer?route.abort():route.continue());
  try{
   const started=Date.now();await player.reload();await player.locator('#network-retry:not([hidden])').waitFor({timeout:6500});
   assert.ok(Date.now()-started<6500,'Recovery is offered before the previous 15-second wait');
   assert.match(await player.locator('#network-status').textContent(),/Still connecting/);
   holdPlayer=false;await player.locator('#network-retry').click();await ready(player);
   assert.equal(await identity(player),playerId);assert.equal(await player.evaluate(()=>window.BuzzyView.state.code),code);
  }finally{holdPlayer=false;await hostDebugger.send('Debugger.resume');await hostDebugger.detach();await pc.unroute('http://127.0.0.1:9000/**');}
  record('Slow player reload offers recovery after four seconds and restores the same session with a suspended host');
  await host.evaluate(()=>{window.onlineEvents=0;window.addEventListener('online',()=>window.onlineEvents++);});
  sockets.at(-1).close();await ready(host);assert.equal(await identity(host),uid);assert.equal(await host.evaluate(()=>window.onlineEvents),0);
  record('Socket interruption without browser online event reconnects');
  // Fail only database transport, keeping the app itself reloadable (offline cached shell).
  let block=true;await hc.route('http://127.0.0.1:9000/**',route=>block?route.abort():route.continue());await hc.routeWebSocket('**',ws=>{if(block)ws.close();else ws.connectToServer();});
  await host.reload();assert.equal(await host.locator('.headbar .tag.desktoponly').count(),0);assert.equal(await host.locator('#leave-room').getAttribute('aria-label'),'Leave room');assert.equal(await host.title(),'Buzzy · Host');
  await host.locator('#network-retry:not([hidden])').waitFor({timeout:22000});await host.waitForFunction(()=>document.querySelector('#network-status').dataset.error==='true',{},{timeout:22000});
  assert.equal(await host.locator('.headbar').textContent().then(s=>s.includes('DESIGN LAB')),false);
  block=false;await ready(host);assert.equal(await identity(host),uid);assert.equal(await host.evaluate(()=>window.BuzzyView.state.code),code);
  record('Offline reload has finite waiting and recovers the existing host automatically after a timeout');
  // A create acknowledgement lost to the browser must resolve to the same room on retry.
  const createId=crypto.randomUUID();const one=await call(host,{action:'create',commandId:createId});assert.equal(one.ok,true);const two=await call(host,{action:'create',commandId:createId});assert.equal(two.ok,true);assert.equal(one.data.code,two.data.code);
  await remove(host,one.data.code);
  record('Repeated create command after uncertain acknowledgement returns same room');
  await host.bringToFront();await host.goto('http://127.0.0.1:5173');block=true;await host.locator('#host-entry').click();await host.waitForFunction(()=>!document.querySelector('#host-entry').disabled,{},{timeout:25000});
  assert.match(await host.locator('#entry-status').textContent(),/connection|Connection/);const pendingId=await host.evaluate(()=>sessionStorage.getItem('buzzy-pending-room-create'));assert.ok(pendingId);
  block=false;await host.locator('#host-entry').click();await ready(host);assert.equal(await identity(host),uid);const freshCode=await host.evaluate(()=>window.BuzzyView.state.code);assert.notEqual(freshCode,code);assert.equal(await host.evaluate(()=>sessionStorage.getItem('buzzy-pending-room-create')),null);
  record('New room after network failure: finite wait, enabled retry and successful create');
  await remove(host,freshCode);
  // Restore the old host session solely to end that test room.
  await host.evaluate(code=>sessionStorage.setItem('buzzy-spark-ui-session',JSON.stringify({code,role:'host'})),code);await host.goto('http://127.0.0.1:5173/host.html');await ready(host);
  await remove(host,code);await host.waitForFunction(()=>document.querySelector('#network-status').textContent.includes('game has ended'));
  assert.equal(await host.locator('#network-retry').isVisible(),false);
  await host.reload();await host.waitForFunction(()=>document.querySelector('#network-status').textContent.includes('no longer available'));
  await host.locator('#network-retry').click();await host.waitForFunction(()=>document.querySelector('#network-status').textContent.includes('no longer available'));
  assert.equal(await read(host,`rooms/${code}/control`),null);record('Ended room gives an explicit notice, reload/retry never recreates it');
  const ac=await h.browser.newContext(),authPage=await ac.newPage();let releaseAuth,holdAuth=true;
  await ac.route('http://127.0.0.1:9099/**',async route=>{if(holdAuth&&route.request().url().includes('signUp')){await new Promise(resolve=>{releaseAuth=resolve;});}await route.continue();});
  await authPage.goto('http://127.0.0.1:5173');await authPage.locator('#host-entry').click();
  await authPage.waitForFunction(()=>!document.querySelector('#host-entry').disabled,{},{timeout:22000});assert.match(await authPage.locator('#entry-status').textContent(),/taking too long/);
  assert.ok(releaseAuth);holdAuth=false;releaseAuth();await authPage.locator('#host-entry').click();await ready(authPage);
  const authCode=await authPage.evaluate(()=>window.BuzzyView.state.code);await remove(authPage,authCode);
  record('Stalled authentication has a finite wait and retry recovers without cached initialization failure');
  assert.deepEqual(report.pageErrors,[]);report.status='passed';
 }catch(e){report.status='failed';report.error=e.stack;report.ui=await debugPage?.evaluate(()=>({url:location.href,entry:document.querySelector('#entry-status')?.textContent,status:document.querySelector('#network-status')?.textContent,ready:window.BuzzyView?.state.networkReady})).catch(()=>null);throw e;}finally{await h.close();writeFileSync('reports/reconnect-293.json',JSON.stringify(report,null,2)+'\n');}
});
