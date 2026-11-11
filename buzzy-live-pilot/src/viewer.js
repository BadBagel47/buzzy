// #347/#352/#354: read-only viewer screen for a TV or projector.
// It shows only question-related state chosen by the host and never writes game state;
// its only write is its own registration in one of four viewer seats.
import {getClient} from './client.js';
import {createCelebration} from './celebration.js';

const root=document.getElementById('viewer'),statusNode=document.getElementById('viewer-status');
const params=new URL(location.href).searchParams,code=String(params.get('room')||'').toUpperCase();
const viewerKeys=['viewerQuestion','viewerTimer','viewerBuzzOrder','viewerLeaderboard','viewerCelebration'];
let client,latest=null,stopWatch=null,stopOwn=null,registering=null,connected=false,ended=false,celebrationId=null,timerHandle=0,qrKey='',qrGeneration=0;
let built=false,mode='',questionKey='',timerKey='',knownPlayers=null,swapTimer=0,imageSrc='';
const seenOk=new Set(),el={};
const celebration=createCelebration(()=>enabled('viewerCelebration')&&latest?.settings?.celebration!==false);
// Missing host choices count as on, so an older host page still produces a useful screen.
function enabled(key){return latest?.settings?.[key]!==false;}
function setStatus(text,{error=false}={}){
 document.documentElement.toggleAttribute('data-viewer-ready',!text);
 statusNode.hidden=!text;statusNode.dataset.error=String(error);statusNode.querySelector('.viewer-status-text').textContent=text||'';
}
function joinUrl(){return `${location.origin}/?room=${code}`;}
const $=(sel,scope=root)=>scope.querySelector(sel);

function build(){
 root.innerHTML=`<div class="topbar" id="topbar"><div class="room">Room <strong></strong></div></div>
<section class="view" id="v-game" aria-label="Game">
 <div class="main" id="main">
  <div class="stage" id="stage">
   <p class="qnum" id="qnum"></p>
   <div class="qimg" id="qimg"><img id="qimgel" alt="Question image" referrerpolicy="no-referrer"></div>
   <h1 class="qtext" id="qtext"></h1>
   <div class="timer-slot" id="timer"><div class="ring"><svg viewBox="0 0 100 100" aria-hidden="true"><circle class="track" cx="50" cy="50" r="46"/><circle class="bar" id="bar" cx="50" cy="50" r="46"/></svg><div class="num" id="num" role="timer"></div></div></div>
  </div>
  <aside class="panel buzzes" id="buzzes" aria-label="Buzz order"><h2>Buzz order</h2><div class="bvp" id="bvp"><ol id="buzzlist"></ol></div></aside>
 </div>
 <div class="strip" id="strip" aria-label="Buzzes"><div class="smask" id="smask"><ol id="striplist"></ol></div></div>
</section>
<section class="view" id="v-off" aria-label="Viewer off"><div class="logo-big" aria-label="Buzzy">buzzy<span>.</span></div></section>
<section class="view" id="v-lb" aria-label="Leaderboard"><div class="lbwrap"><h1>Leaderboard</h1><div class="lb"><ol id="lblist"></ol></div></div></section>
<section class="view" id="v-join" aria-label="Join"><div class="join" aria-labelledby="viewer-join-title"><h1 id="viewer-join-title">Join the game</h1>
 <div class="jbody"><div class="qr" id="qr" role="img" aria-label="QR code for joining this room"></div>
  <div class="jtext"><p class="jstep">Scan the QR code, or go to</p><p class="jurl"></p><p class="jstep">and enter the room code</p><p class="jcode"></p></div></div>
 <div class="joined"><div class="cnt"><b id="jcount">0</b> <span id="jlabel">players joined</span></div><div class="chips" id="chips"></div></div></div></section>
<div class="notes" id="notes" aria-live="polite"></div>`;
 $('.room strong').textContent=code;$('.jurl').textContent=location.host;$('.jcode').textContent=code;
 for(const id of ['topbar','v-off','v-game','v-lb','v-join','main','stage','qnum','qimg','qimgel','qtext','timer','bar','num','buzzes','bvp','buzzlist','strip','smask','striplist','lblist','chips','jcount','jlabel','notes','qr'])el[id]=document.getElementById(id);
 el.qimgel.addEventListener('error',()=>{el.qimg.classList.remove('on');el.stage.classList.remove('has-img');});
 built=true;
}

