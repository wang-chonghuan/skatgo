# SKATGO-238 plan

What the code says that the ticket does not:
- Start: `START_AT` drives the page and `standingAfter`; new rows also get the column default (1500 since SKATGO-219).
  The lines 0 and 2000 do not move, so no points are rescaled.
- Phone lock: `useSeat` (table-room.tsx) has three ways to hang on "Reconnecting …":
  1. `comeIn` guards itself with `trying`; an `enter()` that never settles (a fetch or a WebSocket opened while the phone
     was waking) leaves `trying` true for good, and every later try — the timer, visibility, online — returns at once.
  2. While the SDK reconnects by itself (`dropped`), nothing on our side hurries or ends it: its 15 tries run up to about a
     minute, and a reconnection socket that neither opens nor closes keeps it there longer. Coming back to the page does
     not help, as the visibility handler only acts while our own retry loop runs.
  3. A socket that died while the page was frozen may still look open: no drop, no states.
- Avatars: free play draws Lina's and Noah's faces above their stacks (`SeatFace`, hidden at any `room`). League seats
  carry a nickname but no face; personas have no `player_avatars` row, and everywhere else (boards, forum) a missing face
  is the drawing of the name (`facePath(null, name)`).

Route:
1. Start 1000 — `START_AT = 1000`, column default 1000, comments, tests, charter.
2. Reconnect — in `useSeat`: each `enter` attempt times out (12 s) and a late result is let go; on coming back to the page
   (visible, pageshow, online) a seat in the SDK's reconnection, or one whose connection does not answer a ping within
   3 s, is let go quietly and entered afresh (the table stays drawn under the line); a reconnection still running 10 s
   after the page is in front is ended the same way. A let-go room's handlers ignore it from then on. The existing 2-minute
   limit still ends in the error with "Try again"; a seat no longer there still goes back to the League page.
3. Avatars — the service keeps each League seat's face (`player_avatars` at the time the table forms; none for a
   persona) and publishes it with the seat; the League table passes the two opponents' pictures to `GameTable`, which
   draws them, still, where free play draws its faces.
