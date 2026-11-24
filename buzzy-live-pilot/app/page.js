
(()=>{
function gameNow(){return window.BuzzyNetwork?.now?.()??Date.now();}
const BUZZY_BUILD=window.BUZZY_RUNTIME?'network':'development'; // Production builds must exclude test actions at build time.
const state={devUi:BUZZY_BUILD==='development',code:'B7K4',codeSource:'demo',created:gameNow(),hostTab:'play',preview:true,mode:'timed',defaultMode:'timed',timer:true,seconds:10,roomTimer:true,roomSeconds:10,roomCustomDurationSelected:false,allowRepeat:false,leaderboard:true,playerBuzzOrder:true,buzzOrderNames:true,playerLeaderboardOpen:{},buzzOrderExpanded:false,feedLastRenderedOrder:0,feedDecision:null,ownScore:true,showQuestionPoints:true,sounds:true,answerSounds:true,animations:true,celebration:true,correct:1,incorrect:0,roomCorrect:1,roomIncorrect:0,quickQuestion:{id:'quick-initial',title:'Quick Question',text:'',image:'',points:1,penalty:0,mode:'default',timer:'default',savedToLibrary:false},phase:'presented',startAt:null,endAt:null,attemptNumber:1,buzzes:[],attempts:[],gradedBuzzKeys:[],selectedBuzzOrder:null,excluded:[],remainingAtClose:null,hostShowResults:false,lastDecision:null,showCustomize:false,showQuickContent:false,optionOpen:null,playerEffect:null,preloadBypass:false,preloadStartedAt:0,selected:'p1',viewAs:'p1',winner:null,showResults:false,leaderboardDismissed:{},shareLeaderboard:false,preload:null,preloadExpanded:false,showUpNext:true,preloadGeneration:0,modal:'',editing:null,pendingPlayMode:null,players:[{id:'p1',name:'Alex',score:8,status:'active'},{id:'p2',name:'Anna',score:6,status:'active'},{id:'p3',name:'Erik',score:4,status:'active'},{id:'p4',name:'Sara',score:2,status:'active'}],questions:[{id:'q1',isDemo:true,title:'The solar system',text:'Which planet is the largest in our solar system?',image:'',points:1,penalty:0,mode:'default',timer:'default',active:true,played:false},{id:'q2',isDemo:true,title:'Music trivia',text:'Which band released the album Abbey Road?',image:'',points:2,penalty:-1,mode:'timed',timer:'10',active:true,played:false},{id:'q3',isDemo:true,title:'Geography',text:'What is the capital of Australia?',image:'',points:1,penalty:0,mode:'default',timer:'default',active:true,played:false}],qIndex:0,history:[],events:[],roundOverview:[],activeRound:null,overviewExpanded:{},clockStoppedAt:null,lastStampBuzzKey:null,stampSeen:new Set(),setName:'Friday Quiz',countQuestion:1};
if(window.BUZZY_RUNTIME){Object.assign(state,{devUi:false,code:'',codeSource:'server',players:[],questions:[],selected:null,viewAs:null,preview:window.BUZZY_RUNTIME.role==='player'});}
state.playerEffects={};state.coinSeen=new Set();state.scoreRollSeen=new Set();state.effectSerial=0;state.buzzEvaluations={};state.pointerLastOrder=null;state.feedArrowShown=false;state.feedAnsweringSeen=new Set();
state.hostLeaderboardClosing=false;state.shareLeaderboardClosing=false;state.playerLeaderboardClosing={};
state.buzzOrderClosing=false;state.buzzOrderFirstShown=false;state.buzzOrderCloseSerial=0;
state.buzzOrderOpenFor={};state.buzzOrderClosingFor={};state.buzzOrderShownFor={};state.buzzOrderCloseSerialFor={};state.focusTurnKey=null;
state.hostClockDiagnostics={longestTickGapMs:0,ticks:0};state.timeoutFlipSerial=0;state.overlayDomPlayer=null;state.overlayScoreSignature={};state.readyReturnById={};state.readyReturnSerial=0;
state.showQuestionInfoDefault=false;state.playerQuestionInfoChoice={};
state.allowNegativeScores=true; // Prototype ON; recommend production default OFF.
state.questionAvailabilityFilter="all";
state.playerSort='score';state.roundOverviewOpen=false;state.roundOverviewClosing=false;state.roundOverlaySerial=0;state.quickContentTransition=false;state.quickBehaviorOptionsOpen=false;state.pushTransitionSerial=0;state.playedSequence=0;state.questionEditorOptionsOpen=false;state.settingsOpen={game:false,display:false,effects:false,viewer:false};Object.assign(state,{roundViewerHidden:false,viewerView:'standby',viewerQuestionNumber:true,viewerQuestion:true,viewerTimer:true,viewerBuzzOrder:true,viewerLeaderboard:true,viewerCelebration:true,viewerJoinScreen:false,viewerCount:0});
state.playModeTransition=null;
// v7.5 room defaults (only applied when a new question is selected/created).
state.roomTextVisibility='visible';state.roomBuzzerStart='manual';
state.roundTextVisible=true;state.roundStartTogether=false;
// v7: OFF pauses admission into the room until a new question starts.
state.allowJoinDuringQuestion=true;
state.questionShown=false;
state.joinNotice=null;
state.joinNoticeSerial=0;
state.joinAnimationMetrics={enter:240,hold:1500,exit:200};
state.joinNextId=5;
state.leaderboardGeneration={host:0};state.leaderboardShownKeys=new Set();state.leaderboardSnapshots={};state.labScoreTools=false;state.leaderboardTransitionSerial=0;state.lbHostSerial=0;state.lbShareSerial=0;state.lbPlayerSerial={};
const motionPreference=window.matchMedia('(prefers-reduced-motion: reduce)');
let reducedMotion=motionPreference.matches;
const animationsEnabled=()=>!reducedMotion;
motionPreference.addEventListener('change',event=>{
 reducedMotion=event.matches;
 // Invalidate closing transitions when the preference changes and finalize immediately.
 if(reducedMotion){
  ++state.lbHostSerial;++state.lbShareSerial;
  for(const p of state.players)state.lbPlayerSerial[p.id]=(state.lbPlayerSerial[p.id]||0)+1;
  if(state.hostLeaderboardClosing)commitHostLeaderboardClose();
  state.shareLeaderboardClosing=false;
  for(const id of Object.keys(state.playerLeaderboardClosing)){if(state.playerLeaderboardClosing[id])commitDismissPlayer(id);}
  for(const id of Object.keys(state.buzzOrderClosingFor))if(state.buzzOrderClosingFor[id]){state.buzzOrderClosingFor[id]=false;state.buzzOrderOpenFor[id]=false;state.buzzOrderShownFor[id]=false;state.buzzOrderCloseSerialFor[id]=(state.buzzOrderCloseSerialFor[id]||0)+1;}
 }
 render();
});
document.body.addEventListener('buzzy-design-refresh',()=>render());
document.addEventListener('buzzy-development-preview',event=>{state.devUi=BUZZY_BUILD==='development'&&!!event.detail.enabled; document.body.classList.toggle('prototype-production',!state.devUi);if(!state.devUi&&!state.quickQuestion&&state.questions[state.qIndex]?.isDemo){state.quickQuestion=state.quickQuestion||{id:'quick-preview',title:'Quick question',text:'',image:'',points:state.correct,penalty:state.incorrect,mode:'default',timer:'default'};state.phase='presented';}render();});
const $=s=>document.querySelector(s);const safe=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');const fmt=n=>Number(n).toFixed(3)+' s';const pointsUnit=n=>Math.abs(Number(n))===1?'pt':'pts'; const me=()=>state.players.find(p=>p.id===state.viewAs);const selected=()=>state.players.find(p=>p.id===state.selected);const currentQ=()=>state.quickQuestion||state.questions[state.qIndex]||state.questions[0];const nextPreparedIndex=(after=-1)=>state.questions.findIndex((q,i)=>((after<0||i!==after))&&q.active!==false&&!q.played&&(state.devUi||!q.isDemo));const remainingSec=()=>state.phase==='open'?Math.max(0,Math.ceil((state.endAt-gameNow())/1000)):(['locked','closed'].includes(state.phase)&&state.remainingAtClose!==null?state.remainingAtClose:state.seconds);
const fmtSeconds=n=>String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');
// #120: one validation rule for both room defaults and the active question.
const durationPresets=[5,10,15,20,30,60];
function validCustomDuration(raw){const v=String(raw??'').trim();if(!/^\d+$/.test(v))return null;const n=Number(v);return Number.isSafeInteger(n)&&n>=1&&n<=600?n:null;}
function boltIcon(){return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 4 13h7l-1 9 10-12h-7z"/></svg>'}
function qrIcon(){return '<svg class="buzzy-qr-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2.5" y="2.5" width="7" height="7" rx=".8"/><rect x="14.5" y="2.5" width="7" height="7" rx=".8"/><rect x="2.5" y="14.5" width="7" height="7" rx=".8"/><path d="M5 5h2v2H5zM17 5h2v2h-2zM5 17h2v2H5z" fill="currentColor" stroke="none"/><path d="M14.5 14.5h2.5v2.5h-2.5zM20 14.5v3M18 20h3M14.5 20h1.5"/></svg>'}
function roomDurationSelect(){
 const seconds=state.roomSeconds;
 const custom=state.roomCustomDurationSelected||!durationPresets.includes(seconds);
 const disabled=!state.roomTimer;
 const options=durationPresets.map(n=>`<option value="${n}" ${!custom&&seconds===n?'selected':''}>${n} seconds</option>`).join('');
 return `<div class="settings-inline settings-duration-row${disabled?' duration-is-disabled':''}" ${disabled?'aria-disabled="true"':''}><div class="duration-label-group"><label class="label" for="seconds">Default duration</label><span class="duration-disabled-note" ${disabled?'':'aria-hidden="true"'}>Enable the timer to change this setting.</span></div><div class="duration-setting-fields"><select class="field" id="seconds" data-duration-choice="room" aria-label="Default duration" ${disabled?'disabled aria-disabled="true"':''}>${options}<option value="custom" ${custom?'selected':''}>Custom…</option></select>${custom?`<label class="duration-custom-label" for="room-custom-seconds">Custom duration (seconds)</label><input class="field duration-custom-input" id="room-custom-seconds" type="number" min="1" max="600" step="1" inputmode="numeric" value="${seconds}" data-duration-custom="room" aria-label="Custom default duration in seconds" ${disabled?'disabled aria-disabled="true"':''}>`:''}</div></div>`;
}
const formatRemaining=()=>fmtSeconds(remainingSec());
// A round has ONE centrally determined countdown. Its visual fade is a display-only effect.
function stopPlayerClock(){
 if(!state.timer||!state.startAt||state.clockStoppedAt!==null)return;
 state.clockStoppedAt=gameNow();
}
function playerClockVisual(playerId){
 if(!state.timer||!state.startAt)return {visible:false,text:'',opacity:0};
 const muted=state.buzzes.some(b=>b.id===playerId);
 const level=muted?.4:1;
 if(state.phase==='open')return {visible:true,text:formatRemaining(),opacity:level};
 if(state.clockStoppedAt===null)return {visible:false,text:'',opacity:0};
 return {visible:true,text:fmtSeconds(Math.max(0,state.remainingAtClose??0)),opacity:level};
}

function modeIcon(mode){return mode==='timed'
 ? '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="13" r="8"/><path d="M12 13l3.5-3.5M9 2h6M12 5V2"/></svg>'
 : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 2L4.5 13h6.5L10.5 22l9-11h-6.5z"/></svg>'}
function tileIcon(which){if(which==='other')return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/><circle cx="9" cy="6" r="2" fill="#eff4fa"/><circle cx="16" cy="12" r="2" fill="#eff4fa"/><circle cx="11" cy="18" r="2" fill="#eff4fa"/></svg>';if(which==='mode')return modeIcon(state.mode);if(which==='timer')return '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';if(which==='correct')return '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8 12l2.5 2.5L16 9"/></svg>';return '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9 9l6 6m0-6l-6 6"/></svg>'}
function nextUngradedBuzz(){return [...state.buzzes].sort((a,b)=>a.order-b.order).find(b=>!state.gradedBuzzKeys.includes(state.attemptNumber+':'+b.order))||null}
function selectTimedBuzz(b){state.selectedBuzzOrder=b?.order??null;state.selected=b?.id??null}
function prototypeAction(action){if(window.BUZZY_RUNTIME&&action==='copy-link')return false;return action==='simulate'||action==='simulate-join'||action.startsWith('rejoin:')||action.startsWith('lab-')||action==='copy-link'||action==='test-sound'||action==='test-correct-sound'||action==='test-incorrect-sound'||action==='demo-timeout'||action==='demo-wait'||action==='demo-turn'||action==='lab-preview-latest-guest'||action==='lab-timer-diagnostics'||action==='toggle-preview';}
function actionButton(label,action,cls='btn',extra=''){return `<button class="${cls}${prototypeAction(action)?' prototype-only':''}" ${prototypeAction(action)?'data-prototype-control="true"':''} data-action="${action}" ${extra}>${label}</button>`}
function tip(t){$('#toast').textContent=t;$('#toast').classList.add('show');clearTimeout(window._tt);window._tt=setTimeout(()=>$('#toast').classList.remove('show'),2400)}
function confetti(){window.BuzzyNetwork?.celebrateVisual?.();}
function animateBuzzLogos(playerId){
 const targets=[document.querySelector('.headbar .brand')];
 if(state.viewAs===playerId)targets.push(document.querySelector('.phone .ph-title'));
 for(const el of targets){if(!el)continue;el.classList.remove('buzzy-shake');void el.offsetWidth;el.classList.add('buzzy-shake');el.addEventListener('animationend',()=>el.classList.remove('buzzy-shake'),{once:true})}
}
function activePlayers(){return state.players.filter(p=>p.status==='active')}
function questionInProgress(){
 return state.phase==='open'||state.phase==='locked'||
  (state.phase==='closed'&&state.startAt!==null)||
  (state.phase==='presented'&&state.questionShown);
}
function advanceJoinNotice(serial){
 const notice=state.joinNotice;
 if(!notice||notice.serial!==serial)return;
 const ms=state.joinAnimationMetrics;
 if(notice.phase==='enter'){
  notice.phase='hold';render();
  setTimeout(()=>advanceJoinNotice(serial),ms.hold);
 }else if(notice.phase==='hold'){
  if(!notice.stopAfterCurrent && notice.index+1<notice.items.length){
   notice.phase='swap';render();
   setTimeout(()=>advanceJoinNotice(serial),ms.enter);
  }else{
   notice.phase='exit';render();
   setTimeout(()=>advanceJoinNotice(serial),ms.exit);
  }
 }else if(notice.phase==='swap'){
  // New entry has finished sliding up into the stationary status slot.
  notice.index++;
  notice.phase='hold';render();
  setTimeout(()=>advanceJoinNotice(serial),ms.hold);
 }else if(notice.phase==='exit'){
  state.joinNotice=null;render();
 }
}
function stopQueuedJoinNoticesAfterCurrent(){
 // The current announcement completes its full display/exit cycle.
 // A new buzzer round must not start a previously queued announcement.
 if(state.joinNotice)state.joinNotice.stopAfterCurrent=true;
}
function showJoinAnnouncement(names,existingRecipients){
 if(!names.length||!existingRecipients.length||state.joinNotice?.stopAfterCurrent)return;
 const additions=(names).map(name=>({name,recipientIds:[...existingRecipients]}));
 if(state.joinNotice&&!state.joinNotice.stopAfterCurrent&&state.joinNotice.question===state.countQuestion){
  state.joinNotice.items.push(...additions);return;
 }
 const serial=++state.joinNoticeSerial;
 state.joinNotice={serial,items:additions,index:0,phase:'enter',stopAfterCurrent:false,question:state.countQuestion};
 setTimeout(()=>advanceJoinNotice(serial),state.joinAnimationMetrics.enter);
}
function promotePendingJoins(){
 // Called only by the next-question transition, not timeout, retry or grading.
 const people=state.players.filter(p=>p.status==='waiting'||p.status==='queued');
 if(!people.length)return
 const previous=activePlayers().map(p=>p.id);
 const names=people.map(p=>p.name);
 people.forEach(p=>p.status='active');
 history('Guests admitted',names.join(', ')+' · Eligible from question '+state.countQuestion);
 showJoinAnnouncement(names,previous);
}
function simulateGuestJoin(){
 const id='p'+state.joinNextId;
 const name='Guest '+state.joinNextId++;
 const inQuestion=questionInProgress();
 const status=inQuestion?(state.allowJoinDuringQuestion?'waiting':'queued'):'active';
 const prior=activePlayers().map(p=>p.id);
 state.players.push({id,name,score:0,status});
 if(status==='active'){
  // New participant is eligible immediately only while no question is in progress.
  beginAutoPreload();
  history('Player joined',name+' · Ready to play');
  showJoinAnnouncement([name],prior);
 }else{
  history(status==='queued'?'Join request queued':'Player joined as spectator',name+' · Waiting for next question');
 }
 state.lastJoinedId=id;
 render();
}

function resolveQuestionBehavior(q=currentQ()){
 const visibility=(state.quickQuestion&&(!q.textVisibility||q.textVisibility==='default')?'visible':(q.textVisibility||'default'));
 const start=(q.buzzerStart||'default');
 state.roundTextVisible=visibility==='host'?false:visibility==='visible'?true:state.roomTextVisibility!=='host';
 state.roundStartTogether=start==='together'?true:start==='manual'?false:state.roomBuzzerStart==='together';
 state.roundViewerHidden=q.viewerContent==='hide';
}
function effectiveQuestionTextVisible(){return state.roundTextVisible}
function togetherStartAvailable(){
 const q=currentQ();
 return state.roundStartTogether&&!!(q.text||q.image);
}
function questionBehaviorFields(q,prefix){
 ;
 const quickVisibility=(prefix==='quick');
 const visibility=quickVisibility?(q.textVisibility==='host'?'host':'visible'):(q.textVisibility||'default'),start=q.buzzerStart||'default';
 const field=(id,label,selected,opts,desc)=>`<div class="question-behavior-field"><label class="label" for="${id}">${label}</label><select class="field" id="${id}">${opts.map(([value,name])=>`<option value="${value}" ${selected===value?'selected':''}>${name}</option>`).join('')}</select><p class="sm muted">${desc}</p></div>`;
 return `<div class="question-behavior-grid">${field(prefix+'visibility','Question text',visibility,quickVisibility?[['host','Host only'],['visible','Players and host']]:[['default','Room default'],['host','Host only'],['visible','Players and host']],'Images are still shown to players.')}${field(prefix+'start','Buzzer start',start,[['default','Room default'],['manual','Separately by host'],['together','Together with question']],'Together starts a question and its buzzers with one button.')}${field(prefix+'viewer','Viewer screen',q.viewerContent==='hide'?'hide':'same',[['same','Same as players'],['hide','Hidden on viewer']],'Hide the question on viewer screens. Players still see it.')}</div>`;
}
function setQuestionBehaviorFromFields(q,prefix){
 const visibility=$('#'+prefix+'visibility'),start=$('#'+prefix+'start');
 if(visibility)q.textVisibility=visibility.value;
 if(start)q.buzzerStart=start.value;
 const viewer=$('#'+prefix+'viewer');if(viewer)q.viewerContent=viewer.value;
}
function preloadStats(){let a=activePlayers(),statuses=state.preload?.statuses||{};return {total:a.length,ready:a.filter(p=>statuses[p.id]==='ready').length,failed:a.filter(p=>statuses[p.id]==='failed').length}}
function beginAutoPreload(){
 if(window.BUZZY_RUNTIME)return window.BuzzyNetwork?.preload?.();
  const token=++state.preloadGeneration,q=currentQ(),players=activePlayers();
  state.preloadBypass=false;
  state.preloadStartedAt=gameNow();
  setTimeout(()=>{if(token===state.preloadGeneration&&state.hostTab==='play'&&['ready','presented'].includes(state.phase))render()},5150);
  state.preload={questionId:q.id||'current',statuses:Object.fromEntries(players.map(p=>[p.id,'loading'])),error:''};
  // No visible question content: nothing to download. A spoken Quick Question can start immediately.
  if(!questionContentNeedsPreload()){for(const p of players)state.preload.statuses[p.id]='ready';if(!state.modeSwitchBatching)render();return}
  let settled=false;
  let watchdog;
  const finish=(ok,error='')=>{
    if(settled||token!==state.preloadGeneration)return;
    settled=true;
    clearTimeout(watchdog);
    state.preload.error=error;
    players.forEach((p,i)=>setTimeout(()=>{if(token!==state.preloadGeneration)return;
      if(state.preload.statuses[p.id]==='loading')state.preload.statuses[p.id]=ok?'ready':'failed';
      render();
    },((state.modeTransitionUntil>gameNow())?400:160)+i*120));
  };
  if(!q.image){finish(true);return}
  const picture=new Image();picture.referrerPolicy='no-referrer';
  picture.onload=()=>{if(typeof picture.decode==='function'){picture.decode().then(()=>finish(true)).catch(()=>finish(false,'The image loaded but could not be decoded.'))}else finish(true)};
  picture.onerror=()=>finish(false,'The image link could not be loaded.');
  watchdog=setTimeout(()=>finish(false,'Image loading timed out. Check the link or your network.'),9000);
  picture.src=q.image;
}
function imageWithFallback(url,kind='host'){
 const label=kind==='player'?'Question image':'Question image preview';
 return `<div class="image-display image-display--${kind}"><img class="${kind==='player'?'player-question-image':'inline-question-image'}" src="${safe(url)}" alt="${label}" decoding="async" referrerpolicy="no-referrer" onload="this.closest('.image-display').classList.add('image-loaded')" onerror="this.closest('.image-display').classList.add('image-failed')"><div class="image-error" role="status">Image unavailable. Check the direct image URL.</div></div>`;
}
function updateImageEditorPreview(inputSelector,previewSelector){
 const box=$(previewSelector),input=$(inputSelector);
 if(!box||!input)return;
 const url=input.value.trim();
 box.replaceChildren();
 if(!url)return;
 if(!/^https?:\/\//i.test(url)){
   box.className='image-editor-preview image-preview-error';
   box.textContent='Enter a direct http:// or https:// image URL.';
   return;
 }
 box.className='image-editor-preview';
 const image=document.createElement('img');
 image.alt='Image preview';
 image.decoding='async';
 const status=document.createElement('span');
 status.className='preview-image-status';
 status.textContent='Loading image…';
 const timeout=setTimeout(()=>{
   if(box.isConnected&&input.value.trim()===url&&box.className==='image-editor-preview'){
     box.className='image-editor-preview image-preview-error';
     status.textContent='Image loading timed out. Check the link or your network.';
   }
 },9000);
 image.onload=()=>{
   clearTimeout(timeout);
   if(input.value.trim()!==url)return;
   box.className='image-editor-preview image-preview-ok';
   status.textContent='Image ready';
 };
 image.onerror=()=>{
   clearTimeout(timeout);
   if(input.value.trim()!==url)return;
   box.className='image-editor-preview image-preview-error';
   status.textContent='Image could not be loaded. Check the URL.';
 };
 box.append(image,status);
 image.src=url; // Browser follows HTTP redirects, including Picsum image redirects.
}
function updateQuickImagePreview(){updateImageEditorPreview('#quick-image','#quick-image-preview')}
function updatePreparedImagePreview(){updateImageEditorPreview('#qimage','#prepared-image-preview')}
function questionContentNeedsPreload(){const q=currentQ();return !!(q.image||(effectiveQuestionTextVisible()&&q.text))}
function preloadPending(){if(!questionContentNeedsPreload()||state.preloadBypass)return false;const p=preloadStats();return p.ready<p.total}
function commitQuickContent(){
 if(!state.quickQuestion)return false;
 const textEl=$('#quick-text'),imageEl=$('#quick-image');
 if(!textEl||!imageEl)return true;
 const title='Quick Question',text=textEl.value.trim(),image=imageEl.value.trim();
 if(image&&!/^https?:\/\//i.test(image)){tip('Image URL must start with http:// or https://');return false}
 const q=state.quickQuestion;
 const previousVisibility=q.textVisibility||'default',previousStart=q.buzzerStart||'default',previousViewer=q.viewerContent||'same';
 const contentChanged=q.text!==text||q.image!==image;
 Object.assign(q,{title,text,image});setQuestionBehaviorFromFields(q,'quick');
 const behaviorChanged=(q.textVisibility||'default')!==previousVisibility||(q.buzzerStart||'default')!==previousStart||(q.viewerContent||'same')!==previousViewer;
 if(contentChanged||behaviorChanged){resolveQuestionBehavior(q);state.phase=text||image?'ready':'presented';state.preloadExpanded=false;beginAutoPreload();history('Quick Question updated',`Question ${state.countQuestion}`)}
 return true;
}
function preloadPanel(){let q=currentQ();if(!questionContentNeedsPreload())return `<div class="notice">No player-visible content to preload. The host can open the buzzers when ready.</div>`;
 const {total,ready,failed}=preloadStats();
 const statusClass=failed?'red':ready===total?'green':'orange';
 const details=state.preloadExpanded?`<div id="preload-details" class="preload-detail-area"><p class="muted sm">Question content loads automatically when selected or when a player joins.</p><div class="preload-players ${activePlayers().length>6?'scrollable':''}">${activePlayers().map(p=>{const v=state.preload?.statuses?.[p.id]||'loading';return `<span class="preload-chip ${v}">${v==='ready'?'✓':v==='failed'?'!':'◷'} ${safe(p.name)} · ${v}</span>`}).join('')}</div>${failed?`<p class="sm" style="color:#a33042;margin-top:8px">${safe(state.preload.error||'Could not load question content.')}</p>`:''}<p class="muted sm" style="margin-top:8px">Demo player acknowledgements. You can reveal the question without waiting.</p></div>`:'';
 return `<div class="auto-preload-panel"><div class="preload-summary"><div class="preload-summary-left"><strong class="sm">Automatic preload</strong><span class="pill ${statusClass}" aria-live="polite">${ready}/${total} ready</span>${failed?`<span class="pill red">${failed} failed</span>`:''}</div><button type="button" class="preload-details-btn" data-action="toggle-preload" aria-controls="preload-details" aria-expanded="${state.preloadExpanded}">${state.preloadExpanded?'Hide details':'Show details'}<svg class="preload-details-chevron ${state.preloadExpanded?'is-open':''}" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button></div>${details}</div>`;
}
// V5 (19,21-24). Host, broadcast and locally opened panels are independent.
function leaderboardSorted(){return [...state.players].filter(p=>p.status==='active').sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name))}
function standingsRows(p=null,compact=false,context='host'){
 const players=leaderboardSorted(),prior=state.leaderboardSnapshots[context];
 const rankings=players.map((player,index)=>({player,index,rank:(players.findIndex(q=>q.score===player.score)+1)}));
 const move=prior&&animationsEnabled();
 const html=rankings.map(({player:x,index,rank})=>{
  const oldIndex=prior?.order.indexOf(x.id)??-1;
  const oldScore=prior?.scores[x.id];
  const changedScore=move&&Number.isFinite(oldScore)&&oldScore!==x.score;
  const posShift=move&&oldIndex>=0&&oldIndex!==index?oldIndex-index:0;
  const scoreSteps=changedScore?Math.min(10,Math.abs(x.score-oldScore)):0;
  const vals=scoreSteps?Array.from({length:scoreSteps+1},(_,i)=>i===scoreSteps?x.score:oldScore+Math.sign(x.score-oldScore)*i):[x.score];
  const digits=changedScore?`<span class="lb-score-window" aria-label="${x.score} points"><span class="lb-score-roller" style="--score-steps:${scoreSteps}">${vals.map(n=>`<span class="lb-score-number">${n}</span>`).join('')}</span></span>`:`<span class="lb-score-fixed">${x.score}</span>`;
  const top=rank===1;
  return `<div class="lb-entry ${top?'lb-first':''} ${p&&x.id===p.id?'lb-me':''} ${posShift?'lb-moving':''}" data-leaderboard-player="${safe(x.id)}" style="--rank-shift:${posShift*59}px"><span class="lb-rank">${top?'<span class="lb-crown" aria-hidden="true">♛</span>':rank}</span><span class="lb-player">${safe(x.name)}</span><span class="lb-score">${digits}<span class="lb-pts">pts</span></span></div>`;
 }).join('');
 state.leaderboardSnapshots[context]={order:players.map(p=>p.id),scores:Object.fromEntries(players.map(p=>[p.id,p.score]))};
 return html||'<p class="lb-empty">No scores yet.</p>';
}
function leaderboardSheet(p,forHost=false){
 const context=forHost?'host':p.id;
 const session=forHost?state.leaderboardGeneration.host:state.leaderboardGeneration[context]||0;
 const showKey=context+':'+session;
 const enter=!state.leaderboardShownKeys.has(showKey);
 state.leaderboardShownKeys.add(showKey);
 const leaving=forHost?state.hostLeaderboardClosing:!!state.playerLeaderboardClosing[p.id]||(state.shareLeaderboardClosing&&!state.playerLeaderboardOpen[p.id]);
 const toggle=forHost?`<label class="lb-share-row"><span class="lb-share-copy"><strong>Show on players' screens</strong><small>Share while this panel is open</small></span><input class="lb-switch" type="checkbox" role="switch" aria-label="Show on players' screens" data-share-leaderboard ${state.shareLeaderboard?'checked':''} ${state.hostLeaderboardClosing?'disabled':''}></label>`:'';
 return `<div class="player-leaderboard-sheet shared-list-sheet lb-v5 ${animationsEnabled()?(leaving?'lb-exit':enter?'lb-enter':'lb-still'):''}" role="dialog" aria-modal="true" aria-label="Leaderboard"><div class="shared-list-top lb-head"><div class="lb-title"><span class="lb-title-icon" aria-hidden="true">${trophyIcon()}</span><h2>Leaderboard</h2></div><button data-action="${forHost?'show-scores':'dismiss-leaderboard'}" class="lb-close" aria-label="Close leaderboard" ${leaving?'disabled':''}>✕</button></div><div class="lb-columns"><span>RANKING</span><span>POINTS</span></div><div class="shared-list-scroll standings-list lb-list">${standingsRows(p,false,context)}</div>${toggle}</div>`;
}
function hostSharedFor(p){return state.hostShowResults&&(state.shareLeaderboard)&&!state.leaderboardDismissed[p.id]}
function playerLeaderboardVisible(p){return !!p&&((state.leaderboard&&state.playerLeaderboardOpen[p.id])||hostSharedFor(p)||!!state.playerLeaderboardClosing[p.id]||(state.shareLeaderboardClosing&&!state.leaderboardDismissed[p.id]))}
function broadcastLeaderboard(p){if(!playerLeaderboardVisible(p))return '';return `<div class="player-leaderboard-overlay player-list-overlay lb-overlay ${state.playerLeaderboardClosing[p.id]||(state.shareLeaderboardClosing&&!state.playerLeaderboardOpen[p.id])?'lb-backdrop-exit':''}" data-action="dismiss-leaderboard">${leaderboardSheet(p)}</div>`}
function hostRoundOverviewOverlay(){
 if(!state.roundOverviewOpen||state.preview)return '';
 return `<div class="round-overview-overlay ${state.roundOverviewClosing?'is-closing':''}" data-action="close-round-overview" role="presentation"><div class="round-overview-sheet" role="dialog" aria-modal="true" aria-label="Round overview"><div class="round-overview-modal-head"><div class="round-overview-modal-title"><span aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/></svg></span><h2>Round overview</h2></div><button type="button" class="lb-close" data-action="close-round-overview" aria-label="Close Round overview">✕</button></div><div class="round-overview-scroll">${renderRoundOverview()}</div></div></div>`;
}
function closeRoundOverview(){
 if(!state.roundOverviewOpen||state.roundOverviewClosing)return;
 if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){state.roundOverviewOpen=false;state.roundOverviewClosing=false;render();return;}
 state.roundOverviewClosing=true;render();
 const serial=++state.roundOverlaySerial;
 setTimeout(()=>{if(serial!==state.roundOverlaySerial)return;state.roundOverviewOpen=false;state.roundOverviewClosing=false;render()},220);
}
function hostLeaderboardOverlay(){return (state.hostShowResults||state.hostLeaderboardClosing)&&!state.preview?`<div class="player-leaderboard-overlay host-leaderboard-overlay lb-overlay ${state.hostLeaderboardClosing?'lb-backdrop-exit':''}" data-action="show-scores">${leaderboardSheet(null,true)}</div>`:''}
function closeLeaderboardHost(){
 if(!state.hostShowResults||state.hostLeaderboardClosing)return;
 if(!animationsEnabled()||reducedMotion){commitHostLeaderboardClose();render();return}
 const serial=++state.lbHostSerial;
 state.hostLeaderboardClosing=true;state.shareLeaderboardClosing=state.shareLeaderboard;render();
 setTimeout(()=>{if(serial!==state.lbHostSerial)return;commitHostLeaderboardClose();render()},210);
}
function commitHostLeaderboardClose(){
 state.hostShowResults=false;state.hostLeaderboardClosing=false;state.shareLeaderboard=false;state.shareLeaderboardClosing=false;
 state.leaderboardDismissed={};state.leaderboardSnapshots.host=null;state.leaderboardShownKeys.delete('host:'+state.leaderboardGeneration.host);
 history('Host leaderboard closed','Host-controlled player display ended');
}
function setLeaderboardShare(enabled){
 if(!state.hostShowResults||state.hostLeaderboardClosing)return;
 ;
 ;
 const serial=++state.lbShareSerial;
 if(enabled){
   state.shareLeaderboard=true;state.shareLeaderboardClosing=false;state.leaderboardDismissed={};
   state.players.forEach(p=>{state.leaderboardGeneration[p.id]=(state.leaderboardGeneration[p.id]||0)+1;delete state.leaderboardSnapshots[p.id];});
   history('Leaderboard shared','Player screens');render();return;
 }
 state.shareLeaderboard=false;
 if(animationsEnabled()&&!reducedMotion){state.shareLeaderboardClosing=true;render();setTimeout(()=>{if(serial!==state.lbShareSerial)return;state.shareLeaderboardClosing=false;history('Leaderboard sharing stopped','Host panel remains open');render()},210)}
 else{state.shareLeaderboardClosing=false;history('Leaderboard sharing stopped','Host panel remains open');render()}
}
function dismissPlayerLeaderboard(){
 const id=state.viewAs;
 const isShared=hostSharedFor(me()||state.players[0]);
 const serial=state.lbPlayerSerial[id]=(state.lbPlayerSerial[id]||0)+1;
 if(animationsEnabled()&&!reducedMotion){state.playerLeaderboardClosing[id]=true;render();setTimeout(()=>{if(serial!==state.lbPlayerSerial[id])return;commitDismissPlayer(id);render()},210)}
 else {commitDismissPlayer(id);render()}
}
function commitDismissPlayer(id){state.playerLeaderboardOpen[id]=false;state.leaderboardDismissed[id]=true;delete state.playerLeaderboardClosing[id];delete state.leaderboardSnapshots[id]}
function getActiveGradeBuzz(){
 if(state.feedDecision?.type==='incorrect')return state.feedDecision.buzz;
 if(state.feedDecision?.type==='correct')return state.feedDecision.buzz;
 if(state.phase==='open'&&state.mode==='timed')return null;
 if(state.mode==='timed')return state.buzzes.find(b=>b.order===state.selectedBuzzOrder)||null;
 if(state.lastDecision==='incorrect')return null;
 return state.buzzes.find(b=>b.id===state.selected)||null;
}
function buzzOrderOverlay(p){
 if(!state.playerBuzzOrder||!(state.buzzOrderOpenFor[p.id]||state.buzzOrderClosingFor[p.id])||!state.buzzes.length||state.phase==='open')return '';
 return modernBuzzOrderOverlay(p);
}
function modernBuzzOrderOverlay(p){
 const current=getActiveGradeBuzz();
 const currentOrder=current?.order||null;
 const prev=state.pointerLastOrder;
 const diff=(prev!==null&&currentOrder!==null)?(prev-currentOrder)*52:0;
 state.pointerLastOrder=currentOrder;
 const rows=state.buzzes.map(b=>{
  const person=state.players.find(x=>x.id===b.id);
  const verdict=state.buzzEvaluations[`${state.attemptNumber}:${b.order}`];
  const curr=b.order===currentOrder;
  const recentWrong=(state.feedDecision?.type==='incorrect')&&state.feedDecision.buzz.order===b.order;
  const recentRight=(state.feedDecision?.type==='correct')&&state.feedDecision.buzz.order===b.order;
  const wrongOffset=recentWrong?` style="--wrong-flash-offset:-${Math.min(720,Math.max(0,gameNow()-state.feedDecision.startedAt))}ms"`:recentRight?` style="--correct-flash-offset:-${Math.min(720,Math.max(0,gameNow()-state.feedDecision.startedAt))}ms"`:'';
  return `<div class="lb-entry buzz-order-full-row ${b.id===p.id?'lb-me me':''} ${verdict==='correct'?'grade-right':''} ${verdict==='incorrect'?'grade-wrong':''} ${curr?'grade-current':''} ${recentWrong?'grade-recent-wrong':''} ${recentRight?'grade-recent-right':''}" data-grade-order="${b.order}"${wrongOffset}><span class="grade-arrow-slot">${curr&&true?`<span class="grade-arrow" style="--pointer-from:${diff}px" aria-label="Currently answering"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>`:''}</span><span class="lb-rank buzz-rank">#${b.order}</span><span class="lb-player">${state.buzzOrderNames?safe(person?.name||'Unknown'):'—'}</span><span class="lb-score buzz-time">${fmt(b.time)}</span></div>`;
 }).join('');
 const animate=animationsEnabled();
 const motion=animate?(state.buzzOrderClosingFor[p.id]?'lb-exit':state.buzzOrderShownFor[p.id]?'lb-still':'lb-enter'):'';
 state.buzzOrderShownFor[p.id]=true;
 return `<div class="player-list-overlay buzz-order-overlay lb-overlay ${state.buzzOrderClosingFor[p.id]?'lb-backdrop-exit':''}" data-action="close-buzz-order"><div class="player-leaderboard-sheet shared-list-sheet lb-v5 buzz-order-sheet ${motion}" role="dialog" aria-modal="true" aria-label="Buzz Order"><div class="shared-list-top lb-head"><div class="lb-title"><span class="lb-title-icon" aria-hidden="true">${modeIcon(state.mode)}</span><h2>Buzz Order</h2></div><button class="lb-close" data-action="close-buzz-order" aria-label="Close buzz order" ${state.buzzOrderClosingFor[p.id]?'disabled':''}>✕</button></div><div class="lb-columns"><span>BUZZ POSITION</span><span>TIME</span></div><div class="shared-list-scroll lb-list buzz-order-list">${rows}</div></div></div>`;
}
function closeBuzzOrder(){
 const id=state.viewAs;
 if(!state.buzzOrderOpenFor[id]||state.buzzOrderClosingFor[id])return;
 if(!animationsEnabled()||reducedMotion){state.buzzOrderOpenFor[id]=false;state.buzzOrderShownFor[id]=false;render();return}
 state.buzzOrderClosingFor[id]=true;const serial=state.buzzOrderCloseSerialFor[id]=(state.buzzOrderCloseSerialFor[id]||0)+1;render();
 setTimeout(()=>{if(serial!==state.buzzOrderCloseSerialFor[id])return;state.buzzOrderOpenFor[id]=false;state.buzzOrderClosingFor[id]=false;state.buzzOrderShownFor[id]=false;render()},210);
}
function liveBuzzFeed(p){
 if(!state.playerBuzzOrder)return '';
 if(p.status==='queued')return '<div class="player-feed-slot"></div>';
 const join=state.joinNotice;
 if(join&&!state.buzzes.length&&!state.feedDecision){
  const active=join.items[join.index];
  const next=join.items[join.index+1];
  const renderLine=(item,cls)=>item?.recipientIds.includes(p.id)?`<span class="join-line ${cls}" ${cls==='jn-swap-old'?'aria-hidden="true"':''}><span class="join-notice-body"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M19 8v8M15 12h8"/></svg><span>${safe(item.name)} joined the room</span></span></span>`:'';
  const isRecipient=active?.recipientIds.includes(p.id) || (join.phase==='swap'&&next?.recipientIds.includes(p.id));
  if(isRecipient){
   const lines=join.phase==='swap'?renderLine(active,'jn-swap-old')+renderLine(next,'jn-swap-new'):renderLine(active,'jn-'+(join.phase==='enter'?'enter':join.phase==='exit'?'exit':'hold'));
   return `<div class="player-feed-slot"><div class="live-buzz-feed feed-join-notice" data-join-serial="${join.serial}" data-join-phase="${join.phase}" role="status" aria-live="polite">${lines}</div></div>`;
  }
 }
 const latest=state.buzzes.at(-1),ended=state.phase!=='open';
 const current=ended?getActiveGradeBuzz():null;
 const settled=state.feedResolved;
  const usableSettled=settled&&settled.question===state.countQuestion&&settled.attempt===state.attemptNumber&&(!current||current.order===settled.buzz.order)?settled:null;
  const verdict=state.feedDecision||usableSettled;
  const visible=verdict?.buzz||(ended?current:latest);
 const previous=state.feedLastRenderedOrder&&state.buzzes.find(b=>b.order===state.feedLastRenderedOrder);
 const hasNew=!!visible&&state.feedLastRenderedOrder!==visible.order;
 state.feedLastRenderedOrder=visible?.order||0;
 const canOpen=ended&&state.buzzes.length>0;
 const showVerdict=!!verdict;
 const isAnswering=ended&&!!current&&!verdict;
 const who=visible?state.players.find(x=>x.id===visible.id):null;
 const fixed=ended&&!!visible;
 const showPointer=isAnswering||!!verdict;
 const doPush=fixed&&true&&state.buzzes.length>1&&hasNew&&!verdict;
 const queueMovesForward=doPush&&!!previous&&visible.order>previous.order;
 const arrowEnter=fixed&&showPointer&&!state.feedArrowShown;
 if(fixed&&showPointer)state.feedArrowShown=true;
 if(!ended)state.feedArrowShown=false;
 const answeringKey=isAnswering&&visible?`${state.countQuestion}:${state.attemptNumber}:${visible.order}`:null;
 const revealAnswer=answeringKey&&!state.feedAnsweringSeen.has(answeringKey)&&true;
 if(answeringKey)state.feedAnsweringSeen.add(answeringKey);
 const entry=(b,answer=false,kind='')=>{
  if(!b)return state.buzzes.length?`<span class="feed-count-placeholder">${state.buzzes.length} ${state.buzzes.length===1?'PLAYER':'PLAYERS'} BUZZED</span>`:'<span class="feed-placeholder" aria-label="No buzzes yet">—</span>';
  const person=state.players.find(x=>x.id===b.id);
  const name=safe(person?.name||'Player');
  const status=answer?`<span class="feed-answering-suffix ${revealAnswer?'suffix-arriving':''}">is answering…</span>`:kind==='wrong'?'<span class="feed-result-dim">✕</span>':(!ended?'<span class="feed-buzzed-suffix">buzzed</span>':'');
  const arrow=answer&&!fixed?'<span class="feed-grade-arrow" aria-hidden="true"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>':'';
  const namePart=state.buzzOrderNames?`<strong class="feed-name"><span class="feed-person-name">${name}</span>${status}</strong>`:answer?'<strong class="feed-name">Answer in progress…</strong>':'<span class="feed-name"></span>';
  return `${arrow}<span class="order-number">#${b.order}</span>${namePart}<span class="order-time">${fmt(b.time)}</span>`;
 };
 const prev=hasNew&&previous&&!verdict?`<span class="feed-inner ${doPush?'feed-push-out'+(queueMovesForward?' feed-queue-next':''):fixed?'feed-content-exit':'feed-slide-out'}" aria-hidden="true">${entry(previous,false, state.feedPreviousDecision?.buzz?.order===previous.order?'wrong':'')}</span>`:'';
 const isCorrect=verdict?.type==='correct';
 const outcome=showVerdict?`<span class="feed-decision-value" aria-live="polite">${isCorrect?'✓':'✕'} ${verdict.points>0?'+':''}${verdict.points} ${(Math.abs(verdict.points)===1)?'pt':'pts'}</span>`:'';
 const bg=showVerdict?(isCorrect?('feed-flash-correct'):'feed-flash-incorrect'):state.lastDecision==='correct'&&ended?'feed-final-correct':'';
 const body=showVerdict?`<span class="order-number">#${verdict.buzz.order}</span>${state.buzzOrderNames?`<strong class="feed-name has-answering"><span class="feed-person-name">${safe(who?.name||'Player')}</span><span class="feed-answer-status ${isCorrect?'correct':'incorrect'}">${isCorrect?'answered correctly':'answered incorrectly'}</span></strong>`:'<span class="feed-name"></span>'}${outcome}`:entry(visible,showPointer);
 const entering=hasNew?(doPush?'feed-push-in'+(queueMovesForward?' feed-queue-next':''):fixed?'feed-content-enter':'feed-slide-in'):'';
 if(hasNew||!verdict)state.feedPreviousDecision=null;
 const wrongOffset=(verdict?.type==='incorrect')?` style="--wrong-flash-offset:-${Math.min(720,Math.max(0,gameNow()-verdict.startedAt||0))}ms"`:(verdict?.type==='correct')?` style="--correct-flash-offset:-${Math.min(720,Math.max(0,gameNow()-verdict.startedAt||0))}ms"`:'';
 return `<div class="player-feed-slot"><button class="live-buzz-feed ${canOpen?'can-open':''} ${bg} ${fixed?'has-stationary-arrow':''}"${wrongOffset} type="button" data-action="open-buzz-order" ${canOpen?'':'disabled'} aria-label="${canOpen?'View full buzz order':'Latest buzz'}">${fixed?`<span class="feed-stationary-arrow ${arrowEnter?'feed-arrow-appear':''}" aria-hidden="true"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>`:''}${prev}<span class="feed-inner ${entering}">${body}${canOpen?'<span class="feed-expand" aria-hidden="true"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 19L19 5M9 5h10v10"/></svg></span>':''}</span></button></div>`;
}
function navIcon(tab){const stroke='stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"';const body={play:'<path d="M13 2 4 13h7l-1 9 10-12h-7z"/>',players:'<circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2"/><path d="M17 5a3 3 0 0 1 0 6m1 3a5 5 0 0 1 3 5"/>',questions:'<path d="M12 7a6 6 0 0 0-9-2v14a6 6 0 0 1 9 2V7Zm0 0a6 6 0 0 1 9-2v14a6 6 0 0 0-9 2"/>',more:'<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2.2"/><circle cx="9" cy="17" r="2.2"/>'};return `<svg viewBox="0 0 24 24" ${stroke} aria-hidden="true">${body[tab]||body.more}</svg>`}
function renderNav(){
 const names=['play','players','questions','more'];
 const index=names.indexOf(state.hostTab)<0?3:names.indexOf(state.hostTab);
 const prev=state.navFromTab===undefined?index:(names.indexOf(state.navFromTab)<0?3:names.indexOf(state.navFromTab));
 const changed=prev!==index;
 state.navFromTab=undefined;
 return `<div class="nav ${state.preview?'no-nav':''} ${changed?'nav-changing':''}" style="--nav-index:${index};--nav-prev-index:${prev}">${[['play','Play'],['players','Players'],['questions','Questions'],['more','Settings']].map(([k,l])=>`<button class="${state.hostTab===k?'active':''}" data-nav="${k}">${navIcon(k)}<span>${l}</span></button>`).join('')}</div>`;
}
function playHeaderTools(){
 const q=currentQ();
 const hasContent=!!(q.text||q.image);
 const stats=preloadStats();
 const status=stats.failed?'error':stats.ready===stats.total?'ready':'pending';
 const preload=hasContent?`<div class="header-preload"><button class="preload-head-btn ${status}" type="button" data-action="toggle-preload" aria-label="Preload: ${stats.ready} of ${stats.total} players ready. ${state.preloadExpanded?'Hide':'Show'} details" aria-expanded="${state.preloadExpanded}" aria-controls="preload-header-details"><span class="preload-head-symbol" aria-hidden="true">${status==='ready'?'✓':status==='error'?'!':'◷'}</span><span class="mono">${stats.ready}/${stats.total}</span><span class="preload-word">ready</span><svg class="preload-head-chevron ${state.preloadExpanded?'is-open':''}" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button>${state.preloadExpanded?`<div class="preload-head-popover" id="preload-header-details"><div class="split"><strong class="sm">Automatic preload</strong><span class="pill ${status==='ready'?'green':status==='error'?'red':'orange'}">${stats.ready}/${stats.total} ready</span></div><div class="preload-players ${activePlayers().length>6?'scrollable':''}">${activePlayers().map(p=>{const v=state.preload?.statuses?.[p.id]||'loading';return `<span class="preload-chip ${v}">${v==='ready'?'✓':v==='failed'?'!':'◷'} ${safe(p.name)} · ${v}</span>`}).join('')}</div>${stats.failed?`<p class="sm" style="color:#a33042">${safe(state.preload?.error||'Unable to load content.')}</p>`:''}</div>`:''}</div>`:'';
 const overview=`<button class="btn sm header-leaderboard header-round-overview" type="button" data-action="round-overview" title="Open round overview"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3.5 2.5"/></svg><span>Round overview</span></button>`;
 const leaderboard=`<button class="btn sm header-leaderboard ${state.hostShowResults?'showing':''}" type="button" data-action="show-scores" aria-pressed="${state.hostShowResults}" title="${state.hostShowResults?'Hide':'Show'} leaderboard"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8M12 17v4M7 4H4v4c0 3 3 5 6 5M17 4h3v4c0 3-3 5-6 5"/><path d="M7 3h10v8a5 5 0 0 1-10 0V3Z"/></svg><span>Leaderboard</span></button>`;
 return `<div class="play-headtools">${preload|| ('<span class="header-preload-standby" aria-hidden="true"></span>')}${overview}${leaderboard}</div>`;
}

// V6.2 #55: preserve overlays as DOM nodes across updates. The original
// animation, scrolling, and transforms are not reset by unrelated rendering.
function updateExistingBuzzOrder(existing,fresh){
 const oldList=existing.querySelector('.buzz-order-list');
 const newList=fresh.querySelector('.buzz-order-list');
 if(!oldList||!newList)return;
 const oldRows=[...oldList.querySelectorAll('[data-grade-order]')];
 const newRows=[...newList.querySelectorAll('[data-grade-order]')];
 const identical=oldRows.length===newRows.length&&oldRows.every((r,i)=>r.dataset.gradeOrder===newRows[i].dataset.gradeOrder);
 if(!identical){oldList.innerHTML=newList.innerHTML;return;}
 oldRows.forEach((oldRow,i)=>{
  const next=newRows[i];
  const hadFlash=oldRow.classList.contains('grade-recent-wrong')||oldRow.classList.contains('grade-recent-right');
  const wantsFlash=next.classList.contains('grade-recent-wrong')||next.classList.contains('grade-recent-right');
  if(oldRow.innerHTML!==next.innerHTML)oldRow.innerHTML=next.innerHTML;
  oldRow.className=next.className;
  oldRow.style.cssText=next.style.cssText;
  if(wantsFlash&&!hadFlash){oldRow.style.animation='none';void oldRow.offsetWidth;oldRow.style.removeProperty('animation');}
 });
 const oldArrow=oldList.querySelector('.buzz-travel-arrow'),newArrow=newList.querySelector('.buzz-travel-arrow');
 if(oldArrow&&!newArrow)oldArrow.remove();
 else if(newArrow&&!oldArrow)oldList.appendChild(newArrow);
 oldList.querySelector('.buzz-travel-arrow')?.classList.toggle('arrow-hidden',newArrow?.classList.contains('arrow-hidden')??true);
}
function updateExistingLeaderboard(existing,fresh,id){
 const oldList=existing.querySelector('.standings-list'),newList=fresh.querySelector('.standings-list');
 if(!oldList||!newList)return;
 const signature=state.players.map(p=>p.id+':'+p.score+':'+p.status).join('|');
 if(state.overlayScoreSignature[id]!==signature){oldList.innerHTML=newList.innerHTML;state.overlayScoreSignature[id]=signature;}
}
function preservePlayerPanels(freshMarkup){
 const root=$('#playercontent'),currentId=state.viewAs;
 ;
 // Keep the PHONE and its live overlays mounted. Creating a detached overlay
 // and reinserting it can itself restart CSS transitions or cause a flash.
 const oldWrap=root.querySelector('.phonewrap');
 const oldPhone=oldWrap?.querySelector(':scope > .phone');
 const temp=document.createElement('div');temp.innerHTML=freshMarkup;
 const newWrap=temp.querySelector('.phonewrap'),newPhone=newWrap?.querySelector(':scope > .phone');
 if(!oldPhone||!newPhone||state.overlayDomPlayer!==currentId){
  root.innerHTML=freshMarkup;
  state.overlayDomPlayer=currentId;
  state.overlayScoreSignature[currentId]=state.players.map(p=>p.id+':'+p.score+':'+p.status).join('|');
  return;
 }
 const persistentBuzzer=oldPhone.querySelector(':scope > .coin-buzzer');
 const buzzerHadFocus=persistentBuzzer===document.activeElement;
 const previousJoinSlot=oldPhone.querySelector(':scope > .player-feed-slot');
 const nextJoinSlot=newPhone.querySelector(':scope > .player-feed-slot');
 const persistJoin=previousJoinSlot?.querySelector('.feed-join-notice')&&nextJoinSlot?.querySelector('.feed-join-notice')?previousJoinSlot:null;
 if(persistJoin){
  const oldFeed=persistJoin.querySelector('.feed-join-notice');
  const newFeed=nextJoinSlot.querySelector('.feed-join-notice');
  if(oldFeed.innerHTML!==newFeed.innerHTML)oldFeed.innerHTML=newFeed.innerHTML;
  oldFeed.className=newFeed.className;
  oldFeed.dataset.joinSerial=newFeed.dataset.joinSerial;
  oldFeed.dataset.joinPhase=newFeed.dataset.joinPhase;
 }
 const originalScore=oldPhone.querySelector(':scope > .player-leaderboard-overlay');
 const nextScore=newPhone.querySelector(':scope > .player-leaderboard-overlay');
 const originalBuzz=oldPhone.querySelector(':scope > .buzz-order-overlay');
 const nextBuzz=newPhone.querySelector(':scope > .buzz-order-overlay');
 if(originalScore&&nextScore){
  updateExistingLeaderboard(originalScore,nextScore,currentId);
  originalScore.className=nextScore.className;
  originalScore.querySelector('.shared-list-sheet')?.classList.toggle('lb-exit',!!state.playerLeaderboardClosing[currentId]||(state.shareLeaderboardClosing&&!state.playerLeaderboardOpen[currentId]));
  originalScore.querySelector('.lb-close')?.toggleAttribute('disabled',!!state.playerLeaderboardClosing[currentId]);
 }else if(originalScore&&!nextScore)originalScore.remove();
 if(originalBuzz&&nextBuzz){
  updateExistingBuzzOrder(originalBuzz,nextBuzz);
  originalBuzz.className=nextBuzz.className;
  originalBuzz.querySelector('.shared-list-sheet')?.classList.toggle('lb-exit',!!state.buzzOrderClosingFor[currentId]);
  originalBuzz.querySelector('.lb-close')?.toggleAttribute('disabled',!!state.buzzOrderClosingFor[currentId]);
 }else if(originalBuzz&&!nextBuzz)originalBuzz.remove();
 // Replace ordinary screen content while keeping both panel nodes untouched.
 [...oldPhone.children].forEach(child=>{
  if(!child.classList.contains('player-leaderboard-overlay')&&!child.classList.contains('buzz-order-overlay')&&child!==persistJoin&&child!==persistentBuzzer)child.remove();
 });
 const firstOverlay=oldPhone.querySelector(':scope > .player-leaderboard-overlay, :scope > .buzz-order-overlay');
 [...newPhone.children].forEach(child=>{
  if(child.classList.contains('coin-buzzer')&&persistentBuzzer){
   [...persistentBuzzer.attributes].forEach(a=>persistentBuzzer.removeAttribute(a.name));
   [...child.attributes].forEach(a=>persistentBuzzer.setAttribute(a.name,a.value));
   persistentBuzzer.replaceChildren(...child.childNodes);
   oldPhone.insertBefore(persistentBuzzer,firstOverlay);
  }else if(child.classList.contains('player-leaderboard-overlay')){
   if(!originalScore)oldPhone.appendChild(child);
  }else if(child.classList.contains('buzz-order-overlay')){
   if(!originalBuzz)oldPhone.appendChild(child);
  }else if(child.classList.contains('player-feed-slot')&&persistJoin){oldPhone.insertBefore(persistJoin,firstOverlay)}
  else oldPhone.insertBefore(child,firstOverlay);
 });
 oldPhone.className=newPhone.className;
 if(buzzerHadFocus&&persistentBuzzer?.isConnected)persistentBuzzer.focus({preventScroll:true});
 // Preview controls live OUTSIDE the phone and may change with the player.
 const oldControls=oldWrap.querySelector(':scope > .split');
 const newControls=newWrap.querySelector(':scope > .split');
 if(oldControls&&newControls)oldControls.replaceWith(newControls);
 state.overlayDomPlayer=currentId;
}


/* #137: only the quick-setting controls and their editor need changing when
   one of the five choices is clicked. Rebuilding #host-view-content destroys
   the active/focused button and causes the noticeable one-frame flash. Build
   the next layout offscreen, then patch these stable live DOM nodes in place.
   Fall back to the complete renderer whenever the expected Play DOM is absent. */
function patchHostQuickControls(refreshPlayer=false){
 if(state.hostTab!=='play'||state.preview)return false;
 const quickOptionCount=5;
 const page=document.querySelector('#host-view-content');
 const liveRow=page?.querySelector('.direct-options');
 const shell=page?.querySelector('#fact-editor-shell');
 const clip=shell?.querySelector('.fact-editor-clip');
 if(!liveRow||liveRow.querySelectorAll('.fact-button').length!==quickOptionCount||!clip)return false;
 const draft=document.createElement('div');
 draft.innerHTML=renderPlay();
 const draftRow=draft.querySelector('.direct-options');
 const draftShell=draft.querySelector('#fact-editor-shell');
 const nextClip=draftShell?.querySelector('.fact-editor-clip');
 if(!draftRow||draftRow.querySelectorAll('.fact-button').length!==quickOptionCount||!nextClip)return false;
 const incoming=draftRow.querySelectorAll('.fact-button');
 liveRow.querySelectorAll('.fact-button').forEach((button,i)=>{
  const next=incoming[i];
  button.className=next.className;
  button.disabled=next.disabled;
  for(const name of ['aria-label','aria-expanded','title']){
   if(next.hasAttribute(name))button.setAttribute(name,next.getAttribute(name));
   else button.removeAttribute(name);
  }
  // #269: keep the existing button and wrappers, updating icon and text together.
  for(const selector of ['.fact-icon','.fact-main']){
   const livePart=button.querySelector(selector),nextPart=next.querySelector(selector);
   if(livePart&&nextPart&&livePart.innerHTML!==nextPart.innerHTML)livePart.innerHTML=nextPart.innerHTML;
  }
 });
 if(draftShell.classList.contains('is-open')){
  const oldEditor=clip.querySelector('#fact-editor');
  const nextEditor=nextClip.querySelector('#fact-editor');
  const switchingPanel=shell.classList.contains('is-open')&&!!oldEditor&&!!nextEditor&&oldEditor.querySelector('.split strong')?.textContent!==nextEditor.querySelector('.split strong')?.textContent;
  const oldHeight=switchingPanel?clip.getBoundingClientRect().height:0;
  if(!oldEditor||!nextEditor||oldEditor.outerHTML!==nextEditor.outerHTML)window.BuzzyNetwork.patchHostPage(clip,nextClip.innerHTML);
  if(switchingPanel&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
   const newHeight=clip.scrollHeight;
   clip.getAnimations().forEach(a=>a.cancel());
   clip.animate([{height:oldHeight+'px'},{height:newHeight+'px'}],
                {duration:260,easing:'cubic-bezier(.22,.8,.2,1)'});
  }
  if(!shell.classList.contains('is-open')){
   requestAnimationFrame(()=>{if(shell.isConnected)shell.classList.add('is-open')});
  }
 }else if(shell.classList.contains('is-open')){
  shell.classList.remove('is-open');
  const token=Symbol();shell._collapseToken=token;
  setTimeout(()=>{if(shell.isConnected&&!shell.classList.contains('is-open')&&shell._collapseToken===token)clip.innerHTML='';},280);
 }
 if(refreshPlayer){
  const previousScroll=document.querySelector('#playercontent .buzz-order-list')?.scrollTop||0;
  preservePlayerPanels(renderPlayer());
  requestAnimationFrame(syncBuzzyChevrons);
  const list=document.querySelector('#playercontent .buzz-order-list');
  if(list)list.scrollTop=previousScroll;
  updateClocks();
 }
 return true;
}
function annotatePrototypeControls(){
 ;
 document.querySelectorAll('[data-action]').forEach(el=>{if(prototypeAction(el.dataset.action||'')){el.classList.add('prototype-only');el.dataset.prototypeControl='true';}});
}

// v7.22 #222–223: keyed FLIP for rows and measured resizing for their containing cards.
let dynamicGeometryFrame=null,dynamicGeometryBefore=null;
function captureDynamicGeometry(){
 if(reducedMotion||state.preview)return null;
 const root=document.getElementById('host-view-content');
 // #256: whole-view navigation owns motion; only capture changes within the mounted tab.
 if(!root||root.dataset.hostTab!==state.hostTab||root.classList.contains('host-push-running'))return null;
 const positions=new Map();
 const selectors=[];
 if((state.hostTab==='players'))selectors.push('[data-player-row]');
 if((state.hostTab==='questions'))selectors.push('[data-animated-question]');
 if((state.hostTab==='play'))selectors.push('[data-animated-overview]');
 for(const sel of selectors)root.querySelectorAll(sel).forEach(el=>{const key=el.getAttribute('data-player-row')||el.getAttribute('data-animated-question')||el.getAttribute('data-animated-overview');positions.set(key,{rect:el.getBoundingClientRect(),snapshot:el.cloneNode(true)});});
 const cards=new Map();if(state.hostTab==='players')root.querySelectorAll('.dynamic-player-card').forEach((el,i)=>cards.set(i,el.getBoundingClientRect().height));
 if(state.hostTab==='questions')root.querySelectorAll('.questions-section-card').forEach((el,i)=>cards.set(i,el.getBoundingClientRect().height));
 return {positions,cards,tab:state.hostTab};
}
function animateDynamicGeometry(previous){
 if(!previous||previous.tab!==state.hostTab)return;
 const root=document.getElementById('host-view-content');
 if(!root||root.dataset.hostTab!==previous.tab||root.classList.contains('host-push-running'))return;
 const selectors=state.hostTab==='players'?'[data-player-row]':state.hostTab==='questions'?'[data-animated-question]':'[data-animated-overview]';
 root.querySelectorAll(selectors).forEach(el=>{
  const key=el.getAttribute('data-player-row')||el.getAttribute('data-animated-question')||el.getAttribute('data-animated-overview');
  const saved=previous.positions.get(key),from=saved?.rect,to=el.getBoundingClientRect();
  if(!from){el.animate([{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],{duration:240,easing:'ease-out'});return;}
  const dy=from.top-to.top,dx=from.left-to.left;
  if(Math.abs(dy)>1||Math.abs(dx)>1)el.animate([{transform:`translate(${dx}px,${dy}px)`},{transform:'translate(0,0)'}],{duration:270,easing:'cubic-bezier(.22,.8,.2,1)'});
 });
 // Animate removals without keeping removed buttons interactive.
 const seen=new Set([...root.querySelectorAll(selectors)].map(el=>el.getAttribute('data-player-row')||el.getAttribute('data-animated-question')||el.getAttribute('data-animated-overview')));
 for(const [key,saved] of previous.positions){
  if(seen.has(key))continue;
  const ghost=saved.snapshot,box=saved.rect;
  ghost.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));
  ghost.removeAttribute('id');ghost.setAttribute('aria-hidden','true');ghost.inert=true;
  Object.assign(ghost.style,{position:'fixed',left:box.left+'px',top:box.top+'px',width:box.width+'px',height:box.height+'px',margin:'0',zIndex:'40',pointerEvents:'none'});
  document.body.appendChild(ghost);
  const anim=ghost.animate([{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(-9px)'}],{duration:180,easing:'ease-in',fill:'forwards'});
  anim.finished.catch(()=>{}).then(()=>ghost.remove());
 }
 const containers=state.hostTab==='players'?'.dynamic-player-card':'.questions-section-card';
 root.querySelectorAll(containers).forEach((el,i)=>{
  const old=previous.cards.get(i),next=el.getBoundingClientRect().height;
  if(old&&Math.abs(old-next)>1)el.animate([{height:old+'px',overflow:'hidden'},{height:next+'px',overflow:'hidden'}],{duration:270,easing:'cubic-bezier(.22,.8,.2,1)'});
 });
}

function render(){
 if(window.BUZZY_RUNTIME&&!state.networkReady){captureDialogFocus();syncModal();reconcileDialogFocus();return;}
 queueMicrotask(()=>window.BuzzyNetwork?.afterRender?.());
 captureDialogFocus();
  {document.title='Buzzy Design Lab – Midnight Studio v7.52';const badge=document.querySelector('.headbar .tag.desktoponly');if(badge)badge.textContent='DESIGN LAB · A v7.52';}
  const dynamicBefore=dynamicGeometryBefore?.tab===state.hostTab&&!state.preview&&!reducedMotion?dynamicGeometryBefore:captureDynamicGeometry();
  if(dynamicGeometryFrame!==null){cancelAnimationFrame(dynamicGeometryFrame);dynamicGeometryFrame=null;}
  dynamicGeometryBefore=null;
 document.body.classList.toggle('prototype-production',!state.devUi);
 requestAnimationFrame(annotatePrototypeControls);
 stopHostPushForRender();
 if(state.activeRound?.archived){const r=state.activeRound;r.scoresAfter=Object.fromEntries(state.players.map(p=>[p.id,p.score]));if(!r.endedAt&&state.lastDecision==='correct')r.status='Answer graded · Awaiting next question';}
 {
   const selectedTurn=state.phase!=='open'?getActiveGradeBuzz():null;
   const focusKey=selectedTurn?`${state.countQuestion}:${state.attemptNumber}:${selectedTurn.order}`:null;
   if(focusKey&&focusKey!==state.focusTurnKey){
     const id=selectedTurn.id;
     state.buzzOrderOpenFor[id]=false;state.buzzOrderClosingFor[id]=false;state.buzzOrderShownFor[id]=false;
     state.buzzOrderCloseSerialFor[id]=(state.buzzOrderCloseSerialFor[id]||0)+1;
     state.playerLeaderboardOpen[id]=false;state.playerLeaderboardClosing[id]=false;
     state.lbPlayerSerial[id]=(state.lbPlayerSerial[id]||0)+1;
     state.leaderboardDismissed[id]=true;
   }
   state.focusTurnKey=focusKey;
 }
 if($('#header-code'))$('#header-code').textContent='ROOM '+state.code;
 $('#previewtoggle').textContent=state.preview?'← Host view':'Player view →';
 document.body.classList.toggle('lab-score-tools-on',state.labScoreTools);
 document.body.classList.toggle('lab-leaderboard-active',state.hostShowResults||playerLeaderboardVisible(me()||state.players[0]));
 document.body.classList.toggle('lab-host-view',!state.preview);
 document.querySelectorAll('.lab-view-switch button').forEach(b=>b.classList.toggle('is-active',b.dataset.action===(state.preview?'lab-player-view':'lab-host-view')));
 $('#maincol').classList.toggle('player-on',state.preview);$('#sidecol').classList.toggle('player-on',state.preview);
 const pageTitle={play:'Play',players:'Players',questions:'Questions',more:'Settings',overview:'Round overview'}[state.hostTab];
 const otherStatus=state.hostTab==='play'?playHeaderTools():'';
 const hostRoot=$('#hostcontent');
 if(!hostRoot.querySelector('.nav'))hostRoot.innerHTML=`${renderNav()}<div id="host-view-content"></div>`;
 const nav=hostRoot.querySelector('.nav');
 const pageIndex=['play','players','questions','more'].indexOf((state.hostTab==='overview')?'play':state.hostTab);
 nav.style.setProperty('--nav-index',Math.max(0,pageIndex));
 nav.classList.toggle('no-nav',state.preview);
 nav.querySelectorAll('[data-nav]').forEach(btn=>btn.classList.toggle('active',btn.dataset.nav===((state.hostTab==='overview')?'play':state.hostTab)));
 const moreNavButton=nav.querySelector('[data-nav="more"]');if(moreNavButton)moreNavButton.innerHTML=navIcon('more')+`<span>Settings</span>`;
 const hostPage=hostRoot.querySelector('#host-view-content');
 
 // #65: Keep the actual host clock node across renders, not just its text.
 // Rebuilding the Play panel on a buzz must not reset its visual lifecycle.
 const stableModeSwitch=state.hostTab==='play'&&hostPage.dataset.hostTab==='play'?hostPage.querySelector('.quickplay-card > .play-mode-switch'):null;
 const oldSelectedMode=stableModeSwitch?.querySelector('.play-mode-option.active')?.dataset.action?.endsWith('prepared')?'prepared':'quick';
 const animatePanelHeight=state.playModeTransition&&true&&true&&state.hostTab==='play'&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const animateQuickPanel=(!!state.quickContentTransition&&state.hostTab==='play')&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const previousPanel=(animatePanelHeight||animateQuickPanel)?hostPage.querySelector('.play-mode-content'):null;
 const previousPanelHeight=previousPanel?.getBoundingClientRect().height||0;
 const oldModeContent=animatePanelHeight?previousPanel?.cloneNode(true):null;const previousQuickContent=animateQuickPanel?previousPanel?.querySelector('.quick-content-panel'):null;
 if(stableModeSwitch)stableModeSwitch.remove();
 const stableHostClock=(state.hostTab==='play')?hostPage.querySelector('[data-clock]'):null;
 if(stableHostClock)stableHostClock.remove();
 window.BuzzyNetwork.patchHostPage(hostPage,`<div class="appbar ${state.hostTab==='play'?'appbar-play':''}"><h1>${pageTitle}</h1>${otherStatus}</div>${{play:renderPlay,players:renderPlayers,questions:renderQuestions,more:renderMore,overview:renderRoundOverview}[state.hostTab]()}${hostLeaderboardOverlay()}${hostRoundOverviewOverlay()}`);
 hostPage.dataset.hostTab=state.hostTab;
 if(stableHostClock){const replacement=hostPage.querySelector('[data-clock]');if(replacement)replacement.replaceWith(stableHostClock);}
 if(stableModeSwitch){
  const fresh=hostPage.querySelector('.quickplay-card > .play-mode-switch');
  if(fresh){
   fresh.replaceWith(stableModeSwitch);
   const oldButtons=stableModeSwitch.querySelectorAll('.play-mode-option');
   const newButtons=fresh.querySelectorAll('.play-mode-option');
   oldButtons.forEach((button,i)=>{
    const incoming=newButtons[i];if(!incoming)return;
    button.className=incoming.className;button.disabled=incoming.disabled;
    if(i===0&&button.querySelector('.mode-chevron-slot')&&incoming.querySelector('.mode-chevron-slot')){
      const oldGroup=button.querySelector('.mode-content-group');
      const oldChevron=oldGroup.querySelector('.mode-chevron-slot');
      const nextGroup=incoming.querySelector('.mode-content-group');
      const oldCopy=oldGroup.querySelector('.mode-copy'),nextCopy=nextGroup.querySelector('.mode-copy');
      if(oldCopy&&nextCopy&&oldCopy.innerHTML!==nextCopy.innerHTML)oldCopy.innerHTML=nextCopy.innerHTML;
      const oldIcon=oldGroup.querySelector('.source-mode-icon'),nextIcon=nextGroup.querySelector('.source-mode-icon');
      if(oldIcon&&!nextIcon)oldIcon.remove();
      if(nextIcon&&!oldIcon)oldGroup.insertBefore(nextIcon.cloneNode(true),oldCopy);
      const wasVisible=oldChevron.classList.contains('is-visible');
      oldChevron.classList.toggle('is-visible',state.quickQuestion);
      oldChevron.querySelector('.mode-toggle-chevron')?.classList.toggle('is-open',state.showQuickContent);
      if(wasVisible!==!!state.quickQuestion&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
        oldChevron.getAnimations().forEach(a=>a.cancel());
        const from=wasVisible?21:0,to=state.quickQuestion?21:0;
        oldChevron.animate([{width:from+'px',maxWidth:from+'px',opacity:wasVisible?1:0,marginLeft:wasVisible?'0px':'-5px'},
                           {width:to+'px',maxWidth:to+'px',opacity:state.quickQuestion?1:0,marginLeft:state.quickQuestion?'0px':'-5px'}],
                           {duration:220,easing:'cubic-bezier(.22,.8,.2,1)'});
      }
    }else button.innerHTML=incoming.innerHTML;
    for(const name of ['aria-pressed','aria-expanded','aria-controls']){
     if(incoming.hasAttribute(name))button.setAttribute(name,incoming.getAttribute(name));
     else button.removeAttribute(name);
    }
   });
   // Explicit WAAPI on the pseudo-element: a CSS transition would be skipped
   // when the existing switch was temporarily detached for the host rerender.
   const nextMode=state.quickQuestion?'quick':'prepared';
   if(oldSelectedMode!==nextMode&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    const btn=stableModeSwitch.querySelector('.play-mode-option');
    const shift=btn.getBoundingClientRect().width+6;
    const from=oldSelectedMode==='quick'?0:shift;
    const to=nextMode==='quick'?0:shift;
    stableModeSwitch.getAnimations({subtree:false}).forEach(a=>a.cancel());
    try{stableModeSwitch.animate([{transform:`translateX(${from}px)`},{transform:`translateX(${to}px)`}],{duration:280,easing:'cubic-bezier(.22,.8,.2,1)',pseudoElement:'::before'});}catch(e){/* CSS fallback remains correct */}
   }
  }
 }
 if(oldModeContent){
   const incoming=hostPage.querySelector('.play-mode-content');
   const card=incoming?.closest('.quickplay-card');
   if(card){
    const r=incoming.getBoundingClientRect(),cr=card.getBoundingClientRect();
    oldModeContent.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));
    oldModeContent.setAttribute('aria-hidden','true');oldModeContent.inert=true;
    oldModeContent.className='play-mode-content mode-exit-snapshot';

    Object.assign(oldModeContent.style,{top:(r.top-cr.top)+'px',left:(r.left-cr.left)+'px',width:r.width+'px'});
    card.appendChild(oldModeContent);

      oldModeContent.animate([{opacity:1},{opacity:0}],{duration:175,easing:'ease-out',fill:'forwards'});
      window.setTimeout(()=>oldModeContent.remove(),290);
      const targetHeight=incoming.getBoundingClientRect().height;
      // WAAPI height transitions animate real document flow, unlike the old
      // translateX that moved text without changing the question card height.
      if(previousPanelHeight>0&&targetHeight>0){
        incoming.style.overflow='hidden';
        const resize=incoming.animate([{height:previousPanelHeight+'px',opacity:0},{height:targetHeight+'px',opacity:1}],{duration:280,easing:'cubic-bezier(.22,.8,.2,1)'});
        const release=()=>{if(incoming.isConnected)incoming.style.overflow='';};
        resize.addEventListener('finish',release,{once:true});
        resize.addEventListener('cancel',release,{once:true});
      }

   }
 }
 if(animateQuickPanel){const incoming=hostPage.querySelector('.play-mode-content');if(incoming&&previousPanelHeight>0){
  incoming.getAnimations().forEach(a=>a.cancel());const targetHeight=incoming.getBoundingClientRect().height;
  if(!state.showQuickContent&&previousQuickContent){
   const closing=previousQuickContent.cloneNode(true);closing.removeAttribute('id');closing.dataset.uiClosing='true';closing.inert=true;closing.style.overflow='hidden';closing.setAttribute('aria-hidden','true');closing.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));incoming.prepend(closing);
   const collapse=closing.animate([{height:closing.getBoundingClientRect().height+'px',marginBottom:'5px'},{height:'0px',marginBottom:'0px',paddingBlock:'0px',borderWidth:'0px'}],{duration:260,easing:'cubic-bezier(.22,.8,.2,1)',fill:'forwards'});
   collapse.finished.catch(()=>{}).then(()=>closing.remove());
  }
  incoming.style.overflow='hidden';
  const anim=incoming.animate([{height:previousPanelHeight+'px'},{height:targetHeight+'px'}],{duration:260,easing:'cubic-bezier(.22,.8,.2,1)'});
  const release=()=>{if(incoming.isConnected)incoming.style.overflow='';};anim.addEventListener('finish',release,{once:true});anim.addEventListener('cancel',release,{once:true});
 }}state.quickContentTransition=false;
 if(state.playModeTransition)state.playModeTransition=null;
 ;
 const prevBuzzScroll=$('#playercontent .buzz-order-list')?.scrollTop||0;
 preservePlayerPanels(renderPlayer());
 const buzzList=$('#playercontent .buzz-order-list');
 if(buzzList){
   buzzList.scrollTop=prevBuzzScroll;
   const focused=buzzList.querySelector('.buzz-order-full-row.grade-current');
   if(focused){
     const offset=focused.offsetTop-buzzList.offsetTop;
     if(offset<buzzList.scrollTop||offset+focused.offsetHeight>buzzList.scrollTop+buzzList.clientHeight){
       buzzList.scrollTo({top:Math.max(0,offset-buzzList.clientHeight/2+focused.offsetHeight/2),behavior:'smooth'});
     }
   }
 }
 
 const modalMounted=syncModal();reconcileDialogFocus();requestAnimationFrame(syncResponsivePlayTools);if(dynamicBefore){dynamicGeometryBefore=dynamicBefore;dynamicGeometryFrame=requestAnimationFrame(()=>{dynamicGeometryFrame=null;dynamicGeometryBefore=null;animateDynamicGeometry(dynamicBefore)})};updateClocks();requestAnimationFrame(syncBuzzyChevrons);if(state.quickQuestion&&state.showQuickContent)updateQuickImagePreview();if(state.modal==='question'&&modalMounted)updatePreparedImagePreview();
}


// #270: use the real label/icon width and reserve the visible chevron's lane.
// Quick text has balanced icon lanes; Prepared centers its icon/text group (#255).
const sourceLabelMeasure=document.createElement('canvas').getContext('2d');
let sourceLabelObserver=null,sourceLabelObserved=[],sourceLabelFrame=null;
function scheduleSourceLabels(){
 if(sourceLabelFrame!==null)return;
 sourceLabelFrame=requestAnimationFrame(()=>{sourceLabelFrame=null;syncSourceLabels()});
}
function syncSourceLabels(){
 const buttons=Array.from(document.querySelectorAll('#host-view-content .play-mode-option'));
 if(buttons.length!==sourceLabelObserved.length||buttons.some((b,i)=>b!==sourceLabelObserved[i])){
  if(!sourceLabelObserver&&typeof ResizeObserver!=='undefined')sourceLabelObserver=new ResizeObserver(scheduleSourceLabels);
  sourceLabelObserver?.disconnect();
  sourceLabelObserved=buttons;
  buttons.forEach(b=>sourceLabelObserver?.observe(b));
 }
 for(const button of buttons){
  const copy=button.querySelector('.mode-copy'),group=button.querySelector('.mode-content-group');
  const icon=group?.querySelector('.source-mode-icon,.prepared-mode-icon');
  if(!copy||!group||!icon||!sourceLabelMeasure)continue;
  const box=button.getBoundingClientRect(),style=getComputedStyle(button),textStyle=getComputedStyle(copy);
  if(!box.width)continue;
  sourceLabelMeasure.font=`${textStyle.fontStyle} ${textStyle.fontWeight} 14px ${textStyle.fontFamily}`;
  const text=copy.textContent.trim().replace(/\s+/g,' ');
  const textWidth=sourceLabelMeasure.measureText(text).width;
  const gap=parseFloat(getComputedStyle(group).columnGap)||0;
  const iconLane=icon.getBoundingClientRect().width+gap;
  const balancedText=button.matches(':first-child');
  const required=textWidth+(balancedText?2:1)*iconLane;
  // Match the actual symmetric lanes; keep the text clear of the separate chevron.
  const inset=Math.max(parseFloat(style.paddingLeft)+parseFloat(style.borderLeftWidth),parseFloat(style.paddingRight)+parseFloat(style.borderRightWidth));
  let available=box.width-2*inset;
  const chevron=button.querySelector('.mode-chevron-slot.is-visible svg');
  if(chevron){const arrow=chevron.getBoundingClientRect();available=Math.min(available,2*(arrow.left-(box.left+box.width/2)-4)+(balancedText?2*iconLane:0));}
  const wrap=required<=available?'one':'two';
  if(button.dataset.sourceWrap!==wrap)button.dataset.sourceWrap=wrap;
 }
}
document.fonts?.ready.then(scheduleSourceLabels);
function syncResponsivePlayTools(){
 syncSourceLabels();
 ;
 const bar=document.querySelector('#host-view-content .appbar-play');
 if(!bar)return;
 const heading=bar.querySelector('h1'),tools=bar.querySelector('.play-headtools'),ready=bar.querySelector('.header-preload');
 if(!heading||!tools){delete bar.dataset.compactTools;return;}
 if(!ready){delete bar.dataset.compactTools;return;}
 const textRange=document.createRange();textRange.selectNodeContents(heading);
 const titleWidth=textRange.getBoundingClientRect().width;
 const actions=[ready,tools.querySelector('.header-round-overview'),tools.querySelector('.header-leaderboard:not(.header-round-overview)')].filter(Boolean);
 const controlsWidth=actions.reduce((acc,el)=>acc+el.getBoundingClientRect().width,0)+Math.max(0,actions.length-1)*8;
 const isCompact=titleWidth+controlsWidth+12>bar.clientWidth-2;
 if(isCompact)bar.dataset.compactTools='true';else delete bar.dataset.compactTools;
}
window.addEventListener('resize',()=>requestAnimationFrame(syncResponsivePlayTools));
// #272: retain the mounted form instead of rebuilding drafts during game updates.
let mountedModalKey='';
function modalIdentity(){
 if(!state.modal)return '';
 const subject=state.modal==='question'?(state.editing===null?'new':state.questions[state.editing]?.id):state.modal==='quick-edit'?state.quickQuestion?.id:'';
 return state.modal+':'+(subject||'');
}
function syncModal(){
 const root=document.getElementById('modalroot'),key=modalIdentity();
 if(key!==mountedModalKey||key&&!root.firstElementChild){
  root.innerHTML=renderModal();mountedModalKey=key;return !!key;
 }
 if(!key)return false;
 if(state.modal==='ai-questions'){const template=document.createElement('template');template.innerHTML=renderModal();const current=root.querySelector('.ai-panel'),fresh=template.content.querySelector('.ai-panel');if(current&&fresh&&window.BuzzyNetwork?.patchHostPage){if(current.dataset.aiPhase!==fresh.dataset.aiPhase){if(window.BuzzyAiMotion)window.BuzzyAiMotion.swap(current,fresh);else current.replaceWith(fresh);}else window.BuzzyNetwork.patchHostPage(current,fresh.innerHTML);}return true;}
 if(state.modal==='viewer'){const template=document.createElement('template');template.innerHTML=renderModal();const current=root.querySelector('.viewer-settings'),fresh=template.content.querySelector('.viewer-settings');if(current&&fresh&&window.BuzzyNetwork?.patchHostPage)window.BuzzyNetwork.patchHostPage(current,fresh.innerHTML);return true;}
 // Live read-only context may change; form controls, previews and scroll remain mounted.
 if(state.modal.startsWith('manage:')||state.modal.startsWith('adjust:')||state.modal==='history'){
  const template=document.createElement('template');template.innerHTML=renderModal();
  const current=root.querySelector('.modal'),fresh=template.content.querySelector('.modal');
  const heading=current?.querySelector('.studio-modal-head h2'),nextHeading=fresh?.querySelector('.studio-modal-head h2');
  if(heading&&nextHeading&&heading.textContent!==nextHeading.textContent)heading.textContent=nextHeading.textContent;
  if(current&&fresh){
   const texts=[...current.children].filter(e=>e.tagName==='P'),nextTexts=[...fresh.children].filter(e=>e.tagName==='P');
   texts.forEach((e,i)=>{if(nextTexts[i]&&e.textContent!==nextTexts[i].textContent)e.textContent=nextTexts[i].textContent;});
   if(state.modal==='history'){
    const list=current.querySelector(':scope>.gap12'),next=fresh.querySelector(':scope>.gap12');
    if(list&&next&&list.innerHTML!==next.innerHTML){const top=list.scrollTop;list.innerHTML=next.innerHTML;list.scrollTop=top;}
   }
  }
 }
 return false;
}
// #274: one focus lifecycle for forms and the visible shared panels.
let activeDialogKey='',activeDialogNode=null;
let modalReturnFocus=null,modalReturnAction=null;
const dialogBookmarks=new Map();
function dialogContext(){
 const form=document.querySelector('#modalroot .modal[role="dialog"]');
 if(form)return {key:'modal:'+mountedModalKey,node:form,close:'close-modal'};
 const selectors=state.preview?
  [['#playercontent .buzz-order-overlay [role="dialog"]','buzz:'+state.viewAs,'close-buzz-order'],['#playercontent .player-leaderboard-overlay [role="dialog"]','leaderboard:'+state.viewAs,'dismiss-leaderboard']]:
  [['#host-view-content .round-overview-sheet','overview','close-round-overview'],['#host-view-content .host-leaderboard-overlay [role="dialog"]','leaderboard:host','show-scores']];
 for(const [selector,key,close] of selectors){const node=document.querySelector(selector);if(node&&node.getClientRects().length)return {key,node,close};}
 return null;
}
function dialogFocusables(dialog){
 return [...dialog.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),summary,[tabindex]:not([tabindex="-1"])')].filter(el=>!el.closest('[inert]')&&el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden');
}
function focusBookmark(dialog,el){
 if(el.id)return {id:el.id};
 if(el.dataset.action)return {action:el.dataset.action};
 if(el.hasAttribute('data-share-leaderboard'))return {selector:'[data-share-leaderboard]'};
 return {index:dialogFocusables(dialog).indexOf(el)};
}
function bookmarkTarget(dialog,bookmark){
 if(!bookmark)return null;
 if(bookmark.id)return dialog.querySelector('#'+CSS.escape(bookmark.id));
 if(bookmark.action)return dialog.querySelector('[data-action="'+CSS.escape(bookmark.action)+'"]');
 if(bookmark.selector)return dialog.querySelector(bookmark.selector);
 return dialogFocusables(dialog)[bookmark.index]||null;
}
function captureDialogFocus(){
 const dialog=activeDialogNode;
 if(activeDialogKey&&dialog){
  const old=dialogBookmarks.get(activeDialogKey)||{};
  if(dialog.contains(document.activeElement))old.focus=focusBookmark(dialog,document.activeElement);
  old.scroll=[dialog,...dialog.querySelectorAll('.shared-list-scroll,.round-overview-scroll')].map(el=>el.scrollTop);
  old.details=new Map([...dialog.querySelectorAll('.overview-entry')].map((el,i)=>[el.dataset.overviewKey||String(i),el.open]));
  dialogBookmarks.set(activeDialogKey,old);
 }else{
  const candidate=document.activeElement;
  if(candidate&&candidate!==document.body&&!candidate.closest('#modalroot')){modalReturnFocus=candidate;modalReturnAction=candidate.dataset.action||null;}
 }
}
function reconcileDialogFocus(){
 const context=dialogContext(),previous=activeDialogKey;
 if(!context){
  activeDialogKey='';activeDialogNode=null;
  if(previous){const target=modalReturnFocus,action=modalReturnAction;modalReturnFocus=null;modalReturnAction=null;dialogBookmarks.clear();
   requestAnimationFrame(()=>{if(dialogContext())return;const actual=target?.isConnected?target:action?document.querySelector('[data-action="'+CSS.escape(action)+'"]'):null;actual?.focus({preventScroll:true});});
  }
  return;
 }
 const {key,node}=context,bookmark=dialogBookmarks.get(key);
 activeDialogKey=key;activeDialogNode=node;
 if(bookmark){
  node.querySelectorAll('.overview-entry').forEach((el,i)=>{const open=bookmark.details?.get(el.dataset.overviewKey||String(i));if(open!==undefined)el.open=open;});
  [node,...node.querySelectorAll('.shared-list-scroll,.round-overview-scroll')].forEach((el,i)=>{if(bookmark.scroll?.[i]!==undefined)el.scrollTop=bookmark.scroll[i];});
 }
 if(!node.contains(document.activeElement)){
  const focus=bookmarkTarget(node,bookmark?.focus)||dialogFocusables(node)[0]||node;
  if(focus===node)node.setAttribute('tabindex','-1');
  requestAnimationFrame(()=>{const current=dialogContext();if(current?.key===key&&current.node===node&&!node.contains(document.activeElement))focus.focus({preventScroll:true});});
 }
}
document.addEventListener('keydown',event=>{
 const context=dialogContext();if(!context)return;
 if(event.key==='Escape'){
  event.preventDefault();event.stopImmediatePropagation();
  if(!context.node.closest('.is-closing,.lb-backdrop-exit'))handle(context.close);
  return;
 }
 if(event.key!=='Tab')return;
 const dialog=context.node,nodes=dialogFocusables(dialog);
 if(!nodes.length){event.preventDefault();dialog.setAttribute('tabindex','-1');dialog.focus();return;}
 const first=nodes[0],last=nodes[nodes.length-1],active=document.activeElement;
 if(event.shiftKey&&(active===first||!dialog.contains(active))){event.preventDefault();last.focus();}
 else if(!event.shiftKey&&(active===last||!dialog.contains(active))){event.preventDefault();first.focus();}
},true);

