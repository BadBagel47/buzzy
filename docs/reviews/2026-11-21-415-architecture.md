# Buzzy: architecture and maintainability review (read-only)

Nothing in the repo was changed. I could not run the test suites (no `node_modules` in this checkout), so test speed and flakiness come from reading the code and the backlog. I did run `generate-ui.mjs` and `generate-ui-rules.mjs` with instrumentation, writing output to the scratchpad only.

Paths are relative to `/home/user/buzzy`; `blp/` = `buzzy-live-pilot/`.

## Findings

### 1. The publish gate runs 5 of 21 integration test files, and nothing runs on push to `main`
- **Impact:** High
- **Files:** `.github/workflows/firebase-pilot.yml:70-82`, `blp/scripts/emulators.mjs:13`, `blp/package.json` (`test:integration`)
- **Problem:** Before publishing, CI runs `test:config`, `build:pilot`, `test:pilot` and `test:pilot-ui`. `test:pilot-ui` covers only room-exit, transport-csp, room-ui, ui-refinements and reconnect. The other 16 files never run in CI: spark (the database-rules test), ui, viewer, prepared-373, round-decided-391, ai-*, host-theme-378, host-fixes-411-413 and the rest.
- **How it bites:** The full suite only runs if the working agent remembers to run it locally. A regression in buzz ordering, grading or the viewer can be published with a green workflow.
- **Evidence:** BACKLOG #404: a test in `ui.integration.mjs` was broken for a long time and "ingår inte i pilot-UI-kontrollen".
- **Improvement:** Make the `verify` job run the full `npm test` (after `generate-ui`). Add a small workflow that runs the same thing on every push to `main`, so the owner sees a red or green mark per commit without relying on the agent's report.

### 2. Integration tests run against the unminified dev server, not the bundle that is published
- **Impact:** High
- **Files:** `blp/tests/browser-support.mjs:7`, `blp/tests/production.integration.mjs:11`, `blp/tests/pilot-build.test.mjs`, `blp/src/host-theme.js`
- **Problem:** All `*.integration.mjs` files except `production` use Vite `createServer`. `test:pilot` on the real `dist-pilot` only checks the landing page and error states with Auth denied. `test:production` tests `dist/`, is not in CI, and hardcodes `/usr/bin/chromium` instead of `CHROMIUM_PATH`, so it does not run in the cloud session described in the handoff.
- **How it bites:** `host-theme.js` derives the dark theme at runtime from the CSS text, so minification changes its behaviour. #401 was exactly this: `white` became `#fff` in the build, the toggles were wrong only in production, and the tests were green.
- **Improvement:** Give `browserHarness` a switch (e.g. `BUZZY_TEST_BUILD=1`) that serves the built bundle with `vite preview`. Run at least host-theme, ui and viewer that way in CI. Fix the hardcoded Chromium path.

### 3. About 80 unguarded `replace()` calls in the main generator; only the four patch modules fail loudly
- **Impact:** High (latent)
- **Files:** `blp/scripts/generate-ui.mjs:11-124` (83 `.replace`/`.replaceAll` calls, 4 `throw`s), `blp/scripts/generate-ui-rules.mjs` (all unguarded)
- **Problem:** `ui-batch`, `viewer-host`, `host-fixes` and `ai-host` use a checked `replace()` helper; `ai-host` also checks uniqueness. The main script, which holds the most load-bearing hooks, does not. A no-op there produces a page that builds and loads but silently runs the prototype's local simulation instead of the network.
- **Load-bearing unguarded hooks:** `function handle(action){` → `BuzzyNetwork.handle`; `function buzz(id){`; `function maybeExpire(){`; the `window.BuzzyView={…}` export; the injection of `bridge.js`.
- **Current state (instrumented run):** 155 replace calls on the page, all hitting. The only miss is a harmless `replaceAll` on the player page (`generate-ui.mjs:115`). `'DESIGN LAB · A v7.52'` (line 72) matches twice and only the first is replaced.
- **Rules generator:** `generate-ui-rules.mjs:31` contains one replace that is already a silent no-op (the `control/phase` variant, made dead by `walk()`). It is harmless today, but in a security file a no-op means "the rule I meant to tighten was not tightened". The rules hash check catches unintended changes, not unintended non-changes.
- **Other blind global edits:** `replaceAll('Date.now()','gameNow()')` and `replaceAll('v7.51','v7.52')` (line 11). The first makes correctness depend on patch order: #389 in `host-fixes` deliberately adds `Date.now()` after it.
- **Improvement:** One shared `patch(html,from,to,{count=1})` helper in a small module, used by all generator scripts including the rules generator. It throws on 0 matches and on an unexpected match count. This is a mechanical one-session change with no behaviour change, and the output can be verified byte-identical against the current `host.html`/`player.html`.

