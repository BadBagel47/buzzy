// #347/#352: read-only viewer screen for a TV or projector.
// It shows only question-related state chosen by the host and never writes game state;
// its only write is its own registration in one of four viewer seats.
import {getClient} from './client.js';
import {createCelebration} from './celebration.js';

const root=document.getElementById('viewer'),statusNode=document.getElementById('viewer-status');
const params=new URL(location.href).searchParams,code=String(params.get('room')||'').toUpperCase();
const viewerKeys=['viewerQuestion','viewerTimer','viewerBuzzOrder','viewerLeaderboard','viewerCelebration'];
let client,latest=null,stopWatch=null,stopOwn=null,registering=null,connected=false,ended=false,celebrationId=null,timerHandle=0,qrKey='',qrGeneration=0;
const celebration=createCelebration(()=>enabled('viewerCelebration')&&latest?.settings?.celebration!==false);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Missing host choices count as on, so an older host page still produces a useful screen.
function enabled(key){return latest?.settings?.[key]!==false;}
function setStatus(text,{error=false}={}){
 document.documentElement.toggleAttribute('data-viewer-ready',!text);
 statusNode.hidden=!text;statusNode.dataset.error=String(error);statusNode.querySelector('.viewer-status-text').textContent=text||'';
}
function joinUrl(){return `${location.origin}/?room=${code}`;}

