# SKATGO-169 handoff

## What changed

1. **"You vs. the AI" on the record of play** — under the summary lines, before the curve: for the player and the AI on the
   same cards, win rate, as declarer, how often declarer, as defender (whole percents with what they count under them)
   and points per deal; a note that all-passed deals are left out of the percentages. `recordOf`, `versusAi`.
2. **Home's progress card** — no win-rate curve. Two figures over the latest 30 deals: win rate and average per deal against
   the AI; that average day by day is the blue line (`standingOf`, `rollingOf`, `RECENT_DEALS`). Figures beside the curve
   on a computer, over it on a phone; "Always over the last 30 deals" in the dates' row, nothing said of a single deal.
3. **Weekly notes** — the newest open; the rest behind "Earlier weeks (n)", opened by a tap; no fold with one.

Web only; the profile API already sends what these need. Unit tests `lib/skat/profile.test.ts`. Charter `ui.md`.

## AC results

`tmp/accept.mjs` → `tmp/accept.txt`, 45 PASS; the owner's real record copied read-only into the ticket DB, read through a
local account aliased to it; figures compared with a separate Python count over the raw rows (`tmp/expected.json`); en/de,
1280×820 and 375×812; no game played.
1. Table: every figure equals the separate count (21% / 40%, 45% / 89%, 36% / 31%, 7% / 18%, −11 / +28) — pass. No deals: no table.
2. Home: 24% and −56 equal the separate count over the latest 30 — pass; curve ≥ 91px tall; one deal: a dot, counted as one; no
   deals and a guest as before — pass.
3. Weeks: one open, "(2)", tap opens the rest newest first; one week: no fold — pass.
4. No sideways scroll, no page errors — pass.

Mechanical defence: pass (`tmp/defence.log`, 333 tests). After it only the caption's words changed; typecheck, build, tests
and the check above rerun.

## Deviations

- The figures were first over the curve, which squeezed it to nothing in the card's fixed height; they went beside it.

## Environment

Ports: web 55169, multiplayer 56169, database 57169. No env keys changed.

## Residual

None.

## Check

1. Two "against the AI" sizes, from the look through your eyes: the table's points differ by 39 (−11 vs +28), while the curve and
   the per-day rows say about −100 per deal. Both are right and count different things: the table your own score, the curve
   SKATGO-128's formula, your score minus each opponent's, compared with the AI's the same way. Kept as you set it.
2. The home card: the two figures and the line.
3. /en/profile: the table, and the folded weeks.

## Decided for you

- No win-rate curve on home, for the reason in plan.md; the win rate is a figure.
- The line and "per deal" keep SKATGO-128's formula; every point counts the latest 30 deals up to that day.
- No "points short of the AI" row: the two points columns already say it.
- Whole percents, with what they count under them.
- The profile's own curve stays day by day.
- The look's points on what this ticket did not touch — per-day rows, the profile curve's look — left alone.
