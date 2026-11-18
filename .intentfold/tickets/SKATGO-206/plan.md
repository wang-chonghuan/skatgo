# SKATGO-206 plan

## What the code already says that the ticket does not

- The League page already has a board at its bottom (`Board` in `league.tsx`, `league-board` / `league-board-row`):
  Legend accounts only, rank · name · points, own row on `goodSoft` with the "You" tag, hidden while empty. Its data is
  `board` in the `/league/state` answer (`legendBoard` in `multiplayer/src/league.ts`), sent to guests as well.
- "Played a deal" is on record: a sitting's first seats are in `league_matches.seats` (an account's `user:` id or a
  persona's), and every finished deal is a `league_deals` row. People never join a sitting midway (only personas take
  seats over), so an account in a sitting's seats with at least one finished deal played that deal — SKATGO-204's
  round-scored deals included.
- Every account seated at a League table is given a nickname then (`nameOf`, `daily_players`). A deleted account
  (SKATGO-185) loses its `daily_players` row; its `league_players` row stays. Joining the name drops it from the board.
- `league_players.updated_at` moves with every fee, so it is no "reached first"; ties share a rank as the Legend board's do.
- Size: `dims.badge` (24px) exists; no new token. The tier pictures (`public/league/<tier>.webp`, 480×384) each carry
  their emblem in the upper right on the tier's flat colour.

## Route

1. **Data** (`app/src/lib/skat/league.ts`, `multiplayer/src/league.ts`): `LegendBoard` becomes `LeagueBoard` —
   `{ rows, me? }`, a row `{ rank, nickname, tier, points, you? }`. `leagueBoard(store, who)`: accounts that played a
   deal, with their League row and name, ranked by tier, then points (`rank()` over both, so equal tier and points share a
   rank); the first 100, and the asker's own row as `me` when it is not among them. Replaces `legendBoard` in `/state`.
2. **Badges** (`app/public/league/badge/<tier>.webp`): each tier picture's emblem cut out square on its own colour,
   96×96 WebP (four times `dims.badge`), from the shipped pictures — the same drawing. The cut is made once with
   `dwebp`/`cwebp` and the bounding box of the emblem's pixels; the commands go into the handoff.
3. **Board** (`league.tsx`): the same card and rows, now for everyone who played — rank, the tier badge (`dims.badge`,
   `radii.tag`, alt = tier name), the name with "You", the points at the right. When the asker is beyond the 100, a
   "…" line and their row after it. Title "League ranking" / "Liga-Rangliste". Still hidden while nobody has played.
4. **Words and records**: `league_board` reworded; comments that say "Legend board"; `multiplayer/README.md` `state`;
   charter `product.md` (the League's board paragraph) and `ui.md` (the League page's board) — the ticket's request.
5. **Service test** (`multiplayer/test/league.test.ts`): after the deals already played there, `state` has the board —
   the players who sat there on it with their tier and points, `you` on the asker's row, an account that never sat
   (`user:poor`) not on it; a guest's `state` carries the same board without `you`.

## Slices

One commit for the data and the test, one for the badges and the board with its words, one for the charter and records.
