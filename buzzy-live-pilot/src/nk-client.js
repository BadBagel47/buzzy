// #408: the network-kit client with the same interface as client.js (Firebase), so the
// pages (bridge.js, entry.js, viewer.js) work with either backend. The rules that answer
// these commands are in rooms/rules.js. One page is in at most one room.
import {NetworkRoom,RoomError} from '../vendor/network-kit/client/index.js';
import {SESSION_KEY} from './room-code.js';
import {deadline} from './connection.js';

const LOCAL_HOSTS=new Set(['127.0.0.1','localhost']);
/** The room server: Buzzy's own Worker; locally `wrangler dev` (see wrangler.local.jsonc). */
export function roomsServer(){return import.meta.env?.VITE_BUZZY_ROOMS_URL||(LOCAL_HOSTS.has(location.hostname)?'http://127.0.0.1:8787':'https://buzzy-rooms.trythis.one');}
const VIEWER_KEY='buzzy-viewer-key:';
const CLOSED_TEXT={4001:'You have been removed. Return to the start page to rejoin.',4002:'You are banned from this session.',4005:'Room full.',4007:'This viewer link is not valid any more. Ask the host for a new one.'};
let instance;
export function getNkClient(){return instance??=Promise.resolve(makeClient());}

function friendly(error){
 if(!(error instanceof RoomError))return error;
 const text=error.code===4004?'Room not found.':CLOSED_TEXT[error.code]||error.message||'We couldn’t reach the room server.';
 return Object.assign(new Error(text),{code:error.code===0?'network/timeout':`nk/${error.code}`});
}
function session(){try{return JSON.parse(sessionStorage.getItem(SESSION_KEY))||{};}catch{return {};}}

