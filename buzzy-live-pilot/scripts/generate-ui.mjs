import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {applyUiBatch} from './ui-batch-304-313.mjs';
const target=process.env.VITE_BUZZY_TARGET||'emulator';if(!['emulator','pilot'].includes(target))throw new Error('Invalid build target');
const output=new URL('../../buzzy-output/',import.meta.url);
const base=readFileSync(new URL('buzzy_midnight_studio_v7_51.html',output),'utf8');
if(createHash('sha256').update(base).digest('hex')!=='f5438b101f32c1f93f5d094c2a8f3d6513b0b3dc417a961585f6d0acf669e017')throw new Error('Unexpected reference; preserve and review before regenerating.');
let html=base.replaceAll('v7.51','v7.52').replaceAll('Date.now()','gameNow()');
html=html.replace('.brand b{color:var(--blue)}','.brand b{color:inherit}').replaceAll('style="color:#315de8">.</span>','style="color:#80a8ff">.</span>');
html=html.replace("const BUZZY_BUILD='development';", "function gameNow(){return window.BuzzyNetwork?.now?.()??Date.now();}\nconst BUZZY_BUILD=window.BUZZY_RUNTIME?'network':'development';");
html=html.replace("code:'B7K4'", "code:'B7K4',codeSource:'demo'");
html=html.replace('state.playerEffects={};state.coinSeen=',`if(window.BUZZY_RUNTIME){Object.assign(state,{devUi:false,code:'',codeSource:'server',players:[],questions:[],selected:null,viewAs:null,preview:window.BUZZY_RUNTIME.role==='player'});}\nstate.playerEffects={};state.coinSeen=`);
// #255: the final first-button rule centers with top/bottom + auto margins.
// Remove its obsolete individual translate fallback; CSS lowering must not revive it.
html=html.replace('top:50%;margin:0!important;translate:0 -50%;flex:none', 'top:50%;margin:0!important;flex:none');
html=html.replace('function render(){',"function render(){\n if(window.BUZZY_RUNTIME&&!state.networkReady){captureDialogFocus();syncModal();reconcileDialogFocus();return;}\n queueMicrotask(()=>window.BuzzyNetwork?.afterRender?.());");
html=html.replace('button.className=incoming.className;', 'button.className=incoming.className;button.disabled=incoming.disabled;');
html=html.replace('function renderPlayer(){\n const p=me()||state.players[0],q=currentQ();',"function renderPlayer(){\n const p=me()||state.players[0];if(!p)return '<div class=\"phone\"><p>Waiting for players to join.</p></div>';const q=currentQ();");
html=html.replace('function prototypeAction(action){',"function prototypeAction(action){if(window.BUZZY_RUNTIME&&action==='copy-link')return false;");
html=html.replace('function handle(action){',"function handle(action){\n if(window.BuzzyNetwork?.handle(action))return;");
html=html.replace('function buzz(id){',"function buzz(id){if(window.BuzzyNetwork&&!window.BuzzyNetwork.local)return window.BuzzyNetwork.buzz(id);");
html=html.replace('function beginAutoPreload(){',"function beginAutoPreload(){\n if(window.BUZZY_RUNTIME)return window.BuzzyNetwork?.preload?.();");
html=html.replace('function maybeExpire(){',"function maybeExpire(){if(window.BUZZY_RUNTIME)return window.BuzzyNetwork?.maybeExpire?.();");
// #296: use the existing modal shell, focus lifecycle and closing animation.
html=html.replace("function modalTitle(){", "function modalTitle(){\n if(state.modal?.startsWith('network-'))return window.BuzzyNetwork?.exitTitle(state.modal)||'Room';");
html=html.replace("let inner='';if(state.modal.startsWith('manage:'))", "let inner='';if(state.modal==='network-leave'||state.modal==='network-end'||state.modal==='network-ended'){inner=window.BuzzyNetwork?.exitDialog(state.modal)||'';}else if(state.modal.startsWith('manage:'))");
const api=`window.BuzzyView={state,render,handle,tip,currentQ,resolveQuestionBehavior,ensureRound,currentAttempt,finishRound,resetCurrentRound,clearPlayerPanelsForPlay,advanceQuestion,startQuickQuestion,loadQuestion,startPreparedQuestions,playSound,animateBuzzLogos,scheduleTimeoutFlip,selectTimedBuzz,nextUngradedBuzz,showJoinAnnouncement,confetti};\n`;
html=html.replace("let previousHostTimerTick=performance.now();",api+"let previousHostTimerTick=performance.now();");
// #303: move the whole view by viewport width and let the page clip at its edges.
html=html.replace('translateX(${-sign*100}%)','translateX(${-sign*window.innerWidth}px)').replace('translateX(${sign*100}%)','translateX(${sign*window.innerWidth}px)');
html=html.replace('<h2>Room ${safe(state.code)}</h2>','<h2>Room information</h2>');
html=html.replace("$('#header-code').textContent='ROOM '+state.code;", "if($('#header-code'))$('#header-code').textContent='ROOM '+state.code;");
const leaveSvg='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 17 5-5-5-5M21 12H9"/><path d="M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4"/></svg>';
const qrSvg='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3zM15 15h3v3h-3zM21 14v7h-6M12 3v3M3 12h3M12 9v5h-2M12 18v3M18 12h3"/></svg>';
const linkSvg='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m10 13 4-4M8 16l-1 1a4.2 4.2 0 0 1-6-6l4-4a4.2 4.2 0 0 1 6 0M16 8l1-1a4.2 4.2 0 0 1 6 6l-4 4a4.2 4.2 0 0 1-6 0" transform="translate(1 0) scale(.92 1)"/></svg>';
// The frozen #287 standalone reference remains untouched.

