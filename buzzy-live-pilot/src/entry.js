import {isRoomCode,isNetworkKitCode,SESSION_KEY,BACKEND_KEY} from './room-code.js';
import {deadline} from './connection.js';
import {clientOf} from './backend.js';
// The landing view opens no Firebase connection until Create/Join.
const form=document.getElementById('join-form'),code=document.getElementById('room-code'),name=document.getElementById('player-name'),host=document.getElementById('host-entry'),status=document.getElementById('entry-status');
const normalize=value=>value.toUpperCase().replace(/\s+/g,'');
function error(input,id,message){input.setAttribute('aria-invalid',String(!!message));const node=document.getElementById(id);node.textContent=message;node.hidden=!message;}
code.addEventListener('input',()=>{code.value=normalize(code.value);error(code,'code-error','');});name.addEventListener('input',()=>error(name,'name-error',''));
const prefilled=new URL(location.href).searchParams.get('room');if(prefilled&&isRoomCode(prefilled))code.value=prefilled;
let busy=false,pending,client,stopConnection;
// #408: during the trial the host chooses the room server for a new room; players follow the code's length.
const serverChoice=document.getElementById('room-server');
if(serverChoice){serverChoice.checked=localStorage.getItem(BACKEND_KEY)==='network-kit';serverChoice.addEventListener('change',()=>{localStorage.setItem(BACKEND_KEY,serverChoice.checked?'network-kit':'firebase');pending=null;});}
const hostOnNetworkKit=()=>!!serverChoice?.checked;
const createKey='buzzy-pending-room-create';
function resume(){if(pending&&!busy&&(pending.role==='host'||(pending.input.code===code.value&&pending.input.name===name.value.trim())))enter(pending.role);}
function createCommand(){let id=sessionStorage.getItem(createKey);if(!id){id=crypto.randomUUID();sessionStorage.setItem(createKey,id);}return {action:'create',commandId:id};}
async function enter(role){
 if(busy)return;
 if(role==='player'){
  code.value=normalize(code.value);const ce=isRoomCode(code.value)?'':'Enter the room code from your host (4 or 6 characters).',ne=name.value.trim()?'':'Enter your name.';
  error(code,'code-error',ce);error(name,'name-error',ne);if(ce){code.focus();return;}if(ne){name.focus();return;}
 }
 busy=true;host.disabled=true;form.querySelector('button').disabled=true;status.hidden=false;status.textContent=role==='host'?'Creating your room…':'Joining your room…';
 try{
  const input=role==='host'?createCommand():{action:'join',code:code.value,name:name.value.trim()};
  const nk=role==='host'?hostOnNetworkKit():isNetworkKitCode(input.code);
  const key=JSON.stringify({...input,nk});
  if(!pending||pending.key!==key)pending={key,role,input,task:null};
  const attempt=pending;
  attempt.task??=(async()=>{
   client=await clientOf(nk);
   stopConnection??=client.watchConnection(value=>{if(value)resume();});
   await client.waitForConnection();
   const result=await client.command(input);
   if(pending!==attempt)return;
   sessionStorage.setItem(SESSION_KEY,JSON.stringify({code:result.code,role,...(role==='player'?{name:input.name}:{})}));
   if(role==='host')sessionStorage.removeItem(createKey);
   location.assign(`/${role}`);
  })().catch(error=>{attempt.task=null;throw error;});
  await deadline(attempt.task,20000);
 }catch(e){
  if(role==='player'&&e.message==='Room full.'){error(code,'code-error','This room is full.');status.textContent='';status.hidden=true;}
  else if(role==='player'&&e.message==='Room not found.'){
   error(code,'code-error',"We couldn’t find a room with that code.");
   status.textContent='';status.hidden=true;code.focus({preventScroll:true});
  }else status.textContent=e.code==='PERMISSION_DENIED'?'Unable to join this room. Check the code with your host.':e.message;
  busy=false;host.disabled=false;form.querySelector('button').disabled=false;
 }

}
form.addEventListener('submit',e=>{e.preventDefault();enter('player');});host.addEventListener('click',()=>enter('host'));

window.addEventListener('online',()=>{if(pending&&!busy){client?.reconnect();resume();}});

// #406: privacy information in the start page's dialog.
const privacy=document.getElementById('privacy-dialog');
document.getElementById('privacy-open')?.addEventListener('click',()=>privacy.showModal());
document.getElementById('privacy-close')?.addEventListener('click',()=>privacy.close());
privacy?.addEventListener('click',e=>{if(e.target!==privacy)return;const r=privacy.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)privacy.close();});
