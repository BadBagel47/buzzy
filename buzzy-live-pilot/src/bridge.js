import {deadline} from './connection.js';
import {getClient} from './client.js';
const api=window.BuzzyView,s=api.state,role=window.BUZZY_RUNTIME.role,isHost=role==='host';
const sessionKey='buzzy-spark-ui-session',status=document.getElementById('network-status'),retry=document.getElementById('network-retry');
const privateKeys=['questions','qIndex','quickQuestion','roomCorrect','roomIncorrect','roomTimer','roomSeconds','roomCustomDurationSelected','defaultMode','roomTextVisibility','roomBuzzerStart','roundTextVisible','roundStartTogether','setName','playedSequence','showUpNext','mode','timer','seconds','correct','incorrect','allowRepeat','allowNegativeScores'];
const settingKeys=['leaderboard','playerBuzzOrder','buzzOrderNames','ownScore','showQuestionPoints','sounds','answerSounds','animations','celebration','showQuestionInfoDefault','allowJoinDuringQuestion'];
const json=value=>JSON.parse(JSON.stringify(value));
let client,code,latest,busy=false,connected=false,first=true,held=false,local=false,saveQueued=false,saveTimer,stopWatch,stopConnection;
let blocked=false;
let savedPrivate='',savedSettings='',savedPresentation='',loadedKey='',loadGeneration=0,stopKey='',expiryKey='';
const idleWaiters=[];const seenJudgments=new Set(),seenAdjustments=new Set();let celebrationId='';
function message(text,error=false){status.textContent=text;status.dataset.error=String(error);}
function currentInput(action,extra={}){const c=latest.control;return {action,code,roundId:c.r,attempt:c.a,...extra};}
const command=(action,extra)=>client.command(currentInput(action,extra));
function runLocal(fn){local=true;try{return fn();}finally{local=false;}}
function uiOptions(){return {mode:s.mode,durationMs:s.seconds*1000,timer:s.timer,correct:s.correct,incorrect:s.incorrect,allowNegative:s.allowNegativeScores,allowRepeat:s.allowRepeat};}
function controlOptions(c){return {mode:c.mode,durationMs:c.ms,timer:c.timer!==false,correct:c.correct??1,incorrect:c.incorrect??0,allowNegative:c.allowNegative!==false,allowRepeat:c.allowRepeat===true};}
function privateUi(){return Object.fromEntries(privateKeys.map(k=>[k,json(s[k])]));}
async function makePresentation(){
 const q=api.currentQ(),c=latest.control;
 const content={r:c.r,a:c.a,id:q.id,text:s.roundTextVisible?q.text||'':'',image:q.image||'',textVisible:s.roundTextVisible,source:s.quickQuestion?'quick':'prepared'};
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(content)));
 return {...content,shown:s.questionShown,loadKey:[...new Uint8Array(digest).slice(0,16)].map(v=>v.toString(16).padStart(2,'0')).join('')};
}
function changedFields(previous,value){const before=previous?JSON.parse(previous):{};return Object.fromEntries(Object.entries(value).filter(([k,v])=>JSON.stringify(v)!==JSON.stringify(before[k])));}
async function publish(){
 if(!isHost||!client||!latest)return;
 const desired=uiOptions();
 if(JSON.stringify(desired)!==JSON.stringify(controlOptions(latest.control))){
  await command('configure',desired);latest.control=await client.read(`rooms/${code}/control`);
 }
 const p=await makePresentation(),settings=Object.fromEntries(settingKeys.map(k=>[k,!!s[k]]));settings.shareLeaderboard=!!(s.hostShowResults&&s.shareLeaderboard);
 const ui=privateUi(),fields={};
 const a=JSON.stringify(p),b=JSON.stringify(settings),c=JSON.stringify(ui);
 for(const [key,old,value] of [['presentationPatch',savedPresentation,p],['settingsPatch',savedSettings,settings],['privatePatch',savedPrivate,ui]]){const changed=changedFields(old,value);if(Object.keys(changed).length)fields[key]=changed;}
 if(Object.keys(fields).length)await command('publish',fields);savedPresentation=a;savedSettings=b;savedPrivate=c;
}
async function operation(fn,{save=true}={}){
 if(busy)return;
 if(!connected||blocked){api.tip('You are offline. Reconnect before changing the game.');return;}
 busy=true;held=true;afterRender();
 try{await fn();if(save)await publish();}
 catch(e){api.tip(e.message||'Unable to complete this action.');message(e.message||'Unable to complete this action.',true);}
 finally{held=false;busy=false;if(latest)project(latest);afterRender();idleWaiters.splice(0).forEach(resolve=>resolve());}
}
async function afterIdle(fn){while(busy)await new Promise(resolve=>idleWaiters.push(resolve));return fn();}
function scheduleSave(){
 if(!isHost||local||!s.networkReady||busy||!connected)return;
 const cfg=Object.fromEntries(settingKeys.map(k=>[k,!!s[k]]));cfg.shareLeaderboard=!!(s.hostShowResults&&s.shareLeaderboard);if(JSON.stringify(privateUi())===savedPrivate&&JSON.stringify(cfg)===savedSettings&&s.questionShown===!!latest.presentation?.shown)return;
 clearTimeout(saveTimer);saveTimer=setTimeout(()=>operation(async()=>{}),60);
}
async function archiveCurrent(){
 if(!s.activeRound)return;
 const r=json(s.activeRound);r.id=`round-${latest.control.r}`;r.archived=true;r.endedAt=client.serverNow();r.status=s.lastDecision==='correct'?'Correct answer':s.remainingAtClose===0?'Time expired':'Ended by host';r.scoresAfter=Object.fromEntries(s.players.map(p=>[p.id,p.score]));
 await command('archive',{id:r.id,record:r});
}
function normalizeRecord(r){if(r.type==='adjust')return r;r.attempts=Object.values(r.attempts||{}).map(a=>({...a,buzzes:Object.values(a.buzzes||{})}));r.awards=Object.values(r.awards||{});r.scoresBefore??={};r.scoresAfter??={};return r;}
async function loadArchive(){
 const records=await client.read(`rooms/${code}/archive`)||{};for(const [id,r] of Object.entries(records))records[id]=normalizeRecord(r);
 if(s.activeRound){const old=records[s.activeRound.id];if(old){const byAttempt=new Map((old.attempts||[]).map(a=>[a.number,a]));for(const a of s.activeRound.attempts)byAttempt.set(a.number,a);s.activeRound.attempts=[...byAttempt.values()].sort((a,b)=>a.number-b.number);s.activeRound.awards=s.activeRound.attempts.flatMap(a=>a.buzzes.filter(b=>b.result).map(b=>({id:b.id,name:b.name,result:b.result,points:b.points})));}if(s.activeRound.archived)records[s.activeRound.id]=s.activeRound;}
 s.roundOverview=Object.values(records).sort((a,b)=>(a.number||0)-(b.number||0)||(a.when||0)-(b.when||0));
 s.history=s.roundOverview.flatMap(r=>r.type==='adjust'?[{label:'Manual score adjustment',detail:`${r.playerName}: ${r.delta>=0?'+':''}${r.delta}`,when:new Date(r.when).toLocaleTimeString('en',{hour:'2-digit',minute:'2-digit'})}]:[{label:`Question ${r.number} · ${r.title}`,detail:r.status,when:new Date(r.startedAt).toLocaleTimeString('en',{hour:'2-digit',minute:'2-digit'})},...(r.attempts||[]).flatMap(a=>a.buzzes.map(b=>({label:`${b.name} · ${b.result||'Buzz'}`,detail:`Attempt ${a.number} · #${b.order}${b.result?' · '+b.points+' points':''}`,when:new Date(a.startedAt).toLocaleTimeString('en',{hour:'2-digit',minute:'2-digit'})})))]);
}
function activeProjection(){if(latest)project(latest);}
function project(value){
 latest=value;if(held)return;blocked=false;
 const c=value.control,round=value.round,display=value.presentation?.r===c.r&&value.presentation?.a===c.a?value.presentation:null;
 const oldPlayers=s.players.map(p=>({...p})),oldRound=s.countQuestion,oldAttempt=s.attemptNumber,previousPhase=s.phase;
 if(!isHost&&!value.players.some(p=>p.id===client.uid))return;
 if(oldRound!==c.r||oldAttempt!==c.a){
  if(oldRound!==c.r){s.activeRound=null;s.questionShown=false;}
  runLocal(()=>api.resetCurrentRound());s.feedDecision=null;s.feedResolved=null;
 }
 s.countQuestion=c.r;s.attemptNumber=c.a;s.code=code;s.codeSource='server';s.players=value.players.map(p=>({...p}));
 s.preview=!isHost;s.viewAs=isHost?(s.players[0]?.id??null):client.uid;
 const wasShared=s.shareLeaderboard;Object.assign(s,value.settings);if(!isHost&&s.shareLeaderboard&&!wasShared){s.leaderboardDismissed={};s.leaderboardGeneration[client.uid]=(s.leaderboardGeneration[client.uid]||0)+1;}
 if(!isHost){
  const q={id:display?.id||'network-question',title:'Question',text:display?.text||'',image:display?.image||'',points:c.correct??1,penalty:c.incorrect??0,mode:c.mode,timer:c.timer===false?'off':String(c.ms/1000)};
  s.questions=display?.source==='prepared'?[q]:[];s.qIndex=0;s.quickQuestion=display?.source==='prepared'?null:q;
  s.hostShowResults=!!value.settings.shareLeaderboard;
 }
 s.mode=c.mode;s.timer=c.timer!==false;s.seconds=c.ms/1000;s.correct=c.correct??1;s.incorrect=c.incorrect??0;s.allowRepeat=c.allowRepeat===true;s.allowNegativeScores=c.allowNegative!==false;
 s.roundTextVisible=display?.textVisible??s.roundTextVisible;s.questionShown=!!display?.shown||c.phase!=='ready';
 s.startAt=c.startedAt||null;s.endAt=c.startedAt?c.startedAt+c.ms:null;
 s.buzzes=round.buzzes.map(b=>({id:b.playerId,order:b.order,time:Math.max(0,(b.acceptedAt-c.startedAt)/1000)}));
 s.excluded=[...round.excluded];
 const decisions=round.buzzes.filter(b=>b.judgment).sort((a,b)=>(a.judgment.at||0)-(b.judgment.at||0)||a.order-b.order);
 const last=decisions.at(-1),winner=round.buzzes.find(b=>b.playerId===c.resultUid&&b.result==='correct')||round.buzzes.find(b=>b.result==='correct');
 s.lastDecision=last?.result||null;s.winner=winner?.playerId||null;
 s.phase=round.phase==='finished'?'closed':round.phase;
 if(c.phase==='ready')s.phase=s.questionShown?'presented':(api.currentQ().text||api.currentQ().image?'ready':'presented');
 const visuallyExpired=c.timer!==false&&c.phase==='open'&&round.phase==='open'&&client.serverNow()>=c.startedAt+c.ms;
 if(c.mode==='first'&&c.phase==='closed'&&s.lastDecision==='incorrect')s.phase='locked';
 const firstHit=round.buzzes[0];
 s.remainingAtClose=['open','ready'].includes(c.phase)&&round.phase!=='locked'?null:s.timer?Math.max(0,Math.ceil((c.startedAt+c.ms-(round.phase==='locked'&&firstHit?firstHit.acceptedAt:(c.closedAt||last?.judgment?.at||client.serverNow())))/1000)):null;
 if(c.phase==='closed'&&s.timer&&client.serverNow()>=c.startedAt+c.ms)s.remainingAtClose=0;
 if(visuallyExpired){s.phase='closed';s.remainingAtClose=0;if(s.clockStoppedAt===null)s.clockStoppedAt=c.startedAt+c.ms;}
 if((c.phase==='closed'||round.phase==='locked'||c.phase==='finished')&&s.clockStoppedAt===null)s.clockStoppedAt=c.closedAt||firstHit?.acceptedAt||client.serverNow();
 s.gradedBuzzKeys=round.buzzes.filter(b=>b.judgment).map(b=>`${c.a}:${b.order}`);
 s.buzzEvaluations=Object.fromEntries(round.buzzes.filter(b=>b.judgment).map(b=>[`${c.a}:${b.order}`,b.result]));
 const next=round.buzzes.find(b=>b.result==='pending'),choice=value.selection;
 const chosen=choice?.r===c.r&&choice?.a===c.a&&round.buzzes.some(b=>b.playerId===choice.uid&&b.result==='pending')?round.buzzes.find(b=>b.playerId===choice.uid):(s.lastDecision==='correct'?winner:next)||next;
 s.selected=chosen?.playerId||null;s.selectedBuzzOrder=chosen?.order??null;
 s.preload={questionId:api.currentQ().id,statuses:Object.fromEntries(s.players.filter(p=>p.status==='active').map(p=>[p.id,value.loads[p.id]||'loading'])),error:Object.values(value.loads).includes('failed')?'A player could not load the question image.':''};
 if(c.startedAt){
  const r=api.ensureRound();r.id=`round-${c.r}`;r.number=c.r;r.startedAt=c.startedAt;
  let a=r.attempts.find(a=>a.number===c.a);if(!a){a={number:c.a,startedAt:c.startedAt,buzzes:[]};r.attempts.push(a);}
  a.buzzes=round.buzzes.map(b=>({id:b.playerId,name:b.name,order:b.order,time:Math.max(0,(b.acceptedAt-c.startedAt)/1000),result:b.result==='pending'?null:b.result,points:b.judgment?.delta||0}));
  r.awards=r.attempts.flatMap(a=>a.buzzes.filter(b=>b.result).map(b=>({id:b.id,name:b.name,result:b.result,points:b.points})));r.scoresAfter=Object.fromEntries(s.players.map(p=>[p.id,p.score]));
  if(['closed','finished'].includes(c.phase)){r.archived=true;r.status=winner?'Correct answer':'Buzzers stopped · Awaiting scoring';if(!s.roundOverview.some(x=>x.id===r.id))s.roundOverview.push(r);}
 }
 s.attempts=(s.activeRound?.attempts||[]).filter(x=>x.number<c.a).map(x=>({number:x.number,buzzes:x.buzzes.map(b=>({...b}))}));
 for(const b of decisions){
  const key=`${c.r}_${c.a}_${b.playerId}`;if(seenJudgments.has(key))continue;seenJudgments.add(key);if(first)continue;
  const j=b.judgment,buzz=s.buzzes.find(x=>x.id===b.playerId),p=s.players.find(p=>p.id===b.playerId),before=j.before??(p.score-j.delta),after=j.after??p.score;
  s.playerEffects[b.playerId]={playerId:b.playerId,kind:b.result,points:j.delta,token:++s.effectSerial,before,after};
  s.feedDecision={buzz:{...buzz},type:b.result,points:j.delta,token:++s.effectSerial,startedAt:client.serverNow()};s.feedResolved={question:c.r,attempt:c.a,buzz:{...buzz},type:b.result,points:j.delta};
  const token=s.feedDecision.token;if(b.result==='incorrect')setTimeout(()=>{if(s.feedDecision?.token===token){s.feedPreviousDecision={...s.feedDecision};s.feedDecision=null;api.render();}},next?850:1720);
  if(!isHost&&b.playerId===client.uid&&s.answerSounds)api.playSound(b.result);
 }
 for(const [id,event] of Object.entries(value.adjustments||{})){
  if(seenAdjustments.has(event.id))continue;seenAdjustments.add(event.id);if(first||event.after===event.before)continue;
  const delta=event.after-event.before;s.playerEffects[id]={playerId:id,manual:true,kind:delta>0?'correct':'incorrect',points:delta,token:++s.effectSerial,before:event.before,after:event.after};if(!isHost&&id===client.uid&&s.answerSounds)api.playSound(delta>0?'correct':'incorrect');
 }
 if(value.celebration?.id!==celebrationId){celebrationId=value.celebration?.id||'';if(!first&&celebrationId&&s.celebration)api.confetti();}
 if((c.phase==='closed'||visuallyExpired)&&s.remainingAtClose===0&&previousPhase==='open')api.scheduleTimeoutFlip();
 first=false;s.networkReady=true;document.documentElement.dataset.networkReady='true';api.render();
 const newBuzz=round.buzzes.at(-1);if(newBuzz){const key=`${c.r}:${c.a}:${newBuzz.playerId}:${newBuzz.order}`;if(key!==s.lastStampBuzzKey){s.lastStampBuzzKey=key;api.animateBuzzLogos(newBuzz.playerId);if(!isHost&&newBuzz.playerId===client.uid&&s.sounds)api.playSound('buzz');}}
 if(!isHost&&display)preparePlayer(display);
 if(isHost&&c.phase==='open'&&c.mode==='timed'){
  const eligible=s.players.filter(p=>p.status==='active'&&(!s.excluded.includes(p.id)||s.allowRepeat));
  if(eligible.length&&eligible.every(p=>round.buzzes.some(b=>b.playerId===p.id))&&stopKey!==`${c.r}_${c.a}`){stopKey=`${c.r}_${c.a}`;queueMicrotask(()=>operation(async()=>{await command('stop');}));}
 }
 const me=s.players.find(p=>p.id===client.uid);
 message(!connected?'Disconnected — waiting to reconnect':!isHost&&['kicked','banned'].includes(me?.status)?(me.status==='banned'?'You are banned from this session.':'You have been removed. Return to the start page to rejoin.'):`Room ${code} · ${isHost?'Host':'Player'} · Connected`);
 afterRender();
}
async function preparePlayer(p){
 if(p.loadKey===loadedKey)return;loadedKey=p.loadKey;const generation=++loadGeneration;
 let result='ready';
 if(p.image){result=await new Promise(resolve=>{const image=new Image();let settled=false;const finish=v=>{if(settled)return;settled=true;clearTimeout(timer);resolve(v);};const timer=setTimeout(()=>finish('failed'),9000);image.onload=()=>typeof image.decode==='function'?image.decode().then(()=>finish('ready'),()=>finish('failed')):finish('ready');image.onerror=()=>finish('failed');image.src=p.image;});}
 if(generation!==loadGeneration)return;
 try{await client.command({action:'ready',code,key:p.loadKey,status:result});}catch(e){if(generation===loadGeneration)api.tip('Unable to confirm question readiness.');}
}
function afterRender(){
 if(!s.networkReady)return;
 document.documentElement.toggleAttribute('data-network-busy',busy||!connected||blocked);
 const badge=document.querySelector('.headbar .tag.desktoponly');if(badge)badge.textContent=isHost?'HOST':'PLAYER';document.title=`Buzzy · ${isHost?'Host':'Player'}`;
 const allowedLocal=a=>['toggle-question-info','player-leaderboard','dismiss-leaderboard','open-buzz-order','close-buzz-order','close-modal'].includes(a);
 for(const el of document.querySelectorAll('[data-action],[data-pick]')){
  const a=el.dataset.action||'pick';
  const locked=(!isHost&&!a.startsWith('buzz:')&&!allowedLocal(a))||(isHost&&(busy||!connected||blocked)&&!['close-modal','show-scores','round-overview','history'].includes(a));
  el.toggleAttribute('data-network-blocked',locked);
  if(!a.startsWith('buzz:')){
   if(locked){if(!el.hasAttribute('data-network-original-aria'))el.dataset.networkOriginalAria=el.getAttribute('aria-disabled')??'__none__';el.setAttribute('aria-disabled','true');}
   else if(el.hasAttribute('data-network-original-aria')){const original=el.dataset.networkOriginalAria;if(original==='__none__')el.removeAttribute('aria-disabled');else el.setAttribute('aria-disabled',original);delete el.dataset.networkOriginalAria;}
  }else el.setAttribute('aria-disabled',String(busy||!connected||blocked||s.phase!=='open'||s.players.find(p=>p.id===client.uid)?.status!=='active'||s.buzzes.some(b=>b.id===client.uid)||(!s.allowRepeat&&s.excluded.includes(client.uid))));
 }
 scheduleSave();
 const copy=document.querySelector('[data-action="copy-link"]');if(copy){copy.classList.remove('prototype-only');copy.hidden=false;copy.textContent='Copy room link';}
}
async function advance(action,{force=false}={}){
 await operation(async()=>{
  await archiveCurrent();
  const before={r:latest.control.r,a:latest.control.a};
  if(latest.control.phase==='open'){await command('stop');latest.control=await client.read(`rooms/${code}/control`);}
  runLocal(()=>api.handle(action));
  // Mode switching/next must allocate a new server round even when the legacy UI reuses the displayed number.
  await command('advance');latest.control=await client.read(`rooms/${code}/control`);s.countQuestion=latest.control.r;s.attemptNumber=1;s.questionShown=false;s.activeRound=null;
 });
}
function handle(action){
 if(local)return false;
 if(!client||!s.networkReady)return true;
 if(!isHost){
  if(action.startsWith('buzz:')){buzz(action.slice(5));return true;}
  return !['toggle-question-info','player-leaderboard','dismiss-leaderboard','open-buzz-order','close-buzz-order','close-modal'].includes(action);
 }
 if(action==='copy-link'){navigator.clipboard?.writeText(`${location.origin}/?room=${code}`).then(()=>api.tip('Room link copied.'),()=>api.tip(`${location.origin}/?room=${code}`));return true;}
 if(action==='open'||action==='present-and-open'){
  operation(async()=>{
   if(!['ready'].includes(latest.control.phase))throw new Error('This attempt has already started.');
   const q=api.currentQ();if((q.image||(s.roundTextVisible&&q.text))&&!s.preloadBypass&&s.players.filter(p=>p.status==='active').some(p=>latest.loads[p.id]!=='ready'))throw new Error('Wait for players to finish loading, or choose Continue anyway.');
   s.questionShown=true;await publish();await command('start',uiOptions());
  });return true;
 }
 if(action==='present'){operation(async()=>{s.questionShown=true;s.phase='presented';});return true;}
 if(action==='confirm-stop-buzzers'){s.modal='';operation(async()=>{await command('stop');},{save:false});return true;}
 if(action==='close'&&s.phase!=='open')return true;
 if(action==='correct'||action==='incorrect'){
  operation(async()=>{const b=s.buzzes.find(b=>s.mode==='timed'?b.order===s.selectedBuzzOrder:b.id===s.selected);if(!b)throw new Error('Select a player who buzzed.');await command('grade',{playerId:b.id,result:action});},{save:false});return true;
 }
 if(action==='reset'){
  operation(async()=>{await archiveCurrent();await command('retry');latest.control=await client.read(`rooms/${code}/control`);s.questionShown=true;});return true;
 }
 if(['confirm-next','confirm-quick','confirm-play-mode','confirm-skip','next'].includes(action)){advance(action);return true;}
 if(['next-question','next-quick'].includes(action)){
  if(s.phase==='open'||(s.buzzes.length&&s.lastDecision!=='correct'))return false;advance(action);return true;
 }
 if(action.startsWith('set-play-mode:')&&!['open','locked','closed'].includes(s.phase)&&!s.buzzes.length){operation(async()=>runLocal(()=>api.handle(action)));return true;}
 if(action==='round-overview'||action==='history'||action==='export-history'){afterIdle(()=>operation(async()=>{await loadArchive();runLocal(()=>api.handle(action));},{save:false}));return true;}
 if(action.startsWith('apply-adjust:')){const id=action.split(':')[1],delta=Number(document.getElementById('adjustval')?.value);operation(async()=>{await command('adjust',{playerId:id,delta,allowNegative:s.allowNegativeScores,name:s.players.find(p=>p.id===id)?.name});s.modal='';},{save:false});return true;}
 if(/^(kick|ban|unban|rejoin):/.test(action)){const [kind,id]=action.split(':');operation(async()=>{await command('moderate',{playerId:id,status:kind==='kick'?'kicked':kind==='ban'?'banned':'active'});s.modal='';},{save:false});return true;}
 if(action==='celebrate'){if(s.celebration)operation(()=>command('celebrate'),{save:false});else api.tip('Celebration effects are disabled.');return true;}
 if(action==='end-room'){if(confirm('End this game and delete its room data?'))operation(async()=>{await command('delete');leave();},{save:false});return true;}
 return false;
}
function buzz(id){
 if(isHost||id!==client?.uid){api.tip('Buzz from your own player view.');return;}
 operation(async()=>{await command('buzz');},{save:false});
}
function maybeExpire(){
 if(!connected||blocked||busy||!latest||latest.control.phase!=='open'||latest.round.phase==='locked'||!s.timer||client.serverNow()<s.endAt)return;
 if(!isHost){if(s.phase==='open'){s.phase='closed';s.remainingAtClose=0;s.clockStoppedAt=s.endAt;api.render();api.scheduleTimeoutFlip();}return;}
 const key=`${latest.control.r}_${latest.control.a}`;if(expiryKey===key)return;expiryKey=key;
 operation(async()=>{await command('expire');},{save:false});
}
function leave(){stopWatch?.();stopConnection?.();++loadGeneration;clearTimeout(saveTimer);client?.setOnline(false);sessionStorage.removeItem(sessionKey);location.assign('/');}
window.BuzzyNetwork={get local(){return local;},handle,buzz,maybeExpire,preload:scheduleSave,afterRender,now:()=>client?.serverNow()??Date.now()};
// Preserve controls' own disabled state: retained modal/source nodes must unlock after a request.
for(const type of ['click','keydown'])document.addEventListener(type,event=>{
 if(type==='keydown'&&!['Enter',' '].includes(event.key))return;
 if(event.target.closest?.('[data-network-blocked]')){event.preventDefault();event.stopImmediatePropagation();}
},true);
document.getElementById('leave-room').addEventListener('click',e=>{e.preventDefault();leave();});
for(const type of ['click','change','drop','keydown'])document.addEventListener(type,event=>{
 if(local)return;
 if(type==='keydown'&&event.key!=='Enter')return;
 if(isHost&&event.target.closest?.('[data-pick]')){
  const pick=event.target.closest('[data-pick]'),id=pick.dataset.pick,order=Number(pick.dataset.buzzOrder)||s.buzzes.find(b=>b.id===id)?.order;
  queueMicrotask(()=>operation(()=>command('select',{playerId:id,order}),{save:false}));return;
 }
 queueMicrotask(scheduleSave);
});
let starting;
function begin(){
 return starting??=start().catch(e=>{held=false;blocked=true;message(e.message||'Unable to connect. Check your connection and try again.',true);retry.hidden=false;afterRender();}).finally(()=>{starting=null;});
}
retry.addEventListener('click',()=>{client?.reconnect();if(!s.networkReady||blocked)begin();});
window.addEventListener('online',()=>{if(!s.networkReady||blocked)begin();});
async function start(){
 retry.hidden=true;blocked=false;
 stopWatch?.();stopConnection?.();
 let saved;try{saved=JSON.parse(sessionStorage.getItem(sessionKey));}catch{}
 if(!saved||saved.role!==role||!/^[A-HJ-NP-Z2-9]{4}$/.test(saved.code))throw new Error('No room selected. Return to the start page to create or join a room.');
 code=saved.code;client=await getClient();
 stopConnection=client.watchConnection(value=>{connected=value;retry.hidden=value&&!blocked;if(value&&blocked&&!starting)queueMicrotask(begin);if(s.networkReady&&!blocked){message(value?`Room ${code} · Connected`:'Disconnected — waiting to reconnect');api.render();afterRender();}});
 await client.waitForConnection();
 const control=await client.read(`rooms/${code}/control`);if(!control)throw new Error('This room is no longer available.');
 latest={control,players:[],round:{id:control.r,attempt:control.a},loads:{}};
 if(isHost){
  const meta=await client.read(`rooms/${code}/meta`);if(meta?.owner!==client.uid)throw new Error('This identity is not the host of this room.');
  s.created=meta.createdAt;s.history=[];const savedRound=await client.read(`rooms/${code}/archive/round-${control.r}`);if(savedRound){s.activeRound=normalizeRecord(savedRound);s.roundOverview=[savedRound];}
  const ui=await client.read(`rooms/${code}/private/ui`);if(ui){for(const key of privateKeys)if(key in ui)s[key]=ui[key];savedPrivate=JSON.stringify(privateUi());}
  s.countQuestion=control.r;s.attemptNumber=control.a;s.questionShown=control.phase!=='ready';
  const previous=await client.read(`rooms/${code}/presentation`);if(previous){s.questionShown=previous.shown;savedPresentation=JSON.stringify(previous);}
  savedSettings=JSON.stringify(await client.read(`rooms/${code}/settings`)||{});
  if(control.phase!=='ready')Object.assign(s,{mode:control.mode,timer:control.timer!==false,seconds:control.ms/1000,correct:control.correct??1,incorrect:control.incorrect??0,allowNegativeScores:control.allowNegative!==false,allowRepeat:control.allowRepeat===true});
  held=true;try{await deadline(publish());}finally{held=false;}
 }else{
  const member=await client.read(`rooms/${code}/members/${client.uid}`);if(!member)throw new Error('Join this room from the start page first.');
 }
 await deadline(new Promise((resolve,reject)=>{stopWatch=client.watch(code,value=>{latest=value;project(value);retry.hidden=connected;resolve();},e=>{message(e.code==='room/not-found'?e.message:'The room is unavailable or this view no longer has access. Return to the start page.',true);blocked=true;retry.hidden=false;afterRender();reject(e);});}));
}
begin();