html=applyUiBatch(html);
const arrowPaths={up:'M12 19V5M6 11l6-6 6 6',down:'M12 5v14M6 13l6 6 6-6',right:'M5 12h14M13 6l6 6-6 6',diagonal:'M5 19L19 5M9 5h10v10',left:'M19 12H5M11 6l-6 6 6 6'};
const arrowIcon=direction=>`<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="${arrowPaths[direction]}"/></svg>`;
html=html.replaceAll('>↑</button>',`>${arrowIcon('up')}</button>`).replaceAll('>↓</button>',`>${arrowIcon('down')}</button>`).replaceAll('➜',arrowIcon('right')).replaceAll('↗',arrowIcon('diagonal')).replace("actionButton('← Back to Play'",`actionButton('${arrowIcon('left')} Back to Play'`);
html=html.replace("actionButton('+ New question','new-question','btn sm primary')", "actionButton('New question','new-question','btn primary full')");
html=html.replace('<span class="buzz-count">${new Set(state.buzzes.map(b=>b.id)).size}/${activePlayers().length} buzzes</span>', '<span class="buzz-count">${new Set(state.buzzes.map(b=>b.id)).size}/${activePlayers().length} buzzes · ${activePlayers().length} active</span>');
// A graded buzz may be correct or incorrect; do not use a check for both.
if(!html.includes("${done?' ✓':''}"))throw new Error('Buzz result marker not found');
html=html.replace("${done?' ✓':''}","${done?(state.buzzEvaluations[state.attemptNumber+':'+b.order]==='correct'?' ✓':state.buzzEvaluations[state.attemptNumber+':'+b.order]==='incorrect'?' ✕':''):''}");
for(const role of ['host','player']){
 let app=html.replace('<html ',`<html data-network-role="${role}" `);
 if(role==='player')app=app.replace("${state.leaderboard&&p.status!=='queued'?`<button class=\"player-scores-trigger\" data-action=\"player-leaderboard\" type=\"button\" aria-label=\"Open leaderboard\" title=\"Leaderboard\">${trophyIcon()}</button>`:''}","<div class=\"player-header-actions\">${state.leaderboard&&p.status!=='queued'?`<button class=\"player-scores-trigger\" data-action=\"player-leaderboard\" type=\"button\" aria-label=\"Open leaderboard\" title=\"Leaderboard\">${trophyIcon()}</button>`:''}<button type=\"button\" class=\"player-scores-trigger player-leave-trigger\" data-action=\"network-open-leave\" aria-label=\"Leave room\" title=\"Leave room\"><svg viewBox=\"0 0 24 24\" aria-hidden=\"true\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M9 5H5v14h4M13 8l4 4-4 4M9 12h12\"/></svg></button></div>");
 if(role==='player'){
  app=app.replace('<path d="M9 5H5v14h4M13 8l4 4-4 4M9 12h12"/>','<path d="m16 17 5-5-5-5M21 12H9"/><path d="M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4"/>');
  app=app.replace("const persistentBuzzer=oldPhone.querySelector(':scope > .coin-buzzer');", "const persistentBuzzer=oldPhone.querySelector('.player-buzzer-space > .coin-buzzer');const persistentBuzzerSlot=persistentBuzzer?.parentElement;");
  app=app.replace('child!==persistJoin&&child!==persistentBuzzer)', 'child!==persistJoin&&child!==persistentBuzzerSlot)');
  app=app.replace("if(child.classList.contains('coin-buzzer')&&persistentBuzzer){", "if(child.classList.contains('player-buzzer-space')&&persistentBuzzer){const nextBuzzer=child.querySelector('.coin-buzzer');");
  app=app.replace('[...child.attributes].forEach(a=>persistentBuzzer.setAttribute(a.name,a.value));','[...nextBuzzer.attributes].forEach(a=>persistentBuzzer.setAttribute(a.name,a.value));');
  app=app.replace('persistentBuzzer.replaceChildren(...child.childNodes);','persistentBuzzer.replaceChildren(...nextBuzzer.childNodes);');
  app=app.replace('oldPhone.insertBefore(persistentBuzzer,firstOverlay);','oldPhone.insertBefore(persistentBuzzerSlot,firstOverlay);');
  app=app.replace('${questionHeader}${content}<button aria-label=','${questionHeader}${content}<div class="player-buzzer-space"><button aria-label=');
  app=app.replace('</button>${liveBuzzFeed(p)}','</button></div>${liveBuzzFeed(p)}');
 }
 app=app.replace(/<title>[\s\S]*?<\/title>/,`<title>Buzzy · ${role==='host'?'Host':'Player'}</title>`).replace('DESIGN LAB · A v7.52',role==='host'?'HOST':'PLAYER');
 app=app.replace('</head>',`<style>
 button{-webkit-tap-highlight-color:transparent}
 html[data-network-role] .shell{display:block;visibility:hidden}html[data-network-ready] .shell{visibility:visible}
 html[data-network-role] .lab-controls,html[data-network-role] .lab-view-switch,html[data-network-role] .lab-score-float,html[data-network-role] #previewtoggle{display:none!important}
 html[data-network-role=host] #sidecol,html[data-network-role=player] #maincol{display:none!important}
 html[data-network-role=host] #maincol{display:block!important;width:100%}
 html[data-network-role=player] #sidecol{display:block!important;width:100%;margin:0 auto;max-width:520px}
 /* #295: the dark player surface is the page, without the prototype phone frame. */
 html[data-network-role=player] body.buzzy-design-lab.theme-a{min-height:100vh;min-height:100dvh;display:flex;flex-direction:column;background:#0b192d;color:#f5f9ff}
 html[data-network-role=player] .headbar{display:none}
 html[data-network-role=player] .shell{display:flex!important;flex:1;width:100%;max-width:none;margin:0!important;padding:0!important;gap:0}
 html[data-network-role=player] #sidecol,html[data-network-role=player] #playercontent,html[data-network-role=player] .phonewrap{display:flex!important;flex-direction:column;flex:1;min-width:0;width:100%;max-width:none!important;position:static}
 html[data-network-role=player] body .phone{flex:1;width:100%;max-width:520px!important;min-height:0;margin:0 auto!important;border:0!important;border-radius:0!important;box-shadow:none!important;padding-bottom:max(18px,env(safe-area-inset-bottom))}
 html[data-network-role=player] #network-bar{width:100%;max-width:none;margin:0;background:#0b192d;color:#c8d9f2;padding:8px max(16px,env(safe-area-inset-right)) 8px max(16px,env(safe-area-inset-left));font-size:13px;line-height:1.4}
 html[data-network-role=player] #leave-room{flex:none}
 html[data-network-role=player][data-network-ready] #network-bar{display:none}
 html[data-network-role=player][data-player-status-visible] #network-bar{display:flex}
 html[data-network-role=player][data-network-ready] #leave-room{display:none}
 html[data-network-role=player] .player-header-actions{display:flex;align-items:center;gap:6px}
 html[data-network-role=player] .player-header-actions .player-scores-trigger{min-height:44px;min-width:44px}
 html[data-network-role=player] .phone .player-leave-trigger svg{color:#c8d9f2}

 html[data-network-role=player] #network-retry{background:#243c60;color:#f5f9ff;border-color:#49648c}

 #network-bar{display:flex;gap:12px;align-items:center;justify-content:space-between;max-width:1100px;margin:8px auto;padding:8px 16px;font-size:14px}
 #network-bar a{color:inherit;font-weight:700}html[data-network-busy] .coin-buzzer{pointer-events:none}
 [data-network-blocked]{pointer-events:none!important}
 #network-status[data-error=true]{color:#a31d34}
 #network-retry[hidden]{display:none}
 </style><script>window.BUZZY_RUNTIME={role:${JSON.stringify(role)},transport:${JSON.stringify('spark-'+target)}};</script></head>`);
 app=app.replace('ROOM B7K4','ROOM —').replace('<div class="shell">','<div id="network-bar"><span id="network-status" role="status">Connecting to your room…</span><button type="button" class="btn sm" id="network-retry" hidden>Try again</button><a href="/" id="leave-room">Leave room</a></div><div class="shell">');
 if(role==='host'){
  app=app.replace('<body class="buzzy-design-lab theme-a studio-ui ">','<body class="buzzy-design-lab theme-a studio-ui lab-host-view prototype-production">');
  app=app.replace(/<header class="headbar">[\s\S]*?<\/header>/,`<header class="headbar room-host-header"><div class="headinner"><div class="brand" aria-label="Buzzy">bu<b>z</b>zy<span style="color:#315de8">.</span></div><div id="network-bar"><span id="network-status" role="status">Connecting…</span><button type="button" class="btn sm" id="network-retry" hidden>Try again</button></div><div class="room-header-actions"><button type="button" class="room-icon-button" id="room-share-qr" aria-label="Show room QR" title="Show room QR">${qrSvg}</button><button type="button" class="room-icon-button" id="room-copy-link" aria-label="Copy room link" title="Copy room link">${linkSvg}</button><button type="button" class="room-icon-button" id="leave-room" aria-label="Leave room" title="Leave room">${leaveSvg}</button></div><button id="previewtoggle" hidden></button></div></header>`);
  // The status controls now live in the header, with exactly one copy of each ID.
  app=app.replace(/<div id="network-bar"><span id="network-status" role="status">Connecting to your room…[\s\S]*?<\/a><\/div>/,'');
 }
 if(role==='player'){
  app=app.replace('<div id="network-bar"><span id="network-status" role="status">Connecting to your room…</span><button type="button" class="btn sm" id="network-retry" hidden>Try again</button><a href="/" id="leave-room">Leave room</a></div>',
   '<div id="network-bar" class="player-connect-screen"><div class="brand" aria-label="Buzzy">buzzy<span style="color:#80a8ff">.</span></div><span id="network-status" role="status" aria-live="polite">Connecting to your room…</span><button type="button" class="btn sm" id="network-retry" hidden>Try again</button><a href="/" id="leave-room">Leave room</a></div>');
 }
 app=app.replaceAll('style="color:#315de8">.</span>','style="color:#80a8ff">.</span>');
 app=app.replace('</head>','<link rel="stylesheet" href="/src/room-ui.css"></head>');
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
landing=landing.replace('.brand span{color:var(--accent)}','.brand span:last-child{color:var(--accent)}');
landing=landing.replace('letter-spacing:.22em;text-indent:.22em;text-align:center;', 'letter-spacing:.22em;text-indent:0;text-align:center;');
// Native letter-spacing includes trailing advance: offset the placeholder's ink,
// while leaving the empty input's native caret at its true center.
landing=landing.replace('.room-code::placeholder{color:#6f88ad;letter-spacing:.3em;text-indent:.3em}', '.room-code::placeholder{color:#6f88ad;letter-spacing:.22em;text-indent:.22em}');
landing=landing.replaceAll('6 characters','4 characters').replace('maxlength="12"','maxlength="4"').replace('placeholder="······"','placeholder="····"');
landing=landing.replace('.join-button:active{transform:translateY(1px);filter:brightness(.94)}','.join-button:active{transform:scale(.98)}button{-webkit-tap-highlight-color:transparent}');
// #330: keep landing helper and error text at the established readable minimum.
landing=landing.replace('</head>','<style>.field-hint,.field-error,.noscript{font-size:14px}</style></head>');
landing=landing.replace('</main>','<p id="entry-status" role="status" class="intro" hidden></p></main>').replace('</body>','<script type="module" src="/src/entry.js"></script></body>');
landing=landing.replace('Design preview. Download and open this file in your browser to try the controls.','Enable JavaScript to create or join a room.');
writeFileSync('index.html',landing);