function questionFor(value){
 const c=value.control,p=value.presentation;
 return p&&p.r===c.r&&p.a===c.a?p:null;
}
function eligiblePlayers(value){
 const c=value.control;
 return value.players.filter(p=>p.status==='active'&&(c.allowRepeat===true||!value.round.excluded.includes(p.id)));
}
// The countdown only shows while buzzers are open, time remains and someone can still buzz.
function timerState(value){
 const c=value.control,round=value.round;
 if(!enabled('viewerTimer')||c.timer===false||c.phase!=='open'||round.phase==='locked'||!c.startedAt)return null;
 const end=c.startedAt+c.ms,left=end-client.serverNow();if(left<=0)return null;
 if(c.mode==='timed'){const eligible=eligiblePlayers(value);if(eligible.length&&eligible.every(p=>round.buzzes.some(b=>b.playerId===p.id)))return null;}
 return {key:`${c.r}_${c.a}_${c.startedAt}`,left,ms:c.ms};
}
function qSize(length,image){return image?(length<=50?6.4:length<=100?5.4:4.6):(length<=50?9.6:length<=100?7.4:length<=150?6.1:5);}
function renderQuestion(value,timer){
 const c=value.control,q=questionFor(value),shown=c.phase!=='ready'||!!q?.shown;
 el.qnum.textContent=`Question ${c.r}${c.a>1?` · Attempt ${c.a}`:''}`;el.qnum.hidden=latest.settings?.viewerQuestionNumber===false;
 const key=`${c.r}_${c.a}`;
 if(questionKey&&questionKey!==key){el.stage.classList.add('swap');clearTimeout(swapTimer);swapTimer=setTimeout(()=>el.stage.classList.remove('swap'),700);}
 questionKey=key;
 const text=enabled('viewerQuestion')&&shown&&q?.textVisible&&q?.text?q.text:'',image=enabled('viewerQuestion')&&shown&&q?.image?q.image:'';
 const waiting=!shown||!q;
 let content=text,muted=false;
 if(waiting){content='Get ready for the next question';muted=true;}
 else if(!enabled('viewerQuestion')){content='';}
 else if(!text&&!image){content='Listen to the host';muted=true;}
 el.qtext.textContent=content;el.qtext.hidden=!content;el.qtext.classList.toggle('muted',muted);
 const hasImage=!!image&&!waiting;
 if(hasImage&&imageSrc!==image){imageSrc=image;el.qimgel.src=image;}
 if(!hasImage)imageSrc='';
 el.qimg.classList.toggle('on',hasImage);el.stage.classList.toggle('has-img',hasImage);
 const length=text.length;
 el.stage.classList.toggle('compact',hasImage||length>100);
 el.qtext.style.fontSize=`${waiting?9.6:qSize(length,hasImage)}cqh`;
 el.stage.style.paddingBottom=`${hasImage?(length>50?26:18):20}cqh`;
 el.stage.classList.toggle('up',!!timer);
}
function renderTimer(timer){
 el.timer.classList.toggle('on',!!timer);
 if(!timer){timerKey='';el.bar.classList.remove('run','warn');return;}
 if(timerKey!==timer.key){timerKey=timer.key;el.bar.classList.remove('run');void el.bar.getBoundingClientRect();el.bar.style.setProperty('--dur',`${timer.ms}ms`);el.bar.style.animationDelay=`${-(timer.ms-timer.left)}ms`;el.bar.classList.add('run');}
 const seconds=Math.max(0,Math.ceil(timer.left/1000));el.num.textContent=String(seconds);el.num.setAttribute('aria-label',`${seconds} seconds remaining`);
 el.bar.classList.toggle('warn',seconds<=3);
}

