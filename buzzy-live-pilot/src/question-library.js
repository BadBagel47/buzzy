// #444: the host's prepared questions live on this device, not only in a room. Rooms are short-lived (with
// network-kit they are deleted a day after the last participant leaves), so questions written days ahead are kept
// here and copied into each new room. Export and import move them between devices as a file.
const KEY='buzzy-question-library';
const own=q=>q&&typeof q==='object'&&!q.isDemo&&(typeof q.text==='string'||typeof q.title==='string');
export function libraryQuestions(questions){return (Array.isArray(questions)?questions:[]).filter(own);}
export function loadLibrary(){
 try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');return Array.isArray(saved?.questions)?libraryQuestions(saved.questions):[];}catch{return [];}
}
let last='';
export function saveLibrary(questions){
 const list=libraryQuestions(questions),text=JSON.stringify(list);if(text===last)return;last=text;
 // An empty list (for example an older room without questions) never replaces a saved library.
 if(!list.length)return;
 try{localStorage.setItem(KEY,JSON.stringify({version:1,savedAt:new Date().toISOString(),questions:list}));}catch{}
}
// A copy for a new quiz: nothing is played, started or skipped yet, and ids are unique within the room.
// #452: a played or skipped question was also marked inactive (active:false) and the page passes over inactive
// questions, so it must become active again. A question the host switched off without playing it stays off.
export function freshCopy(list,taken=new Set()){
 return libraryQuestions(list).map((q,i)=>{
  let id=String(q.id||'');if(!id||taken.has(id))id=`q${Date.now().toString(36)}${i}`;taken.add(id);
  const used=!!(q.played||q.skipped||q.started);
  const {playedOrder,...rest}=q;
  return {...rest,id,played:false,started:false,skipped:false,active:used?true:q.active};
 });
}
export function exportLibrary(questions){
 const list=libraryQuestions(questions);
 const blob=new Blob([JSON.stringify({app:'buzzy',kind:'questions',version:1,exportedAt:new Date().toISOString(),questions:list},null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download=`buzzy-questions-${new Date().toISOString().slice(0,10)}.json`;document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
 return list.length;
}
// Resolves with the questions in a file the player chooses, or null if none was chosen.
export function chooseImportFile(){
 return new Promise((resolve,reject)=>{
  const input=document.createElement('input');input.type='file';input.accept='application/json,.json';input.hidden=true;
  input.addEventListener('change',async()=>{
   const file=input.files?.[0];input.remove();if(!file){resolve(null);return;}
   try{
    if(file.size>2_000_000)throw new Error('The file is too large for a question list.');
    const data=JSON.parse(await file.text()),list=Array.isArray(data)?data:data?.questions;
    if(!Array.isArray(list))throw new Error('This file does not contain Buzzy questions.');
    resolve(libraryQuestions(list));
   }catch(error){reject(error instanceof SyntaxError?new Error('This file is not a Buzzy question file.'):error);}
  },{once:true});
  document.body.append(input);input.click();
 });
}
