// #283–284: two corner bursts; a new launch owns its particles and cleanup.
export function createCelebration(enabled){
 let cleanup,serial=0;
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 function clear(){clearTimeout(cleanup);++serial;const root=document.getElementById('confetti');if(root){root.getAnimations({subtree:true}).forEach(a=>a.cancel());root.replaceChildren();}}
 function sync(){if(motion.matches||!enabled())clear();}
 function launch(){
  clear();if(motion.matches||!enabled())return;
  const root=document.getElementById('confetti');if(!root)return;
  const token=serial,{width,height}=root.getBoundingClientRect(),colors=['#315de8','#28b589','#f0b64a','#df6897','#9a80ea'];let finish=0;
  for(let i=0;i<64;i++){
   const side=i%2===0?'left':'right',direction=side==='left'?1:-1;
   const startX=side==='left'?-8:width+8,startY=height+12;
   const distance=width*(.6+Math.random()*.35),lift=height*(.55+Math.random()*.35),rotation=Math.random()*360;
   const duration=1600+Math.random()*400,delay=Math.random()*180;
   const particle=document.createElement('i');particle.className='celebration-particle';particle.dataset.origin=side;particle.style.background=colors[i%colors.length];root.append(particle);
   const frames=Array.from({length:17},(_,n)=>{const t=n/16;return {offset:t,transform:`translate(${startX+direction*distance*t}px,${startY-4*lift*t*(1-t)}px) rotate(${rotation+direction*720*t}deg)`,opacity:t===0||t===1?0:1};});
   particle.animate(frames,{duration,delay,easing:'linear',fill:'both'});finish=Math.max(finish,duration+delay);
  }
  cleanup=setTimeout(()=>{if(serial===token)clear();},finish+80);
 }
 motion.addEventListener('change',sync);
 return {launch,sync,clear};
}
