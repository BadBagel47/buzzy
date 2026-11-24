// #408: the same Buzzy pages on network-kit: the host picks the new room server, players join with
// the 6-character code, buzz and get scored by the room's rules, the viewer needs its own link.
import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {browserHarness,root} from './browser-support.mjs';

const state=p=>p.evaluate(()=>structuredClone(window.BuzzyView.state));
const ready=p=>p.waitForFunction(()=>window.BuzzyView?.state.networkReady===true);
const idle=p=>p.waitForFunction(()=>!document.documentElement.hasAttribute('data-network-busy'));

async function roomServer(){
 const dir=mkdtempSync(path.join(tmpdir(),'buzzy-rooms-'));
 const child=spawn(process.execPath,[path.join(root,'node_modules/wrangler/bin/wrangler.js'),'dev','--config','wrangler.local.jsonc','--port','8787','--ip','127.0.0.1','--persist-to',dir],{cwd:root,stdio:['ignore','pipe','pipe']});
 let log='';child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);
 for(let i=0;i<120;i++){
  try{const res=await fetch('http://127.0.0.1:8787/rooms');if(res.ok)return {stop:()=>child.kill('SIGTERM'),log:()=>log};}catch{}
  if(child.exitCode!==null)break;
  await new Promise(r=>setTimeout(r,500));
 }
 child.kill('SIGTERM');throw new Error(`The local room server did not start:\n${log.slice(-2000)}`);
}

