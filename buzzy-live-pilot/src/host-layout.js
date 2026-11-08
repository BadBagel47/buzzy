// Content-sized navigation and one measured clearance for every host tab.
export function installHostLayout(){
 let nav,observer,animation,target,lastWidth=innerWidth,frame,headerTemplate,headerKey;
 const root=document.documentElement,motion=matchMedia('(prefers-reduced-motion: reduce)');
 function syncHeader(){
  const page=document.getElementById('host-view-content'),bar=page?.querySelector(':scope > .host-push-incoming .appbar')||page?.querySelector(':scope > .appbar');if(!bar)return;
  if(bar.classList.contains('appbar-play'))headerTemplate=bar.cloneNode(true);
  if(!headerTemplate)return;
  const width=bar.getBoundingClientRect().width,key=width+':'+headerTemplate.outerHTML;
  if(key===headerKey)return;headerKey=key;
  // Measure Play's natural toolbar height without inheriting the reserved height.
  // Other tabs reserve this same space, including after a viewport resize.
  const probe=headerTemplate.cloneNode(true);probe.inert=true;probe.setAttribute('aria-hidden','true');
  probe.querySelectorAll('[id]').forEach(e=>e.removeAttribute('id'));
  Object.assign(probe.style,{position:'fixed',visibility:'hidden',pointerEvents:'none',width:width+'px',minHeight:'40px',height:'auto',top:'0',left:'0'});
  page.append(probe);const height=probe.getBoundingClientRect().height;probe.remove();
  root.style.setProperty('--host-appbar-height',height+'px');
 }
 function update(){
  frame=null;syncHeader();if(!nav?.isConnected)return;
  const active=nav.querySelector('[data-nav].active');if(!active)return;
  const box=nav.getBoundingClientRect(),button=active.getBoundingClientRect(),style=getComputedStyle(nav);
  root.style.setProperty('--host-nav-height',`${box.height}px`);
  const next={left:button.left-box.left-parseFloat(style.borderLeftWidth),top:button.top-box.top-parseFloat(style.borderTopWidth),width:button.width,height:button.height};
  const resized=innerWidth!==lastWidth;lastWidth=innerWidth;
  if(target&&Object.keys(next).every(k=>Math.abs(next[k]-target[k])<.1))return;
  const before=getComputedStyle(nav,'::before'),from={transform:before.transform,width:before.width,height:before.height};
  animation?.cancel();
  for(const [name,value] of Object.entries(next))nav.style.setProperty(`--nav-highlight-${name}`,`${value}px`);
  if(target&&!resized&&!motion.matches)animation=nav.animate([from,{transform:`translateX(${next.left}px)`,width:`${next.width}px`,height:`${next.height}px`}],{duration:280,easing:'cubic-bezier(.22,.8,.2,1)',pseudoElement:'::before'});
  target=next;nav.dataset.navGeometryReady='true';
 }
 function schedule(){if(frame==null)frame=requestAnimationFrame(update);}
 function sync(){
  const current=document.querySelector('#hostcontent .nav');
  if(current!==nav){observer?.disconnect();animation?.cancel();nav=current;target=null;if(nav){observer=new ResizeObserver(schedule);observer.observe(nav);nav.querySelectorAll('[data-nav]').forEach(b=>observer.observe(b));}}
  update();
 }
 addEventListener('resize',schedule);
 document.fonts?.ready.then(()=>{headerKey=null;schedule();});motion.addEventListener('change',()=>{animation?.cancel();schedule();});
 return {sync};
}
