# SKATGO-215 acceptance checks

1. **A lost defence −2, 40+ card points 0, Null −2.** `npm test` in `app` runs `league.test.ts`: `DEAL_POINTS.defended`
   is −2, `dealOutcome` gives `defended` at 39 and for a Null game (null points) and `saved` at 40. True when it passes.
2. **Leaving as defender −2, as declarer −3.** The multiplayer League test plays a sitting, leaves during a deal and is
   away a minute during another: the row in `league_deals` holds −3 declaring, else −2. True when it passes.
3. **Rules text EN/DE.** Production build on 55215: `/en/league` and `/de/league`, open "What is the League…": the line
   says −2 for a lost defence and 0 with 40 card points / 40 Augen or more; no "−1" in it.
4. **Forum article.** After the update, `https://skatgo.com/en/forum/7-…` shows −2 for a lost defence and the recomputed
   numbers; no "−1 when you defend".
