// #378: dark host theme. The host follows the device's light/dark setting unless the host picks
// Light or Dark under Settings → Appearance. The choice is stored on this device only.
// The dark palette is derived from the page's own stylesheets: every light surface, border and
// text colour gets a dim slate counterpart under :root[data-host-theme=dark]. Player and viewer
// pages never load this module, so their styles are unaffected.
const storageKey='buzzy-host-theme',choices=['auto','light','dark'];
const DARK=':root[data-host-theme=dark]';

const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
function toHsl(r,g,b){r/=255;g/=255;b/=255;const M=Math.max(r,g,b),m=Math.min(r,g,b);let h=0,s=0;const l=(M+m)/2;if(M!==m){const d=M-m;s=l>.5?d/(2-M-m):d/(M+m);h=M===r?(g-b)/d+(g<b?6:0):M===g?(b-r)/d+2:(r-g)/d+4;h/=6;}return [h,s,l];}
function toRgb(h,s,l){if(!s){const v=Math.round(l*255);return [v,v,v];}const q=l<.5?l*(1+s):l+s-l*s,p=2*l-q,f=t=>{if(t<0)t+=1;if(t>1)t-=1;return t<1/6?p+(q-p)*6*t:t<1/2?q:t<2/3?p+(q-p)*(2/3-t)*6:p;};return [f(h+1/3),f(h),f(h-1/3)].map(v=>Math.round(v*255));}

