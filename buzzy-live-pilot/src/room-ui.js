import {installHostLayout} from './host-layout.js';
// UI-only helpers. Room permissions, membership and exit semantics stay in bridge.js.
export function installRoomUi({api,isHost,getCode}) {
 let observed,observer,share,returnFocus,returnFocusSelector,previousOverflow,shareGeneration=0;
 const hostLayout=isHost?installHostLayout():null;
 const url=()=>`${location.origin}/?room=${getCode()}`;
 function resizeBuzzer(){
  if(!observed?.isConnected)return;
  const style=getComputedStyle(observed),box=observed.getBoundingClientRect();
  const size=Math.floor(Math.max(1,Math.min(box.width-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight),box.height-parseFloat(style.paddingTop)-parseFloat(style.paddingBottom))));
  const phone=observed.closest('.phone');phone.style.setProperty('--room-buzzer-size',`${size}px`);phone.style.setProperty('--buzzy-content-scale',String(Math.max(0,(size-10)/237)));
 }
 function sync(){
  if(isHost){for(const id of ['room-share-qr','room-copy-link'])document.getElementById(id).disabled=!api.state.networkReady;hostLayout.sync();return;}
  const slot=document.querySelector('.player-buzzer-space');
  if(slot!==observed){observer?.disconnect();observed=slot;if(slot){observer=new ResizeObserver(resizeBuzzer);observer.observe(slot);}}
  resizeBuzzer();
 }
 async function copyLink(notice){
  if(!api.state.networkReady||!getCode())return;
  try{if(!navigator.clipboard?.writeText)throw new Error('Clipboard unavailable');await navigator.clipboard.writeText(url());if(notice)notice.textContent='Room link copied.';else api.tip('Room link copied.');}
  catch{if(notice)notice.textContent='Select and copy the address above.';else api.tip(url());}
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
  share.innerHTML='<div class="room-share-top"><div class="brand">buzzy<span style="color:#67a5ff">.</span></div><button type="button" class="room-icon-button room-share-close" aria-label="Close sharing">×</button></div><div class="room-share-content"><h1 id="room-share-title">Join the game</h1><p>Scan the QR code or enter the room code</p><div class="room-share-qr" role="img" aria-label="QR code for joining this room"></div><div><span class="room-share-code-label">Room code</span><div class="room-share-code"></div></div><a class="room-share-url"></a><button type="button" class="btn room-share-copy">Copy room link</button><p class="room-share-notice" role="status">Creating QR code…</p></div>';
  share.querySelector('.room-share-code').textContent=getCode();const address=share.querySelector('.room-share-url');address.textContent=url();address.href=url();address.target='_blank';address.rel='noopener';
  share.querySelector('.room-share-close').addEventListener('click',closeShare);
  share.addEventListener('cancel',e=>{e.preventDefault();closeShare();});
  share.addEventListener('keydown',e=>{
   if(e.key!=='Tab')return;
   const controls=[...share.querySelectorAll('button,a[href]')],first=controls[0],last=controls.at(-1);
   if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
   else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
  });
  share.querySelector('.room-share-copy').addEventListener('click',()=>copyLink(share.querySelector('.room-share-notice')));
  document.body.append(share);document.body.style.overflow='hidden';share.showModal();
  try{
   const {default:qrcode}=await import('qrcode-generator');
   if(generation!==shareGeneration||!share)return;
   const qr=qrcode(0,'M');qr.addData(url(),'Byte');qr.make();
   share.querySelector('.room-share-qr').innerHTML=qr.createSvgTag({cellSize:6,margin:24,scalable:true});
   share.querySelector('.room-share-notice').textContent='';
  }catch{if(generation===shareGeneration&&share)share.querySelector('.room-share-notice').textContent='QR code unavailable. Use the address or room code above.';}
 }
 function setStatus(code,text,error){
  const status=document.getElementById('network-status');
  if(!isHost||!code||error){status.textContent=text;return;}
  const room=document.createElement('span');room.className='host-room-label';room.textContent=`Room ${code}`;
  const connection=document.createElement('span');connection.className='host-connection-label';connection.textContent=/ · Connected$/.test(text)?'Connected':text;
  status.replaceChildren(room,connection);
 }
 document.getElementById('room-share-qr')?.addEventListener('click',openShare);
 document.getElementById('room-copy-link')?.addEventListener('click',()=>copyLink());
 sync();
 return {sync,openShare,closeShare,copyLink,setStatus};
}
