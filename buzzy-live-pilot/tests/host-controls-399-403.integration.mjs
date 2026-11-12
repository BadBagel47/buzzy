import test from 'node:test';
import assert from 'node:assert/strict';
import {browserHarness} from './browser-support.mjs';
// #399 readable fields, #401 switches, #402 one secondary button, #403 inactive buttons, #400 drag to reorder.
const ready=p=>p.waitForFunction(()=>window.BuzzyView?.state.networkReady&&!document.documentElement.hasAttribute('data-network-busy'));
const idle=p=>p.waitForFunction(()=>!document.documentElement.hasAttribute('data-network-busy'));
const lum=c=>{const m=c.match(/\d+(\.\d+)?/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.03928?v/12.92:((v+.055)/1.055)**2.4;});return .2126*m[0]+.7152*m[1]+.0722*m[2];};
const ratio=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
await test('Dark switches and fields are readable; buttons share one style; inactive is obvious; drag reorders',async()=>{
 const h=await browserHarness();
 try{
  const c=await h.browser.newContext({viewport:{width:900,height:1000},colorScheme:'dark'}),p=await c.newPage();p.setDefaultTimeout(15000);
  await p.goto('http://127.0.0.1:5173');await p.locator('#host-entry').click();await ready(p);
  // #401: the knob is light in both states and the off track stands out from the card.
  await p.locator('#room-viewer').click();await p.locator('.studio-modal input.toggle').first().waitFor();
  const sw=await p.evaluate(()=>{const on=document.querySelector('.studio-modal input.toggle:checked');on.click();const off=document.querySelector('.studio-modal input.toggle:not(:checked)');const card=getComputedStyle(document.querySelector('.studio-modal')).backgroundColor;return {knob:getComputedStyle(off,'::after').backgroundColor,track:getComputedStyle(off).backgroundColor,border:getComputedStyle(off).borderTopColor,card};});
  assert.ok(lum(sw.knob)>.8,'Knob is light: '+sw.knob);assert.ok(ratio(sw.border,sw.card)>=3,'Off track border is visible: '+JSON.stringify(sw));
  await p.locator('.studio-modal .studio-close').click();await p.locator('.studio-modal').waitFor({state:'detached'});
  // #399: placeholders and typed text are readable in the dark theme.
  await p.locator('[data-nav="questions"]').click();await idle(p);await p.locator('[data-action="new-question"]').click();await p.locator('#qtitle').waitFor();
  const field=await p.evaluate(()=>{const f=document.querySelector('#qtitle'),c=getComputedStyle(f);return {bg:c.backgroundColor,text:c.color,ph:getComputedStyle(f,'::placeholder').color};});
  assert.ok(ratio(field.ph,field.bg)>=4.5,'Placeholder contrast: '+JSON.stringify(field));assert.ok(ratio(field.text,field.bg)>=7,'Text contrast');
  // Three questions for the drag test.
  for(const [i,t] of ['Alpha','Bravo','Charlie'].entries()){
   if(i)await p.locator('[data-action="new-question"]').click();
   await p.locator('#qtitle').fill(t);await p.locator('#qtext').fill(t+' question');await p.locator('[data-action="save-question"]').click();await idle(p);await p.locator('#modalroot .studio-modal').waitFor({state:'detached'});
  }
  // #400: drag Alpha below Charlie with the mouse; Bravo slides up while dragging.
  const cards=p.locator('.library-question-card[data-question-drag]');await cards.nth(2).waitFor();
  const a=await cards.nth(0).boundingBox(),cc=await cards.nth(2).boundingBox();
  await p.mouse.move(a.x+a.width*.45,a.y+a.height*.6);await p.mouse.down();
  for(let s=1;s<=12;s++){await p.mouse.move(a.x+a.width*.45,a.y+a.height*.6+(cc.y+cc.height*.8-a.y-a.height*.6)*s/12);await p.waitForTimeout(16);}
  const during=await p.evaluate(()=>[...document.querySelectorAll('.library-question-card[data-question-drag]')].map(e=>({active:e.classList.contains('queue-drag-active'),t:e.style.transform})));
  assert.ok(during[0].active&&during[1].t.includes('translateY(-'),'The dragged card follows and Bravo makes room: '+JSON.stringify(during));
  await p.mouse.up();await p.waitForTimeout(500);
  assert.deepEqual(await p.evaluate(()=>BuzzyView.state.questions.filter(q=>!q.played&&!q.isDemo).map(q=>q.title)),['Bravo','Charlie','Alpha']);
  // #402: secondary buttons share one style (light theme for exact values).
  await p.locator('[data-nav="more"]').click();await idle(p);await p.locator('[data-action="host-theme:light"]').click();await p.waitForTimeout(400);
  const look=await p.evaluate(()=>{const pick=t=>{const b=[...document.querySelectorAll('.btn')].find(e=>e.textContent.trim()===t);const c=getComputedStyle(b);return [c.backgroundColor,c.borderTopColor,c.color,c.fontWeight].join('|');};return {demo:pick('Try demo'),copy:pick('Copy room link'),history:pick('View game history')};});
  assert.equal(look.demo,look.copy);assert.equal(look.history,look.copy);
  // #403: an inactive button is clearly faded.
  await p.locator('[data-nav="questions"]').click();await idle(p);await p.locator('[data-action="ai-open"]').click();await p.locator('[data-action="ai-demo-start"]').click();await p.locator('[data-action="ai-mode:mix"]').click();
  const add=await p.evaluate(()=>{const b=document.querySelector('[data-action="ai-generate"]');return {disabled:b.disabled,opacity:getComputedStyle(b).opacity};});
  assert.equal(add.disabled,true);assert.ok(Number(add.opacity)<.5,JSON.stringify(add));
  await c.close();
 }finally{await h.close();}
});
