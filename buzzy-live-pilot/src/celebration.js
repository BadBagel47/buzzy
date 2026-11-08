// Each burst owns its particles and timer, so overlapping launches can finish.
export function createCelebration(enabled){
 const batches=new Set();
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 function remove(batch){clearTimeout(batch.timer);for(const particle of batch.particles){particle.getAnimations().forEach(animation=>animation.cancel());particle.remove();}batches.delete(batch);}
 function clear(){for(const batch of batches)remove(batch);}
 function sync(){if(motion.matches||!enabled())clear();}
 function launch(){
  if(motion.matches||!enabled())return;
  const root=document.getElementById('confetti');if(!root)return;
  const {width,height}=root.getBoundingClientRect(),colors=['#315de8','#28b589','#f0b64a','#df6897','#9a80ea'];let finish=0;const batch={particles:[],timer:null};batches.add(batch);
  for(let i=0;i<432;i++){
   const side=i%2===0?'left':'right',direction=side==='left'?1:-1;
   const startX=side==='left'?-9:width+9,startY=height+12;
   const distance=width*(.62+Math.random()*.85),lift=height*(.72+Math.random()*.34),rotation=Math.random()*360;
   const ascent=800+Math.random()*200,descent=1700+Math.random()*300,duration=ascent+descent,delay=Math.random()*360;
   const particle=document.createElement('i');particle.className='celebration-particle';particle.dataset.origin=side;particle.style.background=colors[i%colors.length];root.append(particle);batch.particles.push(particle);
   const frames=Array.from({length:17},(_,n)=>{const t=n/16,offset=t<=.5?2*t*ascent/duration:(ascent+2*(t-.5)*descent)/duration;return {offset,transform:`translate(${startX+direction*distance*t}px,${startY-4*lift*t*(1-t)}px) rotate(${rotation+direction*720*t}deg)`,opacity:t===0||t===1?0:1};});
   particle.animate(frames,{duration,delay,easing:'linear',fill:'both'});finish=Math.max(finish,duration+delay);
  }
  batch.timer=setTimeout(()=>remove(batch),finish+80);
 }
 motion.addEventListener('change',sync);
 return {launch,sync,clear};
}
