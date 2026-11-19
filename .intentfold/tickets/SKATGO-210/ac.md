# SKATGO-210 acceptance check

`tmp/ac.mts` against the ticket's production build (web 55210, multiplayer 56210, db 57210). Seeded into the ticket DB
only: test accounts with play_deals rows (so they are on the XP board) and League tiers 0, 2 and 5, one with none.

1. AC1 — `/en`: the League tile reads "Ranked match", `/de`: "Ranglistenspiel"; the tile still links to the League page,
   the "New" ribbon there.
2. AC2 — every XP board row has a badge; the seeded accounts' badges are their tiers (none → Bronze); personas' rows, if
   any, carry a badge too.
3. AC3 — 1280 and 375: every row one line high, the badge inside the row, a long name ends in an ellipsis.
