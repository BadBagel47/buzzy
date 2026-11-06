import test from 'node:test';
import assert from 'node:assert/strict';
import {deadline,connectionRecovery} from '../src/connection.js';
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
test('Timeout ends UI waiting but preserves a late operation result',async()=>{
 let finish;const operation=new Promise(resolve=>{finish=resolve;});
 await assert.rejects(deadline(operation,10),{code:'network/timeout'});finish('same room');assert.equal(await operation,'same room');
});
test('Lost connections retry without an online event and healthy connections stay quiet',async()=>{
 const events=new EventTarget(),visibility=new EventTarget();visibility.hidden=false;const network={onLine:true,connection:new EventTarget()};let update,disconnects=0,connects=0;
 const r=connectionRecovery({subscribe:fn=>{update=fn;fn(false);return ()=>{};},disconnect:()=>{disconnects++;update(false);},connect:()=>{connects++;},events,visibility,network,retryMs:20});
 try{
  await wait(30);assert.ok(connects>0);update(true);const before=connects;await wait(50);assert.equal(connects,before);
  events.dispatchEvent(new Event('offline'));assert.ok(disconnects);events.dispatchEvent(new Event('online'));assert.ok(connects>before);update(true);
  visibility.hidden=true;visibility.dispatchEvent(new Event('visibilitychange'));update(false);const hiddenCount=connects;await wait(30);assert.equal(connects,hiddenCount);
  visibility.hidden=false;visibility.dispatchEvent(new Event('visibilitychange'));assert.ok(connects>hiddenCount);update(true);await r.ready();const was=connects;network.connection.dispatchEvent(new Event('change'));assert.ok(connects>was,'Wifi/cellular change while online reconnects without an offline event');
 }finally{r.stop();}
});
