# SKATGO-172 acceptance checks

1. Signed in (local test account), finish a free deal and a deal of the day: the dialog shows "+N XP" with the
   difference to the AI and its tier; a toast with the calculation appears and goes. As a guest: the sign-in line.
2. Front page at 1280×820 and 375×812: the XP card where the Elo card was, same box and folding (measured against
   main's Elo card), rows rank · name · streak · XP, own row marked when signed in, ? opens the tier table.
3. `xp.test.ts`: tiers at their edges, a week's sum, Monday, streak; the service's board for seeded local deals
   equals the hand sum.
4. No "Elo" on the site: `git grep` of app/multiplayer sources and messages; `/api/daily/elo` gone (404).
5. /de/ the same in German.
