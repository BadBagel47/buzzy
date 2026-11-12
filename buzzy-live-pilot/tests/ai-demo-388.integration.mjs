import test from 'node:test';
import assert from 'node:assert/strict';
import {browserHarness} from './browser-support.mjs';
// #388: the AI questions demo works without a key and never calls Anthropic.
const ready=p=>p.waitForFunction(()=>window.BuzzyView?.state.networkReady&&!document.documentElement.hasAttribute('data-network-busy'));
const idle=p=>p.waitForFunction(()=>!document.documentElement.hasAttribute('data-network-busy'));
await test('AI demo: sample questions without a key, clearly marked, no Claude requests',async()=>{
 const h=await browserHarness();
 try{
  const c=await h.browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,locale:'sv-SE'});
  const anthropic=[];await c.route('https://api.anthropic.com/**',route=>{anthropic.push(route.request().url());route.abort();});
  const host=await c.newPage();host.setDefaultTimeout(20000);await host.goto('http://127.0.0.1:5173');await host.locator('#host-entry').click();await ready(host);
  // From the Questions panel without a key, start the demo.
  await host.locator('[data-nav="questions"]').click();await idle(host);
  await host.locator('[data-action="ai-open"]').click();await host.locator('.ai-panel [data-action="ai-demo-start"]').click();
  await host.locator('.ai-panel .ai-demo-banner').waitFor();
  await host.locator('#ai-topic').fill('Musik');await host.locator('[data-action="ai-count:5"]').click();
  await host.locator('[data-action="ai-generate"]').click();
  await host.locator('.ai-panel[aria-busy="true"] .ai-demo-banner').waitFor();
  await host.locator('.ai-draft').first().waitFor();
  const drafts=await host.evaluate(()=>BuzzyView.state.ai.drafts.map(d=>({q:d.question,s:d.status,src:d.sources.length})));
  assert.ok(drafts.length>=5&&drafts.every(d=>d.s==='verified'&&d.src===2),JSON.stringify(drafts));
  assert.ok(drafts.some(d=>/ABBA|piano|Queen|Vivaldi|Trollflöjten|Brothers/.test(d.q)),'Swedish music questions from the bank');
  assert.ok(await host.evaluate(()=>BuzzyView.state.ai.rejected.length)>=1,'The demo also shows rejected examples');
  await host.locator('.ai-usage',{hasText:'no requests were sent'}).waitFor();
  await host.locator('[data-action="ai-add"]').click();
  await host.waitForFunction(()=>BuzzyView.state.questions.some(q=>q.ai?.demo));
  await host.locator('.library-question-card .ai-tag.demo',{hasText:'Demo · sample'}).first().waitFor();
  // A topic outside the bank gives a general mix with a notice; exit returns to the key prompt.
  await host.locator('[data-action="ai-open"]').click();
  if(await host.locator('.ai-panel [data-action="ai-new"]').count())await host.locator('.ai-panel [data-action="ai-new"]').click();
  await host.locator('#ai-topic').fill('Fjärilar på Gotland');await host.locator('[data-action="ai-generate"]').click();
  await host.locator('.ai-notice').waitFor();
  await host.locator('.ai-panel [data-action="ai-demo-exit"]').first().click();
  await host.locator('.ai-panel [data-action="ai-open-settings"]').waitFor();
  assert.deepEqual(anthropic,[],'No request reached api.anthropic.com');
  await c.close();
 }finally{await h.close();}
});
