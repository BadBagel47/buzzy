import {deadline} from './connection.js';
import {getClient} from './client.js';
import {installRoomUi} from './room-ui.js';
import {patchHostMarkup} from './host-markup.js';
import {createCelebration} from './celebration.js';
import {installHostTheme} from './host-theme.js';
import {installAiQuestions,topicChips,periods} from './ai-questions.js';
const api=window.BuzzyView,s=api.state,role=window.BUZZY_RUNTIME.role,isHost=role==='host';
const sessionKey='buzzy-spark-ui-session',status=document.getElementById('network-status'),retry=document.getElementById('network-retry');
const privateKeys=['questions','qIndex','quickQuestion','roomCorrect','roomIncorrect','roomTimer','roomSeconds','roomCustomDurationSelected','defaultMode','roomTextVisibility','roomBuzzerStart','roundTextVisible','roundViewerHidden','roundStartTogether','setName','playedSequence','showUpNext','mode','timer','seconds','correct','incorrect','allowRepeat','allowNegativeScores','viewerView','viewerQuestionNumber','viewerQuestion','viewerTimer','viewerBuzzOrder','viewerCelebration'];
const settingKeys=['leaderboard','playerBuzzOrder','buzzOrderNames','ownScore','showQuestionPoints','sounds','answerSounds','animations','celebration','showQuestionInfoDefault','allowJoinDuringQuestion','viewerQuestion','viewerTimer','viewerBuzzOrder','viewerLeaderboard','viewerCelebration','viewerJoinScreen','viewerQuestionNumber'];
const viewerViews=['standby','join','game','leaderboard'];
// Room settings shared with players and viewer screens; viewerView is the one text value (#355).
function sharedSettings(){const settings=Object.fromEntries(settingKeys.map(k=>[k,!!s[k]]));settings.shareLeaderboard=!!(s.hostShowResults&&s.shareLeaderboard);settings.viewerQuestion=!!(s.viewerQuestion&&!s.roundViewerHidden);settings.viewerView=viewerViews.includes(s.viewerView)?s.viewerView:'standby';return settings;}
const json=value=>JSON.parse(JSON.stringify(value));
let client,code,latest,busy=false,connected=false,first=true,held=false,local=false,saveQueued=false,saveTimer,stopWatch,stopConnection,stopViewers;
let blocked=false,roomEnded=false,exitTask=null;
// #390: short connection blips are not shown. The real state (connected) still guards every action;
// the visible offline state (offlineShown) follows only after the connection has been lost for a while.
const OFFLINE_GRACE_MS=3000;let offlineShown=false,offlineTimer=null;
function trackConnection(value){
 if(value){clearTimeout(offlineTimer);offlineTimer=null;offlineShown=false;return;}
 if(offlineShown||offlineTimer)return;
 offlineTimer=setTimeout(()=>{offlineTimer=null;if(connected||roomEnded)return;offlineShown=true;if(s.networkReady&&!blocked){message('Disconnected — waiting to reconnect');api.render();}afterRender();},OFFLINE_GRACE_MS);
}
const localActions=new Set(['toggle-question-info','player-leaderboard','dismiss-leaderboard','open-buzz-order','close-buzz-order','close-modal','network-open-leave','network-confirm-exit','network-return-start']);
let savedPrivate='',savedSettings='',savedPresentation='',loadedKey='',loadGeneration=0,stopKey='',expiryKey='';
const idleWaiters=[];const seenJudgments=new Set(),seenAdjustments=new Set();let celebrationId='';
const celebration=createCelebration(()=>s.celebration);
// #352: the sharing view can put the join screen on viewer screens; it is saved like other host settings.
// Focus rings are for keyboard users: remember whether the last input was a pointer or a key (not shortcuts such as Cmd+Shift+4).
for(const type of ['pointerdown','keydown'])document.addEventListener(type,event=>{if(type==='keydown'&&(event.metaKey||event.ctrlKey||event.altKey||['Shift','Meta','Control','Alt'].includes(event.key)))return;document.documentElement.dataset.input=type==='keydown'?'keyboard':'pointer';},true);
const roomUi=installRoomUi({api,isHost,getCode:()=>code});
// #378: light or dark host theme, following the device unless the host chose otherwise on this device.
const hostTheme=isHost?installHostTheme({onChange:choice=>{s.hostTheme=choice;}}):null;if(hostTheme)s.hostTheme=hostTheme.choice;
// #387: questions written and fact-checked by Claude with the host's own key (kept in this browser only).
const aiQuestions=isHost?installAiQuestions({state:s,render:()=>api.render(),save:()=>scheduleSave(),
 existingQuestions:()=>[...(s.questions||[]).map(q=>q.text),s.quickQuestion?.text].filter(Boolean),
 defaults:()=>({points:Number.isFinite(Number(s.roomCorrect))?Number(s.roomCorrect):1,penalty:Number.isFinite(Number(s.roomIncorrect))?Number(s.roomIncorrect):0})}):null;
