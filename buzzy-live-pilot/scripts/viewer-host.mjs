// #347/#352: host Settings section for viewer screens. Network-only transformation;
// the frozen standalone reference stays unchanged.
export function applyViewerHost(html){
 function replace(from,to){if(!html.includes(from))throw new Error(`Viewer host source mismatch: ${from.slice(0,90)}`);html=html.replace(from,to);}
 replace('state.settingsOpen={game:false,display:false,effects:false};',
  "state.settingsOpen={game:false,display:false,effects:false,viewer:false};Object.assign(state,{viewerView:'standby',viewerQuestionNumber:true,viewerQuestion:true,viewerTimer:true,viewerBuzzOrder:true,viewerLeaderboard:true,viewerCelebration:true,viewerJoinScreen:false,viewerCount:0});");
 // #370/#356: one viewer settings markup, used in Settings → Viewer screen and in the panel opened from the header.
 replace('function renderMore(){',`function viewerSettingsMarkup(){
 const count=state.viewerCount||0,link=window.BuzzyNetwork?.viewerUrl?.()||'';
 const sub=(title,body)=>\`<section class="settings-subgroup"><h3 class="settings-subhead">\${title}</h3><div class="settings-subgroup-content">\${body}</div></section>\`;
 const connect=\`<p class="settings-group-caption viewer-settings-intro">Show the game on a TV or projector. Open the viewer link in the screen’s browser. Viewer screens only display the game and never take a player place.</p><p class="viewer-settings-count" role="status">\${count===1?'1 screen connected':count+' screens connected'} · up to 4</p><div class="grid2 viewer-settings-actions">\${link?\`<a class="btn full" href="\${link}" target="_blank" rel="noopener">Open viewer</a>\`:''}\${actionButton('Copy link','viewer-copy-link','btn full')}</div>\`;
 const modes=[['standby','Standby'],['join','Join'],['game','Game'],['leaderboard','Leaderboard']],index=Math.max(0,modes.findIndex(([k])=>k===state.viewerView));
 const mode=\`<div class="viewer-mode"><div class="play-mode-switch viewer-mode-seg" role="group" aria-label="Viewer shows" style="--i:\${index};--c:\${index%2};--r:\${Math.floor(index/2)}">\${modes.map(([k,l])=>\`<button type="button" class="play-mode-option\${state.viewerView===k?' active':''}" data-action="viewer-view:\${k}" aria-pressed="\${state.viewerView===k}">\${l}</button>\`).join('')}</div><p class="settings-group-caption">\${state.viewerView==='standby'?'Standby: viewer screens show only the Buzzy logo.':'Changes all viewer screens at once. Players are not affected.'}</p></div>\`;
 const game=\`\${toggleRow('Question number','viewerQuestionNumber','Shows the question number above the question.')}\${toggleRow('Question','viewerQuestion','Question text and image when players can see them.')}\${toggleRow('Timer','viewerTimer','Countdown while the buzzers are open. Hidden when everyone has buzzed or time is up.')}\${toggleRow('Buzz order and results','viewerBuzzOrder','Who buzzed, in order, with correct and incorrect marks. Names follow Show player names.')}\${toggleRow('Celebration','viewerCelebration','Confetti when you launch the celebration for all.')}\`;
 return \`<div class="viewer-settings">\${sub('Viewer screens',connect)}\${sub('Viewer shows',mode)}\${sub('Show in Game mode',game)}</div>\`;
}
function renderMore(){`);
 // The header button opens the same settings over the current view.
 replace("let inner='';if(state.modal==='network-leave'","let inner='';if(state.modal==='viewer'){inner=viewerSettingsMarkup();}else if(state.modal==='network-leave'");
 replace('function modalTitle(){\n','function modalTitle(){\n if(state.modal===\'viewer\')return \'Viewer screen\';\n');
 // Keep the open viewer panel in step with the state: switches, mode and screen count update in place.
 replace(' if(!key)return false;\n // Live read-only context',' if(!key)return false;\n if(state.modal===\'viewer\'){const template=document.createElement(\'template\');template.innerHTML=renderModal();const current=root.querySelector(\'.viewer-settings\'),fresh=template.content.querySelector(\'.viewer-settings\');if(current&&fresh&&window.BuzzyNetwork?.patchHostPage)window.BuzzyNetwork.patchHostPage(current,fresh.innerHTML);return true;}\n // Live read-only context');
 // #358: Settings uses a sliders symbol instead of the sun.
 replace('more:\'<circle cx="12" cy="12" r="3"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>\'','more:\'<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2.2"/><circle cx="9" cy="17" r="2.2"/>\'');
 return html;
}