function navigateHostTab(next){
 const order=['play','players','questions','more'];
 stopHostPushForRender();
 const old=state.hostTab,from=order.indexOf(old),to=order.indexOf(next);
 if(old===next)return;
 const el=document.getElementById('host-view-content');
 const oldClone=el?.cloneNode(true);
 const oldHeight=el?.getBoundingClientRect().height||0;
 state.hostTab=next;render();
 window.scrollTo({top:0,behavior:'instant'});
 if(state.preview||from<0||to<0||window.matchMedia('(prefers-reduced-motion: reduce)').matches||!el||!oldClone)return;
 const newHeight=el.getBoundingClientRect().height;
 const serial=++state.pushTransitionSerial;
 el.getAnimations({subtree:true}).forEach(anim=>{if(anim.playState==='running')anim.cancel()});
 const incoming=document.createElement('div');incoming.className='host-push-incoming';
 while(el.firstChild)incoming.appendChild(el.firstChild);
 const snapshot=document.createElement('div');snapshot.className='host-push-outgoing';snapshot.setAttribute('aria-hidden','true');snapshot.inert=true;snapshot.innerHTML=oldClone.innerHTML;
 snapshot.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));
 snapshot.querySelectorAll('[data-action],[data-nav]').forEach(n=>{n.removeAttribute('data-action');n.removeAttribute('data-nav')});
 snapshot.querySelectorAll('.host-leaderboard-overlay,.round-overview-overlay').forEach(n=>n.remove());
 el.append(snapshot,incoming);el.classList.add('host-push-running');el.style.height=Math.max(oldHeight,newHeight)+'px';
 const sign=to>from?1:-1;
 const opt={duration:280,easing:'cubic-bezier(.22,.8,.2,1)'};
 snapshot.animate([{transform:'translateX(0)'},{transform:`translateX(${-sign*window.innerWidth}px)`}],opt);
 const animateIncoming=incoming.animate([{transform:`translateX(${sign*window.innerWidth}px)`},{transform:'translateX(0)'}],opt);
 el.animate([{height:oldHeight+'px'},{height:newHeight+'px'}],opt);
 const cleanup=()=>{if(serial!==state.pushTransitionSerial||!incoming.isConnected)return;while(incoming.firstChild)el.appendChild(incoming.firstChild);snapshot.remove();incoming.remove();el.classList.remove('host-push-running');el.style.height='';};
 animateIncoming.addEventListener('finish',cleanup,{once:true});
 animateIncoming.addEventListener('cancel',cleanup,{once:true});
}
function stopHostPushForRender(){
 const el=document.querySelector('#host-view-content');if(!el?.classList.contains('host-push-running'))return;
 state.pushTransitionSerial++;
 const incoming=el.querySelector(':scope > .host-push-incoming');
 if(incoming){while(incoming.firstChild)el.appendChild(incoming.firstChild);incoming.remove();}
 el.querySelector(':scope > .host-push-outgoing')?.remove();el.classList.remove('host-push-running');el.style.height='';
}

