# SKATGO-219 handoff

## What changed

- **The numbers** (`app/src/lib/skat/league.ts`): `CHECKIN_COINS` 100 (was 60), `START_AT` 1500 (was 1000),
  `PROMOTE_AT` 3000 (was 2000), `RELEGATE_AT` 0. `standingAfter` is unchanged and applies the same lines in every tier;
  Bronze still stops at 0, Legend still runs on past the promotion line. Fees, per-deal scoring and the weekly reset are
  unchanged. Comments carry the human's words and the new measured pace (about 145 deals up for a player 10 a deal better).
- **Texts from the constants** (`app/messages/en.json`, `de.json`, `app/src/components/skat/league.tsx`): `league_poor`,
  `league_guest`, `league_about_move` and `league_about_coins` no longer write 60 / 1000 / 2000 by hand; they take the
  numbers as parameters and every caller passes `CHECKIN_COINS`, `START_AT`, `PROMOTE_AT`, `RELEGATE_AT`.
- **Service** (`multiplayer/src/store.ts`): once, rows on scale 4 get `round(points × 1.5)` and move to scale 5, tier and
  coins kept; defaults scale 5 and points 1500, so a new account starts at 1500.
- **Charter**: product.md (100 coins, the lines, the ×1.5 conversion, the human's words), ui.md ("+100 heute",
  "Aufstieg bei 3000", the bar 0 → 3000), engineering.md (the constants, scale 5).
- **Tests**: app `league.test.ts` (constants, 3000 / 0 / 1500 in every tier, Bronze, Legend); multiplayer
  `league.test.ts` (new account at 1500; the scale chain ending at 5: 250 on scale 3 → 1875, 659 → 989, Legend 2300 →
  3450, Bronze 0 → 0; a second start changes nothing).

## AC results

1. **New player at 1500** — PASS. Multiplayer test (70/70). Playwright on the ticket's build, EN/DE, PC/phone: a fresh
   account's card shows 1500, "Promotion at 3000" / "Aufstieg bei 3000", the bar; its row is Bronze 1500, 100 coins,
   scale 5.
2. **100 coins a day, weekly reset** — PASS. Multiplayer test: first check-in +100, same day +0, a later week starts
   again from 100. Playwright: "+100 today" / "+100 heute", 100 coins.
3. **Lines 3000 / 0, new tier at 1500, every tier alike** — PASS. App test on `standingAfter` for every tier.
   Playwright: Gold 2250 "Promotion at 3000 · Relegation at 0" with the bar; Legend 3400 "Relegation at 0", no bar.
4. **The page's texts** — PASS. Playwright, EN/DE, PC/phone: the rules say 1500 / 3000 / 0 and 100 coins; the guest
   notice says 100 coins; no 60-coin sentence and no 2000 line on the page.
5. **Existing players ×1.5, once** — local part PASS (multiplayer test). Production part is a post-deploy step: snapshot
   the rows right before the deploy (`tmp/players-before.sql`), then read them after and compare each to round(× 1.5).
6. **Forum article** — post-deploy step: back up post 7 (`tmp/read7.sql`), run `tmp/update-post-7.sql` (both sentences
   1000 / 2000 → 1500 / 3000, guarded so it changes nothing if the text differs), check the page loads 200.

Mechanical defence: app typecheck, build, test, client-bundle, design-token, literal grep, server link, SEO built check and
SEO tests — pass; `npm --prefix multiplayer run check` — pass (70/70).

Owner's-eye review (fresh reviewer, Request + grill records + screenshots): every requested change OK; nothing to change.

## Deviations

- engineering.md's League note (constants, scale) was also brought up to date; plan.md named product.md and ui.md only.
- One extra commit renamed a test helper that collided with an existing name (typecheck).

## Environment

- Ports used: web 55219, multiplayer 56219, database 57219 (all as computed).
- No env key added, changed or removed. The worktree's copies of `app/.env` (`MULTIPLAYER_URL`) and `multiplayer/.env`
  (`DATABASE_URL`) point at the ticket ports only; nothing to sync back.

## Residual

- The weekly reset wipes whatever coins are left on Monday. Once coins can be bought or earned by watching ads, bought
  coins would be wiped too; that rule needs a decision with the paid-coins ticket.
- Share-for-coins was set aside by the human (「先不做这个分享的」).

## Check

1. http://127.0.0.1:55219/en/league with a test account (cookie `skatgo_test_account=<name>.<ms>`) — the card: 100 coins,
   "+100 today", 1500 points, "Promotion at 3000", the bar at half.
2. http://127.0.0.1:55219/en/league — open "What is the League…": the lines sentence and the 100-coins sentence.

## Decided for you

- Coin balances are not changed; the next check-in gives 100.
- Conversion rounds to the nearest whole number (659 → 989); Legend's points above the line and Bronze's 0 follow the same ×1.5.
- The conversion runs as the service's one-time migration at deploy, like SKATGO-205/216/217, not as hand-written SQL.
- The four texts that wrote 60 / 1000 / 2000 by hand now read the constants, so a later change is one place.
- Forum post 7's two sentences change to 1500 / 3000 after deploy; nothing else in the post changes.
