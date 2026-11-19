# SKATGO-214 acceptance check

1. **The rule.** `npm --prefix app run test` — `dealOutcome`: 31 and 39 card points lose −1, 40 keeps 0, a Null game −1.
   `npm --prefix multiplayer run check` — the service scores each played League deal as `dealOutcome` does with the
   defenders' card points.
2. **The rules text.** Browser, production build on 55214 against multiplayer 56214: `/en/league` and `/de/liga`, the
   "What is the League" text open — it names 40 card points / 40 Augen and no 31.
3. **The result line.** The built client carries "The declarer made it – 80 card points at most" and "Der
   Alleinspieler hat gewonnen – höchstens 80 Augen" for a saved defence and no "Schneider avoided" / "Schneider
   abgewehrt" (a League deal is not played to reach the result screen).
4. **The article.** After the release, the live forum article (`/en/forum/7-…`) states 40 card points and the
   recomputed numbers (−0.12 a defended deal, −11 over 100 deals, +10 on 100 good hands), and no 31.
