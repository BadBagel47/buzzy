import test from 'node:test';
import assert from 'node:assert/strict';
import {browserHarness,read} from './browser-support.mjs';
// #387: AI questions with a fake Claude client on the local dev server only.
const ready=p=>p.waitForFunction(()=>window.BuzzyView?.state.networkReady&&!document.documentElement.hasAttribute('data-network-busy'));
const idle=p=>p.waitForFunction(()=>!document.documentElement.hasAttribute('data-network-busy'));
const KEY='sk-ant-api03-localtestkey-0000abcd';
function installMock(){
 const src=(a,b)=>[{url:`https://${a}/x`,title:a},{url:`https://${b}/y`,title:b}];
 window.__aiCalls=[];
 window.__buzzyAiMock={
  models:{retrieve:async id=>{window.__aiCalls.push({kind:'models',id});return {id};}},
  beta:{messages:{create:async params=>{
   window.__aiCalls.push({kind:'messages',params:JSON.parse(JSON.stringify(params))});
   await new Promise(r=>setTimeout(r,150));
   const usage={input_tokens:2000,output_tokens:600,server_tool_use:{web_search_requests:2}};
   const submit=params.tools.find(t=>t.name==='submit_questions'||t.name==='submit_verdicts');
   if(submit.name==='submit_questions')return {stop_reason:'tool_use',usage,content:[{type:'tool_use',name:'submit_questions',input:{questions:[
    {topic:'Geography',difficulty:'medium',question:'Which river flows through Vienna, Budapest and Belgrade?',answer:'Danube',accepted_answers:['Donau'],explanation:'The Danube passes four capitals.',sources:src('britannica.com','wikipedia.org')},
    {topic:'Geography',difficulty:'hard',question:'How many countries border Germany as of 2026?',answer:'9',accepted_answers:['nine'],explanation:'Nine neighbours.',sources:src('britannica.com','wikipedia.org')},
    {topic:'Geography',difficulty:'easy',question:'Who is the richest person in the world?',answer:'Someone',accepted_answers:[],explanation:'Changes often.',sources:src('forbes.com','bloomberg.com')},
    {topic:'Geography',difficulty:'easy',question:'What is the capital of Norway?',answer:'Oslo',accepted_answers:[],explanation:'Oslo.',sources:src('britannica.com','wikipedia.org')},
    {topic:'Geography',difficulty:'easy',question:'What is the capital of Australia?',answer:'Canberra',accepted_answers:[],explanation:'Canberra.',sources:src('britannica.com','wikipedia.org')},
    {topic:'Geography',difficulty:'medium',question:'Which is the longest river in Sweden?',answer:'Klarälven–Göta älv',accepted_answers:[],explanation:'Longest system.',sources:src('ne.se','wikipedia.org')},
   ]}}]};
   const items=JSON.parse(params.messages[0].content.slice(params.messages[0].content.indexOf('[')));
   const verdict=item=>/richest/.test(item.question)?{verdict:'rejected',reason:'Time-sensitive: the answer changes often.',sources:[]}
    :/as of 2026/.test(item.question)?{verdict:'check',reason:'Can change; the year is in the question.',sources:src('britannica.com','cia.gov')}
    :/Norway/.test(item.question)?{verdict:'verified',reason:'Confirmed.',sources:[{url:'https://britannica.com/a',title:'a'},{url:'https://www.britannica.com/b',title:'b'}]}
    :{verdict:'verified',reason:'Confirmed.',sources:src('britannica.com','wikipedia.org')};
   return {stop_reason:'tool_use',usage,content:[{type:'tool_use',name:'submit_verdicts',input:{verdicts:items.map(i=>({id:i.id,...verdict(i)}))}}]};
  }}},
 };
}
await test('AI questions: key in this browser only, two-step check, review, queue and host-only answer',async()=>{
 const h=await browserHarness();
 try{
  const c=await h.browser.newContext({viewport:{width:1280,height:900},locale:'sv-SE'});await c.addInitScript(installMock);
  const host=await c.newPage();host.setDefaultTimeout(15000);await host.goto('http://127.0.0.1:5173');await host.locator('#host-entry').click();await ready(host);
  const code=await host.evaluate(()=>BuzzyView.state.code);
  // Without a key the panel points to Settings.
  await host.locator('[data-nav="questions"]').click();await idle(host);
  await host.locator('[data-action="ai-open"]').click();await host.locator('.ai-panel [data-action="ai-open-settings"]').click();
  await host.locator('.settings-ai-card').waitFor();
  // A malformed key is refused locally; a valid one is checked with one Models API call and stored in this browser only.
  await host.locator('#ai-key-input').fill('not-a-key');await host.locator('[data-action="ai-key-save"]').click();
  await host.locator('.settings-ai-card .ai-error').waitFor();
  await host.locator('#ai-key-input').fill(KEY);await host.locator('[data-action="ai-key-save"]').click();
  await host.locator('.settings-ai-card .ai-key-status').waitFor();
  assert.equal(await host.evaluate(()=>localStorage.getItem('buzzy-anthropic-key')),KEY);
  assert.deepEqual(await host.evaluate(()=>window.__aiCalls.filter(c=>c.kind==='models').map(c=>c.id)),['claude-opus-5-5']);
  // Generate one topic; the device language (sv) is preselected.
  await host.locator('[data-nav="questions"]').click();await idle(host);
  await host.locator('[data-action="ai-open"]').click();await host.locator('.ai-panel #ai-topic').waitFor();
  assert.equal(await host.locator('[data-action="ai-language:sv"][aria-pressed="true"]').count(),1);
  await host.locator('#ai-topic').fill('Geography');await host.locator('[data-action="ai-count:5"]').click();
  // #395: a period is sent with the topic.
  await host.locator('[data-action="ai-period:1980s"]').click();await host.locator('[data-action="ai-period:1980s"][aria-pressed="true"]').waitFor();
  await host.locator('[data-action="ai-generate"]').click();
  await host.locator('.ai-panel[aria-busy="true"]').waitFor();
  await host.locator('.ai-draft').first().waitFor();
  const calls=await host.evaluate(()=>window.__aiCalls.filter(c=>c.kind==='messages').map(c=>c.params));
  assert.equal(calls[0].model,'claude-opus-5-5');assert.equal(calls[0].fallbacks,'default');assert.deepEqual(calls[0].betas,['server-side-fallback-2026-07-01']);
  assert.ok(calls[0].tools.some(t=>t.type==='web_search_20260209'));assert.match(calls[0].messages[0].content,/in Swedish/);
  assert.match(calls[0].messages[0].content,/only about things from the 1980s \(1980–1989\)/);assert.match(calls[0].messages[0].content,/Today's date is \d{4}-\d{2}-\d{2}/);
  assert.ok(calls.length>=3,'One write call and at least two fact-check batches');
  assert.ok(calls.slice(1).every(p=>!/passes four capitals/.test(p.messages[0].content)),'The checker does not see the writer explanation');
  // Review: verified preselected, time-sensitive with year unselected, one-source and wrong ones rejected, duplicates skipped.
  const review=await host.evaluate(()=>BuzzyView.state.ai.drafts.map(d=>[d.question.slice(0,24),d.status,d.selected]));
  assert.ok(review.some(([q,s,sel])=>q.startsWith('Which river')&&s==='verified'&&sel));
  assert.ok(review.some(([q,s,sel])=>q.startsWith('How many countries')&&s==='check'&&!sel));
  const rejected=await host.evaluate(()=>BuzzyView.state.ai.rejected.map(r=>r.question));
  assert.ok(rejected.some(q=>/richest/.test(q))&&rejected.some(q=>/Norway/.test(q)),'Rejected: time-sensitive and only one independent source');
  assert.equal((await host.locator('.ai-rejected summary').textContent()).trim(),'2 rejected');
  // #398: the rejected list opens with a height animation and stays open across re-renders.
  await host.locator('.ai-rejected summary').click();await host.waitForFunction(()=>document.querySelector('.ai-rejected').open&&BuzzyView.state.ai.rejectedOpen);
  await host.locator('.ai-draft',{hasText:'How many countries'}).locator('input.toggle').check();
  await host.locator('[data-action="ai-add"]').click();await host.locator('.ai-panel').waitFor({state:'detached'});
  await host.waitForFunction(()=>BuzzyView.state.questions.filter(q=>q.ai).length===4);
  const saved=await host.evaluate(()=>BuzzyView.state.questions.filter(q=>q.ai).map(q=>({text:q.text,answer:q.answer,topic:q.topic,status:q.ai.status,sources:q.sources.length})));
  assert.ok(saved.every(q=>q.answer&&q.topic==='Geography'&&q.sources>=2));
  // The key never enters the room data; the questions do (host-only private node).
  await host.waitForTimeout(800);
  const privateData=JSON.stringify(await read(host,`rooms/${code}/private`));
  assert.ok(!privateData.includes(KEY)&&!privateData.includes('sk-ant'),'API key is not stored in the room');
  assert.ok(privateData.includes('Danube'),'Questions with answers are saved for the host');
  // The queue shows answer, topic and AI status; the editor shows the answer field.
  await host.locator('[data-nav="questions"]').click();await idle(host);
  await host.locator('.library-question-card',{hasText:'Vienna'}).locator('.library-card-answer',{hasText:'Danube'}).waitFor();
  assert.equal(await host.locator('.library-question-card',{hasText:'Vienna'}).locator('.library-card-meta .ai-meta-status').textContent(),'AI · Verified');
  await host.locator('.library-question-card',{hasText:'Vienna'}).locator('.library-card-meta .library-card-mode',{hasText:'80s'}).waitFor();
  // Players see the question but never the answer; the host sees the answer in Play.
  const pc=await h.browser.newContext({viewport:{width:390,height:844}});const player=await pc.newPage();await player.goto('http://127.0.0.1:5173');
  await player.locator('#room-code').fill(code);await player.locator('#player-name').fill('Ada');await player.locator('.join-button').click();await ready(player);
  await host.locator('[data-nav="play"]').click();await host.locator('[data-action="set-play-mode:prepared"]').click();await host.locator('.quickplay-main[data-action="present"]').waitFor();await idle(host);
  await host.locator('.quickplay-main[data-action="present"]').click();await idle(host);
  await host.locator('.host-answer b',{hasText:'Danube'}).waitFor();
  await player.locator('.ph-question-inner',{hasText:'Vienna'}).waitFor();
  assert.equal((await player.content()).includes('Danube'),false,'The answer never reaches players');
  assert.equal(await player.evaluate(async code=>{const c=await import('/src/client.js').then(m=>m.getClient());try{await c.read(`rooms/${code}/private`);return 'readable';}catch(e){return 'denied';}},code),'denied');
  await pc.close();await c.close();
 }finally{await h.close();}
});
await test('AI questions: a saved mix survives a reload, sends every topic, and can be cancelled',async()=>{
 const h=await browserHarness();
 try{
  const c=await h.browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,locale:'en-GB'});
  await c.addInitScript(installMock);await c.addInitScript(key=>localStorage.setItem('buzzy-anthropic-key',key),KEY);
  await c.addInitScript(()=>{const create=window.__buzzyAiMock.beta.messages.create;window.__buzzyAiMock.beta.messages.create=async(params,options)=>{if(window.__aiSlow){window.__aiCalls.push({kind:'messages',params:JSON.parse(JSON.stringify(params))});await new Promise((resolve,reject)=>{const t=setTimeout(resolve,20000);options?.signal?.addEventListener('abort',()=>{clearTimeout(t);const e=new Error('aborted');e.name='AbortError';reject(e);});});}return create(params,options);};});
  const host=await c.newPage();host.setDefaultTimeout(15000);await host.goto('http://127.0.0.1:5173');await host.locator('#host-entry').click();await ready(host);
  await host.locator('[data-nav="questions"]').click();await idle(host);
  await host.locator('[data-action="ai-open"]').click();await host.locator('[data-action="ai-mode:mix"]').click();
  assert.equal(await host.locator('[data-action="ai-language:en"][aria-pressed="true"]').count(),1,'English device language is preselected');
  await host.locator('[data-ai-field="row:0:topic"]').fill('Music, 80s');await host.locator('[data-ai-field="row:0:count"]').fill('2');
  await host.locator('[data-ai-field="row:1:topic"]').fill('Sports');await host.locator('[data-ai-field="row:1:count"]').fill('3');await host.locator('[data-ai-field="row:1:difficulty"]').selectOption('hard');await host.locator('[data-ai-field="row:1:period"]').selectOption('week');
  await host.locator('[data-ai-field="mixName"]').fill('Friday pub quiz');await host.locator('[data-action="ai-mix-save"]').click();
  await host.locator('[data-action="ai-generate"]',{hasText:'Generate 5 questions'}).waitFor();
  await host.reload();await ready(host);
  await host.locator('[data-nav="questions"]').click();await idle(host);await host.locator('[data-action="ai-open"]').click();await host.locator('[data-action="ai-mode:mix"]').click();
  await host.locator('[data-action="ai-mix-load:0"]',{hasText:'Friday pub quiz'}).click();
  assert.equal(await host.locator('[data-ai-field="row:1:topic"]').inputValue(),'Sports');
  await host.evaluate(()=>{window.__aiSlow=true;});
  await host.locator('[data-action="ai-generate"]').click();await host.locator('.ai-panel[aria-busy="true"]').waitFor();
  const prompt=await host.evaluate(()=>window.__aiCalls.filter(c=>c.kind==='messages').at(-1).params.messages[0].content);
  assert.match(prompt,/2 about "Music, 80s"/);assert.match(prompt,/3 about "Sports", difficulty: hard: for enthusiasts of the topic, only about things from the last 7 days/);assert.match(prompt,/must say when it happened/);assert.match(prompt,/in English/);
  await host.locator('[data-action="ai-cancel"]').click();
  await host.locator('.ai-panel [data-action="ai-generate"]').waitFor();
  assert.equal(await host.evaluate(()=>BuzzyView.state.questions.filter(q=>q.ai).length),0,'Nothing is added on cancel');
  await c.close();
 }finally{await h.close();}
});
