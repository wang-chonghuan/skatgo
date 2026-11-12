# SKATGO-190 plan

Found: on skatgo.com `/api/daily/profile` took ~700–900 ms against ~300 ms for `/api/daily/xp` from the same browser;
the profile query selects each tournament day's whole `daily_deals.deals` (with the AI's complete games): 4.1 MB of JSON
for the owner's 58 days, parsed in the service, to read only dealer, deck and the AI's summary. The front card's list
is a `border-collapse: collapse` table, which ignores the list's own `paddingInlineEnd`.

1. `multiplayer/src/profile.ts`: the query builds each day's specs in SQL from only `dealer`, `deck`, `benchmark.summary`.
2. `deal-history.tsx`: `borderCollapse: 'separate'`, `borderSpacing: 0`.