// v7.19 #198: one rotation owner, keyed by disclosure identity rather than a stale SVG.
const buzzyChevronTurns=new Map();
function buzzyChevronStatus(el){
 const details=el.closest('details');
 if(el.classList.contains('setting-chevron'))return !details?.classList.contains('is-collapsed');
 if(el.closest('.qinfo-toggle'))return !!el.closest('.phone.qinfo-expanded');
 if(el.classList.contains('mode-toggle-chevron'))return el.classList.contains('is-open');
 if(el.classList.contains('preload-head-chevron')||el.classList.contains('preload-details-chevron'))return el.classList.contains('is-open');
 if(el.closest('.quick-behavior-options'))return !!state.quickBehaviorOptionsOpen;
 if(details)return details.open;
 return el.classList.contains('is-open');
}
function buzzyChevronId(el){
 if(el.closest('.setting-section'))return 'settings:'+el.closest('.setting-section').dataset.settingsSection;
 if(el.closest('.qinfo-toggle'))return 'player-question';
 if(el.classList.contains('mode-toggle-chevron'))return 'quick-mode';
 if(el.classList.contains('preload-head-chevron'))return 'preload-head';
 if(el.classList.contains('preload-details-chevron'))return 'preload-details';
 if(el.closest('.quick-behavior-options'))return 'quick-behavior';
 if(el.closest('.question-editor-options'))return 'question-editor';
 if(el.closest('.previous-attempts'))return 'previous-attempts:'+Array.from(document.querySelectorAll('.previous-attempts')).indexOf(el.closest('.previous-attempts'));
 if(el.closest('.overview-entry'))return 'overview:'+Array.from(document.querySelectorAll('.overview-entry')).indexOf(el.closest('.overview-entry'));
 return 'chevron:'+Array.from(document.querySelectorAll('.unified-chevron')).indexOf(el);
}
function syncBuzzyChevrons(){
 ;
 const targets=document.querySelectorAll('.unified-chevron,.setting-chevron,.preload-head-chevron,.preload-details-chevron,.mode-toggle-chevron,.qinfo-toggle svg');
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 targets.forEach(el=>{
  const key=buzzyChevronId(el),opened=!!buzzyChevronStatus(el),prior=buzzyChevronTurns.get(key);
  const angle=prior?prior.angle+(prior.opened!==opened?180:0):(opened?180:0);
  buzzyChevronTurns.set(key,{angle,opened});
  const oldAngle=prior?prior.angle:angle;
  if(el.dataset.buzzyChevronAngle!==String(angle)){
    el.style.setProperty('--buzzy-chevron-turn',oldAngle+'deg');
    if(!reduced&&prior&&prior.opened!==opened){
     // Start the transition only after the element receives its initial paint.
     requestAnimationFrame(()=>{if(el.isConnected)el.style.setProperty('--buzzy-chevron-turn',angle+'deg')});
    }else el.style.setProperty('--buzzy-chevron-turn',angle+'deg');
    el.dataset.buzzyChevronAngle=String(angle);
  }
 });
}


