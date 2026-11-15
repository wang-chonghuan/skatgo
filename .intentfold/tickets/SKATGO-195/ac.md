# SKATGO-195 acceptance checks

1. Local stack, two finished entries seeded: `/api/daily/board` size 1 today as a viewer who has not played and as nobody →
   names, all totals null, AI total null, `hidden: true`; the page shows names only. `tmp/ac.mjs`.
2. As a player who finished → totals; the page shows them. The 6-deal board unchanged.
