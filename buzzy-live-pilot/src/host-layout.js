// Content-sized navigation and one measured clearance for every host tab.
export function installHostLayout(){
 let nav,observer,animation,target,lastWidth=innerWidth,frame;
 const root=document.documentElement,motion=matchMedia('(prefers-reduced-motion: reduce)');
 function update(){
  frame=null;if(!nav?.isConnected)return;
  const viewport=window.visualViewport;
  const bottom=viewport&&viewport.scale===1?Math.max(0,innerHeight-viewport.height-viewport.offsetTop):0;
  root.style.setProperty('--host-visual-bottom',`${bottom}px`);
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
 addEventListener('resize',schedule);window.visualViewport?.addEventListener('resize',schedule);window.visualViewport?.addEventListener('scroll',schedule);
 document.fonts?.ready.then(schedule);motion.addEventListener('change',()=>{animation?.cancel();schedule();});
 return {sync};
}