function eligibleForRetry(){return activePlayers().filter(p=>state.allowRepeat||!state.excluded.includes(p.id))}
// #97: Never normalize historical negative totals when the host disables negatives.
function applyScorePolicy(before,requested){
 if(state.allowNegativeScores||requested>=0)return before+requested;
 return Math.max(before>=0?0:before,before+requested);
}
function retryBlocked(){return (eligibleForRetry().length===0)}
function retryButtonLabel(){return retryBlocked()?'No eligible players to retry question':'Retry Question'}
function renderPlay(){
 const q=currentQ(),over=state.phase==='open',hasBuzzes=state.buzzes.length>0;
 const selectedBuzz=state.mode==='timed'
  ?state.buzzes.find(b=>b.order===state.selectedBuzzOrder)||null
  :state.buzzes.find(b=>b.id===state.selected)||null;
 const p=selectedBuzz?state.players.find(x=>x.id===selectedBuzz.id):null;
 const canScore=!!selectedBuzz&&p?.status==='active'&&((state.mode!=='timed')||state.phase!=='open')&&!state.gradedBuzzKeys.includes(state.attemptNumber+':'+selectedBuzz.order);
 const isPreparing=['ready','preloaded','presented'].includes(state.phase)&&preloadPending();
 const preloadCount=preloadStats();
 const canOverride=isPreparing&&gameNow()-state.preloadStartedAt>=5000;
 let mainAction='',mainTitle='',mainSub='',mainKind='';
 if(isPreparing){mainTitle='PREPARING QUESTION';mainKind='preparing'}
 else if(state.phase==='ready'||state.phase==='preloaded'){const skipShow=!questionContentNeedsPreload();mainAction=skipShow?'open':togetherStartAvailable()?'present-and-open':'present';mainTitle=skipShow?(state.roundStartTogether?'START QUESTION & BUZZERS':'ACTIVATE BUZZERS'):togetherStartAvailable()?'START QUESTION & BUZZERS':'SHOW QUESTION';mainKind=skipShow?'':'reveal';}
 else if(state.phase==='presented'){mainAction='open';mainTitle='ACTIVATE BUZZERS';}
 else if(state.phase==='open'){mainAction='close';mainTitle='STOP BUZZERS';mainKind='stop-buzzers';}
 else if(state.phase==='locked'&&state.lastDecision!=='incorrect'){mainTitle='WAITING FOR ANSWER';mainKind='disabled';}
 else if(state.phase==='locked'&&state.lastDecision==='incorrect'){mainAction=retryBlocked()?'':'reset';mainTitle=retryBlocked()?'No eligible players to retry question':'RETRY QUESTION';mainKind=retryBlocked()?'disabled retry-unavailable':'advance';}
 else {mainAction=!state.quickQuestion&&nextPreparedIndex(state.qIndex)===-1?'finish-set':'next-question';mainTitle=mainAction==='finish-set'?'SET COMPLETE':'NEXT QUESTION';mainKind='advance';}
 const preparingDetails=isPreparing?`<span class="prepare-feedback"><span class="prepare-spinner" aria-hidden="true"></span><span>${preloadCount.ready}/${preloadCount.total} players ready</span></span>`:'';
 const primary=`<button class="btn primary full quickplay-main ${mainKind}" ${mainAction?`data-action="${mainAction}"`:'disabled'} aria-live="polite"><span class="primary-line">${preparingDetails}<span>${mainTitle}</span></span></button>`;
 const overridePrompt=canOverride?`<button class="preload-override" data-action="preload-anyway">Continue anyway · ${preloadCount.ready}/${preloadCount.total} ready</button>`:'';
 const readyForChange=!over&&!hasBuzzes&&state.phase!=='locked'&&state.phase!=='closed';
 const otherAllowed=readyForChange&&!state.questionShown;
 const safeChangeLabel=readyForChange?'Tap to change':'Finish this round to change';
 const pop=state.optionOpen;
 const fact=(action,label,value,shortLabel,shortValue,allowed=true,pressed=false)=>{
  const kind=action==='switch-mode'?'mode':action==='option:timer'?'timer':action==='option:correct'?'correct':action==='option:other'?'other':'incorrect';
  const compact=kind==='other'?'Other':kind==='mode'?(state.mode==='first'?'First Buzz':'Timed Buzz'):kind==='timer'?(state.timer?state.seconds+'s':'Off'):kind==='correct'?(state.correct>0?'+':'')+state.correct:(state.incorrect>0?'+':'')+state.incorrect;
  return `<button type="button" class="fact-button ${pressed?'selected':''}" data-action="${action}" ${allowed?'':'disabled'} aria-label="${safe(label)}: ${safe(value)}. ${safeChangeLabel}" title="${safe(label)}: ${safe(value)}" aria-expanded="${pressed}"><span class="fact-inner"><span class="fact-icon fact-icon--${kind}">${tileIcon(kind)}</span><span class="fact-main">${kind==='mode'?`<span class="mode-long">${safe(compact)}</span><span class="mode-short">${state.mode==='first'?'First':'Timed'}</span>`:safe(compact)}</span></span></button>`;
 };
 const scorePop=(key,label,values)=>`<div class="fact-editor" id="fact-editor"><div class="split"><strong>${label}</strong><button class="mini-close" aria-label="Close quick settings" data-action="close-option">✕</button></div><div class="grid5">${values.map(n=>`<button class="btn sm ${state[key]===n?'primary':''}" data-points="${key}:${n}">${n>0?'+':''}${n}</button>`).join('')}</div><label class="label" for="fact-custom-score">Custom points</label><input id="fact-custom-score" class="field" type="number" inputmode="numeric" value="${state[key]}" data-setting-number="${key}" onfocus="this.select()" aria-label="Custom ${label.toLowerCase()}"/></div>`;
 const optionsPanel=pop==='timer'?`<div class="fact-editor" id="fact-editor"><div class="split"><strong>Question timer</strong><button class="mini-close" aria-label="Close quick settings" data-action="close-option">✕</button></div><div class="timer-presets">${[0,...durationPresets].map(n=>`<button class="btn sm ${(!state.timer&&n===0)||(state.timer&&state.seconds===n)?'primary':''}" data-action="set-timer:${n}">${n===0?'Off':n+'s'}</button>`).join('')}</div><div class="timer-custom-field"><label class="label" for="play-custom-seconds">Custom duration (seconds)</label><input class="field" id="play-custom-seconds" type="number" min="1" max="600" step="1" inputmode="numeric" value="${state.seconds}" data-duration-custom="play" onfocus="this.select()" aria-label="Custom question duration in seconds"><p class="timer-custom-help">1–600 seconds · Applies only to this question</p></div></div>`:pop==='correct'?scorePop('correct','Correct answer points',[1,2,3,5,10]):pop==='incorrect'?scorePop('incorrect','Incorrect answer points',[0,-1,-2,-3,-10]):pop==='other'?`<div class="fact-editor fact-editor--other" id="fact-editor"><div class="split"><strong>Other question settings</strong><button type="button" class="mini-close" aria-label="Close Other settings" data-action="close-option">✕</button></div><p class="other-editor-help">For this question only. Room defaults and saved Prepared Questions are unchanged.</p><div class="other-editor-fields"><div><label class="label" for="other-text-visibility">Question text:</label><select class="field" id="other-text-visibility" data-round-behavior="visibility" ${!otherAllowed?'disabled':''}><option value="host" ${!state.roundTextVisible?'selected':''}>Host only</option><option value="visible" ${state.roundTextVisible?'selected':''}>Players and host</option></select><p class="other-editor-help">Images remain visible to players.</p></div><div><label class="label" for="other-viewer-content">Viewer screen:</label><select class="field" id="other-viewer-content" data-round-behavior="viewer" ${!otherAllowed?'disabled':''}><option value="same" ${!state.roundViewerHidden?'selected':''}>Same as players</option><option value="hide" ${state.roundViewerHidden?'selected':''}>Hidden on viewer</option></select><p class="other-editor-help">Hides the question on viewer screens only.</p></div><div><label class="label" for="other-buzzer-start">Buzzer start:</label><select class="field" id="other-buzzer-start" data-round-behavior="start" ${!otherAllowed?'disabled':''}><option value="manual" ${!state.roundStartTogether?'selected':''}>Separately by host</option><option value="together" ${state.roundStartTogether?'selected':''}>Together with question</option></select><p class="other-editor-help">Together with question starts both at once when question content is present.</p></div></div></div>`:'';
 const nextPrepared=nextPreparedIndex(state.qIndex);
 const canAdvancePrepared=!state.quickQuestion&&nextPrepared!==-1;
 const nextLabel=state.quickQuestion?'Prepare a new live question':canAdvancePrepared?`${state.questions[nextPrepared].title}`:'No more active prepared questions';
 return `<div class="stack">
  <div class="card gap12 quickplay-card">
   <div class="play-mode-switch" role="group" aria-label="Question source">
    <button type="button" class="play-mode-option ${state.quickQuestion?'active':''}" aria-pressed="${!!state.quickQuestion}" aria-expanded="${state.quickQuestion&&state.showQuickContent}" aria-controls="quick-content-panel" data-action="set-play-mode:quick"><span class="mode-content-group"><svg class="source-mode-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linejoin="round" stroke-linecap="round"><path d="m13.5 2-10 12h7.5l-1 8 10.5-13h-8z"/></svg><span class="mode-copy"><span>Quick Play</span> <span>Questions</span></span><span class="mode-chevron-slot ${state.quickQuestion?'is-visible':''}" aria-hidden="true"><svg class="mode-toggle-chevron ${state.showQuickContent?'is-open':''}" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg></span></span>${state.quickQuestion&&(q.text||q.image)?'<span class="has-content-dot" aria-label="Content added"></span>':''}</button>
    <button type="button" class="play-mode-option ${!state.quickQuestion?'active':''}" aria-pressed="${!state.quickQuestion}" data-action="set-play-mode:prepared"><span class="mode-content-group"><svg class="prepared-mode-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linejoin="round" stroke-linecap="round"><path d="M12 19h9"/><path d="M16 4a2.2 2.2 0 0 1 3.1 3.1L9 17.2 4 18.5l1.3-5L16 4Z"/></svg><span class="mode-copy"><span>Prepared</span> <span>Questions</span></span></span></button>
   </div>
   <div class="play-mode-content ${state.quickQuestion?'is-quick':'is-prepared'} ${state.playModeTransition?'mode-enter-'+state.playModeTransition:''}">
   ${state.quickQuestion&&state.showQuickContent?`<div class="quick-content-panel" id="quick-content-panel"><strong>Question content</strong><div><label class="label" for="quick-text">Question text (optional)</label><textarea id="quick-text" class="field" rows="3" placeholder="Question text (optional)">${safe(q.text)}</textarea></div><div><label class="label" for="quick-image">Image URL (optional)</label><input id="quick-image" class="field" value="${safe(q.image)}" type="url" placeholder="https://..." autocomplete="off"></div><div id="quick-image-preview" class="image-editor-preview" aria-live="polite"></div><details class="quick-behavior-options" ${state.quickBehaviorOptionsOpen?'open':''}><summary>Question options${unifiedChevron()}</summary>${questionBehaviorFields(q,'quick')}</details>${actionButton('Done','save-quick-content','btn primary full')}</div>`:''}
   <div class="quickplay-heading"><div><div class="eyebrow">Question ${state.countQuestion} · ${state.quickQuestion?'Quick Play':`Prepared ${state.qIndex+1} / ${state.questions.length}`}</div><h2 style="font-size:23px;margin-top:5px">${safe(state.quickQuestion?(q.text||q.image?'Live question':'Ready for a live question'):q.title)}</h2>${!state.quickQuestion&&q.answer?`<p class="host-answer">Answer: <b>${safe(q.answer)}</b></p>`:''}</div></div>
   ${q.text||q.image?`<div class="inner gap8"><p class="bold">${safe(q.text||'Question image')}</p>${q.image?imageWithFallback(q.image,'host'):''}</div>`:''}
   </div>
   <div class="play-direct-title split"><strong>Question options</strong></div>
   <div class="direct-options">${fact('switch-mode','Buzzer mode',state.mode==='first'?'⚡ First Buzz':'⏱ Timed Buzz','Mode',state.mode==='first'?'First':'Timed',readyForChange)}${fact('option:timer','Countdown',state.timer?state.seconds+' seconds':'Off','Timer',state.timer?state.seconds+'s':'Off',readyForChange,pop==='timer')}${fact('option:correct','Correct','+'+state.correct+' pts','Correct',(state.correct>0?'+':'')+state.correct,true,pop==='correct')}${fact('option:incorrect','Incorrect',state.incorrect+' pts','Incorrect',(state.incorrect>0?'+':'')+state.incorrect,true,pop==='incorrect')}${fact('option:other','Other question settings','Visibility and start','Other','Other',otherAllowed,pop==='other')}</div>
   <div class="fact-editor-shell ${pop?'is-open':''}" id="fact-editor-shell"><div class="fact-editor-clip">${optionsPanel}</div></div>
   <div class="host-question-behavior question-behavior-summary" role="status" aria-label="Current question settings"><span class="behavior-summary-item"><svg class="library-status-icon-eye" viewBox="0 0 24 24" aria-hidden="true"><path d="M2.2 12C4.8 8.1 8 6.2 12 6.2s7.2 1.9 9.8 5.8C19.2 15.9 16 17.8 12 17.8S4.8 15.9 2.2 12Z"/><circle cx="12" cy="12" r="2.8"/>${state.roundTextVisible?'':'<path d="m3 21 18-18"/>'}</svg><span class="behavior-summary-label">Question text:</span><strong>${state.roundTextVisible?'Players and host':'Host only'}</strong></span><span class="behavior-summary-item">${boltIcon()}<span class="behavior-summary-label">Buzzer start:</span><strong>${state.roundStartTogether?'Together with question':'Separately by host'}</strong></span></div>
   <div class="quickplay-controls quickplay-centered-clock"><span class="mono bold quickplay-clock" data-clock>${state.timer?formatRemaining():'NO TIMER'}</span></div>

   ${primary}${overridePrompt}
   ${!state.quickQuestion?`<div class="quickplay-actions">${actionButton('Skip & Next','request-skip','btn soft slate-skip-next')}${state.phase==='closed'?actionButton(retryButtonLabel(),'reset',`btn ${retryBlocked()?'retry-unavailable':''}`,retryBlocked()?'disabled':''):''}</div>`:['open','locked','closed'].includes(state.phase)?`<div class="quickplay-actions">${state.phase==='open'||state.phase==='locked'?actionButton('Skip & Next','next-question','btn'):state.phase==='closed'?actionButton(retryButtonLabel(),'reset',`btn ${retryBlocked()?'retry-unavailable':''}`,retryBlocked()?'disabled':''):''}</div>`:''}
   
   ${!state.quickQuestion&&state.showUpNext?`<div class="prepared-next prepared-next-compact"><span class="prepared-step">Up next</span><strong>${safe(nextLabel)}</strong></div>`:''}
  </div>
  <div class="card gap12 buzz-results-card"><div class="section-head"><div class="buzz-header-inline"><h2>Buzz results</h2><span class="buzz-count">${new Set(state.buzzes.map(b=>b.id)).size}/${activePlayers().length} buzzes · ${activePlayers().length} active</span></div></div>
   ${state.buzzes.length?`<div class="buzz-list-compact">${[...state.buzzes].sort((a,b)=>a.order-b.order).map(b=>{
    const who=state.players.find(x=>x.id===b.id),done=state.gradedBuzzKeys.includes(state.attemptNumber+':'+b.order),chosen=selectedBuzz?.order===b.order;
    return `<div class="buzz-result-row ${chosen?'is-selected':''} ${done?'is-done':''}"><button type="button" data-pick="${b.id}" data-buzz-order="${b.order}" ${done?'disabled':''} style="background:transparent;border:0;min-width:0;width:100%;padding:0;text-align:left;color:inherit;cursor:pointer"><span class="row-ident"><span class="rankno">${b.order}</span><span style="min-width:0"><strong>${safe(who?.name||'Unknown')}${done?(state.buzzEvaluations[state.attemptNumber+':'+b.order]==='correct'?' ✓':state.buzzEvaluations[state.attemptNumber+':'+b.order]==='incorrect'?' ✕':''):''}</strong>${chosen&&canScore?'<div class="buzz-row-subtitle">ANSWERING NOW</div>':''}</span></span></button><span class="time">${fmt(b.time)}</span>${chosen&&canScore?`<div class="buzz-inline-grade">${actionButton('✓ Correct · +'+state.correct,'correct','btn primary')}${actionButton('✕ Incorrect · '+(p?applyScorePolicy(p.score,state.incorrect)-p.score:state.incorrect),'incorrect','btn danger')}</div>`:''}</div>`;
   }).join('')}</div>`:'<div class="inner muted sm host-empty-message" style="padding:13px;text-align:center">No buzzes yet</div>'}
   <div class="split demo-tools-row prototype-only"><span class="sm muted">Demo tools</span>${actionButton('Simulate next buzz','simulate','btn sm',over?'':'disabled')}</div>
   ${state.attempts.length?`<details class="previous-attempts"><summary>Previous attempts (${state.attempts.length})${unifiedChevron()}</summary>${state.attempts.map(a=>`<p class="sm muted">Attempt ${a.number}: ${a.buzzes.map(b=>safe(state.players.find(p=>p.id===b.id)?.name)).join(', ')||'No buzzes'}</p>`).join('')}</details>`:''}
  </div> </div>
 </div>`
}
function renderQuestions(){
 const all=state.questions;
 const availabilityFilter=state.questionAvailabilityFilter;
 const filterSelect=(choices,current)=>`<label class="library-filter-field"><span class="library-filter-label">Availability</span><select class="field library-filter-select" data-library-filter="availability" aria-label="Filter questions by availability">${choices.map(([key,label])=>`<option value="${key}" ${current===key?'selected':''}>${label}</option>`).join('')}</select></label>`;
 
 const renderEntries=(visibleEntries)=>visibleEntries.map(({q,i})=>{
  const enabled=q.active!==false,current=!state.quickQuestion&&i===state.qIndex;
  const stateText=q.active===false?'Inactive':'Ready';
  const preview=q.text?.trim()?safe(q.text.trim()):q.image?'<span class="library-preview-muted">Image-only question</span>':'<span class="library-preview-muted">Spoken question · No question text</span>';
   const kind=q.mode==='default'?'Room mode':q.mode==='timed'?'Timed Buzz':'First Buzz';
   const moveButtons=`<div class="question-move" aria-label="Reorder question"><button type="button" class="move-btn" data-action="move-question:${i}:-1" aria-label="Move ${safe(q.title)} up" title="Move question up" ${i===0||!all.slice(0,i).some(q=>!q.played)?'disabled':''}><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M6 11l6-6 6 6"/></svg></button><button type="button" class="move-btn" data-action="move-question:${i}:1" aria-label="Move ${safe(q.title)} down" title="Move question down" ${i===all.length-1||!all.slice(i+1).some(q=>!q.played)?'disabled':''}><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M6 13l6 6 6-6"/></svg></button></div>`;
   const editBtn=actionButton('Edit','edit-question:'+i,'btn sm');
   const toggleBtn=actionButton(enabled?'Disable':'Enable','toggle-question:'+i,'btn sm '+(enabled?'':'soft'));
   const statusMarkup=`<span class="library-status ${enabled?'library-status--active':'library-status--inactive'}">${stateText}</span>`;
   const actions=`<div class="library-card-actions">${toggleBtn}${editBtn}</div>`;
   return `<article data-animated-question="${safe(q.id)}" class="question-item library-question-card" draggable="true" data-question-drag="${i}" aria-label="Question ${i+1}: ${safe(q.title)}"><div class="library-card-main">${moveButtons}<div class="library-card-copy"><div class="library-card-overline">Question ${i+1}${current?' · Current':''}${q.started&&!q.played?' · Started':''}</div><div class="library-card-title">${safe(q.title||'Untitled question')}</div><p class="library-card-preview">${preview}</p>${aiQueueAnswer(q)}<div class="library-card-meta" aria-label="Points and buzzer mode"><span class="library-card-mode">${q.mode==='default'?`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>`:''}${(q.mode!=='default')?modeIcon(q.mode):''}${safe(kind)}</span><span class="library-card-points correct" title="Correct answer points"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg> ${Number(q.points)>0?'+':''}${safe(q.points)} correct</span><span class="library-card-points incorrect" title="Wrong answer penalty"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg> ${safe(q.penalty)} wrong</span>${aiQueueMeta(q)}</div></div><div class="library-actions-column">${statusMarkup}${actions}</div></div></article>`;
 }).join('');
 
  const queue=all.map((q,i)=>({q,i})).filter(({q})=>!q.played&&(state.devUi||!q.isDemo));
  const visibleQueue=queue.filter(({q})=>availabilityFilter==='ready'?q.active!==false:availabilityFilter==='inactive'?q.active===false:true);
  const queueFilters=`<div class="library-filter-panel">${filterSelect([['all','All questions'],['ready','Ready'],['inactive','Inactive']],availabilityFilter)}</div>`;
  return `<div class="stack question-library-page questions-split-page"><div class="questions-split-heading"><div class="section-head library-section-head"><div><h2>Questions</h2><p class="muted sm">Prepare and order upcoming questions. Completed rounds are in Play → Round overview.</p></div><div class="questions-head-actions">${actionButton('New question','new-question','btn primary full')}${actionButton(aiOpenLabel(),'ai-open','btn sm ai-open-button')}</div></div></div><section class="questions-section-card" aria-labelledby="queue-section-title"><div class="questions-section-heading"><h2 id="queue-section-title">Question queue</h2><span class="queue-counter">${queue.length} questions</span></div>${queue.length?queueFilters:''}<div class="library-question-list">${renderEntries(visibleQueue)||(queue.length?'<div class="inner muted sm host-empty-message">No questions match this filter.</div>':'<div class="inner muted sm host-empty-message">No questions yet. Use New question to add one.</div>')}</div>${queue.length?'<p class="questions-section-help">Questions leave the queue when played. Review completed rounds in Play → Round overview. Reorder queued questions using the arrows or drag-and-drop.</p>':''}${window.BUZZY_RUNTIME?`<div class="question-library-row"><p class="question-library-help">Your questions are saved on this device and copied into each new room. Export them to use another device.</p><div class="question-library-actions">${actionButton('Export questions','library-export','btn sm')}${actionButton('Import questions','library-import','btn sm')}</div></div>`:''}</section></div>`;
}

