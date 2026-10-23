# SKATGO-123 acceptance checks

1. **Every player has an Elo by the rule; through 2026-10-23 it equals the ticket's list.**
   Check: the shared rule run on production's tournament rows (copied locally) through 2026-10-23, with the
   two merges, gives the ten rows of the ticket (name, Elo, provisional). The unit test proves the rule's
   worked examples.
2. **Julien and Mark each appear once.**
   Check: the local service's `/daily/elo` and the front page list each name once, with the merged days.
3. **PC hero: two columns, the text on one side and the Elo board on the other.**
   Check: Playwright at 1280×820 on `/` and `/en`: the headline and the board side by side, the board's rows
   in the HTML the server sends.
4. **Phone: the board is there, folded.**
   Check: Playwright at 375×812: one line naming the board and its leader; a tap opens the rows.
5. **After a day ends, that day's players move.**
   Check: the service asked with a clock one day later counts the day just ended (today's entries are not
   counted while the day runs); the rule's test covers an update.
