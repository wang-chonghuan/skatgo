# SKATGO-169 rework

Against the frozen handoff (3417866). Three rounds, one commit each.

1. 「Your profile can't be loaded right now. 老显示这个」 (7834210) — the daily API read only the session cookie, which another
   localhost port's app can overwrite and which can be stale in a sleeping tab; a bad cookie reproduced the failure. Daily
   requests carry the page's own session token, as room requests have since SKATGO-163 (`session-token.ts`). Rechecked:
   `daily-api.test.ts`, the acceptance check; the human's own Gmail sign-in is theirs to see.
2. 「Per day 这个不用显示」 (5541c30) — the per-day list is gone. Rechecked en/de, desktop/phone.
3. 「可以，加吧」, on where the difference to the AI comes from — under the table, in the same game the card points against the AI's,
   and how much of the gap comes from another game (`gapOf`). The profile sends each game's identity and card points; free deals
   record them from now on. Rechecked against a separate count over the raw rows: −6 over 109 deals, 75%; acceptance 45 PASS.

Net effect against the handoff: the profile loads on a bad cookie, has no per-day list, and says where the gap comes from.
This one touches multiplayer, so it deploys first.
