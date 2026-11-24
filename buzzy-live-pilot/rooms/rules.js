// #408: Buzzy's game rules, run in the room by network-kit (mode 'server').
// They follow docs/GAME_RULES.md and do what src/client.js and database.rules.json
// do on Firebase, so the page (src/bridge.js) sees the same state with either backend.
//
// Messages from the page: {t:'cmd', rid, action, ...input}. The rules answer the sender
// {t:'res', rid, ok, error?, value?} and send everyone the room's view {t:'state', v}.
// The host's own page state (questions, answers) and the round history are kept with
// room.store and only ever sent to the host.

const HOST_ACTIONS = new Set(['configure', 'publish', 'select', 'moderate', 'celebrate', 'adjust', 'archive', 'get', 'start', 'stop', 'expire', 'retry', 'next', 'advance', 'grade']);
const PLAYER_ACTIONS = new Set(['buzz', 'ready']);
const ROUND_ACTIONS = new Set(['buzz', 'grade', 'start', 'stop', 'expire', 'retry', 'next', 'advance']);
const FIELD = /^[A-Za-z][A-Za-z0-9]*$/;
const MAX_BUZZ_CORRECTION_MS = 100;

class RuleError extends Error {}
const fail = (message) => { throw new RuleError(message); };
const emptyAttempt = () => ({n: 0, hits: {}, first: null, judgments: {}});
/** Names compare without case, accents written two ways, or extra spaces (#449). */
export const sameName = (a, b) => String(a ?? '').normalize('NFKC').toLocaleLowerCase('sv').replace(/\s+/g, ' ').trim() === String(b ?? '').normalize('NFKC').toLocaleLowerCase('sv').replace(/\s+/g, ' ').trim();
const clamp = (allowNegative, before, requested) => (allowNegative === false && requested < 0 ? (before < 0 ? before : Math.max(0, before + requested)) : before + requested);

export function initialGame(now) {
  return {
    createdAt: now,
    control: {r: 1, a: 1, phase: 'ready', mode: 'timed', startedAt: 0, closedAt: 0, ms: 10000, timer: true, version: 0, commandId: '', resultUid: ''},
    attempt: emptyAttempt(),
    excluded: {r: 1, ids: {}},
    members: {}, scores: {}, moderation: {}, adjustments: {},
    settings: {}, presentation: null, selection: null, celebration: null,
    loads: {key: '', map: {}},
  };
}

/** What every participant may see: the same parts players can read on Firebase. */
export function view(room) {
  const g = room.game;
  const online = Object.fromEntries(room.players.map((p) => [p.id, p.status === 'online']));
  const viewers = room.players.filter((p) => p.role === 'viewer' && p.status === 'online').map((p) => p.id);
  return {
    ownerId: room.ownerId, createdAt: g.createdAt, control: g.control, attempt: g.attempt, excluded: g.excluded,
    members: g.members, scores: g.scores, moderation: g.moderation, adjustments: g.adjustments,
    settings: g.settings, presentation: g.presentation, selection: g.selection, celebration: g.celebration,
    loads: g.loads, online, viewers,
  };
}

function broadcast(room) { room.send('all', {t: 'state', v: view(room)}); }
function reply(room, who, rid, body) { if (rid) room.send([who.id], {t: 'res', rid, ...body}); }

function memberStatus(g, id) {
  const status = g.moderation[id];
  if (status === 'banned' || status === 'kicked') return status;
  const m = g.members[id];
  return m && m.fromRound <= g.control.r ? 'active' : 'waiting';
}

function pending(g) {
  const a = g.attempt;
  const hits = g.control.mode === 'first' ? (a.first ? [[a.first.uid, {i: 1}]] : []) : Object.entries(a.hits);
  return hits.filter(([id]) => !a.judgments[id]).sort((x, y) => x[1].i - y[1].i);
}

async function storedObject(room, key) { return (await room.stored(key)) || {}; }

function newAttempt(g, round) {
  g.attempt = emptyAttempt();
  if (g.excluded.r !== round) g.excluded = {r: round, ids: {}};
}

function buzz(room, g, who, at) {
  const c = g.control, a = g.attempt;
  if (c.phase !== 'open') fail('The buzzers are not open.');
  if (c.timer !== false && room.now() > c.startedAt + c.ms) fail('Time is up.');
  if (memberStatus(g, who.id) !== 'active') fail('You are not playing this question.');
  if (g.excluded.ids[who.id] && !c.allowRepeat) fail('You cannot buzz again on this question.');
  if (a.hits[who.id] || a.first?.uid === who.id) return;
  // Fair order: when the buzz reached the room, less half the response time (at most 100 ms).
  const time = at - Math.min((who.rttMs ?? 0) / 2, MAX_BUZZ_CORRECTION_MS);
  if (c.mode === 'first') {
    if (!a.first) a.first = {uid: who.id, at: time};
    return;
  }
  a.n += 1;
  a.hits[who.id] = {i: a.n, at: time};
  // Until the host has judged anyone, a buzz that came in later but was pressed earlier moves ahead.
  if (!Object.keys(a.judgments).length) {
    Object.entries(a.hits).sort((x, y) => x[1].at - y[1].at || x[1].i - y[1].i).forEach(([, hit], index) => { hit.i = index + 1; });
  }
}

