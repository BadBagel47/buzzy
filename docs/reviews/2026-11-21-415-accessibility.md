# Buzzy accessibility and UI consistency review

## How this was checked
- The repo was not modified. The checkout had no `node_modules`, so I copied `buzzy-live-pilot` and `buzzy-output` into the scratchpad, ran `npm ci` and `node scripts/generate-ui.mjs` there, and drove the real UI with Playwright against the Firebase emulators.
- Coverage: host at 390, 320, 768, 1024 and 1280 px in light and dark; players at 390, 320 and landscape; viewer at 1920x1080, 1280x720 and portrait.
- Tools: axe-core 4.x (installed in the scratchpad only), computed styles, and contrast measured from screenshot pixels around the text.
- Everything is under `/tmp/claude-0/-home-user/ab4d401a-d323-5b0a-b9d8-682a3d9753d2/scratchpad/review-a11y/`: scripts `s1.mjs`–`s7.mjs`, raw results `s1.json`–`s7.json`, screenshots in `shots/` (called SHOTS below).
- The emulator jar cache went to `/tmp/buzzy-firebase-emulators`, the project's own default.
- "Prototype" below means `buzzy-output/buzzy_midnight_studio_v7_51.html` (frozen); fixes belong in `buzzy-live-pilot/src/room-ui.css` or the generator patch modules.

## Findings

### 1. Host keyboard focus ring is nearly invisible in both themes — High
- **Where:** host, all buttons, tabs, switches and fields. Ring colour `#90acff` comes from the prototype (lines 1357, 2041 and the general button rule). In dark, `src/host-theme.js:51` maps `outline` as a border, which dims it to `rgb(75,90,134)`.
- **What fails:** WCAG 2.4.7 and 1.4.11 (3:1) for keyboard users on a laptop.

| Theme | Ring against | Ratio |
|---|---|---|
| Light | card `#e3ebf5` | 1.83:1 |
| Light | page background | 1.16:1 |
| Light | text field (ring `#c5d3ff`) | 1.24:1 |
| Dark | card | 2.23:1 |
| Dark | blue primary button | 1.0:1 |
| Dark | active tab | 1.02:1 |

- **Evidence:** `s5.json` → `ringsLight`, `ringsDark`; SHOTS/`ring-light.png`, SHOTS/`ring-dark.png`.
- **Fix:** one rule in `room-ui.css` for host `:focus-visible` using the ring the header icon buttons already have (`#315de8`, 4.2–4.9:1 on light, `room-ui.css:34`). In `host-theme.js`, treat `outline` as `text` so it becomes a light tint in dark.
- **Related:** on touch, `room-ui.css:233` removes the outline from inputs too, so a tapped text field shows no focus change at all (`s5.json` → `touchFocus`: border and shadow identical before and after). Exclude `input, select, textarea` from that rule.

### 2. Viewer: white text on the green "Correct" row and leaderboard first place fails contrast — High
- **Where:** `src/viewer.css:83` (`.row.ok`), `:113` (`.lb .row.first`), `:82` (`.row.turn`).
- **What fails:** WCAG 1.4.3 even at the large-text 3:1 threshold, on the screen meant to be read from across a room.

| Element | Ratio |
|---|---|
| Correct row: name | 2.13–2.44:1 |
| Correct row: rank | 2.0–2.3:1 |
| Correct row: "✓ CORRECT" tag | 2.22–2.73:1 |
| Correct row: time | 2.67–3.25:1 |
| Leaderboard first place: name | 2.09–2.36:1 |
| "Answering" row: name and rank | 2.6–3.4:1 |

- **Evidence:** `s5.json` → `viewerOk`, `viewerTurn`; `s6.json` → `lbC`; SHOTS/`viewer-ok-1080.png`, SHOTS/`viewer-lb-1080.png`.
- **Fix:** keep the palette but start the gradients at the darker stop. White on `--ok` `#15916b` is 3.7:1; use `linear-gradient(155deg,var(--ok),#0e7455)` and `linear-gradient(155deg,var(--turn),#1c557d)`.

