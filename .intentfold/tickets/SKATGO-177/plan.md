# SKATGO-177 plan

What the code already says that the ticket does not:
- Free play's player is seat 0 of a pool deal (`multiplayer/src/free.ts`, `PLAYER`); the pool (1000 deals, committed, hashed in
  `skatzero/manifest.json`) already holds SkatZero's bidding for seat 0 (`computers['0']`: maxBid, pick-up/Hand per bid).
- SkatZero's chance that a suit game or Grand is made at each bid (`seatGames(...).made`, SKATGO-159) costs about 1 s of CPU
  per hand — too much per click on the shared service. Null has no such table.
- `declareAfterPickup` (SkatZero's put-away and game for twelve cards at a bid) is milliseconds and is what the computers use.
- The card counter needs nothing from the server: the seat's view (own hand, tricks, the trick, the skat once known) is in
  the browser; `runningPoints` exists in `game.ts`.
- The lightbulb today (SKATGO-176): while bidding it opens `bid-values.tsx`; while playing it shows the course heuristic's
  card hint; the skat / put-away / game have blue hint buttons.

Route:
1. **Odds, offline**: `multiplayer/scripts/make-free-odds.ts` runs `seatGames` for seat 0 of every pool deal (the pool's own
   skat order, parallel processes) and writes `skatzero/free-odds.json.gz` (per deal, C S H D G: percent per BIDS entry) with
   its manifest entry (`freeOdds`: name, bytes, sha256, deals). `free.ts` loads and checks it like the pool; readiness waits.
2. **Server**: `POST /free/odds` (token → the deal's five chance rows) and `POST /free/putaway` (token, only when the player
   has picked up the skat → SkatZero's two cards and game). The web passes both through `/api/free/*` with its usual limits.
3. **Browser**: `components/skat/power-ups.tsx` — the lightbulb's `Modal` "Power-ups": three option cards (icon on a
   section tile colour, name, one line); the one usable now marked and open with its content:
   - Win chances (bidding): the bid table of SKATGO-176 with a column "Win at N" (N the number on the table now).
   - Put away (skat picked up): the two cards as small cards and the game.
   - Card counter (play): per trumps and side suit the cards still out, who is void, and the side's points against 61/60.
   The others say when they can be used. In free play the lightbulb stands through bidding, the skat and play.
4. Free play keeps no other hint (grill 1); lesson 11 unchanged.
5. Charter: product.md (free play's power-ups; SkatZero's chances shown), engineering.md (odds file, routes), ui.md
   (power-ups page).

Redlines looked up: no dependency; no generated file hand-edited (odds made by its script); token registry only if grill 3
allows; no credentials committed; no check weakened.