function syncRows(list,items,key,make,update){
 const keep=new Set(items.map(key));
 for(const node of [...list.children])if(!keep.has(node.dataset.k))node.remove();
 items.forEach((item,index)=>{let node=list.querySelector(`:scope > [data-k="${CSS.escape(key(item))}"]`);if(!node){node=make(item);node.dataset.k=key(item);}
  if(list.children[index]!==node)list.insertBefore(node,list.children[index]||null);update(node,item,index);});
}
function renderBuzzes(value){
 const c=value.control,round=value.round,names=value.settings?.buzzOrderNames!==false;
 const open=c.phase==='open'&&round.phase!=='locked',buzzes=enabled('viewerBuzzOrder')?round.buzzes:[];
 const choice=value.selection,selected=choice?.r===c.r&&choice?.a===c.a?choice.uid:null;
 const pending=buzzes.find(b=>b.playerId===selected&&b.result==='pending')||buzzes.find(b=>b.result==='pending');
 const stripOn=open&&buzzes.length>0,results=!open&&buzzes.length>0;
 el.main.classList.toggle('res',results);el.strip.classList.toggle('on',stripOn);
 const name=b=>names?b.name:'—',time=b=>c.startedAt?`${Math.max(0,(b.acceptedAt-c.startedAt)/1000).toFixed(2)} s`:'';
 // One masked row while buzzers are open: new names slide in from the right and the oldest slide out to the left.
 syncRows(el.striplist,buzzes,b=>b.playerId,()=>{const li=document.createElement('li');li.className='chipb';li.innerHTML='<span class="r"></span><span class="n"></span><span class="t"></span>';return li;},(li,b,i)=>{
  $('.r',li).textContent=`#${b.order}`;$('.n',li).textContent=name(b);$('.t',li).textContent=time(b);});
 const last=el.striplist.lastElementChild,full=last?last.offsetLeft+last.offsetWidth:0,over=Math.max(0,full-el.smask.clientWidth);
 el.striplist.style.transform=`translateX(${-over}px)`;el.smask.classList.toggle('over',over>0);
 // Right-hand list: rows keep their size, the list scrolls so whoever answers stays in view.
 const fresh=[];
 syncRows(el.buzzlist,buzzes,b=>b.playerId,()=>{const li=document.createElement('li');li.className='row';li.innerHTML='<span class="r"></span><span class="n"></span><span class="t"></span><span class="tag"></span>';return li;},(li,b)=>{
  const state=b.result==='correct'?'ok':b.result==='incorrect'?'bad':b===pending?'turn':'';
  if(state==='ok'&&!li.classList.contains('ok')&&!seenOk.has(`${c.r}_${c.a}_${b.playerId}`))fresh.push(li);
  if(state==='ok')seenOk.add(`${c.r}_${c.a}_${b.playerId}`);
  li.className=`row${state?` ${state}`:''}`;
  $('.r',li).textContent=`#${b.order}`;$('.n',li).textContent=name(b);$('.t',li).textContent=`${state==='bad'?'✕ ':''}${time(b)}`;
  $('.tag',li).textContent=state==='ok'?'✓ Correct':state==='turn'?'Answering':'';});
 if(!results&&!stripOn)el.buzzlist.replaceChildren();
 scrollList();fresh.forEach(sparkle);
}
function scrollList(){
 const o=el.buzzlist,vp=el.bvp,rows=[...o.children];
 if(!rows.length){o.style.transform='';return;}
 let idx=rows.findIndex(r=>r.classList.contains('turn'));
 if(idx<0)for(let i=rows.length-1;i>=0;i--)if(rows[i].classList.contains('ok')||rows[i].classList.contains('bad')){idx=i;break;}
 if(idx<0)idx=0;
 // Measure the settled layout on a copy without transitions, so the scroll has one steady target while rows resize.
 const copy=o.cloneNode(true);copy.removeAttribute('id');copy.classList.add('nt');copy.style.cssText='position:absolute;left:0;right:0;top:0;visibility:hidden;transform:none';vp.appendChild(copy);
 const vh=vp.clientHeight,total=copy.offsetHeight,top=copy.children[idx].offsetTop;copy.remove();
 const off=Math.max(0,Math.min(top-vh*.34,total-vh)),fade=Math.round(vh*.09);
 o.style.transform=`translateY(${-off}px)`;vp.style.setProperty('--ft',off>2?`${fade}px`:'0px');vp.style.setProperty('--fb',total-vh-off>2?`${fade}px`:'0px');
}
// A glittering trail runs around the box of whoever answered correctly, with sparks flying off it.
function sparkle(li){
 li.querySelector('.trail')?.remove();
 const w=li.offsetWidth,h=li.offsetHeight,pad=Math.round(h*.09),W=w+pad*2,H=h+pad*2,R=parseFloat(getComputedStyle(li).borderRadius)+pad;
 const box=document.createElement('div');box.className='trail';box.style.cssText=`left:${-pad}px;top:${-pad}px;width:${W}px;height:${H}px`;
 const rect=`<rect x="1.5" y="1.5" width="${W-3}" height="${H-3}" rx="${R}" pathLength="100"`;
 box.innerHTML=`<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" overflow="visible" aria-hidden="true"><defs><filter id="tg" x="-20%" y="-60%" width="140%" height="220%"><feGaussianBlur stdDeviation="3"/></filter></defs>${rect} class="tr-glow a" filter="url(#tg)"/>${rect} class="tr-line a"/>${rect} class="tr-glow b" filter="url(#tg)"/>${rect} class="tr-line b"/></svg>`;
 const per=2*(W-2*R)+2*(H-2*R)+2*Math.PI*R;
 const at=d=>{d=((d%per)+per)%per;const sw=W-2*R,sh=H-2*R,arc=Math.PI*R/2;let x,y,nx,ny;
  if(d<sw){x=R+d;y=0;nx=0;ny=-1}else if((d-=sw)<arc){const t=d/R;x=W-R+Math.sin(t)*R;y=R-Math.cos(t)*R;nx=Math.sin(t);ny=-Math.cos(t)}else if((d-=arc)<sh){x=W;y=R+d;nx=1;ny=0}else if((d-=sh)<arc){const t=d/R;x=W-R+Math.cos(t)*R;y=H-R+Math.sin(t)*R;nx=Math.cos(t);ny=Math.sin(t)}else if((d-=arc)<sw){x=W-R-d;y=H;nx=0;ny=1}else if((d-=sw)<arc){const t=d/R;x=R-Math.sin(t)*R;y=H-R+Math.cos(t)*R;nx=-Math.sin(t);ny=Math.cos(t)}else if((d-=arc)<sh){x=0;y=H-R-d;nx=-1;ny=0}else{d-=sh;const t=d/R;x=R-Math.cos(t)*R;y=R-Math.sin(t)*R;nx=-Math.cos(t);ny=-Math.sin(t)}
  return {x,y,nx,ny};};
 for(let i=0;i<48;i++){const t=Math.random(),head=at(per*t*.9+((Math.random()-.5)*per*.02)),dist=pad*(1.2+Math.random()*2.4),spark=document.createElement('i');
  spark.style.cssText=`left:${head.x.toFixed(1)}px;top:${head.y.toFixed(1)}px;--s:${(.7+Math.random()*1.1).toFixed(2)}cqh;--dx:${(head.nx*dist+(Math.random()-.5)*10).toFixed(1)}px;--dy:${(head.ny*dist+(Math.random()-.5)*10).toFixed(1)}px;--dl:${Math.round(t*1350)}ms`;box.appendChild(spark);}
 li.appendChild(box);setTimeout(()=>box.remove(),3400);
}

