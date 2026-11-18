# SKATGO-209 plan

Found in the code (league.tsx `LeagueTable`): leaving the table (`leave`: the menu's "Tisch verlassen", the result's way
out, "Zur Liga") and the room's `dismissed: 'left'` go to `/league` with a pushed history entry, so the history is
League → table → League and the way back lands on `/league/play`. There `enterLeague` gets `no_table` and the page shows
"This table has closed." with a "Zur Liga" link that pushes `/league` again — the way back bounces between the two.
A sitting that closed (`gone: closed`) or was opened on another device (`gone: elsewhere`) shows the same text.

Route (the ticket's proposed solution):
1. `leave` and `dismissed` (every reason) navigate to `/league` with `replace: true`; the Notice's "Zur Liga" link replaces too.
2. The table page with `no_table` or `gone` replaces itself with `/league` (an effect), showing only "Loading…" for that
   moment — no "table closed" page.
3. Entering the table from the League page (`play`, "Back to your table") still pushes, so the way back from a running
   table is the League page with "Back to your table" (AC3).
4. Charter ui.md: the League table's way back.
