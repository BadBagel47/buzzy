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
 return html;
}