function connectedPlayersForDisplay(active){
 const list=[...active];
 const joinIndex=new Map(state.players.map((p,i)=>[p.id,i]));
 if(state.playerSort==='score')list.sort((a,b)=>Number(b.score)-Number(a.score)||(joinIndex.get(a.id)-joinIndex.get(b.id)));
 else if(state.playerSort==='name')list.sort((a,b)=>a.name.localeCompare(b.name,'sv',{sensitivity:'base'})||(joinIndex.get(a.id)-joinIndex.get(b.id)));
 else list.sort((a,b)=>joinIndex.get(a.id)-joinIndex.get(b.id));
 return list;
}
function renderPlayers(){
 const personRow=(p,displayPosition)=>`<div class="person" data-player-row="${safe(p.id)}"><div class="personleft"><span class="avatar">#${displayPosition}</span><div><div class="personname">${safe(p.name)}</div><div class="persondetail"><span class="player-online-indicator" aria-hidden="true"></span>${p.id===state.viewAs?'Player preview':'Online'} · ${p.score} points</div></div></div><div class="row">${actionButton('Manage','manage:'+p.id,'btn sm')}</div></div>`;
 const active=connectedPlayersForDisplay(activePlayers());
 const sortControl=`<div class="players-sort-field"><label for="connected-players-sort">Sort by</label><select class="field" id="connected-players-sort" data-player-sort><option value="score" ${state.playerSort==='score'?'selected':''}>Points · highest first</option><option value="name" ${state.playerSort==='name'?'selected':''}>Name · A–Z</option><option value="connection" ${state.playerSort==='connection'?'selected':''}>Connection order</option></select></div>`;
 const waiting=state.players.filter(p=>p.status==='waiting');
 const queued=state.players.filter(p=>p.status==='queued');
 const pendingRow=(p,label)=>`<div class="person player-state-card" data-player-row="${safe(p.id)}"><div class="personleft"><span class="avatar">${safe(p.name[0])}</span><div><div class="personname">${safe(p.name)}</div><div class="persondetail">${safe(label)}</div></div></div><span class="join-tag">Next question</span></div>`;
 return `<div class="stack"><div class="card gap12 dynamic-player-card players-list-card"><div class="section-head"><div><h2>Connected players</h2><p class="sm muted">${active.length} active · Use Manage for player actions</p></div>${sortControl}</div><div class="connected-player-list" data-animated-list="connected">${active.map((p,i)=>personRow(p,i+1)).join('')||'<p class="muted">No connected players.</p>'}</div><div class="player-prototype-footer prototype-only">${actionButton('+ Simulate join','simulate-join','btn sm soft')}</div></div>
 ${(waiting.length||queued.length)?`<div class="card gap12 join-players-section dynamic-player-card"><h2>Joining players</h2>${waiting.map(p=>pendingRow(p,'In room · Waiting to play')).join('')}${queued.map(p=>pendingRow(p,'Admission paused · Queued outside room')).join('')}<p class="join-preview-tip">Pending guests become eligible automatically when the host starts the next question, not on Retry or timeout.</p></div>`:''}
 <div class="card gap12 dynamic-player-card"><h2>Disconnected players</h2>${state.players.filter(p=>p.status==='kicked').map(p=>`<div class="person player-state-card" data-player-row="${safe(p.id)}"><div class="personleft"><span class="avatar" aria-hidden="true">${safe(p.name[0])}</span><div><div class="personname">${safe(p.name)}</div><div class="persondetail">Disconnected</div></div></div>${actionButton('Simulate rejoin','rejoin:'+p.id,'btn sm soft')}</div>`).join('')||'<p class="muted sm">No disconnected players.</p>'}</div>
 <div class="card gap12 dynamic-player-card"><h2>Banned players</h2>${state.players.filter(p=>p.status==='banned').map(p=>`<div class="person player-state-card" data-player-row="${safe(p.id)}"><div class="personleft"><span class="avatar" aria-hidden="true">${safe(p.name[0])}</span><div><div class="personname">${safe(p.name)}</div><div class="persondetail">Banned</div></div></div>${actionButton('Unban','unban:'+p.id,'btn sm soft')}</div>`).join('')||'<p class="muted sm">No banned players.</p>'}<div class="notice">A ban applies only to the current session. Unbanned players can rejoin without resetting the game.</div></div></div>`;
}
// Keep <details> and focus mounted while the current pixel-height animation runs.
// An interrupted animation reverses from its current visual frame.
const settingsDisclosureAnimations=new WeakMap();
function toggleSettingsSection(id){
 if(!Object.prototype.hasOwnProperty.call(state.settingsOpen,id))return;
 const section=document.querySelector(`[data-settings-section="${id}"]`);
 const next=!state.settingsOpen[id];
 state.settingsOpen[id]=next;
 const pane=section?.querySelector('.setting-section-collapse');
 const summary=section?.querySelector('summary');
 if(!pane||!summary){render();return;}
 const previous=settingsDisclosureAnimations.get(section);
 // Capture the actual interpolated frame before cancelling, for interruption-safe reversal.
 const fromHeight=previous?pane.getBoundingClientRect().height:(section.open?pane.getBoundingClientRect().height:0);
 const fromOpacity=previous?parseFloat(getComputedStyle(pane).opacity):(next?0:1);
 if(previous){previous.cancel();settingsDisclosureAnimations.delete(section)}
 section.open=true; // required for measuring a closed <details> before opening
 section.classList.toggle('is-collapsed',!next);
 summary?.setAttribute('aria-expanded',String(next));
 const toHeight=next?pane.scrollHeight:0;
 if(reducedMotion||!pane.animate||Math.abs(fromHeight-toHeight)<.5){
  section.open=next;return;
 }
 const host=section.closest('.settings-main-card');
 const style=getComputedStyle(host||section);
 const raw=style.getPropertyValue('--buzzy-settings-panel-ms').trim()||'260ms';
 const duration=Math.max(0,parseFloat(raw)*(raw.endsWith('ms')?1:raw.endsWith('s')?1000:1))||260;
 const easing=style.getPropertyValue('--buzzy-settings-panel-ease').trim()||'ease';
 const animation=pane.animate([
  {height:`${fromHeight}px`,opacity:Number.isFinite(fromOpacity)?fromOpacity:1},
  {height:`${toHeight}px`,opacity:next?1:0}
 ],{duration,easing,fill:'both'});
 settingsDisclosureAnimations.set(section,animation);
 animation.onfinish=()=>{
  if(settingsDisclosureAnimations.get(section)!==animation)return;
  settingsDisclosureAnimations.delete(section);
  animation.cancel(); // return to natural height, then close immediately (no timer pause)
  if(!state.settingsOpen[id])section.open=false;
 };
}

function hostInfoLabel(label){return label}
function viewerSettingsMarkup(){
 const count=state.viewerCount||0,link=window.BuzzyNetwork?.viewerUrl?.()||'';
 const sub=(title,body)=>`<section class="settings-subgroup"><h3 class="settings-subhead">${title}</h3><div class="settings-subgroup-content">${body}</div></section>`;
 const connect=`<p class="settings-group-caption viewer-settings-intro">Show the game on a TV or projector. Open the viewer link in the screen’s browser. Viewer screens only display the game and never take a player place.</p><div class="grid2 viewer-settings-actions">${link?`<a class="btn full" href="${link}" target="_blank" rel="noopener">Open viewer</a>`:''}${actionButton('Copy link','viewer-copy-link','btn full')}</div><p class="viewer-settings-count" role="status">${count===1?'1 screen connected':count+' screens connected'} · up to 4</p>`;
 const modes=[['standby','Standby'],['join','Join'],['game','Game'],['leaderboard','Leaderboard']],index=Math.max(0,modes.findIndex(([k])=>k===state.viewerView));
 const mode=`<div class="viewer-mode"><div class="play-mode-switch viewer-mode-seg" role="group" aria-label="Viewer shows" style="--i:${index};--c:${index%2};--r:${Math.floor(index/2)}">${modes.map(([k,l])=>`<button type="button" class="play-mode-option${state.viewerView===k?' active':''}" data-action="viewer-view:${k}" aria-pressed="${state.viewerView===k}">${l}</button>`).join('')}</div><p class="settings-group-caption">${state.viewerView==='standby'?'Standby: viewer screens show only the Buzzy logo.':'Changes all viewer screens at once. Players are not affected.'}</p></div>`;
 const game=`${toggleRow('Question number','viewerQuestionNumber','Shows the question number above the question.')}${toggleRow('Question','viewerQuestion','Question text and image when players can see them.')}${toggleRow('Timer','viewerTimer','Countdown while the buzzers are open. Hidden when everyone has buzzed or time is up.')}${toggleRow('Buzz order and results','viewerBuzzOrder','Who buzzed, in order, with correct and incorrect marks. Names follow Show player names.')}${toggleRow('Celebration','viewerCelebration','Confetti when you launch the celebration for all.')}`;
 return `<div class="viewer-settings"><section class="settings-subgroup viewer-connect-group"><div class="settings-subgroup-content">${connect}</div></section>${sub('Viewer shows',mode)}${sub('Show in Game mode',game)}</div>`;
}
function appearanceCard(){
 const modes=[['auto','Auto'],['light','Light'],['dark','Dark']],choice=state.hostTheme||'auto',index=Math.max(0,modes.findIndex(([k])=>k===choice));
 return `<div class="card gap12 settings-appearance-card"><div><h2>Appearance</h2><p class="sm muted">Only on this device. Auto follows the light or dark setting of this phone or computer.</p></div><div class="appearance-mode"><div class="play-mode-switch" role="group" aria-label="Appearance" style="--i:${index}">${modes.map(([k,l])=>`<button type="button" class="play-mode-option${choice===k?' active':''}" data-action="host-theme:${k}" aria-pressed="${choice===k}">${l}</button>`).join('')}</div></div></div>`;
}
// #387/#397: page-level markup for AI questions, inserted into the generated host page by ai-host.mjs.
// Built only from the app's templates: play-mode-switch, btn, switchrow/toggle, inner, library-card title/meta/
// status and move-btn. State lives in state.ai and is owned by src/ai-questions.js.
const aiIcons={
 sparkle:'<path d="M12 3l1.8 4.6L18 9.4l-4.2 1.8L12 16l-1.8-4.8L6 9.4l4.2-1.8z"/><path d="M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>',
 tag:'<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
 level:'<path d="M5 20V14M12 20V9M19 20V4"/>',
 calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
 link:'<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
 close:'<path d="M18 6 6 18M6 6l12 12"/>',
 check:'<path d="M20 6 9 17l-5-5"/>',
 shield:'<path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z"/><path d="m9 12 2 2 4-4"/>',
 info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
};
function aiIcon(name,cls='ai-icon'){return `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${aiIcons[name]}</svg>`;}
function aiSparkle(){return aiIcon('sparkle','');}
// The play-mode-switch template with any number of options; its marker slides to the chosen one.
function aiSwitch(name,options,current,label){
 const index=Math.max(0,options.findIndex(([v])=>String(v)===String(current)));
 return `<div class="play-mode-switch ai-switch" role="group" aria-label="${label}" style="--n:${options.length};--i:${index}">${options.map(([v,l])=>`<button type="button" class="play-mode-option${String(current)===String(v)?' active':''}" data-action="${name}:${v}" aria-pressed="${String(current)===String(v)}">${l}</button>`).join('')}</div>`;
}
function aiChoices(name,options,current,label){return `<div class="ai-choices" role="group" aria-label="${label}">${options.map(([v,l])=>`<button type="button" class="btn sm" data-action="${name}:${v}" ${current===undefined?'':`aria-pressed="${String(current)===String(v)}"`}>${safe(l)}</button>`).join('')}</div>`;}
function aiSwitchRow(label,field,checked,help=''){return `<label class="switchrow ai-switchrow"><span><span class="bold">${label}</span>${help?`<br><span class="muted sm">${help}</span>`:''}</span><input type="checkbox" role="switch" aria-label="${label}" class="toggle" data-ai-field="${field}" ${checked?'checked':''}></label>`;}
function aiLevelName(level){return level?level[0].toUpperCase()+level.slice(1):'';}
function aiPeriodName(period){return (window.BuzzyAiPeriods||[]).find(([k])=>k===period)?.[1]||'';}
function aiHost(url){try{return new URL(url).hostname.replace(/^www\./,'');}catch{return '';}}
// One metadata row in the style of the question cards: icon + text, sources as links.
function aiMetaSpans(item,{pill=true}={}){
 const spans=[];
 // In the review the status is a status pill; in queue cards (which already have one) it is a meta item.
 if(item.ai){const label=item.ai.demo?'Demo':item.ai.status==='verified'?'Verified':'Check';spans.push(pill?`<span class="library-status ${item.ai.status==='verified'&&!item.ai.demo?'library-status--active':'library-status--inactive'}">${label}</span>`:`<span class="library-card-mode ai-meta-status">${aiIcon('sparkle')}${item.ai.demo?'Demo':`AI · ${label}`}</span>`);}
 if(item.topic)spans.push(`<span class="library-card-mode">${aiIcon('tag')}${safe(item.topic)}</span>`);
 if(item.difficulty)spans.push(`<span class="library-card-mode">${aiIcon('level')}${safe(aiLevelName(item.difficulty))}</span>`);
 const period=item.periodLabel||(item.period&&item.period!=='any'?aiPeriodName(item.period):'');
 if(period){const news=['year','month','week'].includes(item.period)&&item.ai?.createdAt;spans.push(`<span class="library-card-mode">${aiIcon('calendar')}${safe(period)}${news?` · ${safe(new Date(item.ai.createdAt).toLocaleDateString('en-GB',{day:'numeric',month:'short'}))}`:''}</span>`);}
 if(item.sources?.length)spans.push(`<span class="library-card-mode ai-meta-sources">${aiIcon('link')}${item.sources.map(s=>`<a href="${safe(s.url)}" target="_blank" rel="noopener noreferrer" title="${safe(s.title||aiHost(s.url))}">${safe(aiHost(s.url)||'source')}</a>`).join(', ')}</span>`);
 return spans.join('');
}
function aiOpenLabel(){const a=state.ai;if(a?.phase==='running')return `${aiSparkle()}<span>${a.step===2?`Checking ${a.checked}/${a.toCheck}`:'Writing…'}</span>`;if(a?.phase==='review'&&a.drafts?.length)return `${aiSparkle()}<span>Review ${a.drafts.length}</span>`;return `${aiSparkle()}<span>Generate<span class="ai-wide"> questions</span></span>`;}
function aiDemoBanner(){return state.ai?.demo?`<div class="inner ai-demo-banner" role="note"><span class="sm"><b>Demo</b> · Sample questions from a built-in list. Claude is not used and nothing is billed.</span>${actionButton('Exit demo','ai-demo-exit','btn sm')}</div>`:'';}
function aiSettingsCard(){
 const a=state.ai||{};
 const status=a.key==='saved'?`<div class="ai-key-status" role="status"><span class="library-status library-status--active">Key saved</span><span class="sm muted">On this device ${safe(a.keyHint||'')}</span></div>${actionButton('Remove key','ai-key-remove','btn full')}`
  :`<div><label class="label" for="ai-key-input">Anthropic API key</label><input class="field ai-key-input" id="ai-key-input" type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" data-1p-ignore data-lpignore="true" data-bwignore data-form-type="other" placeholder="sk-ant-…" data-ai-field="key" value="${safe(a.keyInput||'')}" ${a.key==='checking'?'disabled':''}></div>${a.keyError?`<p class="sm ai-error" role="alert">${safe(a.keyError)}</p>`:''}<div class="grid2"><a class="btn full" href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer">Get a key</a>${actionButton(a.key==='checking'?'Checking…':'Save key','ai-key-save','btn primary full',a.key==='checking'?'disabled':'')}</div>`;
 const demo=a.key==='saved'?'':a.demo?`<div class="inner ai-demo-banner"><span class="sm"><b>Demo is on.</b> Try it in Questions → Generate questions.</span>${actionButton('Exit demo','ai-demo-exit','btn sm')}</div>`:`<p class="sm muted">No key yet? Try the whole flow with sample questions. Nothing is sent to Claude.</p>${actionButton('Try demo','ai-demo-start','btn full')}`;
 return `<div class="card gap12 settings-ai-card"><div><h2>AI questions</h2><p class="sm muted">Claude writes and fact-checks questions for the queue in Questions. Uses your own Anthropic API key; usage is billed to that key.</p></div>${status}<p class="sm muted">The key is stored only in this browser on this device. It is never saved in the room or sent to Buzzy.</p>${demo}</div>`;
}
function aiPanelMarkup(){
 const a=state.ai||{};
 if(a.key!=='saved'&&!a.demo)return `<div class="ai-panel" data-ai-phase="key"><p>Connect Claude first. Add your own Anthropic API key in Settings → AI questions.</p>${actionButton('Open Settings','ai-open-settings','btn primary full')}<p class="sm muted">No key yet? Try the whole flow with sample questions.</p>${actionButton('Try demo','ai-demo-start','btn full')}</div>`;
 if(a.phase==='running'){
  const step=(n,title,text,extra='')=>`<div class="ai-step"><span class="ai-dot ${a.step>n?'done':a.step===n?'run':'wait'}" aria-hidden="true">${a.step>n?aiIcon('check',''):a.step===n?'':`<span class="sm">${n}</span>`}</span><div><span class="bold">${title}</span><p class="sm muted">${text}</p>${extra}</div></div>`;
  return `<div class="ai-panel" data-ai-phase="running" aria-busy="true">${aiDemoBanner()}<p class="sm muted">${safe(a.label||'')} · ${a.language==='sv'?'Svenska':'English'}</p><div class="ai-steps">${step(1,'Write questions','Claude researches and writes questions with sources, plus a few spares.')}${step(2,'Fact-check',a.toCheck?`Checking each answer independently · ${a.checked} of ${a.toCheck}`:'Each answer is checked again by a separate request.',a.toCheck?`<div class="ai-bar"><i style="width:${Math.round(100*a.checked/Math.max(1,a.toCheck))}%"></i></div>`:'')}${step(3,'Ready to review','You choose what goes into the queue.')}</div><p class="sm muted">You can close this panel; the work continues.</p>${actionButton('Cancel','ai-cancel','btn full')}</div>`;
 }
 if(a.phase==='review'||a.phase==='error'&&a.drafts?.length){
  const selected=a.drafts.filter(d=>d.selected).length,verified=a.drafts.filter(d=>d.status==='verified').length,checks=a.drafts.length-verified;
  const draft=d=>`<article class="inner ai-draft${d.selected?' selected':''}"><div class="ai-draft-body"><div class="library-card-title">${safe(d.question)}</div><p class="library-card-preview">Answer: <b>${safe(d.answer)}</b></p>${d.accepted?.length?`<p class="sm muted">Also accepted: ${safe(d.accepted.join(', '))}</p>`:''}${d.status!=='verified'&&d.reason?`<p class="sm ai-note">${safe(d.reason)}</p>`:''}${d.explanation?`<p class="sm muted">${safe(d.explanation)}</p>`:''}<div class="library-card-meta">${aiMetaSpans({...d,ai:{status:d.status,demo:false}})}</div></div><input type="checkbox" role="switch" class="toggle" data-ai-field="pick:${d.id}" aria-label="Add this question to the queue" ${d.selected?'checked':''}></article>`;
  const rejected=a.rejected?.length?`<details class="inner ai-rejected" ${a.rejectedOpen?'open':''}><summary><span>${a.rejected.length} rejected</span>${typeof unifiedChevron==='function'?unifiedChevron():aiIcon('check')}</summary><div class="ai-rejected-list">${a.rejected.map(r=>`<div><span class="bold">${safe(r.question)}</span><p class="sm">${safe(r.reason||'Rejected.')}</p></div>`).join('')}</div></details>`:'';
  const used=a.demo?'<p class="sm muted">Demo: no requests were sent to Claude.</p>':a.usage?.input||a.usage?.output?`<p class="sm muted">Used about ${Math.round((a.usage.input+a.usage.output)/1000)}k tokens and ${a.usage.searches} web searches.</p>`:'';
  return `<div class="ai-panel" data-ai-phase="review">${aiDemoBanner()}${a.notice?`<p class="sm ai-notice">${safe(a.notice)}</p>`:''}<p class="sm muted">${safe(a.label||'')} · ${verified} verified${checks?` · ${checks} to check`:''}${a.rejected?.length?` · ${a.rejected.length} rejected`:''}</p>${a.error?`<p class="sm ai-error" role="alert">${safe(a.error)}</p>`:''}<div class="ai-drafts">${a.drafts.length?a.drafts.map(draft).join(''):'<p class="sm muted">No questions passed the fact-check.</p>'}</div>${rejected}${used}<div class="ai-foot">${a.rejected?.length?actionButton(`Replace rejected (${a.rejected.length})`,'ai-replace','btn'):actionButton('New batch','ai-new','btn')}${actionButton(`Add ${selected} to queue`,'ai-add','btn primary',selected?'':'disabled')}</div></div>`;
 }
 const levels=[['easy','Easy'],['mixed','Mixed'],['hard','Hard']],languages=[['sv','Svenska'],['en','English']];
 const recentNote=['year','month','week'].includes(a.period)?'<p class="sm ai-note">News questions say when it happened and use news sources from the period. They can go out of date.</p>':'';
 const topic=`<div><label class="label" for="ai-topic">Topic</label><input class="field" id="ai-topic" data-ai-field="topic" value="${safe(a.topic||'')}" placeholder="e.g. Swedish history, 1600s" autocomplete="off"></div>${aiChoices('ai-chip',(window.BuzzyAiTopics||[]).map((t,i)=>[i,t]),undefined,'Topic suggestions')}<div><span class="label">Period</span>${aiChoices('ai-period',window.BuzzyAiPeriods||[],a.period||'any','Period')}</div>${recentNote}<div class="ai-two"><div><span class="label">Questions</span>${aiSwitch('ai-count',[[5,'5'],[10,'10'],[15,'15'],[20,'20']],a.count,'Number of questions')}</div><div><span class="label">Language</span>${aiSwitch('ai-language',languages,a.language,'Language')}</div></div><div><span class="label">Difficulty</span>${aiSwitch('ai-difficulty',levels,a.difficulty,'Difficulty')}</div>`;
 const total=(a.rows||[]).reduce((n,r)=>n+(r.topic?.trim()?Number(r.count)||0:0),0);
 const select=(field,options,value,label)=>`<select class="field" data-ai-field="${field}" aria-label="${label}">${options.map(([v,l])=>`<option value="${v}" ${String(value)===String(v)?'selected':''}>${safe(l)}</option>`).join('')}</select>`;
 const mix=`${a.mixes?.length?`<div><span class="label">Saved mixes</span><div class="ai-choices" role="group" aria-label="Saved mixes">${a.mixes.map((m,i)=>`<span class="ai-mix-chip"><button type="button" class="btn sm" data-action="ai-mix-load:${i}" aria-pressed="${a.mixName===m.name}">${safe(m.name)}</button><button type="button" class="move-btn" data-action="ai-mix-delete:${i}" aria-label="Delete mix ${safe(m.name)}" title="Delete mix">${aiIcon('close','')}</button></span>`).join('')}</div></div>`:''}<div class="ai-rows">${(a.rows||[]).map((r,i)=>`<div class="inner ai-row"><input class="field" data-ai-field="row:${i}:topic" value="${safe(r.topic||'')}" placeholder="Topic" aria-label="Topic ${i+1}" autocomplete="off"><input class="field" type="number" min="1" max="20" data-ai-field="row:${i}:count" value="${Number(r.count)||0}" aria-label="Questions for topic ${i+1}">${select(`row:${i}:difficulty`,levels,r.difficulty,`Difficulty for topic ${i+1}`)}${select(`row:${i}:period`,window.BuzzyAiPeriods||[],r.period||'any',`Period for topic ${i+1}`)}<button type="button" class="move-btn" data-action="ai-row-del:${i}" aria-label="Remove topic ${i+1}" title="Remove topic">${aiIcon('close','')}</button></div>`).join('')}</div><div class="ai-mix-tools">${actionButton('+ Add topic','ai-row-add','btn sm')}<span class="sm muted"><span class="bold">${total}</span> questions</span></div><div><span class="label">Language</span>${aiSwitch('ai-language',languages,a.language,'Language')}</div>${aiSwitchRow('Shuffle the order','shuffle',!!a.shuffle,'Mix the topics instead of grouping them.')}<div class="ai-mix-save"><input class="field" data-ai-field="mixName" value="${safe(a.mixName||'')}" placeholder="Mix name" aria-label="Mix name" autocomplete="off">${actionButton('Save mix','ai-mix-save','btn sm')}</div>`;
 const count=a.mode==='mix'?total:a.count;
 return `<div class="ai-panel" data-ai-phase="form-${a.mode}">${aiDemoBanner()}${aiSwitch('ai-mode',[['topic','One topic'],['mix','Mix']],a.mode,'Kind of batch')}${a.mode==='mix'?mix:topic}<div class="inner ai-hint">${aiIcon('shield','')}<span class="sm muted">Every answer is checked against at least two independent sources in a separate step. Ambiguous or time-sensitive questions are left out, and questions already in the queue are skipped. Nothing is added until you choose.</span></div>${a.error?`<p class="sm ai-error" role="alert">${safe(a.error)}</p>`:''}${actionButton(`Generate ${count} question${count===1?'':'s'}`,'ai-generate','btn primary full',count?'':'disabled')}<p class="sm muted" style="text-align:center">${a.demo?'Demo: takes a few seconds and costs nothing.':'Billed to your Anthropic key. Takes about a minute.'}</p></div>`;
}
// Queue cards: the answer below the text, the rest in the card's own metadata row.
function aiQueueAnswer(q){return q.answer?`<p class="library-card-preview library-card-answer">Answer: <b>${safe(q.answer)}</b></p>`:'';}
function aiQueueMeta(q){return q.ai||q.topic||q.sources?.length?aiMetaSpans(q,{pill:false}):'';}

