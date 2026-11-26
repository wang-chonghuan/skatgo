# SKATGO-240 handoff

## What changed
- League rules (app/src/lib/skat/league.ts): `CHECKIN_COINS` 90 → 100, new `COINS_MAX` 200, `FEES` [4, 4, 4, 4, 4, 4] → [4, 4, 5, 5, 6, 6].
- Check-in (multiplayer/src/league.ts `/checkin`): the day's first check-in sets coins to LEAST(coins + 100, 200); SKATGO-210's weekly reset is gone. Balances above 200 come down to 200 at their next check-in.
- Copy (app/messages en/de `league_about_coins`, league.tsx): one sentence, EN "Each deal costs a few coins. You get 100 free a day and can save up to 200.", DE "Jedes Spiel kostet ein paar Münzen. Jeden Tag gibt es 100 gratis, sparen kannst du bis 200."
- Tests: app league.test.ts constants; multiplayer league.test.ts check-in (50 → 150, 150 → 200, 380 → 200, a new week keeps what was left).
- Charter: product.md coin paragraph, engineering.md League constants line, ui.md fees and coins bullet; multiplayer/README.md checkin line.

## AC results
1. Check-in +100, cap 200 — multiplayer test against the ticket DB: new player 100, same day +0, 50 → 150, 150 → 200, 380 → 200. Pass (71/71).
2. No Monday reset — same test: 60 left on Sunday 2025-11-02, next check-in 160. Pass.
3. Fees — /en/league on :55240: tier cards 4, 4, 5, 5, 6, 6 coins a deal; a Gold test account reads "Play · 5 coins a deal" and sitting down took 7 → 2. Pass.
4. Coins bullet — EN and DE read the one sentence above, no week wording. Pass.
5. Other daily numbers — guest "Sign in and get 100 coins every day you open SkatGo.", "+100 today", "Not enough coins – you get 100 more tomorrow." Pass.

Mechanical defence: app typecheck, build, test, client bundle, design tokens, git grep, SSR link, check:seo --built, test:seo — exit 0; `npm --prefix multiplayer run check` 71/71.

## Deviations
None from plan.md. The check-in's `added` answer stays the day's grant (unused by the page).

## Environment
Ports: web 55240, multiplayer 56240, DB 57240. No env keys added, changed or removed.

## Residual
None.

## Check
1. http://localhost:55240/en/league — the coins bullet under "What is the League" and the six tier cards' prices.

## Decided for you
- "+100 today" keeps showing 100 even when the cap means less was added.
- The player now at 380 comes down to 200 at their next check-in; nobody's balance is changed before that.