### 3. Player buzzer face: white labels on the green coin fail contrast — Medium
- **Where:** player coin, prototype coin styles around lines 971 and 1064.
- **What fails:** WCAG 1.4.3 at the 3:1 large-text threshold.
  - "BUZZ!" on the green open state: 2.22–2.98:1.
  - "BUZZED!" on the green correct flash: 2.5–3.0:1.
  - "#1" stamp on teal: 2.65–3.5:1.
- **Evidence:** `s5.json` → `playerOpen`, `playerBuzzed`, `playerCorrect`; SHOTS/`player-open.png`.
- **Fix:** darken the green coin gradient to the host's "Activate buzzers" green (`rgb(22,134,85)`, 4.7:1 with white), via `room-ui.css` under `html[data-network-role=player]`.

### 4. Players get no live announcement when buzzers open, when it is their turn, or of the verdict — Medium (High for screen-reader users)
- **Where:** player view, prototype `renderPlayer` (~line 3571 onward).
- **What fails:** WCAG 4.1.3. The only thing that changes is the buzzer's `aria-label` ("Get ready" → "Buzz now" → "Buzz registered" → "Your turn to answer" → "Points +1"), which is not announced unless focus sits on the button, and not reliably then.
- **Evidence:** a MutationObserver on all live regions during open → buzz → incorrect → correct saw only `#network-status` change (`s4.json` → `liveOnOpen`, `liveOnBuzz`, `liveOnIncorrect`, `liveOnCorrect`, `adaLabels`).
- **Fix:** add one visually hidden `role="status"` element in the player view and write the same strings already used for the `aria-label` into it when they change. No new copy is needed.
- **Note:** this is a code-level gap, independent of the paused manual test #253.

### 5. Live regions elsewhere are missing or flood — Medium
- **Viewer floods:** the whole viewer root is `aria-live="polite"` (`scripts/generate-ui.mjs:171`). Inside it, `role="timer"` rewrites its text and `aria-label` every second and every buzz row is re-rendered: 20–27 mutations per row within about 1.5 s (`s4.json` → `liveOnIncorrect`). Remove `aria-live` from `#viewer`; keep `#notes` and `#viewer-status`.
- **Host is silent on buzzes:** the buzz list has no live region; the only one in Play is `aria-live` on the main `<button>` (prototype line 3345). Add a hidden `role="status"` saying "Ada buzzed first".
- **Status rewritten constantly:** `#network-status` is re-set with identical text about four times a second (12–14 writes in 3 s; `hostLive3s`, `adaLive3s`). Only write when the text changes (`src/bridge.js`).
- **AI generation:** the panel sets `aria-busy` (`scripts/ai-host-page.js:53`) but has no status region, and focus stays on Close when the review appears (`s5.json` → `aiBusy`, `aiFocus`).
- **Seen in passing:** a player's status briefly read "The room is unavailable or this view no longer has access" when the host moved to the next question (`s4.json` → `adaLive3s`).

### 6. Host light theme: secondary text below 4.5:1 — Medium
- **Where:** host, light theme only. Dark passes everywhere (5.2–8.2:1).
- **What fails:** WCAG 1.4.3 (axe `color-contrast`).

| Element | Ratio | Size |
|---|---|---|
| Question card preview and meta (`#617b97` on `#d4e0ed`) | 3.27:1 | 14 px |
| Queue counter "4 questions" | 3.75:1 | 14 px |
| Question card overline "Question 1" | 3.87:1 | 14 px |
| Buzz count "2/2 buzzes · 2 active" (`#64758e`, prototype line 172) | 3.9:1 | 14 px |
| AI demo and notice amber (`#b66d15`, `room-ui.css:316`) | 3.02–3.36:1 | 14 px |
| Editor help "Host only · Not shown to players" | 4.07:1 | 12 px |
| Buzz time | 4.19–4.45:1 | 12 px |
| Empty messages, eyebrows on inner panels, player detail line, leaderboard "pts", overview subtitle | 4.34–4.47:1 | 12–14 px |

