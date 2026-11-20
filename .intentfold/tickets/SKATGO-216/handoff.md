# SKATGO-216 handoff

## What changed

- **The rule** (`app/src/lib/skat/league.ts`): a deal's League points are the seat's Seeger-Fabian score minus the
  average of the other two seats' (`dealPoints`), rounded to a whole number — 36 won: declarer +86, each defender −43;
  lost: −162 / +81 / +81; all passed 0; a table sums to 0 (+1 at most from a half). `DEAL_POINTS` and the 40-card-point
  line (`SAVE_AT`, outcome `saved`) are gone; the outcome stays only to name the result line.
- **Leaving** (`forfeitPoints`): a deal left or away a minute is their side's loss of the game played out — their own game
  lost at its value when their seat declared, the declarer's game made against them when another did, 0 when all passed.
- **Lines**: `PROMOTE_AT` +1000, `RELEGATE_AT` −1000; Bronze floor 0 and Legend without promotion unchanged.
- **Service** (`multiplayer/src/league.ts`): every seat scored with these, seen to the end, left, or away; `store.ts`
  migrates `league_players` from scale 2 to 3 once, points to 0, tier and coins kept, new rows on 3.
- **Web**: the 40-line result reason removed; rules lines EN/DE: "Each deal: your Seeger-Fabian score minus the average of
  the other two players’. A game worth 36 won as declarer: +86 for you, −43 for each defender." / "+1000 points: up a
  tier. −1000: down one…" (DE likewise). The bar and the distances follow the constants.
- **Tests**: unit (formula, rounding, zero sum, forfeit, ±1000, Bronze, Legend); service League test checks every scored
  deal against its review's scores, the two forfeits against `forfeitPoints` of the game played, and the reset to scale 3.
- **Charter**: `product.md` (the rule, the human's words, the forfeit, ±1000, the reset), `ui.md` (result line, bar).
- **Forum post 7**: its League part rewritten for Seeger-Fabian against the table on the same 390 deals (title unchanged):
  won game +100, lost −172, beaten declarer +84, lost defence −54 on average; defending about −37 a deal, declaring about
  +1 (+58 at the AI's level), −3400 over 100 deals of defending only; good hands declared +15 a deal, not declared −13;
  "+1000 points to move up". Replaced at close; old body `.intentfold/tmp/SKATGO-216/forum-post-7-before.md`.

## AC results

1. **SF minus the others' average** — PASS. Unit test (7 cases); service League test (169 s): the three deals seen to
   the end stored with `dealPoints` of each review's scores; the "away, back within the minute" deal likewise.
2. **Leaving is their side's loss** — PASS. Unit test; service test: the deal left and the deal away a minute stored with
   `forfeitPoints` of the game played out, below 0.
3. **±1000** — PASS. Unit test; production build 55216 with the service on 56216: test account in Gold at 250 reads
   "750 to promotion · 1250 to relegation", bar at 62%; a new one in Bronze "1000 to promotion" (PC and phone,
   `tmp/me-*.png`).
4. **Points from 0** — PASS locally: service test, a scale-2 row migrates to points 0, scale 3, tier and coins kept, once.
   Production checked after the release (cap4).
5. **Rules text** — PASS. `/en/league`, `/de/liga`, 1280 and 375: the lines quoted above; no +30 / −20 / 40.
6. **The article** — checked after the release (cap4), against the live page.

Mechanical defence (engineering.md): passed — typecheck, build, 353 unit tests, client bundle, design tokens, literal
grep 0, SSR link, SEO and its tests (`tmp/mech.log`); multiplayer typecheck and build passed.

The look through the human's eyes: not run as a separate review — the visible change is two rule lines and the
distances, quoted above, plus the numbers each deal shows.

## Deviations

None from `plan.md`.

## Environment

Ports used: web 55216, multiplayer 56216, database 57216. No env key added, changed or removed (the worktree's
`multiplayer/.env` points at 57216 locally only; the web was started with `MULTIPLAYER_URL` set on the command line).

## Residual

None.

## Check

1. https://skatgo.com/en/league — the rules under "What is the League" and the distances to promotion / relegation.
2. A League deal's result line — the points as Seeger-Fabian against the table.
3. The forum article "declare or defend" — the League part in the new scoring.

## Decided for you

- A half point rounds to the nearest whole number (an odd game value won gives the defenders −38.5 → −38).
- Leaving or away a minute: your side loses the game played out (your own game at its value, or the declarer's game made
  against you); all passed 0.
- Everyone's League points start again from 0 on the new scale; tiers and coins stay.
- The rules line carries one example: 36 won, +86 for the declarer, −43 for each defender.
- The article keeps its title and sample; only its League part and the numbers that follow change.
