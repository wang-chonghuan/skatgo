# SKATGO-179 AC check

1. Title: on `/` (en) the board's heading reads "XP & win rate"; on `/de` "XP & Gewinnquote". The board and its how dialog contain no weekly / this week / Monday (Woche / Montag). Playwright reads the heading and the dialog text.
2. Earlier deals count: in the ticket DB (owner's prod rows copied with demo-me.sh), an account whose deals are all before this Monday shows on the board; its XP equals the sum over all its deals. Checked by the multiplayer xp test (deals of 28 Oct counted) and by `POST /daily/xp` on the ticket service showing rows from earlier weeks.
3. No countdown: the board shows no reset days; the `/daily/xp` answer has no `resetsIn`.
4. Empty text: with no XP the board says "No XP yet." (no week). Checked in the text source and the test DB with no deals.
