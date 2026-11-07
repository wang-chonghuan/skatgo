# SKATGO-178 AC checks

1. Rows rank · name · win rate · XP, no 🔥 — production build on the ticket port, home page at 1280×820 and
   375×812 (English): no `🔥` in the page text, each `xp-board-row` has a `%` or `–` cell, no row wider than the list.
2. Ordered by XP — the rows' `data-xp` are non-increasing; `multiplayer/test/xp.test.ts` asserts the ranks.
3. No streak copy — en/de `xp_title` and the "How XP works" modal text contain no streak/Serie/🔥; `grep -ri streak
   app/src multiplayer/src app/messages` is empty.
4. Win rate value — `multiplayer/test/xp.test.ts` on seeded deals: a person's win rate equals won / played-with-declarer
   over the week's deals, whole percent, null when all passed.
