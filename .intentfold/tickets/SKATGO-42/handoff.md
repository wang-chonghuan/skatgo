# SKATGO-42 handoff

## What changed

**The AI in the player's seat — `multiplayer/src/daily.ts`, `computers.ts`**
- `benchmark(policy, spec, day, i)` plays each deal with SkatZero in all three seats:
  - Seat 0 gets its own bidding (`seatBidding`, skats tried in `skatOrder(day, i, 0)`).
  - Seats 1 and 2 play from their prepared plans, exactly as they do against the player.
  - The discard and game after a pick-up and the cards are SkatZero live.
- `advance` gains `toEnd`, so a deal can be played out past seat 0.
- `prepareDay` stores `benchmark: { summary, log }` inside each deal of a new day (`daily_deals.deals`
  JSON, no schema change).
  - The summary is the usual `DealSummary` (declarer, declaration, bid, won, Seeger-Fabian scores;
    `[0]` is the AI's).
  - The move log is kept and not shown (grill Q3).
- `status` gains `benchmarks`, one per deal the player has **finished**, null on days dealt before.
  The log never leaves the service.

**Re-deal tool — `multiplayer/scripts/redeal-days.mjs <day>… [--yes]`** (grill Q2)
- Without `--yes` it is a dry run: it prints, per day, whether it is dealt, its computer label and how
  many entries and finished entries it has.
- With `--yes` it deletes those days' `daily_entries` and `daily_deals` in one transaction.
- The next request answers `day_preparing` and starts the preparation anew.

**Web**
- `app/src/lib/skat/tournament.ts`: `DailyStatus.benchmarks`.
- `components/skat/daily-comparison.tsx` (new):
  - `AiThisDeal`: "The AI in your seat: {contract · declarer} · {score}".
  - `VsAiTable`: one row per finished deal — your score with your deal's contract · declarer, and the
    AI's score with its contract · declarer — plus both totals. The computer in your seat is named
    "AI" (grill Q5).
- `game-table.tsx`: the tournament's settlement — the result box, or the passed-in box — shows the AI
  line and the running table. The `Tournament` prop carries the day's `deals` and `benchmarks`.
- `daily-table.tsx`:
  - The day's result shows the table instead of its old list.
  - While a day is under way, `/daily` shows "You against the AI" with the table so far, above
    "Continue" (grill Q4).
- Theme and messages:
  - `theme/shape.stylex.ts` `dims.vsAiColumns`.
  - en/de messages `daily_ai`, `daily_ai_deal`, `daily_vs_ai_title`, `daily_col_deal`.

## AC results

**Setup:** local web 55042, multiplayer 56042, PostgreSQL 57042. Scripts are in `tmp/`: `check42.mts`
(headless, through `/api/daily/*` with the device cookie) and `ui42.mjs` (browser).

**Mechanical defence:** PASS.
- app: typecheck, build, 75/75 tests, client-bundle and design-token checks, no raw styles, server
  bundle links.
- multiplayer: check 19/19.

**AC1 — after each deal, the AI's contract, declarer and score:** PASS
- **Headless:**
  - All 12 stored AI deals replay legally through the engine and settle to their stored summary.
  - After each of the 12 deals, the reply carries that deal's AI result, equal to the stored one
    (102 moves, 0.7 s).
- **Browser:**
  - Desktop, after deal 3: "The AI in your seat: Clubs ♣ · Lina · 0".
  - Phone, after deal 4: "…Grand · Lina · 0".
  - An earlier phone run, after deal 5: "Clubs ♣ · Lina · +40". There Lina lost the same contract
    the player's Lina won.

**AC2 — the running table:** PASS
- The result box's table has n rows after deal n (desktop 3, phone 4/5).
- After a reload, `/daily` shows "You against the AI" with the same n rows.

**AC3 — the day's result:** PASS. 12 rows and both totals on desktop and phone (e.g. "Total 0 / +404").
The columns line up (screenshot `tmp/result-desktop.png`).

**AC4 — nothing ahead of time:** PASS. Across every reply of a whole day, AI results were only ever
present for finished deals, and the move log never appeared (0 violations).

**Preparation:**
- One local day took 29.6–30.1 s (macOS, three runs), rss ≈ 411–431 MB.
- `redeal-days.mjs` locally:
  - The dry run reported the day.
  - `--yes` deleted 1 day and its 1 entry, and nothing else.
  - The next request answered `day_preparing`, and the day was dealt anew in 29.8 s, with AI
    results.
- No page errors.

## Deviations

- **Grill Q2 changed by the human:** today is re-dealt at deploy instead of filled in. Tomorrow is
  re-dealt too, which replaces the fill-in; no fill-in code was written. The re-deal is a deploy step
  (below), not product code.
- **Test runs:** for the browser checks, deals were finished through the page's own API with the same
  cookie, and the page itself played the last card of a deal. No game was played through by hand
  (standing rule).
- **Table layout:** a fixed first column (`dims.vsAiColumns`) keeps the columns aligned. Every row is
  its own grid.
- Otherwise as `plan.md`.

## Environment

- **Ports:** web 55042, multiplayer 56042, PostgreSQL 57042.
- **Env keys:** none added, changed or removed. The worktree's own `app/.env` `MULTIPLAYER_URL` and
  `multiplayer/.env` `DATABASE_URL` point at the ticket ports; these are local only.
- No dependency, schema or image change.

**Deploy:**
1. Deploy multiplayer first; it must be live and ready on the merge commit.
2. Deploy web.
3. **Re-deal** (approved by the human, grill Q2; confirm the exact days first): run
   `redeal-days.mjs <today> <tomorrow>` against the production database. Do a dry run first, read its
   counts, then `--yes`. Today's entries are deleted.
4. Then confirm `daily_prepared` for both days in the service log, with time and rss.
- **Watch memory:** Render starter has 512 MB. Production rss after preparing was ≈ 260 MB before this
  change. The extra work is the same kind (one more `seatBidding`, then card play), so it should stay
  near that, but it was not measured in the Linux container. Read the rss in the logged
  `daily_prepared` after deploy.

## Residual

- **Charter drift, not edited:**
  - `engineering.md`'s decision on days dealt ahead should add the AI-in-your-seat benchmark and that
    it is revealed per finished deal.
  - `operations.md` should note the longer preparation (≈ +50 %, production about 6 min, limit
    10 min) and the re-deal tool.
  - `product.md`'s daily tournament could mention the comparison with the AI.
- **SKATGO-37** (review per deal) can use the stored AI move log to replay how the AI played.
- **AI quality:** the AI in the player's seat sometimes overbids heavily (e.g. a lost Null Ouvert Hand,
  −168). This is SkatZero's own bidding, shown as it is.
