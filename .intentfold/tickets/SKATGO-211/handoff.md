# SKATGO-211 handoff

## What changed
- The XP board's tier (`multiplayer/src/xp.ts`): an account's own League tier, and Bronze for everyone without a League
  standing — an account that has not played it, and every persona. SKATGO-210's `personaTier` (a persona's strength band)
  is gone (`multiplayer/src/league.ts`).
- `multiplayer/test/xp.test.ts`: a persona of the Legend band on the board is Bronze (fails on the code before).
- Charter ui.md: the XP row's badge.

## AC results
Production build, web 55211 / multiplayer 56211 / db 57211, `tmp/ac.mts`, 1280×820; seeded into the ticket DB: personas of
the Legend and Gold bands, an account in Gold, one without a League row:
1. AC1 PASS — both personas Bronze.
2. AC2 PASS — the Gold account Gold, the other Bronze.
Mechanical defence PASS (typecheck, build, 353 app tests, client bundle, tokens, no raw styles, SSR link, SEO + 28);
`npm --prefix multiplayer run check` PASS (70).

## Deviations
None from plan.md.

## Environment
Ports web 55211, multiplayer 56211, database 57211. No env key added, changed or removed.

## Residual
None.

## Check
1. The front page's XP board: the AI players' rows now Bronze.

## Decided for you
- Every persona is Bronze on the XP board, whatever strength it plays at League tables: it has no League standing.