function grade(room, g, x) {
  const c = g.control, a = g.attempt;
  const judged = a.judgments[x.playerId];
  if (judged) { if (judged.cmd === x.commandId) return; fail('Already judged.'); }
  if (!pending(g).some(([id]) => id === x.playerId)) fail('Select an ungraded buzz.');
  if (!['correct', 'incorrect'].includes(x.result)) fail('Invalid result.');
  const correct = x.result === 'correct';
  const before = g.scores[x.playerId] ?? 0;
  const after = clamp(c.allowNegative, before, correct ? (c.correct ?? 1) : (c.incorrect ?? 0));
  a.judgments[x.playerId] = {kind: x.result, delta: after - before, cmd: x.commandId, before, after, at: room.now()};
  g.scores[x.playerId] = after;
  if (!correct && !c.allowRepeat) g.excluded.ids[x.playerId] = true;
  if (correct || !['closed', 'finished'].includes(c.phase)) {
    g.control = {...c, phase: correct ? 'finished' : 'closed', version: c.version + 1, commandId: x.commandId, resultUid: correct ? x.playerId : '', closedAt: c.closedAt || room.now()};
  }
}

function settingsFrom(x) {
  return {mode: x.mode || 'timed', ms: x.durationMs || 10000, timer: x.timer !== false, correct: x.correct ?? 1, incorrect: x.incorrect ?? 0, allowNegative: x.allowNegative !== false, allowRepeat: x.allowRepeat === true};
}

function control(room, g, x) {
  const c = g.control;
  if (['retry', 'next'].includes(x.action) && c.phase === 'closed' && pending(g).length) fail('Judge pending buzzes first.');
  const next = {...c, version: c.version + 1, commandId: x.commandId};
  switch (x.action) {
    case 'start':
      if (c.phase !== 'ready') fail('Not ready.');
      Object.assign(next, settingsFrom(x), {phase: 'open', startedAt: room.now(), closedAt: 0});
      if (next.timer) room.setTimer(`expire:${c.r}:${c.a}`, next.ms + 50);
      break;
    case 'stop': case 'expire':
      if (['closed', 'finished'].includes(c.phase)) return; // the room's own timer may have closed it already
      if (c.phase !== 'open') fail('Not open.');
      if (x.action === 'expire' && (c.timer === false || room.now() < c.startedAt + c.ms)) fail('Not expired.');
      Object.assign(next, {phase: 'closed', closedAt: room.now()});
      break;
    case 'retry': case 'next': case 'advance':
      if (!['closed', 'finished'].includes(c.phase) && !(x.action === 'advance' && c.phase === 'ready')) fail('Not closed.');
      Object.assign(next, {r: c.r + (x.action !== 'retry' ? 1 : 0), a: x.action !== 'retry' ? 1 : c.a + 1, phase: 'ready', startedAt: 0, closedAt: 0, resultUid: ''});
      newAttempt(g, next.r);
      break;
    default: fail('Unknown command.');
  }
  g.control = next;
}

async function publish(room, g, x) {
  const patch = {presentation: x.presentationPatch, settings: x.settingsPatch, ui: x.privatePatch};
  for (const changes of Object.values(patch)) for (const key of Object.keys(changes || {})) if (!FIELD.test(key)) fail('Invalid field.');
  if (x.presentation !== undefined) g.presentation = x.presentation;
  if (x.settings !== undefined) g.settings = x.settings;
  if (patch.presentation) g.presentation = {...(g.presentation || {}), ...patch.presentation};
  if (patch.settings) g.settings = {...g.settings, ...patch.settings};
  if (x.privateUi !== undefined || patch.ui) {
    const ui = x.privateUi !== undefined ? x.privateUi : {...(await storedObject(room, 'ui')), ...patch.ui};
    await room.store('ui', ui);
  }
}

async function adjust(room, g, x) {
  if (g.adjustments[x.playerId]?.id === x.commandId) return;
  if (!Number.isFinite(x.delta) || Math.abs(x.delta) > 10000) fail('Invalid adjustment.');
  const before = g.scores[x.playerId];
  if (typeof before !== 'number') fail('Player not found.');
  const after = clamp(x.allowNegative, before, x.delta);
  const when = room.now();
  g.scores[x.playerId] = after;
  g.adjustments[x.playerId] = {id: x.commandId, before, after, at: when};
  const archive = await storedObject(room, 'archive');
  archive[`adjust-${x.commandId}`] = {id: `adjust-${x.commandId}`, type: 'adjust', playerId: x.playerId, playerName: x.name || '', delta: after - before, requestedDelta: x.delta, before, after, when};
  await room.store('archive', archive);
}

