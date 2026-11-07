// Keep active host panels mounted while updating authoritative room data.
// Replacing innerHTML restarts sheet animations and destroys editor focus.
function key(node){
 if(node.nodeType!==1)return null;
 const names=['id','data-action','data-player-row','data-settings-section','data-clock'];
 for(const name of names)if(node.hasAttribute(name))return `${node.tagName}:${name}:${node.getAttribute(name)}`;
 for(const name of ['appbar','quickplay-card','play-mode-switch','play-mode-content','fact-editor-clip','shared-list-sheet','stack'])if(node.classList.contains(name))return `${node.tagName}:panel:${name}`;
 return null;
}
function same(a,b){return a.nodeType===b.nodeType&&(a.nodeType!==1||a.tagName===b.tagName);}
function update(current,fresh){
 if(current.nodeType!==1){if(current.nodeValue!==fresh.nodeValue)current.nodeValue=fresh.nodeValue;return;}
 const focused=current===document.activeElement,controlValue=fresh.value;
 for(const attr of [...current.attributes])if(!fresh.hasAttribute(attr.name)&&!(attr.name==='style'&&current.getAnimations().some(a=>['running','paused'].includes(a.playState))))current.removeAttribute(attr.name);
 for(const attr of fresh.attributes)if(current.getAttribute(attr.name)!==attr.value)current.setAttribute(attr.name,attr.value);
 if(current instanceof HTMLInputElement){
  if(['checkbox','radio'].includes(current.type))current.checked=fresh.checked;
  else if(!focused&&current.value!==controlValue)current.value=controlValue;
 }
 if(current instanceof HTMLTextAreaElement){if(!focused&&current.value!==controlValue)current.value=controlValue;return;}
 reconcile(current,fresh);
 if(current instanceof HTMLSelectElement&&!focused&&current.value!==controlValue)current.value=controlValue;
}
function reconcile(parent,fresh){
 const managed=new Set([...parent.childNodes].filter(n=>n.classList?.contains('mode-exit-snapshot')||(n.dataset?.uiClosing==='true'&&n.getAnimations().some(a=>['running','paused'].includes(a.playState)))));
 const old=[...parent.childNodes].filter(n=>!managed.has(n)),used=new Set(),byKey=new Map(old.map(n=>[key(n),n]).filter(([k])=>k));
 let cursor=old[0]||null;
 for(const wanted of [...fresh.childNodes]){
  const k=key(wanted);
  let node=k?byKey.get(k):old.find(n=>!used.has(n)&&!key(n)&&same(n,wanted));
  if(node&&(!same(node,wanted)||used.has(node)))node=null;
  if(node){used.add(node);update(node,wanted);}else node=wanted;
  if(node!==cursor)parent.insertBefore(node,cursor);
  cursor=node.nextSibling;while(managed.has(cursor))cursor=cursor.nextSibling;
 }
 for(const node of old)if(!used.has(node)&&node.parentNode===parent)node.remove();
}
export function patchHostMarkup(root,markup,tab){
 if(root.dataset.hostTab!==tab){root.innerHTML=markup;return;}
 const active=document.activeElement,selection=active?.selectionStart==null?null:[active.selectionStart,active.selectionEnd];
 const template=document.createElement('template');template.innerHTML=markup;reconcile(root,template.content);
 if(active?.isConnected&&document.activeElement!==active){active.focus({preventScroll:true});if(selection)active.setSelectionRange(...selection);}
}
