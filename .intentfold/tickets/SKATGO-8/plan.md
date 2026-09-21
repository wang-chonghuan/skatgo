# SKATGO-8 plan

## What the code says that the ticket does not

- The computers never play Hand and never announce: `aiDeclare` always calls `pickUpSkat`, then
  `chooseDeclaration(twelve, bid)`, which picks discard + contract jointly from `plans()` with the rank
  `(covers bid ? 10 : 0) + plan.score + value / 1000`, and every declaration it returns is `plain()`
  (no Schneider/Schwarz/Ouvert). "Hints from the computers' own logic" therefore means: pick up the
  skat; announce nothing; choose the contract by that same rank.
- The learner reaches the declare step in two ways: after picking up and discarding (known cards = the
  ten kept + the two discarded) or after choosing Hand (known cards = the ten dealt; the skat unseen,
  value counted over the hand alone — exactly what `DeclarePicker` already shows).
- Hints live in `GameTable`'s `hint` state and render in the actions panel (💡, tip tone); buttons are
  `Btn tone="felt" size="sm"`. The skat-choice row and `DeclarePicker` have none.
- Course map: the right-hand hero panel (`progress` box) holds "总体进度 + %", the progress bar, the
  note line (done n / 11 · games, won) and the resume link; a separate "自由对局" section sits at the
  bottom of the page.

## Route

1. `ai.ts`: extract the rank into one function used by `chooseDeclaration` and a new
   `declarationAdvice(ten, known, bid, hand)` (best contract for the ten the learner kept, same rank,
   declaration `plain` + `hand`), and `skatAdvice(ten, bid)` (always "pick up", plus the best Hand game
   and whether it would cover the bid — from the same plans and `expectedValue`). Engine returns facts;
   wording via messages.
2. `game-table.tsx`: a 💡 button on the skat-choice row and in `DeclarePicker`, writing to the same hint
   panel.
3. `course-home.tsx`: the hero panel's progress head + bar are replaced by the free-play link
   (`linkLook('felt', 'lg')`); the note line and the resume link stay; the bottom free-play section is
   removed; unused messages removed from all three catalogues.
4. Test: for many deals, `declarationAdvice` on the ten the computer keeps names the same contract as
   `chooseDeclaration` — the hint cannot drift from how Lina and Max play.
