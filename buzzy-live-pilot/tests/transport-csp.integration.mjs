import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {browserHarness,call,identity,read} from './browser-support.mjs';
const headers=JSON.parse(readFileSync('firebase.pilot.json')).hosting.headers[0].headers;
const current=headers.find(h=>h.key==='Content-Security-Policy').value;
const oldPolicy="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; font-src 'self'; connect-src 'self' https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://*.firebasedatabase.app wss://*.firebasedatabase.app; frame-src https://buzzy-197dc.firebaseapp.com; frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'";
// Translate service origins only; the same script/frame/connect directive restrictions remain.
const localPolicy=policy=>policy.replaceAll('https://identitytoolkit.googleapis.com','http://127.0.0.1:9099').replaceAll('https://securetoken.googleapis.com','http://127.0.0.1:9099').replaceAll('https://buzzy-197dc.firebaseapp.com','http://127.0.0.1:9099').replaceAll('https://*.europe-west1.firebasedatabase.app','http://127.0.0.1:9000').replaceAll('https://*.firebasedatabase.app','http://127.0.0.1:9000').replaceAll('wss://*.firebasedatabase.app','ws://127.0.0.1:9000');
const report={observations:[],status:'running',checks:[],scope:'Firebase SDK against loopback Auth/RTDB under translated production CSP; no live Buzzy room operations'};
await test('Published security policy supports SDK fallback after a remembered WebSocket failure',async()=>{
 const h=await browserHarness();
 try{
  async function pageWithPolicy(policy){
   const context=await h.browser.newContext();
   // Synthetic document responses have unknown address space in Chromium; the services here are intentional loopback emulators.
   await context.grantPermissions(['local-network-access']);
   await context.addInitScript(()=>{localStorage.setItem('firebase:previous_websocket_failure','true');window.cspViolations=[];document.addEventListener('securitypolicyviolation',e=>{try{window.top.cspViolations.push({directive:e.effectiveDirective,path:new URL(e.blockedURI,location.href).pathname});}catch{}});});
   await context.routeWebSocket('ws://127.0.0.1:9000/**',ws=>ws.close());
   await context.route('http://127.0.0.1:5173/**',async route=>{const response=await route.fetch();await route.fulfill({response,headers:{...response.headers(),'content-security-policy':localPolicy(policy)}});});
   const p=await context.newPage();p.on('pageerror',e=>report.observations.push({pageerror:e.message}));p.on('console',m=>{const text=m.text();if(m.type()==='error')report.observations.push({console:text.replace(/https?:\/\/[^\s'"]+/g,u=>{try{const x=new URL(u);return x.origin+x.pathname;}catch{return '<url>';}}).slice(0,400)});if(text.includes('/.lp')&&text.includes('script-src')&&(text.includes('Content Security Policy')||text.includes('violates'))){p.evaluate(()=>window.cspViolations.push({directive:'script-src-elem',path:'/.lp'})).catch(()=>{});}});await p.goto('http://127.0.0.1:5173');return p;
  }
  const old=await pageWithPolicy(oldPolicy);await old.locator('#host-entry').click();
  await old.waitForFunction(()=>window.cspViolations.some(v=>v.directive==='script-src-elem'&&v.path==='/.lp'));
  await old.waitForFunction(()=>!document.querySelector('#host-entry').disabled,{},{timeout:25000});assert.match(await old.locator('#entry-status').textContent(),/taking too long/);
  console.log('Observed legacy CSP block');report.checks.push('Reproduced: old production CSP blocks Firebase /.lp script and room creation times out after persisted socket failure');await old.context().close();
  const fixed=await pageWithPolicy(current);await fixed.locator('#host-entry').click();
  await fixed.waitForFunction(()=>window.BuzzyView?.state.networkReady&&!document.documentElement.hasAttribute('data-network-busy'),{},{timeout:25000});
  const code=await fixed.evaluate(()=>window.BuzzyView.state.code),uid=await identity(fixed);
  assert.match(code,/^[A-HJ-NP-Z2-9]{4}$/);assert.deepEqual(await fixed.evaluate(()=>window.cspViolations),[]);
  await fixed.context().setOffline(true);await fixed.waitForFunction(()=>document.documentElement.hasAttribute('data-network-busy'));await fixed.context().setOffline(false);
  await fixed.waitForFunction(()=>!document.documentElement.hasAttribute('data-network-busy'),{},{timeout:25000});assert.equal(await identity(fixed),uid);
  await fixed.reload();await fixed.waitForFunction(()=>window.BuzzyView?.state.networkReady,{},{timeout:25000});assert.equal(await identity(fixed),uid);assert.equal(await fixed.evaluate(()=>window.BuzzyView.state.code),code);assert.deepEqual(await fixed.evaluate(()=>window.cspViolations),[]);
  const c=await read(fixed,`rooms/${code}/control`);assert.equal((await call(fixed,{action:'delete',code,roundId:c.r,attempt:c.a})).ok,true);
  report.checks.push('Current CSP: forced fallback creates a room, reconnects and reloads with same identity/room and no CSP violations');report.status='passed';
 }catch(e){report.views=[];for(const c of h.browser.contexts())for(const p of c.pages())report.views.push(await p.evaluate(()=>({entry:document.querySelector('#entry-status')?.textContent,flag:localStorage.getItem('firebase:previous_websocket_failure'),frames:document.querySelectorAll('iframe').length})).catch(()=>null));console.log(JSON.stringify(report));report.status='failed';report.error=e.stack;throw e;}finally{await h.close();writeFileSync('reports/transport-csp-293.json',JSON.stringify(report,null,2)+'\n');}
});
