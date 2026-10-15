# SKATGO-106 handoff

## What changed
- `app/src/lib/skat/sounds.ts`: `loadSounds` → `primeSounds`, run once per page from `SkatLayout`
  (`app/src/skat-layout.tsx`). It fetches the five MP3s (15 KB) at once and listens (capture) for
  pointerdown / keydown / touchend: inside that gesture it creates the AudioContext if there is none,
  starts a silent one-sample buffer (iPhone unlock), resumes it and decodes the files.
- `playSound`: plays at once when the audio is running and the kind is decoded; otherwise records the
  ask and plays it when the audio becomes ready (after decode, after resume, on `statechange`) if it is
  still within `sound.late`; older asks are dropped. Settings-off and a hidden page are checked again at
  the late start.
- `app/src/components/skat/game-table.tsx`: its own `loadSounds` effect removed.
- `app/src/theme/constants.ts`: `sound.late: 1200` (ms) — new registry value (ui.md Redline 1), see grill.md.

## AC results
Served build on 55106, multiplayer on 56106. Each `AudioBufferSourceNode.start` recorded with its
buffer's duration (deal = 0.72 s; the unlock buffer ignored).
1. **First deal heard** — PASS. `/en` → free-play link: deal sound started 321 ms (desktop) and 332 ms
   (phone, touch) after arriving at `/play`. Control, https://skatgo.com before the fix: no start at all,
   desktop and phone.
2. **Every new deal, other sounds unchanged** — PASS. Passing every bid: a card-play sound (0.338 s)
   recorded; menu → "new round" → yes: a second deal sound (deal count 1 → 2).
3. **Settings off = silent** — PASS. "Töne · Kartengeräusche" switched off on the front page, then free
   play: no start in 3 s.

Mechanical defence: PASS (typecheck, build, 130 tests, client bundle, tokens, literal grep, server bundle
links, SEO 48 pages, test:seo 25/25). Multiplayer untouched.

## Deviations
None from plan.md.

## Environment
- Ports: web 55106, multiplayer 56106, database 57106. No env keys changed.
- The local Colima profile `skatgo` was stopped (its Docker context missing); started with
  `colima start skatgo` for the local database.

## Residual
- A table opened by a full page load at its own URL (no tap before it) still gets its first deal's sound
  only if the visitor touches the page within `sound.late`; browsers do not allow sound before a gesture.
