import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {browserHarness} from './browser-support.mjs';
const report={status:'running',checks:[],geometry:[],errors:[]};
const ready=p=>p.waitForFunction(()=>window.BuzzyView?.state.networkReady&&!document.documentElement.hasAttribute('data-network-busy'));
const settle=p=>p.waitForTimeout(330);
await test('Mobile UI refinements: navigation, stable animations, Settings and corner celebration',async()=>{
 const h=await browserHarness();
 try{
  const host=await h.page();host.on('pageerror',e=>report.errors.push(e.message));await host.locator('#host-entry').click();await ready(host);const code=await host.evaluate(()=>window.BuzzyView.state.code);
  const player=await h.page();player.on('pageerror',e=>report.errors.push(e.message));await player.locator('#room-code').fill(code);await player.locator('#player-name').fill('Animation player');await player.locator('.join-button').click();await ready(player);
  await host.locator('[data-nav="questions"]').click();await host.locator('[data-action="new-question"]').click();await host.locator('#qtitle').fill('Transition question');await host.locator('#qtext').fill('Keep the live panel mounted');await host.locator('[data-action="save-question"]').click();await ready(host);
  for(const [width,height] of [[320,640],[390,600],[390,844],[430,932],[768,1024],[844,390]]){
   await host.setViewportSize({width,height});const centers=[];
   for(const tab of ['play','players','questions','more']){
    await host.locator(`[data-nav="${tab}"]`).click();await settle(host);
    const heading=await host.locator('.appbar>h1').boundingBox();centers.push(heading.y+heading.height/2);
    const g=await host.evaluate(()=>{const nav=document.querySelector('.nav'),a=nav.querySelector('.active'),r=nav.getBoundingClientRect(),b=a.getBoundingClientRect(),css=getComputedStyle(nav,'::before'),x=new DOMMatrixReadOnly(css.transform).m41;return {tab:a.dataset.nav,width:innerWidth,height:innerHeight,buttonWidths:[...nav.querySelectorAll('button')].map(n=>n.getBoundingClientRect().width),highlight:{x:r.left+parseFloat(getComputedStyle(nav).borderLeftWidth)+x,width:parseFloat(css.width)},active:{x:b.left,width:b.width},overflow:document.documentElement.scrollWidth>innerWidth+1};});
    assert.equal(g.overflow,false,JSON.stringify(g));assert.ok(Math.abs(g.highlight.x-g.active.x)<1,JSON.stringify(g));assert.ok(Math.abs(g.highlight.width-g.active.width)<1,JSON.stringify(g));assert.ok(Math.max(...g.buttonWidths)-Math.min(...g.buttonWidths)>4,JSON.stringify(g));report.geometry.push(g);
    await host.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));await host.waitForTimeout(40);
    const bottom=await host.evaluate(()=>{const nav=document.querySelector('.nav').getBoundingClientRect(),cards=[...document.querySelectorAll('#host-view-content>.stack>:is(.card,.questions-section-card)')],last=cards.at(-1)?.getBoundingClientRect();return {gap:last?nav.top-last.bottom:null,expected:parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--host-card-gap')),scrollable:document.documentElement.scrollHeight>innerHeight+1};});
    assert.notEqual(bottom.gap,null,`${tab}: card missing`);if(bottom.scrollable)assert.ok(Math.abs(bottom.gap-bottom.expected)<2,JSON.stringify({tab,width,height,...bottom}));else assert.ok(bottom.gap>=bottom.expected-1,JSON.stringify(bottom));
   }
   assert.ok(Math.max(...centers)-Math.min(...centers)<1,JSON.stringify({width,centers}));
  }
  report.checks.push('Unequal content-based tab widths; exact indicator geometry; equal heading placement and last-card clearance at six viewport sizes');
  await host.setViewportSize({width:390,height:844});await host.locator('[data-nav="play"]').click();await settle(host);
  // Freeze one animation midway: position and width must both interpolate.
  const transition=await host.evaluate(()=>{const n=document.querySelector('.nav');document.querySelector('[data-nav="questions"]').click();window.BuzzyNetwork.afterRender();const a=n.getAnimations({subtree:true}).find(a=>a.effect.getKeyframes().some(f=>f.width));if(!a)return null;a.pause();a.currentTime=140;window.navAnimationGeometry={left:n.getBoundingClientRect().left,width:n.getBoundingClientRect().width,indicatorWidth:parseFloat(getComputedStyle(n,'::before').width)};return a.effect.getKeyframes().map(f=>({width:f.width,transform:f.transform}));});
  assert.ok(transition&&transition[0].width!==transition[1].width,JSON.stringify(transition));assert.notEqual(transition[0].transform,transition[1].transform);const mid=await host.evaluate(()=>navAnimationGeometry);assert.equal(mid.left,0);assert.equal(mid.width,390);const ends=transition.map(f=>parseFloat(f.width));assert.ok(mid.indicatorWidth>Math.min(...ends)&&mid.indicatorWidth<Math.max(...ends),JSON.stringify({mid,ends}));await host.evaluate(()=>document.querySelector('.nav').getAnimations().forEach(a=>a.finish()));await settle(host);
  await host.locator('[data-nav="play"]').click();await settle(host);
  // Opening is local UI: it must remain animated across arbitrary network renders.
  const open=await host.evaluate(()=>{const b=document.querySelector('[data-action="set-play-mode:quick"]');b.click();const panel=document.querySelector('.play-mode-content'),a=panel.getAnimations().find(a=>a.effect.getKeyframes().some(f=>f.height));if(!a)return null;a.pause();a.currentTime=80;window.quickPanel=panel;window.quickAnimation=a;return {frames:a.effect.getKeyframes().map(f=>f.height),height:panel.getBoundingClientRect().height};});
  assert.ok(open,JSON.stringify(open));assert.notEqual(open.frames[0],open.frames.at(-1));
  await host.evaluate(()=>window.BuzzyView.render());assert.equal(await host.evaluate(()=>quickPanel===document.querySelector('.play-mode-content')&&quickAnimation.playState==='paused'),true);await host.evaluate(()=>quickAnimation.finish());
  await host.locator('#quick-text').fill('Keep this question draft');await host.locator('#quick-text').focus();await host.evaluate(()=>window.BuzzyView.render());assert.equal(await host.locator('#quick-text').inputValue(),'Keep this question draft');assert.equal(await host.locator('#quick-text').evaluate(e=>document.activeElement===e),true);
  await host.locator('[data-action="set-play-mode:quick"]').click();await settle(host);await ready(host);assert.equal(await host.locator('#quick-content-panel').count(),0);for(let i=0;i<6;i++){await host.locator('[data-action="set-play-mode:quick"]').click();assert.ok(await host.locator('#quick-content-panel').count()<=1);await host.waitForTimeout(60);}await settle(host);assert.equal(await host.locator('[data-ui-closing]').count(),0);assert.equal(await host.locator('#quick-content-panel').count(),0);report.checks.push('Quick Play opens with a real height animation, survives rerender and preserves typed/focused content through updates and collapse');
  const mode=await host.evaluate(()=>{window.BuzzyView.handle('set-play-mode:prepared');const snapshots=document.querySelectorAll('.mode-exit-snapshot').length;window.BuzzyView.render();window.liveModePanel=document.querySelector('.play-mode-content:not(.mode-exit-snapshot)');return {snapshots,prepared:!window.BuzzyView.state.quickQuestion};});
  assert.equal(mode.prepared,true);assert.ok(mode.snapshots>0);await ready(host);await host.waitForTimeout(400);assert.equal(await host.evaluate(()=>liveModePanel.isConnected),true);assert.equal(await host.locator('.play-mode-content:not(.mode-exit-snapshot)').count(),1);await host.locator('[data-action="set-play-mode:quick"]').click();await ready(host);await settle(host);report.checks.push('A network render during a Quick/Prepared transition cannot replace the live panel with its temporary outgoing snapshot');
  // The editor's background/root must remain opaque and mounted during tab changes.
  await host.locator('[data-action="option:correct"]').click();await settle(host);await host.evaluate(()=>{window.editor=document.querySelector('#fact-editor');window.editorClip=document.querySelector('.fact-editor-clip');});
  for(const kind of ['incorrect','correct','incorrect','correct']){
   await host.locator(`[data-action="option:${kind}"]`).click();
   const stable=await host.evaluate(()=>({same:editor===document.querySelector('#fact-editor'),clip:editorClip===document.querySelector('.fact-editor-clip'),opacity:getComputedStyle(editorClip).opacity,frames:editorClip.getAnimations().flatMap(a=>a.effect.getKeyframes()).map(f=>f.opacity).filter(Boolean)}));
   assert.equal(stable.same,true,JSON.stringify(stable));assert.equal(stable.clip,true);assert.equal(stable.opacity,'1');assert.ok(stable.frames.every(v=>v==='1'));await host.evaluate(()=>window.BuzzyView.render());assert.equal(await host.evaluate(()=>editor===document.querySelector('#fact-editor')),true);await host.waitForTimeout(80);
  }
  await host.locator('[data-action="close-option"]').click();await settle(host);
  await host.locator('[data-action="show-scores"]').first().click();await settle(host);await host.evaluate(()=>{window.sheet=document.querySelector('.host-leaderboard-overlay .shared-list-sheet');});
  for(let i=0;i<3;i++){
   await host.locator('[data-share-leaderboard]').click();await ready(host);await settle(host);
   assert.equal(await host.locator('[data-share-leaderboard]').isChecked(),i%2===0);assert.equal(await player.locator('.player-leaderboard-overlay').isVisible(),i%2===0);assert.equal(await host.evaluate(()=>sheet===document.querySelector('.host-leaderboard-overlay .shared-list-sheet')),true);
   assert.equal(await host.locator('.host-leaderboard-overlay .shared-list-sheet').evaluate(e=>getComputedStyle(e).opacity),'1');
  }
  await host.locator('.host-leaderboard-overlay [data-action="show-scores"]').last().click();await settle(host);report.checks.push('Points editor and host leaderboard sheet retain their DOM and opaque background through repeated toggles and server acknowledgements');
  await host.locator('[data-nav="more"]').click();await settle(host);
  assert.equal(await host.locator('[data-settings-section][open]').count(),0);assert.equal(await host.locator('.settings-room-card [data-action="qr"]').count(),0);assert.equal(await host.locator('#room-share-qr').isVisible(),true);
  await host.locator('[data-action="toggle-settings-section:effects"]').click();await settle(host);
  const launch=host.getByRole('button',{name:'Launch celebration for all',exact:true});assert.equal(await launch.count(),1);assert.equal(await launch.evaluate(e=>e.closest('.settings-subgroup').querySelector('h3').textContent),'Visual effects');assert.equal(await host.locator('.session-history-card [data-action="celebrate"]').count(),0);
  const colors=await host.evaluate(()=>{const a=getComputedStyle(document.querySelector('[data-action="celebrate"]')),b=getComputedStyle(document.querySelector('[data-action="copy-link"]')),e=getComputedStyle(document.querySelector('[data-action="end-room"]'));return {launch:a.backgroundColor,standard:b.backgroundColor,red:e.borderTopColor,text:e.color};});assert.equal(colors.launch,colors.standard);assert.equal(colors.red,colors.text);assert.equal(colors.red,'rgb(191, 62, 77)');
  await host.screenshot({path:'reports/refinements-settings-390.png',fullPage:true});await host.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));await host.screenshot({path:'reports/refinements-settings-bottom-390.png'});
  await launch.click();await ready(host);await player.waitForFunction(()=>document.querySelectorAll('#confetti .celebration-particle').length===64);
  const arcs=await player.evaluate(()=>[...document.querySelectorAll('#confetti i')].slice(0,2).map(p=>({side:p.dataset.origin,frames:p.getAnimations()[0].effect.getKeyframes().map(f=>{const m=new DOMMatrixReadOnly(f.transform);return {x:m.m41,y:m.m42};})})));
  report.celebrationArcs=arcs;assert.deepEqual(arcs.map(a=>a.side),['left','right']);for(const arc of arcs){const start=arc.frames[0],peak=arc.frames[8];assert.ok(start.y>=844&&peak.y<500);assert.ok(Math.abs(peak.x-195)<Math.abs(start.x-195));}report.checks.push('Relocated/renamed standard-style launch reaches the player; independently sampled particle paths rise from both bottom corners toward the center');
  await player.evaluate(()=>window.BuzzyView.confetti());await player.waitForTimeout(900);await player.evaluate(()=>window.BuzzyView.confetti());await player.waitForTimeout(1350);assert.equal(await player.locator('#confetti i').count(),64);await player.waitForFunction(()=>document.querySelectorAll('#confetti i').length===0);
  await player.emulateMedia({reducedMotion:'reduce'});await player.evaluate(()=>window.BuzzyView.confetti());assert.equal(await player.locator('#confetti i').count(),0);await player.emulateMedia({reducedMotion:'no-preference'});
  await host.locator('[data-toggle="celebration"]').uncheck();await ready(host);await player.waitForFunction(()=>window.BuzzyView.state.celebration===false);await player.evaluate(()=>window.BuzzyView.confetti());assert.equal(await player.locator('#confetti i').count(),0);report.checks.push('Repeated launch survives the previous cleanup deadline; final particles clean up; reduced motion and disabled celebration suppress the effect');
  await host.emulateMedia({reducedMotion:'reduce'});await host.locator('[data-nav="play"]').click();await host.waitForTimeout(50);assert.equal(await host.locator('.nav').evaluate(n=>n.getAnimations().filter(a=>a.playState==='running').length),0);
  assert.deepEqual(report.errors,[]);report.status='passed';
 }catch(e){report.status='failed';report.error=e.stack;try{for(const c of h.browser.contexts())for(const p of c.pages())if(p.url().includes('host.html'))await p.screenshot({path:'reports/refinements-failure.png',fullPage:true});}catch{}throw e;}finally{await h.close();writeFileSync('reports/ui-refinements-304-313.json',JSON.stringify(report,null,2)+'\n');}
});
