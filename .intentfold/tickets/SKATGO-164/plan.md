# SKATGO-164 plan

## What the code shows

- **Free play** (`server-table.tsx`).
  - The server answers a move with every state it passed through.
  - The page shows them one by one, `BOT_DELAY` (850 ms) apart.
  - A finished trick stays until it is tapped, or until `TRICK_PAUSE` has passed.
  - The player's own card is drawn at once (`pending`, SKATGO-73), and the answer with the steps replaces it in the same tick.
- **A private room** (`table-room.tsx`, `multiplayer/src/room.ts`).
  - The server moves the computers itself, one beat apart. The beat is `AI_DELAY_MS`, default 350 ms.
  - The page shows every state the moment it arrives.
  - So everything queued behind a held finished trick (the trick collected, then both computers' cards) comes out at once.
  - The beat itself is 350 ms, under half of free play's.
  - A computer's skat step (pick up, discard, declare) is applied in one beat, so it shows as one state.
- **The jitter.** The room sends its receipt as soon as the move is stored. The state follows with the next patch, up to 50 ms later. The receipt clears `sending`, so the table is no longer busy while it still shows the old state. `GameTable` then drops the pending card: it jumps back to the hand, then flies again when the state arrives. Any other state arriving meanwhile, such as someone's connection, does the same.

## Route

1. **Service (`room.ts`, `server.ts`).**
   - The computers' beat defaults to free play's 850 ms. `AI_DELAY_MS` still overrides it; the tests use 30.
   - A computer makes one move per beat, so a skat step shows as pick up, discard, declare.
   - `publicView` carries `played`: the revision of the last change to the game itself.
2. **Page (`table-room.tsx`).**
   - A state that changes the game is shown no sooner than `BOT_DELAY` after the last such state, like free play's steps.
   - Not paced:
     - the answer to the viewer's own move, already drawn;
     - states that change nothing in the game (connections, seats), which show at once.
   - A finished trick is held as before.
   - While a move is on its way, no other state replaces the table. The move stays sent until the state carrying it arrives, not just its receipt.
   - A refusal ends the wait and the card goes back.
3. **Records.** `engineering.md`'s rooms entry names the beat. `multiplayer/README.md`'s `AI_DELAY_MS` row gets the new default.

## Undecided, for the grill

- Whether the room's beat should follow free play exactly (850 ms) or just be slower. The request says "the same as free play", so: exactly.
