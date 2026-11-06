import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';import path from 'node:path';import {chromium} from 'playwright';
const report={status:'running',checks:[],realRequestsSent:0};
const headers=JSON.parse(readFileSync('firebase.pilot.json','utf8')).hosting.headers[0].headers;
const config=JSON.parse(readFileSync('config/firebase.buzzy-197dc.json','utf8'));
await test('Built HTTPS pilot uses live Auth config, hosting headers and fails without demo fallback',async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox'],headless:true});
 try{
  for(const hostname of ['buzzy-197dc.web.app','buzzy-197dc--pilot-abc123.web.app']){
   const context=await browser.newContext(),page=await context.newPage(),errors=[],external=[];page.on('pageerror',e=>errors.push(e.message));await page.routeWebSocket('**',ws=>{ws.close();});
   await page.route('**/*',async route=>{
    const url=new URL(route.request().url());
    if(url.hostname!==hostname){external.push({hostname:url.hostname,path:url.pathname,keyMatches:url.searchParams.get('key')===config.apiKey});await route.fulfill({status:400,contentType:'application/json',body:JSON.stringify({error:{code:400,message:'OPERATION_NOT_ALLOWED'}})});return;}
    const file=path.resolve('dist-pilot',url.pathname==='/'?'index.html':'.'+url.pathname);
    assert.ok(file.startsWith(path.resolve('dist-pilot')+path.sep));
    let body;try{body=readFileSync(file);}catch{await route.fulfill({status:404,body:'Not found'});return;}
    const type=file.endsWith('.js')?'text/javascript':file.endsWith('.svg')?'image/svg+xml':file.endsWith('.css')?'text/css':'text/html';
    await route.fulfill({status:200,contentType:type,headers:Object.fromEntries(headers.map(h=>[h.key,h.value])),body});
   });
   await page.goto(`https://${hostname}/`);await page.locator('#host-entry').waitFor();assert.equal(external.length,0,'Landing must not initialize Auth');
   await page.locator('#host-entry').click();await page.waitForFunction(()=>document.getElementById('entry-status').textContent.includes('auth/operation-not-allowed'));
   assert.ok(external.some(r=>r.hostname==='identitytoolkit.googleapis.com'&&r.path.includes('signUp')&&r.keyMatches));
   assert.ok(external.every(r=>!r.hostname.includes('localhost')&&!r.hostname.includes('127.0.0.1')));
   assert.equal(new URL(page.url()).pathname,'/');assert.equal(await page.locator('.phone').count(),0);assert.deepEqual(errors,[]);
   await page.evaluate(()=>sessionStorage.setItem('buzzy-spark-ui-session',JSON.stringify({role:'host',code:'ABCD'})));await page.goto(`https://${hostname}/host.html`);
   await page.waitForFunction(()=>document.getElementById('network-status').dataset.error==='true');assert.equal(await page.evaluate(()=>!!window.BuzzyView.state.networkReady),false);assert.equal(await page.evaluate(()=>window.BuzzyView.state.players.length),0);assert.equal(await page.evaluate(()=>window.BuzzyView.state.code),'');assert.equal(await page.locator('.headbar .tag.desktoponly').count(),0);assert.equal(await page.locator('#leave-room').getAttribute('aria-label'),'Leave room');assert.equal(await page.title(),'Buzzy · Host');assert.equal(await page.locator('#room-copy-link').isDisabled(),true);assert.equal(await page.locator('#room-share-qr').isDisabled(),true);await page.locator('#leave-room').click();await page.getByRole('dialog',{name:'End game and leave?'}).waitFor();await page.keyboard.press('Escape');await page.getByRole('dialog').waitFor({state:'detached'});
   await page.evaluate(()=>sessionStorage.setItem('buzzy-spark-ui-session',JSON.stringify({role:'player',code:'ABCD'})));await page.goto(`https://${hostname}/player.html`);assert.equal(await page.locator('.headbar .tag.desktoponly').textContent(),'PLAYER');assert.equal(await page.title(),'Buzzy · Player');await page.waitForFunction(()=>document.getElementById('network-status').dataset.error==='true');await page.locator('#leave-room').click();await page.getByRole('dialog',{name:'Leave room?'}).waitFor();await page.locator('[data-action="network-confirm-exit"]').click();await page.locator('#host-entry').waitFor();
   report.checks.push(`${hostname}: real SDK/live key routed to Auth, CSP applied, no automatic join/demo/emulator fallback; Auth denied by test fixture`);await context.close();
  }
  report.status='passed';
 }catch(e){report.status='failed';report.error=e.stack;throw e;}finally{await browser.close();writeFileSync('reports/pilot-browser.json',JSON.stringify(report,null,2)+'\n');}
});
