# SKATGO-151 handoff

## What changed

- **Two steps** (`practice.ts`):
  - New helpers: `CONTRACTS` (pass ♣ ♠ ♥ ♦ Grand Null), `solutionOf` (the AI's contract and bid), `valueOptions` and `difficultyOf`.
  - `valueOptions` gives step 2's numbers: the right multiplier and its neighbours, never under 2. A Null gets 23/35/46/59.
  - `difficultyOf` sorts the questions:
    - Tier 1: 6 or more trumps, or 3 or fewer.
    - Tier 2: the hands the rules of thumb decide.
    - Tier 3: the rest, plus every Grand and Null hand.
  - The record is now `{ contract, value, fixed }`. `readAnswered` reads SKATGO-150's one-number rows as the contract the number stood for.
  - `analysisOf` sorts mistakes into four kinds: passed, played, wrong game, wrong bid.
- **Data**: the same 300 questions, reordered easy to hard by `make-bidding-practice.ts`. The first Grand or Null hand is question 166.
- **Record (multiplayer)**:
  - `bidding_answers` gains `contract` and `value`, and `first` becomes nullable. This is additive, done by `ALTER TABLE … IF NOT EXISTS` at start.
  - `/bidding/answer` and `/bidding/merge` take the complete two-step attempt and check it against the question.
- **Page** (`bidding-practice-page.tsx`):
  - Step 1, "What do you play?": seven contracts two by two, also on a phone (a new `pairs` option on `Choice`), with Pass last.
  - Step 2, "The AI plays X. How high can you bid?": shown unless the AI passes.
  - Each step marks right and wrong at once.
  - The explanation is in plain words, for example "Diamonds ♦: 6 trumps and 1 Ace beside them. Without 1, game 2 × 9 = 18." When the player chose another contract, its facts follow.
  - A "Bidding cheat sheet" link opens a `Modal`. Its text is in `cheat-sheet.{en,de}.ts`, seven sections.
  - The stats rows are Wrong plus the four kinds, label and value on one line. The kinds add up to Wrong (largest remainder).
- **Front page**: the tile reads "Bidding" / "Reizen", and `minHeight: 0` keeps its shape whatever the title.
- **Copy**: the page's foot line and search description now describe the two questions.
- **Charter**: product.md, ui.md and engineering.md.

## AC results

Script `tmp/ac.mjs`, 10/10, against web 55151, multiplayer 56151 and local DB 57151, built.

1. **PASS.** At 360, 375 and 390 wide, in en and de, the bidding tile's top and bottom equal Learn's, and the title is one line.
2. **PASS.**
   - Step 1 lists Clubs ♣ | Spades ♠ | Hearts ♥ | Diamonds ♦ | Grand | Null | Pass, with no step 2 before a pick. A pick marks the choices.
   - Step 2 reads "The AI plays Diamonds ♦. How high can you bid?".
   - A pass question (question 2) ends after step 1.
3. **PASS.** "The AI plays Diamonds ♦: 6 trumps and 1 Ace beside them. Without 1, game 2 × 9 = 18. | Clubs ♣ would have 3 trumps and 1 Ace beside them."
4. **PASS.** The cheat sheet has seven sections and all 16 key points. The German version is titled "Reiz-Spickzettel", with seven sections. It closes.
5. **PASS.**
   - A fresh account's attempts (right, played, passed, right, game, value) gave Wrong 67% and the kinds 17/17/17/16, which add up.
   - Unit tests cover the analysis. The multiplayer test covers the record: the new shape, an old row read, and the merge.
6. **PASS.** Null is offered. Question 166 (Null ouvert Hand) is answered right with Null and 59, and its values are 23/35/46/59. There is no Grand or Null hand in the first 20; unit tests confirm the first 20 are tier 1.
7. **PASS.** At 375×812 and 1280×820, the question, explanation and dialog stay inside, with no sideways scroll.

Mechanical defence passed: typecheck, build, 303 tests, bundle, tokens, literal grep, SSR link, `check:seo --built` and `test:seo`. Multiplayer check: 34/34.

## Deviations

- The plan put Pass on its own row first. It sits last instead, because the contracts read first and Pass stands apart at the end.
- Grand and Null hands were moved to the last tier. A Null ouvert Hand had landed at question 2, since it has few trumps.
- After the fresh-eyes look:
  - The explanation is now plain words.
  - Step 1 of the cheat sheet mentions Null.
  - The point table has one holding per row, in words.
  - "9 or more" and "8½" are merged into one line.
  - The contracts are two by two on a phone.
  - The stats rows are on one line and add up.
  - The foot line and search description are updated.

## Environment

- Ports: web 55151, multiplayer 56151, database 57151.
- No env keys changed.
- `bidding_answers` gains two columns at start.

## Residual

None.

## Check

1. The explanation's wording: game, trumps, the Aces beside them, then the sum.
2. The cheat sheet: seven sections and the point table in words.
3. Step 1 on a phone: seven contracts two by two, Pass alone at the end.
4. The stats rows: Wrong, "Passed, should have played", "Played, should have passed", "Wrong game", "Wrong bid".
5. The front-page tile titled "Bidding".

## Decided for you

- An attempt is recorded once complete. Only first attempts count.
- The four kinds never overlap, and their shares add up to Wrong.
- Step 2 offers the right multiplier and its neighbours, never under 2. A Null gets its four values.
- Grand and Null hands come after the suit hands, from question 166.
- Today's one-number answers are converted, not cleared.
- Answers given after opening the cheat sheet count like any other.
