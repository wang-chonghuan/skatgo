# SKATGO-171 handoff

## What changed

`game-table.tsx`: the replay's notice moves from the messages over the felt to the middle of the frame, its first child, taking no clicks. Charter `ui.md`.

## AC results

`tmp/accept.mjs` → `tmp/accept.txt`, 20 PASS, en/de, desktop/phone, no card played.
1. Centre on the frame's: offset 0, 0; not in the messages — pass.
2. During the bidding the skat lies over it at its left and right quarter; first in the frame; no clicks taken — pass. Seen once the frame is empty — pass.
3. No notice the first time — pass.
4. No sideways scroll, no page errors — pass.

Mechanical defence: pass (`tmp/defence.log`, 339 passed). Multiplayer unchanged.

## Deviations

None.

## Environment

Ports: web 55171, multiplayer 56171, database 57171. No env keys changed.

## Residual

None.

## Check

1. Replay a free deal: the words in the frame's middle, under the cards.

## Decided for you

- During the bidding the skat covers it, so it cannot be read then, as asked.
