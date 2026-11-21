// #447: after a new publish, a page that was already open (or saved to the home screen) may ask for a code chunk
// the publish removed. Reload once to get the new page; if that already happened in the last minute, let the error show.
const KEY='buzzy-reloaded-for-update';
export const UPDATED_MESSAGE='Buzzy has been updated. Reload the page to continue.';
export function installStaleChunkReload(win=window){
 win.addEventListener('vite:preloadError',event=>{
  let last=0;try{last=Number(win.sessionStorage.getItem(KEY)||0);}catch{}
  if(Date.now()-last<60000)return;
  try{win.sessionStorage.setItem(KEY,String(Date.now()));}catch{}
  event.preventDefault();win.location.reload();
 });
}
/** A failed lazy import gets a plain sentence instead of the browser's technical message. */
export async function lazy(load){
 try{return await load();}
 catch(error){if(/dynamically imported module|Importing a module script failed|error loading dynamically imported/i.test(error?.message||''))throw Object.assign(new Error(UPDATED_MESSAGE),{code:'app/updated'});throw error;}
}
