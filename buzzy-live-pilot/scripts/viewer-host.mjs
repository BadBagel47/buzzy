// #347/#352: host Settings section for viewer screens. Network-only transformation;
// the frozen standalone reference stays unchanged.
export function applyViewerHost(html){
 function replace(from,to){if(!html.includes(from))throw new Error(`Viewer host source mismatch: ${from.slice(0,90)}`);html=html.replace(from,to);}
 replace('state.settingsOpen={game:false,display:false,effects:false};',
  "state.settingsOpen={game:false,display:false,effects:false,viewer:false};Object.assign(state,{viewerQuestion:true,viewerTimer:true,viewerBuzzOrder:true,viewerLeaderboard:true,viewerCelebration:true,viewerJoinScreen:false,viewerCount:0});");
 replace(' const effects=`${subGroup(\'Sounds\',effectsSounds)}',
  ` const viewerCount=state.viewerCount||0,viewerLink=window.BuzzyNetwork?.viewerUrl?.()||'';
 const viewerConnect=\`<p class="settings-group-caption viewer-settings-intro">Show the game on a TV or projector. Open the viewer link in the screen’s browser. Viewer screens only display the game and never take a player place.</p><p class="viewer-settings-count" role="status">\${viewerCount===1?'1 screen connected':viewerCount+' screens connected'} · up to 4</p><div class="grid2 viewer-settings-actions">\${viewerLink?\`<a class="btn full" href="\${viewerLink}" target="_blank" rel="noopener">Open viewer</a>\`:''}\${actionButton('Copy link','viewer-copy-link','btn full')}</div>\`;
 const viewerJoin=toggleRow('Show join screen','viewerJoinScreen','Show the QR code, web address and room code on viewer screens instead of the game.');
 const viewerContent=\`\${toggleRow('Question','viewerQuestion','Question text and image when players can see them.')}\${toggleRow('Timer','viewerTimer','Countdown while the buzzers are open.')}\${toggleRow('Buzz order and results','viewerBuzzOrder','Who buzzed, in order, with correct and incorrect marks. Names follow Show player names.')}\${toggleRow('Leaderboard','viewerLeaderboard','Shown while you share the leaderboard with players.')}\${toggleRow('Celebration','viewerCelebration','Confetti when you launch the celebration for all.')}\`;
 const viewer=\`\${subGroup('Viewer screens',viewerConnect)}\${subGroup('Join screen',viewerJoin)}\${subGroup('Show on viewer screens',viewerContent)}\`;
 const effects=\`\${subGroup('Sounds',effectsSounds)}`);
 replace(' const section=(id,title,contents)=>',
  ` sectionIcons.viewer='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2.5" y="3.5" width="19" height="13" rx="2"/><path d="M7 20.5h10M9.5 16.5l-1 4M14.5 16.5l1 4"/><path d="M10 8l4 2-4 2Z"/></svg>';
 const section=(id,title,contents)=>`);
 replace("${section('effects','Sounds and effects',effects)}</div>`;","${section('effects','Sounds and effects',effects)}${section('viewer','Viewer screen',viewer)}</div>`;");
 // #358: Settings uses a sliders symbol instead of the sun.
 replace('more:\'<circle cx="12" cy="12" r="3"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>\'','more:\'<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2.2"/><circle cx="9" cy="17" r="2.2"/>\'');
 return html;
}
