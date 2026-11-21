// Playtest Recorder (F-092): records without disturbing the players, so a match
// with friends can be read afterwards to see what can be improved or what went
// wrong. It collects what the game hands over (`record(kind, data)`) and what
// the kit sees itself (errors, frames per second and slow frames, the room's
// connection and its participants), and sends it in batches about once a
// minute and when the page closes. Other players are to be told; the game
// shows RECORDER_NOTICE to them (owner, Q8).
//
// Who records (owner 2026-11-19, Q4): a browser with a tester link records from
// the start; with Open test on (F-118) a page with ?record records and one with
// ?report only shows Playtest-rutan. While not recording, the last two minutes
// are kept in the browser's memory only (F-120, Q12): *Spela in* in the panel
// starts recording with them, so the recording shows what led up to it.
//
//   import { startRecorder } from './vendor/network-kit/client/playtest-entry.js';
//   const recorder = await startRecorder({ admin, version, room });   // null when nothing may record
//   recorder?.record('level-start', { level: 3 });
//   recorder?.attach(room);   // a room joined later
//   recorder?.onStart(() => room.send({ type: 'recording' }));  // tell the others
//   recorder?.onStop(() => room.send({ type: 'recording', on: false }));

import { VERSION } from '../version.js';
import { describeDevice, confirmTap, openSession, openMode, NAME_KEY, pageAddress } from './playtest.js';
import { RECORDER_NOTICE } from './playtest-entry.js';

export { RECORDER_NOTICE };
const TOKEN_KEY = 'nk-playtest:tester';
const OFF_KEY = 'nk-playtest:recording-off'; // this tab stopped recording (sessionStorage)
const BATCH_MS = 60_000;
const EVENTS_MAX = 500; // per batch, as the admin page takes them
const CHUNKS_MAX = 240; // per session (four hours); then a new session starts
export const LOOKBACK_MS = 2 * 60_000; // owner Q12: the last two minutes
const EVENT_MAX_CHARS = 2048; // one event's data, as JSON (B-131)
const BATCH_MAX_CHARS = 48 * 1024; // a batch, split above this (B-131); the beacon takes about 64 kB

