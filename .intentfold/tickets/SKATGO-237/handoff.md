# SKATGO-237 handoff

## What changed
- League rules (`app/src/lib/skat/league.ts`): `PROMOTE_AT` 3000 → 2000; `START_AT` 1500 and `RELEGATE_AT` 0 unchanged.
  The doc comment records the reason, the retention basis and the history. Both services read this file, so the page's
  lines, the bar (0 to 2000), the "About" text and the settle rule (`standingAfter`) all follow the one number.
- Tests: `app/src/lib/skat/league.test.ts` expects 1500 / 2000 / 0 and moves at 2000; `multiplayer/test/league.test.ts`
  parks its migration-idempotence row at 1750 (between the new lines) instead of 2250, which is now past promotion.
- Charter: product.md League section (the new line, its reason, points kept), engineering.md League constants and
  scale note, ui.md League page lines and bar.
- No migration: points, tiers and `scale` (5) stay as they are.

## AC results
1. Lines on the page — PASS. Running product on 55237, a test account: Bronze card reads "Promotion at 2000", bar at
   75% (1500/2000); Silver at 1990 reads "Promotion at 2000" and "Relegation at 0"; Legend at 2400 shows no promotion
   line and no bar. About text: "Every tier starts you at 1500 points. At 2000 you go up a tier, at 0 down one."
   No "3000" anywhere on the card.
2. Promotion at 2000 — PASS. `standingAfter` unit tests (1950+86 → next tier at 1500; 1999+1 in every tier but Legend);
   the multiplayer League test settles real deals through the service with the same rule (pass).
3. New player — PASS. A fresh test account opening /league sits in Bronze at 1500.
4. Relegation unchanged — PASS. Unit tests: to 0 goes down a tier to 1500 in every tier but Bronze; Bronze stops at 0;
   Legend runs on to 2076 / 2586.
5. Existing points unchanged — PASS. No migration added; the multiplayer test runs the migration again over a scale-5 row
   and its points stay (1750). A player already past 2000 moves up on their next counted deal by the same rule.

Mechanical defence: typecheck, build, 366 app tests, client bundle, design tokens, no raw styles, SSR link, check:seo
--built, test:seo — all pass. Multiplayer check: League test failed once on the 2250 fixture, fixed, passes.

## Deviations
None from plan.md. The multiplayer fixture change was not planned: the old fixture value sat past the new line.

## Environment
Ports: web 55237, multiplayer 56237, database 57237. No env keys added, changed or removed.

## Residual
None.

## Check
1. http://localhost:55237/league (signed in) — the card shows "Promotion at 2000" and the bar from 0 to 2000.

## Decided for you
- Start stays 1500 (your 开单 on 1500 / 2000 / 0 after the retention comparison).
- Existing points are not rescaled; the one non-Legend player above 2000 in production (Gold, 2096) moves up after their next deal.
- No per-tier lines; same in every tier (SKATGO-219).
- The fresh-eyes screenshot look was skipped: the only visible change is the number, already settled by AC 1.