function renderLeaderboard(value){
 const players=value.players.filter(p=>!['banned','kicked'].includes(p.status)).sort((a,b)=>b.score-a.score||a.joined-b.joined);
 let rank=0,previous=null;const ranked=players.map((p,i)=>{if(p.score!==previous){rank=i+1;previous=p.score;}return {...p,rank};});
 if(!ranked.length){el.lblist.innerHTML='<li class="viewer-empty">No players yet</li>';return;}
 el.lblist.querySelector('.viewer-empty')?.remove();
 syncRows(el.lblist,ranked,p=>p.id,()=>{const li=document.createElement('li');li.className='row';li.innerHTML='<span class="r"></span><span class="n"></span><span class="s"></span>';return li;},(li,p)=>{
  li.classList.toggle('first',p.rank===1);$('.r',li).textContent=p.rank===1?'♛':String(p.rank);$('.n',li).textContent=p.name;$('.s',li).innerHTML=`${p.score}<small> pts</small>`;});
}
function renderJoin(value){
 const players=value.players.filter(p=>!['banned','kicked'].includes(p.status));
 el.jcount.textContent=String(players.length);el.jlabel.textContent=players.length===1?'player joined':'players joined';
 syncRows(el.chips,players,p=>p.id,()=>{const s=document.createElement('span');s.className='chip';return s;},(s,p)=>{s.textContent=p.name;});
 drawQr();
}
async function drawQr(){
 const box=el.qr,key=joinUrl();if(qrKey===key&&box.firstChild)return;qrKey=key;const generation=++qrGeneration;
 try{
  const {default:qrcode}=await import('qrcode-generator');if(generation!==qrGeneration)return;
  const qr=qrcode(0,'M');qr.addData(key,'Byte');qr.make();box.innerHTML=qr.createSvgTag({cellSize:6,margin:16,scalable:true});
 }catch{box.textContent='QR code unavailable';}
}
// "X joined" notices stack at the top left: at most five, sliding in from the left and fading out in turn.
function retire(note){if(note.classList.contains('out'))return;note.classList.add('out');setTimeout(()=>note.classList.add('collapse'),420);setTimeout(()=>note.remove(),1000);}
function notice(text){
 const live=[...el.notes.children].filter(n=>!n.classList.contains('out'));while(live.length>=5)retire(live.shift());
 const note=document.createElement('div');note.className='jn in';note.innerHTML='<span class="pill"><i></i><span class="txt"></span></span>';$('.txt',note).textContent=text;
 el.notes.appendChild(note);void note.offsetWidth;requestAnimationFrame(()=>requestAnimationFrame(()=>note.classList.remove('in')));setTimeout(()=>retire(note),3400);
}
function trackPlayers(value,view){
 const ids=new Set(value.players.filter(p=>!['banned','kicked'].includes(p.status)).map(p=>p.id));
 if(knownPlayers&&view==='game')for(const p of value.players)if(ids.has(p.id)&&!knownPlayers.has(p.id))notice(`${p.name} joined`);
 if(view!=='game')el.notes.replaceChildren();
 knownPlayers=ids;
}

