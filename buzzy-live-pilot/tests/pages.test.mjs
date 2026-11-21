import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
// #441: the pages are built from app/; the build checks its own patches, and the page script must be valid JavaScript.
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
test('Pages build from app/ and the page script parses',()=>{
 execFileSync(process.execPath,['--check',path.join(root,'app/page.js')]);
 execFileSync(process.execPath,[path.join(root,'scripts/build-pages.mjs')]);
 for(const role of ['host','player']){
  const html=readFileSync(path.join(root,`${role}.html`),'utf8');
  assert.match(html,new RegExp(`<html data-network-role="${role}"`));
  assert.doesNotMatch(html,/@@BUZZY_INCLUDE/,'Every include is filled in');
  assert.match(html,/<script type="module" src="\/src\/bridge\.js"><\/script>/);
 }
 assert.match(readFileSync(path.join(root,'player.html'),'utf8'),/class="player-buzzer-space"/,'The player page has its own buzzer space');
 assert.doesNotMatch(readFileSync(path.join(root,'host.html'),'utf8'),/class="player-buzzer-space"/);
});
