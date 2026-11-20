# SKATGO-217 plan

## What the code already says that the ticket does not
- The lines live in `app/src/lib/skat/league.ts` (`PROMOTE_AT`, `RELEGATE_AT`, `BRONZE_FLOOR`, `standingAfter`); the service
  scores with them (`multiplayer/src/league.ts` `scoreSeat`) and the page draws with them (`league.tsx` `MeCard`).
- A new account's row is made by two inserts that take the column default (`points DEFAULT 0`); the points' scale is
  versioned by `league_players.scale` (3 since SKATGO-216), each change a one-time migration in `store.ts`.
- The card shows the points signed (`+86`), "N to promotion · N to relegation" and a bar from the floor to the promotion line;
  the board shows the points signed. The deal's pill at the table is the deal's own change and stays signed.
- Forum post 7 (production) says "+1000 points to move up" and "The 1000 points to the next tier".

## Route
1. Rules (`app/src/lib/skat/league.ts`): `START_AT = 1000`, `PROMOTE_AT = 2000`, `RELEGATE_AT = 0`; `standingAfter` moves to
   `START_AT` on a move; Bronze stops at `RELEGATE_AT` (no separate `BRONZE_FLOOR`: the same line, one rule).
2. Service (`multiplayer/src/store.ts`): once, rows on scale 3 add 1000 and go to scale 4; defaults scale 4, points 1000.
3. Page (`league.tsx`): points unsigned on the card and the board; under them the lines, "Promotion at 2000 · Relegation at
   0" (none up from Legend, none down from Bronze); bar 0 → 2000. Messages EN/DE: the lines replace the distances; the
   rules' move line names 1000, 2000, 0 and Bronze's floor.
4. Charter: product.md League paragraph, ui.md card/bar lines, engineering.md's scale note.
5. Forum post 7: the two sentences about +1000 / 1000 to the next tier, backed up first.

## Undecided → grill
Existing players' points; Bronze floor; the card's wording; sign on the board.
