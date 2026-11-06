# SKATGO-176 handoff

## What changed

- **Bid calculator removed** (SKATGO-157's): `game-table.tsx` loses `BidCalc`, its state, props and styles; the settings
  dialog (`frame.tsx`) loses its switch; `settings.ts` loses `bidCalc` (an old stored value in a browser is simply ignored);
  `app/messages/{en,de}.json` lose `bidcalc_label`, `bidcalc_value`, `bidcalc_null`, `settings_bid_calc`.
- **Free play's hints back for now**: `server-table.tsx` passes `hints: true` for free play as for lesson 11 — the lightbulb
  tab on the felt's left edge while it is the player's card, and the `info` hint buttons while bidding ("How high can I
  bid?"), at the skat ("Skat or Hand?"), when putting two away and when choosing the game, each opening the tip panel.
- Free play keeps the real table's few words (SKATGO-134): in `game-table.tsx` the course's long lines and long refusal
  follow `hints` only where the table has no free-play round (the course's own table and lesson 11).
- Charter amended per the request: `product.md` (free play's hints back for now, calculator gone), `engineering.md` (hints
  for lesson 11 and free play), `ui.md` (calculator section removed; free play keeps its few words).

## AC results

Production build, web 55176 / multiplayer 56176, Playwright headed (`tmp/ac.mjs`), 1280×820 and 375×812 (isMobile, hasTouch):

1. No calculator while bidding (`skat-calc` absent) and no switch or "Game value" in the settings — PASS both.
2. Player's card in free play: hint tab at x=0 on the felt's left edge; tap shows "Play ♥8. You can't beat the declarer…"
   (desktop) / "Play ♦A. The declarer is winning this trick…" (phone) — PASS both.
3. Player's bidding turn: "How high can I bid?" present; tap shows the bidding hint — PASS both. The skat and declare hint
   buttons share the same flag and were not separately reached (that needs winning the bidding: gameplay, left to you).
4. Deal of the day's table at the player's bidding turn: no hint tab, no hint button — PASS both.
5. Both viewports — as above. No page errors in free play.

Mechanical defence (engineering.md Tools): exit 0 (`tmp/defence.log`).

## Deviations

None from `plan.md`.

## Environment

Ports: web 55176, multiplayer 56176, database 57176. No env key added, changed or removed (the worktree's own
`multiplayer/.env` points its local database at 57176 for this preview only; nothing to sync back).

## Residual

None. "暂时恢复": taking the hints out again later is one flag in `server-table.tsx` plus the charter lines.

## Check

A fresh-eyes review of the screenshots raised the first three; they are the hints exactly as SKATGO-130 switched them off,
so they are left for you to judge:

1. http://localhost:55176/en/play — at your bidding turn, "How high can I bid?" (a blue button in the drawer, not a left tab)
   answers with a number, e.g. "This hand could play Clubs ♣, worth 24 as it stands — bid up to that and pass above it."
   That is the old bidding hint, not the calculator; on a phone its bubble covers the faces.
2. http://localhost:55176/en/play — at your card, the lightbulb tab at the felt's bottom-left opens the hint as a bubble at
   the top of the felt; nothing slides out from the left as a drawer.
3. The left tab is only there while you play a card; bidding, the skat and choosing the game use the hint buttons in the drawer.
4. http://localhost:55176/en/play — the bidding drawer has no calculator, and the settings no calculator switch.

## Decided for you

- Free play's table keeps its short wording with the hints back; the course's long step-by-step lines stay in the course and lesson 11 only.
- "左边抽屉" taken as what SKATGO-130 switched off: the hint tab and the tip panel it opens; the assistant chat stays gone.
