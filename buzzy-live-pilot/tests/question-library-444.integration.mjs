import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {browserHarness} from './browser-support.mjs';
// #444: prepared questions are kept on this device, copied into each new room, and can be exported and imported.
const ready=p=>p.waitForFunction(()=>window.BuzzyView?.state.networkReady&&!document.documentElement.hasAttribute('data-network-busy'));
const idle=p=>p.waitForFunction(()=>!document.documentElement.hasAttribute('data-network-busy'));
const own=p=>p.evaluate(()=>BuzzyView.state.questions.filter(q=>!q.isDemo).map(q=>({title:q.title,text:q.text,played:!!q.played})));
await test('Questions survive a new room on the same device, and export and import work',async()=>{
 const h=await browserHarness();
 try{
  const c=await h.browser.newContext({viewport:{width:1280,height:900},acceptDownloads:true});const host=await c.newPage();host.setDefaultTimeout(15000);
  await host.goto('http://127.0.0.1:5173');await host.locator('#host-entry').click();await ready(host);
  const firstCode=await host.evaluate(()=>BuzzyView.state.code);
  await host.locator('[data-nav="questions"]').click();await host.locator('[data-action="new-question"]').click();
  await host.locator('#qtitle').fill('Capital');await host.locator('#qtext').fill('What is the capital of Sweden?');await host.locator('[data-action="save-question"]').click();await idle(host);
  const saved=await host.evaluate(()=>JSON.parse(localStorage.getItem('buzzy-question-library')));
  assert.deepEqual(saved.questions.map(q=>q.text),['What is the capital of Sweden?'],'The question is saved on this device');
  // End this game and host a new one: the question is there, not played.
  await host.locator('[data-nav="more"]').click();await host.locator('[data-action="end-room"]').click();await host.locator('[data-action="network-confirm-exit"]').click();await host.locator('#host-entry').waitFor();
  await host.locator('#host-entry').click();await ready(host);
  assert.notEqual(await host.evaluate(()=>BuzzyView.state.code),firstCode);
  assert.deepEqual(await own(host),[{title:'Capital',text:'What is the capital of Sweden?',played:false}]);
  // Export.
  await host.locator('[data-nav="questions"]').click();await idle(host);
  const [download]=await Promise.all([host.waitForEvent('download'),host.locator('[data-action="library-export"]').click()]);
  assert.match(download.suggestedFilename(),/^buzzy-questions-\d{4}-\d{2}-\d{2}\.json$/);
  const exported=JSON.parse(readFileSync(await download.path(),'utf8'));
  assert.equal(exported.kind,'questions');assert.deepEqual(exported.questions.map(q=>q.title),['Capital']);
  // Import: one new question and one already in the queue.
  const dir=mkdtempSync(path.join(tmpdir(),'buzzy-import-')),file=path.join(dir,'questions.json');
  writeFileSync(file,JSON.stringify({questions:[...exported.questions,{id:'x1',title:'Planets',text:'Which planet is the largest?',points:1,penalty:0,mode:'default',timer:'default',active:true}]}));
  const [chooser]=await Promise.all([host.waitForEvent('filechooser'),host.locator('[data-action="library-import"]').click()]);
  await chooser.setFiles(file);
  await host.waitForFunction(()=>BuzzyView.state.questions.filter(q=>!q.isDemo).length===2);
  assert.deepEqual((await own(host)).map(q=>q.title),['Capital','Planets']);
  await idle(host);
  // A file that is not a question list is refused with a message.
  writeFileSync(file,'not json');
  const [bad]=await Promise.all([host.waitForEvent('filechooser'),host.locator('[data-action="library-import"]').click()]);
  await bad.setFiles(file);
  await host.waitForFunction(()=>/not a Buzzy question file/.test(document.getElementById('toast')?.textContent||document.body.textContent));
  assert.equal((await own(host)).length,2);
 }finally{await h.close();}
});
