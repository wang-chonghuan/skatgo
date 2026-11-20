# SKATGO-217 AC

1. **New player at 1000** — multiplayer test: a new account's state is Bronze, 1000 points. Playwright on the ticket's web:
   a fresh signed-in account's League card shows "1000" (no sign).
2. **Lines 2000 / 0, new tier at 1000, Bronze stops at 0, Legend runs on** — `league.test.ts` (app) on `standingAfter`;
   multiplayer `league.test.ts` folds the stored deals' points from 1000.
3. **Card shows only the lines** — Playwright, EN and DE, PC and phone: the card's text has "2000" and "0" as lines, no
   "to promotion" / "bis zum Aufstieg" distances, no "+" before the points, no negative; Bronze shows no relegation line,
   bar present. Screenshots.
4. **Rules text** — Playwright: the rules (EN, DE) name 1000, 2000 and 0 and Bronze never below 0; no "+1000" / "−1000".
5. **Existing players keep their distance** — multiplayer test: a scale-3 row at +250 becomes 1250 on scale 4, tier and
   coins kept, once (a second start leaves it). After deploy: production `league_players` all scale 4, none below 0, and
   the count of rows at ≥1000 in Bronze equals the Bronze rows before.
6. **Forum article** — after deploy: post 7's body says the 0 / 2000 lines, no "+1000 points to move up"; the page loads 200.
