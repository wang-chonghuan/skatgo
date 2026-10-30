# SKATGO-164 handoff

## What changed

- **The room's beat** (`multiplayer/src/server.ts`).
  - A private room's computers move one beat apart, now free play's 850 ms (`AI_DELAY_MS` default; it was 350 ms).
  - The tests still set 30 ms.
- **One computer move per beat** (`multiplayer/src/room.ts`).
  - A computer's skat step (pick up, put away, the game) is three states, as free play shows it.
  - The next beat decides the rest again from the same cards.
- **`played` in the public view** (`multiplayer/src/model.ts`, `app/src/lib/skat/room-view.ts`).
  - It is the revision of the last change to the game itself.
  - The page uses it to tell a move from a connection or seat change.
- **The page's pacing** (`app/src/components/skat/table-room.tsx`).
  - A change to the game goes on the table no sooner than `BOT_DELAY` after the one before, like free play's steps.
  - The answer to the seat's own move goes on at once.
  - Changes that are not moves go on at once, or are dropped when a later full state already follows.
  - A finished trick is held as before.
- **No jitter** (`table-room.tsx`).
  - A move stays on its way until the state carrying it arrives, not just its receipt; the receipt used to come first.
  - While it is on its way, no other state replaces the table, so the card just played stays on the felt.
  - A refusal still sends the card back.
- **Records:**
  - `engineering.md`'s rooms entry names the beat;
  - `multiplayer/README.md`'s `AI_DELAY_MS` row has the new default;
  - `room-view.test.ts`'s fixture carries `played`.

## AC results

- **1. AI cards one after another, at free play's beat.** `tmp/accept.mjs` samples the felt every animation frame (`tmp/accept.txt`).
  - Consecutive AI cards: 853 / 869 ms apart.
  - The first AI answer comes 920 / 891 ms after the player's card.
  - After a finished trick held 3 s and tapped, the card queued behind it came a beat later.
  - English desktop and German phone. **Pass.**
- **2. The player's card, no jitter.** From the tap until its trick was collected, the card never left the felt or reappeared in the hand: 0 frames off, English desktop and German phone. **Pass.**
- **3. Other AI steps at the beat.**
  - AI bids came 854 ms and 1169 ms apart, and the finished trick is held and collected as before.
  - The skat step was checked at the service with `tmp/skat-step.mjs` (`tmp/skat-step.txt`): an AI declarer that picked up showed `skat → skat+picked (12) → declare+picked (10) → play`. **Pass.**
- **4. Languages and widths.** Criteria 1 and 2 ran on `/en/` desktop and `/de/` phone. **Pass.**
- **Negative control.** The same `accept.mjs` against the code before this ticket (`tmp/control.txt`) gave 1/10:
  - AI cards 350 ms and 0 ms apart, both at once after the held trick;
  - AI bids 350 ms apart;
  - the player's card off the felt for 2 frames: the reported jitter.
- **Mechanical defence:** 320 tests, bundle, tokens, git grep, SSR link and SEO pass (`tmp/defence.log`).
- **Multiplayer check:** 42/42 (`tmp/mp-check.log`).
- **Look through the human's eyes:** not run. The ask is about rhythm and motion, which stills cannot show. The measured timings and the negative control stand in for it, and the human judges the feel by playing.

## Deviations

None from `plan.md`.

## Environment

- **Ports:** web 55164, multiplayer 56164, database 57164.
- **Env keys:** none added, changed or removed.
  - `AI_DELAY_MS` is not set on Render, so production takes the new 850 ms default.
- **Deploy:** multiplayer and web both change. Multiplayer first: an old page ignores `played`, and a new page without `played` paces every state, which still works.

## Residual

None.

## Check

1. Open a room, give both seats to the AI, start, and play a few tricks. Do the AIs' cards and bids feel like free play's, and does your card go down cleanly?

## Decided for you

- The room's beat is exactly free play's 850 ms, not just "slower".
- The pacing is at both the service (the beat) and the page (bursts behind a held trick or after a reconnection).
- An AI's skat step shows as pick up, put away, then the game: one state per beat, as in free play.
