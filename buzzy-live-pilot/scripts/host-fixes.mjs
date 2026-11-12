// Network-only host fixes. The frozen standalone reference stays unchanged.
export function applyHostFixes(html){
 function replace(from,to){if(!html.includes(from))throw new Error(`Host fix source mismatch: ${from.slice(0,90)}`);html=html.replace(from,to);}
 // #373: a prepared question counts as played only when someone answered correctly or the host moves on
 // with Next/Skip (or finishes the set). Switching mode, showing it or opening the buzzers without a correct
 // answer keeps it in the queue, marked as Started.
 replace('function finalizePreparedQuestion(){','function finalizePreparedQuestion(movedOn=false){');
 replace(" if(!q||q.played||!state.questionShown&&state.startAt===null)return;\n q.played=true;",
  " if(!q||q.played||!movedOn&&!state.questionShown&&state.startAt===null)return;\n if(!movedOn&&state.lastDecision!=='correct'){q.started=true;return;}\n q.played=true;");
 replace('function advanceQuestion(advanceNumber=true){\n finalizePreparedQuestion();','function advanceQuestion(advanceNumber=true){\n finalizePreparedQuestion(true);');
 replace("if(action==='finish-set'){finalizePreparedQuestion();","if(action==='finish-set'){finalizePreparedQuestion(true);");
 replace("Question ${i+1}${current?' · Current':''}","Question ${i+1}${current?' · Current':''}${q.started&&!q.played?' · Started':''}");
 // #375: the automatic jump to Questions (no active prepared questions) uses the same view animation as the navigation bar.
 replace("if(first===-1){state.hostTab='questions';state.modal='';tip('No active prepared questions. Enable one in Questions.');return false}","if(first===-1){state.modal='';tip('No active prepared questions. Enable one in Questions.');queueMicrotask(()=>navigateHostTab('questions'));return false}");

 // #378: Settings → Appearance (this device only): Auto follows the device, or Light/Dark.
 replace('function renderMore(){',`function appearanceCard(){
 const modes=[['auto','Auto'],['light','Light'],['dark','Dark']],choice=state.hostTheme||'auto',index=Math.max(0,modes.findIndex(([k])=>k===choice));
 return \`<div class="card gap12 settings-appearance-card"><div><h2>Appearance</h2><p class="sm muted">Only on this device. Auto follows the light or dark setting of this phone or computer.</p></div><div class="appearance-mode"><div class="play-mode-switch" role="group" aria-label="Appearance" style="--i:\${index}">\${modes.map(([k,l])=>\`<button type="button" class="play-mode-option\${choice===k?' active':''}" data-action="host-theme:\${k}" aria-pressed="\${choice===k}">\${l}</button>\`).join('')}</div></div></div>\`;
}
function renderMore(){`);
 replace('return `<div class="stack">${room}${grouped}','return `<div class="stack">${appearanceCard()}${room}${grouped}');
 // #381: an empty queue shows no filter and no second help text, only a short empty message.
 replace("${queueFilters}<div class=\"library-question-list\">${renderEntries(visibleQueue)||'<div class=\"inner muted sm host-empty-message\">No questions match this filter.</div>'}</div><p class=\"questions-section-help\">Questions leave the queue when played. Review completed rounds in Play → Round overview. Reorder queued questions using the arrows or drag-and-drop.</p>",
  "${queue.length?queueFilters:''}<div class=\"library-question-list\">${renderEntries(visibleQueue)||(queue.length?'<div class=\"inner muted sm host-empty-message\">No questions match this filter.</div>':'<div class=\"inner muted sm host-empty-message\">No questions yet. Use New question to add one.</div>')}</div>${queue.length?'<p class=\"questions-section-help\">Questions leave the queue when played. Review completed rounds in Play → Round overview. Reorder queued questions using the arrows or drag-and-drop.</p>':''}");

 // #389: the player always sees the pressed buzzer (and the #position in Timed Buzz) for a moment before
 // "Your turn" flips in, even when the floor is given in the same update (e.g. a single player).
 replace("const currentTurn=state.phase!=='open'&&getActiveGradeBuzz()?.id===p.id&&state.buzzes.length>0&&state.lastDecision!=='correct';",
  "const buzzSeenKey=buzzed?`${state.countQuestion}:${state.attemptNumber}:${p.id}`:null;state.buzzSeenAt||={};if(buzzSeenKey&&!state.buzzSeenAt[buzzSeenKey])state.buzzSeenAt[buzzSeenKey]=Date.now();\n const turnHold=buzzSeenKey?Math.max(0,1800-(Date.now()-state.buzzSeenAt[buzzSeenKey])):0;\n const currentTurnNow=state.phase!=='open'&&getActiveGradeBuzz()?.id===p.id&&state.buzzes.length>0&&state.lastDecision!=='correct';\n if(currentTurnNow&&turnHold>0&&!state.turnHoldTimer)state.turnHoldTimer=setTimeout(()=>{state.turnHoldTimer=null;render();},turnHold+40);\n const currentTurn=currentTurnNow&&turnHold===0;");
 return html;
}
