# SKATGO-59 AC check plan

Built web on 55059, multiplayer on 56059, local database on 57059. No game is played for its own sake (memory: acceptance never plays games).

To reach the positions, a check script prepares them.

- **Free play**: it takes a pool deal (`free-pool.json.gz`) and builds a legal move log with the engine, up to the position.
  - The computers' moves in that log are chosen by the script; the server replays a token's log only through the engine's legality checks. A probe of the 1,000 pool deals found none with a sure rest at the first trick, so the position comes after some tricks.
  - It seals the log into a game token with the local admission key, which is never printed.
  - Playwright then answers the page's `/api/free/new` with that token and its `seatView`.
  - Every later request, the claim included, goes to the real local server, which replays and judges it.
- **Daily**: the script writes a local "today" into the local database with a chosen deck for deal 1.
  - The computers' bidding and the AI benchmark are worked out by SkatZero, as `prepareDay` does.
  - The player's entry for deal 1 is written with a legal move log up to the position, built as for free play. The page then replays it from the database like any entry.

Browser checks are headed, at 1280×820 and 375×812 (`isMobile`, `hasTouch`).

## AC1 — Claim the rest; the result equals playing it out

- **Check**: in the position where the player is declarer and on lead, and `restLine` holds:
  - the claim button is visible beside the "your lead" line;
  - click it.
- **Check**: the result dialog appears at once, with no further card to play. Read its card points, Schneider / Schwarz line, formula and score.
- **Check**: the script plays the same position out independently through the engine, along the claim line, with the defenders' first legal cards. It also does this with every other defender choice, which the unit test covers exhaustively.
- **True when**:
  - the dialog's points, level and score equal the played-out result;
  - the server's reply has `phase: done`.

## AC2 — No claim button when the rest is not certain

- **Check**: in a position where the player is declarer on lead but `restLine` is false (an unseen trump higher than one of theirs), the claim button is absent.
- **Check**: as a defender, and while a trick is in progress, the button is absent.
- **Check**: a `claim` sent by hand in such a position is refused by the server (`409 illegal_action`).
- **Check**: `rest.test.ts` covers the rule's negatives.
- **True when** all hold.

## AC3 — The computers concede an unbeatable Null

- **Check**: a pool deal where the player can declare a Null that `nullBeaten` holds for. Declare it in the browser through the contract picker.
- **Check**: the result dialog appears at once, says the opponents gave up, and shows the player won with the Null's value. The server's log ends with a `concede` by a computer seat.
- **Check**: an unbeatable-looking but beatable Null, such as one card higher than a defender's in some suit, gets no concession.
- **True when** both hold.

## AC4 — Daily: an early-ended deal is saved, compared and ranked as if played out

- **Check**: on the local "today", claim deal 1 at the position. Then read:
  - `daily_entries.deals[0]` and `total` in the local database;
  - `/api/daily/state` (the deal's summary, the AI comparison and the totals);
  - the leaderboard. Only a finished day is ranked, so the rest of the local day is finished through the API, with passes and first legal cards as SKATGO-48's check did. Then a nickname is set and the player's own row is read from `/api/daily/board` and the `/daily` page.
- **Check**: compare them with `summarize()` of the engine's independent play-out from AC1.
- **True when**:
  - the saved summary and the comparison's numbers equal the played-out result;
  - the board total equals the sum of the saved deals, deal 1's being the played-out value;
  - the reload of `/daily/play` and `/daily` shows the same.

## AC5 — A computer declarer's settled game ends at once

Added by grill Q3.

- **Check**: build a free-play position where a computer is declarer and `restLine` holds from its own view, with a defender to move into an empty trick that the computer leads. Do the same for a computer's Null that `nullBeaten` holds for.
- **Check**: the server's reply ends the deal: the last logged move is the computer's `claim`, or a `concede`.
- **Check**: the result dialog shows the matching first line, and its numbers equal the engine's independent play-out.
- **Check**: the exhaustive tests in `rest.test.ts` cover both rules for every seat as declarer.
- **True when** all hold.

## Mechanical defence

As `engineering.md` Tools names it, plus `npm --prefix multiplayer run check` (multiplayer code changes).
