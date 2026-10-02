# SKATGO-42 plan

## What the code already says that the ticket does not

- **Days are prepared ahead** (`prepareDay`, SKATGO-39). The leader deals today and tomorrow and works
  out seats 1 and 2's SkatZero bidding (`seatBidding`, ≈ 1 s per seat per deal). Results are stored
  in `daily_deals.deals` (JSON per deal) — no schema change.
  - Production took 238 s for a day on 2026-10-02; the limit is 10 min (`PREPARE_MS`).
- **Seat 0 has no SkatZero bidding today**, because the human sits there. The computer's result in
  the player's seat therefore needs seat 0's bidding as well (+ ≈ 50 % preparation time). After that
  it is a whole deal played by SkatZero in all three seats: the auction and the skat from the plans,
  the discard and the game after a pick-up live, and the cards from the models.
- **`advance` stops at seat 0** (`computers.ts`). Playing a deal out needs it to run to the end.
- **What the browser gets:** a deal's summary enters the player's `status.deals` only once the player
  has finished that deal (`settleRecorded` → `summarize`). Attaching the computer's result at the
  same point reveals nothing about deals not yet played.
- **Already-prepared days carry no computer result.** In production that is today (2026-10-02) and
  tomorrow (2026-10-03). Days dealt with the older computers (`heuristic`, the hybrid) have none
  either.
- **Where results show today:**
  - `GameTable`'s `Result` shows the tournament deal's score (`daily-deal-score`).
  - `DailyResult` (`daily-table.tsx`) lists the 12 deals: contract · declarer, then the score.
  - `/daily` shows "Continue: deal n of 12" while a day is under way.

## Route

1. **Computer in the player's seat** (`multiplayer/src/daily.ts`, `computers.ts`):
   - `advance` takes an optional stop rule, so a deal can be played out to the end.
   - `benchmark(policy, spec, day, i)` works out seat 0's bidding (with `skatOrder(day, i, 0)`), plays
     the deal with SkatZero in all three seats, and returns its `DealSummary` (declarer, declaration,
     bid, won, Seeger-Fabian scores; the computer's score is `scores[0]`).
2. **Store it with the deal.** `prepareDay` adds `benchmark` (and the move log, per grill Q3) to each
   deal of a new day. Days prepared before this change are not filled in. At deploy, today and
   tomorrow are re-dealt by a one-off step (grill Q2): `multiplayer/scripts/redeal-days.mjs <day>…`
   deletes those days' `daily_deals` and `daily_entries` in one transaction and prints what it
   removed; the leader then prepares them anew.
3. **Reveal per finished deal.** `status` gains `benchmarks: (DealSummary | null)[]`, one per finished
   deal of the player (null on days without one). The type lives in `app/src/lib/skat/tournament.ts`
   `DailyStatus`.
4. **Show it** (`game-table.tsx` `Result`, `daily-table.tsx`):
   - After each deal, under "This deal: +X": the computer's contract, declarer and score.
   - Below that, the running table: one row per finished deal (deal n, your score, the computer's
     contract · declarer and score), with totals. The computer in the player's seat is named "AI" (grill Q5).
   - The day's result page shows the same table.
   - `/daily` shows it while the day is under way (grill Q4).
   - The `Tournament` prop carries the day's `deals` and `benchmarks`.
5. **Messages:** en/de.

## Redline lookup

| Action | Entry | Result |
|---|---|---|
| Production schema | operations.md R5 | none: a field inside the existing `deals` JSON |
| Production data | operations.md R2 (acceptance) | acceptance is local only. The re-deal of today and tomorrow is a deploy step the human approved (grill Q2), run in cap4 after confirming the days |
| Env / dependency | R5 / engineering R3 | none |

## Grill outcome

Settled 2026-10-02 by the human (`grill.md`):
- Q1, Q3 and Q4 as recommended.
- Q2: today is re-dealt at deploy (players' entries deleted, the human's choice), and tomorrow too;
  no fill-in code.
- Q5: "AI".
