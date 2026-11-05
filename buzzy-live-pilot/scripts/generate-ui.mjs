import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const target=process.env.VITE_BUZZY_TARGET||'emulator';if(!['emulator','pilot'].includes(target))throw new Error('Invalid build target');
const output=new URL('../../buzzy-output/',import.meta.url);
const base=readFileSync(new URL('buzzy_midnight_studio_v7_51.html',output),'utf8');
if(createHash('sha256').update(base).digest('hex')!=='f5438b101f32c1f93f5d094c2a8f3d6513b0b3dc417a961585f6d0acf669e017')throw new Error('Unexpected reference; preserve and review before regenerating.');
let html=base.replaceAll('v7.51','v7.52').replaceAll('Date.now()','gameNow()');
html=html.replace("const BUZZY_BUILD='development';", "function gameNow(){return window.BuzzyNetwork?.now?.()??Date.now();}\nconst BUZZY_BUILD=window.BUZZY_RUNTIME?'network':'development';");
html=html.replace("code:'B7K4'", "code:'B7K4',codeSource:'demo'");
html=html.replace('state.playerEffects={};state.coinSeen=',`if(window.BUZZY_RUNTIME){Object.assign(state,{devUi:false,code:'',codeSource:'server',players:[],questions:[],selected:null,viewAs:null,preview:window.BUZZY_RUNTIME.role==='player'});}\nstate.playerEffects={};state.coinSeen=`);
// #255: the final first-button rule centers with top/bottom + auto margins.
// Remove its obsolete individual translate fallback; CSS lowering must not revive it.
html=html.replace('top:50%;margin:0!important;translate:0 -50%;flex:none', 'top:50%;margin:0!important;flex:none');
html=html.replace('function render(){',"function render(){\n if(window.BUZZY_RUNTIME&&!state.networkReady)return;\n queueMicrotask(()=>window.BuzzyNetwork?.afterRender?.());");
html=html.replace('button.className=incoming.className;', 'button.className=incoming.className;button.disabled=incoming.disabled;');
html=html.replace('function renderPlayer(){\n const p=me()||state.players[0],q=currentQ();',"function renderPlayer(){\n const p=me()||state.players[0];if(!p)return '<div class=\"phone\"><p>Waiting for players to join.</p></div>';const q=currentQ();");
html=html.replace('function prototypeAction(action){',"function prototypeAction(action){if(window.BUZZY_RUNTIME&&action==='copy-link')return false;");
html=html.replace('function handle(action){',"function handle(action){\n if(window.BuzzyNetwork?.handle(action))return;");
html=html.replace('function buzz(id){',"function buzz(id){if(window.BuzzyNetwork&&!window.BuzzyNetwork.local)return window.BuzzyNetwork.buzz(id);");
html=html.replace('function beginAutoPreload(){',"function beginAutoPreload(){\n if(window.BUZZY_RUNTIME)return window.BuzzyNetwork?.preload?.();");
html=html.replace('function maybeExpire(){',"function maybeExpire(){if(window.BUZZY_RUNTIME)return window.BuzzyNetwork?.maybeExpire?.();");
const api=`window.BuzzyView={state,render,handle,tip,currentQ,resolveQuestionBehavior,ensureRound,currentAttempt,finishRound,resetCurrentRound,clearPlayerPanelsForPlay,advanceQuestion,startQuickQuestion,loadQuestion,startPreparedQuestions,playSound,animateBuzzLogos,scheduleTimeoutFlip,selectTimedBuzz,nextUngradedBuzz,showJoinAnnouncement,confetti};\n`;
html=html.replace("let previousHostTimerTick=performance.now();",api+"let previousHostTimerTick=performance.now();");
// The frozen #287 standalone reference remains untouched.

for(const role of ['host','player']){
 let app=html.replace('<html ',`<html data-network-role="${role}" `);
 app=app.replace('</head>',`<style>
 html[data-network-role] .shell{display:block;visibility:hidden}html[data-network-ready] .shell{visibility:visible}
 html[data-network-role] .lab-controls,html[data-network-role] .lab-view-switch,html[data-network-role] .lab-score-float,html[data-network-role] #previewtoggle{display:none!important}
 html[data-network-role=host] #sidecol,html[data-network-role=player] #maincol{display:none!important}
 html[data-network-role=host] #maincol{display:block!important;width:100%}
 html[data-network-role=player] #sidecol{display:block!important;width:100%;margin:0 auto;max-width:520px}
 #network-bar{display:flex;gap:12px;align-items:center;justify-content:space-between;max-width:1100px;margin:8px auto;padding:8px 16px;font-size:14px}
 #network-bar a{color:inherit;font-weight:700}html[data-network-busy] .coin-buzzer{pointer-events:none}
 [data-network-blocked]{pointer-events:none!important}
 #network-status[data-error=true]{color:#a31d34}
 </style><script>window.BUZZY_RUNTIME={role:${JSON.stringify(role)},transport:${JSON.stringify('spark-'+target)}};</script></head>`);
 app=app.replace('ROOM B7K4','ROOM —').replace('<div class="shell">','<div id="network-bar"><span id="network-status" role="status">Connecting to your room…</span><a href="/" id="leave-room">Leave room</a></div><div class="shell">');
 app=app.replace(/<div class="lab-view-switch">[\s\S]*?<\/div>/,'');
 app=app.replace(/<section class="lab-controls"[\s\S]*?<div id="modalroot">/, '<div id="modalroot">');
 app=app.replace(/<div class="split" style="padding:0 7px 10px">[\s\S]*?<\/select><\/div>/,'');
 app=app.replace('<p class="sm muted" style="text-align:center;margin-top:12px">Prototype only · One shared demo state, not online multiplayer</p>','');
 app=app.replaceAll('Room expires 14 days after creation','The host can end this game and delete its room data.').replaceAll('Time remaining','Room lifetime').replaceAll('Saved events from this demo session.','Saved events from this room.').replaceAll('Export demo history as JSON','Export history as JSON').replaceAll('buzzy-demo-history.json','buzzy-room-history.json').replaceAll('In the real app, records will be saved in Firebase for the room lifetime.','Completed round records are saved for this room.');
 app=app.replace("actionButton('Copy example join link','copy-link','btn full')","actionButton('Copy room link','copy-link','btn full')+actionButton('End game','end-room','btn full danger')");
 app=app.replace("if(ex){let left=","if(ex){if(window.BUZZY_RUNTIME){ex.textContent='Until ended';return;}let left=");
 app=app.replace('</body>','<script type="module" src="/src/bridge.js"></script></body>');
 writeFileSync(`${role}.html`,app);
}
let landing=readFileSync(new URL('buzzy_landing_v1.html',output),'utf8');
landing=landing.replace(/<title>[\s\S]*?<\/title>/,'<title>Buzzy · Join a game</title>');
landing=landing.replace(/<script>[\s\S]*?<\/script>/g,'').replace(/<dialog[\s\S]*?<\/dialog>/,'');
landing=landing.replaceAll('6 characters','4 characters').replace('maxlength="12"','maxlength="4"').replace('placeholder="······"','placeholder="····"');
landing=landing.replace('.join-button:active{transform:translateY(1px);filter:brightness(.94)}','.join-button:active{background:#3362ed}button{-webkit-tap-highlight-color:transparent}');
landing=landing.replace('</main>','<p id="entry-status" role="status" class="intro" hidden></p></main>').replace('</body>','<script type="module" src="/src/entry.js"></script></body>');
landing=landing.replace('Design preview. Download and open this file in your browser to try the controls.','Enable JavaScript to create or join a room.');
writeFileSync('index.html',landing);
