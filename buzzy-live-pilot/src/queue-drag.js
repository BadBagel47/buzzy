// #400: reorder the question queue by dragging with mouse or touch. While a card is dragged it follows the
// pointer and the other cards slide aside to show where it will land; on release the existing moveQuestion()
// commits the order and its own FLIP animation glides the card into place. The arrow buttons still work.
export function installQueueDrag(){
 let drag=null;
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 // The browser's built-in drag would compete with this one.
 document.addEventListener('dragstart',event=>{if(event.target.closest?.('[data-question-drag]'))event.preventDefault();},true);
 function cleanup(){
  if(!drag)return;clearTimeout(drag.timer);
  for(const el of drag.cards){el.classList.remove('queue-drag-active','queue-drag-shift');el.style.transform='';}
  document.body.classList.remove('queue-dragging');drag=null;
 }
 function begin(){
  if(!drag||drag.active)return;
  drag.active=true;
  drag.rects=drag.cards.map(el=>el.getBoundingClientRect());
  const r=drag.rects,i=drag.index;
  drag.step=r.length>1?(i+1<r.length?r[i+1].top-r[i].top:r[i].top-r[i-1].top):r[0].height;
  drag.card.classList.add('queue-drag-active');document.body.classList.add('queue-dragging');
  for(const el of drag.cards)if(el!==drag.card)el.classList.add('queue-drag-shift');
  try{drag.card.setPointerCapture(drag.pointerId);}catch{}
  navigator.vibrate?.(10);
 }
 function update(dy){
  const {cards,rects,index,step}=drag;
  const min=rects[0].top-rects[index].top,max=rects[rects.length-1].top-rects[index].top;
  const y=Math.max(min-12,Math.min(max+12,dy));
  // A re-render may reset classes and styles on the mounted cards; restore the drag look on every move.
  drag.card.classList.add('queue-drag-active');for(const el of cards)if(el!==drag.card)el.classList.add('queue-drag-shift');
  drag.card.style.transform=`translateY(${y}px)`;
  const center=rects[index].top+rects[index].height/2+y;let target=index;
  cards.forEach((el,i)=>{
   if(i===index)return;const mid=rects[i].top+rects[i].height/2;let shift=0;
   if(i<index&&center<mid){shift=step;target=Math.min(target,i);}
   if(i>index&&center>mid){shift=-step;target=Math.max(target,i);}
   el.style.transform=shift?`translateY(${shift}px)`:'';
  });
  drag.target=target;
 }
 document.addEventListener('pointerdown',event=>{
  const card=event.target.closest?.('.library-question-card[data-question-drag]');
  if(!card||event.button>0||event.target.closest('button,a,input,select,textarea,summary,label'))return;
  const cards=[...card.parentElement.querySelectorAll(':scope > .library-question-card[data-question-drag]')];
  if(cards.length<2)return;
  cleanup();
  drag={card,cards,index:cards.indexOf(card),target:cards.indexOf(card),startY:event.clientY,startX:event.clientX,pointerId:event.pointerId,touch:event.pointerType!=='mouse',active:false,timer:null};
  // Touch starts after a short press, so a normal swipe still scrolls the page.
  if(drag.touch)drag.timer=setTimeout(begin,260);
 });
 document.addEventListener('pointermove',event=>{
  if(!drag||event.pointerId!==drag.pointerId)return;
  const dy=event.clientY-drag.startY,dx=event.clientX-drag.startX;
  if(!drag.active){
   if(drag.touch){if(Math.hypot(dx,dy)>8)cleanup();return;}
   if(Math.abs(dy)<5)return;begin();
  }
  event.preventDefault();update(dy);
 });
 // While a touch drag runs the page must not scroll.
 document.addEventListener('touchmove',event=>{if(drag?.active)event.preventDefault();},{passive:false});
 function finish(event){
  if(!drag||event.pointerId!==drag.pointerId)return;
  if(!drag.active){cleanup();return;}
  const {card,cards,index,target}=drag;
  const from=Number(card.dataset.questionDrag),to=Number(cards[target]?.dataset.questionDrag);
  // Stop the slide transitions so the committed order starts from exactly what is on screen.
  for(const el of cards)el.classList.remove('queue-drag-shift');
  if(target===index||!Number.isFinite(to)||typeof window.BuzzyMoveQuestion!=='function'){
   if(!reduced())card.animate([{transform:card.style.transform||'none'},{transform:'none'}],{duration:200,easing:'cubic-bezier(.22,.8,.2,1)'});
   cleanup();return;
  }
  // moveQuestion measures the cards where they are now (including the drag offsets), renders the new order
  // and animates each card from there; the dragged card glides into its slot.
  document.body.classList.remove('queue-dragging');card.classList.remove('queue-drag-active');
  drag=null;window.BuzzyMoveQuestion(from,to);
  for(const el of cards)el.style.transform='';
 }
 document.addEventListener('pointerup',finish);
 document.addEventListener('pointercancel',event=>{if(drag&&event.pointerId===drag.pointerId){if(drag.active)drag.card.style.transform='';cleanup();}});
 return {get dragging(){return !!drag?.active;}};
}
