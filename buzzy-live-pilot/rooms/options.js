// #408: Buzzy's room options for network-kit, in a file of their own so the kit's
// smoke test and the rules tests can load them outside Cloudflare.
import {buzzyRules} from './rules.js';

export default {
  mode: 'server',
  rules: buzzyRules,
  codeLength: 6,
  // The host leads without playing; only the viewer screen needs its own link (decision 2026-11-21: 30 players, 1 screen).
  ownerRole: 'host',
  roles: {
    host: {seats: 1, plays: false, sends: true},
    player: {seats: 30},
    viewer: {seats: 1, needsKey: true},
  },
  // Buzzy's own rules decide who plays from which question (fromRound), as on Firebase.
  lateJoin: 'now',
  lateJoinChoices: ['now'],
  countdownMs: 0,
  // A ban refuses only the banned identity; the code on the big screen keeps working (F-149).
  banMakesPrivate: false,
  // A second tab of the host's browser must not become a player (F-148).
  ownerSecondTab: 'refuse',
  ownerLeave: 'close',
  // Long pauses are normal in a quiz (decision 2026-11-21): close after 3 hours in the background.
  idleCloseMs: 3 * 60 * 60_000,
  heartbeatMs: 2_000,
  // Buzz order: the time a buzz reached the room minus half the response time, at most 100 ms.
  rttProbeMs: 10_000,
  // A quiz evening sends few messages; this still leaves room for a long session.
  maxMessagesPerDay: 60_000,
};
