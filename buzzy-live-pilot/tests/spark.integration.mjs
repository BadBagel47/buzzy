import test from 'node:test';
import assert from 'node:assert/strict';
import {counter} from './traffic.mjs';
import {writeFileSync} from 'node:fs';
import {browserHarness,call,identity,read} from './browser-support.mjs';
const report={status:'running',checks:[],metrics:{},limitations:['WebSocket payload bytes exclude TLS, transport framing, retries outside this run and hosting/auth traffic. Emulator measurements are not billing estimates.']};
const ok=async(page,input)=>{const r=await call(page,input);assert.equal(r.ok,true,JSON.stringify(r));return r.data;};
const bad=async(page,input)=>{const r=await call(page,input);assert.equal(r.ok,false,JSON.stringify(r));return r;};
async function raw(page,code,changes){return page.evaluate(async({code,changes})=>{const c=await import('/src/client.js').then(m=>m.getClient());const {ref,update}=await import('/tests/raw-client.js');try{await update(ref(c.db,`rooms/${code}`),changes);return true;}catch{return false;}},{code,changes});}
async function deniedRead(page,path){assert.equal(await page.evaluate(async p=>{const c=await import('/src/client.js').then(m=>m.getClient());try{await c.read(p);return false;}catch{return true;}},path),true,path);}
async function watch(page,code){await page.evaluate(async code=>{const c=await import('/src/client.js').then(m=>m.getClient());window.stopWatch?.();window.room=null;window.stopWatch=c.watch(code,v=>window.room=v,e=>window.watchError=e.message);},code);await page.waitForFunction(()=>window.room?.round);}
const room=page=>page.evaluate(()=>window.room);
await test('Connected UI backend: security, ordering and lifecycle',async t=>{
 const traffic=counter(),h=await browserHarness(page=>traffic.attach(page));
 try{
  const host=await h.page(1280),a=await h.page(),b=await h.page(),outsider=await h.page();
  const uidA=await identity(a),uidB=await identity(b),owner=await identity(host);
  const metrics=traffic.value;
  let code;
  const step=async(name,fn)=>{let failure;await t.test(name,async()=>{try{await fn();}catch(e){failure=e;throw e;}});if(failure)throw failure;report.checks.push(name);};
  await step('Four-character room, stable create receipt, membership and private separation',async()=>{
   const createId='repeatable-create-286';({code}=await ok(host,{action:'create',commandId:createId}));assert.match(code,/^[A-HJ-NP-Z2-9]{4}$/);
   assert.equal((await ok(host,{action:'create',commandId:createId})).code,code);
   await ok(a,{action:'join',code,name:'Alex'});await ok(b,{action:'join',code,name:'Anna'});
   await Promise.all([watch(host,code),watch(a,code),watch(b,code)]);
   assert.equal((await room(host)).players.length,2);
   assert.equal(await raw(host,code,{'private/question':{answer:'Jupiter'}}),true);
   await deniedRead(a,`rooms/${code}/private`);await deniedRead(a,`rooms/${code}/archive`);await deniedRead(outsider,`rooms/${code}/members`);await deniedRead(outsider,`rooms/${code}`);
   await ok(a,{action:'join',code,name:'Cannot replace existing name'});assert.equal((await read(host,`rooms/${code}/members/${uidA}`)).name,'Alex');
  });
  await step('An occupied generated room code is preserved and creation chooses another code',async()=>{
   const commandId='forced-collision-286';
   const occupied=await host.evaluate(async({owner,commandId})=>{const bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(`${owner}:${commandId}:0`)));return [...bytes.slice(0,4)].map(n=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[n%32]).join('');},{owner,commandId});
   await outsider.evaluate(async code=>{const c=await import('/src/client.js').then(m=>m.getClient());const {ref,set}=await import('/tests/raw-client.js');await set(ref(c.db,`rooms/${code}`),{meta:{owner:c.uid,createdAt:{'.sv':'timestamp'},createId:'already-occupied',schema:1},control:{r:1,a:1,phase:'ready',mode:'timed',startedAt:0,ms:10000,version:0,commandId:'already-occupied',resultUid:''},attempts:{'1_1':{n:0}}});},occupied);
   const created=(await ok(host,{action:'create',commandId})).code;assert.notEqual(created,occupied);
   assert.equal((await read(outsider,`rooms/${occupied}/meta`)).owner,await identity(outsider));
   await ok(host,{action:'delete',code:created,roundId:1,attempt:1});await ok(outsider,{action:'delete',code:occupied,roundId:1,attempt:1});
  });
  await step('Raw hostile writes cannot forge identity, rank, timestamp, points or host',async()=>{
   await ok(host,{action:'start',code,roundId:1,attempt:1,mode:'timed',durationMs:10000});
   for(const changes of [
    {'control/phase':'finished'}, {'meta/owner':uidA}, {[`scores/${uidA}`]:900},
    {'attempts/1_1/n':1,[`attempts/1_1/hits/${uidB}`]:{i:1,at:{'.sv':'timestamp'},cmd:'forged'}},
    {'attempts/1_1/n':9,[`attempts/1_1/hits/${uidA}`]:{i:9,at:{'.sv':'timestamp'},cmd:'rank'}},
    {'attempts/1_1/n':1,[`attempts/1_1/hits/${uidA}`]:{i:1,at:123,cmd:'clock'}}
   ])assert.equal(await raw(a,code,changes),false,JSON.stringify(changes));
   assert.equal(await raw(outsider,code,{'attempts/1_1/n':1,[`attempts/1_1/hits/${await identity(outsider)}`]:{i:1,at:{'.sv':'timestamp'},cmd:'outsider'}}),false);
  });
  await step('Concurrent Timed buzzes have permanent unique ranks; duplicate buzz and grade are idempotent',async()=>{
   const input={action:'buzz',code,roundId:1,attempt:1};
   await Promise.all([ok(a,input),ok(b,input)]);const hits=(await read(host,`rooms/${code}/attempts/1_1`)).hits;
   assert.deepEqual(Object.values(hits).map(v=>v.i).sort(),[1,2]);await ok(a,input);assert.equal((await read(host,`rooms/${code}/attempts/1_1`)).n,2);
   await ok(host,{action:'stop',code,roundId:1,attempt:1});
   const first=Object.entries(hits).find(([,h])=>h.i===1)[0];
   const grade={action:'grade',code,roundId:1,attempt:1,playerId:first,result:'correct',commandId:'grade-once'};await ok(host,grade);await ok(host,grade);
   assert.equal(await read(host,`rooms/${code}/scores/${first}`),1);
   assert.equal(await raw(a,code,{[`attempts/1_1/judgments/${uidA}`]:{kind:'correct',delta:100,cmd:'fake'}}),false);
  });
  await step('First mode selects one winner; Retry rejects stale attempt and incorrect responder',async()=>{
   await ok(host,{action:'next',code,roundId:1,attempt:1});await ok(host,{action:'start',code,roundId:2,attempt:1,mode:'first',durationMs:10000});
   const result=await Promise.all([call(a,{action:'buzz',code,roundId:2,attempt:1}),call(b,{action:'buzz',code,roundId:2,attempt:1})]);assert.equal(result.filter(v=>v.ok).length,1);
   const first=(await read(host,`rooms/${code}/attempts/2_1`)).first.uid;
   await ok(host,{action:'grade',code,roundId:2,attempt:1,playerId:first,result:'incorrect'});
   await ok(host,{action:'retry',code,roundId:2,attempt:1});await bad(a,{action:'buzz',code,roundId:2,attempt:1});
   await ok(host,{action:'start',code,roundId:2,attempt:2,mode:'first',durationMs:1000});
   await bad(first===uidA?a:b,{action:'buzz',code,roundId:2,attempt:2});
   assert.equal(await raw(first===uidA?a:b,code,{'attempts/2_2/first':{uid:first,at:{'.sv':'timestamp'},cmd:'retry-bypass'}}),false);
  });
  await step('Server deadline rejects late writes, late join waits until next question',async()=>{
   await ok(outsider,{action:'join',code,name:'Guest'});const guest=await identity(outsider);assert.equal((await read(host,`rooms/${code}/members/${guest}`)).fromRound,3);
   await bad(outsider,{action:'buzz',code,roundId:2,attempt:2});await new Promise(r=>setTimeout(r,1150));
   const eligible=uidA===(await read(host,`rooms/${code}/attempts/2_1/first`)).uid?b:a;
   await bad(eligible,{action:'buzz',code,roundId:2,attempt:2});
   await ok(host,{action:'expire',code,roundId:2,attempt:2});await ok(host,{action:'next',code,roundId:2,attempt:2});
   await ok(host,{action:'start',code,roundId:3,attempt:1,mode:'timed',durationMs:10000});await ok(outsider,{action:'buzz',code,roundId:3,attempt:1});
   await deniedRead(a,`rooms/${code}/attempts/1_1`);
  });
  await step('Reload retains anonymous identity and room state; connection can recover',async()=>{
   const before=await identity(a);await a.reload();assert.equal(await identity(a),before);await watch(a,code);
   await a.evaluate(async()=>{const c=await import('/src/client.js').then(m=>m.getClient());c.setOnline(false);});
   await a.evaluate(async()=>{const c=await import('/src/client.js').then(m=>m.getClient());c.setOnline(true);});
   await a.waitForFunction(async()=>{const c=await import('/src/client.js').then(m=>m.getClient());return await new Promise(resolve=>{let stop;stop=c.watchConnection(v=>{if(v){resolve(true);setTimeout(()=>stop(),0);}});});});
  });
  await step('Countdown generates no per-second database writes; old attempt listeners detach',async()=>{
   const before={...metrics};await new Promise(r=>setTimeout(r,2200));
   report.metrics.idle2200ms={sentBytes:metrics.sentBytes-before.sentBytes,receivedBytes:metrics.receivedBytes-before.receivedBytes,databaseWrites:metrics.databaseWrites-before.databaseWrites};
   assert.equal(report.metrics.idle2200ms.databaseWrites,0);
   assert.ok(metrics.listenStops>=4,'prior attempts must detach');
   report.metrics.allClientsObservedWebSocketPayload={...metrics};
  });
  await step('Twelve simultaneous players keep ranks unique, and a thirteenth cannot join',async()=>{
   const stress=(await ok(host,{action:'create'})).code,players=[];
   for(let i=0;i<12;i++)players.push(await h.page());
   await Promise.all(players.map((p,i)=>ok(p,{action:'join',code:stress,name:`P${i}`})));
   await bad(outsider,{action:'join',code:stress,name:'Thirteenth'});
   await ok(host,{action:'start',code:stress,roundId:1,attempt:1,mode:'timed',durationMs:10000});
   await Promise.all(players.map(p=>ok(p,{action:'buzz',code:stress,roundId:1,attempt:1})));
   const state=await read(host,`rooms/${stress}/attempts/1_1`);
   assert.equal(state.n,12);assert.deepEqual(Object.values(state.hits).map(h=>h.i).sort((a,b)=>a-b),Array.from({length:12},(_,i)=>i+1));
   report.metrics.twelvePlayerRanks=Object.values(state.hits).map(h=>h.i).sort((a,b)=>a-b);
   await ok(host,{action:'delete',code:stress,roundId:1,attempt:1});for(const p of players)await p.context().close();
  });
  await step('Custom scoring preserves existing negative totals with the zero-floor setting',async()=>{
   const roomCode=(await ok(host,{action:'create'})).code;await ok(a,{action:'join',code:roomCode,name:'Score policy'});
   await ok(host,{action:'adjust',code:roomCode,playerId:uidA,delta:-4,allowNegative:true});await ok(host,{action:'adjust',code:roomCode,playerId:uidA,delta:-2,allowNegative:false});assert.equal(await read(host,`rooms/${roomCode}/scores/${uidA}`),-4);
   await ok(host,{action:'adjust',code:roomCode,playerId:uidA,delta:1,allowNegative:false});assert.equal(await read(host,`rooms/${roomCode}/scores/${uidA}`),-3);
   await ok(host,{action:'start',code:roomCode,roundId:1,attempt:1,mode:'first',durationMs:1000,timer:false,incorrect:-2,allowNegative:false});await ok(a,{action:'buzz',code:roomCode,roundId:1,attempt:1});await ok(host,{action:'grade',code:roomCode,roundId:1,attempt:1,playerId:uidA,result:'incorrect'});assert.equal(await read(host,`rooms/${roomCode}/scores/${uidA}`),-3);
   await ok(host,{action:'next',code:roomCode,roundId:1,attempt:1});await ok(host,{action:'start',code:roomCode,roundId:2,attempt:1,mode:'first',durationMs:1000,timer:false,correct:1,allowNegative:false});await ok(a,{action:'buzz',code:roomCode,roundId:2,attempt:1});await ok(host,{action:'grade',code:roomCode,roundId:2,attempt:1,playerId:uidA,result:'correct'});assert.equal(await read(host,`rooms/${roomCode}/scores/${uidA}`),-2);
   await bad(a,{action:'adjust',code:roomCode,playerId:uidA,delta:100,allowNegative:true});assert.equal(await read(host,`rooms/${roomCode}/scores/${uidA}`),-2);await ok(host,{action:'delete',code:roomCode,roundId:2,attempt:1});
  });
  await step('Owner can delete completed test room; players cannot delete it',async()=>{
   assert.equal(await raw(a,code,{'private/question':null}),false);
   await host.evaluate(()=>window.stopWatch());await a.evaluate(()=>window.stopWatch());await b.evaluate(()=>window.stopWatch());
   await ok(host,{action:'delete',code,roundId:3,attempt:1});assert.equal(await read(host,`rooms/${code}/control`),null);
  });
  assert.deepEqual(h.pageErrors,[]);report.status='passed';
 }catch(e){report.status='failed';report.error=e.stack;throw e;}finally{await h.close();writeFileSync('reports/spark-integration.json',JSON.stringify(report,null,2)+'\n');}
});
