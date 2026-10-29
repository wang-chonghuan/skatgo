# SKATGO-151 plan

## What the code already says

- The question is one `Choice` of numbers (`optionsOf`), recorded as `{ first, fixed }` per question (SKATGO-150,
  `bidding_answers.first`), analysed by `analysisOf` into right / over (pass, game) / under (pass, game).
- `answerOf` already names the AI's contract for every stored question (pass, one suit/Grand game, or a Null by value),
  so step 1's right answer and step 2's value are both derivable with no new data.
- `Modal` (ui.tsx) is the site's dialog and scrolls inside; the Elo board's "how it is counted" uses it.
- The front-page tile has `aspectRatio` but no `minHeight: 0`, so a title taller than its room stretches the tile —
  the misalignment on a phone with wider type.

## Route

1. **Logic** (`practice.ts`): contracts `pass C S H D G N`; `contractOf(answer)`; `valueOptions(question)` (three
   levels around the right one for a suit/Grand game; 23/35/46/59 for Null); `difficultyOf` (1: ≥6 or ≤3 trumps,
   2: 5 trumps + side Ace or 4 without, 3: the rest); record `{ contract, value, fixed }` with old `{ first }` rows
   read as their contract; `analysisOf` → right / passed (should play) / played (should pass) / wrong game / wrong
   value; `mistakesOf` unchanged in meaning. Unit tests.
2. **Data**: `make-bidding-practice.ts` keeps the same 300 and orders them by difficulty (seeded shuffle inside each
   tier); regenerated `practice.data.ts`; the pool test stays.
3. **Record**: `bidding_answers` gains `contract`, `value`; `first` nullable (migration in `store.ts`); `/bidding/answer`
   takes `{ question, contract, value }` once an attempt is complete; merge takes the new shape; old rows are read as
   their contract. Web handler unchanged. Client `record.ts` follows.
4. **Page**: step 1 — "What do you play?" Pass on its own row, then ♣ ♠ ♥ ♦ Grand Null two by two; verdict at once.
   Step 2 (unless the AI passes) — "The AI plays X. How high can you bid?" its value options; verdict at once. Then the
   explanation from the hand's facts and "Next question". Stats rows: Wrong, Passed a playable hand, Played a hand to
   pass, Wrong game, Wrong value. Cheat sheet link at the card's top right opening a `Modal`
   (`bidding/cheat-sheet.{en,de}.ts`).
5. **Front page**: tile title "Bidding" / "Reizen"; tile `minHeight: 0` so it keeps its shape.
6. **Charter**: product.md, ui.md, engineering.md.

## Redline lookup

ui.md 1: no new tokens planned. engineering.md 3: no dependency. operations.md: local DB only; the production table
changes by `ALTER TABLE … ADD COLUMN IF NOT EXISTS` at start, additive.
