# SKATGO-216 acceptance checks

1. **SF minus the two others' average.** Unit test (`league.test.ts`): 36 won → 86 / −43 / −43, lost → −162 / 81 / 81,
   passed 0, rounding to whole numbers, a table's sum 0 (±1). Service League test: each deal seen to its end is stored
   with `dealPoints` of that deal's review scores (seat 0 the player's).
2. **Leaving is their side's loss.** Unit test of `forfeitPoints`; service League test: the deal left and the deal away a
   minute stored with `forfeitPoints` of the game played out, below 0 when someone declared.
3. **±1000.** Unit test of `standingAfter` at +1000 / −1000, Bronze floor, Legend; production build on 55216: the League
   page's "to promotion / to relegation" figures read from ±1000 for a signed-in test account (seeded standing).
4. **Points from 0 after release.** Service test: a row on scale 2 migrates to points 0, scale 3, tier and coins kept;
   once only. After deploy: production `league_players` all scale 3, points 0 right after the migration.
5. **Rules text EN/DE.** Production build: `/en/league`, `/de/liga`, PC and phone, rules open: the SF line and ±1000.
6. **Forum article.** Live page after the update: SF-against-the-table scoring and its numbers; no +3/−3/−2/40 rules.
