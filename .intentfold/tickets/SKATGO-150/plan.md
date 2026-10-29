# SKATGO-150 plan

## What the code already says

- The ladder's record (SKATGO-109) is the pattern: `multiplayer/src/ladder.ts` (routes behind the admission key, table
  `ladder_answers`), `app/src/lib/tricks-handler.ts` (names the player, forwards), `ladder-progress.ts` (guest record in
  localStorage, merged into the account at the first look once signed in). It keeps only solved/misses — not which answer
  was chosen — so it cannot tell too high from too low; the bidding practice gets its own record beside it.
- A question's answer and options come from `lib/skat/bidding/practice.ts`; the server can import them to check a chosen
  answer, as `ladder.ts` imports the endgames.
- A stacked ratio bar would need new tokens (ui.md Redline 1); the analysis is a plain table instead (the human: 「不要花哨」).

## Route

1. **Record** — `multiplayer`: table `bidding_answers (player, question, first, fixed, answered_at, updated_at)`;
   `src/bidding.ts` with `/bidding/state|answer|merge` (question id `<deal>-<seat>`, chosen = 0 for pass or the number;
   both checked against the question's options; the first answer stays, a later right one sets `fixed`); mounted in
   `server.ts`. Web: `tricks-handler.ts` forwards `/api/tricks/bidding/*` too.
2. **Logic** — `practice.ts`: `questionId`, `analysisOf(record)` (answered, right, over: pass/game, under: pass/game),
   `mistakesOf(record)` (wrong first, not fixed, in question order). Unit tests.
3. **Client record** — `lib/skat/bidding/record.ts`: as `ladder-progress.ts` (guest's free questions in localStorage,
   merged at sign-in).
4. **Page** — under the question: a white card "Your bidding", n answered; rows Right / Overbid / Underbid with
   percentages, each wrong row with its two counts; then the mistakes as numbered buttons opening that question again.
   Hidden until there is an answer. Guest gate text: why to sign in, short.
5. **Charter** — product.md / ui.md / engineering.md for the record, the analysis and the gate.

## Redline lookup

ui.md 1: no new tokens planned. engineering.md 3: no dependency. operations.md: local data only.
