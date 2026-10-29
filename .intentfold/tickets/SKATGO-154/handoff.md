# SKATGO-154 handoff

## What changed

- **`multiplayer/src/skatzero/bidding.ts`**: new `seatGames`, an analysis beside the port.
  - It runs the same simulation as `seatBidding`, but keeps each game type separately. At a bid it gives the share of skats in which each pickup game is SkatZero's best, the best Hand game's value, and the value of picking up.
  - About 1.2 s per hand. The port's own functions are untouched and the parity test passes.
- **`multiplayer/scripts/bidding-practice-games.ts`** (new): runs `seatGames` for every candidate seat in the pool at its highest bid, 1,006 hands in about 27 minutes. It can resume.
- **`make-bidding-practice.ts`**: a bid question is kept only when all of these hold:
  - SkatZero picks up and plays the answer's game in at least 60% of skats (`SURE`).
  - For a suit answer, that game is the suit with the most trumps.
  - For a Null, the Null of that kind wins (a Hand Null when Hand beats picking up).
  
  594 of the 1,006 bid candidates qualify. The new set is 300 questions (100 passes) ordered easy to hard, each bid question recording its `sure`.
- **`practice.ts`**: `Practice.sure` and `SURE`.
- **Tests** (`test/bidding-practice.test.ts`):
  - Every bid question has `sure ≥ 0.6`, and its suit is the one with the most trumps.
  - The 「第五题」 hand (deal 889, seat 0) is gone.
  - Four questions are recomputed by SkatZero and equal their recorded share.
- **Charter**: product.md (the contract is SkatZero's own) and engineering.md (the generator, `seatGames`, the test).

## AC results

1. **PASS.**
   - The 「第五题」 hand is absent (test).
   - Questions whose named suit has fewer trumps than another suit: 40 before, **0** now (count over the new data).
   - New composition: Clubs 55, Spades 41, Hearts 35, Diamonds 17, Grand 28, Null 24, pass 100.
2. **PASS.** Every bid question has `sure` between 0.61 and 1. The four recomputed shares match exactly (`test/bidding-practice.test.ts`; `npm --prefix multiplayer run check` 35/35, including the SkatZero parity test).
3. **PASS.** SKATGO-151's acceptance script against web 55154 / multiplayer 56154 / DB 57154 gives 10/10:
   - tile, two steps, explanation, cheat sheet en/de;
   - a pass question ends after step 1;
   - Null on question 174;
   - stats adding up;
   - no overflow on PC or phone.

Mechanical defence passed: typecheck, build, 306 tests, bundle, tokens, literal grep, SSR link, `check:seo --built` and `test:seo`.

## Deviations

None. The fallback (keep only the most-trumps suit, without asking SkatZero) was not needed, because asking SkatZero was cheap enough.

## Environment

- Ports: web 55154, multiplayer 56154, database 57154.
- No env keys changed.
- No schema change.

## Residual

None.

## Check

1. Answer a few questions and see whether the named contracts now match what you would play.

## Decided for you

- A question needs SkatZero to play its game in at least 60% of skats at its highest bid. Question 5 was 38%.
- A suit answer must also be the suit with the most trumps, as the cheat sheet's first step says.
- Answers already given to questions that were dropped no longer count.
- The order is new: question numbers changed, and a browser's place in the run continues from its number.
