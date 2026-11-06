# SKATGO-174 acceptance checks

1. **The week line.** Build, open `/` (English) at 1280×820 and 375×812, open the XP board's question mark; the
   modal's week line says the streak carries on across weeks and only XP starts at 0 on Monday. Same at `/de/`.
2. **Live without reload.** With the built app and the local multiplayer service on the ticket ports, open `/` in
   one browser; record a finished deal for another account straight into the local database (the rows the service
   writes when a deal ends); without reloading, the board shows that account's new XP and streak within 20 s.
3. **Back into view.** Hide the page (`visibilitychange` to hidden), add another deal, show it again; the board
   asks at once and shows the new numbers well before the 15 s tick. While hidden, no `/api/daily/xp` request goes out.
