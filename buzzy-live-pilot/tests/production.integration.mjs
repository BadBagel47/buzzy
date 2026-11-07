import test from 'node:test';
import assert from 'node:assert/strict';
import {preview} from 'vite';
import {chromium} from 'playwright';
import {writeFileSync} from 'node:fs';
const report={status:'running',checks:[],viewports:[],pageErrors:[],buildServed:true};
await test('Built multi-page app: native game and responsive layout',async t=>{
 const server=await preview({root:process.cwd(),preview:{host:'127.0.0.1',port:5173,strictPort:true},logLevel:'error'});
 let browser;
 try{
  browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
  const page=async()=>{const context=await browser.newContext({viewport:{width:390,height:844}}),p=await context.newPage();p.setDefaultTimeout(12000);p.on('pageerror',e=>report.pageErrors.push(e.message));await p.goto('http://127.0.0.1:5173');return p;};
  const ready=p=>p.waitForFunction(()=>window.BuzzyView?.state.networkReady),idle=p=>p.waitForFunction(()=>!document.documentElement.hasAttribute('data-network-busy'));
  const host=await page();const join=host.locator('.join-button'),box=await join.boundingBox(),fill=await join.evaluate(e=>getComputedStyle(e).backgroundImage),layoutTop=await join.evaluate(e=>e.offsetTop);await host.mouse.move(box.x+box.width/2,box.y+box.height/2);await host.mouse.down();assert.equal(await join.evaluate(e=>getComputedStyle(e).backgroundImage),fill,'Join press keeps green fill');assert.equal(await join.evaluate(e=>e.offsetTop),layoutTop,'Press keeps layout position');assert.equal(await join.evaluate(e=>getComputedStyle(e).webkitTapHighlightColor),'rgba(0, 0, 0, 0)');await host.mouse.up();await host.keyboard.press('Tab');await host.keyboard.press('Tab');assert.equal(await join.evaluate(e=>getComputedStyle(e).outlineStyle),'solid');report.checks.push('Landing join press keeps its green fill and layout position, tap highlight transparent and keyboard focus remains visible');await host.locator('#host-entry').click();await ready(host);const code=await host.evaluate(()=>window.BuzzyView.state.code);
  const player=await page();await player.locator('#room-code').fill(code);await player.locator('#player-name').fill('Production player');await player.locator('.join-button').click();await ready(player);
  for(const width of [320,390,700,1280]){
   await host.setViewportSize({width,height:width===320?568:844});
   for(const tab of ['play','players','questions','more','play']){await host.locator(`[data-nav="${tab}"]`).click();await host.waitForTimeout(330);assert.equal(await host.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,`${width}/${tab} overflow`);}
   const labels=await host.locator('.play-mode-option').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect(),arrow=e.querySelector('.mode-chevron-slot.is-visible svg')?.getBoundingClientRect(),g=e.querySelector('.mode-content-group').getBoundingClientRect(),copy=e.querySelector('.mode-copy'),cs=copy.getBoundingClientRect();return{arrowError:arrow?Math.abs(arrow.top+arrow.height/2-r.top-r.height/2):null,wrap:e.dataset.sourceWrap,font:getComputedStyle(copy).fontSize,center:Math.abs(g.left+g.width/2-r.left-r.width/2),textCenter:Math.abs(cs.left+cs.width/2-r.left-r.width/2)};}));
   for(const [i,v] of labels.entries()){assert.ok(v.center<.6);if(i===0)assert.ok(v.textCenter<.6);if(v.arrowError!==null)assert.ok(v.arrowError<.6,`Arrow center ${width}: ${v.arrowError}`);assert.equal(v.font,'14px');}
   await player.setViewportSize({width,height:width===700?390:844});assert.equal(await player.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,`${width}/player overflow`);await player.locator('.coin-buzzer').scrollIntoViewIfNeeded();assert.equal(await player.locator('.coin-buzzer').isVisible(),true);
   assert.equal(await player.locator('[aria-label="View as player"]').count(),0);assert.equal(await player.locator('.phonewrap').textContent().then(t=>t.includes('not online multiplayer')),false);
   report.viewports.push({width,sourceLabels:labels});
   if([320,390,1280].includes(width)){await host.screenshot({path:`reports/host-${width}.png`,fullPage:true});await player.screenshot({path:`reports/player-${width}.png`,fullPage:true});}
  }
  report.checks.push('Built assets serve host/player routes; no overflow at 320/390/700/1280; source label centering/typography preserved; no demo view selector');
  await host.setViewportSize({width:390,height:844});await host.locator('[data-nav="questions"]').click();await host.locator('[data-action="new-question"]').click();await host.locator('#qtitle').fill('Built question');await host.locator('#qtext').fill('Say two');await host.locator('#qpoints').fill('2');await host.locator('.question-editor-options > summary').click();await host.locator('#qmode').selectOption('first');await host.locator('#qtimer').selectOption('off');await host.locator('#qstart').selectOption('together');await host.locator('[data-action="save-question"]').click();await idle(host);await host.locator('[data-nav="play"]').click();await host.locator('[data-action="set-play-mode:prepared"]').click();
  await host.locator('.quickplay-main[data-action="present-and-open"]').waitFor();await idle(host);await host.locator('.quickplay-main[data-action="present-and-open"]').click();await player.waitForFunction(()=>window.BuzzyView.state.phase==='open');await player.locator('.coin-buzzer').focus();await player.keyboard.press('Space');await host.waitForFunction(()=>window.BuzzyView.state.phase==='locked');await idle(host);await host.locator('[data-action="correct"]').first().click();await player.waitForFunction(()=>window.BuzzyView.state.players[0].score===2);
  report.checks.push('Production bundle: native Prepared start-together, keyboard First buzz and authoritative custom +2 score');
  await idle(host);await host.locator('[data-nav="more"]').click();await host.locator('[data-action="toggle-settings-section:effects"]').click();await host.locator('[data-action="celebrate"]').click();await player.waitForFunction(()=>document.getElementById('confetti').children.length===96);assert.equal(await host.locator('#confetti > i').count(),96);report.checks.push('Corner celebration broadcasts to host/player; repeated launch is covered by the refinement regression');
  await player.reload();await ready(player);assert.equal(await player.evaluate(()=>window.BuzzyView.state.players[0].score),2);assert.equal(await player.locator('#confetti > i').count(),0,'Reload must not replay celebration');
  report.checks.push('Production reload retains score and does not replay historical celebration');
  assert.deepEqual(report.pageErrors,[]);report.status='passed';
 }catch(e){report.status='failed';report.error=e.stack;throw e;}finally{await browser?.close();await new Promise(resolve=>server.httpServer.close(resolve));writeFileSync('reports/production-integration.json',JSON.stringify(report,null,2)+'\n');}
});
