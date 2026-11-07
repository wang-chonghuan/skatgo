# SKATGO-178 handoff

## What changed
- **The week's board** (`multiplayer/src/xp.ts`): no more days-in-a-row query; each row carries `winRate`, the week's
  win rate over the same deals the XP sums, counted by `recordOf` (`lib/skat/profile.ts`, as the profile and the home
  card count it): deals all passed left out, won as declarer or by beating the declarer as defender, whole percent,
  null when no deal had a declarer. Order unchanged: XP, the most first, equal XP sharing a rank.
- **Shared types** (`app/src/lib/skat/xp.ts`): `streakOf` removed; `XpBoard` rows have `winRate` for `streak`.
- **Card** (`app/src/components/skat/xp-board.tsx`): the 🔥 cell is now the win rate ("24%", "–"), `slate`, titled
  "Win rate" on hover (`profile_vs_win`).
- **Copy** (`app/messages/en.json`, `de.json`): `xp_title` "Weekly XP & win rate" / "Wochen-XP & Gewinnquote"; `xp_how_week` explains the win
  rate where it explained the 🔥 and drops "the streak carries on" / "die Serie läuft weiter".
- **Tests**: `xp.test.ts` loses the streak case; `multiplayer/test/xp.test.ts` expects win rates (67 with an all-passed
  deal left out, 50 with a defended deal the declarer won, null when all passed) and the order by XP.
- **Charter** (the human's request): product.md, engineering.md, ui.md describe the win rate in place of the days in a
  row; product.md records why (no guilt for a missed day).

## AC results
1. **Rows rank · name · win rate · XP, no 🔥** — pass. Production build on 55178, home page at 1280×820 and 375×812,
   EN and DE: no 🔥 on the board, every row's win cell `NN%` or `–`, no row or page overflow. Screenshots
   `tmp/desktop-home.png`, `tmp/phone-board.png`.
2. **Ordered by XP** — pass. Rows' `data-xp` non-increasing on every pass (506, 304, 210, 196, …); the service test
   asserts ranks.
3. **No streak copy** — pass. Title "Weekly XP & win rate" / "Wochen-XP & Gewinnquote"; the "How XP works" text has no streak / Serie / 🔥 / in a
   row, EN and DE (`tmp/desktop-how.png`); `grep -ri streak app/src multiplayer/src app/messages` is empty.
4. **Win rate value** — pass. `multiplayer/test/xp.test.ts` on seeded deals; on the local copy of production's week
   the top row's 24% equals 13 won of 54 games with a declarer, read directly from the rows.

Mechanical defence: pass (typecheck, build, 341 unit tests, client bundle, design tokens, literal grep, SSR link,
SEO 28). `npm --prefix multiplayer run check`: pass (50 tests).

## Deviations
- Title: `plan.md` said "Weekly XP"; the look through the human's eyes found a bare grey "24%" unlabelled, so the
  title names the win rate as it named the streak (「steak也要放上去吧」).
- Not done, raised by the same look: a minimum number of games before a win rate shows (one or two games give 0% or
  100%). Not in the request; left for the human.

## Environment
Ports: web 55178, multiplayer 56178, database 57178 (Colima profile `skatgo`). No env keys added, changed or removed
(the worktree's `multiplayer/.env` points at the ticket database's port only). Local DB: production's rows of this
week's players and the owner's own records, copied read-only (`tmp/week-board.sh`, `tmp/demo-me.sh`).

## Residual
None.

## Check
1. http://localhost:55178/en — the board's numbers: by the product's one definition of win rate (also the profile's),
   a defender wins only when the declarer loses, so this week's values read 14–36%.
2. http://localhost:55178/en — the title "Weekly XP & win rate" (German http://localhost:55178/ "Wochen-XP &
   Gewinnquote") on one line, and the win-rate line under its question mark.

## Decided for you
- Win rate over this week's deals, the same ones the XP sums.
- Counted as the profile counts it; all-passed deals left out; "–" when none had a declarer.
- Title "Weekly XP & win rate" / "Wochen-XP & Gewinnquote", naming the column as your 「steak也要放上去吧」 named the streak.
- The week line in "How XP works" explains the win rate instead of the 🔥.
- Win rate in grey (`slate`), the XP stays the bold figure.
