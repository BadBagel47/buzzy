// Network-only transformations. The frozen standalone reference stays unchanged.
export function applyUiBatch(html){
 function replace(from,to){if(!html.includes(from))throw new Error(`UI batch source mismatch: ${from.slice(0,90)}`);html=html.replace(from,to);}
 replace('state.settingsOpen={game:true,display:true,effects:false};','state.settingsOpen={game:false,display:false,effects:false};');
 replace("${actionButton(qrIcon()+'Show QR','qr','btn sm')}",'');
 replace("${actionButton('Launch final celebration','celebrate','btn full soft')}",'');
 replace("${subGroup('Visual effects',effectsVisual)}", "${subGroup('Visual effects',effectsVisual+actionButton('Launch celebration for all','celebrate','btn full'))}");
 // One common source of bottom clearance replaces the legacy per-render spacer.
 replace('<div style="height:30px"></div>${hostLeaderboardOverlay()}', '${hostLeaderboardOverlay()}');
 const assignment=html.match(/hostPage\.innerHTML=(`[^\n]+`);/);
 if(!assignment)throw new Error('Host markup assignment missing');
 replace(assignment[0],`window.BuzzyNetwork.patchHostPage(hostPage,${assignment[1]});`);
 // The inner editor is opaque throughout a tab switch; only its height changes.
 replace("[{height:oldHeight+'px',opacity:.7},{height:newHeight+'px',opacity:1}]", "[{height:oldHeight+'px'},{height:newHeight+'px'}]");
 // Preserve the editor root and its background as the controls are changed.
 replace("if(!oldEditor||!nextEditor||oldEditor.outerHTML!==nextEditor.outerHTML)clip.innerHTML=nextClip.innerHTML;", "if(!oldEditor||!nextEditor||oldEditor.outerHTML!==nextEditor.outerHTML)window.BuzzyNetwork.patchHostPage(clip,nextClip.innerHTML);");
 const start=html.indexOf('function confetti(){'),end=html.indexOf('\nfunction animateBuzzLogos',start);
 if(start<0||end<0)throw new Error('Celebration entry missing');
 html=html.slice(0,start)+'function confetti(){window.BuzzyNetwork?.celebrateVisual?.();}'+html.slice(end);
 // Retain content through collapse so the existing height animation has an end.
 const old=html.match(/ if\(animateQuickPanel\)\{[^\n]+state\.quickContentTransition=false;/)?.[0];
 if(!old)throw new Error('Quick content animation missing');
 replace(old,` if(animateQuickPanel){const incoming=hostPage.querySelector('.play-mode-content');if(incoming&&previousPanelHeight>0){
  incoming.getAnimations().forEach(a=>a.cancel());const targetHeight=incoming.getBoundingClientRect().height;
  if(!state.showQuickContent&&previousQuickContent){
   const closing=previousQuickContent.cloneNode(true);closing.removeAttribute('id');closing.dataset.uiClosing='true';closing.inert=true;closing.setAttribute('aria-hidden','true');closing.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));incoming.prepend(closing);
   const collapse=closing.animate([{height:closing.getBoundingClientRect().height+'px',marginBottom:'5px'},{height:'0px',marginBottom:'0px',paddingBlock:'0px',borderWidth:'0px'}],{duration:260,easing:'cubic-bezier(.22,.8,.2,1)',fill:'forwards'});
   collapse.finished.catch(()=>{}).then(()=>closing.remove());
  }
  incoming.style.overflow='hidden';
  const anim=incoming.animate([{height:previousPanelHeight+'px'},{height:targetHeight+'px'}],{duration:260,easing:'cubic-bezier(.22,.8,.2,1)'});
  const release=()=>{if(incoming.isConnected)incoming.style.overflow='';};anim.addEventListener('finish',release,{once:true});anim.addEventListener('cancel',release,{once:true});
 }}state.quickContentTransition=false;`);
 replace("const oldModeContent=animatePanelHeight?previousPanel?.cloneNode(true):null;", "const oldModeContent=animatePanelHeight?previousPanel?.cloneNode(true):null;const previousQuickContent=animateQuickPanel?previousPanel?.querySelector('.quick-content-panel'):null;");
 return html;
}
