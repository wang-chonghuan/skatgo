# SKATGO-48 AC checks

Built web on 55048, multiplayer on 56048, local database on 57048 (`operations.md` Tools), headed
Playwright from `tmp/`. A deal is brought to its last card through the page's own API (as SKATGO-42's
check did); the page plays that card. No full games are played in the browser.

## AC1 — every place shows both sides, scores, difference, totals

After a finished deal (the result dialog), on `/daily` mid-day and on the day's result page:
- `[data-testid=daily-vs-ai]` has one row per finished deal;
- each row shows your SF, the AI's SF and their difference, and the difference equals you − AI;
- opening a row shows two result lines with declarer, contract, won/lost, card points (not for Null),
  game value and that side's card points;
- the total row's "you" equals the status `totals[0]` and the leaderboard score of a finished entry;
- the running difference equals the sum of the rows' differences.

## AC2 — both defend, the declarer wins

Headless engine check (`tmp/check48.mts`) over the prepared days, plus the browser where such a deal
occurs:
- for every deal where seat 0 defends in both runs, the detail lines name the declarer and contract,
  give the card points and each side's points;
- the UI shows them even when both scores are 0.

## AC3 — old records deleted, days re-dealt with the new code (amended 2026-10-06)

- Production: after the deploy, `redeal-days.mjs` (dry run, then `--yes`) deletes every day's deals
  and entries; a count afterwards shows none from before.
- The service deals today and tomorrow afresh (`daily_prepared`).
- `/api/daily/state` on skatgo.com then returns today with every AI result carrying `detail`.
- Locally, the same on a wiped database: every finished deal on both sides carries its details.

## AC4 — readable, no overflow, both languages

At 1280×820 and 375×812, en and de:
- `scrollWidth ≤ innerWidth` on `/daily` and in the result dialog;
- row text is not clipped;
- the screenshots are looked at.
