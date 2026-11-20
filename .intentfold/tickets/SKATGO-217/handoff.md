# SKATGO-217 handoff

## What changed

- **The lines** (`app/src/lib/skat/league.ts`): `START_AT` 1000, `PROMOTE_AT` 2000, `RELEGATE_AT` 0. `standingAfter` puts a
  player moved up or down at 1000 in the new tier; Bronze stops at 0 (the relegation line, so `BRONZE_FLOOR` is gone); Legend
  runs on past 2000. A deal's points are unchanged (SF minus the other two's average).
- **Service** (`multiplayer/src/store.ts`): once, rows on scale 3 add 1000 and move to scale 4 (their distance to the lines
  kept, tier and coins kept); defaults scale 4 and points 1000, so a new account starts at 1000.
- **Web** (`app/src/components/skat/league.tsx`): the card's points without a sign; under them the lines, "Promotion at
  2000 · Relegation at 0" / "Aufstieg bei 2000 · Abstieg bei 0" (none up from Legend, none down from Bronze), no distance;
  the bar 0 → 2000 in every tier but Legend; the board's points without a sign. The deal's pill at the table stays signed.
  Messages: `league_to_up` / `league_to_down` replaced by `league_up_at` / `league_down_at`; `league_about_move` EN "Every
  tier starts you at 1000 points. At 2000 you go up a tier, at 0 down one. In Bronze you never go below 0." (DE likewise).
- **Charter**: product.md's League lines and the migration; ui.md's card line and bar; engineering.md's scale note (and its
  stale `DEAL_POINTS` mention, now `dealPoints`).
- **Forum post 7** (production, after deploy): two sentences moved from "+1000 to move up" to the 1000 / 2000 / 0 lines;
  before-copy and SQL in `.intentfold/tmp/SKATGO-217/`.

## AC results

1. New player at 1000 — PASS: multiplayer test (new account Bronze, `START_AT`); Playwright: a fresh test account's card
   shows "1000", stored Bronze 1000 scale 4 (`tmp/ac.log`).
2. Lines — PASS: app `league.test.ts` (up at 2000 to 1000, down at 0 to 1000, Bronze stays 0, Legend 2076 / 3586, down at 0);
   multiplayer test folds the stored deals' points from 1000 to the account's standing (70/70).
3. Card — PASS, EN/DE × PC/phone: Bronze "Promotion at 2000" only, Gold 1250 "Promotion at 2000 · Relegation at 0", Legend
   2300 "Relegation at 0" without a bar; no "to promotion" / "bis zum", no signed number (`tmp/me-*.png`).
4. Rules — PASS, EN/DE × PC/phone: the move line as above, no ±1000 (`tmp/about-*.png`).
5. Existing players — PASS locally: a scale-3 row at 250 becomes 1250 on scale 4, coins kept, untouched by a second start;
   an older-scale row lands at 1000. Production before (`.intentfold/tmp/SKATGO-217/before.txt`): scale 3, Bronze 4 rows at
   0, Silver 2 rows −159 and 0 → expected after: scale 4, Bronze 4 at 1000, Silver 841 and 1000. Checked after deploy.
6. Forum article — after deploy (post-deploy step).

Mechanical defence: app typecheck, build, test (353), client bundle, design tokens, literal grep, SSR link, SEO checks;
multiplayer typecheck, build, test (70) — all pass.

## Deviations

None from `plan.md`. The human added during development 「老分数最好大概转化一下保留」 — the +1000 migration already does that.

## Environment

Ports web 55217, multiplayer 56217, database 57217 (`multiplayer/.env` in the worktree pointed at 57217, not committed). No
env key added, changed or removed.

## Residual

The scoring is the same as SKATGO-216 shifted by 1000: how fast people climb still depends on the personas' strength per
tier (bidding is SkatZero's at every tier), discussed with the human; no ticket yet.

## Check

- The League card: "1250 · Promotion at 2000 · Relegation at 0" and the bar.
- The rules' move line.

## Decided for you

- Existing points +1000 rather than all reset to 1000 (keeps everyone's progress; the human then asked for exactly that).
- Bronze's floor is 0, the same line as relegation elsewhere.
- Card wording "Promotion at 2000 · Relegation at 0" / "Aufstieg bei 2000 · Abstieg bei 0"; only the lines that exist in
  the tier.
- Points shown without "+" on the card and the board; the deal's own +86 / −43 keeps its sign.
