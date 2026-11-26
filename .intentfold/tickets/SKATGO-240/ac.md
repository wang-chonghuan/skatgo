# SKATGO-240 acceptance checks

1. Check-in adds 100, capped at 200 — multiplayer test drives `/checkin` against the ticket DB: new player 100; same day again +0; next day 150 → 200 (50 → 150 too); 380 → 200. True when every balance matches.
2. No Monday reset — same test: a player with 120 left on Sunday checks in on Monday → 200 (not 100). True when 200.
3. Fees 4-4-5-5-6-6 — running app on :55240, /league as a signed-in test account: the six tier cards read 4, 4, 5, 5, 6, 6 coins a deal; a Gold test account's Play button reads "Play · 5 coins a deal" and after one deal is dealt the balance drops by 5. True when all match.
4. Coins bullet — /league in EN and DE: the coins bullet reads one sentence with 100 and 200, no Monday/week wording.
5. Other daily numbers — guest line on /league signed out and "+100 today" after the day's check-in show 100; the not-enough line reads 100.