### 4. Patches are anchored on text inserted by earlier patches
- **Impact:** Medium-High
- **Files:** `blp/scripts/generate-ui.mjs:29,42-45,53`, `viewer-host.mjs:5,8,19`, `host-fixes.mjs:21,26`, `ai-host.mjs:6,8,15,17`
- **Problem:** The patch modules form implicit dependency chains with no declared order.
  - Modal chain: `generate-ui.mjs:29` inserts `if(state.modal==='network-leave'…`; `viewer-host.mjs:19` anchors on that; `ai-host.mjs:15` anchors on `viewer-host`'s insertion.
  - `viewer-host.mjs:5` anchors on the output of `ui-batch-304-313.mjs:4`.
  - `ai-host.mjs:8` anchors on `${appearanceCard()}${room}`, created by `host-fixes`.
  - Three modules inject before `function renderMore(){`.
  - `generate-ui.mjs:53` rewrites the "+ New question" button after `ai-host` used the old text as an anchor.
- **How it bites:** Changing or removing an older patch (say, the viewer panel) breaks later ones. The guarded ones give a "source mismatch" error that does not say which patch produced the missing text. An agent has to run the generator and read 400 kB of single-line output to see what any function actually looks like.
- **Improvement:** (a) Add a "depends on #NNN" comment where a patch anchors on another patch's output, and have the helper from finding 3 name the patch ID in its error. (b) Commit a readable copy of the generated page script (e.g. `blp/generated/page-script.js`) with a CI check that it is current, so every patch shows up as a reviewable diff of real code.

### 5. The frozen prototype is at the end of its useful life as a patch target
- **Impact:** Medium-High (strategic)
- **Files:** `buzzy-output/buzzy_midnight_studio_v7_51.html` (375 kB; 2,150 lines CSS with 296 `!important`; 1,830 lines JS; 131 top-level functions), `blp/scripts/*.mjs`, `blp/src/room-ui.css`
- **Problem:** Every feature is written as JavaScript inside string literals inside replace calls, with no syntax checking or linting. `ai-host-page.js` shows the better pattern: a real file inserted whole.
- **What ships:** Both `host.html` and `player.html` are about 400 kB and each contains the whole prototype: host views in the player page, lab controls, `simulateGuestJoin`, and the local rule engine (`buzz`, `grade`, `openBuzz`, `stopBuzzers`, `applyScorePolicy`).
- **CSS layering:** `room-ui.css` has only 21 `!important` of its own. It wins by selector weight instead: `html[data-network-role=host] body.buzzy-design-lab.theme-a.studio-ui …` appears 121 times. Then `host-theme.js` re-derives every colour rule at runtime and adds `!important` extras on top. Predicting which rule wins takes three layers of reasoning. #399, #401 and #384 were all theme-layer surprises.
- **#411:** The root cause was prototype render code doing `hostPage.querySelector('.play-mode-switch')` while later features reused the same class for Appearance and the AI switches. The first diagnosis was wrong (BACKLOG #411), which shows how hard the code is to reason about.
- **Improvement:** Do not rewrite. Do a one-time "thaw": run the generator, commit its output as real source files (`page.js`, `page.css`, `host.html`, `player.html`), delete the patch scripts, and keep the v7.51 file as a historical reference. The existing integration suite is the safety net; the first commit can be verified byte-identical. After that every change is a normal diff. If the owner wants to keep the frozen-prototype rule, at least move all new code into real files as `ai-host-page.js` does, leaving only one-line hooks as patches.

### 6. Game rules live in four places, and the bridge falls through to local simulation by default
- **Impact:** High for #408 and #410
- **Files:** `blp/src/client.js:19-99`, `blp/scripts/generate-ui-rules.mjs`, `blp/src/bridge.js:99-172,208-257`, prototype JS, `blp/scripts/host-fixes.mjs:35-48`, `blp/src/viewer.js:54-64`
- **Where the rules are:**
  - Client-side read-modify-write transactions in `client.js` `command()`.
  - The same rules re-encoded as RTDB rule expressions, which are themselves built by string patching.
  - The prototype's local engine, which still executes for every action that `bridge.handle()` does not intercept (it returns `false` at the end, so the page handles it).
  - `bridge.project()`, which re-derives phase, `remainingAtClose`, selection and winner from the snapshot.
