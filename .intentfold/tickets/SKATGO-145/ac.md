# SKATGO-145 acceptance checks

Local web 55145, multiplayer 56145, database 57145; the owner's real days copied in with `demo-me.sh`. `tmp/ac.mjs`
(Playwright, PC 1280×820 and phone 375×812, en and de). Acceptance plays no game: the after-deal dialog is reached
only by the human's own play on the review link; the same blocks are read where they open without playing — the
`/daily` rows and the deal of the day's details — and the dialog's composition is read from its render paths.

1. **The dialog's content** — `game-table.tsx`: the daily, free-play/lesson-11 and passed-in branches render only
   `ResultCard` (not when passed in), `VsAiReview`, and the `skat-new-game` button, in that order; no `ScoreSheet`,
   `TrickReplay`, skat, `tricks-more-link`, `daily-after` in them (read, plus a grep that those testids and
   `daily_after*` are gone from `app/src`). Played through by the human.
2. **Calculation rows** — `settlementRows` unit cases: a won suit game, a lost suit game, a won Grand Hand
   Schneider, Null and Null Ouvert, an overbid, the player as a defender of a lost and of a won game; each list
   ends in the player's Seeger-Fabian score and matches `seegerFabian`. The card is `goodSoft` on a win
   (`Panel tone="good"`), per the grill on a loss.
3. **Bidding** — on `/en/daily` (and `/de/daily`) the owner's finished rows open to `vs-ai-bid` with one row per
   side (`data-who`), each naming the bid or the pass, the outcome with card points (Null: no points) and the score
   equal to the row's `data-you` / `data-ai`; one row (`data-who="both"`) where the two would read the same.
4. **The trick** — in the same rows `vs-ai-trick`: the heading names `data-trick` and the AI's card; the cards on
   the table before the player's (count = the player's place in that trick − 1), the hand before the trick
   (`11 − trick` cards) with exactly one `data-mark="you"` and one `data-mark="ai"` matching the review's
   `played` / `best`; who took it and the points. A row with no differs shows `vs-ai-clean`; a passed-in deal has
   no `vs-ai-trick`.
5. **Everywhere** — the deal of the day's finished details and `/daily`'s rows show `vs-ai-bid` + `vs-ai-trick`
   and no `daily-deal-scores` / `daily-replay`; the free round's summary rows open to the kept review (read from
   `server-table.tsx`; the round's six deals are the human's to play). The /daily total sheet
   (`daily-total-scores`) is unchanged.
6. **One phone screen** — at 375×812 the opened row's `vs-ai-bid` + `vs-ai-trick`, plus the result card and the
   button measured from the same components, fit the dialog's height without scrolling; the dialog itself checked
   by the human on a phone.
7. **Languages and the private table** — every new message has en and de; `/de/daily` rows read German; the
   private table's `roomAfter` branch is byte-identical to `main` (diff of that branch).

Mechanical defence (`engineering.md`) once before the handoff.
