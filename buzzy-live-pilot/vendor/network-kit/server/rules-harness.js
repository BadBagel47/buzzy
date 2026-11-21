// A quick test room for server-run rules, in plain Node, without workerd (F-150,
// from Buzzy). It runs the real room core with an in-memory clock, storage,
// timers and pretend connections, so a game can try its rules in its own tests:
//
//   import { testRoom } from './vendor/network-kit/server/rules-harness.js';
//   const t = await testRoom({ mode: 'server', rules, roles, ownerRole: 'leader' });
//   const ana = await t.join('Ana');                 // a participant (role as in the options)
//   await t.command(t.owner, 'start');                // a room command, as the client sends it
//   await t.send(ana, { buzz: true });                // a game message to the rules
//   await t.advance(3_000);                           // the clock, with the rules' timers
//   t.received(ana);                                  // what the rules sent Ana: [data, …]
//   t.game; t.room; await t.stored('questions');      // the rules' state
//
// Times are the test's own: nothing waits for real time.
import { RoomCore } from './room-core.js';
import { PROTOCOL, PartJoiner } from '../shared/protocol.js';

class Connection {
  constructor(name) {
    this.name = name;
    this.sent = [];
    this.closedWith = null;
    this.attachment = null;
    this.id = null;
  }

  /** Everything the room sent this connection, large messages joined. */
  messages(type) {
    const joiner = new PartJoiner(64 * 1024 * 1024);
    const out = [];
    for (const text of this.sent) {
      let m = JSON.parse(text);
      if (m.t === 'part') {
        const whole = joiner.add(m);
        if (whole === null) continue;
        m = JSON.parse(whole);
      }
      if (!type || m.t === type) out.push(m);
    }
    return out;
  }
}

/** A room with server-run (or host-run) options, its owner connected. Resolves to the test room. */
export async function testRoom(options, { settings = {}, ownerName = 'Owner', start = Date.UTC(2026, 0, 1, 12) } = {}) {
  let time = start;
  const store = new Map();
  let alarm = null;
  let deferred = [];
  const sockets = [];
  let n = 0;
  const host = {
    env: {},
    now: () => time,
    storage: {
      get: async (k) => structuredClone(store.get(k)),
      put: async (k, v) => void store.set(k, structuredClone(v)),
      delete: async (k) => void store.delete(k),
      deleteAll: async () => void store.clear(),
      list: async ({ prefix = '' } = {}) => new Map([...store].filter(([k]) => k.startsWith(prefix)).sort()),
    },
    setAlarm: async (at) => { alarm = at; },
    defer(ms, fn) {
      const entry = { at: time + ms, fn };
      deferred.push(entry);
      return () => { deferred = deferred.filter((d) => d !== entry); };
    },
    sockets: () => sockets.filter((ws) => !ws.closedWith),
    getAttachment: (ws) => ws.attachment,
    setAttachment: (ws, v) => { ws.attachment = structuredClone(v); },
    send: (ws, text) => { if (!ws.closedWith) ws.sent.push(text); },
    close: (ws, code, reason) => { ws.closedWith ??= { code, reason }; },
    lastPingAt: (ws) => (ws.closedWith ? null : time),
  };
  const core = new RoomCore(host, { ...options, limits: options.limits ?? null });
  await core.load();
  const created = await core.create(settings, null);
  if (created.error) throw new Error(`testRoom: ${created.error}`);

  const answerChecks = async () => {
    for (const ws of sockets) {
      if (ws.closedWith) continue;
      const checks = ws.sent.filter((t) => t === '{"t":"check"}').length;
      for (let i = ws.answered ?? 0; i < checks; i++) await core.message(ws, JSON.stringify({ t: 'cmd', c: 'alive' }));
      ws.answered = checks;
    }
  };
  const connect = async (name, extra = {}) => {
    n += 1;
    const ws = new Connection(name);
    sockets.push(ws);
    core.opened(ws);
    await core.message(ws, JSON.stringify({ t: 'hello', v: PROTOCOL, pk: `test-player-key-${n}-xxxxxxxxxx`, sid: `s${n}`, name, ...extra }));
    ws.id = ws.messages('welcome').pop()?.you.id ?? null;
    if (!ws.id) throw new Error(`testRoom: ${name} was not let in (${ws.closedWith?.reason ?? 'no welcome'})`);
    return ws;
  };
  const owner = await connect(ownerName, { owner: created.ownerKey });
  if (core.options.mode === 'host') await core.message(owner, JSON.stringify({ t: 'cmd', c: 'host-ready' }));
  let commandN = 0;

  return {
    core,
    owner,
    code: created.code,
    keys: created.keys,
    /** A participant joins; `role` and `key` as a client would send them. */
    join: (name, extra = {}) => connect(name, extra),
    /** A game message from a participant (to the rules, or the host in host-run rooms). */
    send: async (who, data) => { await core.message(who, JSON.stringify({ t: 'msg', d: data })); await core.flush(); },
    /** A room command (start, pause, kick …) with its arguments. */
    command: async (who, c, args = {}) => {
      commandN += 1;
      await core.message(who, JSON.stringify({ t: 'cmd', n: commandN, c, ...args }));
      await core.flush();
      return who.messages().filter((m) => m.n === commandN).pop() ?? null;
    },
    /** The connection drops (a lost network); it may join again with the same name later. */
    drop: async (who) => { who.closedWith ??= { code: 1006, reason: '' }; await core.closed(who); },
    /** Move the clock: the rules' timers and the room's own run as they fall due. */
    async advance(ms) {
      await answerChecks();
      const end = time + ms;
      for (;;) {
        const nextDeferred = deferred.reduce((min, d) => (min === null || d.at < min ? d.at : min), null);
        const due = [nextDeferred, alarm].filter((t) => t !== null && t <= end);
        if (due.length === 0) break;
        time = Math.max(time, Math.min(...due));
        const now = deferred.filter((d) => d.at <= time);
        deferred = deferred.filter((d) => d.at > time);
        for (const d of now) await d.fn();
        if (alarm !== null && alarm <= time) {
          alarm = null;
          await core.alarm();
        }
        await answerChecks();
      }
      time = end;
      await core.flush();
    },
    /** What the rules (or the host) sent this participant: the data of each game message. */
    received: (who) => who.messages('msg').map((m) => m.d),
    /** The room as a participant last saw it (players, phase, data …). */
    roomOf: (who) => who.messages().filter((m) => m.t === 'room' || m.t === 'welcome').pop()?.room ?? null,
    get game() { return core.state?.game ?? null; },
    get room() { return core.state; },
    get now() { return time; },
    stored: (key) => core.storedValue(key),
  };
}
