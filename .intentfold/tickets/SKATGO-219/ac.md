# SKATGO-219 AC

1. **New player at 1500** — multiplayer `league.test.ts`: a new account's state is Bronze, 1500. Playwright on the
   ticket's web (test-account cookie): a fresh account's League card shows "1500"; its row is Bronze 1500, scale 5.
2. **100 coins a day, weekly reset** — multiplayer `league.test.ts`: the first check-in gives 100; a second the same day
   gives 0; a check-in in a later week starts again from 100. Playwright: the card reads "+100 today" / "+100 heute".
3. **Lines 3000 / 0, new tier at 1500, the same in every tier** — app `league.test.ts` on `standingAfter` for every tier:
   3000 up (to 1500), 0 down (to 1500), Bronze stops at 0, Legend runs past 3000. Playwright: Gold at 2250 shows
   "Promotion at 3000 · Relegation at 0" and its bar; Legend at 3400 shows only "Relegation at 0", no bar.
4. **The page's texts** — Playwright, EN and DE, PC and phone: the rules say 1500 / 3000 / 0 and 100 coins; the guest
   notice says 100 coins; no "60" coin sentence and no "2000" line anywhere on the League page.
5. **Existing players ×1.5, once** — multiplayer test: a scale-4 row at 1250 becomes 1875 on scale 5, tier and coins
   kept; a second start leaves it. After deploy: production rows all scale 5, each points = round(before × 1.5) against
   the rows read before the deploy, tiers and coins unchanged.
6. **Forum article** — after deploy: post 7 says 1500 / 3000 / 0 and no 2000 line; `/en/forum/7…` loads 200.
