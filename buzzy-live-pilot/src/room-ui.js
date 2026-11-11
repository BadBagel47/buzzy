import {installHostLayout} from './host-layout.js';
export function renderHostStatus(code,text,error){
 const summary=document.getElementById('host-status-summary'),status=document.getElementById('network-status'),notice=document.getElementById('host-network-notice');
 const connected=/ · Connected$/.test(text),initial=text==='Connecting…';
 const room=document.createElement('span');room.className='host-room-label';room.textContent=code||'Connecting…';
 const connection=document.createElement('span');connection.className='host-connection-label';connection.textContent=connected?'Connected':/^Disconnected/.test(text)?'Offline':/game has ended/i.test(text)?'Game ended':error?'Issue':'Connecting…';
 summary.replaceChildren(room,...(code?[connection]:[]));
 const key=`${error}:${text}`;
 if(notice.dataset.messageKey!==key){notice.dataset.messageKey=key;notice.dataset.dismissed='false';}
 const show=!connected&&!initial&&notice.dataset.dismissed!=='true';
 if(!show&&notice.contains(document.activeElement))summary.focus({preventScroll:true});
 notice.hidden=!show;summary.setAttribute('aria-expanded',String(show));summary.setAttribute('aria-label',`${code?`Room ${code}`:'Connecting'}${code?`, ${connection.textContent}`:''}${!connected&&!initial?'. Show connection message':''}`);status.textContent=text;
}
// UI-only helpers. Room permissions, membership and exit semantics stay in bridge.js.
export function installRoomUi({api,isHost,getCode,viewer=null}) {
 let observed,observer,share,returnFocus,returnFocusSelector,previousOverflow,shareGeneration=0;
 const hostLayout=isHost?installHostLayout():null;
 const url=()=>`${location.origin}/?room=${getCode()}`,viewerUrl=()=>getCode()?`${location.origin}/viewer?room=${getCode()}`:'';
 function resizeBuzzer(){
  if(!observed?.isConnected)return;
  const style=getComputedStyle(observed),box=observed.getBoundingClientRect();
  const size=Math.floor(Math.max(1,Math.min(box.width-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight),box.height-parseFloat(style.paddingTop)-parseFloat(style.paddingBottom))));
  const phone=observed.closest('.phone');phone.style.setProperty('--room-buzzer-size',`${size}px`);phone.style.setProperty('--buzzy-content-scale',String(Math.max(0,(size-10)/237)));
 }
 function sync(){
  if(isHost){for(const id of ['room-share-qr','room-viewer'])document.getElementById(id).disabled=!api.state.networkReady;const live=(api.state.viewerCount||0)>0,button=document.getElementById('room-viewer');button.toggleAttribute('data-live',live);button.title=live?`Viewer screen settings (${api.state.viewerCount} connected)`:'Viewer screen settings';hostLayout.sync();return;}
  const slot=document.querySelector('.player-buzzer-space');
  if(slot!==observed){observer?.disconnect();observed=slot;if(slot){observer=new ResizeObserver(resizeBuzzer);observer.observe(slot);}}
  resizeBuzzer();
 }
 async function copyLink(notice){
  if(!api.state.networkReady||!getCode())return;
  const icon='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/></svg>',done='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7"/></svg>';
  const feedback=(text,ok)=>{if(!notice){api.tip(text);return;}notice.innerHTML=ok?done:icon;notice.setAttribute('aria-label',ok?'Room link copied':'Copy room link');clearTimeout(notice._t);notice._t=setTimeout(()=>{notice.innerHTML=icon;notice.setAttribute('aria-label','Copy room link');},2200);if(!ok)api.tip('Copy the address shown on screen');};
  try{if(!navigator.clipboard?.writeText)throw new Error('Clipboard unavailable');await navigator.clipboard.writeText(url());feedback('Room link copied',true);}
  catch{feedback(url(),false);}
 }
 async function copyViewerLink(){
  if(!api.state.networkReady||!getCode())return;
  try{if(!navigator.clipboard?.writeText)throw new Error('Clipboard unavailable');await navigator.clipboard.writeText(viewerUrl());api.tip('Viewer link copied. Open it on the TV or projector.');}
  catch{api.tip(viewerUrl());}
 }
 function closeShare(){
  ++shareGeneration;
  if(!share)return;
  const old=share;share=null;old.close();old.remove();document.body.style.overflow=previousOverflow;
  const target=returnFocus?.isConnected?returnFocus:document.querySelector(returnFocusSelector||'#room-share-qr');target?.focus({preventScroll:true});
 }
 async function openShare(){
  if(!isHost||!api.state.networkReady||!getCode()||share)return;
  const generation=++shareGeneration;
  returnFocus=document.activeElement;returnFocusSelector=returnFocus?.id?`#${returnFocus.id}`:returnFocus?.dataset.action==='qr'?'[data-action="qr"]':null;previousOverflow=document.body.style.overflow;
  share=document.createElement('dialog');share.className='room-share-screen';share.setAttribute('aria-labelledby','room-share-title');
  share.innerHTML='<div class="room-share-top"><button type="button" class="room-icon-button room-share-copy" aria-label="Copy room link" title="Copy room link"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/></svg></button><button type="button" class="room-icon-button room-share-close" aria-label="Close sharing" title="Close"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div><div class="room-share-content"><h1 id="room-share-title">Join the game</h1><p>Scan the QR code or enter the room code</p><div class="room-share-qr" role="img" aria-label="QR code for joining this room"></div><div><span class="room-share-code-label">Room code</span><div class="room-share-code"></div></div><div class="room-share-url"></div></div>';
  share.querySelector('.room-share-code').textContent=getCode();const address=share.querySelector('.room-share-url');address.textContent=location.host;
  share.querySelector('.room-share-close').addEventListener('click',closeShare);
  share.addEventListener('cancel',e=>{e.preventDefault();closeShare();});
  share.addEventListener('keydown',e=>{
   if(e.key!=='Tab')return;
   const controls=[...share.querySelectorAll('button,a[href]')],first=controls[0],last=controls.at(-1);
   if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
   else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
  });
  share.querySelector('.room-share-copy').addEventListener('click',()=>copyLink(share.querySelector('.room-share-copy')));
  document.body.append(share);document.body.style.overflow='hidden';share.showModal();
  try{
   const {default:qrcode}=await import('qrcode-generator');
   if(generation!==shareGeneration||!share)return;
   const qr=qrcode(0,'M');qr.addData(url(),'Byte');qr.make();
   share.querySelector('.room-share-qr').innerHTML=qr.createSvgTag({cellSize:6,margin:24,scalable:true});
  }catch{if(generation===shareGeneration&&share)share.querySelector('.room-share-qr').textContent='QR code unavailable. Use the address or room code.';}
 }
 function setStatus(code,text,error){
  const status=document.getElementById('network-status');
  if(!isHost){status.textContent=text;return;}
  renderHostStatus(code,text,error);
 }
 document.querySelector('.host-notice-dismiss')?.addEventListener('click',()=>{const notice=document.getElementById('host-network-notice');notice.dataset.dismissed='true';notice.hidden=true;const summary=document.getElementById('host-status-summary');summary.setAttribute('aria-expanded','false');summary.focus({preventScroll:true});});
 document.getElementById('host-status-summary')?.addEventListener('click',()=>{const notice=document.getElementById('host-network-notice');if(!notice.dataset.messageKey||notice.dataset.messageKey.endsWith(' · Connected')||notice.dataset.messageKey.endsWith(':Connecting…'))return;notice.dataset.dismissed='false';notice.hidden=false;document.getElementById('host-status-summary').setAttribute('aria-expanded','true');});
 document.getElementById('room-share-qr')?.addEventListener('click',openShare);
 // #356: the header button opens the viewer settings over the current view.
 document.getElementById('room-viewer')?.addEventListener('click',()=>{if(!api.state.networkReady)return;api.state.modal='viewer';api.render();});
 sync();
 return {sync,openShare,closeShare,copyLink,copyViewerLink,viewerUrl,setStatus};
}
