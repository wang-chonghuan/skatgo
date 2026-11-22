# SKATGO-220 handoff

## What changed
- `app/src/components/skat/league.tsx` (`MeCard`): each stat's figure and words now sit in one wrapping,
  baseline-aligned row (`styles.statLine`): coin icon + number + "coins" + "+100 today"; points number +
  "League points". The promotion/relegation lines stay under the points row. The icon is centred on its
  number (`styles.statIcon`). Existing `space` tokens only; no copy, testid, logic or token change.
- `.intentfold/charter/ui.md` (The League): the sentence that put "Münzen"/"+100 heute" and "Ligapunkte"
  under the numbers now says beside them on one line, amended at the human's request.

## AC results
Production build on 55220 with local multiplayer 56220 and database 57220, test account `test_olena220`
set to Silver, 1 coin, 578 points, checked in today (the user's screenshot state). Playwright Chromium,
isMobile/hasTouch for phones; `tmp/check.mjs`, screenshots in `tmp/shots/` and `tmp/shots-new-account/`.
1. One line at phone widths — PASS. 412, 390, 375, 360 (and 1280 desktop, 320, 280): coins row
   `1 | coins | +100 today` and points row `578 | League points` each share one line.
2. Very narrow — PASS. 280 and 240: page overflow 0 px. With 100 coins at 240 px the row is too wide and
   "+100 today" moves down as a whole; with 1 coin it still fits on one line. The only element past the
   card's inner box at 240 px is the Play button (its own minimum width reaching into the card's padding,
   unchanged by this ticket, still inside the blue card).
3. Values unchanged — PASS. Card text "Silver League 1 coins +100 today 578 League points Promotion at
   3000 · Relegation at 0 Play · 4 coins a deal …", progress bar present, `data-*` values 1/1/578/true.
Mechanical defence: typecheck, build, tests, client-bundle, design tokens, literal grep, SSR link,
check:seo --built, test:seo — all passed (EXIT 0).

## Deviations
None from plan.md.

## Environment
Ports web 55220, multiplayer 56220, database 57220. No env key added, changed or removed (the worktree's
local URLs pointed at the ticket ports only).

## Residual
- At 280 px and below, "Promotion at 3000 · Relegation at 0" breaks after the "·" (existing text, not in
  this request).

## Check
1. https://skatgo.com/en/league on a phone — coins and League points each on one line.

## Decided for you
- The coins block and the points block stay as two rows on a phone (side by side only when wide, as before).
- The promotion/relegation line stays under the points row.
- When a row does not fit, a whole piece (e.g. "+100 today") moves to the next line.
