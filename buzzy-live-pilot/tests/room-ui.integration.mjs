import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import jsQR from 'jsqr';
import {browserHarness} from './browser-support.mjs';
const report={status:'running',checks:[],layouts:[],errors:[]};
const ready=p=>p.waitForFunction(()=>window.BuzzyView?.state.networkReady&&!document.documentElement.hasAttribute('data-network-busy'));
async function fieldPixels(page,focused){
 const field=page.locator('#room-code');await field.fill('');
 if(focused)await field.focus();else await field.blur();
 const png=await field.screenshot({caret:focused?'initial':'hide'});
 return page.evaluate(async encoded=>{
  const img=new Image();img.src='data:image/png;base64,'+encoded;await img.decode();
  const canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;
  const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);const {data}=ctx.getImageData(0,0,img.width,img.height);
  const dots=[],caret=[];for(let y=16;y<img.height-16;y++)for(let x=8;x<img.width-8;x++){
   const i=(y*img.width+x)*4,r=data[i],g=data[i+1],b=data[i+2];
   if(Math.abs(r-111)<5&&Math.abs(g-136)<5&&Math.abs(b-173)<5)dots.push(x);
   if(r>220&&g>230&&b>240)caret.push(x);
  }
  const offset=xs=>xs.length?(Math.min(...xs)+Math.max(...xs)+1)/2-img.width/2:null;
  return {dots:offset(dots),caret:offset(caret),width:img.width};
 },png.toString('base64'));
}
await test('UI batch: compact host, real sharing QR, fluid player and viewport transitions',async()=>{
 const h=await browserHarness();
 try{
  const host=await h.page();host.on('pageerror',e=>report.errors.push(e.message));
  for(const [width,height] of [[320,640],[390,844],[1440,900],[390,550]]){
   await host.setViewportSize({width,height});const baseline=await host.addStyleTag({content:'.landing .brand{font-size:38px}body{padding-bottom:max(24px,env(safe-area-inset-bottom))}@media(max-width:350px){.landing .brand{font-size:34px}}@media(max-height:620px){body{padding-bottom:22px}}'});const old=await host.locator('.brand').boundingBox();await baseline.evaluate(e=>e.remove());const layout=await host.evaluate(()=>{const brand=document.querySelector('.brand'),r=brand.getBoundingClientRect(),end=document.querySelector('#host-entry').getBoundingClientRect();return {top:r.top,font:parseFloat(getComputedStyle(brand).fontSize),bottom:end.bottom,scroll:document.documentElement.scrollHeight,overflow:document.documentElement.scrollWidth>innerWidth+1};});assert.equal(layout.font,width<=350?42:46);assert.equal(layout.overflow,false);assert.ok(layout.top>=0&&layout.bottom<=layout.scroll+1,JSON.stringify({width,height,layout}));if(height>=640)assert.ok(old.y-layout.top>=6&&old.y-layout.top<=13,JSON.stringify({width,height,old:old.y,layout}));
  }await host.setViewportSize({width:390,height:844});
  for(const [width,height] of [[320,640],[390,844],[1280,800]]){
   const p=await h.page();await p.setViewportSize({width,height});await p.evaluate(async()=>{const c=await import('/src/client.js').then(m=>m.getClient());c.waitForConnection=()=>new Promise(()=>{});});
   const before=await p.locator('.brand').boundingBox();await p.locator('#host-entry').click();await p.locator('#entry-status').waitFor();const after=await p.locator('.brand').boundingBox();assert.ok(Math.abs(before.y-after.y)<.5,JSON.stringify({width,height,before,after}));assert.match(await p.locator('#entry-status').textContent(),/Creating/);await p.close();
  }
  const landingBrand=await host.evaluate(()=>{const logo=document.querySelector('.brand'),parts=logo.querySelectorAll('span'),input=document.querySelector('#room-code');return {word:getComputedStyle(logo).color,z:getComputedStyle(parts[0]).color,dot:getComputedStyle(parts[1]).color,indent:getComputedStyle(input).textIndent,letterSpacing:getComputedStyle(input).letterSpacing,placeholderSpacing:getComputedStyle(input,'::placeholder').letterSpacing,placeholderIndent:getComputedStyle(input,'::placeholder').textIndent};});
  await host.screenshot({path:'reports/landing-join-343.png'});
  assert.equal(landingBrand.z,landingBrand.word);assert.equal(landingBrand.dot,'rgb(128, 168, 255)');assert.equal(landingBrand.indent,'0px');assert.equal(landingBrand.placeholderIndent,landingBrand.placeholderSpacing);assert.equal(landingBrand.placeholderSpacing,landingBrand.letterSpacing);
  report.codePixels=[];for(const width of [320,390,430]){await host.setViewportSize({width,height:844});const sizes=await host.evaluate(()=>['#code-hint','#code-error','#name-error','.host-option','.intro'].map(s=>parseFloat(getComputedStyle(document.querySelector(s)).fontSize)));assert.ok(sizes.every(size=>size>=14),JSON.stringify({width,sizes}));const join=await host.evaluate(()=>{const b=document.querySelector('.join-button').getBoundingClientRect(),t=document.querySelector('.join-button span').getBoundingClientRect(),a=document.querySelector('.join-button svg').getBoundingClientRect();return {x:t.left+t.width/2-(b.left+b.width/2),y:t.top+t.height/2-(b.top+b.height/2),gap:a.left-t.right};});assert.ok(join.x>=.5&&join.x<=1.5&&join.y<0&&join.gap>=9,JSON.stringify({width,join}));report.codePixels.push({width,blurred:await fieldPixels(host,false),focused:await fieldPixels(host,true)});if(width===390)await host.locator('#room-code').screenshot({path:'reports/room-code-centered.png',caret:'initial'});}await host.setViewportSize({width:390,height:844});
  const badRoom=await h.page();await badRoom.locator('#room-code').fill('ZZZZ');await badRoom.locator('#player-name').fill('Wrong code');await badRoom.locator('.join-button').click();await badRoom.locator('#code-error').waitFor();
  assert.equal(await badRoom.locator('#room-code').inputValue(),'ZZZZ');assert.equal(await badRoom.locator('#room-code').getAttribute('aria-invalid'),'true');assert.equal(await badRoom.locator('#code-error').textContent(),'We couldn’t find a room with that code.');
  await badRoom.locator('#room-code').fill('ABCD');assert.equal(await badRoom.locator('#code-error').isVisible(),false);assert.equal(await badRoom.locator('#room-code').getAttribute('aria-invalid'),'false');
  report.checks.push({landingLogoAndRoomCode:landingBrand,roomNotFound:'Inline, actionable, keeps code, clears while editing'});
  await host.addInitScript(()=>{window.headerSamples=[];function sample(){const header=document.querySelector('.room-host-header');if(header?.querySelector('.brand')&&document.querySelector('#network-retry')){const b=header.querySelector('.brand').getBoundingClientRect(),r=header.getBoundingClientRect();window.headerSamples.push({height:r.height,x:b.x,y:b.y,retry:!document.querySelector('#network-retry').hidden});}if(!window.stopHeaderSamples)requestAnimationFrame(sample);}requestAnimationFrame(sample);});
  await host.locator('#host-entry').click();await ready(host);const code=await host.evaluate(()=>window.BuzzyView.state.code);
  await host.locator('[data-action="show-scores"]').first().click();const empty=host.locator('.host-leaderboard-overlay .lb-empty');await empty.waitFor();
  const emptyStyle=await empty.evaluate(el=>({color:getComputedStyle(el).color,size:parseFloat(getComputedStyle(el).fontSize)}));assert.equal(emptyStyle.color,'rgb(80, 103, 131)');assert.ok(emptyStyle.size>=14);
  const hostSmall=await host.locator('.host-leaderboard-overlay :is(.lb-columns,.lb-share-copy strong,.lb-share-copy small)').evaluateAll(es=>es.map(e=>parseFloat(getComputedStyle(e).fontSize)));assert.ok(hostSmall.every(size=>size>=14));
  await host.locator('.host-leaderboard-overlay [data-action="show-scores"]').click();await host.locator('.host-leaderboard-overlay').waitFor({state:'detached'});
  await host.evaluate(()=>window.stopHeaderSamples=true);report.headerCold=await host.evaluate(()=>window.headerSamples);
  await host.reload();await ready(host);await host.evaluate(()=>window.stopHeaderSamples=true);report.headerStartup=await host.evaluate(()=>window.headerSamples);
  for(const width of [1280,1920]){await host.setViewportSize({width,height:844});const edges=await host.evaluate(()=>{const logo=document.querySelector('.room-host-header .brand').getBoundingClientRect(),last=document.querySelector('.room-header-actions button:last-child').getBoundingClientRect(),main=document.querySelector('.maincol').getBoundingClientRect();return {left:logo.left-main.left,right:last.right-main.right};});assert.ok(Math.abs(edges.left)<1&&Math.abs(edges.right)<1,JSON.stringify({width,edges}));}await host.setViewportSize({width:390,height:844});
  report.hostStatusGeometry=[];
  for(const width of [320,390,768,1280]){
   await host.setViewportSize({width,height:844});
   const result=await host.evaluate(async code=>{
    const {renderHostStatus}=await import('/src/room-ui.js'),retry=document.querySelector('#network-retry'),notice=document.querySelector('#host-network-notice'),summary=document.querySelector('#host-status-summary');
    const geometry=()=>['.room-host-header','.room-host-header .brand','#room-share-qr','#room-copy-link','#leave-room','#host-view-content .appbar h1','#host-view-content .card'].map(selector=>{const r=document.querySelector(selector).getBoundingClientRect();return [r.x,r.y,r.width,r.height];});
    renderHostStatus(code,`Room ${code} · Connected`,false);const before=geometry();
    const message='The room is unavailable or this view no longer has access. Return to the start page. '+('Additional connection details. '.repeat(30));
    renderHostStatus(code,message,true);retry.hidden=false;
    const rect=notice.getBoundingClientRect(),status=document.querySelector('#network-status');
    const shown={geometry:geometry(),text:status.textContent,visible:!notice.hidden,scrollable:notice.scrollHeight>notice.clientHeight,within:rect.left>=0&&rect.right<=innerWidth,summaryFits:summary.scrollWidth<=summary.clientWidth,role:status.getAttribute('role')};
    document.querySelector('.host-notice-dismiss').click();const dismissed=notice.hidden&&document.activeElement===summary;
    summary.click();const reopened=!notice.hidden&&summary.getAttribute('aria-expanded')==='true';
    renderHostStatus(code,'Disconnected — waiting to reconnect',false);const disconnected=geometry();
    retry.hidden=true;renderHostStatus(code,`Room ${code} · Connected`,false);
    return {before,shown,message,dismissed,reopened,disconnected,restored:geometry()};
   },code);
   for(const state of [result.shown.geometry,result.disconnected,result.restored])for(let i=0;i<state.length;i++)for(let j=0;j<4;j++)assert.ok(Math.abs(state[i][j]-result.before[i][j])<.5,JSON.stringify({width,result}));
   assert.equal(result.shown.text,result.message);assert.equal(result.shown.visible,true);assert.equal(result.shown.scrollable,true,JSON.stringify({width,result}));assert.equal(result.shown.within,true);assert.equal(result.shown.summaryFits,true,JSON.stringify({width,result}));assert.equal(result.shown.role,'status');assert.equal(result.dismissed,true);assert.equal(result.reopened,true);report.hostStatusGeometry.push({width,stable:true});
  }
  await host.setViewportSize({width:390,height:844});
  report.transitionStability=[];
  for(const tab of ['players','questions','more','play']){
   await host.locator(`[data-nav="${tab}"]`).click();
   report.transitionStability.push(await host.evaluate(()=>{
    const root=document.querySelector('#host-view-content'),incoming=root.querySelector('.host-push-incoming');
    const boxes=scope=>{const bar=scope.querySelector('.appbar'),card=scope.querySelector('.card,.questions-split-heading');const queue=scope.querySelector('.questions-section-card');return {title:bar.querySelector('h1').getBoundingClientRect().y,card:card.getBoundingClientRect().y,queue:queue?.getBoundingClientRect().y??null};};
    if(!incoming)throw new Error('Expected view animation');
    const animation=incoming.getAnimations()[0];animation.pause();animation.currentTime=279.99;const before=boxes(incoming);animation.finish();
    return new Promise((resolve,reject)=>requestAnimationFrame(()=>requestAnimationFrame(()=>{try{resolve({tab:root.dataset.hostTab,before,after:boxes(document.querySelector('#host-view-content'))});}catch(error){reject(error);}})));
   }));
  }
  assert.ok(report.codePixels.every(p=>p.blurred.dots!==null&&p.focused.dots!==null&&Math.abs(p.blurred.dots)<=1&&Math.abs(p.focused.dots)<=1&&p.focused.caret!==null&&Math.abs(p.focused.caret)<=1),JSON.stringify(report.codePixels));
  assert.ok(report.transitionStability.every(p=>Math.abs(p.before.title-p.after.title)<.5&&Math.abs(p.before.card-p.after.card)<.5&&(p.before.queue===null||Math.abs(p.before.queue-p.after.queue)<.5)),JSON.stringify(report.transitionStability));
  assert.ok(report.headerCold.length&&report.headerStartup.length);
  assert.ok([...report.headerCold,...report.headerStartup].every(p=>Math.abs(p.height-report.headerStartup[0].height)<.5&&Math.abs(p.x-report.headerStartup[0].x)<.5&&Math.abs(p.y-report.headerStartup[0].y)<.5),JSON.stringify(report.headerStartup));
  const hostLogo=await host.evaluate(()=>{const e=document.querySelector('.room-host-header .brand'),z=e.querySelector('b'),dot=e.querySelector('span');return {word:getComputedStyle(e).color,z:getComputedStyle(z).color,dot:getComputedStyle(dot).color};});
  assert.equal(hostLogo.z,hostLogo.word);assert.equal(hostLogo.dot,'rgb(128, 168, 255)');
  await host.locator('[data-nav="questions"]').click();await host.locator('[data-action="new-question"]').click();await host.locator('#qtitle').fill('UI sample question');await host.locator('#qtext').fill('A prepared question for typography review');await host.locator('[data-action="save-question"]').click();await ready(host);
  await host.emulateMedia({reducedMotion:'reduce'});report.sharedCardGeometry=[];
  for(const width of [320,390,430,768,1280]){
   await host.setViewportSize({width,height:844});const positions=[];
   for(const tab of ['play','players','questions','more']){
    await host.locator(`[data-nav="${tab}"]`).click();await host.waitForTimeout(80);
    positions.push(await host.evaluate(()=>{const root=document.getElementById('host-view-content'),bar=root.querySelector('.appbar'),stack=root.querySelector(':scope > .stack'),cards=[...stack.children].filter(e=>e.matches('.card,.questions-split-heading,.questions-section-card'));const a=cards[0].getBoundingClientRect(),b=cards[1]?.getBoundingClientRect();return {top:a.top,above:a.top-bar.getBoundingClientRect().bottom,between:b?b.top-a.bottom:null};}));
   }
   assert.ok(positions.every(p=>Math.abs(p.top-positions[0].top)<.5&&Math.abs(p.above-14)<.5&&(p.between===null||Math.abs(p.between-14)<.5)),JSON.stringify({width,positions}));report.sharedCardGeometry.push({width,positions});
  }
  await host.locator('[data-nav="questions"]').click();await host.emulateMedia({reducedMotion:'no-preference'});
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
  let shareLogo;
  for(const selector of ['#room-share-qr']){
   await host.locator(selector).click();const share=host.locator('.room-share-screen');await share.locator('svg').last().waitFor();await host.waitForFunction(()=>!!document.querySelector('.room-share-qr svg'));
   const qr=await share.locator('.room-share-qr svg').evaluate(async svg=>{const source=new XMLSerializer().serializeToString(svg),img=new Image();img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(source);await img.decode();const canvas=document.createElement('canvas');canvas.width=canvas.height=600;const c=canvas.getContext('2d');c.drawImage(img,0,0,600,600);return [...c.getImageData(0,0,600,600).data];});
   const decoded=jsQR(Uint8ClampedArray.from(qr),600,600);assert.equal(decoded?.data,`http://127.0.0.1:5173/?room=${code}`);
   assert.equal(await share.locator('.room-share-code').textContent(),code);
   assert.equal(await share.locator('.room-share-url').textContent(),'127.0.0.1:5173');
   assert.equal(await share.locator('a.room-share-url').count(),0);
   shareLogo=await share.locator('.brand').evaluate(e=>({word:getComputedStyle(e).color,dot:getComputedStyle(e.querySelector('span:last-child')).color}));
   assert.equal(shareLogo.dot,'rgb(128, 168, 255)');
   const geometry=await share.evaluate(d=>{const r=d.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,topLayer:d.matches(':modal'),bg:getComputedStyle(d).backgroundColor};});assert.deepEqual([geometry.x,geometry.y,geometry.w,geometry.h],[0,0,390,844]);assert.equal(geometry.topLayer,true);
   await host.context().grantPermissions(['clipboard-read','clipboard-write']);await share.locator('.room-share-copy').click();assert.equal(await host.evaluate(()=>navigator.clipboard.readText()),`http://127.0.0.1:5173/?room=${code}`);
   await host.keyboard.press('Tab');assert.ok(await share.evaluate(d=>d.contains(document.activeElement)));await host.screenshot({path:'reports/host-ui-batch-qr.png'});await host.evaluate(()=>window.BuzzyView.render());await host.keyboard.press('Escape');await share.waitFor({state:'detached'});assert.equal(await host.locator(selector).evaluate(e=>e===document.activeElement),true);
  }
  report.checks.push('Header opens an opaque full-screen QR, independently decoded to real room URL; copy/Escape/focus verified');
  // Inspect paused incoming animation: its travel equals the viewport, not the cards.
  await host.evaluate(()=>{window.BuzzyView.handle('unused');document.querySelector('[data-nav="players"]').click();const el=document.querySelector('#host-view-content');for(const a of el.getAnimations({subtree:true})){a.pause();a.currentTime=0;}});
  const movement=await host.evaluate(()=>{const incoming=document.querySelector('.host-push-incoming'),card=incoming.querySelector('.card'),anim=incoming.getAnimations()[0];return {frames:anim.effect.getKeyframes().map(f=>f.transform),overflow:getComputedStyle(incoming.parentElement).overflowX,relative:card.getBoundingClientRect().left-incoming.getBoundingClientRect().left};});assert.ok(movement.frames.includes('translateX(-390px)'),JSON.stringify(movement));assert.equal(movement.overflow,'visible');assert.ok(movement.relative<1);
  await host.evaluate(()=>document.querySelectorAll('#host-view-content *').forEach(e=>e.getAnimations().forEach(a=>a.finish())));
  await host.locator('[data-nav="questions"]').click();await host.locator('[data-nav="play"]').click();await host.waitForTimeout(400);assert.equal(await host.locator('.host-push-incoming').count(),0);
  await host.emulateMedia({reducedMotion:'reduce'});await host.locator('[data-nav="players"]').click();assert.equal(await host.locator('.host-push-incoming').count(),0);await host.emulateMedia({reducedMotion:'no-preference'});report.checks.push('Viewport-distance transition, whole-view movement, rapid navigation cleanup and reduced motion verified');
  const player=await h.page();player.on('pageerror',e=>report.errors.push(e.message));await player.locator('#room-code').fill(code);await player.locator('#player-name').fill('Mobile player');await player.locator('.join-button').click();await ready(player);
  await player.setViewportSize({width:1600,height:900});const background=await player.evaluate(()=>({body:getComputedStyle(document.body).backgroundImage,phone:getComputedStyle(document.querySelector('.phone')).backgroundImage,phoneLeft:document.querySelector('.phone').getBoundingClientRect().left}));assert.match(background.body,/radial-gradient/);assert.equal(background.phone,'none');const image=await player.screenshot({path:'reports/player-wide-gradient-341.png'});const seam=await player.evaluate(async({encoded,x})=>{const image=new Image();image.src='data:image/png;base64,'+encoded;await image.decode();const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const ctx=c.getContext('2d');ctx.drawImage(image,0,0);const pixels=ctx.getImageData(Math.round(x)-2,150,4,1).data;return [0,1,2].map(i=>Math.abs(pixels[i]-pixels[12+i]));},{encoded:image.toString('base64'),x:background.phoneLeft});assert.ok(seam.every(d=>d<=3),JSON.stringify(seam));
  await player.setViewportSize({width:390,height:844});await player.keyboard.press('Tab');const info=player.locator('.qinfo-toggle');await info.focus();for(const expanded of [false,true]){const focus=await info.evaluate(b=>{const r=b.getBoundingClientRect(),a=b.querySelector('svg').getBoundingClientRect(),p=getComputedStyle(b,'::after');return {visible:b.matches(':focus-visible'),width:r.width,height:r.height,ring:parseFloat(p.width),border:parseFloat(p.borderTopWidth),dx:r.left+parseFloat(p.left)-(a.left+a.width/2),dy:r.top+parseFloat(p.top)-(a.top+a.height/2)};});assert.equal(focus.visible,true);assert.ok(focus.width>=44&&focus.height>=44&&focus.ring<=28&&focus.border>=2&&Math.abs(focus.dx)<1&&Math.abs(focus.dy)<1,JSON.stringify({expanded,focus}));if(!expanded){await player.keyboard.press('Enter');await player.waitForFunction(()=>document.querySelector('.qinfo-toggle').getAttribute('aria-expanded')==='true');}else{await player.waitForTimeout(300);const overlaps=await info.evaluate(b=>{const r=b.getBoundingClientRect(),p=getComputedStyle(b,'::after'),x=r.left+parseFloat(p.left),y=r.top+parseFloat(p.top),w=parseFloat(p.width),h=parseFloat(p.height),ring={left:x-w/2,right:x+w/2,top:y-h/2,bottom:y+h/2};return [...document.querySelectorAll('.player-person-name,.player-person-score,.player-round-line')].some(e=>{const t=e.getBoundingClientRect();return ring.left<t.right&&ring.right>t.left&&ring.top<t.bottom&&ring.bottom>t.top;});});assert.equal(overlaps,false,'Focus ring must not cover adjacent text');await player.screenshot({path:'reports/player-focus-342.png'});}}await player.keyboard.press('Enter');
  await player.locator('[data-action="player-leaderboard"]').click();const playerBoard=player.locator('.player-leaderboard-overlay .player-leaderboard-sheet');await playerBoard.waitFor();assert.equal(await playerBoard.evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(16, 33, 58)');await playerBoard.locator('[data-action="dismiss-leaderboard"]').click();await playerBoard.waitFor({state:'detached'});
  const playerLogo=await player.evaluate(()=>{const e=document.querySelector('.headbar .brand'),z=e.querySelector('b'),dot=e.querySelector('span');return {word:getComputedStyle(e).color,z:getComputedStyle(z).color,dot:getComputedStyle(dot).color};});
  assert.equal(playerLogo.z,playerLogo.word);assert.equal(playerLogo.dot,'rgb(128, 168, 255)');
  let releaseBridge,intercepted=false;const bridgeGate=new Promise(resolve=>{releaseBridge=resolve;});
  await player.route('**/src/bridge.js*',async route=>{intercepted=true;await bridgeGate;await route.continue();});
  const reload=player.reload();await player.locator('#network-bar.player-connect-screen').waitFor({state:'visible'});
  const loading=await player.evaluate(()=>{const box=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};};const screen=document.querySelector('#network-bar'),logo=screen.querySelector('.brand');return {screen:box(screen),logo:box(logo),status:box(screen.querySelector('#network-status')),visibility:getComputedStyle(document.querySelector('.shell')).visibility};});
  assert.equal(intercepted,true);assert.deepEqual(loading.screen,{x:0,y:0,width:390,height:844});assert.ok(Math.abs(loading.logo.x+loading.logo.width/2-195)<1,JSON.stringify(loading));assert.equal(loading.visibility,'hidden');
  await player.screenshot({path:'reports/player-reload-loading.png'});releaseBridge();await reload;await ready(player);await player.unroute('**/src/bridge.js*');
  report.checks.push({playerReloadLoading:loading,centeredLogo:true,backgroundGameHidden:true});
  for(const [width,height] of [[320,640],[390,600],[390,844],[430,932],[768,1024],[844,390]]){
   await player.setViewportSize({width,height});await player.waitForTimeout(100);
   const layout=await player.evaluate(()=>{const r=e=>{const b=e.getBoundingClientRect();return {x:b.x,y:b.y,w:b.width,h:b.height,bottom:b.bottom};};return {width:innerWidth,height:innerHeight,phone:r(document.querySelector('.phone')),question:r(document.querySelector('.ph-question')),buzz:r(document.querySelector('.coin-buzzer')),feed:r(document.querySelector('.player-feed-slot')),overflow:document.documentElement.scrollWidth>innerWidth+1};});
   assert.equal(layout.overflow,false,JSON.stringify(layout));assert.ok(Math.abs(layout.buzz.w-layout.buzz.h)<1,JSON.stringify(layout));assert.ok(layout.buzz.y>=layout.question.bottom,JSON.stringify(layout));assert.ok(layout.buzz.bottom<=layout.feed.y,JSON.stringify(layout));assert.ok(Math.abs(layout.feed.bottom-(layout.phone.bottom-parseFloat(await player.locator('.phone').evaluate(e=>getComputedStyle(e).paddingBottom))))<2,JSON.stringify(layout));if(height>=640)assert.ok(layout.phone.bottom<=height+1,JSON.stringify(layout));report.layouts.push({player:layout});
  }
  const sizes=report.layouts.filter(x=>x.player?.width===390).map(x=>x.player.buzz.w);assert.ok(sizes[1]>sizes[0],JSON.stringify(sizes));
  await player.setViewportSize({width:390,height:844});await player.evaluate(()=>{window.savedBuzz=document.querySelector('.coin-buzzer');window.savedBuzz.focus();window.BuzzyView.render();});await player.waitForTimeout(50);assert.equal(await player.evaluate(()=>window.savedBuzz===document.querySelector('.coin-buzzer')&&document.activeElement===window.savedBuzz),true);
  await player.locator('.coin-buzzer').evaluate(e=>e.blur());await player.screenshot({path:'reports/player-ui-batch-layout.png'});await player.locator('[data-action="network-open-leave"]').click();const dialog=player.getByRole('dialog',{name:'Leave room?'});await dialog.waitFor();assert.equal(await dialog.evaluate(d=>getComputedStyle(d).backgroundColor),'rgb(16, 33, 58)');await player.waitForTimeout(250);await player.screenshot({path:'reports/player-ui-batch-dialog.png'});await player.keyboard.press('Escape');await dialog.waitFor({state:'detached'});report.checks.push('Player feed at bottom; circular buzzer resizes with width and height; short landscape scrolls without overlap; retained buzzer/focus and dark dialog verified');
  const priorSession=await player.evaluate(()=>sessionStorage.getItem('buzzy-spark-ui-session'));
  await player.evaluate(value=>sessionStorage.setItem('buzzy-spark-ui-session',JSON.stringify({...JSON.parse(value),code:'ZZZZ'})),priorSession);
  await player.goto('http://127.0.0.1:5173/player.html');await player.waitForFunction(()=>document.querySelector('#network-status')?.dataset.error==='true');
  assert.match(await player.locator('#network-status').textContent(),/room is no longer available/i);assert.equal(await player.locator('#network-retry').isVisible(),true);assert.equal(await player.locator('#network-bar').evaluate(e=>e.classList.contains('player-connect-screen')),true);
  report.checks.push({hostLogo,playerLogo,shareLogo,playerFailure:'Readable persistent error with retry in full-screen reconnect view'});
  assert.deepEqual(report.errors,[]);report.status='passed';
 }catch(e){report.status='failed';report.error=e.stack;throw e;}finally{await h.close();writeFileSync('reports/room-ui-batch.json',JSON.stringify(report,null,2)+'\n');}
});