// #355/#370: the host picks Standby (logo only), Join, Game or Leaderboard.
// Settings from an older host page have none of these choices: then the screen follows the earlier switches.
function viewMode(s){
 if(s.viewerView==='standby')return 'off';
 if(s.viewerView==='join')return 'join';
 if(s.viewerView==='leaderboard')return 'lb';
 if(s.viewerView==='game')return 'game';
 if(s.viewerOn===false)return 'off';
 if(s.viewerJoinScreen===true)return 'join';
 return s.viewerLeaderboard!==false&&s.shareLeaderboard===true?'lb':'game';
}
function render(){
 if(!latest||ended)return;
 if(!built)build();
 const value=latest,view=viewMode(value.settings||{});
 if(mode!==view){mode=view;document.documentElement.dataset.viewerMode=view;el['v-off'].classList.toggle('on',view==='off');el['v-game'].classList.toggle('on',view==='game');el['v-lb'].classList.toggle('on',view==='lb');el['v-join'].classList.toggle('on',view==='join');el.topbar.classList.toggle('on',view==='game'||view==='lb');}
 trackPlayers(value,view);
 const timer=timerState(value);
 renderQuestion(value,timer);renderTimer(timer);renderBuzzes(value);
 if(view==='lb')renderLeaderboard(value);
 if(view==='join')renderJoin(value);
 scheduleTimer(timer);
}
function scheduleTimer(timer){
 clearTimeout(timerHandle);
 const c=latest?.control;if(!c||c.phase!=='open'||c.timer===false||!c.startedAt)return;
 const end=c.startedAt+c.ms;if(client.serverNow()>=end+300)return;
 timerHandle=setTimeout(render,timer?200:Math.max(50,end-client.serverNow()+50));
}
function project(value){
 latest=value;
 setStatus('');
 if(value.celebration?.id!==celebrationId){const first=celebrationId===null;celebrationId=value.celebration?.id||'';if(!first&&celebrationId)celebration.launch();}
 celebration.sync();
 render();
}
function endRoom(){
 ended=true;clearTimeout(timerHandle);stopWatch?.();stopOwn?.();celebration.clear();root.innerHTML='';built=false;
 setStatus('This game has ended. Ask the host for a new viewer link.');
}
async function register(){
 // Serialize registration: reconnect and lost-registration events can arrive together.
 return registering??=(async()=>{
  try{
   await client.command({action:'view',code});
   stopWatch?.();stopOwn?.();
   stopWatch=client.watch(code,project,error=>{
    if(error?.code==='room/not-found'){endRoom();return;}
    // Lost access (for example a dropped registration): register again while connected.
    if(connected&&!ended)queueMicrotask(()=>register().catch(fail));
   },{loads:false});
   let seen=false;
   stopOwn=client.watchOwnViewer(code,present=>{if(present){seen=true;return;}if(seen&&connected&&!ended)queueMicrotask(()=>register().catch(fail));});
  }finally{registering=null;}
 })();
}
function fail(error){
 if(ended)return;
 const message=error?.message||'';
 if(message==='Room not found.'){ended=true;setStatus('We couldn’t find this room. Ask the host for a new viewer link.',{error:true});return;}
 if(message==='All viewer screens are in use.'){setStatus('All four viewer screens are already in use for this room.',{error:true});return;}
 setStatus(latest?'Connection lost — reconnecting…':'We couldn’t connect to the room. Retrying…',{error:true});
}
async function start(){
 if(!/^[A-HJ-NP-Z2-9]{4}$/.test(code)){setStatus('Open the viewer link from the host’s Settings to show this room.',{error:true});return;}
 document.title=`Buzzy · Viewer · ${code}`;
 setStatus('Connecting to the room…');
 try{client=await getClient();}catch(error){fail(error);setTimeout(start,4000);return;}
 client.watchConnection(value=>{
  connected=value;if(ended)return;
  if(!value){if(latest)setStatus('Connection lost — reconnecting…',{error:true});return;}
  register().catch(error=>{fail(error);if(!ended&&error?.message!=='All viewer screens are in use.')setTimeout(()=>{if(connected&&!ended)register().catch(fail);},4000);});
 });
}
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&latest)render();});
window.BuzzyViewer={get state(){return latest;},viewerKeys};
start();
