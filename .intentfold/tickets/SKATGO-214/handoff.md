# SKATGO-214 handoff

## What changed

- **The rule** (`app/src/lib/skat/league.ts`): `SAVE_AT` 31 → 40 — a lost defence is 0 when the defenders took 40 card
  points or more (the declarer held to 80), else −1; a Null game −1 as before; everything else unchanged. The
  multiplayer service scores League deals with this shared `dealOutcome`, so the service carries the change.
- **Words**: the League page's rules line names 40 (`league_about_deal`, EN/DE); the result line for a saved defence
  is "The declarer made it – 80 card points at most" / "Der Alleinspieler hat gewonnen – höchstens 80 Augen" (it said
  Schneider, which 40 is not).
- **Tests**: the unit test at 31 and 39 (−1) and 40 (0); comments in the service test and code.
- **Charter**: `product.md` (the rule, with the human's words) and `ui.md` (the result line).
- **The forum article** (production `forum_posts` 7, "declare or defend"): rewritten for 40 on the same 352 deals —
  defending about −0.12 a deal (was +0.06), −11 over 100 deals of defending only (was +5), not declaring good hands about
  +0.1 a deal and +10 over 100 (were +0.2 and +20); replaced in production right after the release, the old body backed
  up (`tmp/article-declare-or-defend-v3.md`, backup at close in `.intentfold/tmp/SKATGO-214/`).

## AC results

1. **The rule** — PASS. `npm --prefix app run test`: 353 passed, the new case among them. `npm --prefix multiplayer run
   check`: 69 passed; the League test timed out twice at its "away / next deal" step in slow runs (375 s), after its
   per-deal scoring check had passed; rerun alone it passed (168 s), as on the base commit (168 s).
2. **The rules text** — PASS. `/en/league` and `/de/liga`, 1280 and 375, the rules open: "…or 0 with 40 card points or
   more…" / "…mit 40 Augen oder mehr 0…", no 31.
3. **The result line** — PASS. The built client carries both new lines; no "Schneider avoided" / "Schneider abgewehrt"
   in the client or the server build.
4. **The article** — checked after the release (cap4), against the live page.

Mechanical defence (engineering.md): passed — typecheck, build, 353 unit tests, client bundle, design tokens, literal
grep 0, SSR link, SEO (52 indexable pages) and its 28 tests.

The look through the human's eyes: not run as a separate review — the visible change is two lines of text, quoted above.

## Deviations

None from `plan.md`.

## Environment

Ports used: web 55214, multiplayer 56214, database 57214. No env key added, changed or removed. A detached base worktree
(`../skatgo--SKATGO-214-base`) ran the base League test; removed at close.

## Residual

None.

## Check

1. https://skatgo.com/en/league — the rules under "What is the League": 40 card points.
2. The forum article "declare or defend" — the rule and its numbers at 40.

## Decided for you

- The result line for a saved defence: "The declarer made it – 80 card points at most" / "Der Alleinspieler hat
  gewonnen – höchstens 80 Augen".
- The rules line: only 31 → 40, nothing added.
- The forum article updated with numbers recomputed on its own sample.
- Release order: multiplayer (it scores the deals), then web, then the article.
