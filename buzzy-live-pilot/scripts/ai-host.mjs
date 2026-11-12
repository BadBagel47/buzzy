// #387: AI questions in the generated host page. Network-only; the frozen reference stays unchanged.
import {readFileSync} from 'node:fs';
export function applyAiHost(html){
 function replace(from,to){if(!html.includes(from))throw new Error(`AI host source mismatch: ${from.slice(0,90)}`);if(html.split(from).length!==2)throw new Error(`AI host source not unique: ${from.slice(0,90)}`);html=html.replace(from,to);}
 const page=readFileSync(new URL('./ai-host-page.js',import.meta.url),'utf8');
 replace('function renderMore(){',page+'\nfunction renderMore(){');
 // Settings: the key card follows Appearance.
 replace('${appearanceCard()}${room}','${appearanceCard()}${aiSettingsCard()}${room}');
 // Questions: Generate questions next to New question.
 replace("${actionButton('+ New question','new-question','btn sm primary')}</div></div><section","<div class=\"questions-head-actions\">${actionButton('+ New question','new-question','btn sm primary')}${actionButton(aiOpenLabel(),'ai-open','btn sm ai-open-button')}</div></div></div><section");
 // Queue cards show the answer, topic, AI status and sources.
 replace('<p class="library-card-preview">${preview}</p>','<p class="library-card-preview">${preview}</p>${aiQueueMeta(q)}');
 // The panel is a modal kept mounted while it updates.
 replace("let inner='';if(state.modal==='viewer'){","let inner='';if(state.modal==='ai-questions'){inner=aiPanelMarkup();}else if(state.modal==='viewer'){");
 replace("function modalTitle(){\n","function modalTitle(){\n if(state.modal==='ai-questions')return 'Generate questions';\n");
 replace(" if(state.modal==='viewer'){const template=document.createElement('template');"," if(state.modal==='ai-questions'){const template=document.createElement('template');template.innerHTML=renderModal();const current=root.querySelector('.ai-panel'),fresh=template.content.querySelector('.ai-panel');if(current&&fresh&&window.BuzzyNetwork?.patchHostPage){if(current.outerHTML.split('>')[0]!==fresh.outerHTML.split('>')[0]){current.replaceWith(fresh);}else window.BuzzyNetwork.patchHostPage(current,fresh.innerHTML);}return true;}\n if(state.modal==='viewer'){const template=document.createElement('template');");
 // The question editor gets a host-only answer field.
 replace('</textarea></div><div><label class="label" for="qimage">','</textarea></div><div><label class="label" for="qanswer">Answer (optional)</label><input class="field" id="qanswer" value="${safe(q.answer||\'\')}" placeholder="Shown only to you"><p class="sm muted" style="margin-top:4px">Host only · Not shown to players</p></div><div><label class="label" for="qimage">');
 replace("penalty:Number($('#qpenalty').value)||0,mode:$('#qmode').value","penalty:Number($('#qpenalty').value)||0,answer:($('#qanswer')?.value||'').trim(),mode:$('#qmode').value");
 // Play: the host sees the answer of the prepared question.
 replace('<h2 style="font-size:23px;margin-top:5px">${safe(state.quickQuestion?(q.text||q.image?\'Live question\':\'Ready for a live question\'):q.title)}</h2>','<h2 style="font-size:23px;margin-top:5px">${safe(state.quickQuestion?(q.text||q.image?\'Live question\':\'Ready for a live question\'):q.title)}</h2>${!state.quickQuestion&&q.answer?`<p class="host-answer">Answer: <b>${safe(q.answer)}</b></p>`:\'\'}');
 return html;
}
