# SKATGO-59 handoff

## What changed

**Rules engine** (`app/src/lib/skat/`)
- New `rest.ts`, two rules.
  - `restLine`: the declarer's rest in a suit game or Grand. It judges only from what the declarer sees (grill Q1): their hand and the cards not in it, not played, and not a skat they know. The skat counts as unseen in a Hand game.
    - It returns the line "every trump strongest first, then each suit strongest first" when that line takes every remaining trick, however the unseen cards lie and whatever the defenders play.
    - Why it holds is explained in the file.
  - `nullBeaten`: a Null the declarer cannot lose any more, whoever plays whatever (grill Q2). It judges on every hand at an empty trick: in each suit each of the declarer's cards is below each of the defenders'; if the declarer leads, every suit they hold has a defender who must follow.
- `game.ts`:
  - two new moves: `claim` (the declarer shows the rest) and `concede` (the defenders give up such a Null);
  - `claimLine(g)` and `concedable(g)` say when each is legal.
  - Both moves play the rest out with the engine's own `playCard` / `collectTrick`: the declarer along the line, everyone else their first legal card. The final state is what `finish` settles, so card points, Schneider / Schwarz, value and score are those of playing it out.
  - A claim is offered only on the declarer's lead at an empty trick with at least two tricks to go.
  - `Game.early` (optional) records how the deal ended and after how many tricks, for the result's first line only.
- `tournament.ts`: `SeatView.early` carries it to the table.

**Server** (`multiplayer/src/`)
- `model.ts`:
  - the player may send `claim`, and the engine judges it;
  - `concede` is not in the player's schema;
  - `applySeatMove` lets a defender concede at an empty trick whoever's lead it is.
- `computers.ts` `advance`, at every empty trick:
  - a Null that `concedable` holds for is given up by a computer defender;
  - a computer declarer (every seat with `toEnd`, so the AI benchmark too, grill Q4) shows the rest when `claimLine` holds (grill Q3).

  Both are recorded moves like any other, so replays (daily entries, free-play tokens) end the same way. Older records have no such move and replay as before.
- Free play, lesson 11 and the daily tournament all go through `advance`. Days already prepared keep their stored benchmarks.

**Table** (`game-table.tsx`, messages)
- On the player's lead as declarer, when `claimLine` holds, a `go` block button sits beside "Du spielst aus": "Rest zeigen" / "Claim the rest" (grill Q5). There is no confirmation.
  - The top band of the felt is click-through, so its words line now takes clicks again (`pointerEvents: 'auto'` on `words`).
- The result's first line says how the deal ended:
  - the player's claim;
  - Lina's or Max's claim;
  - the concession of the player's Null;
  - a computer's Null that cannot be beaten.

  In the tournament this line is above the comparison; the comparison and the day's table are unmarked (grill Q6).
- Seven new message keys in `de` and `en`.

**Tests**: `rest.test.ts` does not trust the rules. Every position they accept is played out by brute force.
- **Claims**: every defender card at every turn, over sampled layouts of the unseen cards (up to 30 per position, the real one included), with 2–5 tricks left.
- **Nulls**: every card anyone may play, the declarer's own included, with 1–5 tricks left.
- Also: claim and concession equal playing it out by hand with other defender choices; refused moves don't move the state; explicit negatives.
- Runs in about 4 s.

## AC results

Local services on web 55059, multiplayer 56059, database 57059. Headed Playwright at 1280×820 and 375×812 (`isMobile`, `hasTouch`).

The positions were built by `tmp/positions.ts` and `tmp/dailyday.mts`, legal move logs on real pool deals and on the local day's deck 1:
- free play: answered to the page's first `/api/free/new`, sealed with the local admission key;
- daily: written to the local entry.

Every move after that went to the real local server. Scripts: `tmp/free59.mjs`, `tmp/daily59.mjs`. All checks passed.

