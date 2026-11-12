// #387: questions written and fact-checked by Claude, for the host's queue in Questions.
// The host's own Anthropic API key is kept in this browser only (localStorage) and is sent
// only to Anthropic. Nothing is added to the queue until the host selects it.
const KEY_STORAGE='buzzy-anthropic-key',MIX_STORAGE='buzzy-ai-mixes';
export const AI_MODEL='claude-opus-5-5';
const levels=['easy','mixed','hard'];
const levelText={easy:'easy: most adults would know the answer',mixed:'a mix of easy, medium and hard',hard:'hard: for enthusiasts of the topic'};
// #395: time periods. Recent periods are about news and need dated questions and news sources.
export const periods=[['any','Any time'],['1960s','60s'],['1970s','70s'],['1980s','80s'],['1990s','90s'],['2000s','2000s'],['2010s','2010s'],['year','This year'],['month','Last month'],['week','Last week']];
const periodKeys=periods.map(([k])=>k),recentPeriods=['year','month','week'];
const isoDay=d=>d.toISOString().slice(0,10);
export function periodText(period,now=new Date()){
 if(/^\d{4}s$/.test(period)){const y=Number(period.slice(0,4));return `from the ${period} (${y}–${y+9})`;}
 const today=isoDay(now),back=days=>isoDay(new Date(now.getTime()-days*864e5));
 if(period==='year')return `from this year, ${now.getUTCFullYear()} (up to today, ${today})`;
 if(period==='month')return `from the last 30 days (${back(30)} to ${today})`;
 if(period==='week')return `from the last 7 days (${back(7)} to ${today})`;
 return '';
}
export function periodLabel(period){return periods.find(([k])=>k===period)?.[1]||'';}
export const topicChips=['Geography','History','Music','Film & TV','Sports','Science','Food & drink','Nature','Art & literature'];

const generateTool={
 name:'submit_questions',
 description:'Submit the finished quiz questions. Call exactly once, after researching every answer.',
 strict:true,
 input_schema:{type:'object',additionalProperties:false,required:['questions'],properties:{questions:{type:'array',items:{type:'object',additionalProperties:false,
  required:['topic','difficulty','question','answer','accepted_answers','explanation','sources'],
  properties:{
   topic:{type:'string',description:'The requested topic this question belongs to, exactly as given.'},
   difficulty:{type:'string',enum:['easy','medium','hard']},
   question:{type:'string'},
   answer:{type:'string',description:'The short correct answer.'},
   accepted_answers:{type:'array',items:{type:'string'},description:'Other spellings or forms that should also count as correct. May be empty.'},
   explanation:{type:'string',description:'One sentence the host can read out after the answer.'},
   sources:{type:'array',items:{type:'object',additionalProperties:false,required:['url','title'],properties:{url:{type:'string'},title:{type:'string'}}}},
  }}}}},
};
const verifyTool={
 name:'submit_verdicts',
 description:'Submit one verdict for every question id. Call exactly once, after checking every question yourself.',
 strict:true,
 input_schema:{type:'object',additionalProperties:false,required:['verdicts'],properties:{verdicts:{type:'array',items:{type:'object',additionalProperties:false,
  required:['id','verdict','reason','sources'],
  properties:{
   id:{type:'string'},
   verdict:{type:'string',enum:['verified','check','rejected']},
   reason:{type:'string',description:'One short sentence, in English.'},
   sources:{type:'array',items:{type:'object',additionalProperties:false,required:['url','title'],properties:{url:{type:'string'},title:{type:'string'}}}},
  }}}}},
};
const generateSystem=`You write questions for a live pub quiz played with buzzers. Accuracy matters more than anything else.
Use web search to confirm every answer before you include it, and list the pages you used as sources.
Rules for every question:
- Exactly one clear, correct answer. No trick questions and no wording that allows several reasonable answers.
- Avoid facts that change over time (current holders, records, "latest", populations, prices, rankings) unless the question itself names the year it refers to.
- Avoid disputed facts and facts the sources disagree on.
- Short enough to read aloud: at most about 25 words. Answers are a few words.
- In accepted_answers, list common alternative spellings or forms that should also count as correct.
- Do not repeat any question from the list of questions already in the queue, and vary the aspects covered within a topic.
When you are done, call submit_questions once with all the questions.`;
const verifySystem=`You are a strict fact-checker for quiz questions. Someone else wrote them; do not trust the stated answer.
Questions about recent news are allowed when the question says when it happened and two independent news sources confirm the answer; judge them as verified when that holds.
For each question, search the web yourself and decide:
- verified: the stated answer is correct, the question has exactly one reasonable correct answer, and at least two independent sources (different websites or publishers) confirm it.
- check: the answer is correct and confirmed by two independent sources, but it can change over time and the question already names the year it refers to.
- rejected: anything else, including a wrong or uncertain answer, sources that disagree, ambiguous wording, more than one reasonable answer, a time-sensitive fact without a year, or fewer than two independent sources.
Do not rely on memory alone. Give a short reason for every verdict and list the sources that confirm the answer.
When you are done, call submit_verdicts once with a verdict for every id.`;

