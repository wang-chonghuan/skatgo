# SKATGO-215 plan

## What the code says that the ticket does not
- One table, `DEAL_POINTS` in `app/src/lib/skat/league.ts`, scores every League deal for both services; the multiplayer
  service writes the points into `league_deals` and the standing, so it must be deployed first.
- Leaving during a deal (`left`) is scored −1 for a defender (SKATGO-206, the human: 「离桌多久应该算输…如果是庄家就-3，
  如果是防家就-1」, i.e. leaving counts as losing). Left at −1 while a lost defence costs −2, leaving a hopeless defence
  would be cheaper than playing it out.
- A Null game has no card points, so a lost Null defence is `defended`: it follows to −2 with no extra code.
- Players see the rule in one line (`league_about_deal`, EN/DE); each deal's result shows the server's points, so no
  other text carries −1. The charter's League paragraph and forum post 7 ("declare or defend") state −1 with numbers.
- Standings already earned are not rescored.

## Route
1. `DEAL_POINTS.defended` −1 → −2 and `left` −1 → −2; comments in `league.ts` (app and multiplayer), `model.ts`.
2. `league_about_deal` EN/DE: "lose as a defender −2, or 0 with 40 card points or more".
3. Unit tests (`league.test.ts`) and the multiplayer League test's expected numbers to −2.
4. Charter `product.md` League paragraph: −2, the human's words, why (inflation, and leaving).
5. Forum post 7: recompute with −2 on the same 352 deals; replace the body in production (backup first).
