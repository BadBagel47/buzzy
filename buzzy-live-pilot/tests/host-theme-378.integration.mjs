import test from 'node:test';
import assert from 'node:assert/strict';
import {browserHarness} from './browser-support.mjs';
// #378 dark host theme and Appearance card; #379 Play header row; #381 empty queue; #382/#383 viewer panel.
const ready=p=>p.waitForFunction(()=>window.BuzzyView?.state.networkReady&&!document.documentElement.hasAttribute('data-network-busy'));
const idle=p=>p.waitForFunction(()=>!document.documentElement.hasAttribute('data-network-busy'));
const luminance=p=>p.evaluate(sel=>{const m=getComputedStyle(document.querySelector(sel)).backgroundColor.match(/\d+(\.\d+)?/g).map(Number);const c=v=>{v/=255;return v<=.03928?v/12.92:((v+.055)/1.055)**2.4;};return .2126*c(m[0])+.7152*c(m[1])+.0722*c(m[2]);},'.questions-section-card');
await test('Host theme follows the device, can be chosen per device and leaves players alone',async()=>{
 const h=await browserHarness();
 try{
  const open=async(opts)=>{const c=await h.browser.newContext(opts),p=await c.newPage();p.setDefaultTimeout(15000);await p.goto('http://127.0.0.1:5173');return {c,p};};
  // Device in dark mode: the host is dark, the primary button stays blue, the player page has no host theme.
  const {c:dc,p:host}=await open({viewport:{width:390,height:844},isMobile:true,hasTouch:true,colorScheme:'dark'});
  await host.locator('#host-entry').click();await ready(host);const code=await host.evaluate(()=>BuzzyView.state.code);
  assert.equal(await host.evaluate(()=>document.documentElement.dataset.hostTheme),'dark');
  await host.locator('[data-nav="questions"]').click();await idle(host);await host.waitForTimeout(500);
  assert.ok(await luminance(host)<.06,'Cards are dark');
  const primary=await host.evaluate(()=>getComputedStyle(document.querySelector('[data-action="new-question"]')).backgroundColor.match(/\d+/g).map(Number));
  assert.ok(primary[2]>primary[0]+60,'New question stays blue: '+primary);
  // #381: an empty queue has no filter and no second help text.
  assert.equal(await host.locator('.library-filter-panel').count(),0);assert.equal(await host.locator('.questions-section-help').count(),0);
  await host.locator('.host-empty-message',{hasText:'No questions yet'}).waitFor();
  // #379: on a normal phone the Play tools share the heading row with their labels.
  await host.locator('[data-nav="play"]').click();await idle(host);await host.waitForTimeout(500);
  const row=await host.evaluate(()=>{const bar=document.querySelector('#host-view-content .appbar-play'),t=bar.querySelector('h1').getBoundingClientRect(),b=bar.querySelector('.header-round-overview').getBoundingClientRect();return {compact:bar.classList.contains('is-compact'),dy:Math.abs((t.top+t.bottom)/2-(b.top+b.bottom)/2),right:b.right<=innerWidth};});
  assert.deepEqual(row,{compact:false,dy:row.dy,right:true});assert.ok(row.dy<6,JSON.stringify(row));
  // #382/#383: no repeated subhead; the screen count sits under the buttons.
  await host.locator('#room-viewer').click();await host.locator('.studio-modal .viewer-settings').waitFor();
  assert.equal(await host.locator('.studio-modal .settings-subhead',{hasText:'Viewer screens'}).count(),0);
  const order=await host.evaluate(()=>{const m=document.querySelector('.studio-modal');return m.querySelector('.viewer-settings-actions').compareDocumentPosition(m.querySelector('.viewer-settings-count'))&Node.DOCUMENT_POSITION_FOLLOWING;});
  assert.ok(order,'Count follows the buttons');
  await host.locator('.studio-modal .studio-close').click();await host.locator('.studio-modal').waitFor({state:'detached'});
  // Appearance is the first Settings card; choosing Light sticks on this device, also after a reload.
  await host.locator('[data-nav="more"]').click();await idle(host);
  await host.locator('.settings-appearance-card').waitFor();
  assert.equal(await host.evaluate(()=>{const a=document.querySelector('.settings-appearance-card');return a.parentElement.querySelector(':scope > .card')===a;}),true,'Appearance is the first Settings card');
  await host.locator('[data-action="host-theme:light"]').click();
  await host.waitForFunction(()=>document.documentElement.dataset.hostTheme==='light');assert.equal(await host.locator('[data-action="host-theme:light"][aria-pressed="true"]').count(),1);
  await host.reload();await ready(host);assert.equal(await host.evaluate(()=>document.documentElement.dataset.hostTheme),'light');
  const {c:pc,p:player}=await open({viewport:{width:390,height:844},colorScheme:'dark'});
  await player.locator('#room-code').fill(code);await player.locator('#player-name').fill('Ada');await player.locator('.join-button').click();await ready(player);
  assert.equal(await player.evaluate(()=>document.documentElement.dataset.hostTheme??null),null,'Players are never themed by the host setting');
  assert.equal(await player.locator('#host-theme-dark').count(),0);
  await pc.close();await dc.close();
  // Device in light mode: Auto is light, Dark can be chosen; a narrow phone shows icon-only tools that keep their names.
  const {c:lc,p:light}=await open({viewport:{width:320,height:700},isMobile:true,hasTouch:true,colorScheme:'light'});
  await light.locator('#host-entry').click();await ready(light);
  assert.equal(await light.evaluate(()=>document.documentElement.dataset.hostTheme),'light');
  await light.locator('[data-nav="play"]').click();await idle(light);await light.waitForTimeout(500);
  assert.equal(await light.evaluate(()=>document.querySelector('#host-view-content .appbar-play').classList.contains('is-compact')),true);
  await light.getByRole('button',{name:'Round overview'}).first().waitFor();
  await light.locator('[data-nav="more"]').click();await idle(light);await light.locator('[data-action="host-theme:dark"]').click();
  await light.waitForFunction(()=>document.documentElement.dataset.hostTheme==='dark');
  await lc.close();
 }finally{await h.close();}
});
