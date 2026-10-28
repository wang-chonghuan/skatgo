# SKATGO-144 AC check plan

Local web 55144, multiplayer 56144 with a copy of production's tournament rows (deleted at close), database 57144.
`tmp/ac.mjs` at 1280, 1440 and 1920 wide and on a phone.

1. The board's top and bottom equal the course card's beside it (±1px), and its list scrolls (scrollHeight > clientHeight).
2. No gap under the colour cards — follows from 1 (the row is theirs).
3. Phone: no sideways scroll; the board folded as before (screenshot).
