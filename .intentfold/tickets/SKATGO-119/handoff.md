# SKATGO-119 Handoff

Delivered for review (`finish: review`). No merge, deployment or production data change.

## What Changed

1. **Taller boxes** — `dims.textPost` (`calc(6lh + 22px)`) and `dims.textComment` (`calc(3lh + 22px)`) in
   `app/src/theme/shape.stylex.ts`, approved by the request (ui.md Redline 1); `TextArea` takes `size`
   (`post` / `comment`) as its minimum height and still grows with the text (`field-sizing: content`).
2. **Six deals only** —
   - `lib/skat/tournament.ts`: `DAILY_SIZES`, `DailySize`, `dailySize` gone; `DAILY_DEALS = 6` is the length;
     `DailyStatus.of` a number. `lib/daily.ts`: `DAILY_LENGTHS` gone.
   - Web: no `size` in `/api/daily/*` bodies (`daily-api.ts`); no switch, `sizeSearch`, `?deals=` on `/daily`
     and `/daily/play` (an old `?deals=12` link opens the six-deal tournament); table, result, review cache keys
     without size; copy names six deals (`daily_title`, `daily_meta_description`, `home_meta_description`,
     `daily_about_intro`, `daily_scoring_text`; `daily_size`/`daily_sizes` removed); terms and privacy wording
     (`LEGAL_UPDATED` 2026-10-23); `og/daily-{de,en}.png` redrawn for the new h1.
   - Multiplayer `src/daily.ts`: inputs take no `size` (a body naming one → 400); only six-deal days are prepared;
     every query names `size = 6` (`DAILY_DEALS`), so stored size-12 rows stay untouched; `skatOrder` keeps the
     six-deal seed. `scripts/redeal-days.mjs` deletes only six-deal rows.
3. **Forum list text** (added in development; the human chose 「摘要+底部小字」) — each card shows the start of
   its text (`excerpt`, `plainText(body, 160)`, computed by the service); one short line at the list's foot on
   what the forum is for; nothing under the title.

Charter: product.md (daily paragraph, leaderboard line), ui.md (kit rows, daily page, forum list),
engineering.md (daily runtime, routes, structure rows), operations.md (preparation, ops commands);
`multiplayer/README.md`.

## AC Results

Local: web 55119, multiplayer 56119, database 57119; headed Chromium 1280×820 and 375×812; `tmp/ac.mjs`,
screenshots in `tmp/shots/`.

1. PASS — the post box is 6.9 line-heights tall empty (desktop and phone), 15.9 with 15 lines typed; the comment
   box 3.9.
2. PASS — no switch and no twelve-deal wording (text, title, description) on `/`, `/de/taeglich`, `/en`,
   `/en/daily`; `/en/daily?deals=12` lists 6 deals with its board; `/en/daily/play?deals=12` shows "Deal 1 of 6".
3. PASS — `state`/`board`/`act` with `size: 12` or `size: 6` → 400; without size → 200; review → 409 (deal not
   finished, not a shape error); the restarted service prepared only a six-deal day (`2026-10-24/6`).
4. PASS — size-12 rows before (seeded by the previous code): `daily_deals` 2, `daily_entries` 1; after: 2 and 1.
5. PASS — with one short post the cards show its excerpt and the foot line is there; `check:seo -- --built`
   with the forum running: OK (forum list 301/302 characters).

Mechanical defence passed (typecheck, build, 286 unit tests, bundle, tokens, literal grep, SSR link,
`check:seo -- --built`, `test:seo` 28/28); `npm --prefix multiplayer run check` 27/27.

## Deviations

- Item 3 is new scope, decided by the human during development (ticket amended).
- After a fresh-eyes look: the foot line shortened to one sentence; the daily explanation's "each tournament has
  its own leaderboard" removed.

## Environment

- Ports: web 55119, multiplayer 56119, database 57119. No env key added, changed or removed.
- Deploy: multiplayer and web both change; deploy **web first** — the new web sends no `size`, which the running
  multiplayer accepts (it defaults to 6), while the new multiplayer refuses a `size` the old web still sends.

## Residual

- None from this ticket. Older, seen on the way: the empty-board line shows beside the AI's row ("no one on the
  board yet" with the AI listed), and on a phone "Points" crowds the "AI" tag in the deals table header.

## Check

1. http://localhost:55119/de/forum — sign in as a test account (console:
   `document.cookie='skatgo_test_account=anna.'+Date.now()+';path=/'`, reload), open "Neuer Beitrag": the text box's height.
2. http://localhost:55119/de/forum — the excerpt under the title and the small line at the foot.
3. http://localhost:55119/de/taeglich — the page with one tournament.

## Decided for You

- Post box about 6 lines, comment box about 3 (「不要给的行太多」).
- Old `?deals=12` links open the six-deal tournament, no redirect.
- Deploy order web first, then multiplayer.
- Analytics events keep `deals: 6`.
