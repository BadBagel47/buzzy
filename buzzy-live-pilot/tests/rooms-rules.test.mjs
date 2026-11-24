// #408: Buzzy's rules in a network-kit room, run in Node with the kit's rules harness (no Cloudflare).
import test from 'node:test';
import assert from 'node:assert/strict';
import {testRoom} from '../vendor/network-kit/server/rules-harness.js';
import options from '../rooms/options.js';

let n = 0;
async function setup() {
  const t = await testRoom(options, {ownerName: 'Host'});
  const cmd = async (who, action, input = {}) => {
    const id = `c${++n}`;
    await t.send(who, {t: 'cmd', rid: id, action, commandId: id, ...input});
    const res = t.received(who).filter((m) => m.t === 'res' && m.rid === id).pop();
    assert.ok(res, `no answer to ${action}`);
    return res;
  };
  const state = (who) => t.received(who).filter((m) => m.t === 'state').pop()?.v;
  const round = (input = {}) => {
    const c = t.game.control;
    return {roundId: c.r, attempt: c.a, ...input};
  };
  return {t, cmd, state, round};
}

test('Players join from the right question, buzz in order and are judged with the room scores', async () => {
  const {t, cmd, state, round} = await setup();
  const ana = await t.join('Ana');
  const bo = await t.join('Bo');
  assert.deepEqual(Object.values(state(ana).members).map((m) => [m.name, m.fromRound]), [['Ana', 1], ['Bo', 1]]);
  assert.equal(state(ana).ownerId, t.owner.id);

  assert.equal((await cmd(t.owner, 'start', round({mode: 'timed', durationMs: 10000, correct: 2, incorrect: -1, allowNegative: false}))).ok, true);
  // A player joining during an open question plays from the next one.
  const cy = await t.join('Cy');
  assert.equal(t.game.members[cy.id].fromRound, 2);
  assert.equal((await cmd(cy, 'buzz', round())).error, 'You are not playing this question.');

  await t.advance(300);
  assert.equal((await cmd(bo, 'buzz', round())).ok, true);
  await t.advance(200);
  assert.equal((await cmd(ana, 'buzz', round())).ok, true);
  assert.equal((await cmd(ana, 'buzz', round())).ok, true, 'a repeated buzz is counted once');
  const hits = t.game.attempt.hits;
  assert.deepEqual([hits[bo.id].i, hits[ana.id].i], [1, 2]);

  // Players may not run host commands.
  assert.equal((await cmd(ana, 'grade', round({playerId: ana.id, result: 'correct'}))).error, 'Not allowed.');

  assert.equal((await cmd(t.owner, 'grade', round({playerId: bo.id, result: 'incorrect'}))).ok, true);
  assert.equal(t.game.scores[bo.id], 0, 'negative points stop at zero only when negative totals are off');
  assert.equal(t.game.control.phase, 'closed');
  assert.equal(t.game.excluded.ids[bo.id], true);
  assert.equal((await cmd(t.owner, 'next', round())).error, 'Judge pending buzzes first.');
  assert.equal((await cmd(t.owner, 'grade', round({playerId: ana.id, result: 'correct'}))).ok, true);
  assert.equal(t.game.scores[ana.id], 2);
  assert.equal(t.game.control.phase, 'finished');
  assert.equal(t.game.control.resultUid, ana.id);
  assert.equal((await cmd(t.owner, 'grade', round({playerId: ana.id, result: 'correct'}))).error, 'Already judged.');

  assert.equal((await cmd(t.owner, 'next', round())).ok, true);
  assert.deepEqual([t.game.control.r, t.game.control.a, t.game.control.phase], [2, 1, 'ready']);
  assert.deepEqual(t.game.attempt.hits, {});
  assert.deepEqual(t.game.excluded, {r: 2, ids: {}});
  assert.equal(state(cy).members[cy.id].fromRound, 2, 'everyone sees the same state');
});