// kind: 'text' (text, icons), 'bg' (surfaces), 'border'.
export function mapColor(r,g,b,kind){
 let [h,s,l]=toHsl(r,g,b);
 if(kind==='text'){
  if(s>.35&&l>=.28&&l<.72){l=Math.max(.72,l+.25);s=Math.min(s,.75);} // coloured text and icons become light tints
  else if(l<.5){l=clamp(.93-l*.45);s=Math.min(s,.3);}
 }else if(l>=.6){
  // Light surfaces become dim slate. Whiter (more raised) surfaces stay slightly lighter.
  l=kind==='border'?.4+(l-.75)*.3:l>=.93?.25+(l-.93)*.5:.105+(l-.75)*.3;s=Math.min(s,.28); // #386 level A: darker page and cards
  // #384: near-white raised surfaces (buttons, chips) stay clearly lighter than cards, as in the light theme.
  if(s<.06){h=.59;s=.2;}
  if(kind==='bg'&&l<.09)l=.09;
 }else if(kind==='bg'&&s>.45&&l>.4){s*=.78;l*=.86;} // large accent fills glare less
 return toRgb(h,s,l);
}
const colorPattern=/#([0-9a-f]{3,8})\b|rgba?\(([^)]+)\)/gi;
const hex2=v=>v.toString(16).padStart(2,'0');
export function mapValue(value,kind){
 // Colours inside inline SVG data URLs (select chevrons) are icons: treat them as text.
 value=value.replace(/%23([0-9a-f]{6})(?![0-9a-f])/gi,(match,hex)=>'%23'+mapColor(...[0,2,4].map(i=>parseInt(hex.slice(i,i+2),16)),'text').map(hex2).join(''));
 if(!/#|rgb/i.test(value.replace(/url\([^)]*\)/g,'')))return value;
 return value.replace(colorPattern,(match,hex,args)=>{
  let r,g,b,a='';
  if(hex){
   if(![3,4,6,8].includes(hex.length))return match;
   const full=hex.length<5?[...hex].map(c=>c+c).join(''):hex;
   [r,g,b]=[0,2,4].map(i=>parseInt(full.slice(i,i+2),16));if(full.length===8)a=(parseInt(full.slice(6,8),16)/255).toFixed(3);
  }else{const parts=args.split(/[\s,\/]+/).filter(Boolean);if(parts.slice(0,3).some(p=>p.includes('%')||p.includes('var')))return match;[r,g,b]=parts.slice(0,3).map(Number);if(parts[3]!==undefined)a=parts[3];}
  if([r,g,b].some(Number.isNaN))return match;
  const [R,G,B]=mapColor(r,g,b,kind);
  return a!==''?`rgba(${R},${G},${B},${a})`:`rgb(${R},${G},${B})`;
 });
}
function kindOf(property){
 if(property.startsWith('--'))return /text|ink|muted|subtitle|fg/.test(property)?'text':/border|line/.test(property)?'border':/shadow/.test(property)?null:'bg';
 if(['color','fill','stroke','caret-color','-webkit-text-fill-color','text-decoration-color'].includes(property))return 'text';
 if(/^(border|outline)/.test(property))return 'border';
 if(/^background/.test(property))return 'bg';
 return null;
}
// Split a selector list on top-level commas only, so :is(a,b) stays intact.
function splitSelectors(text){const out=[];let depth=0,start=0;for(let i=0;i<text.length;i++){const c=text[i];if(c==='('||c==='[')depth++;else if(c===')'||c===']')depth--;else if(c===','&&!depth){out.push(text.slice(start,i));start=i+1;}}out.push(text.slice(start));return out.map(s=>s.trim()).filter(Boolean);}
function scope(selector){
 if(selector.startsWith(':root'))return DARK+selector.slice(5);
 if(/^html(?![\w-])/.test(selector))return 'html[data-host-theme=dark]'+selector.slice(4);
 return DARK+' '+selector;
}
const shorthandList=['background','border','border-top','border-right','border-bottom','border-left','border-color','border-block','border-inline','outline'];
function convertRules(rules){
 let css='';
 for(const rule of rules){
  if(rule instanceof CSSStyleRule){
   const declarations=[];
   // A shorthand written with var() (background:var(--blue)) leaves its longhands empty, so read the shorthand too.
   const shorthands=shorthandList.filter(p=>rule.style.getPropertyValue(p).includes('var('));
   for(const property of [...rule.style,...shorthands]){
    const kind=kindOf(property);if(!kind)continue;
    // Every colour declaration is mirrored, changed or not, so the cascade between rules stays the same as in light.
    const value=rule.style.getPropertyValue(property);if(!value)continue;
    const mapped=mapValue(value,kind);
    declarations.push(`${property}:${mapped}${rule.style.getPropertyPriority(property)?' !important':''}`);
   }
   if(declarations.length)css+=`${splitSelectors(rule.selectorText).map(scope).join(',')}{${declarations.join(';')}}\n`;
   if(rule.cssRules?.length){const nested=convertRules(rule.cssRules);if(nested)css+=nested;}
  }else if(rule.cssRules&&!(rule instanceof CSSKeyframesRule)){
   const inner=convertRules(rule.cssRules);
   if(inner)css+=`${rule.cssText.slice(0,rule.cssText.indexOf('{'))}{\n${inner}}\n`;
  }
 }
 return css;
}
// Hand-tuned details on top of the derived palette.
const extras=`
${DARK}{color-scheme:dark}
${DARK} body{background:#131a23}
${DARK} body.theme-a.lab-host-view .btn.danger:not(.primary){background:transparent!important;color:#f2a2ad!important;border-color:#8f4a55!important}
${DARK} body.theme-a.lab-host-view .btn.danger:not(.primary):hover{background:rgba(242,162,173,.08)!important}
${DARK} body.theme-a.lab-host-view .btn.green,${DARK} body.theme-a.lab-host-view .quickplay-main.green{filter:saturate(.82) brightness(.9)}
${DARK} body.theme-a.lab-host-view img{opacity:.92}
${DARK} body.theme-a.lab-host-view :is(.ai-error,.ai-rejected-list p){color:#f2a2ad}
${DARK} body.theme-a.lab-host-view :is(.ai-note,.ai-notice,.ai-demo-banner b){color:#e8c36b}
${DARK} body.theme-a.lab-host-view :is(.ai-hint svg,.ai-dot.done,.host-answer b){color:#7fd8ad}
${DARK} body.theme-a.lab-host-view :is(.card,.questions-section-card,.studio-modal,.round-overview-sheet){border-color:#2f3f53}
`;
export function installHostTheme({onChange}={}){
 const root=document.documentElement,media=matchMedia('(prefers-color-scheme: dark)');
 let choice=read(),style=null,built=false;
 function read(){try{const value=localStorage.getItem(storageKey);return choices.includes(value)?value:'auto';}catch{return 'auto';}}
 function build(){
  let css='';
  for(const sheet of document.styleSheets){if(sheet.ownerNode===style)continue;try{css+=convertRules(sheet.cssRules);}catch{/* cross-origin or not loaded yet */}}
  if(!style){style=document.createElement('style');style.id='host-theme-dark';document.head.append(style);}
  style.textContent=css+extras;built=true;
 }
 function apply(){
  const dark=choice==='dark'||choice==='auto'&&media.matches;
  if(dark&&!built)build();
  root.dataset.hostTheme=dark?'dark':'light';root.dataset.hostThemeChoice=choice;
 }
 function set(value){if(!choices.includes(value))return;choice=value;try{localStorage.setItem(storageKey,value);}catch{}apply();onChange?.(choice);}
 media.addEventListener('change',apply);
 // Stylesheets that finish loading later are included as well.
 addEventListener('load',()=>{if(built)build();},{once:true});
 for(const link of document.querySelectorAll('link[rel=stylesheet]'))if(!link.sheet)link.addEventListener('load',()=>{if(built)build();},{once:true});
 apply();
 return {get choice(){return choice;},get dark(){return root.dataset.hostTheme==='dark';},set};
}