- **Concrete duplicates:**
  - The "decided round" condition is in `host-fixes.mjs:48` and again in `bridge.js:247`.
  - "All eligible players have buzzed" is in `bridge.js:165-167` (the host's browser sends `stop`) and in `viewer.js:63`.
  - The score clamp is in `client.js:68`, `client.js:91` and the rules' `actual` expression.
- **Rules that depend on the host's browser:** auto-stop when everyone has buzzed, `expire`, and archiving a round (`archiveCurrent`) only happen while the host tab is awake.
- **How it bites:** A new prototype action that changes game state works locally on the host, is never sent, and is overwritten by the next snapshot.
- **Improvement before the move:** Write one short rule list in `docs/` (each rule, and where it is enforced today). It becomes the specification for the network-kit `rules` object and for server tests. In server mode, auto-stop and expiry become `onMessage`/`onTimer`, the buzz order uses `at`, and archiving moves to the server.

### 7. Likely bug from two-way state mirroring: "Hidden on viewer" sticks
- **Impact:** Medium (not executed; reasoned from code)
- **Files:** `blp/src/bridge.js:15` and `:111`, `blp/tests/viewer-hidden-351.integration.mjs`
- **Problem:** `sharedSettings()` publishes `viewerQuestion = s.viewerQuestion && !s.roundViewerHidden`. `project()` then does `Object.assign(s,value.settings)` for the host too. That overwrites the host's own `s.viewerQuestion` with the derived `false`, and `privateKeys` then persists it.
- **Expected effect:** After one question marked "Hidden on viewer", the Settings toggle "Question" turns off and later questions stay hidden on viewers until the host turns it back on.
- **Test gap:** The #351 test creates a hidden and a shown question but only asserts the hidden one.
- **Why it matters here:** The lists `privateKeys` and `settingKeys` (`bridge.js:11-12`) and the rules list (`generate-ui-rules.mjs:42,56`) must be kept in step by hand. They have already drifted: the rules allow `viewerOn`, which nothing sends.
- **Improvement:** Extend the #351 test to assert that the second question shows on the viewer. Publish the per-round value under its own key (e.g. `viewerQuestionNow`), or skip host-owned keys in the `Object.assign`. Keep one table of state keys (private / shared / local) and generate the three lists from it.

### 8. The Firebase seam is decent but leaks in a dozen places
- **Impact:** Medium (directly relevant to #408)
- **Files:** `blp/src/client.js`, `blp/src/bridge.js:64,93,202,205,242,359-373`, `blp/src/entry.js:7,15,30`, `blp/src/viewer.js:259`, `blp/scripts/generate-ui.mjs:135`
- **What is good:** `getClient()` returns `{command, watch, read, serverNow, watchConnection, …}`, and `watch()` emits a normalised snapshot. `viewer.js` consumes only that snapshot and is the cleanest module in the app.
- **Leaks:**
  - `bridge.js` calls `client.read('rooms/${code}/…')` with raw database paths 12 times (control, meta, archive, private/ui, presentation, settings, members).
  - The snapshot exposes the Firebase data shape (`control.r/a/ms/startedAt/version`).
  - The 4-character code regex is duplicated in 5 source places plus the rules and the landing page patch. The decision of 2026-11-18 says codes become 6 characters.
  - The session key `buzzy-spark-ui-session` is duplicated in `entry.js` and `bridge.js`.
  - `BUZZY_RUNTIME.transport` (`'spark-'+target`) is written by the generator and read by nothing, so there is no working backend switch yet.
  - Tests reach through the seam: `read(page,'rooms/…')` and `call(page,{action})` (23 uses in `spark.integration.mjs`, 10 in `viewer.integration.mjs`).
- **Improvement before the move:** Replace the raw reads with named methods (`readControl()`, `loadArchive()`, `loadHostState()`, `isMember()`). Put the code pattern and length in one module. Write down the client interface as the contract. The network-kit client then becomes a second implementation of that contract, selected by host name (#408 trial), and the UI and viewer do not change.

### 9. #410 (new question types) would touch every fragile layer at once
- **Impact:** Medium
- **Files:** prototype `renderPlayer`/`renderPlay`/question editor (patched), `blp/src/viewer.js`, `blp/src/bridge.js:53-58,113`, `blp/src/client.js`, `blp/scripts/generate-ui-rules.mjs`
- **Problem:** A question has no schema. Its shape is implied by the prototype editor, the `q.answer`/`q.viewerContent` patches, `makePresentation()`, the player's rebuilt pseudo-question in `project()` (`bridge.js:113`) and the rules' `presentation` validation. Players see only a buzzer; an answer type needs new player UI (string patches in `renderPlayer`), separate viewer rendering, a new write path for answers, secrecy of the correct answer, and new rules.
- **Improvement:** The backlog's recommendation to build #410 with or after #408 is right. I would go further: do not build it on Firebase at all, since the rules work would be thrown away. Before #410, write the question schema in one file and build the new player answer UI as a real module (as `viewer.js` is), not as prototype patches.

### 10. Test architecture: all end-to-end, one giant test per file, coupled to internals
- **Impact:** Medium
- **Files:** `blp/tests/*.integration.mjs`, `blp/tests/browser-support.mjs`
- **Problems:**
  - 24 files each start Vite, Chromium and use the emulators, on fixed ports (5173, 9000, 9099), so nothing can run in parallel. The handoff warns about this.
  - Most files are a single `test()` with dozens of asserts, so a failure reports "the file failed".
  - Tests reach into `window.BuzzyView.state` (41 times in `ui.integration.mjs`) and prototype class names (`.quickplay-main[data-action="open"]`, `.coin-buzzer`, `.studio-modal`).
  - About 46 fixed `waitForTimeout` sleeps (10 in room-ui, 8 in ui-refinements, 7 in viewer).
  - `reconnect.integration.mjs` is recorded as intermittent (BACKLOG #404 note).
  - Tests write screenshots and JSON into `reports/` as a side effect.
  - No rule-level tests can run without a browser. `connection.test.mjs` and `runtime.test.mjs` are the only unit tests.
  - `npm test` does not run `generate-ui.mjs` first, although the narrower scripts do. On a fresh clone the HTML files are gitignored, so `npm test` fails or silently tests stale pages.
- **Improvement:** Make `npm test` generate first. Split the big files into `test()` steps or subtests as they are touched. Add a few stable `data-testid` hooks instead of prototype class names. With #408, put the rules in a pure module with fast Node tests (network-kit's smoke test loads rules without Cloudflare), and keep browser tests for UI flows.

### 11. Ad hoc globals form an undeclared two-way API between the page script and the modules
- **Impact:** Medium
- **Files:** `blp/scripts/generate-ui.mjs:30`, `blp/src/bridge.js:9,41,310`, `blp/scripts/host-fixes.mjs:45,52`, `blp/scripts/ai-host-page.js`, `blp/src/viewer.js`
- **Globals:** `BuzzyView` (21 exported functions plus the whole mutable `state`), `BuzzyNetwork` (12 members), `BuzzyRound`, `BuzzyMoveQuestion`, `BuzzyAiTopics`, `BuzzyAiPeriods`, `BuzzyAiMotion`, `BuzzyViewer`, `BUZZY_RUNTIME`, `__buzzyAiMock`.
- **Problem:** Most call sites use `?.`, so a missing or renamed member is a silent no-op. For example `window.BuzzyRound?.decided()` in `bridge.js:247` and `window.BuzzyNetwork?.maybeExpire?.()`. Load order matters: `bridge.js` reads `window.BuzzyView` at import. `afterRender()` writes into prototype DOM (`bridge.js:184,196`).
- **Improvement:** One short `docs/` list of the globals (who sets them, who reads them). In `bridge.js`, assert at startup that every expected `BuzzyView` member exists and throw with a clear message; drop `?.` where the member is required. One integration assert, "no page errors and all globals present", gives agents an early failure.

### 12. `bridge.js` is a 377-line module mixing eight concerns in shared mutable state
- **Impact:** Medium
- **Files:** `blp/src/bridge.js`
- **Problem:** Startup and retry, connection status, action routing, state projection, persistence of host UI state, round archiving, the exit flow and DOM locking share about 25 module-level `let` flags (`busy`, `held`, `local`, `blocked`, `first`, `roomEnded`, `exitTask`, `offlineShown`, `stopKey`, `expiryKey`, …). Lines are up to several hundred characters with many statements each, so diffs are unreadable and merge conflicts are whole-line.
- **How it bites:** `project()` (lines 99-172) is the piece that must be rewritten for network-kit, and it is entangled with sound effects, confetti and auto-stop.
- **Improvement:** No refactor for its own sake. When #408 starts, split along the seam that the move needs: `projection.js` (snapshot → UI state, pure and testable), `actions.js` (UI action → command) and the rest. Format touched lines one statement per line as you go.

### 13. Database rules are generated by patching generated rules, with no drift check
- **Impact:** Medium
- **Files:** `blp/scripts/generate-rules.mjs`, `blp/scripts/generate-ui-rules.mjs`, `blp/database.rules.json`
- **Problem:** `generate-ui-rules.mjs` imports the #286 base generator and then rewrites expression strings with about 25 unguarded `replace`/`replaceAll` calls. The result is committed. I confirmed the committed file equals the generated output today (sha256 `017b6984…`), but no test or CI step checks that. Both scripts write to the current directory, as `generate-ui.mjs` does, so running from the wrong folder silently writes files elsewhere.
- **How it bites:** An agent edits `database.rules.json` by hand or forgets to regenerate. The release check only compares the committed file with the console snapshot.
- **Improvement:** Guard the replaces (finding 3) and add a test that "generated rules = committed rules". Do not invest further, because these rules disappear with #408.

### 14. Stale or misleading documentation for the next agent
- **Impact:** Medium
- **Files and problems:**
  - `blp/README.md` says the pilot is "förberedd men inte publicerad", names "GPT-6.1 Sol" and refers to `/workspace` paths.
  - `blp/ARCHITECTURE.md` says the code is "strikt bundna till demo-buzzy-ui på loopback" and that nothing is published. Its data-model section is still the best description of the Firebase model, but neither file is in the handoff's document map, and neither is marked historical.
  - Root `README.md` says "En push publicerar inte automatiskt", but a push to `release` publishes (#385).
  - `docs/HANDOFF.md` is dated 2026-11-13 but describes #411-#413 (2026-11-20). It has two contradictory tool-status lines (2026-11-18: push works, tags via workflow; 2026-11-10: dispatch lacks auth). It says both "nya taggar skapas av användaren via Releases" and that `create-tags.yml` creates them. "Nästa steg" does not mention #408, #410 or #415.
  - The handoff's list of local checks omits the full suite (`npm test`) and lists only the narrow ones, which reinforces finding 1.
  - `docs/BACKLOG.md` is 169 kB with single table cells up to 4,154 characters. Every agent must load it; any edit to a row is a whole-line diff.
- **Improvement:** Mark the two `blp` documents as historical at the top, or fold the still-valid data-model section into a current `ARCHITECTURE.md` linked from the handoff. Remove the superseded handoff lines. Keep one-line statuses in the backlog table and move detail to the ID sections, as AGENTS.md already says.

### 15. Reports and old evidence mixed into the repo
- **Impact:** Low
- **Files:** `reports/` (root, committed logs from #289 next to the #410 mock-ups), `blp/reports/*` (gitignored but written by tests), `blp/scripts/preflight-local.mjs`, the `production` emulator mode
- **Problem:** It is unclear which reports are current evidence and which are history. `preflight-local.mjs` and `test:production` are not used by CI.
- **Improvement:** Move historical reports to `docs/archive/` or delete them in a housekeeping pass. Have tests write screenshots only on failure.

## Recommended order

**Do now (small, independent of the move):**
1. CI runs the full suite on publish and on push to `main`; `npm test` generates first (findings 1, 10).
2. One guarded `patch()` helper for all generators, plus a "generated rules = committed rules" test (findings 3, 13).
3. Extend the #351 test and fix the `viewerQuestion` mirroring if confirmed (finding 7).
4. Documentation clean-up (finding 14).
5. Run a few suites against the built bundle (finding 2).

**Do before the network-kit move (preparation that pays off either way):**
6. Close the seam: named client methods instead of raw paths, the code pattern in one place, the interface written down (finding 8).
7. The rule list as a specification (finding 6).
8. Committed readable generated script, or the full "thaw" of the prototype (findings 4, 5). The thaw is the highest-value structural change. It is best done before #408, because the move rewrites `handle`, `buzz`, `maybeExpire` and `project`, which are the most heavily patched hooks.

**Do during the move:**
9. Split `bridge.js` along projection / actions (finding 12).
10. Move rules to the server with fast Node tests (findings 6, 10).
11. Assert the globals contract at startup (finding 11).
12. Add the backend switch, reusing the unused `BUZZY_RUNTIME.transport`.

**Instead of (do not invest on Firebase):**
- New RTDB rules for #410; build it on network-kit (finding 9).
- Further rule-generator refinement beyond the guard and drift test (finding 13).
- Automatic room cleanup on Firebase (#332); network-kit's `cleanupMs` covers it.

## Files written outside the repo

Instrumentation scripts and generator output are in `/tmp/claude-0/-home-user/ab4d401a-d323-5b0a-b9d8-682a3d9753d2/scratchpad/` (`patch.mjs`, `patch2.mjs`, `gen/`, `rules/`). They can be deleted.