test('First buzz, the timer, retry and stale commands', async () => {
  const {t, cmd, round} = await setup();
  const ana = await t.join('Ana');
  const bo = await t.join('Bo');
  await cmd(t.owner, 'start', round({mode: 'first', durationMs: 5000}));
  await cmd(ana, 'buzz', round());
  await cmd(bo, 'buzz', round());
  assert.equal(t.game.attempt.first.uid, ana.id);
  assert.equal(t.game.attempt.n, 0);
  await cmd(t.owner, 'grade', round({playerId: ana.id, result: 'incorrect'}));
  assert.equal(t.game.control.phase, 'closed');
  const stale = round();
  assert.equal((await cmd(t.owner, 'retry', round())).ok, true);
  assert.equal(t.game.control.a, 2);
  assert.equal((await cmd(t.owner, 'start', stale)).error, 'Stale round or attempt.');

  await cmd(t.owner, 'start', round({mode: 'timed', durationMs: 5000}));
  assert.equal((await cmd(ana, 'buzz', round())).error, 'You cannot buzz again on this question.');
  // The room closes the buzzers when the time is up, even if the host's page sleeps.
  await t.advance(5100);
  assert.equal(t.game.control.phase, 'closed');
  assert.equal((await cmd(bo, 'buzz', round())).error, 'The buzzers are not open.');
  assert.equal((await cmd(t.owner, 'expire', round())).ok, true, 'the host page expiring as well is harmless');
});

test('Host state and history stay with the host; settings and presentation reach everyone', async () => {
  const {t, cmd, state, round} = await setup();
  const ana = await t.join('Ana');
  await cmd(t.owner, 'publish', {presentationPatch: {r: 1, a: 1, text: 'Q', shown: false, loadKey: 'k1'}, settingsPatch: {leaderboard: true}, privatePatch: {questions: [{id: 'q1', text: 'Q', answer: 'secret'}]}});
  // #427: the text stays in the room until the host shows the question.
  assert.equal(state(ana).presentation.text, '');
  assert.ok(!JSON.stringify(t.received(ana)).includes('"text":"Q"'), 'the text never reached the player early');
  await cmd(t.owner, 'publish', {presentationPatch: {shown: true}});
  assert.equal(state(ana).presentation.text, 'Q');
  // #431: images only over https.
  await cmd(t.owner, 'publish', {presentationPatch: {image: 'http://example.com/a.png'}});
  assert.equal(state(ana).presentation.image, '');
  await cmd(t.owner, 'publish', {presentationPatch: {image: 'javascript:alert(1)'}});
  assert.equal(state(ana).presentation.image, '');
  await cmd(t.owner, 'publish', {presentationPatch: {image: 'https://example.com/a.png'}});
  assert.equal(state(ana).presentation.image, 'https://example.com/a.png');
  assert.equal(state(ana).settings.leaderboard, true);
  assert.ok(!JSON.stringify(t.received(ana)).includes('secret'), 'the host page state never reaches players');
  assert.equal((await cmd(t.owner, 'get', {what: 'ui'})).value.questions[0].answer, 'secret');
  assert.equal((await cmd(ana, 'get', {what: 'ui'})).error, 'Not allowed.');
  await cmd(t.owner, 'publish', {privatePatch: {qIndex: 3}});
  const ui = (await cmd(t.owner, 'get', {what: 'ui'})).value;
  assert.deepEqual([ui.qIndex, ui.questions.length], [3, 1]);
  assert.equal((await cmd(t.owner, 'publish', {settingsPatch: {'bad.key': 1}})).error, 'Invalid field.');

  // Preloading: players confirm the current question.
  await cmd(ana, 'ready', {key: 'k1', status: 'ready'});
  assert.deepEqual(state(t.owner).loads, {key: 'k1', map: {[ana.id]: 'ready'}});
  await cmd(ana, 'ready', {key: 'old', status: 'ready'});
  assert.equal(t.game.loads.key, 'k1');

  await cmd(t.owner, 'archive', {id: 'round-1', record: {number: 1, title: 'Q'}});
  assert.equal((await cmd(t.owner, 'get', {what: 'round', round: 1})).value.title, 'Q');
  await cmd(t.owner, 'adjust', {playerId: ana.id, delta: -5, allowNegative: false, name: 'Ana'});
  assert.equal(t.game.scores[ana.id], 0);
  await cmd(t.owner, 'adjust', {playerId: ana.id, delta: 3, allowNegative: false, name: 'Ana'});
  assert.equal(t.game.scores[ana.id], 3);
  const archive = (await cmd(t.owner, 'get', {what: 'archive'})).value;
  assert.equal(Object.values(archive).filter((r) => r.type === 'adjust').length, 2);
  assert.equal((await cmd(t.owner, 'adjust', {playerId: ana.id, delta: 20000})).error, 'Invalid adjustment.');

  // Mode and timer cannot change during a question.
  await cmd(t.owner, 'start', round({mode: 'timed', durationMs: 10000}));
  assert.equal((await cmd(t.owner, 'configure', {mode: 'first', durationMs: 10000, timer: true})).error, 'Change mode and timer before the round starts.');
  assert.equal(t.game.control.timer, true);
});