await test('Host, players and viewer on network-kit rooms',async t=>{
 const rooms=await roomServer();
 const h=await browserHarness();
 const page=async(width=390)=>{const context=await h.browser.newContext({viewport:{width,height:844},isMobile:width<600,hasTouch:width<600});const p=await context.newPage();p.on('pageerror',e=>h.pageErrors.push(e.message));p.setDefaultTimeout(15000);await p.goto('http://127.0.0.1:5173');return p;};
 try{
  let host,a,b,cleo,code;
  await t.test('The host chooses the new room server and gets a 6-character code',async()=>{
   host=await page();
   await host.locator('#room-server').check();
   await host.locator('#host-entry').click();await ready(host);
   code=(await state(host)).code;assert.match(code,/^[A-HJ-NP-Z2-9]{6}$/);
   // The choice is remembered on this device for the next room.
   assert.equal(await host.evaluate(()=>localStorage.getItem('buzzy-room-server')),'network-kit');
  });
  await t.test('Players join with the code and see the question when the host opens it',async()=>{
   for(const name of ['Alex','Anna']){const p=await page();await p.locator('#room-code').fill(code.toLowerCase());await p.locator('#player-name').fill(name);await p.locator('.join-button').click();await ready(p);if(name==='Alex')a=p;else b=p;}
   await host.waitForFunction(()=>window.BuzzyView.state.players.length===2);
   assert.deepEqual((await state(host)).players.map(p=>[p.name,p.score,p.status]),[['Alex',0,'active'],['Anna',0,'active']]);
   // #449: a name already in the room is refused on the start page.
   const twin=await page();await twin.locator('#room-code').fill(code);await twin.locator('#player-name').fill('anna');await twin.locator('.join-button').click();
   await twin.waitForFunction(()=>/already taken/.test(document.getElementById('name-error')?.textContent||''));
   assert.equal(new URL(twin.url()).pathname,'/');await twin.close();
   await host.waitForTimeout(300);assert.equal((await state(host)).players.length,2);
   await idle(host);await host.locator('.quickplay-main[data-action="open"]').click();
   await a.waitForFunction(()=>window.BuzzyView.state.phase==='open');await b.waitForFunction(()=>window.BuzzyView.state.phase==='open');
  });
  await t.test('Buzzes are ordered by the room, the host judges and everyone sees the score',async()=>{
   await a.locator('.coin-buzzer').click();await host.waitForFunction(()=>window.BuzzyView.state.buzzes.length===1);
   await b.locator('.coin-buzzer').click();
   await host.waitForFunction(()=>window.BuzzyView.state.buzzes.length===2&&window.BuzzyView.state.phase==='closed');await idle(host);
   const hs=await state(host),alex=hs.players.find(p=>p.name==='Alex').id;
   assert.deepEqual(hs.buzzes.map(x=>[x.id,x.order]),[[alex,1],[hs.players.find(p=>p.name==='Anna').id,2]]);
   await host.locator('[data-action="correct"]').first().click();
   for(const p of [host,a,b])await p.waitForFunction(id=>window.BuzzyView.state.players.find(p=>p.id===id)?.score===1,alex);
   assert.equal((await state(a)).lastDecision,'correct');
  });
  await t.test('A reload keeps the player, the score and the host',async()=>{
   const id=await a.evaluate(()=>window.BuzzyView.state.viewAs);
   await a.reload();await ready(a);
   assert.equal(await a.evaluate(()=>window.BuzzyView.state.viewAs),id);
   assert.equal((await state(a)).players.find(p=>p.id===id).score,1);
   await host.reload();await ready(host);
   assert.equal((await state(host)).code,code);
   assert.equal((await state(host)).players.length,2);
  });
  await t.test('The viewer needs the link with its key; the code alone is not enough',async()=>{
   const bare=await page(1280);await bare.goto(`http://127.0.0.1:5173/viewer?room=${code}`);
   await bare.waitForFunction(()=>/viewer link is not valid|couldn’t connect|Retrying/i.test(document.body.innerText));
   const link=await host.evaluate(()=>window.BuzzyNetwork.viewerUrl());
   assert.match(link,new RegExp(`/viewer\\?room=${code}#key=`));
   const screen=await page(1280);await screen.goto(link);
   await screen.waitForFunction(()=>window.BuzzyViewer?.state?.players?.length===2);
   assert.equal(new URL(screen.url()).hash,'','the key leaves the address bar');
   await host.waitForFunction(()=>window.BuzzyView.state.viewerCount===1);
  });
  await t.test('Remove and ban work, and the code keeps working for others',async()=>{
   const anna=(await state(host)).players.find(p=>p.name==='Anna').id;
   await idle(host);await host.evaluate(id=>window.BuzzyNetwork.handle(`kick:${id}`),anna);
   await b.waitForFunction(()=>/You have been removed/.test(document.getElementById('network-status')?.textContent||''));
   await b.goto('http://127.0.0.1:5173');await b.locator('#room-code').fill(code);await b.locator('#player-name').fill('Anna');await b.locator('.join-button').click();await ready(b);
   await host.waitForFunction(id=>window.BuzzyView.state.players.find(p=>p.id===id)?.status==='active',anna);
   assert.equal((await state(host)).players.length,2,'the same player comes back, not a new one');
   await idle(host);await host.evaluate(id=>window.BuzzyNetwork.handle(`ban:${id}`),anna);
   await b.waitForFunction(()=>/banned/i.test(document.getElementById('network-status')?.textContent||''));
   await b.goto('http://127.0.0.1:5173');await b.locator('#room-code').fill(code);await b.locator('#player-name').fill('Anna');await b.locator('.join-button').click();
   await b.waitForFunction(()=>/banned/.test(document.getElementById('entry-status')?.textContent||''));
   cleo=await page();await cleo.locator('#room-code').fill(code);await cleo.locator('#player-name').fill('Cleo');await cleo.locator('.join-button').click();await ready(cleo);
   await host.waitForFunction(()=>window.BuzzyView.state.players.some(p=>p.name==='Cleo'));
  });
  await t.test('Ending the game closes the room for everyone',async()=>{
   await idle(host);await host.locator('[data-nav="more"]').click();await host.locator('[data-action="end-room"]').click();await host.locator('[data-action="network-confirm-exit"]').click();
   await host.locator('#host-entry').waitFor();
   for(const p of [a,cleo])await p.waitForFunction(()=>window.BuzzyView.state.modal==='network-ended');
  });
  assert.deepEqual(h.pageErrors,[]);
 }finally{await h.close();rooms.stop();}
});