function makeClient(){
 const server=roomsServer();
 let room=null,roomCode='',joining=null,view=null,closed=null,rid=0;
 const views=new Set(),connections=new Set(),errors=new Set(),requests=new Map(),viewWaiters=[];
 const online=()=>!room||room.status==='online';
 const notifyConnection=()=>{for(const fn of connections)fn(online());};
 function attach(r){
  room=r;roomCode=r.code;closed=null;
  r.on('status',()=>notifyConnection());
  r.on('message',({data})=>{
   if(data?.t==='state'){view=data.v;viewWaiters.splice(0).forEach(resolve=>resolve());for(const fn of views)fn(view);}
   else if(data?.t==='res'){const pending=requests.get(data.rid);if(pending){requests.delete(data.rid);data.ok?pending.resolve(data.value):pending.reject(new Error(data.error||'Unable to complete this action.'));}}
  });
  r.on('closed',({code})=>{
   closed=code;for(const p of requests.values())p.reject(new Error(CLOSED_TEXT[code]||'This room is no longer available.'));requests.clear();
   // Removed or banned: show it as Firebase does (the player's own status), then stop.
   if((code===4001||code===4002)&&view&&r.me){view={...view,moderation:{...view.moderation,[r.me]:code===4002?'banned':'kicked'}};for(const fn of views)fn(view);}
   else{const error=Object.assign(new Error('This room is no longer available.'),{code:'room/not-found'});for(const fn of errors)fn(error);}
   notifyConnection();
  });
  notifyConnection();
 }
 async function enter(code,options){
  if(room&&roomCode===code&&!closed)return room;
  return joining??=(async()=>{
   try{const r=await NetworkRoom.join(server,{code,...options});attach(r);return r;}
   catch(error){throw friendly(error);}
   finally{joining=null;}
  })();
 }
 /** Join this page's room in the role the start page chose. */
 function ensure(code){
  const saved=session();
  if(/\/viewer(\.html)?$/.test(location.pathname))return enter(code,{role:'viewer',key:sessionStorage.getItem(VIEWER_KEY+code)||undefined,slot:'screen',name:'Viewer'});
  if(saved.role==='host')return enter(code,{name:'Host'});
  return enter(code,{name:saved.name||'Player'});
 }
 async function currentView(code){await ensure(code);if(!view)await deadline(new Promise(resolve=>viewWaiters.push(resolve)));return view;}
 function request(action,input){
  if(!room||closed)return Promise.reject(new Error('This room is no longer available.'));
  const id=`r${++rid}`;
  const answer=new Promise((resolve,reject)=>requests.set(id,{resolve,reject}));
  if(!room.send({t:'cmd',rid:id,...input,action})){requests.delete(id);return Promise.reject(new Error('You are offline. Reconnect before changing the game.'));}
  return deadline(answer,15000).finally(()=>requests.delete(id));
 }
 async function command(input){
  const x={commandId:crypto.randomUUID(),...input};
  if(x.action==='create'){
   try{
    const r=await NetworkRoom.create(server,{name:'Host'});
    // The host page claims the owner's seat with the owner key this browser keeps.
    r.disconnect();return {code:r.code};
   }catch(error){throw friendly(error);}
  }
  const code=String(x.code||'').toUpperCase();
  if(x.action==='join'){
   const name=String(x.name||'').trim();if(!name||name.length>24)throw new Error('Name must contain 1–24 characters.');
   const r=await enter(code,{name});await currentView(code);
   // The player page joins again as the same participant.
   r.disconnect();room=null;view=null;return {code};
  }
  if(x.action==='view'){await currentView(code);return {code,slot:'0'};}
  await ensure(code);
  if(x.action==='delete'){room.close();return {code};}
  if(x.action==='moderate'){
   const before=view?.moderation?.[x.playerId];
   await request('moderate',x);
   if(x.status==='kicked')room.kick(x.playerId);
   else if(x.status==='banned')room.kick(x.playerId,{ban:true});
   else if(before==='banned')room.unban(x.playerId);
   return {code};
  }
  await request(x.action,x);return {code};
 }
 function snapshot(code,v){
  const c=v.control,a=v.attempt,members=v.members||{},moderation=v.moderation||{};
  const players=Object.entries(members).map(([id,p])=>({id,name:p.name,score:v.scores?.[id]||0,status:['banned','kicked'].includes(moderation[id])?moderation[id]:p.fromRound<=c.r?'active':v.settings?.allowJoinDuringQuestion===false?'queued':'waiting',joined:p.at})).sort((x,y)=>x.joined-y.joined);
  const hits=c.mode==='first'?(a.first?[[a.first.uid,{...a.first,i:1}]]:[]):Object.entries(a.hits||{});
  const buzzes=hits.map(([id,h])=>({playerId:id,name:members[id]?.name||'Player',order:h.i,acceptedAt:h.at,result:a.judgments?.[id]?.kind||'pending',judgment:a.judgments?.[id]||null})).sort((x,y)=>x.order-y.order);
  const loads=v.loads?.key&&v.loads.key===v.presentation?.loadKey?v.loads.map:{};
  return {code,revision:c.version,control:{...c},presentation:v.presentation||null,settings:v.settings||{},celebration:v.celebration||null,adjustments:v.adjustments||{},selection:v.selection||null,loads,players,
   round:{id:c.r,attempt:c.a,phase:c.phase==='open'&&c.mode==='first'&&a.first?'locked':c.phase,mode:c.mode,deadline:c.startedAt+c.ms,excluded:v.excluded?.r===c.r?Object.keys(v.excluded.ids||{}):[],buzzes}};
 }
 function watch(code,next,error){
  const fn=v=>next(snapshot(code,v));views.add(fn);if(error)errors.add(error);
  ensure(code).then(()=>{if(view)fn(view);},e=>error?.(e));
  return ()=>{views.delete(fn);errors.delete(error);};
 }
 const roomData=code=>({
  control:async()=>(await currentView(code)).control,
  meta:async()=>{const v=await currentView(code);return {owner:v.ownerId,createdAt:v.createdAt};},
  archive:async()=>{await currentView(code);return request('get',{what:'archive'});},
  archivedRound:async r=>{await currentView(code);return request('get',{what:'round',round:r});},
  hostState:async()=>{await currentView(code);return request('get',{what:'ui'});},
  presentation:async()=>(await currentView(code)).presentation,
  settings:async()=>(await currentView(code)).settings,
  ownMember:async()=>{const v=await currentView(code);return v.members?.[room.me]||null;},
 });
 function watchViewers(code,next){const fn=v=>next((v.viewers||[]).length);views.add(fn);if(view)fn(view);return ()=>views.delete(fn);}
 function watchOwnViewer(code,next){const fn=()=>next(!!room&&!closed);connections.add(fn);fn();return ()=>connections.delete(fn);}
 function watchConnection(next){connections.add(next);next(online());return ()=>connections.delete(next);}
 return {
  backend:'network-kit',
  get uid(){return room?.me??null;},
  command,room:roomData,watch,watchViewers,watchOwnViewer,watchConnection,
  serverNow:()=>room?room.serverNow():Date.now(),
  // A page that leaves the room on purpose gives its seat back at once.
  setOnline:value=>{if(!value&&room&&!closed){room.leave();}},
  reconnect:()=>{},
  waitForConnection:()=>online()?Promise.resolve():new Promise(resolve=>{const stop=watchConnection(v=>{if(v){stop?.();resolve();}});}),
  viewerKey:()=>room?.inviteKeys?.viewer?.k||'',
 };
}

/** The viewer page keeps the key from its link for reloads and takes it out of the address bar. */
export function takeViewerKey(code){
 const params=new URLSearchParams(location.hash.slice(1)),key=params.get('key');
 if(key){sessionStorage.setItem(VIEWER_KEY+code,key);history.replaceState(history.state,'',location.pathname+location.search);}
 return sessionStorage.getItem(VIEWER_KEY+code)||'';
}