test('A removed player comes back active; moderation is the host\'s', async () => {
  const {t, cmd, state} = await setup();
  const ana = await t.join('Ana');
  assert.equal((await cmd(ana, 'moderate', {playerId: ana.id, status: 'banned'})).error, 'Not allowed.');
  await cmd(t.owner, 'moderate', {playerId: ana.id, status: 'kicked'});
  assert.equal(state(t.owner).moderation[ana.id], 'kicked');
  // The host's page also removes the connection; the player can join again with the code.
  await t.command(t.owner, 'kick', {id: ana.id});
  await t.join('Ana', {pk: 'test-player-key-2-xxxxxxxxxx', sid: 's2'});
  assert.equal(t.game.moderation[ana.id], 'active');
  assert.equal(t.game.scores[ana.id], 0);
});

test('The viewer screen needs its own link and cannot send', async () => {
  const {t, state} = await setup();
  await assert.rejects(t.join('Screen', {role: 'viewer'}), /not let in/);
  const screen = await t.join('Screen', {role: 'viewer', key: t.keys.viewer.k});
  assert.equal(state(screen).viewers.length, 1);
  await t.send(screen, {t: 'cmd', rid: 'x', action: 'buzz'});
  assert.equal(t.received(screen).filter((m) => m.t === 'res').length, 0);
  await assert.rejects(t.join('Second screen', {role: 'viewer', key: t.keys.viewer.k}), /not let in/);
});

test('A name already used in the room is refused (#449)', async () => {
  const {t, state} = await setup();
  const ana = await t.join('Anna');
  const twin = await t.join(' anna ');
  assert.deepEqual(t.received(twin).filter((m) => m.t === 'name-taken').length, 1);
  assert.equal(Object.keys(t.game.members).length, 1);
  assert.equal(t.game.members[twin.id], undefined);
  // #431: lookalike letters and invisible characters do not make a different name.
  for (const copy of ['Аnna', 'An\u200Bna', 'A n n a', '\u202EAnna']) {
    const c = await t.join(copy);
    assert.equal(t.received(c).filter((m) => m.t === 'name-taken').length, 1, JSON.stringify(copy));
  }
  const blank = await t.join('\u200B\u200B');
  assert.equal(t.received(blank).filter((m) => m.t === 'name-taken').length, 1, 'a name of only invisible characters is refused');
  const other = await t.join('Anna 2');
  assert.equal(state(other).members[other.id].name, 'Anna 2');
  assert.equal(state(ana).members[ana.id].name, 'Anna');
});
