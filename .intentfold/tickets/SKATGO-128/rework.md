# SKATGO-128 rework

Seven rounds after the handoff, each its own commit; the net effect relative to the frozen handoff is at the end.

1. **「入口在哪，我找不到，应该是点profile头像就能看到入口」** (186b629). The account menu under the avatar starts with
   "Dein Skat-Profil" (lucide `ChartLine`); the settings link stays. Rechecked: typecheck, tokens, bundle; the Clerk menu
   itself cannot be opened by a local test account, left to the human.
2. **「用户mark的给我看一下……他的全档案必须建立好」** (881122e). Mark's ids checked in the database (names like his:
   his account and the guest id already aliased to it) and in PostHog (all 8 of his tournament days finished on one
   device, matched to the second; nothing else to merge). The record also counts the twelve-deal tournament's kept rows
   (SKATGO-77): 132 deals for Mark. Rechecked: `profile.test.ts`; Mark's record through `/daily/profile`.
3. **「本工单改，开始，我要看到我的曲线图」** (e446629). Each deal judged against the table, as the human set it:
   (2·own − each opponent) − the same for the AI's game; the curve one point a day (the day's average per deal); the
   last day against before, better or worse only beyond the noise of single deals, on the profile and under a finished
   tournament (`ProfileLine`). Free deals keep all three seats' scores. Rechecked: `profile.test.ts`, AC 1–3 and 5 on
   the owner's copied record, PC and phone, English and German.
4. **「一天一个点，为啥你的图上没显示几个点呢？ / 同意，改」** (5c25aeb). Each day's dot the same size on every screen, and
   each day's date under its dot (every second, third … when more than fit, fewer on a phone). Rechecked: AC, screenshots.
5. **「点太大了」** (4874fc1). The dot 8 px across instead of 12. Rechecked: AC, screenshots.
6. **「你把本周ai分析加上到档案页，每周一个……你给的四条加上结论」** (6536d2c). A weekly card under the curve; at first the
   four kinds of deal by who declared and a rule-made conclusion. Superseded by round 7.
7. **「不一定是四条吧，为啥这么死板 / 挑重点，目前用户少，可以手动做，你先来做，就做我和mark的」** (3a542ac). The week's
   analysis is written by hand — only what mattered, as many points as there were, and a conclusion — stored per
   player, week and language in `profile_notes` and shown in the forum's marks; the fixed four rows are gone. The
   owner's and Mark's three weeks are written in `notes.json` and loaded by `notes.mjs`. Rechecked: `profile.test.ts`,
   AC with the weeks' cards, screenshots for both.

Net effect against the handoff: the profile has a way in from the avatar menu; it counts the twelve-deal tournament's
kept deals; a deal is judged against the whole table and the AI's game; the curve is one dot a day with its date; a
line says whether the last day was better than before, on the profile and under a finished tournament; hand-written
weekly analyses stand under the curve where there is one. `play_deals` keeps both games' scores, declarer and result;
`profile_notes` is new. No env change.
