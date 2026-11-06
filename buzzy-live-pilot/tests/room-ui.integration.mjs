import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import jsQR from 'jsqr';
import {browserHarness} from './browser-support.mjs';
const report={status:'running',checks:[],layouts:[],errors:[]};
const ready=p=>p.waitForFunction(()=>window.BuzzyView?.state.networkReady&&!document.documentElement.hasAttribute('data-network-busy'));
await test('UI batch: compact host, real sharing QR, fluid player and viewport transitions',async()=>{
 const h=await browserHarness();
 try{
  const host=await h.page();host.on('pageerror',e=>report.errors.push(e.message));await host.locator('#host-entry').click();await ready(host);const code=await host.evaluate(()=>window.BuzzyView.state.code);
  await host.locator('[data-nav="questions"]').click();await host.locator('[data-action="new-question"]').click();await host.locator('#qtitle').fill('UI sample question');await host.locator('#qtext').fill('A prepared question for typography review');await host.locator('[data-action="save-question"]').click();await ready(host);
  for(const width of [320,390,430,768,1280]){
   await host.setViewportSize({width,height:844});
   const header=await host.evaluate(()=>{const h=document.querySelector('.headbar').getBoundingClientRect();return {width:innerWidth,height:h.height,overflow:document.documentElement.scrollWidth>innerWidth+1,buttons:[...document.querySelectorAll('.room-header-actions button')].map(b=>{const r=b.getBoundingClientRect();return {x:r.x,right:r.right,width:r.width,height:r.height};}),labels:[...document.querySelectorAll('.headbar .tag')].map(b=>b.textContent),statuses:document.querySelectorAll('#network-status').length};});
   assert.equal(header.overflow,false);assert.equal(header.statuses,1);assert.deepEqual(header.labels,[]);assert.ok(header.height<=86,JSON.stringify(header));for(const b of header.buttons){assert.ok(b.width>=44&&b.height>=44&&b.x>=0&&b.right<=width,JSON.stringify(header));}report.layouts.push({host:header});
  }
  await host.setViewportSize({width:390,height:844});await host.locator('[data-nav="players"]').click();await host.waitForTimeout(350);
  report.smallText=[];
  for(const tab of ['play','players','questions','more']){
   await host.locator(`[data-nav="${tab}"]`).click();await host.waitForTimeout(350);
   report.smallText.push(...await host.evaluate(()=>(()=>{const walker=document.createTreeWalker(document.querySelector('#hostcontent'),NodeFilter.SHOW_TEXT),found=[];let n;while(n=walker.nextNode()){if(!n.textContent.trim())continue;const e=n.parentElement,range=document.createRange();range.selectNodeContents(n);if(range.getBoundingClientRect().width>0&&parseFloat(getComputedStyle(e).fontSize)<14)found.push({tag:e.tagName,classes:e.className,text:n.textContent.trim().slice(0,60),size:getComputedStyle(e).fontSize});}return found;})()));
  }
  assert.deepEqual(report.smallText,[],'All host views must use the shared secondary text minimum');
  await host.locator('[data-nav="players"]').click();await host.waitForTimeout(350);
  const fonts=await host.evaluate(()=>[...document.querySelectorAll('#host-view-content .sm,.nav button')].map(e=>({text:e.textContent.trim().slice(0,55),size:parseFloat(getComputedStyle(e).fontSize)})));
  assert.ok(fonts.length>=4);assert.ok(fonts.every(f=>f.size>=14),JSON.stringify(fonts));
  await host.locator('[data-nav="more"]').click();await host.waitForTimeout(350);
  const settings=await host.evaluate(()=>{const e=document.querySelector('.settings-room-card');return {heading:e.querySelector('h2').textContent,size:getComputedStyle(e.querySelector('h2')).fontSize,other:getComputedStyle(document.querySelector('.settings-main-card h2')).fontSize,values:[...e.querySelectorAll('.stat,.expire')].map(v=>({size:getComputedStyle(v).fontSize,spacing:getComputedStyle(v).letterSpacing,text:v.textContent}))};});
  assert.equal(settings.heading,'Room information');assert.equal(settings.size,settings.other);assert.equal(settings.values[0].size,settings.values[1].size);assert.ok(settings.values.every(v=>v.spacing==='normal'));report.checks.push({hostTypography:fonts,settings});
  await host.screenshot({path:'reports/host-ui-batch-settings.png',fullPage:true});
  for(const selector of ['#room-share-qr','[data-action="qr"]']){
   await host.locator(selector).click();const share=host.locator('.room-share-screen');await share.locator('svg').last().waitFor();await host.waitForFunction(()=>!!document.querySelector('.room-share-qr svg'));
   const qr=await share.locator('.room-share-qr svg').evaluate(async svg=>{const source=new XMLSerializer().serializeToString(svg),img=new Image();img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(source);await img.decode();const canvas=document.createElement('canvas');canvas.width=canvas.height=600;const c=canvas.getContext('2d');c.drawImage(img,0,0,600,600);return [...c.getImageData(0,0,600,600).data];});
   const decoded=jsQR(Uint8ClampedArray.from(qr),600,600);assert.equal(decoded?.data,`http://127.0.0.1:5173/?room=${code}`);
   assert.equal(await share.locator('.room-share-code').textContent(),code);
   const geometry=await share.evaluate(d=>{const r=d.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,topLayer:d.matches(':modal'),bg:getComputedStyle(d).backgroundColor};});assert.deepEqual([geometry.x,geometry.y,geometry.w,geometry.h],[0,0,390,844]);assert.equal(geometry.topLayer,true);
   await host.context().grantPermissions(['clipboard-read','clipboard-write']);await share.locator('.room-share-copy').click();assert.equal(await host.evaluate(()=>navigator.clipboard.readText()),`http://127.0.0.1:5173/?room=${code}`);
   await host.keyboard.press('Tab');assert.ok(await share.evaluate(d=>d.contains(document.activeElement)));await host.screenshot({path:'reports/host-ui-batch-qr.png'});await host.evaluate(()=>window.BuzzyView.render());await host.keyboard.press('Escape');await share.waitFor({state:'detached'});assert.equal(await host.locator(selector).evaluate(e=>e===document.activeElement),true);
  }
  report.checks.push('Header and Settings open the same opaque full-screen QR, independently decoded to real room URL; copy/Escape/focus verified');
  // Inspect paused incoming animation: its travel equals the viewport, not the cards.
  await host.evaluate(()=>{window.BuzzyView.handle('unused');document.querySelector('[data-nav="players"]').click();const el=document.querySelector('#host-view-content');for(const a of el.getAnimations({subtree:true})){a.pause();a.currentTime=0;}});
  const movement=await host.evaluate(()=>{const incoming=document.querySelector('.host-push-incoming'),card=incoming.querySelector('.card'),anim=incoming.getAnimations()[0];return {frames:anim.effect.getKeyframes().map(f=>f.transform),overflow:getComputedStyle(incoming.parentElement).overflowX,relative:card.getBoundingClientRect().left-incoming.getBoundingClientRect().left};});assert.ok(movement.frames.includes('translateX(-390px)'),JSON.stringify(movement));assert.equal(movement.overflow,'visible');assert.ok(movement.relative<1);
  await host.evaluate(()=>document.querySelectorAll('#host-view-content *').forEach(e=>e.getAnimations().forEach(a=>a.finish())));
  await host.locator('[data-nav="questions"]').click();await host.locator('[data-nav="play"]').click();await host.waitForTimeout(400);assert.equal(await host.locator('.host-push-incoming').count(),0);
  await host.emulateMedia({reducedMotion:'reduce'});await host.locator('[data-nav="players"]').click();assert.equal(await host.locator('.host-push-incoming').count(),0);await host.emulateMedia({reducedMotion:'no-preference'});report.checks.push('Viewport-distance transition, whole-view movement, rapid navigation cleanup and reduced motion verified');
  const player=await h.page();player.on('pageerror',e=>report.errors.push(e.message));await player.locator('#room-code').fill(code);await player.locator('#player-name').fill('Mobile player');await player.locator('.join-button').click();await ready(player);
  for(const [width,height] of [[320,640],[390,600],[390,844],[430,932],[768,1024],[844,390]]){
   await player.setViewportSize({width,height});await player.waitForTimeout(100);
   const layout=await player.evaluate(()=>{const r=e=>{const b=e.getBoundingClientRect();return {x:b.x,y:b.y,w:b.width,h:b.height,bottom:b.bottom};};return {width:innerWidth,height:innerHeight,phone:r(document.querySelector('.phone')),question:r(document.querySelector('.ph-question')),buzz:r(document.querySelector('.coin-buzzer')),feed:r(document.querySelector('.player-feed-slot')),overflow:document.documentElement.scrollWidth>innerWidth+1};});
   assert.equal(layout.overflow,false,JSON.stringify(layout));assert.ok(Math.abs(layout.buzz.w-layout.buzz.h)<1,JSON.stringify(layout));assert.ok(layout.buzz.y>=layout.question.bottom,JSON.stringify(layout));assert.ok(layout.buzz.bottom<=layout.feed.y,JSON.stringify(layout));assert.ok(Math.abs(layout.feed.bottom-(layout.phone.bottom-parseFloat(await player.locator('.phone').evaluate(e=>getComputedStyle(e).paddingBottom))))<2,JSON.stringify(layout));if(height>=640)assert.ok(layout.phone.bottom<=height+1,JSON.stringify(layout));report.layouts.push({player:layout});
  }
  const sizes=report.layouts.filter(x=>x.player?.width===390).map(x=>x.player.buzz.w);assert.ok(sizes[1]>sizes[0],JSON.stringify(sizes));
  await player.setViewportSize({width:390,height:844});await player.evaluate(()=>{window.savedBuzz=document.querySelector('.coin-buzzer');window.savedBuzz.focus();window.BuzzyView.render();});await player.waitForTimeout(50);assert.equal(await player.evaluate(()=>window.savedBuzz===document.querySelector('.coin-buzzer')&&document.activeElement===window.savedBuzz),true);
  await player.locator('.coin-buzzer').evaluate(e=>e.blur());await player.screenshot({path:'reports/player-ui-batch-layout.png'});await player.locator('[data-action="network-open-leave"]').click();const dialog=player.getByRole('dialog',{name:'Leave room?'});await dialog.waitFor();assert.equal(await dialog.evaluate(d=>getComputedStyle(d).backgroundColor),'rgb(16, 33, 58)');await player.waitForTimeout(250);await player.screenshot({path:'reports/player-ui-batch-dialog.png'});await player.keyboard.press('Escape');await dialog.waitFor({state:'detached'});report.checks.push('Player feed at bottom; circular buzzer resizes with width and height; short landscape scrolls without overlap; retained buzzer/focus and dark dialog verified');
  assert.deepEqual(report.errors,[]);report.status='passed';
 }catch(e){report.status='failed';report.error=e.stack;throw e;}finally{await h.close();writeFileSync('reports/room-ui-batch.json',JSON.stringify(report,null,2)+'\n');}
});
