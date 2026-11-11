import test from 'node:test';
import assert from 'node:assert/strict';
import {browserHarness} from './browser-support.mjs';
// #351: a question can be hidden on viewer screens while players still see it.
const ready=p=>p.waitForFunction(()=>window.BuzzyView?.state.networkReady&&!document.documentElement.hasAttribute('data-network-busy'));
const idle=p=>p.waitForFunction(()=>!document.documentElement.hasAttribute('data-network-busy'));
const viewerReady=p=>p.waitForFunction(()=>document.documentElement.hasAttribute('data-viewer-ready')&&!!window.BuzzyViewer.state);
await test('Hidden-on-viewer question shows to players but not on the viewer',async()=>{
 const h=await browserHarness();
 try{
  const open=async(opts,path='/')=>{const c=await h.browser.newContext(opts),p=await c.newPage();p.setDefaultTimeout(15000);await p.goto('http://127.0.0.1:5173'+path);return p;};
  const host=await open({viewport:{width:390,height:844},isMobile:true,hasTouch:true});await host.locator('#host-entry').click();await ready(host);
  const code=await host.evaluate(()=>window.BuzzyView.state.code);
  const player=await open({viewport:{width:390,height:844},isMobile:true,hasTouch:true});await player.locator('#room-code').fill(code);await player.locator('#player-name').fill('Ada');await player.locator('.join-button').click();await ready(player);
  const viewer=await open({viewport:{width:1280,height:720}},`/viewer?room=${code}`);await viewerReady(viewer);
  await host.locator('#room-viewer').click();await host.locator('.studio-modal [data-action="viewer-view:game"]').click();await idle(host);await host.locator('.studio-modal .studio-close').click();
  for(const [title,text,hide] of [['Hidden','Secret capital question',true],['Shown','Open capital question',false]]){
   await host.locator('[data-nav="questions"]').click();await host.locator('[data-action="new-question"]').click();await host.locator('#qtitle').fill(title);await host.locator('#qtext').fill(text);
   await host.locator('.question-editor-options > summary').click();
   if(hide)await host.locator('#qviewer').selectOption('hide');
   await host.locator('[data-action="save-question"]').click();await idle(host);
  }
  await host.locator('[data-nav="play"]').click();await host.locator('[data-action="set-play-mode:prepared"]').click();await host.locator('.quickplay-main[data-action="present"]').waitFor();await idle(host);
  await host.locator('.quickplay-main[data-action="present"]').click();await idle(host);
  await player.locator('.ph-question-inner',{hasText:'Secret capital question'}).waitFor();
  await viewer.waitForTimeout(800);
  assert.equal(await viewer.locator('#qtext:not(.muted)',{hasText:'Secret capital question'}).count(),0,'Viewer must not show the hidden question');
  assert.equal(await viewer.evaluate(()=>window.BuzzyViewer.state.settings.viewerQuestion),false);
  await host.locator('[data-action="next"]').first().click({trial:false}).catch(()=>{});
 }finally{await h.close();}
});
