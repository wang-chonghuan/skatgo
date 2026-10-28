# SKATGO-143 handoff

## What changed

- **No empty pill** (`game-table.tsx`, `styles.words`): the table's line is hidden while it has nothing in it — a real
  table says nothing while the player plays (SKATGO-134), and its dark frame stood alone under the info board.
- **One thing at a time** (`game-table.tsx`): Lina's or Noah's line waits while the table itself asks for a tap — a
  claim laid open, a trick to collect — or shows a hint or a refusal; then it shows, and the next tap puts it away. So
  one hand at a time. The tap that dismisses the table's own prompt no longer takes the waiting line with it: the table,
  not `lib/table-talk.ts`, now dismisses only a line it shows.
- **No overlap**: on a wide table the line stays beside the frame; otherwise it sits in the top band's flow under the
  table's line, at the speaker's side, instead of floating over the frame, where it ran into the board and the line.
- Charter `ui.md` follows.

## AC results

Local web 55143, multiplayer 56143 with the site's model, database 57143; the player only passes (no game played).

1. **No dark pill on the player's turn** — passed: with the line empty its computed display is `none` (phone);
   screenshots `tmp/phone-talk.png`.
2. **One prompt, one hand at a time** — by the code: the line is not shown while a claim is laid open, a trick waits for
   its tap, or a message is up, and only a shown line is put away by a tap; the claim and the tap-to-collect states need
   play to reach and are left to the human's play.
3. **No overlap on a phone** — passed: the line's box overlaps neither the info board nor the table's line, at phone and
   PC size, one hand on screen (`tmp/ac.mjs`).

Mechanical defence: run at close.

## Deviations

None.

## Environment

Ports: web 55143, multiplayer 56143, database 57143. No env change.

## Residual

None.

## Check

1. Play a deal on a phone: no dark pill under the board; when Noah claims, his line comes after the claim's tap.

## Decided for you

- A hint or a refusal also holds the line back, as they ask for attention too.
