import {initializeRuntime} from './runtime-config.js';
import {initializeApp} from 'firebase/app';
import {getAuth,connectAuthEmulator,signInAnonymously,browserLocalPersistence,setPersistence} from 'firebase/auth';
import {getDatabase,connectDatabaseEmulator,onValue,ref,get,set,update,serverTimestamp,goOffline,goOnline} from 'firebase/database';
let connection;
const fail=message=>{throw new Error(message);};
export function getClient(){return connection??=connect();}
async function connect(){
 const {auth,db}=initializeRuntime({initializeApp,getAuth,getDatabase,connectAuthEmulator,connectDatabaseEmulator},{target:import.meta.env.VITE_BUZZY_TARGET||'emulator',hostname:location.hostname,protocol:location.protocol});
 await setPersistence(auth,browserLocalPersistence);await auth.authStateReady();if(!auth.currentUser)await signInAnonymously(auth);
 let serverOffset=0;onValue(ref(db,'.info/serverTimeOffset'),s=>serverOffset=s.val()||0);
 const serverNow=()=>Date.now()+serverOffset;
 const uid=auth.currentUser.uid, read=path=>get(ref(db,path)).then(s=>s.val());
 const attemptKey=c=>`${c.r}_${c.a}`;
 async function command(input){
  const x={commandId:crypto.randomUUID(),...input};
  if(x.action==='create'){
   for(let collision=0;collision<8;collision++){
    const bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(`${uid}:${x.commandId}:${collision}`)));
    const code=[...bytes.slice(0,4)].map(n=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[n%32]).join('');
    const room={meta:{owner:uid,createdAt:serverTimestamp(),createId:x.commandId,schema:1},control:{r:1,a:1,phase:'ready',mode:'timed',startedAt:0,ms:10000,version:0,commandId:x.commandId,resultUid:''},attempts:{'1_1':{n:0}}};
    try{await set(ref(db,`rooms/${code}`),room);return {code};}catch(e){try{const meta=await read(`rooms/${code}/meta`);if(meta?.owner===uid&&meta.createId===x.commandId)return {code};}catch{}if(collision===7)throw e;}
   }
  }
  const code=String(x.code||'').toUpperCase();if(!/^[A-HJ-NP-Z2-9]{4}$/.test(code))fail('Four-character room code required.');
  const base=`rooms/${code}`, c=await read(`${base}/control`);if(!c)fail('Room not found.');
  if(x.action==='join'){
   if(await read(`${base}/members/${uid}`)){const status=await read(`${base}/moderation/${uid}`);if(status==='banned')fail('You are banned from this session.');if(status==='kicked')await set(ref(db,`${base}/moderation/${uid}`),'active');return {code};}
   const name=String(x.name||'').trim();if(!name||name.length>24)fail('Name must contain 1–24 characters.');
   for(let tries=0;tries<12;tries++){
    const seats=await read(`${base}/seats`)||{},slot=Array.from({length:12},(_,i)=>String(i)).find(i=>!seats[i]);if(slot===undefined)fail('Room full.');
    try{await update(ref(db,base),{[`members/${uid}`]:{name,at:serverTimestamp(),fromRound:c.r+(c.phase==='ready'&&!(await read(`${base}/presentation/shown`))?0:1),slot},[`scores/${uid}`]:0,[`seats/${slot}`]:true});return {code};}catch(e){if(await read(`${base}/members/${uid}`))return {code};if(tries===11)throw e;}
   }
  }
  if(x.action==='publish'){
   const patch={};for(const [section,changes] of [['presentation',x.presentationPatch],['settings',x.settingsPatch],['private/ui',x.privatePatch]]){for(const [key,value] of Object.entries(changes||{})){if(!/^[A-Za-z][A-Za-z0-9]*$/.test(key))fail('Invalid field.');patch[`${section}/${key}`]=value;}}if(x.presentation)patch.presentation=x.presentation;if(x.settings)patch.settings=x.settings;if(x.privateUi)patch['private/ui']=x.privateUi;
   if(Object.keys(patch).length)await update(ref(db,base),patch);return {code};
  }
  if(x.action==='configure'){
   if(c.phase!=='ready'&&(x.mode!==c.mode||x.durationMs!==c.ms||x.timer!==(c.timer!==false)))fail('Change mode and timer before the round starts.');
   const configured={...c,version:c.version+1,commandId:x.commandId,mode:x.mode||c.mode,ms:x.durationMs||c.ms,timer:x.timer!==false,correct:x.correct??1,incorrect:x.incorrect??0,allowNegative:x.allowNegative!==false,allowRepeat:x.allowRepeat===true};
   await set(ref(db,`${base}/control`),configured);return {code};
  }
  if(x.action==='select'){await set(ref(db,`${base}/selection`),{r:c.r,a:c.a,uid:x.playerId,order:x.order});return {code};}
  if(x.action==='moderate'){await set(ref(db,`${base}/moderation/${x.playerId}`),x.status);return {code};}
  if(x.action==='celebrate'){await set(ref(db,`${base}/celebration`),{id:x.commandId,at:serverTimestamp()});return {code};}
  if(x.action==='adjust'){
   if((await read(`${base}/adjustments/${x.playerId}`))?.id===x.commandId)return {code};
   if(!Number.isFinite(x.delta)||Math.abs(x.delta)>10000)fail('Invalid adjustment.');
   const before=await read(`${base}/scores/${x.playerId}`);if(typeof before!=='number')fail('Player not found.');
   const after=x.allowNegative===false&&x.delta<0?(before<0?before:Math.max(0,before+x.delta)):before+x.delta;
   await update(ref(db,base),{[`scores/${x.playerId}`]:after,[`adjustments/${x.playerId}`]:{id:x.commandId,before,after,at:serverTimestamp()},[`archive/adjust-${x.commandId}`]:{id:'adjust-'+x.commandId,type:'adjust',playerId:x.playerId,playerName:x.name||'',delta:after-before,requestedDelta:x.delta,before,after,when:serverTimestamp()}});return {code};
  }
  if(x.action==='archive'){await set(ref(db,`${base}/archive/${x.id}`),x.record);return {code};}
  if(x.action==='ready'){await set(ref(db,`${base}/loads/${x.key}/${uid}`),x.status);return {code};}
  if(c.commandId===x.commandId){if(['next','retry','advance'].includes(x.action)){const p=`${base}/attempts/${attemptKey(c)}`;if(!await read(p))await set(ref(db,p),{n:0});}return {code};}
  if(x.roundId!==c.r||x.attempt!==c.a)fail('Stale round or attempt.');
  const key=attemptKey(c),path=`${base}/attempts/${key}`;
  if(x.action==='buzz'){
   const existing=await read(path);if(existing?.hits?.[uid]||existing?.first?.uid===uid)return {code};
   if(c.mode==='first'){try{await set(ref(db,`${path}/first`),{uid,at:serverTimestamp(),cmd:x.commandId});}catch(e){if((await read(`${path}/first`))?.uid!==uid)throw e;}return {code};}
   for(let tries=0;tries<24;tries++){
    const state=await read(path);if(state?.hits?.[uid])return {code};
    try{await update(ref(db,path),{n:state.n+1,[`hits/${uid}`]:{i:state.n+1,at:serverTimestamp(),cmd:x.commandId}});return {code};}catch(e){if(tries===23)throw e;const after=await read(path);if(after?.hits?.[uid])return {code};if(after.n<=state.n)throw e;const fresh=await read(`${base}/control`);if(fresh.r!==c.r||fresh.a!==c.a||fresh.phase!=='open')throw e;}
   }
  }
  if(x.action==='grade'){
   const state=await read(path),judged=state?.judgments?.[x.playerId];if(judged){if(judged.cmd===x.commandId)return {code};fail('Already judged.');}
   const pending=(c.mode==='first'?(state.first?[[state.first.uid,{i:1}]]:[]):Object.entries(state.hits||{})).filter(([id])=>!state.judgments?.[id]).sort((a,b)=>a[1].i-b[1].i);if(!pending.some(([id])=>id===x.playerId))fail('Select an ungraded buzz.');
   const correct=x.result==='correct';if(!['correct','incorrect'].includes(x.result))fail('Invalid result.');
   const score=await read(`${base}/scores/${x.playerId}`),writes={};
   const requested=correct?(c.correct??1):(c.incorrect??0),after=c.allowNegative===false&&requested<0?(score<0?score:Math.max(0,score+requested)):score+requested;
   writes[`attempts/${key}/judgments/${x.playerId}`]={kind:x.result,delta:after-score,cmd:x.commandId,before:score,after,at:serverTimestamp()};
   writes[`scores/${x.playerId}`]=after;
   if(!correct&&!c.allowRepeat)writes[`excluded/${c.r}/${x.playerId}`]=true;
   if(correct||!['closed','finished'].includes(c.phase))writes.control={...c,phase:correct?'finished':'closed',version:c.version+1,commandId:x.commandId,resultUid:correct?x.playerId:'',closedAt:c.closedAt||serverTimestamp()};
   await update(ref(db,base),writes);return {code};
  }
  if(x.action==='delete'){await set(ref(db,base),null);return {code};}
  if(['retry','next'].includes(x.action)&&c.phase==='closed'){const state=await read(path);const ids=c.mode==='first'?(state?.first?[state.first.uid]:[]):Object.keys(state?.hits||{});if(ids.some(id=>!state.judgments?.[id]))fail('Judge pending buzzes first.');}
  const value=c,next={...c,version:c.version+1,commandId:x.commandId};
  switch(x.action){
   case 'start':if(c.phase!=='ready')fail('Not ready.');if(!await read(path))await set(ref(db,path),{n:0});Object.assign(next,{phase:'open',startedAt:serverTimestamp(),closedAt:0,mode:x.mode||'timed',ms:x.durationMs||10000,timer:x.timer!==false,correct:x.correct??1,incorrect:x.incorrect??0,allowNegative:x.allowNegative!==false,allowRepeat:x.allowRepeat===true});break;
   case 'stop':case 'expire':if(c.phase!=='open')fail('Not open.');if(x.action==='expire'&&(c.timer===false||serverNow()<c.startedAt+c.ms))fail('Not expired.');next.phase='closed';next.closedAt=serverTimestamp();break;
   case 'retry':case 'next':case 'advance':if(!['closed','finished'].includes(c.phase)&&!(x.action==='advance'&&c.phase==='ready'))fail('Not closed.');Object.assign(next,{r:c.r+(x.action!=='retry'?1:0),a:x.action!=='retry'?1:c.a+1,phase:'ready',startedAt:0,closedAt:0,resultUid:''});break;
   default:fail('Unknown command.');
  }
  // The rules compare version against the actual server value: concurrent host edits cannot silently overwrite it.
  await set(ref(db,`${base}/control`),next);
  if(['retry','next','advance'].includes(x.action)){
   const nextPath=`${base}/attempts/${attemptKey(next)}`;if(!await read(nextPath))await set(ref(db,nextPath),{n:0});
  }
  return {code};
 }
 function watch(code,next,error){
  const base=`rooms/${code}`,values={},stops=[],dynamic=[],initialized=new Set(),fields=['members','scores','settings','presentation','selection','moderation','celebration','adjustments'];let current='',excludedRound='',loadKey='',stopLoads;
  const emit=()=>{
   const c=values.control;if(!c||!values.attempt||fields.some(f=>!initialized.has(f)))return;
   const players=Object.entries(values.members||{}).map(([id,p])=>({id,name:p.name,score:values.scores?.[id]||0,status:['banned','kicked'].includes(values.moderation?.[id])?values.moderation[id]:p.fromRound<=c.r?'active':values.settings?.allowJoinDuringQuestion===false?'queued':'waiting',joined:p.at})).sort((a,b)=>a.joined-b.joined);
   const a=values.attempt, hits=c.mode==='first'?(a.first?[[a.first.uid,{...a.first,i:1}]]:[]):Object.entries(a.hits||{});
   const buzzes=hits.map(([id,h])=>({playerId:id,name:values.members?.[id]?.name||'Player',order:h.i,acceptedAt:h.at,result:a.judgments?.[id]?.kind||'pending',judgment:a.judgments?.[id]||null})).sort((a,b)=>a.order-b.order);
   next({code,revision:c.version,control:{...c},presentation:values.presentation||null,settings:values.settings||{},celebration:values.celebration||null,adjustments:values.adjustments||{},selection:values.selection||null,loads:values.loads||{},players,round:{id:c.r,attempt:c.a,phase:c.phase==='open'&&c.mode==='first'&&a.first?'locked':c.phase,mode:c.mode,deadline:c.startedAt+c.ms,excluded:Object.keys(values.excluded||{}),buzzes}});
  };
  for(const field of fields)stops.push(onValue(ref(db,`${base}/${field}`),s=>{values[field]=s.val();initialized.add(field);if(field==='presentation'&&values.presentation?.loadKey!==loadKey){stopLoads?.();loadKey=values.presentation?.loadKey;values.loads={};if(loadKey)stopLoads=onValue(ref(db,`${base}/loads/${loadKey}`),s=>{values.loads=s.val();emit();},error);}emit();},error));
  stops.push(onValue(ref(db,`${base}/control`),s=>{
   values.control=s.val();if(!values.control)return;
   const key=attemptKey(values.control);
   if(key!==current){dynamic.splice(0).forEach(stop=>stop());current=key;values.attempt=null;values.excluded=null;
    dynamic.push(onValue(ref(db,`${base}/attempts/${key}`),s=>{if(key!==current)return;values.attempt=s.val();emit();},async e=>{try{const fresh=await read(`${base}/control`);if(fresh&&attemptKey(fresh)!==key)return;}catch{}if(key===current)error?.(e);}));
    excludedRound=String(values.control.r);dynamic.push(onValue(ref(db,`${base}/excluded/${excludedRound}`),s=>{values.excluded=s.val();emit();},error));
   }emit();
  },error));
  return ()=>{stopLoads?.();stops.forEach(stop=>stop());dynamic.forEach(stop=>stop());};
 }
 return {auth,db,uid,command,read,watch,serverNow,setOnline:v=>v?goOnline(db):goOffline(db),watchConnection:next=>onValue(ref(db,'.info/connected'),s=>next(s.val()===true))};
}