function renderMore(){
 const room=`<div class="card gap12 settings-room-card"><div class="section-head"><div><h2>Room information</h2><p class="sm muted">The host can end this game and delete its room data.</p></div></div><div class="inner split room-overview-stats"><div class="room-overview-metric"><div class="eyebrow">${hostInfoLabel('Room code')}</div><div class="stat" style="letter-spacing:3px">${state.code}</div></div><div class="room-overview-metric" style="text-align:right"><div class="eyebrow">${hostInfoLabel('Room lifetime')}</div><div class="expire" id="expiry">14d</div></div></div><p class="muted sm">The room link allows players to join. Host permissions remain restricted.</p>${actionButton('Copy room link','copy-link','btn full')+actionButton('End game','end-room','btn full danger')}</div>`;
 const gameBuzz=`<div class="settings-inline"><label class="label" for="default-mode">Default buzzer mode</label><select class="field" id="default-mode" data-select="defaultMode"><option value="first" ${state.defaultMode==='first'?'selected':''}>First Buzz</option><option value="timed" ${state.defaultMode==='timed'?'selected':''}>Timed Buzz</option></select></div>
 ${toggleRow('Use buzz timer by default','roomTimer','Use a countdown while players can buzz. Applies to new questions.')}
 ${roomDurationSelect()}`;
 const gameRules=`${toggleRow('Allow repeat attempts on same question','allowRepeat','Players may retry a question when eligible')}
 ${toggleRow('Allow joining during an active question','allowJoinDuringQuestion','New guests wait until next question before they can buzz')}`;
 const gameQuestion=`<div class="room-behavior-grid"><div><label class="label" for="room-text-visibility">Question text</label><select class="field" id="room-text-visibility" data-select="roomTextVisibility"><option value="visible" ${state.roomTextVisibility==='visible'?'selected':''}>Players and host</option><option value="host" ${state.roomTextVisibility==='host'?'selected':''}>Host only</option></select></div><div><label class="label" for="room-buzzer-start">Buzzer start</label><select class="field" id="room-buzzer-start" data-select="roomBuzzerStart"><option value="manual" ${state.roomBuzzerStart==='manual'?'selected':''}>Separately by host</option><option value="together" ${state.roomBuzzerStart==='together'?'selected':''}>Together with question</option></select></div></div>`;
 const gameScoring=`<div class="grid2 settings-numbers"><div><label class="label" for="room-correct">Correct points</label><input class="field" type="number" id="room-correct" value="${state.roomCorrect}" data-setting-number="roomCorrect" onfocus="this.select()"></div><div><label class="label" for="room-incorrect">Incorrect points</label><input class="field" type="number" id="room-incorrect" value="${state.roomIncorrect}" data-setting-number="roomIncorrect" onfocus="this.select()"></div></div>
 ${toggleRow('Allow negative total scores','allowNegativeScores','OFF: new deductions stop at 0; existing negative totals stay unchanged')}`;

 const buzzNameSetting=`<div class="setting-dependent-control">${toggleRow('Show player names','buzzOrderNames','Show names in Live Buzz and Buzz Order; buzz positions and times remain visible when names are off.',{dependent:true,disabled:!state.playerBuzzOrder})}</div>`;
 const displayPlayer=`${toggleRow('Players can open leaderboard','leaderboard','Trophy button on player screen')}${toggleRow('Show buzz activity to players','playerBuzzOrder','Display live buzz status and let players open the full Buzz Order.')}${buzzNameSetting}${toggleRow('Show own total score','ownScore','Display score beside player name')}`;
 const displayQuestion=`${toggleRow('Expand question details by default','showQuestionInfoDefault','Players can still open or close their question details.')}${toggleRow('Show question points to players','showQuestionPoints','Show correct-answer points and penalties in the expandable question details.')}`;
 const displayHost=toggleRow('Show next prepared question','showUpNext','Display the next prepared question on Play');
 const effectsSounds=`${toggleRow('Buzzer sounds','sounds','Sound when someone buzzes')}${toggleRow('Answer sounds','answerSounds','Correct/incorrect sound on affected player device')}`;
 const effectsVisual=`${toggleRow('Enable final celebration','celebration','Show confetti when the host launches the final celebration.')}<p class="settings-motion-note">Animations follow each device’s reduced-motion preference automatically.</p>`;
 const subGroup=(title,body,caption='')=>`<section class="settings-subgroup"><h3 class="settings-subhead">${title}</h3>${caption?`<p class="settings-group-caption">${caption}</p>`:''}<div class="settings-subgroup-content">${body}</div></section>`;
 const game=`${subGroup('Buzzers and timer',gameBuzz)}${subGroup('Game rules',gameRules)}${gameQuestion?subGroup('Question defaults',gameQuestion,'These defaults apply to new questions. Each question can override them.'):''}${subGroup('Default question scoring',gameScoring,'Used for new Quick Play questions. Play → Question options controls the current question.')}`;
 const display=`${subGroup('Player display',displayPlayer)}${subGroup('Question details',displayQuestion,'Choose what appears in the player’s question row.')}${displayHost?subGroup('Host display',displayHost):''}`;
 const effects=`${subGroup('Sounds',effectsSounds)}${subGroup('Visual effects',effectsVisual+actionButton('Launch celebration for all','celebrate','btn full'))}`;
 const sectionIcons={
  game:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6.6 8.2h10.8a3.1 3.1 0 0 1 3.03 2.45l1.05 5a2.65 2.65 0 0 1-4.12 2.73l-2.48-1.8H9.12l-2.48 1.8a2.65 2.65 0 0 1-4.12-2.73l1.05-5A3.1 3.1 0 0 1 6.6 8.2Z"/><path d="M7 11v4M5 13h4M15.9 12h.01M18.5 14h.01"/></svg>',
  display:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="14" rx="2.3"/><path d="M8 21h8m-4-3v3"/></svg>',
  effects:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18V5l12-2v13"/><ellipse cx="6" cy="18" rx="3" ry="2"/><ellipse cx="18" cy="16" rx="3" ry="2"/></svg>'
 };
 const section=(id,title,contents)=>`<details class="setting-section ${state.settingsOpen[id]?'':'is-collapsed'}" ${state.settingsOpen[id]?'open':''} data-settings-section="${id}"><summary data-action="toggle-settings-section:${id}" aria-expanded="${!!state.settingsOpen[id]}" aria-controls="setting-content-${id}"><span class="setting-svg-icon" aria-hidden="true">${sectionIcons[id]}</span><span class="setting-title">${title}</span><svg class="setting-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 9l7 7 7-7"/></svg></summary><div class="setting-section-collapse" id="setting-content-${id}"><div class="setting-section-body">${contents}</div></div></details>`;
 const grouped=`<div class="card settings-main-card gap12"><div class="section-head" style="margin:0"><div><h2>Room settings</h2><p class="sm muted">Manage room rules, player display, sounds and question defaults. New question defaults do not change an active question.</p></div></div>${section('game','Game and room',game)}${section('display','Display',display)}${section('effects','Sounds and effects',effects)}</div>`;
 return `<div class="stack">${appearanceCard()}${aiSettingsCard()}${room}${grouped}<div class="card gap12 session-history-card"><h2>Session and history</h2><p class="muted sm">Review completed rounds and scoring events.</p>${actionButton('View game history','history','btn full')}</div></div>`;
}

// v7.22 #235–237: change only the affected controls. Other accordions and chevrons remain mounted.
function updateSettingsInPlace(control){
 if(!((state.hostTab==='more')&&!state.preview))return false;
 const section=control.closest('[data-settings-section]');if(!section)return false;
 const key=control.dataset.toggle;
 if(key==='roomTimer'||key==='playerBuzzOrder'){
  const template=document.createElement('template');template.innerHTML=renderMore();
  const newSection=template.content.querySelector('[data-settings-section="'+section.dataset.settingsSection+'"]');
  if(!newSection)return true;
  const oldHeight=section.getBoundingClientRect().height;
  if(key==='roomTimer'){
   const row=control.closest('.switchrow'),group=row?.parentElement;
   const freshRow=newSection.querySelector('[data-toggle="roomTimer"]')?.closest('.switchrow');
   const freshSibling=freshRow?.nextElementSibling;
   const oldSibling=row?.nextElementSibling;
   if(oldSibling?.matches('.settings-inline,.settings-duration-row'))oldSibling.remove();
   if(freshSibling?.matches('.settings-inline,.settings-duration-row'))row.insertAdjacentElement('afterend',freshSibling.cloneNode(true));
  }else{
   const oldDependent=section.querySelector('.setting-dependent-control');
   const newDependent=newSection.querySelector('.setting-dependent-control');
   if(oldDependent&&newDependent)oldDependent.innerHTML=newDependent.innerHTML;
  }
  const newHeight=section.getBoundingClientRect().height;
  if(!reducedMotion&&Math.abs(newHeight-oldHeight)>1){
   section.animate([{height:oldHeight+'px',overflow:'hidden'},{height:newHeight+'px',overflow:'hidden'}],{duration:270,easing:'cubic-bezier(.22,.8,.2,1)'});
  }
 }
 // Important: do not detach or re-create the checkbox itself.
 return true;
}

function toggleRow(label,key,help,{disabled=false,dependent=false}={}){
 const copy=disabled?`${help}<span class="setting-requires-note">Requires buzz activity to be enabled.</span>`:help;
 return `<label class="switchrow${dependent?' switchrow--dependent':''}${disabled?' switchrow--disabled':''}"><span><span class="bold">${label}</span><br><span class="muted sm">${copy}</span></span><input type="checkbox" role="switch" aria-label="${label}" class="toggle" data-toggle="${key}" ${state[key]?'checked':''} ${disabled?'disabled aria-disabled="true"':''}></label>`;
}
function playerScoreMarkup(p){
 const fx=state.playerEffects[p.id];
 if(!fx||fx.before===fx.after||!animationsEnabled())return `${p.score} ${pointsUnit(p.score)}`;
 const key=`${p.id}:${fx.token}`;
 const visiblePlayer=state.preview&&state.viewAs===p.id;
 const animate=!state.scoreRollSeen.has(key) && (visiblePlayer);
 if(visiblePlayer || false)state.scoreRollSeen.add(key);
 const direction=fx.after>fx.before?'up':'down';
 const stepsCount=Math.min(12,Math.abs(fx.after-fx.before));
 const numbers=Array.from({length:stepsCount+1},(_,i)=>i===stepsCount?fx.after:fx.before+Math.sign(fx.after-fx.before)*i);
 const steps=animate?numbers:[fx.after];
 return `<span class="player-score-odometer" aria-label="${fx.after} points"><span class="score-reel ${animate?'rolling-'+direction:''}" style="--reel-steps:${steps.length-1}"><span class="score-reel-column">${steps.map(n=>`<span class="score-reel-value">${n}</span>`).join('')}</span></span><span>&nbsp;${pointsUnit(fx.after)}</span></span>`;
}

function playerRoundSummary(){
 const format=n=>`${n>0?'+':''}${n<0?String(n).replace('-', '−'):n}`;
 if(!state.showQuestionPoints)return '';
 const correct=`<span class="round-meta-correct" aria-label="Correct ${format(state.correct)} points"><span aria-hidden="true">✓</span> ${format(state.correct)} ${pointsUnit(state.correct)}</span>`;
 const incorrect=state.incorrect!==0?`<span class="round-meta-incorrect" aria-label="Incorrect ${format(state.incorrect)} points"><span aria-hidden="true">✕</span> ${format(state.incorrect)} ${pointsUnit(state.incorrect)}</span>`:'';
 return `<span class="round-meta-divider" aria-hidden="true">·</span>${correct}${incorrect?`<span class="round-meta-divider" aria-hidden="true">·</span>${incorrect}`:''}`;
}

function renderPlayer(){
 const p=me()||state.players[0];if(!p)return '<div class="phone"><p>Waiting for players to join.</p></div>';const q=currentQ();
 const isJoining=p.status==='waiting'||p.status==='queued';
 const own=state.buzzes.find(b=>b.id===p.id);
 const buzzOpen=state.phase==='open'&&p.status==='active'&&!(!state.allowRepeat&&state.buzzes.some(b=>b.id===p.id))&&!state.excluded.includes(p.id);
 const buzzed=!!own;
 const judged=(state.activeRound?.attempts||[]).find(a=>a.number===state.attemptNumber)?.buzzes?.filter(b=>b.id===p.id&&b.result).at(-1);
 const answerStatus=judged&&!buzzOpen?judged.result:null;
 const pos=state.mode==='timed'&&buzzed?own.order:null;
 const fx=state.playerEffects[p.id]||null;
 const showingCoin=!!fx;
 const coinKey=fx?`${p.id}:${fx.token}`:null;
 const animateCoin=!!fx&&!state.coinSeen.has(coinKey)&&animationsEnabled();
 if(coinKey)state.coinSeen.add(coinKey);
 const stampPosition=!!(pos&&!answerStatus&&!showingCoin);
 const stampKey=stampPosition?`${state.countQuestion}:${state.attemptNumber}:${p.id}:${pos}`:null;
 const stampAnimate=!!stampKey&&!state.stampSeen.has(stampKey)&&state.lastStampBuzzKey===stampKey;
 if(stampKey)state.stampSeen.add(stampKey);

 const lockedOut=state.excluded.includes(p.id)&&!state.allowRepeat;
 const timeExpired=state.timer&&state.phase==='closed'&&state.remainingAtClose===0&&!buzzed;
 const timeoutIsDue=(state.clockStoppedAt===null)||gameNow()-state.clockStoppedAt>=1000;
 const buzzSeenKey=buzzed?`${state.countQuestion}:${state.attemptNumber}:${p.id}`:null;state.buzzSeenAt||={};if(buzzSeenKey&&!state.buzzSeenAt[buzzSeenKey])state.buzzSeenAt[buzzSeenKey]=Date.now();
 const turnHold=buzzSeenKey?Math.max(0,1800-(Date.now()-state.buzzSeenAt[buzzSeenKey])):0;
 const currentTurnNow=state.phase!=='open'&&getActiveGradeBuzz()?.id===p.id&&state.buzzes.length>0&&state.lastDecision!=='correct';
 if(currentTurnNow&&turnHold>0&&!state.turnHoldTimer)state.turnHoldTimer=setTimeout(()=>{state.turnHoldTimer=null;render();},turnHold+40);
 const currentTurn=currentTurnNow&&turnHold===0;
 const special=!fx?(isJoining?'wait':lockedOut&&true?'wait':timeExpired&&true&&timeoutIsDue?'timeout':currentTurn&&true?'turn':null):null;
 const coinActive=!!fx||!!special;
 const specialToken=special==='turn'?`${state.countQuestion}:${state.attemptNumber}:${state.mode==='timed'?state.selectedBuzzOrder:state.selected}`:`${state.countQuestion}:${state.attemptNumber}:${special}`;
 const specialKey=special?`${p.id}:state:${special}:${specialToken}`:null;
 const animateSpecial=!!specialKey&&!state.coinSeen.has(specialKey)&&animationsEnabled();
 if(specialKey)state.coinSeen.add(specialKey);
 const buzzerLabel=coinActive?'BUZZED!':lockedOut?('WAIT FOR NEXT QUESTION'):buzzed?'BUZZED!':timeExpired?(timeoutIsDue?'TIME IS UP':'BUZZ!'):buzzOpen?'BUZZ!':'<span class="buzzbtn-ready"><span>GET</span><span>READY</span></span>';
 const stampDigits=stampPosition?Math.min(4,String(pos).length):0;
 const clockFade=(state.clockStoppedAt!==null)&&state.phase!=='open'?'clock-fade-away':'';
 const clockElapsed=state.clockStoppedAt===null?0:Math.max(0,gameNow()-state.clockStoppedAt);
 const clockDelay=(clockElapsed<560?560-clockElapsed:-Math.min(380,clockElapsed-560));
 const clockStyle=clockFade?`style="--clock-opacity:${buzzed?.4:1};--clock-fade-offset:${Math.min(380,clockElapsed)}ms;--clock-fade-delay:${clockDelay}ms"`:'';
 const front=`${stampPosition?`<span class="buzz-stamp stamp-digits-${stampDigits} ${stampAnimate?'stamp-enter':''}" aria-label="Your position ${pos}"><span class="buzz-stamp-badge">#${pos}</span></span>`:''}<span class="buzz-face-label">${buzzerLabel}</span>${state.timer&&!isJoining?`<span class="buzz-face-clock ${clockFade}" ${clockStyle} data-player-clock="${safe(p.id)}" aria-live="off"></span>`:''}`;
 const faceClass=fx?(fx.kind==='incorrect'||fx.points<0?'coin-back-negative':''):`coin-back-${special}`;
 const pointValue=fx?`${fx.points>0?'+':''}${fx.points}`:'';
 const sizeClass=pointValue.length>=5?'coin-points-very-long':pointValue.length>=4?'coin-points-long':'';
 const lockIcon='<svg class="coin-state-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';
 const specialMarkup=special==='wait'?`${lockIcon}<strong class="coin-state-label coin-state-label--wait"><span>WAIT FOR</span><span>NEXT</span><span>QUESTION</span></strong>`:special==='turn'?'<strong class="coin-state-label coin-state-label--turn"><span>YOUR</span><span>TURN</span></strong>':special==='timeout'?`<strong class="coin-state-label coin-state-label--timeout"><span>TIME</span><span>IS UP</span></strong>`:'';
 const readyReturn=['ready','preloaded','presented'].includes(state.phase)&&!coinActive&&!buzzed?state.readyReturnById[p.id]:null;
 const returnElapsed=readyReturn?gameNow()-readyReturn.at:0;
 const returnActive=readyReturn&&returnElapsed<520&&animationsEnabled()&&!reducedMotion;
 if(readyReturn&&!returnActive)delete state.readyReturnById[p.id];
 const rotor=returnActive
  ?`<span class="coin-rotor coin-return-enter" style="--ready-return-offset:-${Math.max(0,returnElapsed)}ms"><span class="coin-side ${readyReturn.classes} ready-old-face">${readyReturn.html}</span><span class="coin-side coin-back ready-new-face"><span class="coin-face-content">${front}</span></span></span>`
  :`<span class="coin-rotor ${coinActive?(fx?animateCoin:animateSpecial)?'coin-enter':'coin-flipped':''}"><span class="coin-side coin-front"><span class="coin-face-content">${front}</span></span><span class="coin-side coin-back ${faceClass}"><span class="coin-face-content">${fx?`<strong class="coin-points ${sizeClass} ${fx.points<0?'score-negative-optical':''}">${pointValue}</strong><span class="coin-unit">PTS</span>`:specialMarkup}</span></span></span>`;
 const playerHeader=`<div class="ph-top"><div class="player-header-left"><span class="ph-title">buzzy<span style="color:#67a5ff">.</span></span><span class="ph-code"><small>ROOM</small><strong>${state.code}</strong></span></div>${state.leaderboard&&p.status!=='queued'?`<button class="player-scores-trigger" data-action="player-leaderboard" type="button" aria-label="Open leaderboard" title="Leaderboard">${trophyIcon()}</button>`:''}</div>`;
 const qInfoOpen=p.status==='queued'?false:((state.playerQuestionInfoChoice[p.id]??state.showQuestionInfoDefault));
 const questionArrow=`<span class="player-person-divider qinfo-separator" aria-hidden="true">·</span><span class="qinfo-toggle-wrap"><button type="button" class="qinfo-toggle" data-action="toggle-question-info" aria-label="${qInfoOpen?'Hide':'Show'} question information" aria-expanded="${qInfoOpen}" aria-controls="player-q-details" title="${qInfoOpen?'Hide':'Show'} question information"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 9l7 7 7-7"/></svg></button></span>`;
 const questionHeader=`<div class="player-session-info"><div class="player-person-row"><span class="player-person-name" title="${safe(p.name)}">${safe(p.name)}</span>${state.ownScore?`<span class="player-person-divider" aria-hidden="true">·</span><span class="player-person-score">${playerScoreMarkup(p)}</span>`:''}${p.status==='queued'?'':questionArrow}</div><div class="player-round-reveal" id="player-q-details" ${!qInfoOpen?'aria-hidden="true"':''}><div class="player-round-line"><span class="player-round-heading" aria-label="Question ${state.countQuestion}: ${state.mode==='first'?'First Buzz':'Timed Buzz'}"><span>Q${state.countQuestion}:</span><span class="player-mode-icon player-mode-icon--${state.mode}">${modeIcon(state.mode)}</span><span>${state.mode==='first'?'FIRST BUZZ':'TIMED BUZZ'}</span></span>${state.timer?`<span class="player-question-timer">${state.seconds}s</span>`:''}${playerRoundSummary()}</div></div></div>`;
 const content=`<div class="ph-question"><div class="ph-question-inner">${isJoining?`<div class="join-pending-question"><strong>${p.status==='queued'?'Joining is paused':'You have joined!'}</strong>${p.status==='queued'?'<span>You will automatically join when the next question begins.</span>':''}</div>`:['presented','open','locked','closed'].includes(state.phase)?`<p>${safe((effectiveQuestionTextVisible()&&q.text)||'Listen to the host!')}</p>${q.image?imageWithFallback(q.image,'player'):''}`:`<p style="color:#a9bbd6">${state.phase==='preloaded'?'Question ready to reveal':'Waiting for the next question'}</p>`}</div></div>`;
 return `<div class="phonewrap"><div class="phone ${qInfoOpen?'qinfo-expanded':''}">${playerHeader}${questionHeader}${content}<button aria-label="${fx?'Points '+pointValue:special==='wait'?(isJoining&&p.status==='queued'?'Joining paused':'Wait for next question'):special==='turn'?'Your turn to answer':special==='timeout'?'Time is up':buzzOpen?'Buzz now':buzzed?'Buzz registered':'Get ready'}" data-action="buzz:${p.id}" class="buzzbtn coin-buzzer ${buzzed?'buzzed':''} ${buzzOpen?'coin-can-buzz':''} ${stampPosition?'has-stamp':''}" aria-disabled="${!(buzzOpen&&!coinActive)}">${rotor}</button>${liveBuzzFeed(p)}${p.status==='banned'?'<div class="ph-footer">You have been banned from this session.</div>':''}${p.status==='queued'?'':broadcastLeaderboard(p)}${p.status==='queued'?'':buzzOrderOverlay(p)}</div></div>`;
}

