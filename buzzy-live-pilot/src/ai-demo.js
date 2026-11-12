// #388: temporary demo for AI questions (#387). No calls to Claude: answers come from this built-in,
// hand-checked sample bank, with simulated waiting so the whole flow can be tried without an API key.
const src=(britannica,wiki)=>[
 {url:`https://www.britannica.com/search?query=${encodeURIComponent(britannica)}`,title:`Britannica: ${britannica}`},
 {url:`https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(wiki||britannica)}`,title:`Wikipedia: ${wiki||britannica}`},
];
// [difficulty, sv question, sv answer, en question, en answer, alternatives, source term, verdict]
const bank={
 geography:{sv:'Geografi',en:'Geography',items:[
  ['medium','Vilken flod rinner genom Wien, Budapest och Belgrad?','Donau','Which river flows through Vienna, Budapest and Belgrade?','Danube',['Donau','Danube','Duna'],'Danube River'],
  ['easy','Vad heter Australiens huvudstad?','Canberra','What is the capital of Australia?','Canberra',[],'Canberra'],
  ['medium','Vilket är Sveriges högsta berg?','Kebnekaise','What is the highest mountain in Sweden?','Kebnekaise',[],'Kebnekaise'],
  ['easy','Vilket sund skiljer Europa från Afrika vid Spanien?','Gibraltar sund','Which strait separates Europe from Africa at Spain?','Strait of Gibraltar',['Gibraltarsundet','Gibraltar'],'Strait of Gibraltar'],
  ['hard','I vilket land ligger staden Timbuktu?','Mali','In which country is the city of Timbuktu?','Mali',[],'Timbuktu'],
  ['easy','Vilken är Afrikas längsta flod?','Nilen','What is the longest river in Africa?','Nile',['Nile','Nilen'],'Nile River'],
  ['medium','Hur många medlemsländer har EU år 2026?','27','How many member states does the EU have in 2026?','27',['tjugosju','twenty-seven'],'European Union','check'],
 ]},
 history:{sv:'Historia',en:'History',items:[
  ['easy','Vilket år föll Berlinmuren?','1989','In what year did the Berlin Wall fall?','1989',[],'Berlin Wall'],
  ['medium','Vilken svensk kung stupade i slaget vid Lützen 1632?','Gustav II Adolf','Which Swedish king was killed at the Battle of Lützen in 1632?','Gustavus Adolphus',['Gustav II Adolf','Gustavus Adolphus','Gustav Adolf'],'Gustavus Adolphus'],
  ['easy','Vem var den första människan att gå på månen?','Neil Armstrong','Who was the first person to walk on the Moon?','Neil Armstrong',['Armstrong'],'Neil Armstrong'],
  ['easy','Vilken romersk stad begravdes vid Vesuvius utbrott år 79?','Pompeji','Which Roman city was buried by the eruption of Vesuvius in AD 79?','Pompeii',['Pompeii','Pompeji','Herculaneum'],'Pompeii'],
  ['medium','Vem var den första kvinnan att få ett Nobelpris?','Marie Curie','Who was the first woman to win a Nobel Prize?','Marie Curie',['Curie'],'Marie Curie'],
  ['medium','Vilken svensk kemist instiftade Nobelpriset i sitt testamente?','Alfred Nobel','Which Swedish chemist established the Nobel Prizes in his will?','Alfred Nobel',['Nobel'],'Alfred Nobel'],
 ]},
 music:{sv:'Musik',en:'Music',items:[
  ['easy','Vilket band gav ut albumet "Brothers in Arms" 1985?','Dire Straits','Which band released the album "Brothers in Arms" in 1985?','Dire Straits',[],'Brothers in Arms','Brothers in Arms (album)'],
  ['easy','Med vilken låt vann ABBA Eurovision Song Contest 1974?','Waterloo','With which song did ABBA win the Eurovision Song Contest in 1974?','Waterloo',[],'ABBA','Waterloo (ABBA song)'],
  ['easy','Hur många tangenter har ett vanligt modernt piano?','88','How many keys does a standard modern piano have?','88',['åttioåtta','eighty-eight'],'piano'],
  ['medium','Vem komponerade "De fyra årstiderna"?','Antonio Vivaldi','Who composed "The Four Seasons"?','Antonio Vivaldi',['Vivaldi'],'The Four Seasons Vivaldi','The Four Seasons (Vivaldi)'],
  ['easy','I vilket band var Freddie Mercury sångare?','Queen','Which band was Freddie Mercury the lead singer of?','Queen',[],'Freddie Mercury'],
  ['medium','Vem komponerade operan "Trollflöjten"?','Wolfgang Amadeus Mozart','Who composed the opera "The Magic Flute"?','Wolfgang Amadeus Mozart',['Mozart'],'The Magic Flute'],
 ]},
 sports:{sv:'Sport',en:'Sports',items:[
  ['easy','Hur många spelare har ett fotbollslag på planen samtidigt?','11','How many players does a football team have on the pitch at once?','11',['elva','eleven'],'football soccer','Association football'],
  ['medium','I vilken stad hölls sommar-OS 1912?','Stockholm','In which city were the 1912 Summer Olympics held?','Stockholm',[],'1912 Olympic Games Stockholm','1912 Summer Olympics'],
  ['medium','Vilket land vann det första fotbolls-VM 1930?','Uruguay','Which country won the first FIFA World Cup in 1930?','Uruguay',[],'1930 World Cup','1930 FIFA World Cup'],
  ['medium','Hur lång är ett maraton i kilometer?','42,195 km','How long is a marathon in kilometres?','42.195 km',['42,195','42.195','42 km'],'marathon'],
  ['easy','I vilken sport delas Stanley Cup ut?','Ishockey','In which sport is the Stanley Cup awarded?','Ice hockey',['Hockey','Ishockey','Ice hockey'],'Stanley Cup'],
  ['hard','Hur många Grand Slam-titlar i singel vann Björn Borg?','11','How many Grand Slam singles titles did Björn Borg win?','11',['elva','eleven'],'Bjorn Borg','Björn Borg'],
 ]},
 science:{sv:'Vetenskap',en:'Science',items:[
  ['easy','Vilken kemisk beteckning har guld?','Au','What is the chemical symbol for gold?','Au',[],'gold chemical element','Gold'],
  ['easy','Vilken planet ligger närmast solen?','Merkurius','Which planet is closest to the Sun?','Mercury',['Mercury','Merkurius'],'Mercury planet','Mercury (planet)'],
  ['medium','Hur många ben har en vuxen människa?','206','How many bones are there in an adult human body?','206',[],'human skeleton','Human skeleton'],
  ['easy','Vem formulerade relativitetsteorin?','Albert Einstein','Who formulated the theory of relativity?','Albert Einstein',['Einstein'],'relativity Einstein','Theory of relativity'],
  ['easy','Vilken gas tar växter upp från luften vid fotosyntes?','Koldioxid','Which gas do plants take in from the air for photosynthesis?','Carbon dioxide',['CO2','Koldioxid','Carbon dioxide'],'photosynthesis','Photosynthesis'],
  ['medium','Vid hur många grader Celsius kokar vatten vid havsnivå?','100','At how many degrees Celsius does water boil at sea level?','100',['100 grader','100 degrees'],'boiling point water','Boiling point'],
 ]},
 film:{sv:'Film & TV',en:'Film & TV',items:[
  ['medium','Vem regisserade filmen "Hajen" från 1975?','Steven Spielberg','Who directed the 1975 film "Jaws"?','Steven Spielberg',['Spielberg'],'Jaws film','Jaws (film)'],
  ['medium','I vilken film från 1984 säger Arnold Schwarzenegger "I\'ll be back"?','Terminator','In which 1984 film does Arnold Schwarzenegger say "I\'ll be back"?','The Terminator',['The Terminator','Terminator'],'The Terminator','The Terminator'],
  ['hard','Vilken svensk skådespelerska vann Oscar för "Gasljus", "Anastasia" och "Mordet på Orientexpressen"?','Ingrid Bergman','Which Swedish actress won Oscars for "Gaslight", "Anastasia" and "Murder on the Orient Express"?','Ingrid Bergman',['Bergman'],'Ingrid Bergman'],
  ['easy','Vad heter cowboydockan i "Toy Story"?','Woody','What is the name of the cowboy doll in "Toy Story"?','Woody',['Sheriff Woody'],'Toy Story'],
 ]},
};
const rejectedPool=[
 ['Vem är världens rikaste person?','Who is the richest person in the world?','Ett namn','A name','Time-sensitive: the answer changes often.'],
 ['Vilket år grundades Stockholm?','In what year was Stockholm founded?','1252','1252','Sources disagree: 1252 is the first written mention; the founding date itself is uncertain.'],
 ['Vilken är Europas största sjö?','Which is the largest lake in Europe?','Ladoga','Lake Ladoga','Ambiguous: Lake Ladoga or the Caspian Sea, depending on definition.'],
];
const aliases={geography:['geography','geografi'],history:['history','historia'],music:['music','musik'],sports:['sports','sport','idrott'],science:['science','vetenskap','naturvetenskap'],film:['film & tv','film','tv','movies']};
export const demoTopics=Object.values(bank).map(b=>b.en);
function wait(ms,signal){return new Promise((resolve,reject)=>{const t=setTimeout(resolve,ms);signal?.addEventListener('abort',()=>{clearTimeout(t);const e=new Error('Cancelled.');e.name='AbortError';reject(e);},{once:true});});}
function keyFor(topic){const t=String(topic||'').toLowerCase();return Object.keys(aliases).find(k=>aliases[k].some(a=>t.includes(a)))||null;}
const difficultyOk=(level,want)=>want==='mixed'||want===level||want==='hard'&&level==='medium'||want==='easy'&&level==='medium';
// Returns the same shapes the real flow uses, so the review, queue and Play are exactly as with Claude.
export async function demoWrite(items,total,language,known,signal){
 await wait(2400,signal);
 const sv=language==='sv',used=new Set(known),out=[];let general=false;
 const spares=total-items.reduce((n,i)=>n+i.count,0);
 const plan=items.map(i=>({...i}));plan[0]&&(plan[0].count+=Math.max(0,spares-1));
 for(const item of plan){
  let key=keyFor(item.topic);if(!key){general=true;}
  const pool=(key?bank[key].items.map(e=>[key,e]):Object.entries(bank).flatMap(([k,b])=>b.items.map(e=>[k,e])))
   .filter(([,e])=>difficultyOk(e[0],item.difficulty)).sort(()=>Math.random()-.5);
  for(const [k,e] of pool){
   if(out.filter(o=>o.requested===item.topic).length>=item.count)break;
   const question=sv?e[1]:e[3];if(used.has(question.toLowerCase()))continue;used.add(question.toLowerCase());
   out.push({requested:item.topic,topic:key?item.topic:(sv?bank[k].sv:bank[k].en),difficulty:e[0],question,answer:sv?e[2]:e[4],accepted:e[5].filter(a=>a!==(sv?e[2]:e[4])),explanation:'',sources:src(e[6],e[7]),verdict:e[8]||'verified'});
  }
 }
 const bad=rejectedPool.filter(r=>!used.has((sv?r[0]:r[1]).toLowerCase())).slice(0,Math.min(2,Math.max(1,Math.floor(total/5))));
 for(const r of bad)out.push({requested:items[0]?.topic||'',topic:items[0]?.topic||'',difficulty:'medium',question:sv?r[0]:r[1],answer:sv?r[2]:r[3],accepted:[],explanation:'',sources:[],verdict:'rejected',reason:r[4]});
 return {questions:out,general};
}
export async function demoVerify(batch,signal){
 await wait(900,signal);
 return batch.map(d=>({id:d.id,verdict:d.demoVerdict,reason:d.demoVerdict==='check'?'Correct and confirmed, but it can change; the year is in the question.':d.demoReason||'Confirmed by two independent sources.',sources:d.sources}));
}
