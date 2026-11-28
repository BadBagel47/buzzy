// #444, #452: questions copied into a new room can all be played again.
import test from 'node:test';
import assert from 'node:assert/strict';
import {freshCopy} from '../src/question-library.js';

test('Played, started and skipped questions are playable again in a new room; switched-off ones stay off', () => {
  const saved = [
    {id: 'a', title: 'Played', text: 'A', played: true, active: false, playedOrder: 1},
    {id: 'b', title: 'Skipped', text: 'B', skipped: true, active: false},
    {id: 'c', title: 'Started', text: 'C', started: true},
    {id: 'd', title: 'Waiting', text: 'D'},
    {id: 'e', title: 'Switched off', text: 'E', active: false},
    {id: 'f', title: 'Demo', text: 'F', isDemo: true},
  ];
  const copy = freshCopy(saved, new Set(['d']));
  assert.deepEqual(copy.map((q) => q.title), ['Played', 'Skipped', 'Started', 'Waiting', 'Switched off']);
  // The same test as the page's next-question choice: active and not played.
  assert.deepEqual(copy.filter((q) => q.active !== false && !q.played).map((q) => q.title), ['Played', 'Skipped', 'Started', 'Waiting']);
  assert.ok(copy.every((q) => !q.played && !q.started && !q.skipped && !('playedOrder' in q)));
  assert.notEqual(copy[3].id, 'd', 'an id already in the room gets a new one');
  assert.equal(new Set(copy.map((q) => q.id)).size, copy.length);
});
