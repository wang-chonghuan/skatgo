# SKATGO-219 plan

## What the code already says that the ticket does not

- The three lines are three constants in `app/src/lib/skat/league.ts` (`START_AT`, `PROMOTE_AT`, `RELEGATE_AT`), and
  `standingAfter` is the only place that applies them; the card's bar and its two lines read the same constants. The
  daily coins are `CHECKIN_COINS` there too, used by the check-in SQL in `multiplayer/src/league.ts` and the card's
  "+60 today".
- Four texts write the numbers by hand instead of reading the constants, in both languages: `league_poor`
  ("you get 60 more tomorrow"), `league_guest` ("60 coins every day"), `league_about_move` (1000 / 2000 / 0) and
  `league_about_coins` (60 … from 60). They are the reason a number change is more than a constant change.
- A new account's points come from the column default (`league_players.points DEFAULT 1000`), not from `START_AT`.
- Points are migrated by scale on every service start, in `multiplayer/src/store.ts`: 1→2 and 2→3 reset, 3→4 adds 1000.
  The rows are on scale 4 now (production: 6 rows, Bronze 1000 ×2, Silver 659–1320). A 4→5 step multiplying by 1.5 is
  the same mechanism, runs once, and leaves tier and coins alone.
- Forum post 7 (production) is the only post with League numbers: two sentences on 1000 / 2000 / 0; none on coins.
  SKATGO-217 changed it with an `UPDATE … RETURNING md5` after a backup read.

## Route

1. **Constants** — `CHECKIN_COINS` 100, `START_AT` 1500, `PROMOTE_AT` 3000, `RELEGATE_AT` 0; comments brought up to date
   (FEES: a day's coins buy 33 deals in Bronze, 10 in Diamond, 8 in Legend).
2. **Texts from the constants** — the four texts take their numbers as parameters (EN and DE), and every caller passes
   the constants, so the next change of a number is one place again.
3. **Migration** — `store.ts`: `UPDATE league_players SET points = round(points * 1.5), scale = 5 WHERE scale = 4`, then
   scale default 5 and points default 1500. Integers only (`round`, half away from zero, as the human wants no decimals).
4. **Charter** — `product.md` (60 → 100, the lines, the ×1.5 conversion, the human's words), `ui.md` ("+60 heute",
   "Aufstieg bei 2000", the bar from 0 to 2000).
5. **Tests** — brought to the new specification where they pin the old numbers (constants, new account at 1500, the
   scale chain ending at 5 with 250 → 1250 → 1875).
6. **After deploy** — forum post 7's two sentences to 1500 / 3000 / 0 (backup first), and the production rows read back.

## Not changed

Fees, per-deal scoring, the weekly reset, Bronze's floor, Legend's open top, the board's order, coin balances.
