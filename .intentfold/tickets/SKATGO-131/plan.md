# SKATGO-131 plan

## Found in the code that the ticket does not say

- Every daily query names `DAILY_DEALS` (6); the tables are keyed by day and `size`, and SKATGO-77/119 show how a
  size travels (`size` on state, act, board, review; refused when unknown). The deal of the day is size 1.
- A day's preparation already works each deal's computers' bidding and the AI's own game from the player's seat
  (`benchmark`) — exactly what the four kinds of deal are read from. `skatOrder` is used only while preparing.
- Elo reads size 6 only; the record of play (SKATGO-128) reads every size, so the deal of the day counts there.
- The front page's hero: tournament button + forum button / announcement line, and the Elo board beside it.
- `/api/daily/*` refuses a guest's playing (401); guests are named by a device cookie.

## Route

1. **Sizes**: `DEAL_OF_DAY = 1` and `DAILY_SIZES = [6, 1]` in `lib/skat/tournament.ts`; the routes take an optional
   `size` (6 by default); Elo stays 6.
2. **Choosing the deal**: `prepareDay` for size 1 deals candidates (fresh decks, never one of the day's six), works
   each like a tournament deal (computers' bidding, the AI's game), sorts the candidates into the four kinds from the
   AI's game — declarer won with 61–89 card points; declarer won Null; declarer won Schneider or better; defended and
   the declarer lost — and picks one: never yesterday's kind, a contract kind not seen in the last days where one is
   offered, a close win (61–75) first among the declarer's wins. The pick's kind and contract are stored with it.
   Candidates in rounds of 8, up to 32, inside the hour the preparation may take.
3. **Guests** play the deal of the day (the human: 游客能打); the tournament still needs an account.
4. **Pages**: `/daily` opens on the deal of the day, a toggle at the top to the tournament (`?t=6`); the deal of the
   day's side: before playing, a `go` button to its table; after, the score block (yours, the AI's, how many played
   and your rank), "share" as the one `go`, the countdown to the next, today's board with the AI's row, the deal's
   comparison folded, and a link to free play. Its table is `/daily/play?size=1`; after the last card the result
   stands a moment and the page goes to `/daily`.
5. **Front page**: the hero's main button is the deal of the day (its table, or "Today's result · #k" to `/daily`
   once played), the second free play; no forum in the hero.
6. **Share**: the system share sheet where there is one, else the clipboard; the date, score and AI's score, a mark,
   and `skatgo.com/daily?ref=share` — no cards, no contract.
7. **Charter**: product, engineering, ui.
