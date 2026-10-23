# SKATGO-123 plan

## What the code already says

- Every finished entry (`daily_entries`, size 6) keeps the player's Seeger-Fabian total; every dealt day
  (`daily_deals`) keeps SkatZero's play from the player's seat (`benchmark.summary`), whose total is the AI's
  on the daily board (`dailyBoard`). All 16 days in production have it. So the rule's inputs exist for every
  day already played; nothing new has to be recorded.
- The daily board is computed on request from those rows, and nothing is stored about it. The Elo list can
  be the same: replayed from the first day each time, cached briefly.
- A guest who signs in carries only today's entry to the account (`dailyClaim`); earlier guest days stay
  under the device id. That is why Mark is two players and Julien five. Player ids (Clerk ids, device
  hashes) may never be committed (engineering Redline 1), so the human's "same person" goes in the database.
- The tournament day is Berlin's (`dayOf`). Only a day that has ended has its whole field.
- The front page loads the forum's announcement on the server (`readAnnouncement`, `forum-api.ts`), cached a
  minute; the hero is type alone, centred (SKATGO-120). `dims.twoColumns` and `bp.cards` exist.

## Route

1. **The rule, shared** — `app/src/lib/skat/elo.ts`: the constants (start 1500, KI 1700, K 40 for the first
   30 days then 20, provisional under 5 days) and one pure function that replays days in order: each
   player's day is one game against everyone else that day and the KI, by Seeger-Fabian total, the FIDE
   expectation averaged over the opponents. A day without the KI's total has only the players. A test with
   the worked examples (+11 against a field, +30 / −10 against the KI alone).
2. **The service** — `multiplayer`: a table `player_aliases (player, same_as)` (store.ts); `dailyElo` in
   `daily.ts` reads every ended day's entries and KI totals, folds aliased players into one, replays, and
   answers the ranking (rank, current name, Elo, provisional) with the KI's fixed value; route
   `POST /daily/elo`.
3. **The web** — `daily-handler.ts`: `elo` among the ops, asked as nobody; an isomorphic reader
   (`elo-api.ts`) like the forum's: on the server it asks the service directly, a minute's answer cached;
   the front page's loader reads it beside the announcement.
4. **The hero** — `entry-page.tsx` + a new `elo-board.tsx`: on PC two equal columns (`dims.twoColumns`),
   the text on the left, now left-aligned, the board on the right; below `bp.cards` one column, the board
   under the text; on a phone the board folded behind one line that names the leader. The board looks like
   the daily one (Panel, rank, name, number, the blue AI tag for the KI's row), with one line saying how it
   is counted and a fold with the rule.
5. **Charter** — `product.md` (the Elo beside the Seeger-Fabian board), `ui.md` (the hero's two columns,
   the board), `engineering.md` (the rule's module, the route, the aliases table).
6. **Data** — at close, the human's two merges as rows in production's `player_aliases`; locally the same
   on a copy of production's tournament tables, so the review shows the real list.