if(isHost){window.BuzzyAiTopics=topicChips;window.BuzzyAiPeriods=periods;}
function message(text,error=false){roomUi.setStatus(code,text,error);status.dataset.error=String(error);}
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
 const p=await makePresentation(),settings=sharedSettings();
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
 if(!isHost||local||!s.networkReady||busy||exitTask||!connected)return;
 const cfg=sharedSettings();if(JSON.stringify(privateUi())===savedPrivate&&JSON.stringify(cfg)===savedSettings&&s.questionShown===!!latest.presentation?.shown)return;
 clearTimeout(saveTimer);saveTimer=setTimeout(()=>operation(async()=>{}),60);
}
async function archiveCurrent(){
 if(!s.activeRound)return;
 const r=json(s.activeRound);r.id=`round-${latest.control.r}`;r.archived=true;r.endedAt=client.serverNow();r.status=s.lastDecision==='correct'?'Correct answer':s.remainingAtClose===0?'Time expired':window.BuzzyRound?.noOneLeft()?'No correct answer':'Ended by host';r.scoresAfter=Object.fromEntries(s.players.map(p=>[p.id,p.score]));
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
 if(roomEnded)return;
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
  if(['closed','finished'].includes(c.phase)){r.archived=true;r.status=winner?'Correct answer':round.buzzes.some(b=>b.result==='pending')?'Buzzers stopped · Awaiting scoring':round.buzzes.length?'Buzzers stopped · Scoring complete':'Buzzers stopped · No buzzes';if(!s.roundOverview.some(x=>x.id===r.id))s.roundOverview.push(r);}
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
 message(offlineShown?'Disconnected — waiting to reconnect':!isHost&&['kicked','banned'].includes(me?.status)?(me.status==='banned'?'You are banned from this session.':'You have been removed. Return to the start page to rejoin.'):`Room ${code} · ${isHost?'Host':'Player'} · Connected`);
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
 syncExitControls();roomUi.sync();celebration.sync();
 if(!s.networkReady)return;
 document.documentElement.toggleAttribute('data-network-busy',busy||offlineShown||blocked);
 const badge=document.querySelector('.headbar .tag.desktoponly');if(badge)badge.textContent=isHost?'HOST':'PLAYER';document.title=`Buzzy · ${isHost?'Host':'Player'}`;
 const allowedLocal=a=>localActions.has(a);
 for(const el of document.querySelectorAll('[data-action],[data-pick]')){
  const a=el.dataset.action||'pick';
  const locked=(!isHost&&!a.startsWith('buzz:')&&!allowedLocal(a))||(isHost&&((busy&&a!=='celebrate')||offlineShown||blocked)&&!localActions.has(a)&&!['show-scores','round-overview','history'].includes(a)&&!a.startsWith('host-theme:')&&!(a.startsWith('ai-')&&a!=='ai-add'));
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
 if(action==='network-open-leave'){openExit();return true;}
 if(action==='network-confirm-exit'){confirmExit();return true;}
 if(action==='network-return-start'){leave();return true;}
 if(action==='close-modal'&&s.modal?.startsWith('network-'))return !!exitTask;

 if(isHost&&action==='ai-open'){s.modal='ai-questions';api.render();return true;}
 if(isHost&&action==='ai-open-settings'){s.modal='';s.hostTab='more';api.render();return true;}
 if(isHost&&action.startsWith('ai-')){const result=aiQuestions.handle(action);if(result!==null){if(String(result).startsWith('added:'))api.tip(`${result.slice(6)} question${result.slice(6)==='1'?'':'s'} added to the queue.`);return true;}}
 if(isHost&&action.startsWith('host-theme:')){hostTheme.set(action.slice(11));api.render();return true;}
 if(!client||!s.networkReady)return true;
 if(!isHost){
  if(action.startsWith('buzz:')){buzz(action.slice(5));return true;}
  return !['toggle-question-info','player-leaderboard','dismiss-leaderboard','open-buzz-order','close-buzz-order','close-modal'].includes(action);
 }
 if(action==='copy-link'){roomUi.copyLink();return true;}
 if(action==='qr'){roomUi.openShare();return true;}
 if(action==='viewer-copy-link'){roomUi.copyViewerLink();return true;}
 if(action.startsWith('viewer-view:')){const view=action.slice(12);if(viewerViews.includes(view)&&s.viewerView!==view){s.viewerView=view;api.render();scheduleSave();}return true;}
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
  // #391: a decided round (nobody can change the result) moves on without the confirmation.
  if(s.phase==='open'||(s.buzzes.length&&s.lastDecision!=='correct'&&!window.BuzzyRound?.decided()))return false;advance(action);return true;
 }
 if(action==='set-play-mode:quick'&&s.quickQuestion)return false;
 if(action.startsWith('set-play-mode:')&&!['open','locked','closed'].includes(s.phase)&&!s.buzzes.length){operation(async()=>runLocal(()=>api.handle(action)));return true;}
 if(action==='round-overview'||action==='history'||action==='export-history'){afterIdle(()=>operation(async()=>{await loadArchive();runLocal(()=>api.handle(action));},{save:false}));return true;}
 if(action.startsWith('apply-adjust:')){const id=action.split(':')[1],delta=Number(document.getElementById('adjustval')?.value);operation(async()=>{await command('adjust',{playerId:id,delta,allowNegative:s.allowNegativeScores,name:s.players.find(p=>p.id===id)?.name});s.modal='';},{save:false});return true;}
 if(/^(kick|ban|unban|rejoin):/.test(action)){const [kind,id]=action.split(':');operation(async()=>{await command('moderate',{playerId:id,status:kind==='kick'?'kicked':kind==='ban'?'banned':'active'});s.modal='';},{save:false});return true;}
 if(action==='celebrate'){if(s.celebration)afterIdle(()=>{if(s.celebration&&s.networkReady&&!exitTask) return operation(()=>command('celebrate'),{save:false});});else api.tip('Celebration effects are disabled.');return true;}
 if(action==='end-room'){openExit('network-end');return true;}
 return false;
}
function buzz(id){
 if(isHost||id!==client?.uid){api.tip('Buzz from your own player view.');return;}
 // Give immediate local feedback from the user's tap; unsupported or disabled
 // vibration must never interfere with sending the buzz to Firebase.
 if(typeof navigator!=='undefined'&&typeof navigator.vibrate==='function')try{navigator.vibrate(40);}catch{}
 operation(async()=>{await command('buzz');},{save:false});
}
function maybeExpire(){
 if(!connected||blocked||busy||exitTask||!latest||latest.control.phase!=='open'||latest.round.phase==='locked'||!s.timer||client.serverNow()<s.endAt)return;
 if(!isHost){if(s.phase==='open'){s.phase='closed';s.remainingAtClose=0;s.clockStoppedAt=s.endAt;api.render();api.scheduleTimeoutFlip();}return;}
 const key=`${latest.control.r}_${latest.control.a}`;if(expiryKey===key)return;expiryKey=key;
 operation(async()=>{await command('expire');},{save:false});
}
function exitTitle(modal){return modal==='network-ended'?'Game ended':isHost?'End game and leave?':'Leave room?';}
function exitDialog(modal){
 if(modal==='network-ended')return '<p class="muted" style="margin:10px 0 18px">The host has ended this game. This room is now closed.</p><button type="button" class="btn primary full" data-action="network-return-start">Back to start</button>';
 return `<p class="muted" style="margin:10px 0 18px">${isHost?'Leaving as host ends the game for everyone and deletes this room. Players will be told that the game has ended.':'You will leave this room and return to the start page. The game will continue for the other players.'}</p><p id="network-exit-status" class="muted sm" role="status" hidden></p><div class="grid2"><button type="button" class="btn" data-action="close-modal">Stay in room</button><button type="button" class="btn ${isHost?'danger':'primary'}" data-action="network-confirm-exit">${isHost?'End game and leave':'Leave room'}</button></div>`;
}
function syncExitControls(){
 if(!isHost){
  const member=s.players.find(p=>p.id===client?.uid);
  document.documentElement.toggleAttribute('data-player-status-visible',!s.networkReady||offlineShown||blocked||roomEnded||status.dataset.error==='true'||['kicked','banned'].includes(member?.status));
  const button=document.querySelector('[data-action="network-open-leave"]');if(button){button.setAttribute('aria-label',roomEnded?'Back to start':'Leave room');button.title=roomEnded?'Back to start':'Leave room';}
 }
 if(!s.modal?.startsWith('network-'))return;
 document.querySelectorAll('#modalroot [data-action="network-confirm-exit"],#modalroot [data-action="close-modal"]').forEach(button=>{button.disabled=!!exitTask;});
}
function openExit(modal='network-leave'){
 if(roomEnded){leave();return;}
 s.modal=modal;api.render();syncExitControls();
}
async function confirmExit(){
 if(exitTask)return;
 const notice=document.getElementById('network-exit-status');
 if(isHost&&(!client||!s.networkReady||!connected||blocked||busy)){
  notice.hidden=false;notice.textContent=busy?'Wait for the current action to finish before ending the game.':'Wait until you are connected before ending the game for everyone.';return;
 }
 held=true;clearTimeout(saveTimer);exitTask=(async()=>{if(isHost)await command('delete');leave();})();syncExitControls();
 try{await deadline(exitTask,15000,'Waiting for the connection. The game will close when your request completes.');}
 catch(error){if(notice){notice.hidden=false;notice.textContent=error.message;}}
 finally{
  // A timed-out UI wait must not submit the queued room deletion a second time.
  const pending=exitTask;pending.then(()=>{},()=>{if(exitTask===pending){exitTask=null;held=false;if(latest&&!roomEnded)project(latest);syncExitControls();}});
 }
}
function ended(){
 if(roomEnded)return;
 clearTimeout(startupRetry);
 roomUi.closeShare();roomEnded=true;blocked=true;retry.hidden=true;if(!isHost)document.getElementById('leave-room').textContent='Back to start';message(isHost?'This game has ended.':'The host has ended the game.');
 if(!exitTask){s.modal='network-ended';api.render();}afterRender();
}
function leave(){roomEnded=true;clearTimeout(startupRetry);stopWatch?.();stopViewers?.();stopConnection?.();++loadGeneration;clearTimeout(saveTimer);client?.setOnline(false);sessionStorage.removeItem(sessionKey);location.assign('/');}
window.BuzzyNetwork={viewerUrl:()=>isHost&&s.networkReady?roomUi.viewerUrl():'',patchHostPage:(root,markup)=>patchHostMarkup(root,markup,root.id==='host-view-content'?s.hostTab:undefined),celebrateVisual:celebration.launch,get local(){return local;},handle,exitTitle,exitDialog,buzz,maybeExpire,preload:scheduleSave,afterRender,now:()=>client?.serverNow()??Date.now()};
// Preserve controls' own disabled state: retained modal/source nodes must unlock after a request.
for(const type of ['click','keydown'])document.addEventListener(type,event=>{
 if(type==='keydown'&&!['Enter',' '].includes(event.key))return;
 if(event.target.closest?.('[data-network-blocked]')){event.preventDefault();event.stopImmediatePropagation();}
},true);
document.getElementById('leave-room').addEventListener('click',e=>{e.preventDefault();e.currentTarget.focus({preventScroll:true});openExit();});
for(const type of ['click','change','drop','keydown'])document.addEventListener(type,event=>{
 if(local)return;
 if(type==='keydown'&&event.key!=='Enter')return;
 if(isHost&&event.target.closest?.('[data-pick]')){
  const pick=event.target.closest('[data-pick]'),id=pick.dataset.pick,order=Number(pick.dataset.buzzOrder)||s.buzzes.find(b=>b.id===id)?.order;
  queueMicrotask(()=>operation(()=>command('select',{playerId:id,order}),{save:false}));return;
 }
 queueMicrotask(scheduleSave);
});
let starting,startupRetry,startupRetryDelay=2000;
function playerStartupMessage(error){
 const code=String(error?.code||'');
 if(error?.message==='This room is no longer available.')return 'This room is no longer available. Ask your host for a new room code.';
 if(error?.message==='You are banned from this session.')return 'You can’t rejoin this room. Ask your host for help.';
 if(error?.message==='No room selected. Return to the start page to create or join a room.'||error?.message==='Join this room from the start page first.')return 'Your room session could not be restored. Return to the start page and join the room again.';
 if(code.startsWith('auth/'))return 'We couldn’t sign in to reconnect to this room. Check your connection and try again.';
 if(code==='network/timeout'||/taking too long|network-request-failed|NetworkError/i.test(error?.message||''))return 'We couldn’t reconnect to the room. Check your connection and try again.';
 return error?.message||'We couldn’t reconnect to the room. Try again or return to the start page.';
}
function begin(){
 if(starting||roomEnded)return starting;
 clearTimeout(startupRetry);
 // Offer recovery early while the same SDK work continues in the background.
 const slow=setTimeout(()=>{if(!roomEnded&&!s.networkReady){message('Still connecting. Check your connection or try again.');retry.hidden=false;afterRender();}},4000);
 return starting=start().then(()=>{startupRetryDelay=2000;}).catch(e=>{
  if(roomEnded)return;held=false;blocked=true;message(isHost?(e.message||'Unable to connect. Check your connection and try again.'):playerStartupMessage(e),true);retry.hidden=false;afterRender();
  if(e.code==='network/timeout'||e.code==='auth/network-request-failed'){
   startupRetry=setTimeout(()=>{client?.reconnect();begin();},startupRetryDelay);startupRetryDelay=Math.min(10000,startupRetryDelay*2);
  }
 }).finally(()=>{clearTimeout(slow);starting=null;});
}
retry.addEventListener('click',()=>{client?.reconnect();if(!s.networkReady||blocked)begin();});
window.addEventListener('online',()=>{if(!s.networkReady||blocked)begin();});
async function start(){
 retry.hidden=true;blocked=false;
 stopWatch?.();stopConnection?.();
 let saved;try{saved=JSON.parse(sessionStorage.getItem(sessionKey));}catch{}
 if(!saved||saved.role!==role||!/^[A-HJ-NP-Z2-9]{4}$/.test(saved.code))throw new Error('No room selected. Return to the start page to create or join a room.');
 code=saved.code;client=await getClient();
 // Initial connection is pending, not a failure: keep retry out of the header until needed.
 stopConnection=client.watchConnection(value=>{connected=value;trackConnection(value);if(roomEnded){afterRender();return;}retry.hidden=!blocked&&(!s.networkReady||value||!offlineShown);if(value&&blocked&&!starting)queueMicrotask(begin);if(s.networkReady&&!blocked){if(value||offlineShown)message(value?`Room ${code} · Connected`:'Disconnected — waiting to reconnect');api.render();afterRender();}});
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
  // #347: only the number of viewer screens is shown; viewers never appear as players.
  stopViewers?.();stopViewers=client.watchViewers(code,count=>{if(s.viewerCount===count)return;s.viewerCount=count;if(s.networkReady){api.render();roomUi.sync();}},()=>{});
 }else{
  const member=await client.read(`rooms/${code}/members/${client.uid}`);if(!member)throw new Error('Join this room from the start page first.');
 }
 await deadline(new Promise((resolve,reject)=>{stopWatch=client.watch(code,value=>{latest=value;project(value);retry.hidden=connected||!offlineShown;resolve();},e=>{if(e.code==='room/not-found'&&s.networkReady){ended();return;}if(roomEnded)return;message(e.code==='room/not-found'?e.message:'The room is unavailable or this view no longer has access. Return to the start page.',true);blocked=true;retry.hidden=false;afterRender();reject(e);});}));
}
begin();
