# SKATGO-57 handoff

## What changed

**Saving, auction included**
- A deal's summary was already written in the same transaction as the move that ends it. The auction was not part of it.
- The auction now comes back with every status. In `multiplayer/src/daily.ts`, `status()` replays each finished deal's recorded moves through the engine, for the player's deal (`daily_entries.actions`) and for the AI's (`benchmark.log`), and returns `auctions` and `benchmarkAuctions` beside `deals` and `benchmarks`.
- Nothing more is stored, and old records need no conversion: the moves were always stored. The human agreed to this before development; today's deals were not re-dealt and no records were deleted.
- `app/src/lib/skat/tournament.ts`: new `Auction` / `SeatBid` and `auctionOf(game)`, which gives each seat's highest number said or held, and whether it passed. `DailyStatus` gained the two fields.

**The settlement in the daily tournament**
- `components/skat/daily-comparison.tsx`: new `DealVsAi`, which comes first in the settlement:
  - three tiles: your Seeger-Fabian score, the AI's, and the difference;
  - two cards, You and AI, each with three lines: Reizen (every seat's highest bid or "passe", the declarer bold), Spiel (declarer, game, won or lost with card points, Schneider/Schwarz/überreizt) and Punkte (all three seats' SF scores).
  - The cards sit side by side on a wide screen and stack on a phone.
- New `Fold`, closed by default: "Details zu diesem Spiel" (the old settlement lines: the declarer's sentence, card points, the formula, the game score, the skat) and "Tagesverlauf: n von 12 Spielen" (the day's `VsAiTable`).
- `game-table.tsx`:
  - in the tournament `Result` now renders compare → details fold → day fold → button, and drops the won/lost headline;
  - the passed-in dialog shows the same comparison and day fold;
  - free play's settlement is the unchanged branch (`daily` absent).
- `VsAiTable`'s open rows now end with each side's auction. Its role text truncates instead of overlapping when the table is narrow (inside the settlement on a phone).
- `daily-table.tsx` passes the auctions through.

**Messages**
- New, in de and en: `daily_line_bidding`, `daily_line_game`, `daily_line_scores`, `daily_pass`, `daily_all_passed`, `daily_details`, `daily_day_fold`.
- Removed: `daily_deal_score`, no longer used.
- No new design value.

## AC results

`tmp/ac.mjs`, headed Chromium, web 55057, multiplayer 56057, database 57057, on a freshly dealt local day: 15/15 pass.

The deal was brought to the player's last card through the page's own API. No game was played for its own sake; the page played that card.

1. **Kept after reload**: after a reload, `/api/daily/state` returns the deal's auction equal to the auction from the bidding log the player's own table carried, the same scores the settlement showed, and the AI's auction. `/daily` shows the deal with both auctions in its open row.
2. **Order**:
   - the settlement's body is, in order, the comparison, the details fold, then the day fold, both folds closed;
   - each side names the auction, the game and three scores;
   - the folds open on a tap, showing the formula, and the day's table with every deal and the total.
3. **Fit**: the comparison ends at 465 px of 820 on desktop and 556 px of 812 on a phone. No horizontal scroll.
4. **Day and free play**: the day's table and total are in the fold and on `/daily`. Free play opens and deals.

Mechanical defence passed in full: typecheck, build, 83 tests, bundle, tokens, literal grep, SSR link, `check:seo -- --built` 42 pages and 4 linked files, `test:seo`. `npm --prefix multiplayer run check`: 19 pass.

**Left to the user's own testing**:
- deals where the player bids or declares, where the auction shows the player's own numbers. The automated deal passed throughout, by the no-gameplay acceptance rule; the auction logic is the same for every seat;
- free play's settlement after a whole game.

## Deviations

- The day fold reads "Tagesverlauf: n von 12 Spielen" / "Today so far: n of 12 deals", not "· n Spiele", which was wrong for 1.
- The table's role text truncates in narrow columns: the first look showed two roles overlapping inside the settlement on a phone.

## Environment

- Ports: web 55057, multiplayer 56057, database 57057. The worktree's `.env` files point at them for local acceptance only.
- No env key added, changed or removed.

## Residual

- Charter drift, not edited:
  - `engineering.md`'s SKATGO-42/48 key decisions do not say that the auction is replayed from the recorded moves by `status()`;
  - `ui.md`'s widget table does not list `DealVsAi` / `Fold`, nor that the daily settlement leads with the comparison;
  - `product.md`'s daily sentence describes the table, not the new settlement.
- Releasing this needs a multiplayer deploy (`status()` changed) before the web deploy. No data migration.