export class AiError extends Error{constructor(message,kind='api'){super(message);this.kind=kind;}}
const store={
 get(key){try{return localStorage.getItem(key);}catch{return null;}},
 set(key,value){try{localStorage.setItem(key,value);return true;}catch{return false;}},
 remove(key){try{localStorage.removeItem(key);}catch{}},
};
const normalize=text=>String(text||'').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g,'').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const host=url=>{try{return new URL(url).hostname.replace(/^www\./,'');}catch{return '';}};
const cleanSources=list=>(Array.isArray(list)?list:[]).filter(s=>/^https:\/\//i.test(s?.url||'')&&host(s.url)).map(s=>({url:String(s.url).slice(0,500),title:String(s.title||host(s.url)).slice(0,120)})).slice(0,4);
export function independentHosts(sources){return new Set(cleanSources(sources).map(s=>host(s.url))).size;}
export function defaultLanguage(){const lang=(navigator.languages?.[0]||navigator.language||'en').toLowerCase();return lang.startsWith('sv')?'sv':'en';}
export function keyHint(key){return key?`…${key.slice(-4)}`:'';}

// Local test hook: only on the loopback dev server, a test may supply a fake client.
function mockClient(){
 const local=['127.0.0.1','localhost'].includes(location.hostname);
 return local&&window.__buzzyAiMock?window.__buzzyAiMock:null;
}
async function createClient(apiKey){
 const mock=mockClient();if(mock)return mock;
 const {default:Anthropic}=await import('@anthropic-ai/sdk');
 return new Anthropic({apiKey,dangerouslyAllowBrowser:true,maxRetries:2});
}
function describeError(error){
 if(error instanceof AiError)return error.message;
 if(error?.name==='AbortError'||error?.constructor?.name==='APIUserAbortError')return 'Cancelled.';
 const status=error?.status;
 if(status===401)return 'The API key was not accepted. Check the key in Settings → AI questions.';
 if(status===403)return 'This API key is not allowed to use Claude. Check the key and its organization in the Claude Console.';
 if(status===429)return 'Too many requests right now. Wait a minute and try again.';
 if(status===529||status>=500)return 'Claude is busy or unavailable right now. Try again in a little while.';
 if(status===400)return `Claude could not run the request: ${String(error?.error?.error?.message||error?.message||'bad request').slice(0,200)}`;
 if(!status)return 'Could not reach Claude. Check the internet connection.';
 return `Claude returned an error (${status}).`;
}

export function installAiQuestions({state,render,save,existingQuestions,defaults}){
 const ai=state.ai={key:store.get(KEY_STORAGE)?'saved':'none',keyHint:keyHint(store.get(KEY_STORAGE)),keyError:'',keyInput:'',
  mode:'topic',topic:'',count:10,difficulty:'mixed',period:'any',language:defaultLanguage(),
  rows:[{topic:'',count:3,difficulty:'mixed',period:'any'},{topic:'',count:3,difficulty:'mixed',period:'any'}],mixName:'',mixes:loadMixes(),shuffle:true,
  phase:'form',step:0,checked:0,toCheck:0,drafts:[],rejected:[],rejectedOpen:false,error:'',demo:false,notice:'',usage:{input:0,output:0,searches:0},label:''};
 let controller=null;
 function loadMixes(){try{const list=JSON.parse(store.get(MIX_STORAGE)||'[]');return Array.isArray(list)?list.filter(m=>m&&typeof m.name==='string'&&Array.isArray(m.rows)).slice(0,20):[];}catch{return [];}}
 function saveMixes(){store.set(MIX_STORAGE,JSON.stringify(ai.mixes));}
 function plan(){
  if(ai.mode==='topic')return ai.topic.trim()?[{topic:ai.topic.trim(),count:ai.count,difficulty:ai.difficulty,period:ai.period}]:[];
  return ai.rows.map(r=>({topic:String(r.topic||'').trim(),count:Math.max(0,Math.min(20,Math.round(Number(r.count)||0))),difficulty:levels.includes(r.difficulty)?r.difficulty:'mixed',period:periodKeys.includes(r.period)?r.period:'any'})).filter(r=>r.topic&&r.count>0);
 }
 function addUsage(usage){if(!usage)return;ai.usage.input+=(usage.input_tokens||0)+(usage.cache_read_input_tokens||0)+(usage.cache_creation_input_tokens||0);ai.usage.output+=usage.output_tokens||0;ai.usage.searches+=usage.server_tool_use?.web_search_requests||0;}
 // One request with web search and a strict submit tool; resumes paused server-tool turns.
 async function call(client,{system,prompt,tool,maxSearches}){
  let messages=[{role:'user',content:prompt}];
  for(let round=0;round<5;round++){
   if(controller.signal.aborted)throw new AiError('Cancelled.','cancelled');
   const response=await client.beta.messages.create({
    model:AI_MODEL,max_tokens:16000,
    betas:['server-side-fallback-2026-07-01'],fallbacks:'default',
    output_config:{effort:'high'},
    system,tools:[{type:'web_search_20260209',name:'web_search',max_uses:maxSearches},tool],tool_choice:{type:'auto'},
    messages,
   },{signal:controller.signal});
   addUsage(response.usage);
   if(response.stop_reason==='refusal')throw new AiError('Claude declined this request. Try another topic.','refusal');
   const submitted=response.content.find(block=>block.type==='tool_use'&&block.name===tool.name);
   if(submitted){const input=typeof submitted.input==='string'?JSON.parse(submitted.input):submitted.input;return input;}
   if(response.stop_reason==='max_tokens')throw new AiError('The answer from Claude was too long. Try fewer questions at a time.');
   if(response.stop_reason==='pause_turn'){messages=[messages[0],{role:'assistant',content:response.content}];continue;}
   messages=[...messages,{role:'assistant',content:response.content},{role:'user',content:`Call ${tool.name} now with your result.`}];
  }
  throw new AiError('Claude did not return a result. Try again.');
 }
 function generationPrompt(items,total){
  const used=[...existingQuestions(),...ai.drafts.map(d=>d.question)].filter(Boolean).slice(-150);
  const now=new Date(),recent=items.some(i=>recentPeriods.includes(i.period));
  return [`Today's date is ${isoDay(now)}.`,`Write ${total} quiz questions in ${ai.language==='sv'?'Swedish':'English'} (questions, answers and explanations).`,
   'Topics and amounts:',...items.map(i=>`- ${i.count} about "${i.topic}", difficulty: ${levelText[i.difficulty]}${i.period&&i.period!=='any'?`, only about things ${periodText(i.period,now)}`:''}`),
   recent?'For recent periods (this year, last month, last week) the questions are about news: every such question must say when it happened (for example "In the week of 9 November 2026, …" or "In November 2026, …"), use news sources published in that period, and ask only about settled facts (results, decisions, announcements), not developments that are still going on.':'',
   items.length&&total>items.reduce((n,i)=>n+i.count,0)?`Write ${total-items.reduce((n,i)=>n+i.count,0)} extra questions spread over the same topics, as spares in case some fail the fact-check.`:'',
   used.length?`Questions already in the queue (do not repeat):\n${used.map(q=>`- ${q}`).join('\n')}`:''].filter(Boolean).join('\n');
 }
 async function produce(items){
  const requested=items.reduce((n,i)=>n+i.count,0),total=requested+Math.max(2,Math.ceil(requested*.2));
  // #388: the demo answers from a built-in sample bank instead of calling Claude.
  const demo=ai.demo?await import('./ai-demo.js'):null;
  const client=demo?null:await createClient(store.get(KEY_STORAGE));
  ai.step=1;render();
  const used=[...existingQuestions(),...ai.drafts.map(d=>d.question)];
  const written=demo?await demo.demoWrite(items,total,ai.language,new Set(used.map(q=>String(q).toLowerCase())),controller.signal)
   :await call(client,{system:generateSystem,prompt:generationPrompt(items,total),tool:generateTool,maxSearches:8});
  if(demo&&items.some(i=>i.period&&i.period!=='any'))ai.notice='Demo: the sample questions are not sorted by period, and there is no news in the demo. With your own key, Claude picks questions from the chosen period.';
  else if(demo?.demoTopics&&written.general)ai.notice=`Demo: sample questions exist only for ${demo.demoTopics.join(', ')}, so this is a general mix.`;
  const known=new Set(used.map(normalize));
  const drafts=[];
  for(const q of Array.isArray(written?.questions)?written.questions:[]){
   const question=String(q.question||'').trim(),answer=String(q.answer||'').trim();
   if(!question||!answer||known.has(normalize(question)))continue;known.add(normalize(question));
   const item=items.find(i=>i.topic===q.topic)||items[0]||{};
   drafts.push({id:`d${Date.now().toString(36)}${drafts.length}`,period:demo?'any':(item.period||'any'),topic:String(q.topic||items[0]?.topic||'').slice(0,60),difficulty:['easy','medium','hard'].includes(q.difficulty)?q.difficulty:'medium',
    question:question.slice(0,400),answer:answer.slice(0,160),accepted:(Array.isArray(q.accepted_answers)?q.accepted_answers:[]).map(String).filter(Boolean).slice(0,6),explanation:String(q.explanation||'').slice(0,300),sources:cleanSources(q.sources),...(demo?{demoVerdict:q.verdict,demoReason:q.reason}:{})});
  }
  if(!drafts.length)throw new AiError('Claude did not return any usable questions. Try again or change the topic.');
  ai.step=2;ai.checked=0;ai.toCheck=drafts.length;render();
  const verdicts=new Map();
  for(let start=0;start<drafts.length;start+=4){
   const batch=drafts.slice(start,start+4);
   const result=demo?{verdicts:await demo.demoVerify(batch,controller.signal)}:await call(client,{system:verifySystem,tool:verifyTool,maxSearches:8,prompt:`Today's date is ${isoDay(new Date())}.\nCheck these quiz questions:\n${JSON.stringify(batch.map(d=>({id:d.id,question:d.question,answer:d.answer,accepted_answers:d.accepted})),null,1)}`});
   for(const v of Array.isArray(result?.verdicts)?result.verdicts:[])verdicts.set(String(v.id),v);
   ai.checked=Math.min(drafts.length,start+batch.length);render();
  }
  const kept=[],rejected=[];
  for(const d of drafts){
   const v=verdicts.get(d.id);let status=v?.verdict,reason=String(v?.reason||'').slice(0,240);
   const sources=cleanSources([...(v?.sources||[]),...d.sources]).filter((s,i,all)=>all.findIndex(o=>o.url===s.url)===i);
   if(!v){status='rejected';reason='Not checked.';}
   // Never show Verified on fewer than two independent sources, whatever the checker said.
   if(status!=='rejected'&&independentHosts(v.sources)<2){status='rejected';reason=reason||'Fewer than two independent sources.';if(!/source/i.test(reason))reason+=' Fewer than two independent sources.';}
   const item={...d,status,reason,sources:sources.slice(0,4),selected:status==='verified'};
   (status==='rejected'?rejected:kept).push(item);
  }
  return {kept,rejected};
 }
 async function start(items,append=false){
  if(!items.length){ai.error=ai.mode==='topic'?'Enter a topic.':'Add at least one topic with a number of questions.';render();return;}
  if(ai.key!=='saved'&&!ai.demo){ai.error='Add your Anthropic API key in Settings → AI questions first.';render();return;}
  controller=new AbortController();
  if(!append){ai.drafts=[];ai.rejected=[];ai.usage={input:0,output:0,searches:0};ai.notice='';}
  ai.label=ai.mode==='mix'?(ai.mixName.trim()||'Mix'):items[0].topic;
  ai.phase='running';ai.error='';ai.step=1;ai.checked=0;ai.toCheck=0;render();
  try{
   const {kept,rejected}=await produce(items);
   let drafts=[...ai.drafts,...kept];
   if(ai.mode==='mix'&&ai.shuffle&&!append)drafts=drafts.map(d=>[Math.random(),d]).sort((a,b)=>a[0]-b[0]).map(([,d])=>d);
   ai.drafts=drafts;ai.rejected=[...ai.rejected,...rejected];ai.phase='review';
  }catch(error){
   const message=describeError(error);
   if(error?.kind==='cancelled'||message==='Cancelled.'){ai.phase=ai.drafts.length?'review':'form';ai.error='';}
   else{ai.phase=ai.drafts.length?'review':'error';ai.error=message;}
  }finally{controller=null;ai.step=0;render();}
 }
 async function saveKey(){
  const key=String(ai.keyInput||'').trim();
  if(!/^sk-ant-[\w-]{10,}$/.test(key)){ai.keyError='That does not look like an Anthropic API key (it starts with sk-ant-).';render();return;}
  ai.key='checking';ai.keyError='';render();
  try{
   const client=await createClient(key);
   await client.models.retrieve(AI_MODEL);
   if(!store.set(KEY_STORAGE,key))throw new AiError('This browser does not allow saving the key (private mode?).');
   Object.assign(ai,{key:'saved',keyHint:keyHint(key),keyInput:''});
  }catch(error){ai.key='none';ai.keyError=describeError(error);}
  render();
 }
 function addSelected(){
  const chosen=ai.drafts.filter(d=>d.selected&&d.status!=='rejected');if(!chosen.length)return 0;
  const base=defaults(),stamp=Date.now();
  const added=chosen.map((d,i)=>({id:`q${stamp}${i}`,title:d.question.slice(0,46)+(d.question.length>46?'…':''),text:d.question,image:'',points:base.points,penalty:base.penalty,mode:'default',timer:'default',textVisibility:'default',buzzerStart:'default',active:true,played:false,
   answer:d.answer,acceptedAnswers:d.accepted,explanation:d.explanation,sources:d.sources,topic:d.topic,difficulty:d.difficulty,...(d.period&&d.period!=='any'?{period:d.period,periodLabel:periodLabel(d.period)}:{}),ai:{status:d.status,model:ai.demo?'demo':AI_MODEL,...(ai.demo?{demo:true}:{}),createdAt:new Date(stamp).toISOString()}}));
  state.questions.push(...added);
  ai.drafts=ai.drafts.filter(d=>!chosen.includes(d));
  if(!ai.drafts.length){ai.phase='form';ai.rejected=[];if(state.modal==='ai-questions')state.modal='';}
  save();render();return added.length;
 }
 const handlers={
  'ai-mode':v=>{if(['topic','mix'].includes(v))ai.mode=v;},
  'ai-count':v=>{const n=Number(v);if([5,10,15,20].includes(n))ai.count=n;},
  'ai-difficulty':v=>{if(levels.includes(v))ai.difficulty=v;},
  'ai-period':v=>{if(periodKeys.includes(v))ai.period=v;},
  'ai-language':v=>{if(['sv','en'].includes(v))ai.language=v;},
  'ai-chip':v=>{ai.topic=topicChips[Number(v)]||ai.topic;},
  'ai-row-add':()=>{if(ai.rows.length<8)ai.rows.push({topic:'',count:3,difficulty:'mixed',period:'any'});},
  'ai-row-del':v=>{ai.rows.splice(Number(v),1);if(!ai.rows.length)ai.rows.push({topic:'',count:3,difficulty:'mixed',period:'any'});},
  'ai-mix-load':v=>{const m=ai.mixes[Number(v)];if(m){ai.rows=m.rows.map(r=>({period:'any',...r}));ai.mixName=m.name;ai.shuffle=m.shuffle!==false;}},
  'ai-mix-save':()=>{const name=ai.mixName.trim()||`Mix ${ai.mixes.length+1}`;const rows=plan();if(!rows.length){ai.error='Add at least one topic before saving the mix.';return;}ai.mixName=name;ai.mixes=[...ai.mixes.filter(m=>m.name!==name),{name,rows,shuffle:ai.shuffle}];saveMixes();},
  'ai-mix-delete':v=>{ai.mixes.splice(Number(v),1);saveMixes();},
  'ai-shuffle':()=>{ai.shuffle=!ai.shuffle;},
  'ai-generate':()=>{start(plan());return 'async';},
  'ai-replace':()=>{const byTopic=new Map();for(const r of ai.rejected)byTopic.set(r.topic,(byTopic.get(r.topic)||0)+1);const items=[...byTopic].map(([topic,count])=>({topic,count,difficulty:ai.mode==='topic'?ai.difficulty:'mixed'}));ai.rejected=[];start(items,true);return 'async';},
  'ai-cancel':()=>{controller?.abort();},
  'ai-toggle':v=>{const d=ai.drafts.find(d=>d.id===v);if(d)d.selected=!d.selected;},
  'ai-add':()=>{const n=addSelected();return n?`added:${n}`:'';},
  'ai-new':()=>{ai.phase='form';ai.drafts=[];ai.rejected=[];ai.error='';},
  'ai-back':()=>{ai.phase='form';ai.error='';},
  'ai-key-save':()=>{saveKey();return 'async';},
  'ai-demo-start':()=>{ai.demo=true;Object.assign(ai,{phase:'form',drafts:[],rejected:[],error:'',notice:''});state.hostTab='questions';state.modal='ai-questions';},
  'ai-demo-exit':()=>{controller?.abort();ai.demo=false;Object.assign(ai,{phase:'form',drafts:[],rejected:[],error:'',notice:''});},
  'ai-key-remove':()=>{store.remove(KEY_STORAGE);Object.assign(ai,{key:'none',keyHint:'',keyInput:'',keyError:''});},
 };
 function handle(action){
  const [name,...rest]=action.split(':'),value=rest.join(':');
  const fn=handlers[name];if(!fn)return null;
  ai.error=name==='ai-generate'||name==='ai-replace'?ai.error:'';
  const result=fn(value);
  if(result!=='async')render();
  return result||'';
 }
 // Text fields write straight into the state, so re-rendering never loses typing.
 function onInput(event){
  const field=event.target?.dataset?.aiField;if(!field)return;
  const value=event.target.type==='checkbox'?event.target.checked:event.target.value;
  if(field.startsWith('pick:')){if(event.type!=='change')return;const d=ai.drafts.find(d=>d.id===field.slice(5));if(d){d.selected=!!value;render();}return;}
  if(field==='shuffle'){if(event.type==='change'){ai.shuffle=!!value;render();}return;}
  if(field==='topic')ai.topic=value;else if(field==='key')ai.keyInput=value;else if(field==='mixName')ai.mixName=value;
  else{const m=/^row:(\d+):(topic|count|difficulty|period)$/.exec(field);if(m&&ai.rows[m[1]]){ai.rows[m[1]][m[2]]=m[2]==='count'?Math.max(0,Math.min(20,Math.round(Number(value)||0))):value;if(event.type==='change')render();}}
 }
 document.addEventListener('input',onInput);document.addEventListener('change',onInput);
 // #398: the list of rejected questions opens and closes with the same height animation as Settings sections.
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 document.addEventListener('click',event=>{
  const summary=event.target.closest?.('.ai-rejected > summary');if(!summary)return;
  const details=summary.parentElement;event.preventDefault();
  const opening=!details.open;ai.rejectedOpen=opening;
  if(reduced()){details.open=opening;return;}
  const start=details.getBoundingClientRect().height;if(opening)details.open=true;
  const end=opening?details.scrollHeight:summary.getBoundingClientRect().height;
  details.style.overflow='hidden';
  const animation=details.animate([{height:`${start}px`},{height:`${end}px`}],{duration:260,easing:'cubic-bezier(.22,.8,.2,1)'});
  animation.onfinish=animation.oncancel=()=>{if(!opening)details.open=false;details.style.overflow='';};
 });
 // #398: a new step of the panel fades in while the dialog eases to its new height.
 window.BuzzyAiMotion={swap(current,fresh){
  const box=current.closest('.studio-modal')||current.parentElement,from=box.getBoundingClientRect().height;
  current.replaceWith(fresh);if(reduced())return;
  const to=box.getBoundingClientRect().height;
  fresh.classList.add('ai-enter');fresh.addEventListener('animationend',()=>fresh.classList.remove('ai-enter'),{once:true});
  if(Math.abs(from-to)>1){box.style.overflow='hidden';const animation=box.animate([{height:`${from}px`},{height:`${to}px`}],{duration:280,easing:'cubic-bezier(.22,.8,.2,1)'});animation.onfinish=animation.oncancel=()=>{box.style.overflow='';};}
 }};
 return {handle,plan,get busy(){return ai.phase==='running';}};
}
