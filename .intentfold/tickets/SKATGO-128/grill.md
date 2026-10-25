# SKATGO-128 grill

The human: 「你先开工单，把这个工单做出来，我看到后，开始和你讨论如何优化和细化。开始」 — build a first version now,
refine together afterwards. So no question is put before the code; each is decided with the recommendation and
recorded here for the discussion after.

1. **Which deals count?** Recommendation: the daily tournament (stored, history available) and free play
   (recorded from now on for a signed-in player), lesson 11 included; not private tables or the course's local
   game, which have no AI on the same cards. Reason: 「每个deal都要算和ai的差值」 — only those have an AI deal.
   Decided: as recommended.
2. **What is the difference?** Recommendation: the player's Seeger-Fabian score of the deal minus the AI's on
   the same deal from the same seat — the numbers the score sheet shows. Decided: as recommended.
3. **Who sees a profile?** Recommendation: the player their own, signed in; no public profile yet (product.md
   lists "profiles" among what the forum leaves out; a public one is a later discussion). Decided: own only.
4. **Free play history before this ticket?** None exists; free deals count from the release on. Decided.
5. **The curve's x-axis?** Recommendation: every deal in order of play, a hairline where a day starts; the
   per-day counts in their own list. Decided: as recommended; open for the discussion.
6. **Where is the way in?** Recommendation: the settings, under the nickname, for an account. Decided.
7. **A new table and charter changes?** Free play's "keeps nothing per game" changes for a signed-in player's
   finished deals; product.md, engineering.md and ui.md are amended to match the request, which authorises it,
   as is the chart's geometry in `constants.ts` (ui.md redline 1). Decided.
