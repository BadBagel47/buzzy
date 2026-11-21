// Builds the four pages from the source files in app/ (#441). This replaced the old generator, which
// patched a frozen prototype with string replacements (kept for reference in legacy-generator/).
//   app/page.js, app/page.css, app/page-network.css  the host and player page script and styles
//   app/host.template.html, app/player.template.html the two page shells; @@BUZZY_INCLUDE:name@@ marks where a file goes
//   app/player-page-patches.mjs                      the few places where the player page script differs
//   app/index.html, app/viewer.html                  the start page and the viewer shell, copied as they are
// Edit the files in app/ and run `npm run pages` (the dev, build and test scripts do it for you).
import {readFileSync,writeFileSync} from 'node:fs';
import playerPatches from '../app/player-page-patches.mjs';
const app=new URL('../app/',import.meta.url),root=new URL('../',import.meta.url);
const read=name=>readFileSync(new URL(name,app),'utf8');
function patch(text,from,to,label){
 const count=text.split(from).length-1;
 if(count!==1)throw new Error(`${label}: expected exactly one match, found ${count}: ${from.slice(0,80)}`);
 return text.replace(from,()=>to);
}
function page(role){
 let script=read('page.js');
 if(role==='player')playerPatches.forEach(([from,to],i)=>{script=patch(script,from,to,`app/player-page-patches.mjs entry ${i+1}`);});
 const parts={'page.css':read('page.css'),'page-network.css':read('page-network.css'),'page.js':script};
 const seen=new Set();
 const html=read(`${role}.template.html`).replace(/@@BUZZY_INCLUDE:([\w.-]+)@@/g,(marker,name)=>{
  if(!(name in parts))throw new Error(`app/${role}.template.html: unknown include ${name}`);
  seen.add(name);return parts[name];
 });
 for(const name of Object.keys(parts))if(!seen.has(name))throw new Error(`app/${role}.template.html: missing include ${name}`);
 return html;
}
for(const role of ['host','player'])writeFileSync(new URL(`${role}.html`,root),page(role));
for(const name of ['index.html','viewer.html'])writeFileSync(new URL(name,root),read(name));
