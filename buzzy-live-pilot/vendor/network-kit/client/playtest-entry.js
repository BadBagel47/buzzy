// A light entry for Playtest (F-096): pages import this instead of the whole
// client. Without a tester link (`#nk-tester=` in the address, or one kept from
// before) it loads nothing more and makes no request; with one it loads
// Playtest (and Playtest Remote only when it is opened).
//
//   import { startPlaytest } from './vendor/network-kit/client/playtest-entry.js';
//   startPlaytest({ admin, items, version, context });

const TOKEN_KEY = 'nk-playtest:tester';

/** Has this browser a tester link, in the address or kept from before? */
export function hasTesterLink(win = globalThis.window) {
  if (/(?:^#|&)nk-tester=pt_/.test(String(win?.location?.hash ?? ''))) return true;
  try {
    return Boolean(win?.localStorage?.getItem(TOKEN_KEY));
  } catch {
    return false;
  }
}

/** Open test (F-118): does the address ask for `?record` or `?report`? */
export function asksOpenTest(win = globalThis.window, which = null) {
  const q = new URLSearchParams(String(win?.location?.search ?? ''));
  return which ? q.has(which) : q.has('record') || q.has('report');
}

/**
 * Starts Playtest when this browser has a tester link, or the address has
 * ?report and the game's Open test is on (F-118); otherwise resolves to null
 * at once, without a request.
 */
export async function startPlaytest(options = {}) {
  const win = options.window ?? globalThis.window;
  if (!hasTesterLink(win) && !asksOpenTest(win, 'report')) return null;
  const { startPlaytest: start } = await import('./playtest.js');
  return start(options);
}

/** What a game shows the other players while a browser in the room records (F-092, owner Q8). */
export const RECORDER_NOTICE = 'This match is being recorded for a playtest.';
/** The same when the recording was started with *Spela in* and took the last two minutes along (D-126). */
export const RECORDER_NOTICE_LOOKBACK = 'This match is being recorded for a playtest, including the last two minutes.';

/**
 * Starts Playtest Recorder (F-092) when this browser has a tester link, or the
 * address has ?record or ?report and the game's Open test is on (F-118);
 * otherwise resolves to null at once. The tester link's token must already be
 * kept (startPlaytest takes it out of the address, so start that first).
 */
export async function startRecorder(options = {}) {
  const win = options.window ?? globalThis.window;
  if (!hasTesterLink(win) && !asksOpenTest(win)) return null;
  const { startRecorder: start } = await import('./recorder.js');
  return start(options);
}
