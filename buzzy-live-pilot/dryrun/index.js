var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// vendor/network-kit/shared/protocol.js
var PROTOCOL = 3;
var PART_CHARS = 16e3;
function splitIntoParts(text, p) {
  const of = Math.ceil(text.length / PART_CHARS);
  const parts = [];
  for (let i = 0; i < of; i++) {
    parts.push(JSON.stringify({ t: "part", p, i, of, d: text.slice(i * PART_CHARS, (i + 1) * PART_CHARS) }));
  }
  return parts;
}
__name(splitIntoParts, "splitIntoParts");
var PartJoiner = class {
  static {
    __name(this, "PartJoiner");
  }
  constructor(maxChars) {
    this.maxChars = maxChars;
    this.current = null;
  }
  add(part) {
    const { p, i, of, d } = part;
    if (!Number.isSafeInteger(p) || !Number.isSafeInteger(i) || !Number.isSafeInteger(of) || typeof d !== "string") {
      throw new Error("bad part");
    }
    if (of < 2 || of > Math.ceil(this.maxChars / PART_CHARS) || d.length > PART_CHARS) throw new Error("bad part");
    if (i === 0) this.current = { p, of, texts: [], length: 0 };
    const c = this.current;
    if (!c || c.p !== p || c.of !== of || c.texts.length !== i) {
      this.current = null;
      throw new Error("parts out of order");
    }
    c.texts.push(d);
    c.length += d.length;
    if (c.length > this.maxChars) {
      this.current = null;
      throw new Error("too large");
    }
    if (c.texts.length < of) return null;
    this.current = null;
    return c.texts.join("");
  }
};
var CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
var CODE_LENGTH = 6;
var CODE_MIN_LENGTH = 4;
var CODE_MAX_LENGTH = 12;
var CLOSE = Object.freeze({
  ROOM_CLOSED: 4e3,
  KICKED: 4001,
  BANNED: 4002,
  REPLACED: 4003,
  NOT_FOUND: 4004,
  FULL: 4005,
  IN_PROGRESS: 4006,
  KEY: 4007,
  GAME_CLOSED: 4008,
  VERSION: 4009,
  BAD_REQUEST: 4010,
  LEFT: 4011,
  RATE: 4012,
  BUDGET: 4013
});
var CLOSE_UNRESPONSIVE = 4014;
var FINAL_CLOSE_CODES = new Set(Object.values(CLOSE));
var GAME_CLOSED_TEXT = Object.freeze({
  off: "The game is not taking new players right now.",
  until: "The game is closed until {until}.",
  budget: "The game has used up today's free quota. It opens again at {until}.",
  "too-many-rooms": "Too many new rooms right now. Try again in a while.",
  stopped: "The game was stopped by its owner.",
  "too-many-attempts": "Too many tries in a short time. Wait a minute and try again.",
  "too-many-requests": "Too many tries in a short time. Wait a minute and try again."
});
var CLOSE_TEXT = Object.freeze({
  [CLOSE.ROOM_CLOSED]: "The room has closed.",
  [CLOSE.KICKED]: "You were removed from the room.",
  [CLOSE.BANNED]: "You cannot join this room.",
  [CLOSE.REPLACED]: "The room was opened in another tab.",
  [CLOSE.NOT_FOUND]: "Room not found.",
  [CLOSE.FULL]: "The room is full.",
  [CLOSE.IN_PROGRESS]: "The game has already started.",
  [CLOSE.KEY]: "This room needs a valid invitation link.",
  [CLOSE.GAME_CLOSED]: "The game is closed right now.",
  [CLOSE.VERSION]: "Please reload the page to get the latest version.",
  [CLOSE.BAD_REQUEST]: "Could not join the room.",
  [CLOSE.LEFT]: "You left the room.",
  [CLOSE.RATE]: "Too many messages were sent. Please reload the page.",
  [CLOSE.BUDGET]: "This room has used up its time for today."
});
function normalizeCode(text) {
  return String(text ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}
__name(normalizeCode, "normalizeCode");
function isValidCode(code, length) {
  if (typeof code !== "string") return false;
  if (length !== void 0 ? code.length !== length : code.length < CODE_MIN_LENGTH || code.length > CODE_MAX_LENGTH) {
    return false;
  }
  for (const ch of code) if (!CODE_ALPHABET.includes(ch)) return false;
  return true;
}
__name(isValidCode, "isValidCode");
var NOTICE_TEXT = Object.freeze({
  "budget-soon": {
    level: "warning",
    title: "Closing soon for today",
    text: "This game has almost used its share of today's free server time. It will soon close for new games until {until}. Games already running can finish."
  },
  "budget-closed": {
    level: "warning",
    title: "Closed for today",
    text: "This game has used its share of today's free server time. No new games until {until}. Games already running can finish."
  },
  // The timer ("on until a time", F-067): before and after it ends.
  "timer-soon": {
    level: "warning",
    title: "Open play ends soon",
    text: "Open play ends at {until}. After that no new players can join. Games already running can finish."
  },
  "timer-ended": {
    level: "warning",
    title: "Open play has ended",
    text: "No new players can join now. Games already running can finish."
  },
  "timer-stop-soon": {
    level: "warning",
    title: "The game stops soon",
    text: "The game stops at {until}. Everyone will be disconnected then."
  },
  "timer-stopped": {
    level: "warning",
    title: "The game has stopped",
    text: "No games can be started or joined now."
  },
  message: { level: "info", title: "Message", text: "" }
});

// vendor/network-kit/version.js
var VERSION = "0.22.0";

// vendor/network-kit/server/random.js
var ID_ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";
function randomChars(alphabet, length) {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  let out = "";
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return out;
}
__name(randomChars, "randomChars");
var newRoomCode = /* @__PURE__ */ __name((length = CODE_LENGTH) => randomChars(CODE_ALPHABET, length), "newRoomCode");
var newPlayerId = /* @__PURE__ */ __name(() => randomChars(ID_ALPHABET, 6), "newPlayerId");
function base64url(bytes) {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
__name(base64url, "base64url");
var newSecret = /* @__PURE__ */ __name(() => base64url(crypto.getRandomValues(new Uint8Array(16))), "newSecret");
function randomSeed() {
  return crypto.getRandomValues(new Uint32Array(1))[0];
}
__name(randomSeed, "randomSeed");
async function sha256(text) {
  const data = new TextEncoder().encode(text);
  return base64url(new Uint8Array(await crypto.subtle.digest("SHA-256", data)));
}
__name(sha256, "sha256");
function sameSecret(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
__name(sameSecret, "sameSecret");

// vendor/network-kit/server/room-shared.js
var LOBBY_PREFIX = "lb_";
var OWNER_COMMANDS = /* @__PURE__ */ new Set(["kick", "unban", "renew", "settings", "close", "owner"]);
var HOST_COMMANDS = /* @__PURE__ */ new Set(["start", "cancel", "end", "admit", "assign", "handover", "data", "successors"]);
var own = /* @__PURE__ */ __name((obj, key) => typeof key === "string" && Object.hasOwn(obj, key), "own");
function byteLength(text) {
  return typeof text === "string" ? new TextEncoder().encode(text).length : text.byteLength;
}
__name(byteLength, "byteLength");

// vendor/network-kit/server/room-admission.js
var admissionMethods = {
  /**
   * The admin page's word on this game (F-003, F-004): null when the game is
   * not connected to it or it cannot be reached (then the game stays open).
   */
  async admission() {
    if (!this.host.admission) return null;
    try {
      return await this.host.admission() ?? null;
    } catch {
      return null;
    }
  },
  /** Is this one of the room's invitation keys, not expired? */
  validKey(key, now) {
    if (typeof key !== "string" || !key) return false;
    return Object.values(this.state.keys).some((k) => sameSecret(key, k.k) && (k.exp === null || k.exp > now));
  },
  /** A game link (F-058); a lobby's token (F-059) only counts where `lobby` is true. */
  async isAdminPass(token, { lobby = false } = {}) {
    if (!this.host.checkAdminPass || typeof token !== "string" || !token) return false;
    if (!lobby && token.startsWith(LOBBY_PREFIX)) return false;
    try {
      return await this.host.checkAdminPass(token) === true;
    } catch {
      return false;
    }
  },
  /**
   * An emergency stop closes running rooms too; so does Cloudflare limiting
   * once the game has used its share (F-098), except a room opened with a game
   * link or a lobby. Looked at now and then while the room is busy.
   */
  async checkStopped() {
    if (!this.host.admission || !this.state || this.state.closed) return;
    const now = this.host.now();
    if (now - (this.lastStopCheck ?? 0) < 3e4) return;
    this.lastStopCheck = now;
    const status = await this.admission();
    if (status?.stopped) await this.closeRoom("stopped", CLOSE.GAME_CLOSED);
    else if (status && !status.open && status.reason === "budget" && !(this.state.pass && await this.isAdminPass(this.state.pass, { lobby: true }))) {
      await this.closeRoom("budget", CLOSE.GAME_CLOSED);
    } else await this.checkLobby();
  },
  /** F-098: game messages with nobody to receive them, for too long, close a host-run room. */
  async aloneTooLong(player) {
    const limit = this.options.closeAloneAfterMs;
    if (!limit || this.options.mode !== "host") return false;
    const others = Object.values(this.state.players).some((p) => p.id !== player.id && p.status === "online");
    const now = this.host.now();
    if (others) {
      this.aloneSince = null;
      return false;
    }
    this.aloneSince ??= now;
    if (now - this.aloneSince < limit) return false;
    await this.closeRoom("alone", CLOSE.ROOM_CLOSED);
    await this.flush();
    return true;
  },
  /** A lobby room closes when its lobby was revoked on the admin page (F-059). */
  async checkLobby() {
    const s = this.state;
    if (!s || s.closed || !s.lobbyEnds || !this.host.checkAdminPass) return true;
    if (await this.isAdminPass(s.pass, { lobby: true })) return true;
    await this.closeRoom("lobby-ended");
    return false;
  }
};

// vendor/network-kit/server/room-commands.js
var commandMethods = {
  async command(ws, player, msg) {
    const s = this.state;
    const o = this.options;
    const c = msg.c;
    const isOwner = player.id === s.ownerId;
    const isHost = player.id === s.hostId;
    const fail2 = /* @__PURE__ */ __name((code) => {
      this.penalize(ws, 5);
      this.sendJson(ws, { t: "err", code, c: typeof c === "string" ? c.slice(0, 24) : null, n: msg.n });
    }, "fail");
    const before = this.fingerprint();
    if (OWNER_COMMANDS.has(c) && !isOwner) return fail2("owner-only");
    if (HOST_COMMANDS.has(c) && !isHost && !isOwner) return fail2("host-only");
    switch (c) {
      case "take": {
        if (!this.role(player).plays || player.waiting) return fail2("not-allowed");
        if (!own(o.places, msg.place)) return fail2("no-such-place");
        const holders = Object.values(s.players).filter((p) => p.place === msg.place && p.id !== player.id);
        if (holders.length >= o.places[msg.place]) return fail2("place-taken");
        player.place = msg.place;
        break;
      }
      case "visibility":
        player.hidden = msg.hidden === true;
        this.watchHiddenHost();
        break;
      case "leave-place":
        player.place = null;
        break;
      case "assign": {
        const target = this.player(msg.id);
        if (!target || !this.role(target).plays) return fail2("no-such-participant");
        if (msg.place !== null && !own(o.places, msg.place)) return fail2("no-such-place");
        if (msg.place !== null) {
          const holders = Object.values(s.players).filter((p) => p.place === msg.place && p.id !== target.id);
          if (holders.length >= o.places[msg.place]) {
            if (o.places[msg.place] !== 1) return fail2("place-taken");
            holders[0].place = null;
          }
        }
        target.place = msg.place;
        break;
      }
      case "pause": {
        if (!this.mayPause(player)) return fail2("not-allowed");
        if (s.paused) return;
        s.paused = { reason: "player", id: player.id, at: this.host.now() };
        await this.saveSnapshot();
        break;
      }
      case "resume": {
        if (!this.mayPause(player)) return fail2("not-allowed");
        if (!s.paused || s.paused.reason === "host-away" || s.paused.reason === "host-change") return;
        s.paused = null;
        if (o.mode === "host" && this.inGame()) {
          const hostPlayer = this.player(s.hostId);
          if (!hostPlayer || hostPlayer.status === "away") {
            s.paused = { reason: "host-away", id: s.hostId, at: this.host.now() };
          }
        }
        break;
      }
      case "host-ready": {
        if (!isHost) return;
        s.hostPending = false;
        if (s.paused?.reason === "host-change" || s.paused?.reason === "host-away") s.paused = null;
        break;
      }
      case "host-check": {
        const hostPlayer = this.player(s.hostId);
        if (o.mode !== "host" || isHost || player.waiting || !hostPlayer || hostPlayer.status !== "online") return;
        if (this.hostCheck || this.host.now() - this.lastHostCheck < o.hostCheckMs * 2) return;
        this.lastHostCheck = this.host.now();
        this.startHostCheck(hostPlayer.id);
        return;
      }
      case "alive":
        return;
      // the answer to a check; handled when the message arrived
      case "start": {
        const word2 = await this.admission();
        const passed = /* @__PURE__ */ __name(async () => await this.isAdminPass(this.adminPasses?.get(ws)) || s.pass && await this.isAdminPass(s.pass, { lobby: true }), "passed");
        if (word2 && !word2.open && !(!word2.stopped && await passed())) {
          this.sendJson(ws, { t: "err", code: "game-closed", reason: word2.reason, until: word2.until ?? null, c, n: msg.n });
          return;
        }
        s.round += 1;
        s.seed = randomSeed();
        s.phase = o.countdownMs > 0 ? "countdown" : "playing";
        s.startsAt = this.host.now() + o.countdownMs;
        if (s.paused && s.paused.reason !== "host-change" && s.paused.reason !== "host-away") s.paused = null;
        await this.admitWaiting();
        if (o.mode === "server") await this.callRules("onStart");
        if (o.mode === "host" && o.takeover && !this.hasTimer("takeover")) {
          const hostPlayer = this.player(s.hostId);
          if (!hostPlayer || hostPlayer.status === "away") this.setTimer("takeover", o.takeoverMs);
        }
        break;
      }
      case "cancel": {
        if (this.currentPhase() !== "countdown") return fail2("not-allowed");
        s.phase = "lobby";
        s.startsAt = null;
        if (o.mode === "server") await this.callRules("onCancel");
        break;
      }
      case "data": {
        if (byteLength(JSON.stringify(msg.d ?? null)) > o.maxDataBytes) return fail2("too-large");
        s.data = msg.d ?? null;
        break;
      }
      case "successors": {
        if (o.mode !== "host") return fail2("not-allowed");
        const ids = Array.isArray(msg.ids) ? msg.ids.filter((id) => typeof id === "string").slice(0, 16) : null;
        if (!ids) return fail2("bad-request");
        s.successors = ids;
        break;
      }
      case "end":
        s.phase = "ended";
        s.startsAt = null;
        if (o.mode === "server") await this.callRules("onEnd");
        break;
      case "admit":
        await this.admitWaiting();
        break;
      case "kick": {
        const ban = msg.ban === true;
        const target = this.player(msg.id);
        const absent = target ? null : Object.entries(s.known).find(([, k]) => k.id === msg.id);
        if (!target && !absent || target?.id === player.id) return fail2("no-such-participant");
        if (ban) {
          const pkh = target ? target.pkh : absent[0];
          s.bans.push(pkh);
          s.banList ??= {};
          s.banList[pkh] = { id: msg.id, name: target ? target.name : absent[1].name ?? null, at: this.host.now() };
          if (o.banMakesPrivate !== false) {
            for (const role of Object.keys(s.keys)) s.keys[role] = { k: newSecret(), exp: null };
            s.settings.access = "private";
            for (const k of Object.values(s.known)) if (!this.player(k.id)) k.out = true;
          }
        }
        if (target) {
          for (const other of this.socketsOf(target.id)) {
            this.reject(other, ban ? CLOSE.BANNED : CLOSE.KICKED, ban ? "banned" : "kicked");
          }
          await this.removePlayer(target, ban ? "banned" : "kicked");
        } else if (ban) {
          delete s.known[absent[0]];
        } else {
          absent[1].out = true;
        }
        this.touch();
        break;
      }
      case "unban": {
        const entry = Object.entries(s.banList ?? {}).find(([, b]) => b.id === msg.id);
        if (!entry) return fail2("no-such-participant");
        s.bans = s.bans.filter((h) => h !== entry[0]);
        delete s.banList[entry[0]];
        this.touch();
        break;
      }
      case "renew": {
        if (!own(s.keys, msg.role)) return fail2("bad-role");
        const ttl = Number.isFinite(msg.ttlMs) && msg.ttlMs > 0 ? msg.ttlMs : null;
        s.keys[msg.role] = { k: newSecret(), exp: ttl === null ? null : this.host.now() + ttl };
        for (const k of Object.values(s.known)) if (k.role === msg.role && !this.player(k.id)) k.out = true;
        this.touch();
        break;
      }
      case "settings": {
        if (msg.access === "open" || msg.access === "private") s.settings.access = msg.access;
        if (o.lateJoinChoices.includes(msg.lateJoin)) s.settings.lateJoin = msg.lateJoin;
        break;
      }
      case "handover": {
        if (o.mode !== "host") return fail2("not-allowed");
        const target = this.player(msg.id);
        if (!target || !this.canHost(target)) return fail2("no-such-participant");
        if (target.id !== s.hostId && !await this.takeOver(target.id)) return fail2("no-such-participant");
        if (msg.n !== void 0) this.sendJson(ws, { t: "ok", c, n: msg.n });
        return;
      }
      case "owner": {
        const target = this.player(msg.id);
        if (!target || target.id === player.id || target.status !== "online") return fail2("no-such-participant");
        await this.giveOwner(target);
        break;
      }
      case "leave": {
        this.sendJson(ws, { t: "closed", reason: "left" });
        for (const other of this.socketsOf(player.id)) this.shut(other, CLOSE.LEFT, "left");
        if (isOwner) {
          if (o.ownerLeave === "close") {
            await this.closeRoom("owner-left");
            return;
          }
          await this.passOwner(player.id);
        }
        if (isHost) await this.saveSnapshot();
        await this.removePlayer(player, "left");
        if (this.identifiedSockets().length === 0) this.setTimer("cleanup", o.cleanupMs);
        return;
      }
      case "close":
        await this.closeRoom("closed-by-owner");
        return;
      default:
        return fail2("unknown-command");
    }
    if (msg.n !== void 0) this.sendJson(ws, { t: "ok", c, n: msg.n });
    if (this.fingerprint() === before) {
      this.penalize(ws, 2);
      return;
    }
    this.touch();
    this.broadcastRoom();
  }
};

// vendor/network-kit/server/room-core.js
var STATE_VERSION = 2;
var STATE_MIGRATIONS = {
  // 2: (state) => ({ ...state, v: 3, newField: null }),
};
var KNOWN_MAX = 100;
var USAGE_SAVE_EVERY = 500;
var USAGE_SAVE_SOON = 50;
var DEFAULT_ROLES = Object.freeze({
  player: Object.freeze({ seats: 8, plays: true }),
  viewer: Object.freeze({ seats: 4, plays: false })
});
var DEFAULT_OPTIONS = Object.freeze({
  mode: "host",
  // 'host': a participant's browser runs the game; 'server': rules run here
  roles: null,
  // name → { seats, plays, canPause, canHost, sends, sendsTo, needsKey }; null = player + viewer
  ownerRole: "player",
  // the role the room's creator joins in
  places: {},
  // named spots a playing participant can take: { name: capacity } or [names]
  access: "open",
  // default room access: 'open' (code is enough) or 'private' (key needed)
  lateJoin: "now",
  // default: 'now', 'next' (wait for the next safe point) or 'never'
  lateJoinChoices: ["now", "next", "never"],
  // what an owner may choose for this game
  pauseBy: "anyone",
  // 'anyone' (whose role may pause), 'host' (host and owner) or 'nobody'
  graceMs: 6e4,
  // how long a dropped participant keeps the seat
  autoPauseMs: null,
  // pause automatically when a playing participant has been away this long
  takeover: false,
  // host-run rooms: may another participant take over a lost host's game?
  takeoverMs: 5e3,
  // ... after waiting this long for the host
  // Host-run rooms with takeover: a host whose page has been hidden this long (a tab in
  // the background, a locked phone) hands the game to a participant whose page shows
  // (F-144, owner Q22). The room does it, since a hidden page's own timers may not run. null: never.
  handoverWhenHiddenMs: 1e4,
  hostCheckMs: 3e3,
  // how long a host has to answer when others report it silent
  heartbeatMs: null,
  // clients send a free heartbeat this often; a participant silent for
  // 2.5 heartbeats is treated as dropped (F-051). null: the client's default (20 s), no check
  closeAfterHostAwayMs: null,
  // without takeover: close the room after waiting this long
  passOwnerAfterMs: null,
  // ownership passes on when the owner has been away this long
  closeAfterOwnerAwayMs: null,
  // close the room when the owner has been away this long (F-151; e.g. a quiz whose leader is gone)
  // A second tab of the owner's browser (the owner key, while the owner's seat is in use):
  // 'join' like anyone else, 'viewer' as a viewer, or 'refuse' (F-148, for games where the
  // owner leads without playing).
  ownerSecondTab: "join",
  banMakesPrivate: true,
  // a ban renews every key and makes the room private; false: only the banned identity is refused, the code keeps working (F-149)
  ownerLeave: "close",
  // owner leaving on purpose: 'close' the room or 'pass' ownership on
  countdownMs: 3e3,
  idleCloseMs: 60 * 6e4,
  // close the room when every connected page has been hidden this long (null: never) (F-032)
  cleanupMs: 24 * 60 * 6e4,
  // delete a room this long after the last participant left
  closedKeepMs: 60 * 6e4,
  // keep a closed room's "closed" note this long
  snapshotSaveMs: 5e3,
  maxMessageBytes: 256 * 1024,
  // larger messages travel in parts (F-036)
  maxSnapshotBytes: 1024 * 1024,
  maxDataBytes: 4 * 1024,
  // the room's shared data (see the "data" command)
  maxMessagesPerSecond: 40,
  // per connection (short bursts of twice this are fine)
  // Per room and UTC day (lowered in 0.16, F-106: the old 600,000 and 720 were a
  // third of the whole account's day). A long evening of play fits well within these.
  maxMessagesPerDay: 15e4,
  maxActiveMinutesPerDay: 4 * 60,
  // minutes in which messages arrived
  // Host-run rooms: a room that keeps getting game messages while nobody else is
  // there to receive them is a script or a fault (the kit's client sends nothing
  // when alone); it closes after this long (F-098). null: never.
  closeAloneAfterMs: 5 * 6e4,
  maxPendingSockets: 8,
  // connections that have not said hello yet
  nameMaxLength: 24,
  rttProbeMs: null,
  // measure each participant's response time this often, for the rules (F-076); null: never
  rules: null
  // server mode: the game's rules (see docs/INTEGRATION.md)
});
function resolveRoles(roles) {
  const out = {};
  for (const [name, def] of Object.entries(roles ?? DEFAULT_ROLES)) {
    if (!/^[a-z][a-z0-9-]{0,23}$/.test(name)) throw new Error(`network-kit: bad role name "${name}"`);
    const merged = { ...DEFAULT_ROLES[name] ?? { seats: 1, plays: false }, ...def };
    const plays = Boolean(merged.plays);
    out[name] = {
      seats: Math.max(0, Math.floor(Number(merged.seats) || 0)),
      plays,
      canPause: Boolean(merged.canPause ?? plays),
      canHost: Boolean(merged.canHost ?? plays),
      sends: Boolean(merged.sends ?? plays),
      // Host-run rooms: 'host' (messages go to the host) or 'all' (the same
      // targets as the host: everyone, a list, a role or a place) (F-039).
      sendsTo: merged.sendsTo === "all" ? "all" : "host",
      needsKey: Boolean(merged.needsKey ?? !own(DEFAULT_ROLES, name))
    };
  }
  if (Object.keys(out).length === 0) throw new Error("network-kit: at least one role is needed");
  return out;
}
__name(resolveRoles, "resolveRoles");
function resolvePlaces(places) {
  const out = {};
  const entries = Array.isArray(places) ? places.map((name) => [name, 1]) : Object.entries(places ?? {});
  for (const [name, capacity] of entries) {
    if (typeof name !== "string" || !/^[a-z0-9][a-z0-9-]{0,23}$/i.test(name)) {
      throw new Error(`network-kit: bad place name "${name}"`);
    }
    out[name] = Math.max(1, Math.floor(Number(capacity) || 1));
  }
  return out;
}
__name(resolvePlaces, "resolvePlaces");
function resolveOptions(options = {}) {
  const merged = { ...DEFAULT_OPTIONS, ...options };
  if (!["host", "server"].includes(merged.mode)) throw new Error(`network-kit: unknown mode "${merged.mode}"`);
  if (merged.mode === "server" && !merged.rules) throw new Error("network-kit: server mode needs rules");
  merged.roles = resolveRoles(options.roles);
  merged.places = resolvePlaces(options.places);
  if (!own(merged.roles, merged.ownerRole)) {
    throw new Error(`network-kit: ownerRole "${merged.ownerRole}" is not one of the roles`);
  }
  if (options.roles?.[merged.ownerRole]?.canHost === void 0) merged.roles[merged.ownerRole].canHost = true;
  const open = Object.entries(merged.roles).filter(([, r]) => !r.needsKey);
  merged.defaultRole = (open.find(([, r]) => r.plays) ?? open[0] ?? [null])[0];
  return merged;
}
__name(resolveOptions, "resolveOptions");
function cleanName(name, max) {
  const text = String(name ?? "").replace(/[\u0000-\u001f\u007f]/g, "").replace(/\s+/g, " ").trim();
  return text.slice(0, max) || "Player";
}
__name(cleanName, "cleanName");
var utcDay = /* @__PURE__ */ __name((ms) => new Date(ms).toISOString().slice(0, 10), "utcDay");
var RoomCore = class {
  static {
    __name(this, "RoomCore");
  }
  constructor(host, options) {
    this.host = host;
    this.options = resolveOptions(options);
    this.state = null;
    this.snapshot = null;
    this.snapshotLoaded = false;
    this.snapshotDirty = false;
    this.snapshotSavedAt = 0;
    this.cancelSave = null;
    this.buckets = /* @__PURE__ */ new WeakMap();
    this.joiners = /* @__PURE__ */ new WeakMap();
    this.partSeq = 0;
    this.hostCheck = null;
    this.lastHostCheck = 0;
    this.uncounted = 0;
    this.cancelUsageSave = null;
    this.dirty = false;
    this.alarmAt = null;
    this.heard = /* @__PURE__ */ new WeakMap();
    this.lastScan = 0;
  }
  // ---------------------------------------------------------------- storage
  async load() {
    this.state = await this.host.storage.get("room") ?? null;
    if (this.state && this.state.v !== STATE_VERSION) {
      let state = this.state;
      while (state && state.v !== STATE_VERSION && STATE_MIGRATIONS[state.v]) state = STATE_MIGRATIONS[state.v](state);
      if (state?.v !== STATE_VERSION) {
        await this.deleteRoom();
        return;
      }
      this.state = state;
      await this.host.storage.put("room", this.state);
    }
    this.alarmAt = this.state ? this.nextTimerAt() : null;
  }
  async flush() {
    if (this.state && !this.state.closed) {
      this.syncHostPause();
      this.checkIdle();
      if (this.identifiedSockets().length === 0 && !this.hasTimer("cleanup")) {
        this.setTimer("cleanup", this.options.cleanupMs);
      }
    }
    if (this.dirty && this.state) {
      this.uncounted = 0;
      this.dirty = false;
      await this.host.storage.put("room", this.state);
    }
    const next = this.state ? this.nextTimerAt() : null;
    if (next !== this.alarmAt) {
      this.alarmAt = next;
      await this.host.setAlarm(next);
    }
  }
  touch() {
    this.dirty = true;
  }
  // The snapshot is stored as text in parts (F-036), so a large game state
  // never meets the platform's limit on one stored value:
  //   snapshot      { at, parts }      snapshot:0 … snapshot:N-1  text parts
  async getSnapshot() {
    if (!this.snapshotLoaded) {
      const record = await this.host.storage.get("snapshot") ?? null;
      if (record && "d" in record) {
        this.snapshot = record;
      } else if (record) {
        const texts = [];
        for (let i = 0; i < record.parts; i++) texts.push(await this.host.storage.get(`snapshot:${i}`) ?? "");
        try {
          this.snapshot = { d: JSON.parse(texts.join("")), at: record.at };
        } catch {
          this.snapshot = null;
        }
      }
      this.storedParts = record?.parts ?? 0;
      this.snapshotLoaded = true;
    }
    return this.snapshot;
  }
  async saveSnapshot() {
    this.cancelSave?.();
    this.cancelSave = null;
    if (!this.snapshotDirty || !this.snapshot || !this.state) return;
    this.snapshotDirty = false;
    this.snapshotSavedAt = this.host.now();
    const text = JSON.stringify(this.snapshot.d) ?? "null";
    const parts = Math.max(1, Math.ceil(text.length / PART_CHARS));
    for (let i = 0; i < parts; i++) {
      await this.host.storage.put(`snapshot:${i}`, text.slice(i * PART_CHARS, (i + 1) * PART_CHARS));
    }
    await this.host.storage.put("snapshot", { at: this.snapshot.at, parts });
    for (let i = parts; i < (this.storedParts ?? 0); i++) await this.host.storage.delete(`snapshot:${i}`);
    this.storedParts = parts;
  }
  // The rules' own store (F-147): large values that seldom change, such as a quiz's
  // question bank, kept apart from room.game so they are not written again at every
  // change. Stored in parts like the snapshot:
  //   store:<key>   { parts }   store:<key>:0 … text parts
  async storeValue(key, value) {
    const name = String(key);
    if (!/^[A-Za-z0-9_-]{1,40}$/.test(name)) throw new Error("room.store: the key must be 1 to 40 letters, digits, - or _");
    this.storedValues ??= /* @__PURE__ */ new Map();
    const text = JSON.stringify(value ?? null);
    if (byteLength(text) > this.options.maxSnapshotBytes) throw new Error("room.store: the value is larger than maxSnapshotBytes");
    const known = this.storedValues.has(name) || await this.host.storage.get(`store:${name}`);
    if (!known && (this.storeKeys ??= await this.countStoreKeys()) >= 20) throw new Error("room.store: at most 20 keys");
    const old = (await this.host.storage.get(`store:${name}`))?.parts ?? 0;
    const parts = Math.max(1, Math.ceil(text.length / PART_CHARS));
    for (let i = 0; i < parts; i++) await this.host.storage.put(`store:${name}:${i}`, text.slice(i * PART_CHARS, (i + 1) * PART_CHARS));
    await this.host.storage.put(`store:${name}`, { parts });
    for (let i = parts; i < old; i++) await this.host.storage.delete(`store:${name}:${i}`);
    if (!known) this.storeKeys = (this.storeKeys ?? 0) + 1;
    this.storedValues.set(name, structuredClone(value ?? null));
  }
  async storedValue(key) {
    const name = String(key);
    this.storedValues ??= /* @__PURE__ */ new Map();
    if (!this.storedValues.has(name)) {
      const record = await this.host.storage.get(`store:${name}`);
      if (!record) return void 0;
      const texts = [];
      for (let i = 0; i < record.parts; i++) texts.push(await this.host.storage.get(`store:${name}:${i}`) ?? "");
      this.storedValues.set(name, JSON.parse(texts.join("") || "null"));
    }
    return structuredClone(this.storedValues.get(name));
  }
  async unstoreValue(key) {
    const name = String(key);
    const record = await this.host.storage.get(`store:${name}`);
    if (!record) return;
    for (let i = 0; i < record.parts; i++) await this.host.storage.delete(`store:${name}:${i}`);
    await this.host.storage.delete(`store:${name}`);
    this.storedValues?.delete(name);
    if (this.storeKeys) this.storeKeys -= 1;
  }
  async countStoreKeys() {
    const listed = await this.host.storage.list?.({ prefix: "store:" });
    if (!listed) return 0;
    return [...listed.keys()].filter((k) => !/:\d+$/.test(k.slice("store:".length))).length;
  }
  // State for newcomers (F-030): set by the host (or the rules), one shared and
  // optionally one per role, kept by the room and sent to everyone who joins
  // or comes back, right after the welcome. Stored in parts like the snapshot:
  //   welcome:<role|*>   { at, parts }   welcome:<role|*>:0 … text parts
  async getWelcomeState(role) {
    this.welcomeStates ??= /* @__PURE__ */ new Map();
    if (!this.welcomeStates.has(role)) {
      const record = await this.host.storage.get(`welcome:${role}`) ?? null;
      let d;
      if (record) {
        const texts = [];
        for (let i = 0; i < record.parts; i++) texts.push(await this.host.storage.get(`welcome:${role}:${i}`) ?? "");
        try {
          d = JSON.parse(texts.join(""));
        } catch {
          d = void 0;
        }
      }
      this.welcomeStates.set(role, { d, parts: record?.parts ?? 0, dirty: false });
    }
    return this.welcomeStates.get(role);
  }
  async setWelcomeState(role, d) {
    const entry = await this.getWelcomeState(role);
    entry.d = d === null ? void 0 : d;
    entry.dirty = true;
    const wait = (this.welcomeSavedAt ?? 0) + this.options.snapshotSaveMs - this.host.now();
    if (wait <= 0) await this.saveWelcomeStates();
    else this.cancelWelcomeSave ??= this.host.defer(wait, () => this.saveWelcomeStates());
  }
  async saveWelcomeStates() {
    this.cancelWelcomeSave?.();
    this.cancelWelcomeSave = null;
    if (!this.state || !this.welcomeStates) return;
    this.welcomeSavedAt = this.host.now();
    for (const [role, entry] of this.welcomeStates) {
      if (!entry.dirty) continue;
      entry.dirty = false;
      if (entry.d === void 0) {
        await this.host.storage.delete(`welcome:${role}`);
        for (let i = 0; i < entry.parts; i++) await this.host.storage.delete(`welcome:${role}:${i}`);
        entry.parts = 0;
        continue;
      }
      const text = JSON.stringify(entry.d);
      const parts = Math.max(1, Math.ceil(text.length / PART_CHARS));
      for (let i = 0; i < parts; i++) await this.host.storage.put(`welcome:${role}:${i}`, text.slice(i * PART_CHARS, (i + 1) * PART_CHARS));
      await this.host.storage.put(`welcome:${role}`, { at: this.host.now(), parts });
      for (let i = parts; i < entry.parts; i++) await this.host.storage.delete(`welcome:${role}:${i}`);
      entry.parts = parts;
    }
  }
  /** Send a participant the state for newcomers that fits their role, if there is one. */
  async sendWelcomeState(ws, p) {
    const forRole = await this.getWelcomeState(p.role);
    const entry = forRole.d !== void 0 ? forRole : await this.getWelcomeState("*");
    if (entry.d !== void 0) this.sendJson(ws, { t: "welcome-state", d: entry.d });
  }
  async dropWelcomeStates() {
    for (const role of [...Object.keys(this.options.roles), "*"]) {
      const entry = await this.getWelcomeState(role);
      if (entry.d === void 0 && entry.parts === 0) continue;
      entry.d = void 0;
      entry.dirty = true;
    }
    await this.saveWelcomeStates();
  }
  async dropSnapshot() {
    this.cancelSave?.();
    this.cancelSave = null;
    if (!this.snapshotLoaded) await this.getSnapshot();
    this.snapshot = null;
    this.snapshotLoaded = true;
    this.snapshotDirty = false;
    await this.host.storage.delete("snapshot");
    for (let i = 0; i < (this.storedParts ?? 0); i++) await this.host.storage.delete(`snapshot:${i}`);
    this.storedParts = 0;
  }
  // ----------------------------------------------------------------- timers
  nextTimerAt() {
    let next = null;
    for (const t of this.state.timers) if (next === null || t.at < next) next = t.at;
    return next;
  }
  hasTimer(kind) {
    return this.state.timers.some((t) => t.kind === kind);
  }
  /** Set a timer; replaces one of the same kind (and the same key, if it has one). */
  setTimer(kind, delayMs, key = null) {
    this.clearTimer(kind, key);
    this.state.timers.push({ kind, key, at: this.host.now() + delayMs });
    this.touch();
  }
  /** Clear timers of a kind; `key` null clears every timer of that kind. */
  clearTimer(kind, key = null) {
    const before = this.state.timers.length;
    this.state.timers = this.state.timers.filter((t) => !(t.kind === kind && (key === null || t.key === key)));
    if (this.state.timers.length !== before) this.touch();
  }
  async alarm() {
    if (!this.state) return;
    const now = this.host.now();
    const due = this.state.timers.filter((t) => t.at <= now);
    this.state.timers = this.state.timers.filter((t) => t.at > now);
    this.alarmAt = null;
    this.touch();
    if (this.state.closed) {
      if (due.some((t) => t.kind === "cleanup")) await this.deleteRoom();
    } else {
      await this.findSilent();
      await this.checkStopped();
      for (const timer of due) {
        if (!this.state || this.state.closed) break;
        await this.runTimer(timer);
      }
    }
    if (this.state) await this.flush();
  }
  async runTimer(timer) {
    const s = this.state;
    switch (timer.kind) {
      case "grace": {
        const p = this.player(timer.key);
        if (p && p.status === "away") await this.removePlayer(p, "gone");
        break;
      }
      case "autopause": {
        const p = this.player(timer.key);
        if (p && p.status === "away" && !s.paused && this.inGame()) {
          s.paused = { reason: "player-away", id: p.id, at: this.host.now() };
          this.broadcastRoom();
        }
        break;
      }
      case "takeover": {
        const hostPlayer = this.player(s.hostId);
        if (!hostPlayer || hostPlayer.status === "away") await this.takeOver();
        break;
      }
      case "hiddenhost": {
        const hostPlayer = this.player(s.hostId);
        const next = hostPlayer?.hidden === true && hostPlayer.status === "online" && this.visibleSuccessor();
        if (next) await this.takeOver(next.id);
        break;
      }
      case "hostaway": {
        const hostPlayer = this.player(s.hostId);
        if (!hostPlayer || hostPlayer.status === "away") await this.closeRoom("host-away");
        break;
      }
      case "owneraway": {
        const owner = this.player(s.ownerId);
        if (!owner || owner.status === "away") await this.closeRoom("owner-away");
        break;
      }
      case "ownerpass": {
        const owner = this.player(s.ownerId);
        if (!owner || owner.status === "away") await this.passOwner();
        break;
      }
      case "idle": {
        if (this.everyoneHidden()) await this.closeRoom("idle");
        break;
      }
      case "cleanup": {
        if (this.identifiedSockets().length === 0) await this.deleteRoom();
        break;
      }
      case "lobby-end": {
        await this.closeRoom("lobby-ended");
        break;
      }
      case "rules": {
        await this.callRules("onTimer", timer.key);
        break;
      }
    }
  }
  /** True when someone is connected and every connected page is hidden. */
  everyoneHidden() {
    const online = Object.values(this.state.players).filter((p) => p.status === "online");
    return online.length > 0 && online.every((p) => p.hidden === true);
  }
  /** A room whose pages are all hidden (forgotten tabs) closes after idleCloseMs (F-032). */
  checkIdle() {
    if (!this.options.idleCloseMs) return;
    if (this.everyoneHidden()) {
      if (!this.hasTimer("idle")) this.setTimer("idle", this.options.idleCloseMs);
    } else if (this.hasTimer("idle")) {
      this.clearTimer("idle");
    }
  }
  // ------------------------------------------------------------------ rooms
  /**
   * Create the room. `open`: created by the game's server for an invitation,
   * without a participating creator: the first participant who may lead
   * becomes owner (and host) (F-029).
   */
  async create(settings = {}, code, { open = false, pass = null, lobbyEnds = null } = {}) {
    if (this.state && !this.state.closed) return { error: "exists" };
    const o = this.options;
    const access = settings?.access === "private" || settings?.access === "open" ? settings.access : o.access;
    const lateJoin = o.lateJoinChoices.includes(settings?.lateJoin) ? settings.lateJoin : o.lateJoin;
    const now = this.host.now();
    const keys = {};
    for (const role of Object.keys(o.roles)) keys[role] = { k: newSecret(), exp: null };
    this.state = {
      v: STATE_VERSION,
      code,
      createdAt: now,
      closed: null,
      settings: { access, lateJoin },
      ownerKey: newSecret(),
      ownerId: null,
      ownerOpen: Boolean(open),
      // true: ownership is free for the next eligible participant
      hostId: null,
      hostEver: false,
      hostPending: o.mode === "host",
      // the host has not confirmed that it runs the game
      keys,
      phase: "lobby",
      round: 0,
      seed: null,
      startsAt: null,
      paused: null,
      players: {},
      known: {},
      // player-key hash → { id, sid, lastN, role, admitted, at }
      bans: [],
      // player-key hashes that may not come back
      banList: {},
      // hash → { id, name, at }: who was banned, for the owner's list (F-031)
      timers: [],
      usage: { day: utcDay(now), n: 0 },
      data: null,
      // small shared data set by the host, the owner or the rules; everyone sees it
      game: null
    };
    if (typeof pass === "string" && pass && Number.isFinite(lobbyEnds) && lobbyEnds > now) {
      this.state.pass = pass.slice(0, 100);
      this.state.lobbyEnds = lobbyEnds;
    }
    await this.dropSnapshot();
    await this.dropWelcomeStates();
    this.setTimer("cleanup", o.cleanupMs);
    if (this.state.lobbyEnds) this.setTimer("lobby-end", this.state.lobbyEnds - now);
    if (o.mode === "server") this.state.game = await this.callRules("init") ?? null;
    this.touch();
    await this.flush();
    if (open) return { code, keys: this.publicKeys() };
    return { code, ownerKey: this.state.ownerKey, keys: this.publicKeys() };
  }
  info() {
    if (!this.state) return null;
    const counts = {};
    for (const role of Object.keys(this.options.roles)) counts[role] = 0;
    for (const p of Object.values(this.state.players)) counts[p.role] = (counts[p.role] ?? 0) + 1;
    return {
      code: this.state.code,
      closed: Boolean(this.state.closed),
      phase: this.currentPhase(),
      access: this.state.settings.access,
      participants: counts
    };
  }
  currentPhase() {
    const s = this.state;
    if (s.phase === "countdown" && s.startsAt !== null && this.host.now() >= s.startsAt) s.phase = "playing";
    return s.phase;
  }
  inGame() {
    const phase = this.currentPhase();
    return phase === "countdown" || phase === "playing";
  }
  publicKeys() {
    const out = {};
    for (const [role, key] of Object.entries(this.state.keys)) out[role] = { ...key };
    return out;
  }
  async closeRoom(reason, code = CLOSE.ROOM_CLOSED) {
    const s = this.state;
    s.closed = { reason, at: this.host.now() };
    s.timers = [];
    this.cancelHostCheck();
    this.touch();
    const text = JSON.stringify({ t: "closed", reason });
    for (const ws of this.liveSockets()) {
      this.host.send(ws, text);
      this.shut(ws, code, reason);
    }
    await this.dropSnapshot();
    this.setTimer("cleanup", this.options.closedKeepMs);
  }
  async deleteRoom() {
    for (const ws of this.liveSockets()) this.shut(ws, CLOSE.ROOM_CLOSED, "expired");
    this.cancelHostCheck();
    this.cancelUsageSave?.();
    this.cancelUsageSave = null;
    this.cancelSave?.();
    this.cancelSave = null;
    this.state = null;
    this.welcomeStates = null;
    this.storedValues = null;
    this.storeKeys = null;
    this.cancelWelcomeSave?.();
    this.cancelWelcomeSave = null;
    this.snapshot = null;
    this.snapshotLoaded = true;
    this.snapshotDirty = false;
    this.dirty = false;
    this.alarmAt = null;
    await this.host.storage.deleteAll();
    await this.host.setAlarm(null);
  }
  // ---------------------------------------------------------------- sockets
  liveSockets() {
    return this.host.sockets().filter((ws) => {
      const att = this.host.getAttachment(ws);
      return att && !att.closed;
    });
  }
  identifiedSockets() {
    return this.liveSockets().filter((ws) => this.host.getAttachment(ws).id);
  }
  socketsOf(id) {
    return this.liveSockets().filter((ws) => this.host.getAttachment(ws).id === id);
  }
  player(id) {
    return own(this.state.players, id) ? this.state.players[id] : null;
  }
  role(p) {
    return this.options.roles[p.role] ?? { seats: 0, plays: false, canPause: false, canHost: false, sends: false };
  }
  /** Send a text, in parts if it is large (F-036). */
  deliver(ws, text) {
    if (text.length <= PART_CHARS) {
      this.host.send(ws, text);
      return;
    }
    this.partSeq += 1;
    for (const part of splitIntoParts(text, this.partSeq)) this.host.send(ws, part);
  }
  sendTo(id, text) {
    for (const ws of this.socketsOf(id)) this.deliver(ws, text);
  }
  sendJson(ws, msg) {
    this.deliver(ws, JSON.stringify(msg));
  }
  /** Close a socket from our side and remember that it no longer counts. */
  shut(ws, code, reason) {
    this.host.setAttachment(ws, { ...this.host.getAttachment(ws) || {}, closed: true });
    this.host.close(ws, code, reason);
  }
  reject(ws, code, reason, extra = {}) {
    this.sendJson(ws, { t: "denied", code, reason, ...extra });
    this.shut(ws, code, reason);
  }
  /** A new WebSocket was accepted; it must send "hello" first. */
  opened(ws) {
    this.host.setAttachment(ws, { id: null, n: 0, at: this.host.now() });
    if (!this.state || this.state.closed) {
      const closed = this.state?.closed;
      if (closed) this.sendJson(ws, { t: "closed", reason: closed.reason });
      this.shut(ws, closed ? CLOSE.ROOM_CLOSED : CLOSE.NOT_FOUND, closed ? closed.reason : "not-found");
      return;
    }
    const pending2 = this.liveSockets().filter((other) => !this.host.getAttachment(other).id).sort((a, b) => this.host.getAttachment(a).at - this.host.getAttachment(b).at);
    while (pending2.length > this.options.maxPendingSockets) {
      this.shut(pending2.shift(), CLOSE.BAD_REQUEST, "too-many-connections");
    }
  }
  /**
   * Participants whose connection died without closing (wifi gone, phone in a
   * tunnel) are found by their heartbeat (F-051): a socket that has sent
   * nothing, not even a heartbeat, for 2.5 heartbeats is closed as
   * unresponsive and the participant counts as dropped. Checked at most once a
   * second while messages arrive, and when a timer fires: it costs nothing extra.
   */
  async findSilent() {
    const beat = this.options.heartbeatMs;
    if (!beat || !this.state || this.state.closed) return;
    const now = this.host.now();
    if (now - this.lastScan < 1e3) return;
    this.lastScan = now;
    const limit = beat * 2.5;
    for (const ws of this.identifiedSockets()) {
      const att = this.host.getAttachment(ws);
      const heard = Math.max(att.at ?? 0, this.heard.get(ws) ?? 0, this.host.lastPingAt?.(ws) ?? 0);
      if (now - heard <= limit) continue;
      this.shut(ws, CLOSE_UNRESPONSIVE, "unresponsive");
      await this.closed(ws, true);
      if (!this.state || this.state.closed) return;
    }
  }
  /** Per-connection rate limit; false when the connection sends too fast. */
  allow(ws) {
    const rate = this.options.maxMessagesPerSecond;
    if (!rate) return true;
    const now = this.host.now();
    let bucket = this.buckets.get(ws);
    if (!bucket) {
      bucket = { tokens: rate * 2, at: now };
      this.buckets.set(ws, bucket);
    }
    bucket.tokens = Math.min(rate * 2, bucket.tokens + (now - bucket.at) / 1e3 * rate);
    bucket.at = now;
    if (bucket.tokens < 1) return false;
    bucket.tokens -= 1;
    return true;
  }
  /**
   * Messages that are refused or ignored cost the connection extra, so that
   * sending them in bulk closes that connection instead of using up the room.
   */
  penalize(ws, cost) {
    const bucket = this.buckets.get(ws);
    if (bucket) bucket.tokens -= cost;
  }
  /** Count a message against the room's daily budget; false when it is used up. */
  count() {
    const s = this.state;
    const o = this.options;
    const now = this.host.now();
    const day = utcDay(now);
    if (s.usage.day !== day) s.usage = { day, n: 0, minutes: 0, minute: 0 };
    s.usage.n += 1;
    const minute = Math.floor(now / 6e4);
    if (s.usage.minute !== minute) {
      s.usage.minute = minute;
      s.usage.minutes = (s.usage.minutes ?? 0) + 1;
    }
    this.uncounted += 1;
    if (this.uncounted >= USAGE_SAVE_EVERY) {
      this.touch();
    } else if (this.uncounted >= USAGE_SAVE_SOON && !this.cancelUsageSave) {
      this.cancelUsageSave = this.host.defer(1e4, async () => {
        this.cancelUsageSave = null;
        if (!this.state || this.uncounted === 0) return;
        this.touch();
        await this.flush();
      });
    }
    if (o.maxMessagesPerDay && s.usage.n > o.maxMessagesPerDay) return false;
    if (o.maxActiveMinutesPerDay && s.usage.minutes > o.maxActiveMinutesPerDay) return false;
    return true;
  }
  /** May this participant's game messages reach the host or the rules? */
  maySend(p) {
    return p.id === this.state.hostId || !p.waiting && this.role(p).sends;
  }
  async message(ws, raw, joined = false) {
    if (!this.state || this.state.closed) return;
    const att = this.host.getAttachment(ws);
    if (!att || att.closed) return;
    this.heard.set(ws, this.host.now());
    await this.findSilent();
    await this.checkStopped();
    if (!this.state || this.state.closed) return;
    const size = byteLength(raw);
    let msg = null;
    if (size <= this.options.maxSnapshotBytes) {
      try {
        msg = JSON.parse(typeof raw === "string" ? raw : new TextDecoder().decode(raw));
      } catch {
        msg = null;
      }
    }
    const valid = msg !== null && typeof msg === "object" && !Array.isArray(msg);
    if (!att.id) {
      if (!valid || msg.t !== "hello") return this.reject(ws, CLOSE.BAD_REQUEST, "hello-first");
      await this.hello(ws, msg);
      if (this.state) await this.flush();
      return;
    }
    if (!joined && !this.allow(ws)) {
      this.reject(ws, CLOSE.RATE, "too-many-messages");
      await this.closed(ws, true);
      return;
    }
    if (valid && msg.t === "part" && !joined) {
      let joiner = this.joiners.get(ws);
      if (!joiner) {
        joiner = new PartJoiner(this.options.maxSnapshotBytes);
        this.joiners.set(ws, joiner);
      }
      let text;
      try {
        text = joiner.add(msg);
      } catch (err) {
        this.penalize(ws, 5);
        return this.sendJson(ws, { t: "err", code: err.message === "too large" ? "too-large" : "bad-part" });
      }
      if (text !== null) await this.message(ws, text, true);
      return;
    }
    if (!valid) {
      this.penalize(ws, 5);
      return this.sendJson(ws, { t: "err", code: size > this.options.maxSnapshotBytes ? "too-large" : "bad-json" });
    }
    const player = this.player(att.id);
    if (!player) return this.reject(ws, CLOSE.KICKED, "not-in-room");
    if (msg.n !== void 0) {
      if (!Number.isSafeInteger(msg.n) || msg.n <= att.n) return;
      att.n = msg.n;
      player.lastN = msg.n;
      this.host.setAttachment(ws, att);
    }
    if (this.hostCheck && player.id === this.hostCheck.id) this.cancelHostCheck();
    if (msg.t === "probe") {
      this.probed(player.id, msg.n);
      return;
    }
    this.probe(ws, player.id);
    const isSnap = msg.t === "snap" && this.options.mode === "host" && player.id === this.state.hostId;
    const isWelcomeState = msg.t === "welcome-state" && this.options.mode === "host" && player.id === this.state.hostId;
    if (msg.t === "msg" && size > this.options.maxMessageBytes) {
      this.penalize(ws, 5);
      this.sendJson(ws, { t: "err", code: "too-large", n: msg.n });
    } else if (msg.t === "msg" && this.maySend(player) || isSnap || isWelcomeState || msg.t === "cmd") {
      if (!this.count()) {
        await this.closeRoom("room-budget", CLOSE.BUDGET);
        await this.flush();
        return;
      }
      if (msg.t === "msg" && await this.aloneTooLong(player)) return;
      if (msg.t === "msg") await this.relay(player, msg);
      else if (isSnap) await this.storeSnapshot(player, msg);
      else if (isWelcomeState) {
        const role = typeof msg.role === "string" && own(this.options.roles, msg.role) ? msg.role : "*";
        await this.setWelcomeState(role, msg.d ?? null);
      } else await this.command(ws, player, msg);
    } else {
      this.penalize(ws, 10);
    }
    if (this.state) await this.flush();
  }
  /** A socket closed (or was closed by us with `force`). */
  async closed(ws, force = false) {
    const att = this.host.getAttachment(ws);
    if (!att || att.closed && !force) return;
    att.closed = true;
    this.host.setAttachment(ws, att);
    if (!this.state || this.state.closed || !att.id) return;
    const p = this.player(att.id);
    if (p && att.sid === p.sid && att.n > p.lastN) {
      p.lastN = att.n;
      this.touch();
    }
    if (p && this.socketsOf(p.id).length === 0) await this.dropped(p);
    if (this.state && this.identifiedSockets().length === 0) this.setTimer("cleanup", this.options.cleanupMs);
    if (this.state) await this.flush();
  }
  // ------------------------------------------------------------------ hello
  async hello(ws, msg) {
    const s = this.state;
    const o = this.options;
    if (msg.v !== PROTOCOL) return this.reject(ws, CLOSE.VERSION, "version");
    if (typeof msg.pk !== "string" || msg.pk.length < 16 || msg.pk.length > 128) {
      return this.reject(ws, CLOSE.BAD_REQUEST, "player-key");
    }
    if (typeof msg.sid !== "string" || msg.sid.length < 1 || msg.sid.length > 64) {
      return this.reject(ws, CLOSE.BAD_REQUEST, "session");
    }
    const pkh = await sha256(msg.pk);
    if (s.bans.includes(pkh)) return this.reject(ws, CLOSE.BANNED, "banned");
    const now = this.host.now();
    const name = cleanName(msg.name, o.nameMaxLength);
    const known = own(s.known, pkh) ? s.known[pkh] : null;
    let player = known ? this.player(known.id) : null;
    const ownerSeat = this.player(s.ownerId);
    const isOwner = sameSecret(msg.owner, s.ownerKey) && (!ownerSeat || ownerSeat === player || ownerSeat.status === "away");
    if (isOwner && ownerSeat && !player) {
      delete s.known[ownerSeat.pkh];
      ownerSeat.pkh = pkh;
      ownerSeat.sid = null;
      player = ownerSeat;
    }
    const oldOwnerSeat = isOwner && ownerSeat && ownerSeat !== player ? ownerSeat : null;
    const isNew = !player;
    let returning = false;
    let reloaded = false;
    if (isNew && s.lobbyEnds && !await this.checkLobby()) return this.reject(ws, CLOSE.ROOM_CLOSED, "lobby-ended");
    if (isNew) {
      const standing = known && !known.out && own(o.roles, known.role) ? known : null;
      const word2 = !isOwner && !standing ? await this.admission() : null;
      const closed = word2 && !word2.open;
      const admin = closed && !word2.stopped && await this.isAdminPass(msg.adminPass);
      const invited = closed && !admin && !word2.stopped && s.pass && this.validKey(msg.key, now) && await this.isAdminPass(s.pass, { lobby: true });
      if (closed && !admin && !invited) return this.reject(ws, CLOSE.GAME_CLOSED, word2.reason ?? "off", { until: word2.until ?? null });
      let role = null;
      let admitted = false;
      const secondTab = !isOwner && typeof msg.owner === "string" && sameSecret(msg.owner, s.ownerKey);
      if (secondTab && o.ownerSecondTab === "refuse") return this.reject(ws, CLOSE.REPLACED, "owner-elsewhere");
      if (isOwner) {
        role = o.ownerRole;
        admitted = true;
      } else if (secondTab && o.ownerSecondTab === "viewer" && own(o.roles, "viewer")) {
        role = "viewer";
      } else {
        let expired = false;
        for (const [keyRole, key] of Object.entries(s.keys)) {
          if (!sameSecret(msg.key, key.k)) continue;
          if (key.exp !== null && key.exp <= now) expired = true;
          else role = keyRole;
        }
        const open = s.settings.access === "open";
        const wanted = own(o.roles, msg.role) ? msg.role : null;
        const asked = open && wanted && !o.roles[wanted].needsKey ? wanted : null;
        if (!role && standing) role = asked ?? standing.role;
        if (!role && expired) return this.reject(ws, CLOSE.KEY, "key-expired");
        if (!role) {
          if (!open) {
            return this.reject(ws, CLOSE.KEY, typeof msg.key === "string" && msg.key ? "key-invalid" : "key-required");
          }
          if (wanted && o.roles[wanted].needsKey) return this.reject(ws, CLOSE.KEY, "key-required");
          role = asked ?? o.defaultRole;
          if (!role) return this.reject(ws, CLOSE.KEY, "key-required");
        }
        admitted = Boolean(standing && standing.role === role && standing.admitted && standing.round === s.round);
      }
      const def = o.roles[role];
      const taken = Object.values(s.players).filter((p) => p.role === role).length;
      if (!isOwner && taken >= def.seats) return this.reject(ws, CLOSE.FULL, "full");
      let waiting = false;
      if (def.plays && this.inGame() && !admitted) {
        if (s.settings.lateJoin === "never") return this.reject(ws, CLOSE.IN_PROGRESS, "in-progress");
        waiting = s.settings.lateJoin === "next";
      }
      let id = known?.id;
      const usedIds = new Set(Object.values(s.known).map((k) => k.id));
      if (!id || this.player(id)) {
        do
          id = newPlayerId();
        while (this.player(id) || usedIds.has(id));
      }
      player = {
        id,
        pkh,
        name,
        role,
        waiting,
        status: "online",
        place: null,
        joinedAt: now,
        awaySince: null,
        sid: msg.sid,
        lastN: known && known.sid === msg.sid ? known.lastN : 0
      };
      returning = Boolean(standing && standing.id === id && standing.role === role);
      const place = returning && !waiting ? standing.place : null;
      if (place && own(o.places, place) && Object.values(s.players).filter((p) => p.place === place).length < o.places[place]) {
        player.place = place;
      }
      s.players[id] = player;
    } else {
      let lastN = player.lastN;
      for (const other of this.socketsOf(player.id)) {
        if (other === ws) continue;
        const oatt = this.host.getAttachment(other);
        if (oatt.sid === player.sid && oatt.n > lastN) lastN = oatt.n;
        this.shut(other, CLOSE.REPLACED, "replaced");
      }
      player.status = "online";
      player.awaySince = null;
      player.name = name;
      if (player.sid === msg.sid) {
        player.lastN = lastN;
      } else {
        player.sid = msg.sid;
        player.lastN = 0;
        reloaded = true;
      }
      this.clearTimer("grace", player.id);
      this.clearTimer("autopause", player.id);
    }
    player.hidden = msg.hidden === true;
    if (typeof msg.adminPass === "string") {
      const pass = msg.adminPass.slice(0, 100);
      (this.adminPasses ??= /* @__PURE__ */ new WeakMap()).set(ws, pass);
      if ((isOwner || player.id === s.ownerId) && !s.lobbyEnds && s.pass !== pass && await this.isAdminPass(pass)) s.pass = pass;
    }
    this.remember(player);
    this.host.setAttachment(ws, { id: player.id, n: player.lastN, sid: player.sid, at: now });
    this.clearTimer("cleanup");
    this.touch();
    if (isOwner) {
      if (oldOwnerSeat && s.hostId === oldOwnerSeat.id) {
        s.hostId = player.id;
        s.hostPending = true;
      }
      s.ownerId = player.id;
      s.ownerOpen = false;
      this.clearTimer("owneraway");
    } else if (s.ownerOpen && !this.player(s.ownerId) && this.canLead(player)) {
      await this.giveOwner(player, true);
    } else if (player.id === s.ownerId) {
      this.sendJson(ws, { t: "owner", key: s.ownerKey });
    }
    if (player.id === s.ownerId) {
      this.clearTimer("ownerpass");
      this.clearTimer("owneraway");
    }
    if (o.mode === "server") s.hostId = s.ownerId;
    let tookOver = false;
    if (o.mode === "host") {
      const hostPlayer = this.player(s.hostId);
      if (!hostPlayer && player.id === s.ownerId) {
        s.hostId = player.id;
        s.hostEver = true;
        s.hostPending = true;
      } else if (o.takeover && s.hostEver && this.inGame() && this.canHost(player) && !this.hasTimer("takeover") && (!hostPlayer || hostPlayer.status === "away")) {
        tookOver = true;
      } else if (player.id === s.ownerId && hostPlayer && hostPlayer.id !== player.id && !this.inGame() && this.canHost(player)) {
        tookOver = true;
      }
      if (player.id === s.hostId) {
        this.clearTimer("takeover");
        this.clearTimer("hostaway");
        if (reloaded) s.hostPending = true;
        if (s.paused?.reason === "host-away") {
          if (s.hostPending) s.paused = { ...s.paused, reason: "host-change" };
          else s.paused = null;
        }
      }
    }
    this.liftAutoPause();
    this.sendJson(ws, {
      t: "welcome",
      you: { id: player.id, role: player.role },
      lastN: player.lastN,
      room: this.view(player.id)
    });
    await this.sendWelcomeState(ws, player);
    if (tookOver) {
      await this.takeOver(player.id);
    } else {
      this.broadcastRoom();
      if (o.mode === "host" && player.id === s.hostId && s.hostPending) await this.sendHost(player.id);
    }
    const about = { name: player.name, ...returning ? { returning: true } : {} };
    if (isNew) this.event(player.waiting ? "waiting" : "join", player.id, about);
    else this.event("back", player.id, about);
    if (oldOwnerSeat) await this.removePlayer(oldOwnerSeat, "moved");
    this.watchHiddenHost();
    if (o.mode === "server") {
      if (isNew && !player.waiting) await this.callRules("onJoin", this.rulesPlayer(player));
      if (!isNew) await this.callRules("onBack", this.rulesPlayer(player));
    }
  }
  /** Remember a participant so they can return after the grace period. */
  remember(p) {
    const s = this.state;
    s.known[p.pkh] = {
      id: p.id,
      sid: p.sid,
      lastN: p.lastN,
      role: p.role,
      place: p.place ?? null,
      name: p.name,
      admitted: !p.waiting,
      round: s.round,
      at: this.host.now()
    };
    const entries = Object.entries(s.known);
    if (entries.length > KNOWN_MAX) {
      entries.sort((a, b) => a[1].at - b[1].at);
      for (const [key, value] of entries) {
        if (Object.keys(s.known).length <= KNOWN_MAX) break;
        if (!this.player(value.id)) delete s.known[key];
      }
    }
  }
  canHost(p) {
    return Boolean(p) && this.role(p).canHost && !p.waiting && p.status === "online";
  }
  /** A participant who could run the game and whose page shows, or null (F-144). */
  visibleSuccessor() {
    const s = this.state;
    return Object.values(s.players).find((p) => p.id !== s.hostId && this.canHost(p) && p.hidden !== true) ?? null;
  }
  /**
   * After a page shows or hides (F-144): when the host's page is hidden and someone
   * else's shows, the host hands over after handoverWhenHiddenMs; when it shows again, not.
   */
  watchHiddenHost() {
    const o = this.options;
    const s = this.state;
    if (o.mode !== "host" || !o.takeover || !o.handoverWhenHiddenMs) return;
    const hostPlayer = this.player(s.hostId);
    if (hostPlayer?.hidden === true && hostPlayer.status === "online" && this.visibleSuccessor()) {
      if (!this.hasTimer("hiddenhost")) this.setTimer("hiddenhost", o.handoverWhenHiddenMs);
    } else {
      this.clearTimer("hiddenhost");
    }
  }
  /** May this participant receive ownership when it is passed on? */
  canLead(p) {
    return this.canHost(p);
  }
  async dropped(p) {
    const s = this.state;
    const o = this.options;
    if (p.status === "away") return;
    p.status = "away";
    p.awaySince = this.host.now();
    this.remember(p);
    this.setTimer("grace", o.graceMs, p.id);
    if (o.autoPauseMs !== null && this.role(p).plays && !p.waiting && this.inGame()) {
      this.setTimer("autopause", o.autoPauseMs, p.id);
    }
    if (p.id === s.ownerId && o.passOwnerAfterMs !== null) this.setTimer("ownerpass", o.passOwnerAfterMs);
    if (p.id === s.ownerId && o.closeAfterOwnerAwayMs !== null && !this.hasTimer("owneraway")) this.setTimer("owneraway", o.closeAfterOwnerAwayMs);
    if (o.mode === "host" && p.id === s.hostId) {
      await this.saveSnapshot();
      this.cancelHostCheck();
      if (this.inGame() && !s.paused) s.paused = { reason: "host-away", id: p.id, at: this.host.now() };
      if (o.takeover && this.inGame()) this.setTimer("takeover", o.takeoverMs);
      else if (o.closeAfterHostAwayMs !== null) this.setTimer("hostaway", o.closeAfterHostAwayMs);
    }
    this.touch();
    this.event("drop", p.id, { name: p.name });
    this.broadcastRoom();
    if (o.mode === "server") await this.callRules("onDrop", this.rulesPlayer(p));
  }
  async removePlayer(p, why) {
    const s = this.state;
    const o = this.options;
    this.remember(p);
    if (why === "banned") delete s.known[p.pkh];
    else if (why !== "gone") s.known[p.pkh].out = true;
    delete s.players[p.id];
    this.clearTimer("grace", p.id);
    this.clearTimer("autopause", p.id);
    this.touch();
    this.event("gone", p.id, { why, name: p.name });
    if (p.id === s.ownerId) {
      s.ownerId = null;
      if (o.passOwnerAfterMs !== null && !this.hasTimer("ownerpass")) this.setTimer("ownerpass", o.passOwnerAfterMs);
    }
    if (o.mode === "server") s.hostId = s.ownerId;
    this.liftAutoPause();
    if (o.mode === "host" && p.id === s.hostId) {
      s.hostId = null;
      this.clearTimer("takeover");
      this.cancelHostCheck();
      const owner = this.player(s.ownerId);
      if (o.takeover || this.canHost(owner)) {
        if (!await this.takeOver(o.takeover ? null : owner.id)) this.broadcastRoom();
      } else {
        if (this.inGame() && !s.paused) s.paused = { reason: "host-away", id: null, at: this.host.now() };
        if (o.closeAfterHostAwayMs !== null && !this.hasTimer("hostaway")) {
          this.setTimer("hostaway", o.closeAfterHostAwayMs);
        }
        this.broadcastRoom();
      }
    } else {
      this.broadcastRoom();
    }
    if (o.mode === "server") await this.callRules("onGone", this.rulesPlayer(p));
  }
  /**
   * Give the host role to another participant: `preferId` if eligible, else
   * the owner, else whoever has been here longest. Returns false when nobody
   * can host now (the next eligible participant to connect will).
   */
  async takeOver(preferId = null) {
    const s = this.state;
    this.clearTimer("takeover");
    this.clearTimer("hiddenhost");
    const preferred = Array.isArray(s.successors) ? s.successors : [];
    const rank = /* @__PURE__ */ __name((p) => {
      const i = preferred.indexOf(p.id);
      return i === -1 ? Infinity : i;
    }, "rank");
    const candidates = Object.values(s.players).filter((p) => p.id !== s.hostId && this.canHost(p)).sort((a, b) => rank(a) - rank(b) || (b.id === s.ownerId) - (a.id === s.ownerId) || a.joinedAt - b.joinedAt);
    const next = preferId && candidates.find((p) => p.id === preferId) || (preferId ? null : candidates[0]);
    if (!next) return false;
    await this.saveSnapshot();
    s.hostId = next.id;
    s.hostEver = true;
    s.hostPending = true;
    this.clearTimer("hostaway");
    this.cancelHostCheck();
    if (this.inGame() && (!s.paused || s.paused.reason === "host-away")) {
      s.paused = { reason: "host-change", id: next.id, at: this.host.now() };
    } else if (s.paused?.reason === "host-away") {
      s.paused = null;
    }
    this.touch();
    this.event("host", next.id, { name: next.name });
    this.broadcastRoom();
    await this.sendHost(next.id);
    return true;
  }
  /**
   * Tell the host that it runs the game, with the latest state to continue
   * from, and ask it to show that it is there: a host that was picked while
   * its phone was asleep must not leave everyone waiting.
   */
  async sendHost(id) {
    const snapshot = await this.getSnapshot();
    this.sendTo(id, JSON.stringify({ t: "host", snapshot: snapshot?.d ?? null }));
    this.startHostCheck(id);
  }
  /** Ask the host to answer within hostCheckMs. Kept in memory: no storage writes. */
  startHostCheck(id) {
    this.cancelHostCheck();
    this.sendTo(id, JSON.stringify({ t: "check" }));
    const cancel = this.host.defer(this.options.hostCheckMs, () => this.hostUnresponsive(id));
    this.hostCheck = { id, cancel };
  }
  cancelHostCheck() {
    this.hostCheck?.cancel();
    this.hostCheck = null;
  }
  /** The host did not answer in time: its connection is dead, whatever it looks like. */
  async hostUnresponsive(id) {
    this.hostCheck = null;
    const s = this.state;
    if (!s || s.closed) return;
    const p = this.player(id);
    if (!p || p.id !== s.hostId || p.status !== "online") return;
    for (const ws of this.socketsOf(id)) {
      this.shut(ws, CLOSE_UNRESPONSIVE, "unresponsive");
      await this.closed(ws, true);
    }
    if (this.state && this.options.takeover) await this.takeOver();
    if (this.state) await this.flush();
  }
  /**
   * Give ownership (and a fresh owner key) to a participant. `auto`: not by
   * the owner's own choice. Without takeover the game said that nobody else
   * may continue its state, so the kept state does not pass on with the room.
   */
  async giveOwner(p, auto = false) {
    const s = this.state;
    if (auto && !this.options.takeover && this.options.mode === "host") await this.dropSnapshot();
    s.ownerKey = newSecret();
    s.ownerId = p.id;
    s.ownerOpen = false;
    this.clearTimer("ownerpass");
    this.clearTimer("owneraway");
    if (this.options.mode === "server") s.hostId = p.id;
    this.touch();
    this.sendTo(p.id, JSON.stringify({ t: "owner", key: s.ownerKey }));
    this.event("owner", p.id, { name: p.name });
  }
  /** Pass ownership on: to the host if there is one, else to whoever has been here longest. */
  async passOwner(exceptId = null) {
    const s = this.state;
    const hostPlayer = this.player(s.hostId);
    const candidates = Object.values(s.players).filter((p) => p.id !== exceptId && p.id !== s.ownerId && this.canLead(p)).sort((a, b) => a.joinedAt - b.joinedAt);
    const next = hostPlayer && candidates.find((p) => p.id === hostPlayer.id) || candidates[0];
    if (!next) {
      s.ownerOpen = true;
      this.touch();
      return false;
    }
    await this.giveOwner(next, true);
    if (this.options.mode === "host" && !this.player(s.hostId) && await this.takeOver(next.id)) return true;
    this.broadcastRoom();
    return true;
  }
  /** A host-run game is never left "running" while nobody runs it. */
  syncHostPause() {
    const s = this.state;
    if (this.options.mode !== "host") return;
    const hostPlayer = this.player(s.hostId);
    const missing = !hostPlayer || hostPlayer.status === "away";
    if (this.inGame() && missing && !s.paused) {
      s.paused = { reason: "host-away", id: s.hostId, at: this.host.now() };
      this.touch();
    }
  }
  /** Lift an automatic "player away" pause when nobody is away that long any more. */
  liftAutoPause() {
    const s = this.state;
    if (s.paused?.reason !== "player-away") return;
    const limit = this.options.autoPauseMs;
    const now = this.host.now();
    const still = Object.values(s.players).find(
      (p) => p.status === "away" && this.role(p).plays && !p.waiting && limit !== null && p.awaySince + limit <= now
    );
    s.paused = still ? { ...s.paused, id: still.id } : null;
    this.touch();
  }
  // ------------------------------------------------------------- broadcasts
  view(forId) {
    const s = this.state;
    const o = this.options;
    const places = {};
    for (const place of Object.keys(o.places)) places[place] = [];
    const players = Object.values(s.players).sort((a, b) => a.joinedAt - b.joinedAt).map((p) => {
      if (p.place && own(places, p.place)) places[p.place].push(p.id);
      return { id: p.id, name: p.name, role: p.role, status: p.status, waiting: p.waiting, place: p.place };
    });
    const roles = {};
    for (const [name, def] of Object.entries(o.roles)) {
      roles[name] = { seats: def.seats, plays: def.plays, sends: def.sends, sendsTo: def.sendsTo };
    }
    const room = {
      code: s.code,
      mode: o.mode,
      phase: this.currentPhase(),
      round: s.round,
      startsAt: s.startsAt,
      now: this.host.now(),
      paused: s.paused,
      ownerId: s.ownerId,
      hostId: s.hostId,
      settings: {
        ...s.settings,
        pauseBy: o.pauseBy,
        takeover: o.takeover,
        rate: o.maxMessagesPerSecond,
        maxMessageBytes: o.maxMessageBytes,
        maxSnapshotBytes: o.maxSnapshotBytes,
        heartbeatMs: o.heartbeatMs
      },
      roles,
      places,
      placeSizes: { ...o.places },
      data: s.data,
      players
    };
    if (o.mode === "host") room.seed = s.seed;
    if (forId && forId === s.ownerId) {
      room.keys = this.publicKeys();
      room.bans = Object.values(s.banList ?? {}).map((b) => ({ ...b }));
    }
    if (o.mode === "host") room.successors = Array.isArray(s.successors) ? [...s.successors] : [];
    return room;
  }
  broadcastRoom() {
    if (!this.state || this.state.closed) return;
    this.syncHostPause();
    const common = JSON.stringify({ t: "room", room: this.view(null) });
    let ownerText = null;
    for (const ws of this.identifiedSockets()) {
      const { id } = this.host.getAttachment(ws);
      if (id === this.state.ownerId) {
        ownerText ??= JSON.stringify({ t: "room", room: this.view(id) });
        this.deliver(ws, ownerText);
      } else {
        this.deliver(ws, common);
      }
    }
  }
  event(e, id, extra = {}) {
    const text = JSON.stringify({ t: "ev", e, id, ...extra });
    for (const ws of this.identifiedSockets()) this.deliver(ws, text);
  }
  /**
   * Resolve a `to` value into participant ids. The sender is never included.
   *   undefined | 'all'      everyone admitted
   *   [ids]                  exactly these (also participants still waiting)
   *   { role } | { place }   everyone admitted with that role or in that place
   */
  targets(to, fromId) {
    const online = Object.values(this.state.players).filter((p) => p.status === "online" && p.id !== fromId);
    if (Array.isArray(to)) {
      const ids = new Set(to.slice(0, 64).filter((id) => typeof id === "string"));
      return online.filter((p) => ids.has(p.id)).map((p) => p.id);
    }
    const admitted = online.filter((p) => !p.waiting);
    if (to === void 0 || to === null || to === "all") return admitted.map((p) => p.id);
    if (typeof to === "object") {
      const byRole = typeof to.role === "string";
      const byPlace = typeof to.place === "string";
      if (!byRole && !byPlace) return [];
      return admitted.filter((p) => (!byRole || p.role === to.role) && (!byPlace || p.place === to.place)).map((p) => p.id);
    }
    return [];
  }
  // ------------------------------------------------------- relay, snapshots
  async relay(player, msg) {
    const s = this.state;
    const at = this.host.now();
    if (this.options.mode === "server") {
      await this.callRules("onMessage", this.rulesPlayer(player), msg.d, { at });
      return;
    }
    const text = JSON.stringify({ t: "msg", from: player.id, d: msg.d, at });
    if (player.id === s.hostId || this.role(player).sendsTo === "all") {
      for (const id of this.targets(msg.to, player.id)) this.sendTo(id, text);
    } else if (s.hostId) {
      this.sendTo(s.hostId, text);
    }
  }
  async storeSnapshot(player, msg) {
    const now = this.host.now();
    this.snapshot = { d: msg.d, at: now };
    this.snapshotLoaded = true;
    this.snapshotDirty = true;
    const wait = this.snapshotSavedAt + this.options.snapshotSaveMs - now;
    if (wait <= 0) await this.saveSnapshot();
    else this.cancelSave ??= this.host.defer(wait, () => this.saveSnapshot());
  }
  // --------------------------------------------------------------- commands
  mayPause(player) {
    const o = this.options;
    if (o.pauseBy === "nobody") return false;
    if (player.id === this.state.hostId || player.id === this.state.ownerId) return true;
    return o.pauseBy === "anyone" && this.role(player).canPause && !player.waiting;
  }
  /** What a command can change, to tell real changes from no-ops. */
  fingerprint() {
    const s = this.state;
    return JSON.stringify([
      s.settings,
      s.keys,
      s.phase,
      s.round,
      s.startsAt,
      s.paused,
      s.ownerId,
      s.hostId,
      s.hostPending,
      s.data,
      s.successors,
      s.bans.length,
      Object.values(s.players).map((p) => [p.id, p.place, p.waiting, p.status, p.hidden === true]),
      Object.values(s.known).map((k) => k.out === true)
    ]);
  }
  async admitWaiting() {
    for (const p of Object.values(this.state.players)) {
      if (!p.waiting) continue;
      p.waiting = false;
      this.remember(p);
      this.event("join", p.id, { name: p.name });
      if (this.options.mode === "server") await this.callRules("onJoin", this.rulesPlayer(p));
    }
    this.touch();
  }
  // ----------------------------------------------------- server-mode rules
  rulesPlayer(p) {
    return { id: p.id, name: p.name, role: p.role, place: p.place, status: p.status, waiting: p.waiting, rttMs: this.rttOf(p.id) };
  }
  // ---- response time per participant (F-076), for the rules
  /** The median of the last few measured response times, or null. */
  rttOf(id) {
    const list = this.rtts?.get(id);
    if (!list?.length) return null;
    const sorted = [...list].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
  }
  /** Ask this participant's page to answer at once, now and then (only when the game wants it). */
  probe(ws, id) {
    const every = this.options.rttProbeMs;
    if (!every || !id) return;
    this.probes ??= /* @__PURE__ */ new Map();
    const last = this.probes.get(id);
    const now = this.host.now();
    if (last && now - last.at < every) return;
    const n = ((last?.n ?? 0) + 1) % 1e6;
    this.probes.set(id, { at: now, n, sent: now });
    this.sendJson(ws, { t: "probe", n });
  }
  /** The page's answer: the time since the probe is the response time. */
  probed(id, n) {
    const p = this.probes?.get(id);
    if (!p || p.n !== n || p.sent === null) return;
    const ms = this.host.now() - p.sent;
    p.sent = null;
    if (ms < 0 || ms > 1e4) return;
    this.rtts ??= /* @__PURE__ */ new Map();
    const list = this.rtts.get(id) ?? [];
    list.push(ms);
    if (list.length > 5) list.shift();
    this.rtts.set(id, list);
  }
  rulesRoom() {
    const core = this;
    const s = this.state;
    return {
      get code() {
        return s.code;
      },
      get phase() {
        return core.currentPhase();
      },
      get round() {
        return s.round;
      },
      get seed() {
        return s.seed;
      },
      get ownerId() {
        return s.ownerId;
      },
      get players() {
        return Object.values(s.players).map((p) => core.rulesPlayer(p));
      },
      get game() {
        return s.game;
      },
      set game(value) {
        s.game = value;
        core.touch();
      },
      get data() {
        return s.data;
      },
      set data(value) {
        s.data = value ?? null;
        core.touch();
        core.broadcastRoom();
      },
      env: core.host.env,
      now: /* @__PURE__ */ __name(() => core.host.now(), "now"),
      /** Store `room.game` after changing it in place. */
      save: /* @__PURE__ */ __name(() => core.touch(), "save"),
      send(to, data) {
        const text = JSON.stringify({ t: "msg", from: null, d: data });
        for (const id of core.targets(to, null)) core.sendTo(id, text);
      },
      end() {
        s.phase = "ended";
        s.startsAt = null;
        core.touch();
        core.broadcastRoom();
      },
      admit: /* @__PURE__ */ __name(async () => {
        await core.admitWaiting();
        core.broadcastRoom();
      }, "admit"),
      /** State for newcomers (F-030): sent to everyone who joins or comes back; per role if `role` is given. */
      setWelcomeState: /* @__PURE__ */ __name((data, role = null) => core.setWelcomeState(role && own(core.options.roles, role) ? role : "*", data ?? null), "setWelcomeState"),
      setTimer: /* @__PURE__ */ __name((name, ms) => core.setTimer("rules", ms, String(name)), "setTimer"),
      clearTimer: /* @__PURE__ */ __name((name) => core.clearTimer("rules", String(name)), "clearTimer"),
      /**
       * Large values that seldom change, kept apart from room.game (F-147): room.game is
       * written whole at every change, these only when stored. At most 20 keys, each at
       * most maxSnapshotBytes. `await room.store('questions', bank)`, `await room.stored('questions')`.
       */
      store: /* @__PURE__ */ __name((key, value) => core.storeValue(key, value), "store"),
      stored: /* @__PURE__ */ __name((key) => core.storedValue(key), "stored"),
      unstore: /* @__PURE__ */ __name((key) => core.unstoreValue(key), "unstore")
    };
  }
  /** Call a rules hook. Nothing is stored unless the rules changed `room.game` or called `room.save()`. */
  async callRules(hook, ...args) {
    const fn = this.options.rules?.[hook];
    if (typeof fn !== "function" || !this.state) return void 0;
    return fn(this.rulesRoom(), ...args);
  }
};
Object.assign(RoomCore.prototype, admissionMethods, commandMethods);

// vendor/network-kit/server/measure-check.js
var Q = /* @__PURE__ */ __name((q) => q && typeof q === "object" ? Object.fromEntries(["n", "p50", "p90", "max"].map((k) => [k, Number.isFinite(q[k]) ? Math.max(0, Math.min(1e7, Math.round(q[k]))) : null])) : null, "Q");
var word = /* @__PURE__ */ __name((v, allowed) => allowed.includes(v) ? v : "other", "word");
var COUNTS = ["reconnects", "hostChanges", "dropsSeen", "hostMessages"];
function cleanSummary(raw) {
  if (!raw || typeof raw !== "object" || raw.v !== 1) return null;
  const counts = {};
  for (const k of COUNTS) counts[k] = Number.isFinite(raw.counts?.[k]) ? Math.max(0, Math.min(1e7, Math.round(raw.counts[k]))) : 0;
  return {
    v: 1,
    why: word(raw.why, ["interval", "leave", "page-hidden"]),
    seconds: Number.isFinite(raw.seconds) ? Math.max(0, Math.min(86400, Math.round(raw.seconds))) : 0,
    device: {
      kind: word(raw.device?.kind, ["phone", "tablet", "desktop"]),
      browser: word(raw.device?.browser, ["chrome", "safari", "firefox", "edge", "samsung"])
    },
    network: word(raw.network, ["slow-2g", "2g", "3g", "4g"]),
    role: word(raw.role, ["host", "player", "viewer"]),
    players: Number.isFinite(raw.players) ? Math.max(0, Math.min(1e3, Math.round(raw.players))) : 0,
    rttMs: Q(raw.rttMs),
    hostGapMs: Q(raw.hostGapMs),
    frameMs: Q(raw.frameMs),
    offlineMs: Q(raw.offlineMs),
    counts
  };
}
__name(cleanSummary, "cleanSummary");

// vendor/network-kit/shared/visitor.js
function visitorKey(address) {
  const a = String(address ?? "").trim().toLowerCase();
  if (!a.includes(":")) return a || "unknown";
  const [head, tail = ""] = a.split("::");
  const h = head ? head.split(":") : [];
  const t = a.includes("::") && tail ? tail.split(":") : [];
  if (t.some((p) => p.includes(".")) || h.some((p) => p.includes("."))) return a;
  const groups = a.includes("::") ? [...h, ...Array(Math.max(0, 8 - h.length - t.length)).fill("0"), ...t] : h;
  return `${groups.slice(0, 4).map((g) => (g || "0").replace(/^0+(?=.)/, "")).join(":")}::/64`;
}
__name(visitorKey, "visitorKey");

// vendor/network-kit/server/worker.js
var SERVER_OPTIONS = {
  binding: "ROOMS",
  // Durable Object namespace binding name in the wrangler config
  basePath: "/rooms",
  codeLength: CODE_LENGTH,
  // characters in a room code, 4 to 12
  allowedOrigins: "*",
  // '*' or a list such as ['https://badbagel47.github.io']
  jurisdiction: null,
  // 'eu' keeps rooms in the EU; may be a function (env) => 'eu' | null
  gate: null,
  // experimental: async ({ request, env, action }) => true | { open: false, reason }
  // Per visitor (address) and minute, checked before a room is woken (F-053):
  // rooms created, and look-ups or joins at a room code. null turns it off;
  // may be a function (env) => limits | null.
  limits: { createsPerMinute: 10, attemptsPerMinute: 60 },
  // The admin page (F-003, F-004): { binding, game, mode } — a service binding
  // to the admin Worker's GameApi entrypoint, this game's name (its Worker's
  // name) and, for a game with modes, the rooms' mode (F-057). May be a
  // function (env) => { … } | null. null: not connected.
  admin: null,
  // The role a lobby's guest link joins in (F-059); null: 'player', else the first role.
  lobbyRole: null,
  fallback: null
  // async (request, env, ctx) => Response for other paths
};
function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers }
  });
}
__name(json, "json");
function closedSocket(code, reason) {
  const pair = new WebSocketPair();
  pair[1].accept();
  pair[1].send(JSON.stringify({ t: "denied", code, reason }));
  pair[1].close(code, reason);
  return new Response(null, { status: 101, webSocket: pair[0] });
}
__name(closedSocket, "closedSocket");
function cleanNotices(list) {
  if (!Array.isArray(list)) return [];
  const text = /* @__PURE__ */ __name((v, max) => typeof v === "string" ? v.slice(0, max) : "", "text");
  return list.slice(0, 20).filter((n) => n && typeof n.id === "string" && n.id).map((n) => ({
    id: text(n.id, 80),
    kind: text(n.kind, 40) || "message",
    level: n.level === "warning" ? "warning" : "info",
    title: text(n.title, 80),
    text: text(n.text, 400),
    until: typeof n.until === "string" && !Number.isNaN(Date.parse(n.until)) ? n.until : null
  }));
}
__name(cleanNotices, "cleanNotices");
function createRoomServer(gameOptions = {}) {
  const serverOptions = {};
  const coreOptions = {};
  for (const [key, value] of Object.entries(gameOptions)) {
    if (key in SERVER_OPTIONS) serverOptions[key] = value;
    else coreOptions[key] = value;
  }
  const opts = { ...SERVER_OPTIONS, ...serverOptions };
  if (!Number.isInteger(opts.codeLength) || opts.codeLength < CODE_MIN_LENGTH || opts.codeLength > CODE_MAX_LENGTH) {
    throw new Error(`network-kit: codeLength must be a whole number from ${CODE_MIN_LENGTH} to ${CODE_MAX_LENGTH}`);
  }
  resolveOptions(coreOptions);
  function namespace(env) {
    const ns = env[opts.binding];
    if (!ns) throw new Error(`network-kit: missing Durable Object binding "${opts.binding}"`);
    const where = typeof opts.jurisdiction === "function" ? opts.jurisdiction(env) : opts.jurisdiction;
    return where ? ns.jurisdiction(where) : ns;
  }
  __name(namespace, "namespace");
  const stub = /* @__PURE__ */ __name((env, code) => {
    const ns = namespace(env);
    return ns.get(ns.idFromName(code));
  }, "stub");
  function corsHeaders(request) {
    const origin = request.headers.get("origin");
    if (!origin) return {};
    if (opts.allowedOrigins === "*" || opts.allowedOrigins.includes(origin)) {
      return {
        "access-control-allow-origin": origin,
        "access-control-allow-methods": "GET, POST, OPTIONS",
        "access-control-allow-headers": "content-type, x-admin-pass",
        // x-admin-pass: a game link on the status check (B-104)
        "access-control-max-age": "86400",
        vary: "origin"
      };
    }
    return null;
  }
  __name(corsHeaders, "corsHeaders");
  async function makeRoom(env, { settings = {}, open = false, pass = null, lobbyEnds = null } = {}) {
    for (let attempt = 0; attempt < 6; attempt++) {
      const code = newRoomCode(opts.codeLength);
      const res = await stub(env, code).fetch("https://room/create", {
        method: "POST",
        body: JSON.stringify({ code, settings, open, pass, lobbyEnds })
      });
      if (res.status === 409) continue;
      return { status: res.status, body: await res.json() };
    }
    return { status: 503, body: { error: "no-free-code" } };
  }
  __name(makeRoom, "makeRoom");
  async function createRoom(env, { settings = {} } = {}) {
    const made = await makeRoom(env, { settings, open: true });
    if (made.status !== 200) throw new Error(`network-kit: could not create a room (${made.body.error ?? made.status})`);
    return made.body;
  }
  __name(createRoom, "createRoom");
  const visitors = /* @__PURE__ */ new Map();
  function overLimit(request, env, kind) {
    const limits = typeof opts.limits === "function" ? opts.limits(env) : opts.limits;
    const max = limits?.[kind === "create" ? "createsPerMinute" : "attemptsPerMinute"];
    if (!max) return false;
    const address = visitorKey(request.headers.get("cf-connecting-ip"));
    const minute = Math.floor(Date.now() / 6e4);
    let v = visitors.get(address);
    if (!v || v.minute !== minute) {
      if (visitors.size > 1e4) visitors.clear();
      v = { minute, create: 0, attempt: 0 };
      visitors.set(address, v);
    }
    v[kind] += 1;
    return v[kind] > max;
  }
  __name(overLimit, "overLimit");
  const words = /* @__PURE__ */ new Map();
  const adminLink = /* @__PURE__ */ __name((env) => {
    const link = typeof opts.admin === "function" ? opts.admin(env) : opts.admin;
    const api = link && env[link.binding];
    return api?.status ? { link, api } : null;
  }, "adminLink");
  async function adminWord(env, mode = void 0) {
    const found = adminLink(env);
    if (!found) return null;
    const m = mode === void 0 ? found.link.mode ?? null : mode;
    const now = Date.now();
    const cached = words.get(m);
    if (cached && now - cached.at < 3e4) return cached.value;
    let value = null;
    try {
      value = await found.api.status(found.link.game, m, VERSION);
    } catch {
      value = null;
    }
    words.set(m, { at: now, value });
    return value;
  }
  __name(adminWord, "adminWord");
  const passes = /* @__PURE__ */ new Map();
  async function passValid(env, token) {
    const found = adminLink(env);
    if (!found?.api.checkPass || typeof token !== "string" || token.length > 100) return false;
    const now = Date.now();
    const cached = passes.get(token);
    if (cached && now - cached.at < 6e4) return cached.valid;
    let valid = false;
    try {
      valid = await found.api.checkPass(found.link.game, token) === true;
    } catch {
      valid = false;
    }
    if (passes.size > 1e3) passes.clear();
    passes.set(token, { at: now, valid });
    return valid;
  }
  __name(passValid, "passValid");
  async function roomCount(env, request) {
    const found = adminLink(env);
    if (!found?.api.roomCreated) return null;
    try {
      return await found.api.roomCreated(found.link.game, visitorKey(request.headers.get("cf-connecting-ip")));
    } catch {
      return null;
    }
  }
  __name(roomCount, "roomCount");
  async function gate(request, env, action) {
    if (!opts.gate) return { open: true };
    const result = await opts.gate({ request, env, action });
    if (result === true || result?.open) return { open: true };
    return { open: false, reason: result?.reason || "game-closed" };
  }
  __name(gate, "gate");
  async function fetch(request, env, ctx) {
    const url = new URL(request.url);
    const base = opts.basePath.replace(/\/$/, "");
    if (url.pathname !== base && !url.pathname.startsWith(`${base}/`)) {
      return opts.fallback ? opts.fallback(request, env, ctx) : json({ error: "not-found" }, 404);
    }
    const cors = corsHeaders(request);
    if (cors === null) return json({ error: "origin-not-allowed" }, 403);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (url.pathname.slice(base.length).includes("//")) return json({ error: "not-found" }, 404, cors);
    const parts = url.pathname.slice(base.length).split("/").filter(Boolean);
    if (parts.length === 0 && request.method === "POST") {
      if (overLimit(request, env, "create")) return json({ error: "too-many-requests" }, 429, { ...cors, "retry-after": "60" });
      let body = {};
      try {
        body = await request.json() ?? {};
      } catch {
        body = {};
      }
      const status = await adminWord(env);
      if (status && !status.open && (status.stopped || !await passValid(env, body.adminPass))) {
        return json({ error: status.reason ?? "off", until: status.until ?? null }, 503, cors);
      }
      const open = await gate(request, env, "create");
      if (!open.open) return json({ error: open.reason }, 503, cors);
      if (!(status && !status.open) && !await passValid(env, body.adminPass)) {
        const counted = await roomCount(env, request);
        if (counted && counted.ok === false) return json({ error: counted.reason ?? "too-many-rooms" }, 429, { ...cors, "retry-after": "600" });
      }
      const made = await makeRoom(env, { settings: body.settings ?? {} });
      return json(made.body, made.status, cors);
    }
    if (parts.length === 1 && parts[0] === "status" && request.method === "GET") {
      if (overLimit(request, env, "attempt")) return json({ error: "too-many-requests" }, 429, cors);
      const mode = url.searchParams.get("mode") || null;
      const status = await adminWord(env, mode) ?? { open: true, reason: null, until: null };
      const notices = cleanNotices(status.notices);
      if (!status.open && !status.stopped && await passValid(env, request.headers.get("x-admin-pass"))) {
        return json({ open: true, reason: "admin", until: null, notices }, 200, cors);
      }
      return json({ open: status.open, reason: status.reason ?? null, until: status.until ?? null, notices }, 200, cors);
    }
    if (parts.length === 1 && parts[0] === "lobby" && request.method === "POST") {
      if (overLimit(request, env, "attempt")) return json({ error: "too-many-requests" }, 429, { ...cors, "retry-after": "60" });
      const found = adminLink(env);
      if (!found?.api.lobby) return json({ error: "no-lobbies" }, 404, cors);
      let token = "";
      try {
        token = String((await request.json())?.token ?? "").slice(0, 120);
      } catch {
        token = "";
      }
      const status = await adminWord(env);
      if (status?.stopped) return json({ error: "stopped" }, 503, cors);
      let lobby = null;
      try {
        lobby = await found.api.lobby(found.link.game, token);
      } catch {
        lobby = null;
      }
      if (!lobby || lobby.error) return json({ error: lobby?.error ?? "lobby-ended" }, 410, cors);
      let room = lobby.room;
      if (!room) {
        const made = await makeRoom(env, { settings: { access: "private" }, pass: token, lobbyEnds: lobby.expires });
        if (made.status !== 200) return json({ error: made.body.error ?? "no-room" }, 503, cors);
        const keys = made.body.keys ?? {};
        const guestRole = opts.lobbyRole && keys[opts.lobbyRole] ? opts.lobbyRole : keys.player ? "player" : Object.keys(keys)[0];
        room = await found.api.lobbyRoom(found.link.game, lobby.id, { code: made.body.code, ownerKey: made.body.ownerKey, key: keys[guestRole]?.k ?? null });
      }
      return json(lobby.role === "host" ? { role: "host", code: room.code, ownerKey: room.ownerKey, ends: lobby.expires } : { role: "guest", code: room.code, key: room.key, ends: lobby.expires }, 200, cors);
    }
    if (parts.length === 1 && parts[0] === "measure" && request.method === "POST") {
      if (overLimit(request, env, "attempt")) return new Response(null, { status: 429, headers: cors });
      const link = typeof opts.admin === "function" ? opts.admin(env) : opts.admin;
      const api = link && env[link.binding];
      const text = await request.text();
      if (!api?.measure || text.length > 8 * 1024) return new Response(null, { status: 204, headers: cors });
      let summary = null;
      try {
        summary = cleanSummary(JSON.parse(text));
      } catch {
        summary = null;
      }
      if (summary) {
        const sent = api.measure(link.game, summary).catch(() => {
        });
        if (ctx?.waitUntil) ctx.waitUntil(sent);
        else await sent;
      }
      return new Response(null, { status: 204, headers: cors });
    }
    if (parts.length === 0 && request.method === "GET") {
      return json({ name: "network-kit", version: VERSION, codeLength: opts.codeLength }, 200, cors);
    }
    const code = normalizeCode(parts[0]);
    if (!isValidCode(code, opts.codeLength)) {
      const ws = parts.length === 2 && parts[1] === "ws" && request.headers.get("upgrade")?.toLowerCase() === "websocket";
      return ws ? closedSocket(CLOSE.NOT_FOUND, "not-found") : json({ error: "not-found" }, 404, cors);
    }
    const wantsSocket = parts.length === 2 && parts[1] === "ws";
    if (parts.length === 1 && request.method === "GET" || wantsSocket) {
      if (overLimit(request, env, "attempt")) {
        return wantsSocket && request.headers.get("upgrade")?.toLowerCase() === "websocket" ? closedSocket(CLOSE.RATE, "too-many-attempts") : json({ error: "too-many-requests" }, 429, { ...cors, "retry-after": "60" });
      }
    }
    if (parts.length === 1 && request.method === "GET") {
      const res = await stub(env, code).fetch("https://room/info");
      return json(await res.json(), res.status, cors);
    }
    if (parts.length === 2 && parts[1] === "ws") {
      if (request.headers.get("upgrade")?.toLowerCase() !== "websocket") {
        return json({ error: "websocket-expected" }, 426, cors);
      }
      const status = await adminWord(env);
      if (status?.stopped) return closedSocket(CLOSE.GAME_CLOSED, "stopped");
      const open = await gate(request, env, "join");
      if (!open.open) return closedSocket(CLOSE.GAME_CLOSED, open.reason);
      return stub(env, code).fetch("https://room/ws", { headers: { upgrade: "websocket" } });
    }
    return json({ error: "not-found" }, 404, cors);
  }
  __name(fetch, "fetch");
  class RoomObject {
    static {
      __name(this, "RoomObject");
    }
    constructor(ctx, env) {
      this.ctx = ctx;
      this.env = env;
      const attachments = /* @__PURE__ */ new WeakMap();
      const host = {
        now: /* @__PURE__ */ __name(() => Date.now(), "now"),
        storage: {
          get: /* @__PURE__ */ __name((key) => ctx.storage.get(key), "get"),
          put: /* @__PURE__ */ __name((key, value) => ctx.storage.put(key, value), "put"),
          delete: /* @__PURE__ */ __name((key) => ctx.storage.delete(key), "delete"),
          deleteAll: /* @__PURE__ */ __name(() => ctx.storage.deleteAll(), "deleteAll")
        },
        setAlarm: /* @__PURE__ */ __name((at) => at === null ? ctx.storage.deleteAlarm() : ctx.storage.setAlarm(at), "setAlarm"),
        // A pending timer keeps the room in memory, so this is only for short waits.
        defer(ms, fn) {
          const timer = setTimeout(() => ctx.waitUntil(Promise.resolve().then(fn).catch(() => {
          })), ms);
          return () => clearTimeout(timer);
        },
        env,
        sockets: /* @__PURE__ */ __name(() => ctx.getWebSockets(), "sockets"),
        getAttachment(ws) {
          if (!attachments.has(ws)) attachments.set(ws, ws.deserializeAttachment() ?? null);
          return attachments.get(ws);
        },
        setAttachment(ws, value) {
          attachments.set(ws, value);
          ws.serializeAttachment(value);
        },
        send(ws, text) {
          try {
            ws.send(text);
          } catch {
          }
        },
        close(ws, code, reason) {
          try {
            ws.close(code, reason);
          } catch {
          }
        },
        admission: /* @__PURE__ */ __name(() => adminWord(env), "admission"),
        checkAdminPass: /* @__PURE__ */ __name((token) => passValid(env, token), "checkAdminPass"),
        lastPingAt(ws) {
          return ctx.getWebSocketAutoResponseTimestamp?.(ws)?.getTime() ?? null;
        }
      };
      this.core = new RoomCore(host, coreOptions);
      if (typeof WebSocketRequestResponsePair === "function") {
        ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"));
      }
      ctx.blockConcurrencyWhile(() => this.core.load());
    }
    async fetch(request) {
      const url = new URL(request.url);
      if (url.pathname === "/create") {
        const body = await request.json();
        const result = await this.core.create(body.settings, body.code, { open: body.open === true, pass: body.pass ?? null, lobbyEnds: body.lobbyEnds ?? null });
        return json(result, result.error ? 409 : 200);
      }
      if (url.pathname === "/info") {
        const info = this.core.info();
        if (!info) return json({ error: "not-found" }, 404);
        return json({ ...info, where: await this.where() }, info.closed ? 410 : 200);
      }
      if (url.pathname === "/ws") {
        const pair = new WebSocketPair();
        this.ctx.acceptWebSocket(pair[1]);
        this.core.opened(pair[1]);
        return new Response(null, { status: 101, webSocket: pair[0] });
      }
      return json({ error: "not-found" }, 404);
    }
    /**
     * The data centre this room runs in (e.g. "FRA"), asked once per wake-up
     * from Cloudflare's trace page; null if that fails (D-046). A room stays
     * where it was created: near the first visitor, inside the jurisdiction.
     */
    async where() {
      this.whereAt ??= (async () => {
        try {
          const res = await globalThis.fetch("https://www.cloudflare.com/cdn-cgi/trace", { signal: AbortSignal.timeout(2e3) });
          return /^colo=(\w+)$/m.exec(await res.text())?.[1] ?? null;
        } catch {
          return null;
        }
      })();
      return this.whereAt;
    }
    async webSocketMessage(ws, message) {
      await this.core.message(ws, message);
    }
    async webSocketClose(ws, code, reason) {
      await this.core.closed(ws);
      try {
        ws.close(code === 1005 ? 1e3 : code, reason);
      } catch {
      }
    }
    async webSocketError(ws) {
      await this.core.closed(ws);
    }
    async alarm() {
      await this.core.alarm();
    }
  }
  return { fetch, createRoom, RoomObject, options: opts };
}
__name(createRoomServer, "createRoomServer");

