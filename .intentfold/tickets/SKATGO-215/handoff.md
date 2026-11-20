# SKATGO-215 handoff

## What changed

- **The rule** (`app/src/lib/skat/league.ts`): `DEAL_POINTS.defended` −1 → −2 — a lost defence costs 2, still 0 with 40
  card points or more (the declarer held to 80); a Null game, with no card points, costs the 2. `left` (leaving or away a
  minute as a defender) −1 → −2, so leaving never costs less than playing a lost defence out; declaring still −3. The
  multiplayer service scores with this shared table, so it carries the change. Points already earned are not rescored.
- **Words**: the League page's rules line (`league_about_deal`, EN/DE): "lose as a defender −2, or 0 with 40 card points
  or more" / "als Gegenspieler verloren −2, mit 40 Augen oder mehr 0". No other text carries the number; each result
  shows the server's points.
- **Tests**: the unit test's table and the Null case; the service League test's leaving and away cases (−3 / −2) and its
  "counted as it came out" set; comments in the service code.
- **Charter**: `product.md`, the League paragraph — −2 with the human's words and why, and leaving at −2.
- **The forum article** (production `forum_posts` 7, "declare or defend"): numbers recomputed for −2. The 352-deal sample
  could not be rebuilt exactly — guests who signed in later brought their earlier deals into the same dates — so every
  number is recomputed on today's sample of those dates, 390 deals from 11 players (rates as before: declarer 82%,
  players beat the declarer 12%, declared a quarter and won 64%). Defending about −0.5 a deal (was −0.12), −48 over 100
  deals of defending only (was −11), good hands not declared about −0.2 a deal and −18 over 100 (were +0.1 and +10); a
  game won four times in ten already beats defending. Replaced in production at close (cap4), old body backed up
  (`.intentfold/tmp/SKATGO-215/forum-post-7-before.md`, new `article-declare-or-defend-v4.md`).

## AC results

1. **−2, 40+ is 0, Null −2** — PASS. `npm --prefix app run test`: 353 passed, `league.test.ts` among them (−2 in the
   table, `defended` at 39 and for a Null game, `saved` at 40).
2. **Leaving as defender −2, declaring −3** — PASS. `multiplayer/test/league.test.ts` (170 s): the deal left during a
   sitting and the deal away a minute are stored −3 declaring, else −2. `test/xp.test.ts` (League tier on the board) passed.
3. **Rules text EN/DE** — PASS. Production build on 55215, `/en/league` and `/de/liga`, 1280 and 375, rules open: the
   −2 line quoted above, no "−1". Screenshots `tmp/about-EN.png`, `tmp/about-DE.png`.
4. **The article** — checked after the release (cap4), against the live page.

Mechanical defence (engineering.md): passed — typecheck, build, 353 unit tests, client bundle, design tokens, literal
grep 0, SSR link, SEO and its tests (`tmp/mech215.log`).

The look through the human's eyes: not run as a separate review — the visible change is one number in one line, quoted above.

## Deviations

The article's sample is 390 deals, not the 352 it named (see above). Otherwise none from `plan.md`.

## Environment

Ports used: web 55215, multiplayer 56215 (not started; the League test runs its own), database 57215. No env key added,
changed or removed (the worktree's `multiplayer/.env` points at 57215 locally only).

## Residual

None.

## Check

1. https://skatgo.com/en/league — the rules under "What is the League": −2 for a lost defence.
2. The forum article "declare or defend" — the rule and its numbers at −2.

## Decided for you

- Leaving or being away a minute as a defender costs −2, like a lost defence (it was −1), so leaving never pays.
- A lost Null defence costs −2.
- Points already earned stay as they are; the rule counts from the release.
- The article's numbers are recomputed on 390 deals of the same dates, since the original 352 could not be rebuilt.
