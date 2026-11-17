# SKATGO-205 plan — League scored per deal

## What the code already promises, and what the ticket does not say

- SKATGO-204's League round is a room (`Snapshot.league`) of three deals: `nextDue` stops after `ROUND_DEALS`, the
  fee is taken once at formation, `settleLeague` stores each finished deal (`league_deals`) and scores the round by
  places after the third, `league.result` drives the round result page.
- The room deals the next deal when every online person asked (`next`); with nobody online a League room deals by
  itself. A person away keeps the seat (AI after 30 s). `leave` is refused in League rooms.
- Not said by the ticket (grill.md): what happens to a seat whose person is away when the next deal comes, how
  "leave" shows at the table, the reason words of each deal's line, how the one-time points reset runs.

## Route

1. Rules (`app/src/lib/skat/league.ts`): `FEES` per deal 3/4/5/7/8/10, `PROMOTE_AT` 30, `RELEGATE_AT` −20,
   `dealPoints(declarer, won, seat)` (+3 own side won, −3 own game lost, −1 defence lost, 0 all passed),
   `standingAfter(standing, delta)`; `placesOf`, `PLACE_POINTS`, `ROUND_DEALS` go. `LeagueResult` becomes the last
   deal's result per seat. Unit tests rewritten from the ticket.
2. Store: `league_deals.points` (each seat's points); `league_players.scale` so the reset to 0 runs once on the first
   start of this release (existing rows → points 0), new rows already on the new scale.
3. Service (`multiplayer/src/league.ts`, `model.ts`, `room.ts`): a League room is a sitting with no round end. Each
   finished deal is scored in its transaction (`settleLeague`). The next deal is the League's own step
   (`leagueDeal`, async, in the same transaction as the move or the beat that makes it due): seats whose person left,
   is away, or cannot pay the next fee go to personas of the tier; the people staying pay; with no person left the
   sitting ends (finished, expires in 10 minutes). `leave` in a League room: a computer plays the seat's current
   deal, which still counts, and the seat goes at the next deal.
4. Web: the deal's League line first in the result dialog (`RoomTable.league.line`); the table's menu "Leave the
   table" sends `leave` and goes to the League page; when the person cannot pay the next deal, the result's foot is
   "Back to the League" with the coins line; League page fees per deal, "how it works" per deal, bar −20…+30.
5. Charter: product.md, ui.md, engineering.md — the League per deal.
6. Calibration: `calibrate.mts` gains the per-deal rule; rerun, record in `calibration.txt`.

## Redline lookup

| Action | Entry | Verdict |
|---|---|---|
| columns in multiplayer's PostgreSQL, a one-time reset of League points | operations 2/3 | not a resource; the reset is the ticket's own scope ("联赛分归零") on deploy, no acceptance check touches production |
| dependency | engineering 3 | none |
| token registry | ui 1 | none planned |
| charter edits | product 1 | the ticket's Constraints authorize them |