function questionFor(value){
 const c=value.control,p=value.presentation;
 return p&&p.r===c.r&&p.a===c.a?p:null;
}
function phaseLabel(value){
 const c=value.control,round=value.round;
 if(c.phase==='finished')return 'Correct answer';
 if(round.phase==='locked')return 'Answering';
 if(c.phase==='open'){if(c.timer!==false&&client.serverNow()>=c.startedAt+c.ms)return 'Time is up';return 'Buzzers open';}
 if(c.phase==='closed')return 'Buzzers closed';
 return '';
}
function remainingSeconds(c){return Math.max(0,Math.ceil((c.startedAt+c.ms-client.serverNow())/1000));}
function timerMarkup(value){
 const c=value.control;
 if(!enabled('viewerTimer')||c.timer===false||!c.startedAt)return '';
 const stoppedAt=c.phase==='open'?null:(c.closedAt||value.round.buzzes[0]?.acceptedAt||c.startedAt+c.ms);
 const seconds=stoppedAt===null?remainingSeconds(c):Math.max(0,Math.ceil((c.startedAt+c.ms-stoppedAt)/1000));
 const total=Math.max(1,Math.round(c.ms/1000)),ratio=Math.min(1,seconds/total);
 return `<div class="viewer-timer${c.phase==='open'?' is-running':''}" role="timer" aria-label="${seconds} seconds remaining" style="--timer-ratio:${ratio}"><span data-viewer-seconds>${seconds}</span></div>`;
}
function questionMarkup(value){
 const c=value.control,q=questionFor(value),shown=c.phase!=='ready'||!!q?.shown;
 const label=phaseLabel(value);
 if(!enabled('viewerQuestion'))return `<section class="viewer-question viewer-question--hidden"><p class="viewer-question-number">Question ${c.r}</p>${label?`<p class="viewer-phase">${esc(label)}</p>`:''}</section>`;
 if(!q||!shown)return `<section class="viewer-question viewer-question--waiting"><p class="viewer-question-number">Question ${c.r}</p><h1>Get ready for the next question</h1></section>`;
 const text=q.textVisible&&q.text?`<h1 class="viewer-question-text">${esc(q.text)}</h1>`:'';
 const image=q.image?`<img class="viewer-question-image" src="${esc(q.image)}" alt="Question image" referrerpolicy="no-referrer">`:'';
 const fallback=!text&&!image?'<h1 class="viewer-question-text viewer-question-text--muted">Listen to the host</h1>':'';
 return `<section class="viewer-question${image?' has-image':''}"><p class="viewer-question-number">Question ${c.r}${c.a>1?` · Attempt ${c.a}`:''}</p>${text}${image}${fallback}${label?`<p class="viewer-phase">${esc(label)}</p>`:''}</section>`;
}
function buzzMarkup(value){
 if(!enabled('viewerBuzzOrder'))return '';
 const c=value.control,round=value.round,names=value.settings?.buzzOrderNames!==false;
 const choice=value.selection,selected=choice?.r===c.r&&choice?.a===c.a?choice.uid:null;
 const answering=round.buzzes.find(b=>b.playerId===selected&&b.result==='pending')||round.buzzes.find(b=>b.result==='pending');
 const rows=round.buzzes.map(b=>{
  const state=b.result==='correct'?'correct':b.result==='incorrect'?'incorrect':b===answering?'answering':'pending';
  const mark=state==='correct'?'<span class="viewer-buzz-mark" aria-label="Correct">✓</span>':state==='incorrect'?'<span class="viewer-buzz-mark" aria-label="Incorrect">✕</span>':state==='answering'?'<span class="viewer-buzz-mark viewer-buzz-mark--turn">Answering</span>':'';
  const time=c.startedAt?`${Math.max(0,(b.acceptedAt-c.startedAt)/1000).toFixed(2)} s`:'';
  return `<li class="viewer-buzz viewer-buzz--${state}"><span class="viewer-buzz-rank">#${b.order}</span><span class="viewer-buzz-name">${names?esc(b.name):'—'}</span><span class="viewer-buzz-time">${time}</span>${mark}</li>`;
 }).join('');
 const empty=c.phase==='ready'?'Buzzes appear here':'No buzzes yet';
 return `<aside class="viewer-buzzes" aria-label="Buzz order"><h2>Buzz order</h2>${rows?`<ol>${rows}</ol>`:`<p class="viewer-empty">${empty}</p>`}</aside>`;
}
function leaderboardMarkup(value){
 if(!enabled('viewerLeaderboard')||!value.settings?.shareLeaderboard)return '';
 const players=value.players.filter(p=>!['banned','kicked'].includes(p.status)).sort((a,b)=>b.score-a.score||a.joined-b.joined);
 let rank=0,previous=null;
 const rows=players.map((p,i)=>{if(p.score!==previous){rank=i+1;previous=p.score;}return `<li class="viewer-rank${rank===1?' is-top':''}"><span class="viewer-rank-number">${rank===1?'<span aria-label="First place">♛</span>':rank}</span><span class="viewer-rank-name">${esc(p.name)}</span><span class="viewer-rank-score">${p.score}<small> pts</small></span></li>`;}).join('');
 return `<section class="viewer-leaderboard" aria-label="Leaderboard"><h2>Leaderboard</h2>${rows?`<ol>${rows}</ol>`:'<p class="viewer-empty">No players yet</p>'}</section>`;
}
function joinScreenMarkup(){
 return `<section class="viewer-join" aria-labelledby="viewer-join-title"><h1 id="viewer-join-title">Join the game</h1><div class="viewer-join-body"><div class="viewer-join-qr" role="img" aria-label="QR code for joining this room"></div><div class="viewer-join-manual"><p class="viewer-join-step">Scan the QR code, or go to</p><p class="viewer-join-url">${esc(location.host)}</p><p class="viewer-join-step">and enter the room code</p><p class="viewer-join-code">${esc(code)}</p></div></div></section>`;
}
async function drawQr(){
 const box=root.querySelector('.viewer-join-qr');if(!box)return;
 const key=joinUrl();if(qrKey===key&&box.firstChild)return;qrKey=key;const generation=++qrGeneration;
 try{
  const {default:qrcode}=await import('qrcode-generator');if(generation!==qrGeneration)return;
  const qr=qrcode(0,'M');qr.addData(key,'Byte');qr.make();
  const target=root.querySelector('.viewer-join-qr');if(target)target.innerHTML=qr.createSvgTag({cellSize:6,margin:16,scalable:true});
 }catch{const target=root.querySelector('.viewer-join-qr');if(target)target.textContent='QR code unavailable';}
}
function render(){
 if(!latest||ended)return;
 const value=latest,join=value.settings?.viewerJoinScreen===true;
 document.documentElement.dataset.viewerMode=join?'join':'game';
 const board=leaderboardMarkup(value);
 const html=join?joinScreenMarkup():`<header class="viewer-top"><div class="brand" aria-label="Buzzy">buzzy<span>.</span></div><div class="viewer-room">Room <strong>${esc(code)}</strong></div></header><main class="viewer-main${enabled('viewerBuzzOrder')?' has-buzzes':''}"><div class="viewer-stage">${questionMarkup(value)}${timerMarkup(value)}</div>${buzzMarkup(value)}</main>${board}`;
 // The join markup does not change while it stays up, so its QR code is drawn once.
 if(root.dataset.html!==html){root.innerHTML=html;root.dataset.html=html;if(join){qrKey='';drawQr();}}
 scheduleTimer();
}
function scheduleTimer(){
 clearTimeout(timerHandle);
 const c=latest?.control;if(!c||c.phase!=='open'||c.timer===false||!c.startedAt)return;
 timerHandle=setTimeout(()=>{
  const node=root.querySelector('[data-viewer-seconds]');
  if(node){const seconds=remainingSeconds(c),total=Math.max(1,Math.round(c.ms/1000));node.textContent=String(seconds);const timer=node.parentElement;timer.style.setProperty('--timer-ratio',String(Math.min(1,seconds/total)));timer.setAttribute('aria-label',`${seconds} seconds remaining`);}
  if(client.serverNow()>=c.startedAt+c.ms){root.dataset.html='';render();return;}
  scheduleTimer();
 },250);
}
function project(value){
 latest=value;
 setStatus('');
 if(value.celebration?.id!==celebrationId){const first=celebrationId===null;celebrationId=value.celebration?.id||'';if(!first&&celebrationId)celebration.launch();}
 celebration.sync();
 render();
}
function endRoom(){
 ended=true;clearTimeout(timerHandle);stopWatch?.();stopOwn?.();celebration.clear();root.innerHTML='';root.dataset.html='';
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
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&latest){root.dataset.html='';render();}});
window.BuzzyViewer={get state(){return latest;},viewerKeys};
start();