async function get(room, x) {
  if (x.what === 'ui') return (await room.stored('ui')) ?? null;
  const archive = (await room.stored('archive')) ?? null;
  if (x.what === 'archive') return archive;
  if (x.what === 'round') return archive?.[`round-${x.round}`] ?? null;
  fail('Unknown request.');
}

/** Runs one command; returns {value?, changed}. */
async function run(room, who, x) {
  const g = room.game;
  const isHost = who.id === room.ownerId;
  if (HOST_ACTIONS.has(x.action) ? !isHost : !(PLAYER_ACTIONS.has(x.action) && who.role === 'player')) fail('Not allowed.');
  const c = g.control;
  if (ROUND_ACTIONS.has(x.action) && x.action !== 'grade' && c.commandId === x.commandId && x.commandId) return {changed: false};
  if (ROUND_ACTIONS.has(x.action) && (x.roundId !== c.r || x.attempt !== c.a)) fail('Stale round or attempt.');
  switch (x.action) {
    case 'get': return {value: await get(room, x), changed: false};
    case 'configure':
      if (c.phase !== 'ready' && (x.mode !== c.mode || x.durationMs !== c.ms || x.timer !== (c.timer !== false))) fail('Change mode and timer before the round starts.');
      g.control = {...c, ...settingsFrom({...settingsFrom({mode: c.mode, durationMs: c.ms, timer: c.timer}), ...x}), version: c.version + 1, commandId: x.commandId};
      break;
    case 'publish': await publish(room, g, x); break;
    case 'select': g.selection = {r: c.r, a: c.a, uid: x.playerId, order: x.order}; break;
    case 'moderate':
      if (!g.members[x.playerId]) fail('Player not found.');
      if (!['kicked', 'banned', 'active'].includes(x.status)) fail('Invalid status.');
      g.moderation[x.playerId] = x.status;
      break;
    case 'celebrate': g.celebration = {id: x.commandId, at: room.now()}; break;
    case 'adjust': await adjust(room, g, x); break;
    case 'archive': {
      const archive = await storedObject(room, 'archive');
      archive[String(x.id)] = x.record;
      await room.store('archive', archive);
      return {changed: false};
    }
    case 'ready': {
      const key = String(x.key || '');
      if (!key || key !== g.presentation?.loadKey) return {changed: false};
      if (g.loads.key !== key) g.loads = {key, map: {}};
      if (g.loads.map[who.id] === x.status) return {changed: false};
      g.loads.map[who.id] = x.status === 'failed' ? 'failed' : 'ready';
      break;
    }
    case 'buzz': buzz(room, g, who, x.at); break;
    case 'grade': grade(room, g, x); break;
    default: control(room, g, x);
  }
  return {changed: true};
}

export const buzzyRules = {
  init(room) { return initialGame(room.now()); },
  onJoin(room, who) {
    const g = room.game;
    if (who.role === 'player') {
      if (!g.members[who.id]) {
        // #449: a name already used in this room is refused; the player adds a number or picks another name.
        const taken = Object.values(g.members).some((m) => sameName(m.name, who.name));
        if (taken) { room.send([who.id], {t: 'name-taken'}); return; }
        const c = g.control;
        // Someone who joins while a question is shown or open plays from the next one (the page shows them as waiting or queued).
        const fromRound = c.r + (c.phase === 'ready' && !g.presentation?.shown ? 0 : 1);
        g.members[who.id] = {name: who.name, at: room.now(), fromRound};
        g.scores[who.id] = 0;
      } else if (g.moderation[who.id] === 'kicked') {
        g.moderation[who.id] = 'active';
      }
      room.save();
    }
    broadcast(room);
  },
  onBack(room) { broadcast(room); },
  onDrop(room) { broadcast(room); },
  onGone(room) { broadcast(room); },
  async onMessage(room, who, data, {at}) {
    if (data?.t !== 'cmd' || typeof data.action !== 'string') return;
    try {
      const {value, changed} = await run(room, who, {...data, at});
      if (changed) { room.save(); broadcast(room); }
      reply(room, who, data.rid, {ok: true, value});
    } catch (error) {
      if (!(error instanceof RuleError)) throw error;
      reply(room, who, data.rid, {ok: false, error: error.message});
    }
  },
  onTimer(room, name) {
    const [kind, r, a] = String(name).split(':');
    const c = room.game.control;
    if (kind !== 'expire' || Number(r) !== c.r || Number(a) !== c.a || c.phase !== 'open') return;
    room.game.control = {...c, phase: 'closed', closedAt: room.now(), version: c.version + 1};
    room.save();
    broadcast(room);
  },
};
