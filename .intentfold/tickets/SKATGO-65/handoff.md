# SKATGO-65 handoff

This work came through an open development phase; this file records what was delivered and verified,
not which tool or skill produced each edit.

## What changed

1. **A deal decided early is laid open before its settlement.** This covers the declarer showing the rest (by the learner or a computer) and the defenders giving up a Null (SKATGO-59). It holds at every table.
   - Everyone's remaining cards show face up in place: the learner's in the hand, each opponent's in their side stack.
   - An amber line says who claimed or conceded what. It reuses the settlement's `earlyLine` text.
   - SKATGO-72's blinking hand shows, and a tap anywhere opens the settlement.
   - `app/src/components/skat/game-table.tsx`:
     - `restHands` reads each seat's remaining cards from the tricks played out after `early.from`, so no server change was needed;
     - the `revealed` state gates the settlement dialog, its confetti and `onSettled`;
     - `Stack` takes a `shown` list.
2. **Open side stacks are readable.**
   - The right stack, when open, turns the other way (`pose.sidewaysOpen`) and stacks bottom-up (`column-reverse`), so each card's index is on the part that shows.
   - This also improves an Ouvert declarer's open hand on the right.
   - Laid open after an early end, the cards spread wider (`stage.stackStepOpen`: 32u visible per card, 30u in portrait).
3. **Single-sentence pills wrap.** In `app/src/components/skat/ui.tsx`, `Pill` keeps non-breaking spaces only for multi-part facts joined by " · " (SKATGO-58). A one-part sentence wraps within the screen.

Registry additions, asked for by the human's layout requests in this ticket:
- `elevation.stylex.ts` `pose.sidewaysOpen`;
- `table.stylex.ts` `stage.stackStepOpen`.

## AC results

Built product on port 55065, free play, scripted legal moves (`tmp/reveal.mjs`), at desktop 1280×800 and phone 390×844.

1. **A claim lays everyone's remaining cards open, with a line and the tap hand.** Met, in 5 runs of computer claims across desktop and phone.
   - In each run the learner's hand and both stacks held the same number of open cards (2–7).
   - The line read, for example, "Max zeigt den Rest: die letzten 5 Stiche gehen an ihn."
   - No settlement dialog showed.
2. **Only a tap brings the settlement.** Met. In every run the dialog appeared after one tap and the reveal was gone.
3. **A conceded Null is laid open the same way.** Not observed live.
   - The scripted learner always passes, so no conceded Null came up.
   - The reveal is gated only on `game.early`, which a concession sets exactly as a claim does. `restHands` reads the tricks `playOut` produced, the same for both.
   - The learner's own claim was likewise not driven, since the learner never declared.

Mechanical defence passed in full:
- typecheck and build;
- 101 tests;
- 21 client chunks;
- 120 token files;
- literal grep 0;
- SSR link;
- `check:seo --built` and `test:seo`.

## Deviations

- The Proposed solution suggested open cards "in the settlement panel or on the table". After a first in-frame version, the human chose in-place stacks.

## Environment

- Ports 55065 / 56065 / 57065; local database container `skatgo-multiplayer-db-57065`.
- The worktree's `MULTIPLAYER_URL` and `DATABASE_URL` ports were pointed at the ticket ports locally.
- No env key added, changed or removed.

## Residual

- A conceded Null and the learner's own claim are worth one manual look.
- With all 10 cards laid open (an early end before the first trick), the spread stack is long and may reach the hand area on a phone.
- Charter drift: `ui.md` does not describe the early-end reveal, the open right stack's orientation, or the pill wrapping.
