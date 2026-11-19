# SKATGO-210 handoff

## What changed
- Front page: the League tile reads "Ranked match" / "Ranglistenspiel" (`home_league`); the League page keeps its title.
- XP & win rate board: each row carries the person's League tier (`XpBoard` rows' `tier`, `multiplayer/src/xp.ts`): an
  account's `league_players.tier` under the id the board counts it as, Bronze without one; a persona's, the tier of its
  band (`personaTier`, beside `bandOf` in `multiplayer/src/league.ts`). `xp-board.tsx` shows the League board's badge
  (`/league/badge/<tier>.webp`, `dims.badge`, `radii.tag`) before the name.
- Charter ui.md: the tile's title; the XP board's row.
- `multiplayer/test/xp.test.ts`: the rows' new `tier` (one account in Platinum, the others Bronze).

## AC results
Production build, web 55210 / multiplayer 56210 / db 57210, `tmp/ac.mts`; four test accounts seeded into the ticket DB
(XP rows; tiers Bronze, Gold, Legend, none):
1. AC1 PASS — `/en` tile "Ranked match" with "New", to the League; `/de` "Ranglistenspiel".
2. AC2 PASS — 1280 and 375: every row a loaded badge; Gold → gold, Legend → legend, Bronze and none → bronze. Personas:
   `personaTier` spreads the population over all six tiers.
3. AC3 PASS — rows all 29px, the badge inside its row, the long name ends in "…".
Look through the human's eyes (fresh reviewer): OK, with two possible asks — see Check.
Mechanical defence PASS (typecheck, build, 352 app tests, client bundle, tokens, no raw styles, SSR link, SEO + 28).
`npm --prefix multiplayer run check`: 69/70, the XP test expecting rows without `tier`; corrected to the new contract,
then PASS.

## Deviations
None from plan.md.

## Environment
Ports web 55210, multiplayer 56210, database 57210. No env key added, changed or removed.

## Residual
None.

## Check
1. The badge at this size: Bronze and Gold are both brown-orange and close (the reviewer's point); same badges as the
   League board.
2. On the phone the badge takes room from the name: a long name is cut sooner ("Legende Lo…").
3. "Ranked match" on two lines in its tile, as "1 deal today" is on the phone.

## Decided for you
- Only the front page's tile is renamed; the League page keeps "League" / "Liga".
- Every name has a badge: an account that never played the League shows Bronze; an AI player its strength band's tier.
- The badge goes before the name, as on the League board; the "New" ribbon stays.
