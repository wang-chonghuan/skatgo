# SKATGO-42 acceptance checks

**Setup:** local only: web 55042, multiplayer 56042, PostgreSQL 57042. Scripts are in `tmp/`. Per the
human's standing rule, no deal is played through in the browser for its own sake. Deals are finished
headlessly through `/api/daily/*`, with the player passing and then playing the first legal card, and
the browser checks what the page shows.

## AC1 — after each deal: the computer's contract, declarer and score

- **Headless:** after each of the 12 deals, the act reply's `status.benchmarks` holds one entry per
  finished deal (contract, declarer, score). It equals the stored result for that deal.
- **Stored result:** it is a whole deal by SkatZero in all three seats. Its moves replay legally, and
  its Seeger-Fabian score for seat 0 is the shown score.
- **Browser** (desktop 1280×820, phone 375×812): finishing a deal shows "This deal: +X", and beside it
  the computer's contract · declarer · score.

## AC2 — the running table

- **Browser:** after deal n, the result box's table has n rows: deal, your score, the computer's
  contract · declarer · score.
- **Reload:** the table on `/daily` has n rows (grill Q4).

## AC3 — the day's result page

- **Browser:** after 12 deals, the result page shows the 12-row table and both totals.

## AC4 — nothing ahead of time

- Every reply (`state`, `act`) carries computer results only for finished deals.
- No reply contains a later deal's result.

## Preparation

- Preparing one local day takes under 10 min; the time is recorded.
- `redeal-days.mjs` locally: it removes the named day's deals and entries and nothing else. The next
  preparation deals that day anew, with the computer's results (grill Q2).