- **Evidence:** axe output in `s2.txt` and `s3.txt`; `s5.json` → `hostLightDone`, `aiReviewAxe`.
- **Fix:** use the existing darker secondary colour `#314964` (the prototype's own `.library-card-preview` colour at line 1569, about 7:1) for these classes in the shared rule at `room-ui.css:106–110`. Use the darker orange already used for text elsewhere, or `#8a4f0a`, for the AI notice.

### 7. Offline host: 11 controls are blocked but look and feel fully enabled — Medium
- **Where:** `src/bridge.js:189` and `:314`; `src/room-ui.css:373–374`.
- **What fails:** unclear state. After 8 s offline the main button ("STOP BUZZERS" / "ACTIVATE BUZZERS") has `aria-disabled="true"` but opacity 1 and `cursor:pointer`. A click is swallowed with no toast or message. The only cue is the small word "Offline" in the header and a notice the host can dismiss.
- **Evidence:** `s4.json` → `offMain`, `offToast`, `offNav`; SHOTS/`host-offline.png`.
- **Fix:** keep the no-flicker rule for brief locks, but when the offline notice is showing set an attribute on `<html>` and apply the existing #403 faded style (`opacity:.42`, `not-allowed`) to `[data-network-blocked]`. On a blocked click, show the existing toast with "Disconnected — waiting to reconnect".

### 8. Text below the 14 px host rule, and very small player text — Medium
- **Host, primary actions:** the grade buttons "✓ Correct · +1" and "✕ Incorrect · 0" render at 11.3 px on a 390 px phone (prototype line 1230, `clamp(11px,2.9vw,13px)`; 10.5 px under 355 px, line 1252).
- **Host, secondary text:** "ANSWERING NOW", buzz time and rank at 12 px; Round overview at 10–12 px (`overview-status` 10 px at line 208, `overview-source` 11 px at line 1665, subtitle and points 12 px); editor help at 12 px.
- **Player:** "ROOM" label 9 px (line 853); live feed row 12 px and "is answering…" 10.9 px (lines 478–481). That feed is the only place a player sees who is answering.
- **Evidence:** `s6.json` → `smallPlay`, `smallOverview`, `small-questions`, `smallPlayer`; SHOTS/`host-buzzed.png`, SHOTS/`host-round-overview.png`.
- **Fix:** add these classes to the shared minimum at `room-ui.css:106` (`--host-small-text`); the grade buttons are 145x45 px and have room for 14 px. Raise the player feed to 14 px and the "ROOM" label to 11–12 px.

### 9. Host tab bar does not expose the current tab; player page has no landmarks or heading — Medium
- **Where:** prototype line 2663 renders `<div class="nav">` with four `<button>`s; the current one is marked only by `class="active"`.
- **What fails:** WCAG 4.1.2 and 1.3.1. There is no `nav` landmark, no `aria-current`, and no label on the bar. The player page has no `main` and no `h1` (axe `landmark-one-main`, `page-has-heading-one`).
- **Evidence:** `s6.json` → `nav`, `playerLandmarks`.
- **Fix:** in a generator patch, render `<nav class="nav" aria-label="Host sections">` and add `aria-current="page"` to the active button. Wrap the player `.phone` in `<main>` and give it a visually hidden `<h1>`.

### 10. Keyboard focus drops to `<body>` after two common Play actions — Medium
- **Where:** prototype lines 3940 (`set-timer:`) and 4072; the Quick Play content toggle (`set-play-mode:quick`).
- **What fails:** WCAG 2.4.3.
  - Choosing a timer preset with Enter closes the editor and focus lands on `body`.
  - Opening "Question content" from the Quick Play button also drops focus to `body` instead of moving to `#quick-text`.
  - The next Tab restarts from the header.
- **Evidence:** `s4.json` → `popAfterSet`, `quickPanelFocus` (both "BODY"). Opening the option editor itself keeps focus correctly.
- **Fix:** after `set-timer:` and `data-points`, refocus the `option:*` button that opened the editor; after opening the content panel, focus `#quick-text`. The existing modal focus-restore helpers (`captureDialogFocus` / `reconcileDialogFocus`) already do this for dialogs.
- **Also:** the option buttons have `aria-expanded` but no `aria-controls="fact-editor"`.

### 11. Player in landscape: the buzzer sits below the fold — Medium
- **Where:** player at 667x375.
- **What fails:** the main control is not fully visible without scrolling. The buzzer is 138 px, spans y=261–399 in a 375 px viewport, and the page scrolls to 471 px. The question box keeps its portrait height.
- **Evidence:** `s4.json` → `cyBuzz`; SHOTS/`player-open-landscape.png`. At 320x480 portrait it fits (147 px, bottom at 408).
- **Fix:** in `room-ui.css` under `html[data-network-role=player]`, add `@media (orientation:landscape) and (max-height:480px)` putting the question box and buzzer side by side, or capping the question box height so the coin fits `100dvh`.

### 12. Viewer with reduced motion: the countdown ring shows empty from the first second — Low
- **Where:** `src/viewer.css:174–177` sets `animation-duration:.01ms!important` on everything, which finishes the `drain` animation (`:60`) instantly.
- **What fails:** with 9 s left the ring is fully drained (`stroke-dashoffset:289px`) while the number still counts. Normal motion at the same moment: 46.9 px.
- **Evidence:** `s4.json` → `rmRing` vs `normRing`; SHOTS/`viewer-timer-rm.png`.
- **Fix:** exclude the ring: `.ring .bar.run{animation-duration:var(--dur,10s)!important}` inside the reduced-motion block. It is a progress indicator, not decoration.

### 13. Viewer in portrait: the winner's row is cropped to its "✓ CORRECT" tag — Low
- **Where:** `src/viewer.css` portrait block (`@media (max-aspect-ratio:1/1)`), viewer on a phone or portrait tablet.
- **What fails:** after a correct answer with more buzzes queued, the list scrolls so only the bottom strip of the green row is visible; the winner's name and rank are hidden. Landscape shows the full row.
- **Evidence:** SHOTS/`viewer-ok-tablet-portrait.png` (820x1180), SHOTS/`viewer-correct-portrait.png` (390x844); compare SHOTS/`viewer-correct-1080.png`.
- **Fix:** in the portrait block give `.buzzes` a minimum height of two enlarged rows, or scroll so the `.ok` row is the top row.
- **Seen in passing:** after a correct verdict the next buzzer is shown as "ANSWERING" on the viewer while the host's main button says "NEXT QUESTION".

### 14. Wording and capitalisation are inconsistent for the same things — Low
- **Capitalisation:** Title Case in "Quick Play Questions", "Prepared Questions", "Retry Question" (prototype line 3300) and "Buzz Order" (player dialog, line 2591). Sentence case in "Round overview", "Buzz results", "New question", "Generate questions" and "Buzz order" (viewer).
- **Close buttons:** "Close dialog", "Close leaderboard", "Close Round overview", "Close buzz order", "Close quick settings", "Close connection message"; glyph "✕" in dialogs but "×" in the connection notice.
- **Same concept, different words:**
  - "Incorrect" (grade button, option chip) vs "wrong" ("0 wrong", "Wrong-answer penalty").
  - "pts" vs "points" ("Score: 0 points", "0 points").
  - "Timer" / "Countdown" / "Question timer" / "buzz timer".
  - "room" / "game" / "session" ("End game", "Leave room", "Kick from session", "Session and history").
  - "Copy room link" vs "Copy link".
- **Mismatched label:** the header icon is labelled "Leave room" but opens "End game and leave?".
- **Stale hint:** the +1 and 0 option chips say "Finish this round to change" in their `aria-label` while they are enabled (`s7.json` → `disabledFact`).
- **Colour:** the host "Correct" button is the blue primary, while correct is green on the player, the viewer and the option icons.
- **Evidence:** `s3.json` → `wordsPlay`, `words-more`, `wordsManage`, `wordsQlist`.
- **Fix:** pick sentence case, one term per concept and one close label ("Close"), and apply through `replace` patches in `scripts/host-fixes.mjs`.

### 15. Narrow and zoomed layouts, small targets, and weak switch off-state — Low
- **Questions at 320 px:** the card text column is about 90 px wide. A long title wraps to 9 lines, "Room mode" wraps, and the Availability select truncates to "All questi" (SHOTS/`host-questions-320x568.png`). Fix: stack `.library-actions-column` under the copy below 360 px (`room-ui.css`).
- **Host at 400 % zoom (320x256):** the header (65 px) plus the fixed tab bar (about 61 px) leave roughly 120 px of content (SHOTS/`host-play-320x256.png`). Fix: make the tab bar non-fixed when `max-height:420px`.
- **Targets under 44 px** (all at or above 24 px, so WCAG 2.2 AA passes):
  - buzz-row pick buttons 245x27;
  - dialog close buttons 37–38;
  - option-editor close 34x34;
  - header status button 84x36;
  - "Manage" 78x36;
  - AI chips 36 high;
  - AI review switches 45x27, not wrapped in a label.
  
  Evidence: `s2.txt` and `s5.json` → `aiReviewT`. Fix: `min-height:44px` on `.btn.sm`, `.lb-close` and `.mini-close`; make the whole buzz row the hit area.
- **Switch off-state:** track `rgb(195,205,221)` on card `rgb(237,243,250)` is 1.45:1 in light; in dark the border is about 1.9:1 (`s5.json` → `toggleLight`, `toggleDark`). Position still shows state; add a 1 px border in the `#a6bdd7` already used for buttons.
- **Verdict on graded rows:** only a small grey "✕" or "✓" after the name, with no colour or text (SHOTS/`host-decided.png`). Fix: reuse `library-status--active` and the danger pill.
- **Toast position:** the toast sits mid-screen over content (SHOTS/`host-questions-list-1280.png`).

## Checked and found OK
- **Start page:** axe clean at 390 px. Errors use `aria-invalid`, `aria-describedby` and a polite live region, and focus moves to the field. Focus rings are 3 px `#80a8ff` on dark. No overflow at 320 px. The Privacy `<dialog>` takes focus and returns it.
- **Dialogs:** Viewer screen, Leave/End game, QR, Round overview, AI questions, Game history, Manage player, host and player Leaderboard, player Buzz order and player Leave all have `role="dialog"`, `aria-modal` (QR is a native `<dialog>`) and a label. Focus moves in, 40 Tab presses never escaped, Escape closes, and focus returns to the opener (`s2.txt` "dlg" entries).
- **Switches and segmented controls:** all 16 settings switches are `input[type=checkbox][role=switch]` inside labels 59–122 px tall with clear names. Segmented controls (theme, play mode, viewer mode) use `aria-pressed` within a labelled group. Selects and number inputs are labelled and 44 px high. Icon buttons have names.
- **Keyboard on the player:** Tab reaches leaderboard, leave, info toggle and buzzer. Space buzzes. The focus ring is visible (`#b8d4ff` / `#90acff` on dark). The disabled buzzer uses `aria-disabled` and stays focusable.
- **Dark host theme text:** no axe contrast violations on Play, Players, Questions, Settings, the viewer dialog or QR. The primary button is 4.7:1.
- **Player and viewer body text:** 7–15:1. The viewer incorrect row is 7.6:1.
- **Reduced motion:** covered throughout host and player (about 40 media blocks plus JS checks); the only defect is the viewer ring in finding 12.
- **Zoom:** not blocked (no `user-scalable=no` or `maximum-scale`). No horizontal overflow on any host tab at 320, 768, 1024 or 1280 px, on the player at 320 px, or in the viewer and QR dialogs at 320 px.
- **Viewer at distance:** at 1080p the smallest text is 26.6 px (2.5 % of height); question text is 9.6 %, join URL 6 %, room code 13 %. Long names ellipsise without breaking rows. Join and ended states are clear.
- **Offline player and ended game:** the player gets a clear full-screen "Disconnected — waiting to reconnect" at 11.4:1; "Game ended" is a proper dialog with focus inside; the viewer shows a status message.
- **Page errors:** none in any run.
- **Not re-reported, as decided:** #409 text selection, #253 manual screen-reader test, #380 empty Players sections.
