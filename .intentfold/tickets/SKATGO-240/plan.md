# SKATGO-240 plan

## What the code already promises (not on the ticket)
- Coins rise only at the day's check-in (`/checkin` in multiplayer/src/league.ts); fees are taken when a deal is dealt. So the cap only needs applying at check-in.
- Check-in today resets on the first check-in of a new Berlin week (`date_trunc('week', …)`), the SKATGO-210 rule this ticket drops.
- The page reads `CHECKIN_COINS` and `FEES` from app/src/lib/skat/league.ts for every number it shows (tier cards, Play button, "+N today", guest line, not-enough line, the coins bullet).
- "+N today" shows the daily grant, not the amount actually added after the cap.

## Route
1. app/src/lib/skat/league.ts: `FEES = [4, 4, 5, 5, 6, 6]`, `CHECKIN_COINS = 100`, new `COINS_MAX = 200`; doc comments carry the human's words.
2. multiplayer/src/league.ts `/checkin`: `coins = LEAST(coins + 100, 200)` on the day's first check-in, no week reset; the INSERT for a new player takes `LEAST(100, 200)`; `added` answers what was actually added.
3. Copy: `league_about_coins` EN/DE one short sentence with {n} and {max}; nothing else in the copy changes.
4. Tests: league.test.ts constants; multiplayer league test check-in: same day nothing, next day +100, cap at 200, over 200 cut to 200, Monday no reset.
5. Charter: product.md coin paragraph, engineering.md league line, ui.md fee/"+100 heute" lines; multiplayer/README.md checkin line.

## Redlines lookup
No data migration: balances above 200 fall to 200 at their next check-in through the same rule (ticket AC 1). No prod DB writes by hand, no new dependency, no style change.
