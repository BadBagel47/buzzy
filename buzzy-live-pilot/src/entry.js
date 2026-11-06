import {deadline} from './connection.js';
// The landing view opens no Firebase connection until Create/Join.
const form=document.getElementById('join-form'),code=document.getElementById('room-code'),name=document.getElementById('player-name'),host=document.getElementById('host-entry'),status=document.getElementById('entry-status');
const normalize=value=>value.toUpperCase().replace(/\s+/g,'');
function error(input,id,message){input.setAttribute('aria-invalid',String(!!message));const node=document.getElementById(id);node.textContent=message;node.hidden=!message;}
code.addEventListener('input',()=>{code.value=normalize(code.value);error(code,'code-error','');});name.addEventListener('input',()=>error(name,'name-error',''));
const prefilled=new URL(location.href).searchParams.get('room');if(prefilled&&/^[A-HJ-NP-Z2-9]{4}$/.test(prefilled))code.value=prefilled;
let busy=false,pending,client,stopConnection;
const createKey='buzzy-pending-room-create';
function resume(){if(pending&&!busy&&(pending.role==='host'||(pending.input.code===code.value&&pending.input.name===name.value.trim())))enter(pending.role);}
function createCommand(){let id=sessionStorage.getItem(createKey);if(!id){id=crypto.randomUUID();sessionStorage.setItem(createKey,id);}return {action:'create',commandId:id};}
async function enter(role){
 if(busy)return;
 if(role==='player'){
  code.value=normalize(code.value);const ce=/^[A-HJ-NP-Z2-9]{4}$/.test(code.value)?'':'Enter the 4-character room code from your host.',ne=name.value.trim()?'':'Enter your name.';
  error(code,'code-error',ce);error(name,'name-error',ne);if(ce){code.focus();return;}if(ne){name.focus();return;}
 }
 busy=true;host.disabled=true;form.querySelector('button').disabled=true;status.hidden=false;status.textContent=role==='host'?'Creating your room…':'Joining your room…';
 try{
  const input=role==='host'?createCommand():{action:'join',code:code.value,name:name.value.trim()};
  const key=JSON.stringify(input);
  if(!pending||pending.key!==key)pending={key,role,input,task:null};
  const attempt=pending;
  attempt.task??=(async()=>{
   client=await import('./client.js').then(m=>m.getClient());
   stopConnection??=client.watchConnection(value=>{if(value)resume();});
   await client.waitForConnection();
   const result=await client.command(input);
   if(pending!==attempt)return;
   sessionStorage.setItem('buzzy-spark-ui-session',JSON.stringify({code:result.code,role}));
   if(role==='host')sessionStorage.removeItem(createKey);
   location.assign(`/${role}.html`);
  })().catch(error=>{attempt.task=null;throw error;});
  await deadline(attempt.task,20000);
 }catch(e){status.textContent=e.code==='PERMISSION_DENIED'?'Unable to join this room. Check the code with your host.':e.message;busy=false;host.disabled=false;form.querySelector('button').disabled=false;}

}
form.addEventListener('submit',e=>{e.preventDefault();enter('player');});host.addEventListener('click',()=>enter('host'));

window.addEventListener('online',()=>{if(pending&&!busy){client?.reconnect();resume();}});
