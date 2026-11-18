# SKATGO-209 acceptance check

`tmp/ac.mts` against the ticket's production build (web 55209, multiplayer 56209, db 57209), a test account, 1280×820:

1. AC1 — League page → Play → the table opens; "Tisch verlassen" from the corner menu → the League page; browser back:
   not the table address, no "This table has closed." (no `table-notice` with that text) at any moment of the way back.
2. AC2 — `/en/league/play` opened directly with no running table: lands on `/en/league`, the closed text never shown.
3. AC3 — League page → Play → table; browser back → the League page with "Back to your table"; it opens the same room.
No deal is played: the table is only opened and left.
