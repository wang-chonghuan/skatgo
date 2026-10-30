# SKATGO-159 handoff

## What changed

- **Questions** (`app/src/lib/skat/bidding/practice.data.ts`, generated): 150 instead of 600.
  - 30 that the rules of thumb answer come first.
  - The other 120 are hands the rules of thumb get wrong in at least one step:
    - 22 passes they would bid.
    - 25 games they would pass.
    - 30 where SkatZero plays another game than the longest suit (Grand and Null included).
    - 30 where SkatZero stops below the counted value, right where its chance drops.
    - 13 borderline games that SkatZero says only 18 with.
  - Order: the rules-of-thumb questions, then those missing pass/play or the bid, then those missing the game.
- **`practice.ts`**:
  - `routineOf` is the rules of thumb: the longest suit, played with 6 trumps, 5 trumps and an Ace, or 2 Buben and 2 Aces, bid to its count. `routineMisses` says which steps it gets wrong, and `difficultyOf` now uses it.
  - A question stores its contract, step 2's three numbers (`options`), SkatZero's chance at each (`odds`), each game's chance at the bid (`games`), and for a stop below the count the next bid with its chance (`above`).
  - `answerOf`, `gameOf` and the SKATGO-150 `readAnswered` are gone.
  - Question ids are `v2-deal-seat`.
- **SkatZero analysis** (`multiplayer/src/skatzero/bidding.ts` `seatGames`, beside the port): also returns `made`, the chance each suit game and Grand is made at every bid over the same skats. Won, Schneider or Schwarz are counted against the twelve cards' value.
  - `bidding-practice-games.ts` now covers every seat SkatZero bids, plus the seats the rules of thumb would bid. It can run in parts side by side: 1,685 hands in about 50 minutes on 7 processes.
- **Generator** (`make-bidding-practice.ts`):
  - Quotas per kind.
  - SkatZero must play the contract in ≥ 60% of skats and pick up (unchanged).
  - A bid below the count is kept only when SkatZero's chance at the bid is ≥ 55% and at the very next bid ≥ 12 points lower. Or, at 18: the chance is ≤ 68% and the count itself is clearly riskier.
- **Explanation** (`bidding-practice-page.tsx`, en/de messages). The AI is always called "the AI", never SkatZero (SKATGO-146), and each number is said once:
  - Contract line: when the AI plays another game than the longest suit, the longest suit's chance at the bid.
  - A pass the rules of thumb would bid: their game's chance at 18, and that a lost game costs about twice what a won one brings.
  - A stop below the count names the reason: a Bube in the skat would shorten the "without" (true for all 45 such questions). It reads either "the AI's chance drops right above 24" or "a borderline game … say 18, go no higher", then the count itself.
  - A line of the AI's chances per offered number, plus the bid right above a stop.
  - A contract chosen instead gets its own chance.
  - The "thin hand" line no longer says "with 1 Buben".
- **Step 2's numbers** vary where the right one sits. A fresh-eyes look found it lowest in 61 of 84 bid questions; now it is lowest 29, middle 45, highest 10. The 20 answers at 18 have nothing under them.
- **Cheat sheet** section 5: one new point — a Bube in the skat can only shorten a "without" run, so a shaky "without" hand stops below its count.
- **Old records**:
  - `multiplayer/src/store.ts` deletes every `bidding_answers` row not named `v2-…` when the service starts.
  - The browser removes `skatgo.bidding.v1` and `skatgo.bidding-practice`; the new keys are `.v2`.
- **Tests**:
  - `practice.test.ts`: the routine, options and odds, the short run with the routine's questions first and at most a quarter, the stops below the count, `v2-` ids.
  - `test/bidding-practice.test.ts`: pool proof; SkatZero recomputes the share and every chance for five questions.
  - `test/bidding-record.test.ts`: old rows deleted on migrate.
- **Charter**: product.md (bidding practice paragraph, amended as the ticket says; SkatZero's numbers are now shown) and engineering.md (the bidding row).

## AC results

1. **PASS.** 150 questions. The page shows `1/150` (Playwright, web 55159).
2. **PASS.** 30 of 150 (20%) are answered by the routine, all first (vitest).
3. **PASS.** Every question after them is missed by the routine in a step (vitest).
4. **PASS.**
   - 45 questions bid below the count: 32 where the chance drops at the next bid, 13 borderline at 18.
   - Question 35 (Clubs counted 48, bid 24), after a wrong bid, explains: "a Bube in the skat would shorten your “without”, so the AI's chance drops right above 24", then "24 — 70% · 27 — 58% · 48 — 47%". No "SkatZero" anywhere.
   - Question 37 shows the borderline-18 line.
   - Playwright, PC and phone, with no horizontal scroll.
5. **PASS.**
   - Every question is its pool seat with SkatZero's highest bid; every bid question's `sure` is ≥ 0.6.
   - Five questions are recomputed by SkatZero (exact count, below count, borderline, Grand, a pass) and equal their recorded share and chances.
   - `npm --prefix multiplayer run check`: 36/36.
6. **PASS.**
   - A browser holding the v1 keys (progress 37 and an answer) opens at `1/150`, with no stats card, and the old keys are removed.
   - An old row (`337-0`) in the ticket database is gone after the multiplayer service restarts.
   - `bidding-record.test.ts` covers the same.

Mechanical defence passed: typecheck, build, 307 tests, client bundle, tokens, literal grep, SSR link, `check:seo --built`, `test:seo`.

## Deviations

- **"How far" is only ever "stop below the count".** The plan allowed bids above it too. In the pool, SkatZero never bids past the count with a game it picks up: every such bid is a Hand game, which the practice does not ask. The over-the-count explanation was removed.
- **The "the opponent has bid 30, do you hold?" format was not added.** AC4 accepts either format, and the two-step page stays as it is.
- **After a fresh-eyes look:**
  - The answer's position among the three numbers was varied.
  - "SkatZero" was replaced by "the AI".
  - Repeated percentages were removed.
  - The bid right above a stop was added to the chance line.
  - Acceptance and both defences were rerun on the result.
- **Some stops were excluded.** Where SkatZero's chance does not drop at the next bid, its stop comes from its own bidding penalties, and nothing on the page could explain that.

## Environment

- Ports: web 55159, multiplayer 56159, database 57159.
- No env keys changed. No schema change.
- The startup migration deletes the old `bidding_answers` rows. Back up that table before deploying.

## Residual

None.

## Check

1. **Is it hard enough without being a guessing game?**
   - http://localhost:55159/en/bidding-practice — answer a few from question 31 on (the rules-of-thumb ones are 1–30).
   - Sign in with Gmail on that page; from question 3 on an account is needed. Questions 1–30 are the quick basics.
2. **The reasons on a stop below the count:**
   - Question 35 and question 37.
   - The bar is not stated anywhere: borderline games sit at 63–68%, a stop at 58%, a pass at 50%. The fresh look found that confusing; tell me if you want it said.
3. **The middle number is the right one in 45 of 84 bid questions.** Tell me if that is still too guessable.

## Decided for you

- 150 questions: 30 basic, 22 pass, 25 play, 30 another game, 30 stop below the count, 13 borderline 18.
- The number shown is SkatZero's chance to make the game at a bid, over every skat, in whole percent.
- "How far" is only "stop below the count". SkatZero never bids past it except in a Hand game.
- The two-step page and its buttons are unchanged; no "opponent has bid X" question.
- The old answers are deleted when the new multiplayer service starts, an account's and a browser's.