1. **Claim, result as played out.** Met.
   - Grand by the player after 7 tricks: the button shows ("Rest zeigen" / "Claim the rest").
   - One click, one request, `phase: done`. The server's result equals the independent play-out: 64:56, value 48, score 48, with 1 + game.
   - The dialog's first line: "Du hast den Rest gezeigt: die letzten 3 Stiche gehen an dich." Points and formula as played out.
   - Checked on desktop (de, en) and phone (de).
2. **No claim when not certain.** Met.
   - On lead with the rest uncertain: no button.
   - As a defender and mid-trick: no button.
   - A `claim` posted anyway: `409 illegal_action`.
   - Explicit negatives in `rest.test.ts`. Both viewports.
3. **The computers concede an unbeatable Null ouvert.** Met.
   - Null Hand Ouvert after 3 tricks: the player's card ends the trick, and the server's reply ends with `concede`.
   - The Null is won at 59, as played out. The dialog says "Lina und Max geben auf: deinen Null können sie nicht mehr knacken."
   - A beatable Null after the player's card: no concession, the deal goes on. Both viewports.
4. **Daily: saved, compared and ranked as played out.** Met, on desktop and phone, each with a fresh entry on the local day 2026-10-08.
   - Deal 1 is a hearts game claimed after 6 tricks. Against the engine's independent play-out (72:48, value 30, +80 0 0):
     - the dialog's comparison;
     - `/api/daily/state`;
     - the database entry (`deals[0]`, `total`);
     - `/daily` after reload.
   - After finishing the rest of the day through the API and setting a nickname, the board's own row and `/api/daily/board` total 80, the sum of the 12 saved deals.
5. **A computer declarer's settled game ends at once** (added by grill Q3). Met.
   - Lina's Grand: the player's card ends a trick Lina takes, and her reply is `claim`. 97:23, value 96, as played out; "Lina zeigt den Rest: die letzten 3 Stiche gehen an sie."
   - Max's Null after the player's card: `concede`. Won, value 23, 4:116, as played out; "Max' Null ist nicht mehr zu schlagen – das Spiel ist entschieden."
   - Both viewports.

No page errors in any run.

**Deep run** (one-off, not in the suite): the same brute force with 6–8 tricks left, about 400 s.
- 150 claims (47 / 55 / 48 by length), each against 4 layouts and every defender card: none lost a trick.
- 100 conceded Nulls (58 / 25 / 17 by length), each against every card anyone may play: none could be lost.

**Mechanical defence**: passed in full — typecheck, build, 95 tests, bundle, tokens, literal grep, SSR link, `check:seo -- --built` (42 pages, 4 linked files), `test:seo` 25/25. `npm --prefix multiplayer run check`: typecheck, build, 19/19 tests.

## Deviations

- The claim is offered only with two or more tricks to go. With one trick left the last card is simply played, and the result line never has to say "1 Stiche". The human's wording otherwise as approved; the Lina variants ("an sie", "Linas Null") are the same sentences for her.
- The concession is not shown at the moment of declaring in the browser check: none of the 1,000 pool deals has a Null that is unbeatable from the first trick (probed). The server checks at every empty trick, the declaration included, and the unit tests cover concession positions with 1–5 tricks left.
- Clicking the claim needed the words line to take clicks (above). This is a style keyword, not a design value; no token changed.

## Environment

- Ports 55059 / 56059 / 57059. Web and multiplayer are left running for review; the local database container `skatgo-multiplayer-db-57059` is running.
- The worktree's `app/.env` `MULTIPLAYER_URL` and `multiplayer/.env` `DATABASE_URL` port were pointed at the ticket ports for local acceptance only. No env key added, changed or removed.

## Residual

- Charter drift, not edited (the charter is the human's):
  - `engineering.md`'s rules-engine row and key decisions don't mention `rest.ts`, the `claim` / `concede` moves, or that `advance` ends a decided deal;
  - `ui.md`'s table description doesn't name the claim button or the result's first line.