function trophyIcon(){return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8M12 17v4M7 4H4v4c0 3 3 5 6 5M17 4h3v4c0 3-3 5-6 5"/><path d="M7 3h10v8a5 5 0 0 1-10 0V3Z"/></svg>`}



function modalTitle(){
 if(state.modal==='ai-questions')return 'Generate questions';
 if(state.modal==='viewer')return 'Viewer screen';
 if(state.modal?.startsWith('network-'))return window.BuzzyNetwork?.exitTitle(state.modal)||'Room';
 if(state.modal?.startsWith('manage:'))return 'Manage '+(state.players.find(p=>p.id===state.modal.split(':')[1])?.name||'player');
 if(state.modal?.startsWith('adjust:'))return 'Adjust '+(state.players.find(p=>p.id===state.modal.split(':')[1])?.name||'player')+"'s score";
 return ({qr:('Join room ')+state.code,history:'Game history',question:state.editing===null?'New question':'Edit question','quick-edit':'Edit Quick Play question','stop-buzzers-confirm':'Stop buzzers?','skip-confirm':'Skip this question?','next-confirm':'Move to the next question?','queue-finished':'Question set complete','switch-play-mode':'Switch question mode?','quick-confirm':'Start a new Quick Play question?'})[state.modal]||'Details';
}

function renderModal(){if(!state.modal)return '';let inner='';if(state.modal==='ai-questions'){inner=aiPanelMarkup();}else if(state.modal==='viewer'){inner=viewerSettingsMarkup();}else if(state.modal==='network-leave'||state.modal==='network-end'||state.modal==='network-ended'){inner=window.BuzzyNetwork?.exitDialog(state.modal)||'';}else if(state.modal.startsWith('manage:')){let p=state.players.find(p=>p.id===state.modal.split(':')[1]);inner=`<h2>Manage ${safe(p.name)}</h2><p class="muted" style="margin:8px 0 17px">Score: ${p.score} points · Online</p><div class="gap8">${actionButton('Adjust points','adjust:'+p.id,'btn full soft')}${actionButton('Kick from session','kick:'+p.id,'btn full')}${actionButton('Ban for this session','ban:'+p.id,'btn full danger')}</div><p class="muted sm" style="margin-top:10px">Kicked players may rejoin. Banned players must be unbanned first.</p>`}else if((state.modal==='qr')&&!state.devUi){inner='<h2>QR code unavailable</h2><p class="muted">A live room URL and QR code require the multiplayer deployment.</p>'}else if(state.modal==='qr'){inner=`<p class="muted qr-description" style="margin:8px 0">Players scan the QR code or type the four-character room code.</p><div class="qr-sample prototype-only" aria-label="Illustrative QR graphic, not a usable QR code">${Array.from({length:225},(_,i)=>{let r=Math.floor(i/15),c=i%15;let finder=(r<5&&c<5)||(r<5&&c>=10)||(r>=10&&c<5);let filled=finder?([0,4].includes(r%10)||[0,4].includes(c%10)||r%10===2&&c%10===2):((r*17+c*13+r*c)%7<3);return `<span class="${filled?'dark':''}"></span>`}).join('')}</div><p class="muted sm prototype-only" style="text-align:center">Illustrative QR — live room URL will be generated after deployment.</p>`}else if(state.modal.startsWith('adjust:')){let p=state.players.find(p=>p.id===state.modal.split(':')[1]);inner=`<h2>Adjust ${safe(p.name)}'s score</h2><p class="muted" style="margin:7px 0 17px">Current score: ${p.score} points</p><label class="label" for="adjustval">Points to add or subtract</label><input class="field" id="adjustval" type="number" value="1" onfocus="this.select()" autofocus><div class="grid2" style="margin-top:15px">${actionButton('Apply adjustment','apply-adjust:'+p.id,'btn primary')}${actionButton('Cancel','close-modal','btn')}</div>`}else if(state.modal==='history'){inner=`<h2>Game History</h2><p class="muted" style="margin:8px 0 17px">Saved events from this room.</p><div class="gap12" style="max-height:350px;overflow:auto">${state.history.length?state.history.slice().reverse().map(h=>`<div class="inner gap8"><div class="split"><strong>${safe(h.label)}</strong><span class="sm muted">${safe(h.when)}</span></div><p class="sm muted">${safe(h.detail)}</p></div>`).join(''):'<div class="inner muted">No history yet. Try buzzing and awarding points.</div>'}</div>${actionButton('Export history as JSON','export-history','btn full soft')}<p class="muted sm" style="margin-top:8px">Completed round records are saved for this room.</p>`}else if(state.modal==='stop-buzzers-confirm'){inner=`<h2>Stop buzzers?</h2><p class=\"muted\" style=\"margin:10px 0 18px\">No more buzzes will be accepted. Existing buzzes can still be graded.</p><div class=\"grid2\">${actionButton('Keep open','close-modal','btn')}${actionButton('Stop buzzers','confirm-stop-buzzers','btn danger')}</div>`}else if((state.modal==='skip-confirm')){inner=`<h2>Skip this question?</h2><p class="muted" style="margin:10px 0 18px">${state.questionShown||state.startAt!==null?'The current round will end and appear in Round overview.':'This question has not started. It will remain in the queue as inactive, not marked as played.'} Any points already awarded are kept.</p><div class="grid2">${actionButton('Cancel','close-modal','btn')}${actionButton('Skip & Next','confirm-skip','btn danger')}</div>`}else if(state.modal==='next-confirm'){inner=`<h2>Move to the next question?</h2><p class="muted" style="margin:10px 0 18px">${state.quickQuestion?'Finish this round and create a new spoken question.':'Finish this round and advance in the prepared question queue.'} The history is kept.</p><div class="grid2">${actionButton('Keep playing','close-modal','btn')}${actionButton('Next question','confirm-next','btn primary')}</div>`}else if(state.modal==='queue-finished'){inner=`<h2>Question set complete</h2><p class="muted" style="margin:10px 0 18px">There are no more active questions after this one. You can re-enable a question in the library or switch to Quick Play.</p><div class="gap8">${actionButton('Start a Quick Question','confirm-quick','btn primary full')}${actionButton('Manage prepared questions','browse-questions','btn full')}${actionButton('Stay here','close-modal','btn full')}</div>` }else if(state.modal==='switch-play-mode'){inner=`<h2>Switch question mode?</h2><p class="muted" style="margin:10px 0 18px">The current round will end. Any buzzes and scores remain in Game History.</p><div class="grid2">${actionButton('Cancel','close-modal','btn')}${actionButton('Switch mode','confirm-play-mode','btn primary')}</div>`}else if(state.modal==='quick-confirm'){inner=`<h2>Start a new Quick Question?</h2><p class="muted" style="margin:10px 0 18px">The current round will end. Existing buzzes and scoring events remain in Game History.</p><div class="grid2">${actionButton('Cancel','close-modal','btn')}${actionButton('Start quick question','confirm-quick','btn primary')}</div>`}else if(state.modal==='quick-edit'){let q=state.quickQuestion;inner=`<h2>Edit Quick Question</h2><p class="muted sm" style="margin:8px 0 15px">Keep it blank for a spoken question. Text and images preload automatically after you apply them.</p><div class="gap12"><div><label class="label" for="quick-text">Question text (optional)</label><textarea class="field" rows="3" id="quick-text" placeholder="Leave blank for a spoken question">${safe(q.text)}</textarea></div><div><label class="label" for="quick-image">Image URL (optional)</label><input class="field" id="quick-image" type="url" value="${safe(q.image)}" placeholder="https://example.com/image.jpg"></div>${questionBehaviorFields(q,'quick')}${actionButton('Apply to current question','apply-quick','btn primary full')}</div>`}else if(state.modal==='question'){let q=state.editing===null?{title:'',text:'',image:'',points:1,penalty:0,mode:'default',timer:'default',textVisibility:'default',buzzerStart:'default'}:state.questions[state.editing];inner=`<div class="gap12 question-editor-form" style="margin-top:2px"><div><label class="label" for="qtitle">Internal title (optional)</label><input class="field" id="qtitle" value="${safe(q.title)}" placeholder="e.g. Music – 1980s"><p class="sm muted" style="margin-top:4px">Host only · Not shown to players</p></div><div><label class="label" for="qtext">Question text (optional)</label><textarea class="field" id="qtext" rows="3" placeholder="Question, or leave blank for verbal questions">${safe(q.text)}</textarea></div><div><label class="label" for="qanswer">Answer (optional)</label><input class="field" id="qanswer" value="${safe(q.answer||'')}" placeholder="Shown only to you"><p class="sm muted" style="margin-top:4px">Host only · Not shown to players</p></div><div><label class="label" for="qimage">Image URL (optional)</label><input class="field" id="qimage" value="${safe(q.image)}" placeholder="https://…"></div><div id="prepared-image-preview" class="image-editor-preview" aria-live="polite"></div><div class="grid2"><div><label class="label" for="qpoints">Correct points</label><input class="field" type="number" onfocus="this.select()" id="qpoints" value="${q.points}"></div><div><label class="label" for="qpenalty">Wrong-answer penalty</label><input class="field" type="number" onfocus="this.select()" id="qpenalty" value="${q.penalty}"></div></div><details class="question-editor-options"><summary>Question options${unifiedChevron()}</summary><div class="grid2"><div><label class="label" for="qmode">Buzzer mode</label><select class="field" id="qmode"><option value="default" ${q.mode==='default'?'selected':''}>Room default</option><option value="first" ${q.mode==='first'?'selected':''}>First Buzz</option><option value="timed" ${q.mode==='timed'?'selected':''}>Timed Buzz</option></select></div><div><label class="label" for="qtimer">Timer</label><select class="field" id="qtimer"><option value="default" ${q.timer==='default'?'selected':''}>Room default</option><option value="off" ${q.timer==='off'?'selected':''}>Off</option>${[5,10,15,20,30,60].map(n=>`<option value="${n}" ${String(q.timer)===String(n)?'selected':''}>${n} seconds</option>`).join('')}</select></div></div>${questionBehaviorFields(q,'q')}</details>${actionButton('Save question','save-question','btn full primary')}</div>`}inner=inner.replace(/^<h2>[^<]*<\/h2>/,'');return `<div class="overlay studio-modal-overlay" data-action="close-modal"><div class="modal studio-modal ${state.modal==='switch-play-mode'?'modal--switch':''} ${state.modal==='question'?'modal--question':''} ${(state.modal==='qr')?'modal--qr-clean':''}" role="dialog" aria-modal="true" aria-label="${safe(modalTitle())}"><div class="modal-head studio-modal-head"><h2>${safe(modalTitle())}</h2><button type="button" class="lb-close studio-close" data-action="close-modal" aria-label="Close dialog" title="Close">✕</button></div>${inner}</div></div>`}

function unifiedChevron(){return `<svg class="unified-chevron" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>`;}
function utcClock(ms){return new Date(ms).toLocaleTimeString('en',{hour:'2-digit',minute:'2-digit'});}
function ensureRound(){
 if(state.activeRound)return state.activeRound;
 const q=currentQ();
 state.activeRound={id:'round-'+gameNow()+'-'+Math.random().toString(36).slice(2,6),type:'question',number:state.countQuestion,source:state.quickQuestion?'Quick Play':'Prepared',sourceId:q.id,title:q.title||'Live question',text:q.text||'',image:q.image||'',mode:state.mode,timer:state.timer,seconds:state.seconds,correctPoints:state.correct,incorrectPoints:state.incorrect,textVisible:state.roundTextVisible,startTogether:state.roundStartTogether,startedAt:gameNow(),endedAt:null,status:'In progress',attempts:[],awards:[],scoresBefore:Object.fromEntries(state.players.map(p=>[p.id,p.score])),scoresAfter:null,archived:false};
 return state.activeRound;
}
function currentAttempt(){
 const r=ensureRound();
 let a=r.attempts.find(x=>x.number===state.attemptNumber);
 if(!a){a={number:state.attemptNumber,startedAt:state.startAt||gameNow(),buzzes:[]};r.attempts.push(a)}
 return a;
}
function finalizePreparedQuestion(movedOn=false){
 if(state.quickQuestion)return;
 const q=state.questions[state.qIndex];
 if(!q||q.played||!movedOn&&!state.questionShown&&state.startAt===null)return;
 if(!movedOn&&state.lastDecision!=='correct'){q.started=true;return;}
 q.played=true;q.active=false;q.playedOrder=++state.playedSequence;
 history('Prepared question played',q.title);
}
function roundNoOneLeft(){
 const active=activePlayers();
 return state.phase!=='open'&&!state.allowRepeat&&active.length>0&&active.every(p=>state.excluded.includes(p.id))&&state.buzzes.every(b=>state.buzzEvaluations?.[state.attemptNumber+':'+b.order]);
}
function roundDecided(){
 if(state.lastDecision==='correct')return true;
 if(state.phase==='open')return false;
 const graded=state.buzzes.every(b=>state.buzzEvaluations?.[state.attemptNumber+':'+b.order]);
 return roundNoOneLeft()||graded&&state.timer&&state.phase==='closed'&&state.remainingAtClose===0;
}
window.BuzzyRound={noOneLeft:()=>roundNoOneLeft(),decided:()=>roundDecided()};
function finishRound(reason){
 const r=state.activeRound;
 if(!r)return;
 if(!r.archived){r.archived=true;r.endedAt=gameNow();r.status=reason||'Completed';state.roundOverview.push(r)}
 else if(reason){r.status=reason;r.endedAt=r.endedAt||gameNow()}else if(reason==='Time expired'){r.status='Time expired'}
 r.scoresAfter=Object.fromEntries(state.players.map(p=>[p.id,p.score]));
}
function leaveRound(reason){finishRound(reason);state.activeRound=null}
window.BuzzyMoveQuestion=(from,to)=>moveQuestion(from,to);
function moveQuestion(from,to){
 const qs=state.questions;
 if(from<0||from>=qs.length||to<0||to>=qs.length||from===to)return;
  if((qs[from].played||qs[to].played))return;
 // FLIP the cards so the changed order is visible instead of jumping instantly.
 const before=new Map([...document.querySelectorAll('[data-question-drag]')].map(el=>[qs[Number(el.dataset.questionDrag)]?.id,el.getBoundingClientRect().top]));
 const currentId=!state.quickQuestion?currentQ().id:null;
 const [m]=qs.splice(from,1);qs.splice(to,0,m);
 if(currentId)state.qIndex=qs.findIndex(q=>q.id===currentId);
 history('Question order changed',`${m.title} moved to position ${to+1}`);
 render();
 if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
  document.querySelectorAll('[data-question-drag]').forEach(el=>{
   const oldTop=before.get(qs[Number(el.dataset.questionDrag)]?.id);
   if(oldTop==null)return;
   const delta=oldTop-el.getBoundingClientRect().top;
   if(Math.abs(delta)>1)el.animate([{transform:`translateY(${delta}px)`},{transform:'translateY(0)'}],{duration:260,easing:'cubic-bezier(.2,.8,.2,1)'});
  });
 }
}
function renderEnrichedRoundOverview(){
 const events=[...state.roundOverview];
 const done=events.filter(e=>e.type==='question'&&e.endedAt).length;const pending=events.filter(e=>e.type==='question'&&!e.endedAt).length;
 const contents=events.map((e,eventIndex)=>{
  if(e.type==='adjust'){
   return `<details data-overview-key="${safe(e.id||String(eventIndex))}" class="overview-entry overview-adjust"><summary><div class="overview-header"><div class="overview-headtext"><span class="overview-title">Manual adjustment</span><span class="overview-subtitle">${safe(e.playerName)}</span></div><span class="overview-chevron" aria-hidden="true">${unifiedChevron()}</span></div><div class="overview-line"><span class="overview-points ${e.delta>=0?'overview-positive':'overview-negative'}">${e.delta>0?'+':''}${e.delta} pts</span></div></summary><div class="overview-body"><p class="sm">${safe(e.playerName)}: ${e.before} → ${e.after} points</p><span class="muted sm">${safe(utcClock(e.when))}</span></div></details>`;
  }
  const correct=(e.awards||[]).filter(a=>a.result==='correct');
  const awards=(e.awards||[]).filter(a=>a.points!==0);
  const title=e.source==='Quick Play'?(e.text||'Spoken question'):e.title;
  const source=e.source|| (e.title==='Quick Question'?'Quick Play':'Prepared');
  const details=[`${e.mode==='timed'?'Timed Buzz':'First Buzz'}`,e.timer?`${e.seconds}s timer`:'No timer',`${(e.attempts||[]).length} attempt(s)`];
  const snapshot=typeof e.correctPoints==='number';
  const points=snapshot?`<span>Correct ${e.correctPoints>0?'+':''}${e.correctPoints}</span><span>Incorrect ${e.incorrectPoints>0?'+':''}${e.incorrectPoints}</span>`:'<span class="muted">Points configuration unavailable for this older entry</span>';
  const behavior=snapshot?`<span>Question text: ${e.textVisible?'Players and host':'Host only'}</span><span>Buzzer start: ${e.startTogether?'Together with question':'Separately by host'}</span>`:'';
  return `<details data-overview-key="${safe(e.id||String(eventIndex))}" class="overview-entry"><summary><div class="overview-header"><div class="overview-headtext"><span class="overview-title">Question ${e.number}</span><span class="overview-source">${safe(source)}</span><span class="overview-subtitle">${safe(title)}</span></div><span class="overview-chevron" aria-hidden="true">${unifiedChevron()}</span></div><div class="overview-line">${correct.length?`<span class="sm">★ ${safe([...new Set(correct.map(a=>a.name))].join(', '))}</span>`:''}${awards.length?awards.map(a=>`<span class="overview-points ${a.points>0?'overview-positive':'overview-negative'}">${safe(a.name)} ${a.points>0?'+':''}${a.points} pts</span>`).join(''):'<span class="muted sm">No points awarded</span>'}<span class="overview-status">${safe(e.status==='Time expired'?'Time expired':!e.endedAt?(correct.length?'Awaiting next question':'Awaiting scoring'):(correct.length?'Completed':'No winner'))}</span></div></summary><div class="overview-body"><div><strong>Question</strong><p class="sm" style="margin-top:5px">${safe(e.text||'Spoken question · No text entered')}</p>${e.image?`<img class="overview-image-preview" src="${safe(e.image)}" alt="Question image" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display='none';this.insertAdjacentText('afterend','Image unavailable')">`:''}</div><div class="overview-meta">${details.map(t=>`<span>${safe(t)}</span>`).join('')}</div><div class="overview-meta">${points}${behavior}</div><div class="overview-meta"><span>Finished: ${safe(e.status)}</span><span>${utcClock(e.startedAt)}${e.endedAt?' – '+utcClock(e.endedAt):''}</span></div>${(e.attempts||[]).map(a=>`<div class="overview-attempt"><strong class="sm">Attempt ${a.number}</strong>${a.buzzes.length?`<table class="overview-table"><thead><tr><th>Order / player</th><th>Time</th><th>Result</th></tr></thead><tbody>${a.buzzes.map(b=>`<tr><td>${b.order}. ${safe(b.name)}</td><td>${fmt(b.time)}</td><td>${b.result==='correct'?'✓ Correct':b.result==='incorrect'?'✕ Incorrect':'—'}${b.result?` (${b.points>0?'+':''}${b.points} pts)`:''}</td></tr>`).join('')}</tbody></table>`:'<span class="muted sm">No buzzes</span>'}</div>`).join('')}<div><strong class="sm">Scores after round</strong><div class="overview-meta">${state.players.map(p=>`<span>${safe(p.name)}: ${(e.scoresAfter||{})[p.id]??p.score}</span>`).join('')}</div></div></div></details>`;
 }).join('');
 return `<div class="stack"><div class="card gap12"><div class="overview-intro"><div><h2>Completed rounds</h2><p class="muted sm">${done} completed question${done===1?'':'s'}${pending?' · '+pending+' in progress':''}</p></div>${actionButton('<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg> Back to Play','go-play','btn sm')}</div><div class="overview-list">${contents||'<div class="inner muted sm">Completed questions and manual adjustments will appear here.</div>'}</div></div></div>`;
}
function renderRoundOverview(){return renderEnrichedRoundOverview();}

// Snapshot the face currently on the player's screen before returning to
// a fresh question or a Retry. The snapshot lasts only for the flip.
function captureReadyReturn(){
 ;
 const id=state.viewAs,button=$('#playercontent .phone .coin-buzzer');
 const rotor=button?.querySelector('.coin-rotor');
 if(!rotor)return;
 {
   // A return already underway or a face already labeled GET READY is not
   // a new departure state. Do not restart an old result-side flip.
   if(button.getAttribute('aria-label')==='Get ready'||rotor.classList.contains('coin-return-enter')){
     delete state.readyReturnById[id];
     return;
   }
 }
 const reversed=rotor.classList.contains('coin-flipped')||rotor.classList.contains('coin-enter')||rotor.classList.contains('coin-return-enter');
 const visible=rotor.querySelector(reversed?'.coin-back':'.coin-front');
 if(!visible)return;
 const label=visible.textContent.replace(/\s+/g,'').toUpperCase();
 if(label==='GETREADY'||(!label)){
   delete state.readyReturnById[id];
   return;
 }
 state.readyReturnById[id]={
   token:++state.readyReturnSerial,
   at:gameNow(),
   html:visible.innerHTML,
   classes:visible.className
 };
}
function resetCurrentRound(){captureReadyReturn();state.timeoutFlipSerial++;clearPlayerPanelsForPlay();state.buzzOrderOpenFor={};state.buzzOrderClosingFor={};state.buzzOrderShownFor={};state.focusTurnKey=null;state.clockStoppedAt=null;state.lastStampBuzzKey=null;state.startAt=null;state.endAt=null;state.buzzes=[];state.attempts=[];state.attemptNumber=1;state.excluded=[];state.winner=null;state.remainingAtClose=null;state.hostShowResults=false;state.shareLeaderboard=false;state.shareLeaderboardClosing=false;state.hostLeaderboardClosing=false;state.showResults=false;state.lastDecision=null;state.gradedBuzzKeys=[];state.selectedBuzzOrder=null;state.playerEffect=null;state.playerEffects={};state.buzzEvaluations={};state.pointerLastOrder=null;state.feedArrowShown=false;state.feedPreviousDecision=null;}
function startQuickQuestion(advanceNumber=true){finalizePreparedQuestion();stopQueuedJoinNoticesAfterCurrent();state.feedDecision=null;state.buzzOrderExpanded=false;state.pointerLastOrder=null;state.feedLastRenderedOrder=0;state.feedArrowShown=false;state.feedPreviousDecision=null;leaveRound(state.lastDecision==='correct'?'Correct answer':state.phase==='closed'&&state.timer&&state.remainingAtClose===0?'Time expired':'Ended by host');state.preloadExpanded=false;state.showQuickContent=false;state.quickQuestion={id:'quick-'+gameNow(),title:'Quick Question',text:'',image:'',points:state.roomCorrect,penalty:state.roomIncorrect,mode:'default',timer:'default',textVisibility:'visible',buzzerStart:'default',savedToLibrary:false};resolveQuestionBehavior(state.quickQuestion);state.mode=state.defaultMode;state.timer=state.roomTimer;state.seconds=state.roomSeconds;state.correct=state.roomCorrect;state.incorrect=state.roomIncorrect;state.phase='presented';resetCurrentRound();state.showCustomize=false;state.optionOpen=null;if(advanceNumber)state.countQuestion++;state.questionShown=false;promotePendingJoins();beginAutoPreload();state.hostTab='play';state.modal='';history(advanceNumber?'Quick Question created':'Quick Play selected',`Question ${state.countQuestion} · Spoken question · Not saved to library`);}
function loadQuestion(index,advanceNumber=true){if((index!==state.qIndex))finalizePreparedQuestion();stopQueuedJoinNoticesAfterCurrent();captureReadyReturn();clearPlayerPanelsForPlay();state.clockStoppedAt=null;state.lastStampBuzzKey=null;state.feedDecision=null;state.buzzOrderExpanded=false;state.pointerLastOrder=null;state.feedLastRenderedOrder=0;state.feedArrowShown=false;state.feedPreviousDecision=null;leaveRound(state.lastDecision==='correct'?'Correct answer':state.phase==='closed'&&state.timer&&state.remainingAtClose===0?'Time expired':'Ended by host');state.preloadExpanded=false;state.showQuickContent=false;state.quickQuestion=null;state.qIndex=index;state.showCustomize=false;state.optionOpen=null;state.lastDecision=null;state.gradedBuzzKeys=[];state.selectedBuzzOrder=null;state.playerEffect=null;state.playerEffects={};state.buzzEvaluations={};state.pointerLastOrder=null;let q=currentQ();resolveQuestionBehavior(q);state.mode=q.mode==='default'?state.defaultMode:q.mode;state.timer=q.timer==='default'?state.roomTimer:q.timer!=='off';state.seconds=q.timer==='default'?state.roomSeconds:Number(q.timer)||10;state.correct=q.points;state.incorrect=q.penalty;state.phase=q.text||q.image?'ready':'presented';state.startAt=null;state.buzzes=[];state.attempts=[];state.attemptNumber=1;state.excluded=[];state.winner=null;state.remainingAtClose=null;state.hostShowResults=false;state.shareLeaderboard=false;state.shareLeaderboardClosing=false;state.hostLeaderboardClosing=false;if(advanceNumber)state.countQuestion++;state.questionShown=false;promotePendingJoins();beginAutoPreload();}
function advanceQuestion(advanceNumber=true){
 finalizePreparedQuestion(true);
 if(state.quickQuestion){startQuickQuestion(advanceNumber);return true}
 const next=nextPreparedIndex(state.qIndex);
 if(next!==-1){
  loadQuestion(next,advanceNumber);
  history('Next prepared question',`Question ${state.countQuestion} · ${state.questions[next].title} · ${next+1}/${state.questions.length}`);
  state.hostTab='play';state.modal='';
  return true;
 }
 if(state.activeRound){finishRound(state.lastDecision==='correct'?'Correct answer':'Ended by host');state.activeRound=null;}
 state.modal='queue-finished';
 return false;
}
function startPreparedQuestions(advanceNumber=true){
 const first=nextPreparedIndex();
 if(first===-1){state.modal='';tip('No active prepared questions. Enable one in Questions.');queueMicrotask(()=>navigateHostTab('questions'));return false}
 loadQuestion(first,advanceNumber);state.hostTab='play';state.modal='';
 history('Prepared questions selected',`Started with ${state.questions[first].title}`);
 return true;
}
function switchPlayMode(mode){
 if((mode==='quick'&&state.quickQuestion)||(mode==='prepared'&&!state.quickQuestion))return;
 if(state.phase==='open'||state.buzzes.length){state.pendingPlayMode=mode;state.modal='switch-play-mode';return}
 if(mode==='quick')startQuickQuestion(false);else startPreparedQuestions(false);
}
function history(label,detail){state.history.push({label,detail,when:new Date().toLocaleTimeString('en',{hour:'2-digit',minute:'2-digit'})})}
function buzz(id){if(window.BuzzyNetwork&&!window.BuzzyNetwork.local)return window.BuzzyNetwork.buzz(id);state.feedDecision=null;state.feedPreviousDecision=null;let p=state.players.find(p=>p.id===id);if(!p||p.status!=='active')return tip('This player cannot buzz.');if(state.phase!=='open')return tip('Buzzers are not open.');if((!state.allowRepeat&&state.buzzes.some(b=>b.id===id))||state.excluded.includes(id))return tip('This player already buzzed.');let tm=state.startAt?Math.max(0,(gameNow()-state.startAt)/1000):0;let b={id,order:state.buzzes.length+1,time:tm};state.buzzes.push(b);state.lastStampBuzzKey=`${state.countQuestion}:${state.attemptNumber}:${id}:${b.order}`;currentAttempt().buzzes.push({id,name:p.name,order:b.order,time:b.time,result:null,points:0});if(state.mode==='timed'){if(state.selectedBuzzOrder===null)selectTimedBuzz(nextUngradedBuzz())}else state.selected=id;history('Buzz · '+p.name,`Question ${state.countQuestion} · ${state.mode==='first'?'First Buzz':'Timed Buzz'} · ${fmt(tm)} · Position ${b.order}`);if(state.sounds&&state.preview&&state.viewAs===p.id)playSound('buzz');if(state.mode==='first'){
 state.remainingAtClose=state.timer?remainingSec():null;state.phase='locked';stopPlayerClock();
}else if((state.mode==='timed')){
 const eligible=state.players.filter(x=>x.status==='active'&&!state.excluded.includes(x.id));
 if(eligible.length>0&&eligible.every(x=>state.buzzes.some(b=>b.id===x.id))){
  state.remainingAtClose=state.timer?remainingSec():null;
  state.phase='closed';stopPlayerClock();
  selectTimedBuzz(nextUngradedBuzz());
  history('All players buzzed','Automatic transition to judging · Question '+state.countQuestion);
 }
}render();animateBuzzLogos(id)}
let audioCtx;
function playSound(kind='buzz'){
 try{
  audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)();
  if(audioCtx.state==='suspended')audioCtx.resume().catch(()=>{});
  const base=audioCtx.currentTime+.008;
  function note(freq,offset,duration,wave='sine',level=.055,endFreq=null){
   const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=wave;o.frequency.setValueAtTime(freq,base+offset);
   if(endFreq)o.frequency.exponentialRampToValueAtTime(endFreq,base+offset+duration);
   g.gain.setValueAtTime(.0001,base+offset);g.gain.exponentialRampToValueAtTime(level,base+offset+.012);
   g.gain.exponentialRampToValueAtTime(.0001,base+offset+duration);
   o.connect(g).connect(audioCtx.destination);o.start(base+offset);o.stop(base+offset+duration+.015)
  }
  if(kind==='correct'){
   // A cheerful upward major arpeggio, followed by a bright finishing chord.
   note(523.25,0,.15,'sine',.06);note(659.25,.115,.18,'sine',.06);note(783.99,.225,.22,'sine',.07);
   note(1046.5,.33,.3,'triangle',.07);note(783.99,.33,.29,'sine',.025);
  }else if(kind==='incorrect'){
   // Short, intentionally grumpy dissonant descending buzz.
   note(242,0,.24,'sawtooth',.055,145);note(255,.035,.21,'square',.027,135);
   note(118,.22,.23,'sawtooth',.062,80);
  }else note(670,0,.12,'sine',.07,610);
 }catch(err){}
}

function grade(type){
 if((state.mode==='timed')&&state.phase==='open')return tip('Wait until buzzers close before grading.');
 let b=state.mode==='timed'?state.buzzes.find(x=>x.order===state.selectedBuzzOrder):state.buzzes.find(x=>x.id===state.selected);
 let p=b?state.players.find(x=>x.id===b.id):null;
 if(!p||!b)return tip('Select a player who buzzed.');
 const key=state.attemptNumber+':'+b.order;
 if(state.gradedBuzzKeys.includes(key))return tip('That buzz was already graded.');
 ;
 state.gradedBuzzKeys.push(key);
 const requestedPts=type==='correct'?state.correct:state.incorrect;
 const scoreBefore=p.score;
 p.score=applyScorePolicy(scoreBefore,requestedPts);
 let pts=p.score-scoreBefore;
 state.buzzEvaluations[key]=type;
 if(state.activeRound){const r=state.activeRound,a=r.attempts.find(a=>a.number===state.attemptNumber),entry=a?.buzzes.find(x=>x.id===b.id&&x.order===b.order);if(entry){entry.result=type;entry.points=pts;}r.awards.push({id:p.id,name:p.name,result:type,points:pts});r.scoresAfter=Object.fromEntries(state.players.map(p=>[p.id,p.score]));}
 state.lastDecision=type;
 state.feedResolved={question:state.countQuestion,attempt:state.attemptNumber,buzz:{...b},type,points:pts};
 state.feedDecision={buzz:{...b},type,points:pts,token:++state.effectSerial,startedAt:gameNow()};
 const feedToken=state.feedDecision.token;
 if(type==='incorrect'){
  // Keep the same 720ms double flash as Correct; on the LAST wrong
  // answer hold the settled red surface for a full additional second.
  const lastInQueue=!nextUngradedBuzz();
  const hold=lastInQueue?1720:850;setTimeout(()=>{if(state.feedDecision?.token===feedToken){state.feedPreviousDecision={...state.feedDecision};state.feedDecision=null;if((state.mode==='timed'))selectTimedBuzz(nextUngradedBuzz());render()}},hold);}
 state.playerEffects[p.id]={playerId:p.id,kind:type,points:pts,token:++state.effectSerial,before:scoreBefore,after:p.score};
 if(type==='incorrect'&&!state.allowRepeat&&!state.excluded.includes(p.id))state.excluded.push(p.id);
 if(state.preview&&state.viewAs===p.id&&state.answerSounds)playSound(type);
 // In this combined design demo, sound is NOT played on the host's device.
 // Production: deliver this score event only to the affected player's client;
 // that client plays its sound and animation if room settings permit.
 history(type==='correct'?'Correct · '+p.name:'Incorrect · '+p.name,`Question ${state.countQuestion} · ${pts>0?'+':''}${pts} points · Total ${p.score}`);
 state.remainingAtClose=state.timer?remainingSec():null;
 if(state.mode==='timed'){
  // In Timed Buzz, score the entire ranking without reopening or locking buzzers.
  // The host may still select any ungraded entry, but the oldest ungraded entry is next by default.
  if(type==='correct'){state.winner=p.id;selectTimedBuzz(b);if(state.phase==='open'){state.remainingAtClose=state.timer?remainingSec():null;state.phase='closed';stopPlayerClock()}}
  else ;
  tip(`${p.name}: ${pts>=0?'+':''}${pts} points${(type==='incorrect')&&nextUngradedBuzz()?' · Next player after feedback':state.selectedBuzzOrder!==null?' · Next player selected':''}`);
 }else if(type==='correct'){
  state.winner=p.id;
  state.phase='closed';
  stopPlayerClock();
  tip(`${p.name}: ${pts>=0?'+':''}${pts} points`);
 }else{
  if(!state.allowRepeat&&!state.excluded.includes(p.id))state.excluded.push(p.id);
  state.phase='locked';
  stopPlayerClock();
  tip(`${p.name}: ${pts} points`);
 }
 render();
}
function stopBuzzers(){
 if(state.phase!=='open')return;
 state.remainingAtClose=state.timer?remainingSec():null;
 state.phase='closed';{const round=ensureRound();if(!round.archived){round.archived=true;state.roundOverview.push(round)}round.status='Buzzers stopped · Awaiting scoring';round.scoresAfter=Object.fromEntries(state.players.map(p=>[p.id,p.score]));}stopPlayerClock();history('Buzzers closed',`Question ${state.countQuestion}`);
}
function clearPlayerPanelsForPlay(){
 ;
 state.buzzOrderExpanded=false;state.buzzOrderClosing=false;
 state.buzzOrderOpenFor={};state.buzzOrderClosingFor={};state.buzzOrderShownFor={};state.focusTurnKey=null;
 Object.keys(state.buzzOrderCloseSerialFor).forEach(id=>state.buzzOrderCloseSerialFor[id]++);
 state.playerLeaderboardOpen={};state.playerLeaderboardClosing={};
 state.leaderboardDismissed={};state.shareLeaderboard=false;state.shareLeaderboardClosing=false;
 state.lbShareSerial++;Object.keys(state.lbPlayerSerial).forEach(id=>state.lbPlayerSerial[id]++);
 state.leaderboardSnapshots={};
}
function openBuzz(){if(state.phase==='open')return;if(preloadPending())return tip('Wait for the question to finish preparing.');stopQueuedJoinNoticesAfterCurrent();state.timeoutFlipSerial++;clearPlayerPanelsForPlay();state.focusTurnKey=null;state.feedArrowShown=false;state.feedPreviousDecision=null;state.clockStoppedAt=null;state.lastStampBuzzKey=null;state.feedDecision=null;;state.phase='open';state.questionShown=true;ensureRound();state.startAt=gameNow();currentAttempt();state.endAt=state.startAt+state.seconds*1000;state.remainingAtClose=null;history('Buzzers opened',`Question ${state.countQuestion} · Attempt ${state.attemptNumber}`);render()}
function scheduleTimeoutFlip(){
 ;
 const serial=++state.timeoutFlipSerial;
 const question=state.countQuestion,attempt=state.attemptNumber,stopped=state.clockStoppedAt;
 const delay=Math.max(0,1000-(gameNow()-stopped));
 setTimeout(()=>{
  if(serial!==state.timeoutFlipSerial||question!==state.countQuestion||attempt!==state.attemptNumber||state.clockStoppedAt!==stopped||state.phase!=='closed'||state.remainingAtClose!==0)return;
  render();
 },delay+12);
}
function maybeExpire(){if(window.BUZZY_RUNTIME)return window.BuzzyNetwork?.maybeExpire?.();if(state.phase==='open'&&state.timer&&gameNow()>=state.endAt){state.remainingAtClose=0;state.phase='closed';stopPlayerClock();finishRound('Time expired');history('Time expired',`Question ${state.countQuestion} · ${state.buzzes.length} buzz(es)`);render();scheduleTimeoutFlip()}}

