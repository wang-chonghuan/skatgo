# SKATGO-154 plan

## What the code says

- `make-bidding-practice.ts` named the AI's contract by matching SkatZero's highest bid to a ten-card game value
  (`answerOf`). SkatZero's bid is the highest at which its expected result clears its threshold, over every skat and
  game, so a bid can be reached on the skat or on Schneider while the number happens to match another suit — question 5:
  bid 44 matched Spades with 3 while the hand is Diamonds with 7 trumps; at 44 SkatZero plays Spades in only 38% of skats.
- `bidding.ts` has every piece to say which game SkatZero plays at a bid: `seatBidding`'s simulation keeps only the max
  over games. One hand takes about 1.2 s.

## Route

1. `seatGames` in `bidding.ts`: the same simulation, per game type — at bid index `at`, the share of skats each pickup
   game is best, the best Hand game's value and the pickup value. Not part of the port; the port's functions untouched.
2. `scripts/bidding-practice-games.ts`: every candidate seat of the pool (≈1,100), resumable JSON.
3. Generator: a bid question needs SkatZero to pick up and play the answer's game in ≥ `SURE` (0.6) of skats, the game the
   suit with most trumps (or Grand; a Null by its kind, a Hand Null when Hand beats picking up); `sure` stored per question.
   Passes as before; 300 questions, easy to hard.
4. Tests: every bid question `sure ≥ SURE` and most trumps; the 「第五题」 hand absent; four questions recomputed by SkatZero
   equal their recorded share.
5. Charter: product.md, engineering.md.

## Redline lookup

engineering.md: no dependency; `encode.ts` parity untouched; the parity test still runs. No data or server change beyond the
generated file. ui.md: no UI change.