const randomId = (win) => {
  const bytes = win.crypto.getRandomValues(new Uint8Array(12));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const session = (win) => {
  try {
    return win.sessionStorage ?? null;
  } catch {
    return null;
  }
};

/**
 * The game's data as it is now (B-131): a copy made at once, so later changes do not
 * show up, never throwing (a loop or a BigInt), and at most EVENT_MAX_CHARS.
 */
function snapshotOf(data) {
  if (data === null || data === undefined) return null;
  try {
    const text = JSON.stringify(data);
    if (text === undefined) return null;
    if (text.length > EVENT_MAX_CHARS) return { tooLarge: text.length };
    return JSON.parse(text);
  } catch {
    return { notJson: true };
  }
}

export class Recorder {
  constructor({ admin, token, version = '', window: win, document: doc, fetch: f, everyMs = BATCH_MS, badge = true, recording = true, open = false, expires = null }) {
    this.admin = String(admin).replace(/\/$/, '');
    this.token = token;
    this.open = open;
    this.version = version;
    this.win = win;
    this.doc = doc;
    this.fetch = f ?? ((...a) => win.fetch(...a));
    this.everyMs = everyMs;
    this.badgeWanted = badge && !new URLSearchParams(win.location?.search ?? '').has('still');
    this.events = []; // { at, k, d }: times are absolute until sent
    this.dropped = 0;
    this.frames = { count: 0, slowest: 0, last: 0 };
    this.rooms = new Set();
    this.closed = false;
    this.recording = false;
    this.listeners = { start: [], stop: [] };
    this.watch();
    this.timer = win.setInterval?.(() => this.tick(), everyMs);
    win.__nkRecorder = this; // Playtest-rutan finds it for *Spela in* (F-120)
    this.full = false; // the day's cap is reached (429): nothing more is sent from this page (B-125)
    if (open && expires) this.watchEnd(expires);
    if (recording) this.start({ quiet: true });
    else win.dispatchEvent?.(new win.CustomEvent('nk-playtest-recorder', { detail: { recording: false } })); // the panel shows *Spela in*
  }

  newSession() {
    this.session = randomId(this.win);
    this.seq = 0;
    this.startedAt = Date.now();
  }

  /** A game event worth seeing afterwards (a level start, a death, a choice …). */
  record(kind, data = null) {
    if (this.closed) return;
    if (this.events.length >= EVENTS_MAX) {
      if (this.recording) {
        this.dropped += 1;
        return;
      }
      this.events.shift(); // the look-back keeps the newest
    }
    this.events.push({ at: Date.now(), k: String(kind).slice(0, 40), d: snapshotOf(data) });
  }

  /** Also record what happens in a NetworkRoom: connection, participants, host, closing. */
  attach(room) {
    if (!room || this.rooms.has(room)) return;
    this.rooms.add(room);
    // The kit tells the others in the room itself (D-126, owner Q20); the room passes it on.
    if (this.recording) room.announceRecording?.(true, { lookback: this.lookback });
    this.record('room', { code: room.code, me: room.me ?? null });
    room.on('status', (status) => this.record('room-status', { status }));
    room.on('peer', (p) => this.record('room-peer', { event: p?.event ?? p?.type ?? null, id: p?.id ?? p?.player?.id ?? null }));
    room.on('room', (r) => {
      const key = `${r?.phase}|${r?.hostId}|${r?.ownerId}|${r?.paused}`;
      if (key === this.lastRoomKey) return;
      this.lastRoomKey = key;
      this.record('room-state', { phase: r?.phase ?? null, host: r?.hostId ?? null, owner: r?.ownerId ?? null, paused: Boolean(r?.paused), players: r?.players?.length ?? null });
    });
    room.on('closed', (c) => this.record('room-closed', { code: c?.code ?? null, reason: c?.reason ?? null }));
    room.on('error', (e) => this.record('room-error', { code: e?.code ?? null, command: e?.command ?? null }));
  }

  watch() {
    const w = this.win;
    w.addEventListener?.('error', (e) => this.record('error', { message: String(e.message ?? 'error').slice(0, 300), at: e.filename ? `${String(e.filename).split('/').pop()}:${e.lineno}` : null }));
    w.addEventListener?.('unhandledrejection', (e) => this.record('error', { message: `Unhandled: ${String(e.reason?.message ?? e.reason).slice(0, 300)}` }));
    w.addEventListener?.('pagehide', () => this.flush(true));
    // Playtest-rutan's "Sluta testa på den här enheten" (F-117).
    w.addEventListener?.('nk-playtest-forget', () => { this.flush().finally(() => this.close()); });
    this.doc?.addEventListener?.('visibilitychange', () => {
      this.record('visibility', { hidden: Boolean(this.doc.hidden) });
      if (this.doc.hidden) this.flush(true);
    });
    const raf = w.requestAnimationFrame?.bind(w);
    if (raf) {
      const tick = (t) => {
        const f = this.frames;
        if (f.last) f.slowest = Math.max(f.slowest, t - f.last);
        f.count += 1;
        f.last = t;
        if (!this.closed) raf(tick);
      };
      raf(tick);
    }
  }

  /** About once a minute: frames per second, then send (recording) or trim to the look-back (not). */
  tick() {
    if (this.closed) return;
    this.measure();
    if (this.recording) this.flush();
    else this.trim();
  }

  measure() {
    // At most an hour of frame lines waits for something worth sending (B-125).
    const perf = this.events.filter((e) => e.k === 'perf');
    if (perf.length >= 60) this.events.splice(this.events.indexOf(perf[0]), 1);
    if (this.frames.count > 1) {
      this.events.push({ at: Date.now(), k: 'perf', d: { fps: Math.round(this.frames.count / (this.everyMs / 1000)), slowestFrameMs: Math.round(this.frames.slowest) } });
      this.frames = { count: 0, slowest: 0, last: 0 };
    }
  }

  trim(now = Date.now()) {
    const from = now - LOOKBACK_MS;
    const i = this.events.findIndex((e) => e.at >= from);
    this.events = i < 0 ? [] : this.events.slice(i);
  }

  context() {
    const w = this.win;
    const { device, browser, userAgent } = describeDevice(w.navigator);
    return {
      url: pageAddress(w.location), version: String(this.version ?? ''), kit: VERSION, device, browser, userAgent,
      window: `${w.innerWidth}x${w.innerHeight}`, screen: `${w.screen?.width ?? 0}x${w.screen?.height ?? 0}`,
      dpr: w.devicePixelRatio ?? 1, language: w.navigator?.language ?? '', startedAt: this.startedAt,
    };
  }

  /** Sends what has been gathered while recording; `leaving` uses sendBeacon, which outlives the page. */
  async flush(leaving = false) {
    if (!this.recording || this.full) return false;
    // Frame lines and hiding alone are not worth a request (B-125): they go with the next real event.
    if (!this.dropped && !this.events.some((e) => e.k !== 'perf' && e.k !== 'visibility')) return false;
    // Markers first, so a full batch never loses them (B-132).
    if (this.lost) {
      this.events.unshift({ at: Date.now(), k: 'lost', d: { events: this.lost } });
      this.lost = 0;
    }
    if (this.dropped) {
      this.events.unshift({ at: Date.now(), k: 'dropped', d: { events: this.dropped } });
      this.dropped = 0;
    }
    if (!this.events.length) return false;
    let name = '';
    try {
      name = this.open ? String(JSON.parse(session(this.win)?.getItem(NAME_KEY) ?? 'null') ?? '').slice(0, 40) : ''; // kept as JSON by the panel
    } catch {
      name = '';
    }
    // Times count from the session's start; the look-back's are negative (F-120).
    // A batch stays under about 48 kB (B-131): what does not fit goes in the next one, at once.
    const events = [];
    let size = 0;
    while (this.events.length && events.length < EVENTS_MAX) {
      const e = this.events[0];
      const one = { t: e.at - this.startedAt, k: e.k, d: e.d };
      const chars = JSON.stringify(one).length;
      if (events.length && size + chars > BATCH_MAX_CHARS) break;
      events.push(one);
      size += chars;
      this.events.shift();
    }
    const more = this.events.length > 0;
    const chunk = {
      token: this.token, session: this.session, seq: this.seq, events,
      ...(this.seq === 0 ? { context: this.context() } : {}),
      ...(name ? { name } : {}),
    };
    this.seq += 1;
    if (this.seq >= CHUNKS_MAX) this.newSession();
    const url = `${this.admin}/playtest/v1/record`;
    const body = JSON.stringify(chunk);
    let ok = false;
    if (leaving && this.win.navigator?.sendBeacon) {
      // A plain-text beacon needs no preflight, so it still goes when the page closes.
      ok = this.win.navigator.sendBeacon(url, new Blob([body], { type: 'text/plain' }));
    } else {
      try {
        const res = await this.fetch(url, { method: 'POST', headers: { 'content-type': 'text/plain' }, body, keepalive: true });
        // The admin page says no (B-125): the link or the test has ended, so stop for good;
        // the day is full, so stop sending and say so on the badge.
        if (res.status === 401) this.close();
        else if (res.status === 429) this.dayFull();
        ok = res.ok;
      } catch {
        ok = false; // a lost batch is acceptable: recording never disturbs the game
      }
    }
    // A batch that did not arrive is marked in the next one (B-131).
    if (!ok && !this.closed && !this.full) this.lost = (this.lost ?? 0) + events.length;
    if (more && !this.closed && !this.full) return this.flush(leaving);
    return ok;
  }

  showBadge() {
    const doc = this.doc;
    if (!doc?.documentElement || this.badge) return;
    // A button (owner Q3): a tap asks, a second stops recording in this tab (Q11).
    const b = doc.createElement('button');
    b.type = 'button';
    b.textContent = '● Inspelning';
    b.setAttribute('aria-label', 'Playtest Recorder spelar in. Tryck för att sluta.');
    // Styles through the CSSOM, so a strict Content-Security-Policy allows them.
    Object.assign(b.style, {
      position: 'fixed', right: '8px', bottom: '8px', zIndex: '2147481999', cursor: 'pointer', border: '0', margin: '0',
      font: '600 12px system-ui, sans-serif', color: '#fff', background: 'rgba(170, 20, 20, .85)', padding: '4px 9px', borderRadius: '999px',
      touchAction: 'manipulation', webkitTapHighlightColor: 'transparent',
    });
    // The game never gets the tap.
    for (const type of ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'touchstart', 'touchend', 'keydown']) b.addEventListener(type, (e) => e.stopPropagation());
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!confirmTap(this.win, b, '● Tryck igen för att sluta spela in')) return;
      this.stop();
    });
    doc.documentElement.append(b);
    this.badge = b;
    // Open test: say once in this tab what is kept and how to stop (D-126, review PRIV-1).
    const told = 'nk-playtest:told';
    if (this.open && !session(this.win)?.getItem?.(told)) {
      try {
        session(this.win)?.setItem(told, '1');
      } catch {
        // told for this page anyway
      }
      b.textContent = '● Inspelning för speltest: enhet, webbläsare och vad som händer i spelet sparas i 30 dagar. Tryck två gånger för att sluta.';
      Object.assign(b.style, { maxWidth: 'min(320px, calc(100vw - 16px))', whiteSpace: 'normal', textAlign: 'left', borderRadius: '10px' });
      this.win.setTimeout?.(() => {
        if (this.badge !== b || b.dataset.confirming) return;
        b.textContent = '● Inspelning';
        Object.assign(b.style, { maxWidth: '', whiteSpace: '', textAlign: '', borderRadius: '999px' });
      }, 12_000);
    }
  }

  dayFull() {
    this.full = true;
    this.events = [];
    if (this.badge) this.badge.textContent = '● Inspelning: fullt i dag';
  }

  /** Open test ends at its time (B-125): ask again then; extended goes on, ended stops for good. */
  watchEnd(expires) {
    const ms = Math.max(1000, expires - Date.now() + 2000);
    this.win.clearTimeout?.(this.endTimer);
    this.endTimer = this.win.setTimeout?.(async () => {
      const again = await openSession({ win: this.win, admin: this.admin, fetch: this.fetch, fresh: true });
      if (again) this.watchEnd(again.expires);
      else this.close();
    }, Math.min(ms, 2 ** 31 - 1));
  }

  /** Called each time recording starts, for example so the game can tell the others. */
  onStart(fn) {
    this.listeners.start.push(fn);
  }

  /** Called each time recording stops. */
  onStop(fn) {
    this.listeners.stop.push(fn);
  }

  emit(kind) {
    for (const room of this.rooms) {
      try {
        room.announceRecording?.(kind === 'start', { lookback: this.lookback });
      } catch {
        // a closed room needs no word
      }
    }
    for (const fn of this.listeners[kind]) {
      try {
        fn();
      } catch {
        // a game's listener never stops the Recorder
      }
    }
    this.win.dispatchEvent?.(new this.win.CustomEvent('nk-playtest-recorder', { detail: { recording: this.recording } }));
  }

  /** Starts recording (*Spela in*, F-120), with the last two minutes kept so far. */
  start({ quiet = false } = {}) {
    if (this.closed || this.recording || this.full) return;
    this.trim();
    // Started with *Spela in*: the last two minutes come along, and the others are told so (D-126).
    this.lookback = !quiet && this.events.length > 0;
    this.newSession();
    this.recording = true;
    try {
      session(this.win)?.removeItem(OFF_KEY);
    } catch {
      // nothing kept
    }
    if (this.badgeWanted) this.showBadge();
    this.emit('start');
    if (!quiet) this.flush();
  }

  /** Stops recording in this tab, also after a reload; the look-back goes on in memory. */
  async stop() {
    if (!this.recording) return;
    this.measure();
    await this.flush();
    this.recording = false;
    this.events = [];
    try {
      session(this.win)?.setItem(OFF_KEY, '1');
    } catch {
      // stops for this page anyway
    }
    this.badge?.remove();
    this.badge = null;
    this.emit('stop');
  }

  /** Stops for good on this page (the browser forgot its tester link). */
  async close() {
    if (this.closed) return;
    this.closed = true; // first, so a refused last batch does not close it twice
    this.full = true;
    if (this.recording) {
      this.recording = false;
      this.events = [];
      this.badge?.remove();
      this.badge = null;
      this.emit('stop');
    }
    this.win.clearInterval?.(this.timer);
    this.win.clearTimeout?.(this.endTimer);
    if (this.win.__nkRecorder === this) this.win.__nkRecorder = null;
  }
}