function closeStudioModal(){
 if(!state.modal)return false;
 const modal=state.modal;
 const overlay=document.querySelector('#modalroot .studio-modal-overlay');
 if(!overlay||reducedMotion){state.modal='';render();return true;}
 if(overlay.classList.contains('is-closing'))return true;
 overlay.classList.add('is-closing');
 window.setTimeout(()=>{if(state.modal===modal&&document.querySelector('#modalroot .studio-modal-overlay')===overlay){state.modal='';render();}},220);
 return true;
}

function handle(action){
 if(window.BuzzyNetwork?.handle(action))return;
 if(!state.devUi&&prototypeAction(action))return;
 if(action==='toggle-question-info'){
   ;
   const id=state.viewAs;
   const was=(state.playerQuestionInfoChoice[id]??state.showQuestionInfoDefault);
   const shown=!was;
   state.playerQuestionInfoChoice[id]=shown;
   const phone=$('#playercontent .phone');
   const button=phone?.querySelector('.qinfo-toggle');
   const details=phone?.querySelector('#player-q-details');
   phone?.classList.toggle('qinfo-expanded',shown);;
   if(button){button.setAttribute('aria-expanded',String(shown));button.setAttribute('aria-label',shown?'Hide question information':'Show question information');button.title=shown?'Hide question information':'Show question information'}
   if(details){if(shown)details.removeAttribute('aria-hidden');else details.setAttribute('aria-hidden','true')}
   return;
 }
 if(action==='lab-preview-latest-guest'){if(state.lastJoinedId){state.viewAs=state.lastJoinedId;state.preview=true;render()}else tip('Use New guest joins first.');return}
 if(action==='lab-timer-diagnostics'){
   const d=state.hostClockDiagnostics;
   tip(`Host timer: ${d.ticks} ticks · longest interval ${Math.round(d.longestTickGapMs)} ms · ${state.mode==='timed'?'Timed':'First'} Buzz`);
   return;
 }
 if(action==='lab-toggle-score-tools'){state.labScoreTools=!state.labScoreTools;render();return}
 if(action==='lab-switch-view'){state.preview=!state.preview;render();return}
 if(action==='lab-host-view'||action==='lab-player-view'){state.preview=action==='lab-player-view';render();return}
 if(action==='lab-score-p1'){const p=state.players[0];p.score+=1;history('Demo score update',p.name+' +1');render();return}
 if(action==='lab-score-p2'){const p=state.players[1];p.score+=2;history('Demo score update',p.name+' +2');render();return}
 if(action==='toggle-share-leaderboard'){setLeaderboardShare(!state.shareLeaderboard);return}
 if(action==='demo-timeout'){
  state.modal='';state.buzzes=[];state.gradedBuzzKeys=[];state.playerEffects={};state.excluded=[];state.feedDecision=null;
  state.phase='closed';state.timer=true;state.seconds=10;state.startAt=gameNow()-10000;state.endAt=gameNow();state.remainingAtClose=0;state.clockStoppedAt=gameNow();state.lastDecision=null;render();scheduleTimeoutFlip();return;
 }
 if(action==='demo-wait'){
  state.modal='';state.mode='first';state.phase='presented';state.buzzes=[];state.excluded=[state.viewAs];state.allowRepeat=false;state.playerEffects={};state.feedDecision=null;state.lastDecision='incorrect';state.remainingAtClose=null;state.startAt=null;state.selectedBuzzOrder=null;state.selected=null;render();return;
 }
 if(action==='demo-turn'){
  state.modal='';state.mode='first';state.excluded=[];state.playerEffects={};state.lastDecision=null;state.feedDecision=null;
  state.buzzes=[{id:state.viewAs,order:1,time:.482}];state.selected=state.viewAs;state.phase='locked';state.remainingAtClose=7;state.startAt=gameNow()-3000;state.clockStoppedAt=gameNow();render();return;
 }
 if((action==='request-skip')&&!state.quickQuestion){state.modal='skip-confirm';render();return;}
 if((action==='confirm-skip')){state.modal='';const skippedBeforeStart=!state.questionShown&&state.startAt===null;if(skippedBeforeStart){const q=state.questions[state.qIndex];if(q&&!q.played){q.active=false;q.skipped=true;history('Prepared question skipped',q.title+' · Not played');}}advanceQuestion(!skippedBeforeStart);render();return;}
 if(action==='next-quick'||action==='next-question'){
   if(state.phase==='open'||(state.buzzes.length&&state.lastDecision!=='correct'&&!roundDecided())){state.modal='next-confirm';render();return}
   advanceQuestion();render();return;
 }
 if(action==='finish-set'){finalizePreparedQuestion(true);finishRound(state.phase==='closed'&&state.timer&&state.remainingAtClose===0?'Time expired':state.lastDecision==='correct'?'Correct answer':'Ended by host');state.modal='queue-finished';render();return}
 if(action.startsWith('set-play-mode:')){
   const mode=action.split(':')[1];
   if(mode==='quick'&&state.quickQuestion){
    if(state.phase==='open'||state.buzzes.length){tip('Finish the current round before changing content.');return}
    if(state.showQuickContent&&!commitQuickContent())return;
    state.showQuickContent=!state.showQuickContent;state.quickContentTransition=true;
   } else {
     const before=!!state.quickQuestion;
     if((state.phase!=='open')&&!state.buzzes.length){++state.preloadGeneration;state.preloadExpanded=false;state.preload=null;}
     {state.playModeTransition=mode;state.modeTransitionUntil=gameNow()+310;}
     state.modeSwitchBatching=true;
     try{switchPlayMode(mode);}finally{state.modeSwitchBatching=false;}
     if(before!==!!state.quickQuestion){;}
     else{state.playModeTransition=null;}
   }
   render();return;
 }
 if(action==='save-quick-content'){if(!commitQuickContent())return;state.showQuickContent=false;render();return}
 if(action==='preload-anyway'){if(gameNow()-state.preloadStartedAt<5000)return;state.preloadBypass=true;history('Preload bypassed',`Question ${state.countQuestion}`);render();return}
 if(action==='confirm-play-mode'){const mode=state.pendingPlayMode;state.pendingPlayMode=null;state.modal='';{++state.preloadGeneration;state.preload=null;state.preloadExpanded=false;}{state.playModeTransition=mode;state.modeTransitionUntil=gameNow()+310;}state.modeSwitchBatching=true;try{if(mode==='quick')startQuickQuestion(false);else if(mode==='prepared')startPreparedQuestions(false);}finally{state.modeSwitchBatching=false;};render();return}

 
 if(action==='switch-mode'){
   if(state.phase==='open'||state.buzzes.length||['locked','closed'].includes(state.phase))return tip('Change buzzer mode before the round starts.');
   state.mode=state.mode==='first'?'timed':'first';state.optionOpen=null;if(patchHostQuickControls(true))return;render();return;
 }
 if(action.startsWith('option:')){state.optionOpen=state.optionOpen===action.split(':')[1]?null:action.split(':')[1];if(patchHostQuickControls())return;render();return}
 if(action==='close-option'){state.optionOpen=null;if(patchHostQuickControls())return;render();return}
 if(action.startsWith('set-timer:')){
   if(state.phase==='open'||state.buzzes.length||['locked','closed'].includes(state.phase))return tip('Set the timer before the round starts.');
   const sec=Number(action.split(':')[1]);state.timer=sec>0;if(sec>0)state.seconds=sec;state.optionOpen=null;if(patchHostQuickControls(true))return;render();return;
 }
 if(action.startsWith('toggle-settings-section:')){toggleSettingsSection(action.split(':')[1]);return;}
 if(action.startsWith('move-question:')){const [,from,offset]=action.split(':');const ix=Number(from),direction=Number(offset);let to=ix+direction;{while(to>=0&&to<state.questions.length&&state.questions[to].played)to+=direction;}moveQuestion(ix,to);return}if(action==='round-overview'){state.roundOverviewOpen=true;state.roundOverviewClosing=false;render();return}if(action==='close-round-overview'||action==='go-play'&&state.roundOverviewOpen){closeRoundOverview();return}if(action==='go-more'){state.hostTab='more';render();return}if(action==='go-play'){state.hostTab='play';render();return}if(action==='toggle-preload'){state.preloadExpanded=!state.preloadExpanded;render();return;}if(action==='toggle-customize'){state.showCustomize=!state.showCustomize;render();return;}if(action==='quick-question'){if(state.phase==='open'||state.buzzes.length){state.modal='quick-confirm';render();return;}startQuickQuestion();render();return;}if(action==='confirm-quick'){startQuickQuestion();render();return;}if(action==='confirm-next'){state.pendingPlayMode=null;advanceQuestion();render();return;}if(action==='browse-questions'){state.modal='';state.hostTab='questions';render();window.scrollTo({top:0,behavior:'instant'});requestAnimationFrame(()=>{if(state.hostTab==='questions'&&!state.modal)document.querySelector('.nav [data-nav="questions"]')?.focus({preventScroll:true});});return;}if(action==='edit-quick'){if(!state.quickQuestion)return; if(state.phase==='open'||state.buzzes.length)return tip('Finish the current round before editing the question.');state.modal='quick-edit';render();return;}if(action==='apply-quick'){if(!state.quickQuestion)return;let text=$('#quick-text').value.trim(),image=$('#quick-image').value.trim();if(image&&!/^https?:\/\//i.test(image))return tip('Image URL must start with http:// or https://');Object.assign(state.quickQuestion,{title:'Quick Question',text,image});setQuestionBehaviorFromFields(state.quickQuestion,'quick');resolveQuestionBehavior(state.quickQuestion);state.preloadExpanded=false;state.modal='';state.phase=text||image?'ready':'presented';beginAutoPreload();history('Quick Question updated',`Question ${state.countQuestion} · ${text||image?'Automatic preload started':'Spoken question ready'}`);render();return;}if(action==='toggle-preview'){state.preview=!state.preview;render();window.scrollTo(0,0);return}if(action==='present-and-open'){if(preloadPending())return tip('Wait for players to load the question.');if(!togetherStartAvailable()||!['ready','preloaded'].includes(state.phase))return;openBuzz();return;}if(action==='present'){if(preloadPending())return tip('Wait for players to load the question.');clearPlayerPanelsForPlay();state.phase='presented';state.questionShown=true;ensureRound();}else if(action==='open')openBuzz();else if(action==='close'){if((state.phase==='open')){state.modal='stop-buzzers-confirm';render();return;}stopBuzzers()}else if(action==='confirm-stop-buzzers'){state.modal='';stopBuzzers()}else if(action==='reset'){captureReadyReturn();clearPlayerPanelsForPlay();if(retryBlocked())return tip('No eligible players to retry question.');state.attempts.push({number:state.attemptNumber,buzzes:[...state.buzzes]});state.buzzes=[];state.selectedBuzzOrder=null;state.attemptNumber++;state.remainingAtClose=null;state.clockStoppedAt=null;state.lastStampBuzzKey=null;state.phase='presented';state.lastDecision=null;state.playerEffect=null;state.playerEffects={};state.buzzEvaluations={};state.pointerLastOrder=null;history('Buzzers reset',`Question ${state.countQuestion} · New attempt ${state.attemptNumber}`)}else if(action==='next'){advanceQuestion();tip(state.quickQuestion?'Next spoken question is ready.':'Next prepared question is ready.')}else if(action==='simulate'){let ids=state.players.filter(p=>p.status==='active'&&!state.excluded.includes(p.id)&&!state.buzzes.some(b=>b.id===p.id));if(!ids.length)return tip('All eligible players already buzzed.');buzz(ids[0].id);return}else if(action.startsWith('buzz:')){buzz(action.split(':')[1]);return}else if(action==='correct'||action==='incorrect'){grade(action);return}else if(action.startsWith('manage:')){state.modal=action}else if(action.startsWith('kick:')){let id=action.split(':')[1],p=state.players.find(p=>p.id===id);p.status='kicked';state.modal='';history('Player kicked',p.name);tip(`${p.name} can rejoin with the room code.`)}else if(action.startsWith('rejoin:')){let p=state.players.find(p=>p.id===action.split(':')[1]);p.status='active';beginAutoPreload();history('Player rejoined',p.name)}else if(action==='simulate-join'){simulateGuestJoin();return;}else if(action.startsWith('ban:')){let id=action.split(':')[1],p=state.players.find(p=>p.id===id);p.status='banned';state.modal='';history('Player banned',p.name);tip(`${p.name} banned for this session.`)}else if(action.startsWith('unban:')){let p=state.players.find(p=>p.id===action.split(':')[1]);p.status='active';history('Player unbanned',p.name);tip(`${p.name} can rejoin.`)}else if(action.startsWith('adjust:')){state.modal=action}else if(action.startsWith('apply-adjust:')){let p=state.players.find(p=>p.id===action.split(':')[1]);let delta=Number($('#adjustval').value);if(!Number.isFinite(delta))return tip('Enter a valid number.');const scoreBefore=p.score;p.score=applyScorePolicy(scoreBefore,delta);const actualDelta=p.score-scoreBefore;state.roundOverview.push({id:'adjust-'+gameNow()+'-'+p.id,type:'adjust',playerId:p.id,playerName:p.name,delta:actualDelta,requestedDelta:delta,before:scoreBefore,after:p.score,when:gameNow()});if(actualDelta!==0){state.playerEffects[p.id]={playerId:p.id,manual:true,kind:actualDelta>0?'correct':'incorrect',points:actualDelta,token:++state.effectSerial,before:scoreBefore,after:p.score};if(state.preview&&state.viewAs===p.id&&state.answerSounds)playSound(actualDelta>0?'correct':'incorrect');}history('Manual adjustment · '+p.name,`${actualDelta>0?'+':''}${actualDelta} points${actualDelta!==delta?' (requested '+delta+', zero floor applied)':''}`);state.modal='';tip('Score updated.');}else if(action==='qr'){state.modal='qr'}else if(action==='new-question'){state.editing=null;state.modal='question'}else if(action.startsWith('edit-question:')){state.editing=Number(action.split(':')[1]);state.modal='question'}else if(action==='save-question'){if($('#qimage').value.trim()&&!/^https?:\/\//i.test($('#qimage').value.trim()))return tip('Image URL must start with http:// or https://');let typedTitle=$('#qtitle').value.trim();let questionText=$('#qtext').value.trim();let title=typedTitle||((questionText?questionText.slice(0,46)+(questionText.length>46?'…':''):'Question '+(state.editing===null?state.questions.length+1:state.editing+1)));let item={id:state.editing===null?'q'+gameNow():state.questions[state.editing].id,title,text:$('#qtext').value,image:$('#qimage').value,points:Number($('#qpoints').value)||0,penalty:Number($('#qpenalty').value)||0,answer:($('#qanswer')?.value||'').trim(),mode:$('#qmode').value,timer:$('#qtimer').value,textVisibility:$('#qvisibility')?.value||(state.editing===null?'default':state.questions[state.editing].textVisibility||'default'),buzzerStart:$('#qstart')?.value||(state.editing===null?'default':state.questions[state.editing].buzzerStart||'default'),viewerContent:$('#qviewer')?.value||(state.editing===null?'same':state.questions[state.editing].viewerContent||'same')};if(state.editing===null)state.questions.push({...item,active:true,played:false});else state.questions[state.editing]={...state.questions[state.editing],...item};if(!state.quickQuestion&&state.editing===state.qIndex&&['ready','preloaded','presented'].includes(state.phase)&&!state.questionShown){resolveQuestionBehavior(currentQ());beginAutoPreload();};state.modal='';tip('Question saved to this room.') }else if(action.startsWith('toggle-question:')){let index=Number(action.split(':')[1]);let q=state.questions[index];if(!q)return;const active=q.active!==false&&!q.played;q.active=!active;if(!active)q.played=false;history(active?'Prepared question disabled':'Prepared question enabled',q.title);tip(`${q.title} ${active?'disabled':'enabled'}.`)}else if(action==='show-scores'){
 if(state.hostShowResults){closeLeaderboardHost();return;}
 state.hostShowResults=true;state.hostLeaderboardClosing=false;state.shareLeaderboard=false;state.shareLeaderboardClosing=false;state.leaderboardDismissed={};
 state.leaderboardGeneration.host++;state.leaderboardSnapshots.host=null;
 history('Host leaderboard opened','Local host view only');
 }else if(action==='dismiss-leaderboard'){dismissPlayerLeaderboard();return;
 }else if(action==='player-leaderboard'){
  if(state.playerLeaderboardClosing[state.viewAs])return;
  if(playerLeaderboardVisible(me()||state.players[0])){dismissPlayerLeaderboard();return}
  if(!state.leaderboard)return;
  state.playerLeaderboardOpen[state.viewAs]=true;state.leaderboardGeneration[state.viewAs]=(state.leaderboardGeneration[state.viewAs]||0)+1;
  delete state.leaderboardSnapshots[state.viewAs];
 }else if(action==='open-buzz-order'){if(state.phase!=='open'&&state.buzzes.length&&state.playerBuzzOrder){const id=state.viewAs;state.buzzOrderOpenFor[id]=true;state.buzzOrderClosingFor[id]=false;state.buzzOrderShownFor[id]=false;}}else if(action==='close-buzz-order'){closeBuzzOrder();return;}else if(action==='test-correct-sound'){playSound('correct');tip('Correct answer sound.')}else if(action==='test-incorrect-sound'){playSound('incorrect');tip('Incorrect answer sound.')}else if(action==='history'){state.modal='history'}else if(action==='close-modal'){if(closeStudioModal())return;;state.modal=''}else if(action==='celebrate'){if(state.celebration)confetti();else tip('Celebration effects are disabled.')}else if(action==='copy-link'){let u='https://buzzy.example/r/'+state.code;navigator.clipboard?.writeText(u).then(()=>tip('Copied sample URL (not a live room).'),()=>tip('Example: '+u))||tip('Example: '+u)}else if(action==='export-history'){let blob=new Blob([JSON.stringify({room:state.code,history:state.history,roundOverview:state.roundOverview},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='buzzy-room-history.json';a.click();URL.revokeObjectURL(url);return}render()}
// #218: An interrupt-safe exit for the editor only; other modal actions are unchanged.

function updateClocks(){document.querySelectorAll('[data-clock]').forEach(el=>{el.textContent=state.timer?formatRemaining():'NO TIMER'});
 document.querySelectorAll('[data-player-clock]').forEach(el=>{
   const view=playerClockVisual(el.dataset.playerClock);
   el.textContent=view.text;
   el.style.visibility=view.visible?'visible':'hidden';
   if(!el.classList.contains('clock-fade-away'))el.style.opacity=String(view.opacity);
 });let ex=$('#expiry');if(ex){if(window.BUZZY_RUNTIME){ex.textContent='Until ended';return;}let left=Math.max(0,14*86400000-(gameNow()-state.created)),days=Math.ceil(left/86400000);ex.textContent=days+'d'}}
document.addEventListener('keydown',e=>{
 if((e.key==='Enter'||e.key===' ')&&e.target.matches('.coin-buzzer[aria-disabled="true"]'))e.preventDefault();
});
document.addEventListener('click',e=>{if(!state.devUi&&e.target.closest('.lab-row,.lab-score-float'))return;let a=e.target.closest('[data-action]');if(a){if(!activeDialogKey){modalReturnFocus=a;modalReturnAction=a.dataset.action||null;}if(a.disabled||a.getAttribute('aria-disabled')==='true')return;if(!state.devUi&&prototypeAction(a.dataset.action||''))return;if(a.dataset.action?.startsWith('toggle-settings-section:'))e.preventDefault();if((a.classList.contains('overlay')||a.classList.contains('player-list-overlay')||a.classList.contains('host-leaderboard-overlay')||a.classList.contains('round-overview-overlay'))&&e.target!==a)return;handle(a.dataset.action);return}let nav=e.target.closest('[data-nav]');if(nav){state.navFromTab=state.hostTab;navigateHostTab(nav.dataset.nav);return}let mode=e.target.closest('[data-mode]');if(mode){if(state.phase!=='open'&&!state.buzzes.length){state.mode=mode.dataset.mode;render()}return}let points=e.target.closest('[data-points]');if(points){let [k,v]=points.dataset.points.split(':');state[k]=Number(v);if(state.optionOpen===k)state.optionOpen=null;if(patchHostQuickControls(true))return;render();return}let pick=e.target.closest('[data-pick]');if(pick){if(pick.disabled)return;;const order=Number(pick.dataset.buzzOrder);if(state.mode==='timed'){selectTimedBuzz(state.buzzes.find(b=>b.order===order))}else state.selected=pick.dataset.pick;render();return}});
let quickImagePreviewTimer;document.addEventListener('input',e=>{if(['quick-image','qimage'].includes(e.target?.id)){clearTimeout(quickImagePreviewTimer);quickImagePreviewTimer=setTimeout(e.target.id==='qimage'?updatePreparedImagePreview:updateQuickImagePreview,350);}});

 document.addEventListener('click',e=>{if(e.target.closest('summary,.qinfo-toggle,.play-mode-option,.preload-head-btn,.preload-details-btn'))requestAnimationFrame(()=>requestAnimationFrame(syncBuzzyChevrons));});

document.addEventListener('click',e=>{
 const summary=e.target.closest('.quick-behavior-options > summary');
 if(!summary)return;
 e.preventDefault();
 const details=summary.parentElement;
 if(details._buzzyDisclosureAnimation)details._buzzyDisclosureAnimation.cancel();
 const before=details.getBoundingClientRect().height;
 const willOpen=!state.quickBehaviorOptionsOpen;
 state.quickBehaviorOptionsOpen=willOpen;
 details.open=true;
 const full=details.getBoundingClientRect().height;
 const style=getComputedStyle(details);
 const collapsed=summary.getBoundingClientRect().height+parseFloat(style.paddingTop||0)+parseFloat(style.paddingBottom||0)+parseFloat(style.borderTopWidth||0)+parseFloat(style.borderBottomWidth||0);
 if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){details.open=willOpen;details.style.overflow='';return;}
 const target=willOpen?Math.max(full,before):collapsed;
 details.style.overflow='hidden';
 const anim=details.animate([{height:before+'px'},{height:target+'px'}],{duration:260,easing:'cubic-bezier(.22,.8,.2,1)'});
 details._buzzyDisclosureAnimation=anim;
 const panel=details.querySelector('.question-behavior-grid');
 if(panel)panel.animate(willOpen?[{opacity:0,transform:'translateY(-4px)'},{opacity:1,transform:'translateY(0)'}]:[{opacity:1},{opacity:0}],{duration:willOpen?210:170,easing:'ease-out'});
  anim.addEventListener('finish',()=>{if(details._buzzyDisclosureAnimation!==anim)return;details.open=willOpen;details.style.overflow='';details._buzzyDisclosureAnimation=null;syncBuzzyChevrons();},{once:true});
},true);
let draggedQuestion=-1;document.addEventListener('dragstart',e=>{const item=e.target.closest('[data-question-drag]');if(!item)return;draggedQuestion=Number(item.dataset.questionDrag);e.dataTransfer?.setData('text/plain',String(draggedQuestion));});document.addEventListener('dragover',e=>{const item=e.target.closest('[data-question-drag]');if(item)e.preventDefault()});document.addEventListener('drop',e=>{const item=e.target.closest('[data-question-drag]');if(item&&draggedQuestion>=0){e.preventDefault();moveQuestion(draggedQuestion,Number(item.dataset.questionDrag));draggedQuestion=-1;}});document.addEventListener('dragend',()=>{draggedQuestion=-1});
document.addEventListener('change',e=>{let t=e.target;if(!state.devUi&&t.closest('.lab-row,.lab-score-float'))return;if(t.matches('[data-player-sort]')){state.playerSort=t.value;render();return;}if(t.matches('[data-library-filter]')){state.questionAvailabilityFilter=t.value;render();return;}if(t.matches('[data-share-leaderboard]')){setLeaderboardShare(t.checked);return}
 if(t.dataset.roundBehavior){
   const editingAllowed=state.phase!=='open'&&!state.buzzes.length&&!state.questionShown&&!['locked','closed'].includes(state.phase);
   if(!editingAllowed){tip('Finish this round before changing question settings.');render();return;}
   if(t.dataset.roundBehavior==='visibility')state.roundTextVisible=t.value!=='host';
   if(t.dataset.roundBehavior==='start')state.roundStartTogether=t.value==='together';
   if(t.dataset.roundBehavior==='viewer')state.roundViewerHidden=t.value==='hide';
   // Changing visibility can change the content actually shown, but never saves to the library.
   render();return;
 }
 if(t.dataset.durationChoice==='room'){
   if(t.value==='custom'){state.roomCustomDurationSelected=true;}
   else{const n=validCustomDuration(t.value);if(n===null)return;state.roomCustomDurationSelected=false;state.roomSeconds=n;}
   render();return;
 }
 if(t.dataset.durationCustom){
   const n=validCustomDuration(t.value);
   if(n===null){tip('Enter a whole number from 1 to 600 seconds.');t.value=t.dataset.durationCustom==='room'?(state.roomSeconds):state.seconds;return;}
   if(t.dataset.durationCustom==='room'){
     state.roomCustomDurationSelected=true;
     state.roomSeconds=n;
   }else{
     if(state.phase==='open'||state.buzzes.length||['locked','closed'].includes(state.phase)){tip('Set the timer before the round starts.');return;}
     state.timer=true;state.seconds=n;
   }
   if(t.dataset.durationCustom==='play'&&patchHostQuickControls(true))return;
   render();return;
 }
 if(t.hasAttribute('data-question-timer')){state.timer=t.value==='on';render();return;}else if(t.hasAttribute('data-question-duration')){state.seconds=Number(t.value);render();return;}else if(t.dataset.toggle){state[t.dataset.toggle]=t.checked;if(t.dataset.toggle==='timer')state.roomTimer=t.checked;if(!updateSettingsInPlace(t))render()}else if(t.dataset.select){state[t.dataset.select]=['seconds','roomSeconds'].includes(t.dataset.select)?Number(t.value):t.value;if(t.dataset.select==='seconds')state.roomSeconds=Number(t.value);if(['seconds','roomSeconds'].includes(t.dataset.select))state.roomCustomDurationSelected=false;render()}else if(t.dataset.settingNumber){if(!t.value.trim())return;let n=Number(t.value);if(Number.isFinite(n)){const key=t.dataset.settingNumber;state[key]=n;if(state.optionOpen===key)state.optionOpen=null;if(patchHostQuickControls(true))return;}render()}});
window.addEventListener('keydown',e=>{
 if(e.key==='Enter'&&e.target?.id==='fact-custom-score'){
   e.preventDefault();const val=e.target.value.trim(),key=e.target.dataset.settingNumber;
   if(!val)return;
   const points=Number(val);
   if(Number.isFinite(points)){state[key]=points;state.optionOpen=null;if(!patchHostQuickControls(true))render()}
   return;
 }
 if(e.key==='Escape'&&state.optionOpen){state.optionOpen=null;if(!patchHostQuickControls())render()}
});window.BuzzyView={state,render,handle,tip,currentQ,resolveQuestionBehavior,ensureRound,currentAttempt,finishRound,resetCurrentRound,clearPlayerPanelsForPlay,advanceQuestion,startQuickQuestion,loadQuestion,startPreparedQuestions,playSound,animateBuzzLogos,scheduleTimeoutFlip,selectTimedBuzz,nextUngradedBuzz,showJoinAnnouncement,confetti};
let previousHostTimerTick=performance.now();setInterval(()=>{const t=performance.now();if((state.phase==='open')){const d=state.hostClockDiagnostics;d.ticks++;d.longestTickGapMs=Math.max(d.longestTickGapMs,t-previousHostTimerTick);}previousHostTimerTick=t;maybeExpire();updateClocks()},150);history('Quick Play ready','Question 1 · Spoken question ready · No library entry');beginAutoPreload();render();
})();
