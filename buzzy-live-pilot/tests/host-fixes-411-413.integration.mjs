import test from 'node:test';
import assert from 'node:assert/strict';
import {browserHarness} from './browser-support.mjs';
// #411 switches keep their identity across views, #412 AI questions top up to the requested number, #413 the key field is not a login field.
const ready=p=>p.waitForFunction(()=>window.BuzzyView?.state.networkReady&&!document.documentElement.hasAttribute('data-network-busy'));
const idle=p=>p.waitForFunction(()=>!document.documentElement.hasAttribute('data-network-busy'));
const KEY='sk-ant-api03-localtestkey-0000abcd';
function installMock(){
 const src=(a,b)=>[{url:`https://${a}/x`,title:a},{url:`https://${b}/y`,title:b}];
 const q=(n)=>({topic:'Science',difficulty:'easy',question:`Science question number ${n}?`,answer:`Answer ${n}`,accepted_answers:[],explanation:'',sources:[]});
 const writes=[[q(1)],[q(2),q(3),q(4),q(5)]];
 window.__aiCalls=[];
 window.__buzzyAiMock={
  models:{retrieve:async id=>({id})},
  beta:{messages:{create:async params=>{
   window.__aiCalls.push(JSON.parse(JSON.stringify(params)));
   await new Promise(r=>setTimeout(r,80));
   const usage={input_tokens:1000,output_tokens:300,server_tool_use:{web_search_requests:1}};
   const submit=params.tools.find(t=>t.name==='submit_questions'||t.name==='submit_verdicts');
   if(submit.name==='submit_questions')return {stop_reason:'tool_use',usage,content:[{type:'tool_use',name:'submit_questions',input:{questions:writes.shift()||[]}}]};
   const items=JSON.parse(params.messages[0].content.slice(params.messages[0].content.indexOf('[')));
   return {stop_reason:'tool_use',usage,content:[{type:'tool_use',name:'submit_verdicts',input:{verdicts:items.map(i=>({id:i.id,verdict:'verified',reason:'Confirmed.',sources:src('britannica.com','wikipedia.org')}))}}]};
  }}},
 };
}
await test('Switches stay themselves after Settings, AI questions top up, and the key field is no login field',async()=>{
 const h=await browserHarness();
 try{
  const c=await h.browser.newContext({viewport:{width:1280,height:900}});await c.addInitScript(installMock);
  const host=await c.newPage();host.setDefaultTimeout(15000);await host.goto('http://127.0.0.1:5173');await host.locator('#host-entry').click();await ready(host);
  // #411: Settings (Appearance switch) and back to Play.
  await host.locator('[data-nav="more"]').click();await idle(host);
  await host.locator('[data-action="host-theme:dark"]').click();await host.waitForFunction(()=>document.documentElement.dataset.hostThemeChoice==='dark');
  // #413: the key field is a plain text field with hidden characters, marked for password managers to skip, and not in a form.
  const field=await host.evaluate(()=>{const f=document.getElementById('ai-key-input');return {type:f.type,ignore:f.hasAttribute('data-1p-ignore')&&f.getAttribute('data-lpignore')==='true'&&f.hasAttribute('data-bwignore'),form:!!f.closest('form'),mask:getComputedStyle(f).webkitTextSecurity||getComputedStyle(f).getPropertyValue('-webkit-text-security')};});
  assert.deepEqual({type:field.type,ignore:field.ignore,form:field.form},{type:'text',ignore:true,form:false});assert.equal(field.mask,'disc');
  await host.locator('#ai-key-input').fill(KEY);await host.locator('[data-action="ai-key-save"]').click();await host.locator('.settings-ai-card .ai-key-status').waitFor();await idle(host);
  await host.locator('[data-nav="play"]').click();await idle(host);await host.waitForTimeout(700);
  const sw=await host.evaluate(()=>{const s=document.querySelector('.quickplay-card .play-mode-switch');return {label:s.getAttribute('aria-label'),actions:[...s.querySelectorAll('.play-mode-option')].map(b=>b.dataset.action),theme:!!document.querySelector('.quickplay-card [data-action^="host-theme"]'),text:s.textContent.replace(/\s+/g,' ').trim()};});
  assert.equal(sw.label,'Question source');assert.deepEqual(sw.actions,['set-play-mode:quick','set-play-mode:prepared']);assert.equal(sw.theme,false);assert.doesNotMatch(sw.text,/Dark|Auto|Light/);
  await host.locator('.quickplay-card [data-action="set-play-mode:prepared"]').click();await idle(host);
  assert.equal(await host.evaluate(()=>document.documentElement.dataset.hostThemeChoice),'dark','Choosing the question source does not change the theme');
  // Back and forth once more: Settings still has its own Appearance switch.
  await host.locator('[data-nav="more"]').click();await idle(host);await host.waitForTimeout(500);
  assert.equal(await host.locator('.settings-appearance-card [data-action="host-theme:dark"][aria-pressed="true"]').count(),1);
  // #412: five asked for; the first write returns one, so Buzzy asks once more for the missing four.
  await host.locator('[data-nav="questions"]').click();await idle(host);
  await host.locator('[data-action="ai-open"]').click();await host.locator('.ai-panel #ai-topic').waitFor();
  await host.locator('#ai-topic').fill('Science');await host.locator('[data-action="ai-count:5"]').click();
  await host.locator('[data-action="ai-generate"]').click();
  await host.waitForFunction(()=>BuzzyView.state.ai.phase==='review',null,{timeout:20000});
  const calls=await host.evaluate(()=>window.__aiCalls);
  const writes=calls.filter(p=>p.tools.some(t=>t.name==='submit_questions'));
  assert.equal(writes.length,2,'One extra write for the missing questions');
  assert.match(writes[0].messages[0].content,/Write 7 quiz questions/);assert.match(writes[1].messages[0].content,/Write 6 quiz questions/);
  assert.match(writes[1].messages[0].content,/Science question number 1\?/,'The extra write knows the first question');
  assert.match(writes[0].system,/Always submit exactly the number of questions/);assert.match(writes[0].system,/only when you are unsure/);
  assert.equal(writes[0].tools.find(t=>t.type==='web_search_20260209').max_uses,4);
  const checks=calls.filter(p=>p.tools.some(t=>t.name==='submit_verdicts'));
  assert.ok(checks.every(p=>p.tools.find(t=>t.type==='web_search_20260209').max_uses<=12));
  assert.equal(await host.evaluate(()=>BuzzyView.state.ai.drafts.length),5);
  assert.equal(await host.locator('.ai-notice').count(),0,'No shortfall notice when all five arrived');
  await host.screenshot({path:'reports/ai-topup-412.png'});
 }finally{await h.close();}
});