/**
 * Starts Playtest Recorder where it may run: a browser with a tester link
 * (recording, unless stopped in this tab), or Open test (F-118) on a page with
 * ?record (recording) or ?report (not yet; *Spela in* starts it). Otherwise null.
 */
export async function startRecorder(options = {}) {
  const win = options.window ?? globalThis.window;
  const doc = options.document ?? win?.document;
  if (!win || !options.admin) return null;
  let token = null;
  try {
    token = JSON.parse(win.localStorage?.getItem(TOKEN_KEY) ?? 'null');
  } catch {
    token = null;
  }
  // The address decides whether it records, the tester link only who it is (owner Q15):
  // a plain address records with a tester link, ?report alone does not, ?record does.
  const mode = openMode(win);
  let recording = Boolean(token) && (mode ? mode.record : true);
  let open = false;
  let expires = null;
  if (!token) {
    if (!mode) return null;
    const tester = await openSession({ win, admin: options.admin, fetch: options.fetch });
    if (!tester) return null;
    token = tester.token;
    expires = tester.expires;
    open = true;
    recording = mode.record;
  }
  try {
    if (session(win)?.getItem(OFF_KEY)) recording = false; // stopped in this tab (owner Q3)
  } catch {
    // no session storage: as asked
  }
  const recorder = new Recorder({ ...options, token, open, recording, expires: open ? expires : null, window: win, document: doc });
  if (options.room) recorder.attach(options.room);
  return recorder;
}