// rooms/rules.js
var HOST_ACTIONS = /* @__PURE__ */ new Set(["configure", "publish", "select", "moderate", "celebrate", "adjust", "archive", "get", "start", "stop", "expire", "retry", "next", "advance", "grade"]);
var PLAYER_ACTIONS = /* @__PURE__ */ new Set(["buzz", "ready"]);
var ROUND_ACTIONS = /* @__PURE__ */ new Set(["buzz", "grade", "start", "stop", "expire", "retry", "next", "advance"]);
var FIELD = /^[A-Za-z][A-Za-z0-9]*$/;
var MAX_BUZZ_CORRECTION_MS = 100;
var RuleError = class extends Error {
  static {
    __name(this, "RuleError");
  }
};
var fail = /* @__PURE__ */ __name((message) => {
  throw new RuleError(message);
}, "fail");
var emptyAttempt = /* @__PURE__ */ __name(() => ({ n: 0, hits: {}, first: null, judgments: {} }), "emptyAttempt");
var LOOKALIKE = { \u0430: "a", \u0432: "b", \u0435: "e", \u043A: "k", \u043C: "m", \u043D: "h", \u043E: "o", \u0440: "p", \u0441: "c", \u0442: "t", \u0443: "y", \u0445: "x", \u0456: "i", \u0458: "j", \u0455: "s", "\u0501": "d", "\u051B": "q", "\u051D": "w", \u03B1: "a", \u03B2: "b", \u03B5: "e", \u03B7: "n", \u03B9: "i", \u03BA: "k", \u03BD: "v", \u03BF: "o", \u03C1: "p", \u03C4: "t", \u03C5: "u", \u03C7: "x", "0": "o", "1": "l", "|": "l" };
var cleanName2 = /* @__PURE__ */ __name((name) => String(name ?? "").normalize("NFKC").replace(/[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/gu, "").replace(/\s+/g, " ").trim(), "cleanName");
var nameKey = /* @__PURE__ */ __name((name) => [...cleanName2(name).toLocaleLowerCase("sv")].map((c) => LOOKALIKE[c] ?? c).join("").replace(/ /g, ""), "nameKey");
var sameName = /* @__PURE__ */ __name((a, b) => nameKey(a) === nameKey(b), "sameName");
var clamp = /* @__PURE__ */ __name((allowNegative, before, requested) => allowNegative === false && requested < 0 ? before < 0 ? before : Math.max(0, before + requested) : before + requested, "clamp");
function initialGame(now) {
  return {
    createdAt: now,
    control: { r: 1, a: 1, phase: "ready", mode: "timed", startedAt: 0, closedAt: 0, ms: 1e4, timer: true, version: 0, commandId: "", resultUid: "" },
    attempt: emptyAttempt(),
    excluded: { r: 1, ids: {} },
    members: {},
    scores: {},
    moderation: {},
    adjustments: {},
    settings: {},
    presentation: null,
    selection: null,
    celebration: null,
    loads: { key: "", map: {} }
  };
}
__name(initialGame, "initialGame");
function visiblePresentation(g) {
  const p = g.presentation;
  if (!p || p.shown || g.control.phase !== "ready") return p;
  return { ...p, text: "" };
}
__name(visiblePresentation, "visiblePresentation");
function view(room) {
  const g = room.game;
  const online = Object.fromEntries(room.players.map((p) => [p.id, p.status === "online"]));
  const viewers = room.players.filter((p) => p.role === "viewer" && p.status === "online").map((p) => p.id);
  return {
    ownerId: room.ownerId,
    createdAt: g.createdAt,
    control: g.control,
    attempt: g.attempt,
    excluded: g.excluded,
    members: g.members,
    scores: g.scores,
    moderation: g.moderation,
    adjustments: g.adjustments,
    settings: g.settings,
    presentation: visiblePresentation(g),
    selection: g.selection,
    celebration: g.celebration,
    loads: g.loads,
    online,
    viewers
  };
}
__name(view, "view");
function broadcast(room) {
  room.send("all", { t: "state", v: view(room) });
}
__name(broadcast, "broadcast");
function reply(room, who, rid, body) {
  if (rid) room.send([who.id], { t: "res", rid, ...body });
}
__name(reply, "reply");
function memberStatus(g, id) {
  const status = g.moderation[id];
  if (status === "banned" || status === "kicked") return status;
  const m = g.members[id];
  return m && m.fromRound <= g.control.r ? "active" : "waiting";
}
__name(memberStatus, "memberStatus");
function pending(g) {
  const a = g.attempt;
  const hits = g.control.mode === "first" ? a.first ? [[a.first.uid, { i: 1 }]] : [] : Object.entries(a.hits);
  return hits.filter(([id]) => !a.judgments[id]).sort((x, y) => x[1].i - y[1].i);
}
__name(pending, "pending");
async function storedObject(room, key) {
  return await room.stored(key) || {};
}
__name(storedObject, "storedObject");
function newAttempt(g, round) {
  g.attempt = emptyAttempt();
  if (g.excluded.r !== round) g.excluded = { r: round, ids: {} };
}
__name(newAttempt, "newAttempt");
function buzz(room, g, who, at) {
  const c = g.control, a = g.attempt;
  if (c.phase !== "open") fail("The buzzers are not open.");
  if (c.timer !== false && room.now() > c.startedAt + c.ms) fail("Time is up.");
  if (memberStatus(g, who.id) !== "active") fail("You are not playing this question.");
  if (g.excluded.ids[who.id] && !c.allowRepeat) fail("You cannot buzz again on this question.");
  if (a.hits[who.id] || a.first?.uid === who.id) return;
  const time = at - Math.min((who.rttMs ?? 0) / 2, MAX_BUZZ_CORRECTION_MS);
  if (c.mode === "first") {
    if (!a.first) a.first = { uid: who.id, at: time };
    return;
  }
  a.n += 1;
  a.hits[who.id] = { i: a.n, at: time };
  if (!Object.keys(a.judgments).length) {
    Object.entries(a.hits).sort((x, y) => x[1].at - y[1].at || x[1].i - y[1].i).forEach(([, hit], index) => {
      hit.i = index + 1;
    });
  }
}
__name(buzz, "buzz");
function grade(room, g, x) {
  const c = g.control, a = g.attempt;
  const judged = a.judgments[x.playerId];
  if (judged) {
    if (judged.cmd === x.commandId) return;
    fail("Already judged.");
  }
  if (!pending(g).some(([id]) => id === x.playerId)) fail("Select an ungraded buzz.");
  if (!["correct", "incorrect"].includes(x.result)) fail("Invalid result.");
  const correct = x.result === "correct";
  const before = g.scores[x.playerId] ?? 0;
  const after = clamp(c.allowNegative, before, correct ? c.correct ?? 1 : c.incorrect ?? 0);
  a.judgments[x.playerId] = { kind: x.result, delta: after - before, cmd: x.commandId, before, after, at: room.now() };
  g.scores[x.playerId] = after;
  if (!correct && !c.allowRepeat) g.excluded.ids[x.playerId] = true;
  if (correct || !["closed", "finished"].includes(c.phase)) {
    g.control = { ...c, phase: correct ? "finished" : "closed", version: c.version + 1, commandId: x.commandId, resultUid: correct ? x.playerId : "", closedAt: c.closedAt || room.now() };
  }
}
__name(grade, "grade");
function settingsFrom(x) {
  return { mode: x.mode || "timed", ms: x.durationMs || 1e4, timer: x.timer !== false, correct: x.correct ?? 1, incorrect: x.incorrect ?? 0, allowNegative: x.allowNegative !== false, allowRepeat: x.allowRepeat === true };
}
__name(settingsFrom, "settingsFrom");
function control(room, g, x) {
  const c = g.control;
  if (["retry", "next"].includes(x.action) && c.phase === "closed" && pending(g).length) fail("Judge pending buzzes first.");
  const next = { ...c, version: c.version + 1, commandId: x.commandId };
  switch (x.action) {
    case "start":
      if (c.phase !== "ready") fail("Not ready.");
      Object.assign(next, settingsFrom(x), { phase: "open", startedAt: room.now(), closedAt: 0 });
      if (next.timer) room.setTimer(`expire:${c.r}:${c.a}`, next.ms + 50);
      break;
    case "stop":
    case "expire":
      if (["closed", "finished"].includes(c.phase)) return;
      if (c.phase !== "open") fail("Not open.");
      if (x.action === "expire" && (c.timer === false || room.now() < c.startedAt + c.ms)) fail("Not expired.");
      Object.assign(next, { phase: "closed", closedAt: room.now() });
      break;
    case "retry":
    case "next":
    case "advance":
      if (!["closed", "finished"].includes(c.phase) && !(x.action === "advance" && c.phase === "ready")) fail("Not closed.");
      Object.assign(next, { r: c.r + (x.action !== "retry" ? 1 : 0), a: x.action !== "retry" ? 1 : c.a + 1, phase: "ready", startedAt: 0, closedAt: 0, resultUid: "" });
      newAttempt(g, next.r);
      break;
    default:
      fail("Unknown command.");
  }
  g.control = next;
}
__name(control, "control");
async function publish(room, g, x) {
  const patch = { presentation: x.presentationPatch, settings: x.settingsPatch, ui: x.privatePatch };
  for (const changes of Object.values(patch)) for (const key of Object.keys(changes || {})) if (!FIELD.test(key)) fail("Invalid field.");
  if (x.presentation !== void 0) g.presentation = x.presentation;
  if (x.settings !== void 0) g.settings = x.settings;
  if (patch.presentation) g.presentation = { ...g.presentation || {}, ...patch.presentation };
  if (g.presentation?.image && !/^https:\/\/[^\s]+$/i.test(String(g.presentation.image))) g.presentation = { ...g.presentation, image: "" };
  if (patch.settings) g.settings = { ...g.settings, ...patch.settings };
  if (x.privateUi !== void 0 || patch.ui) {
    const ui = x.privateUi !== void 0 ? x.privateUi : { ...await storedObject(room, "ui"), ...patch.ui };
    await room.store("ui", ui);
  }
}
__name(publish, "publish");
async function adjust(room, g, x) {
  if (g.adjustments[x.playerId]?.id === x.commandId) return;
  if (!Number.isFinite(x.delta) || Math.abs(x.delta) > 1e4) fail("Invalid adjustment.");
  const before = g.scores[x.playerId];
  if (typeof before !== "number") fail("Player not found.");
  const after = clamp(x.allowNegative, before, x.delta);
  const when = room.now();
  g.scores[x.playerId] = after;
  g.adjustments[x.playerId] = { id: x.commandId, before, after, at: when };
  const archive = await storedObject(room, "archive");
  archive[`adjust-${x.commandId}`] = { id: `adjust-${x.commandId}`, type: "adjust", playerId: x.playerId, playerName: x.name || "", delta: after - before, requestedDelta: x.delta, before, after, when };
  await room.store("archive", archive);
}
__name(adjust, "adjust");
async function get(room, x) {
  if (x.what === "ui") return await room.stored("ui") ?? null;
  const archive = await room.stored("archive") ?? null;
  if (x.what === "archive") return archive;
  if (x.what === "round") return archive?.[`round-${x.round}`] ?? null;
  fail("Unknown request.");
}
__name(get, "get");
async function run(room, who, x) {
  const g = room.game;
  const isHost = who.id === room.ownerId;
  if (HOST_ACTIONS.has(x.action) ? !isHost : !(PLAYER_ACTIONS.has(x.action) && who.role === "player")) fail("Not allowed.");
  const c = g.control;
  if (ROUND_ACTIONS.has(x.action) && x.action !== "grade" && c.commandId === x.commandId && x.commandId) return { changed: false };
  if (ROUND_ACTIONS.has(x.action) && (x.roundId !== c.r || x.attempt !== c.a)) fail("Stale round or attempt.");
  switch (x.action) {
    case "get":
      return { value: await get(room, x), changed: false };
    case "configure":
      if (c.phase !== "ready" && (x.mode !== c.mode || x.durationMs !== c.ms || x.timer !== (c.timer !== false))) fail("Change mode and timer before the round starts.");
      g.control = { ...c, ...settingsFrom({ ...settingsFrom({ mode: c.mode, durationMs: c.ms, timer: c.timer }), ...x }), version: c.version + 1, commandId: x.commandId };
      break;
    case "publish":
      await publish(room, g, x);
      break;
    case "select":
      g.selection = { r: c.r, a: c.a, uid: x.playerId, order: x.order };
      break;
    case "moderate":
      if (!g.members[x.playerId]) fail("Player not found.");
      if (!["kicked", "banned", "active"].includes(x.status)) fail("Invalid status.");
      g.moderation[x.playerId] = x.status;
      break;
    case "celebrate":
      g.celebration = { id: x.commandId, at: room.now() };
      break;
    case "adjust":
      await adjust(room, g, x);
      break;
    case "archive": {
      const archive = await storedObject(room, "archive");
      archive[String(x.id)] = x.record;
      await room.store("archive", archive);
      return { changed: false };
    }
    case "ready": {
      const key = String(x.key || "");
      if (!key || key !== g.presentation?.loadKey) return { changed: false };
      if (g.loads.key !== key) g.loads = { key, map: {} };
      if (g.loads.map[who.id] === x.status) return { changed: false };
      g.loads.map[who.id] = x.status === "failed" ? "failed" : "ready";
      break;
    }
    case "buzz":
      buzz(room, g, who, x.at);
      break;
    case "grade":
      grade(room, g, x);
      break;
    default:
      control(room, g, x);
  }
  return { changed: true };
}
__name(run, "run");
var buzzyRules = {
  init(room) {
    return initialGame(room.now());
  },
  onJoin(room, who) {
    const g = room.game;
    if (who.role === "player") {
      if (!g.members[who.id]) {
        const name = cleanName2(who.name);
        const taken = !name || Object.values(g.members).some((m) => sameName(m.name, name));
        if (taken) {
          room.send([who.id], { t: "name-taken" });
          return;
        }
        const c = g.control;
        const fromRound = c.r + (c.phase === "ready" && !g.presentation?.shown ? 0 : 1);
        g.members[who.id] = { name, at: room.now(), fromRound };
        g.scores[who.id] = 0;
      } else if (g.moderation[who.id] === "kicked") {
        g.moderation[who.id] = "active";
      }
      room.save();
    }
    broadcast(room);
  },
  onBack(room) {
    broadcast(room);
  },
  onDrop(room) {
    broadcast(room);
  },
  onGone(room) {
    broadcast(room);
  },
  async onMessage(room, who, data, { at }) {
    if (data?.t !== "cmd" || typeof data.action !== "string") return;
    try {
      const { value, changed } = await run(room, who, { ...data, at });
      if (changed) {
        room.save();
        broadcast(room);
      }
      reply(room, who, data.rid, { ok: true, value });
    } catch (error) {
      if (!(error instanceof RuleError)) throw error;
      reply(room, who, data.rid, { ok: false, error: error.message });
    }
  },
  onTimer(room, name) {
    const [kind, r, a] = String(name).split(":");
    const c = room.game.control;
    if (kind !== "expire" || Number(r) !== c.r || Number(a) !== c.a || c.phase !== "open") return;
    room.game.control = { ...c, phase: "closed", closedAt: room.now(), version: c.version + 1 };
    room.save();
    broadcast(room);
  }
};

// rooms/options.js
var options_default = {
  mode: "server",
  rules: buzzyRules,
  codeLength: 6,
  // The host leads without playing; only the viewer screen needs its own link (decision 2026-11-21: 30 players, 1 screen).
  ownerRole: "host",
  roles: {
    host: { seats: 1, plays: false, sends: true },
    player: { seats: 30 },
    viewer: { seats: 1, needsKey: true }
  },
  // Buzzy's own rules decide who plays from which question (fromRound), as on Firebase.
  lateJoin: "now",
  lateJoinChoices: ["now"],
  countdownMs: 0,
  // A ban refuses only the banned identity; the code on the big screen keeps working (F-149).
  banMakesPrivate: false,
  // A second tab of the host's browser must not become a player (F-148).
  ownerSecondTab: "refuse",
  ownerLeave: "close",
  // Long pauses are normal in a quiz (decision 2026-11-21): close after 3 hours in the background.
  idleCloseMs: 3 * 60 * 6e4,
  heartbeatMs: 2e3,
  // Buzz order: the time a buzz reached the room minus half the response time, at most 100 ms.
  rttProbeMs: 1e4,
  // A quiz evening sends few messages; this still leaves room for a long session.
  maxMessagesPerDay: 6e4
};

// worker/rooms.js
function buzzyRooms({ allowedOrigins }) {
  return createRoomServer({
    ...options_default,
    allowedOrigins,
    jurisdiction: /* @__PURE__ */ __name((env) => env.ROOM_JURISDICTION || null, "jurisdiction"),
    // The admin page (on/off, budget, notices); only when the service binding exists.
    admin: /* @__PURE__ */ __name((env) => env.NETWORK_KIT_ADMIN ? { binding: "NETWORK_KIT_ADMIN", game: "buzzy-rooms" } : null, "admin")
  });
}
__name(buzzyRooms, "buzzyRooms");

// worker/index.js
var rooms = buzzyRooms({ allowedOrigins: ["https://buzzy.trythis.one", "https://buzzy-197dc.web.app", "https://buzzy-197dc.firebaseapp.com"] });
var Room = rooms.RoomObject;
var index_default = { fetch: rooms.fetch };
export {
  Room,
  index_default as default
};
//# sourceMappingURL=index.js.map
