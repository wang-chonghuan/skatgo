# SKATGO-174 plan

What the code already does, which the ticket does not say:
- The streak is not cut at the week: `DEAL_DAYS` in `multiplayer/src/xp.ts` reads every day ever played, and
  `streakOf` counts back from today or yesterday. Only the XP sum starts on Monday (`weekStart`). So the fix is the
  sentence, not the rule.
- The board is computed on every request from the rows; each deal is written the moment it ends. The only thing not
  live is the page: `XpBoard` asks once on mount. `/api/daily/xp` (POST) has no cache; only the server render keeps a
  minute's answer, and the browser replaces it at once.

Route:
1. `xp_how_week` in `app/messages/en.json` / `de.json`: say the streak carries on from week to week and only XP
   starts at 0 on Monday. Only this key.
2. `XpBoard` (`app/src/components/skat/xp-board.tsx`): besides the read on mount, read again every 15 s while the
   page is visible, and at once when it comes back into view (`visibilitychange`); a hidden page does not ask. No
   new dependency, no change to the service.
3. Charter: engineering.md's XP paragraph says the browser keeps the board current that way.
