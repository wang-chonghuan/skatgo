# SKATGO-179 plan

## Found in the code
- The board is `POST /daily/xp` → `weeklyXp` (`multiplayer/src/xp.ts`): one query over `daily_entries` and `play_deals` filtered by `day >= weekStart(today)`; it also answers `resetsIn`, which no page shows (so "no countdown" already holds; it only goes away from the answer).
- `weekStart` / `daysToReset` (`app/src/lib/skat/xp.ts`) serve only this board.
- Texts saying week: `xp_title`, `xp_how_week` (the how dialog's last line), `xp_empty`, in `en.json` / `de.json`.
- The charter states the weekly reset in product.md (XP paragraph), engineering.md (`POST /daily/xp`), ui.md (home card, title).

## Route
1. Server: `xpBoard(store, who)` sums every deal ever played (no day filter); the answer is `{ rows }` without `resetsIn`.
2. Lib: drop `weekStart`, `daysToReset`, `resetsIn`; comments say all deals.
3. Texts: title "XP & win rate" / "XP & Gewinnquote"; the how line keeps win rate and signed-in only, without week or Monday (key renamed `xp_how_rate`); empty "No XP yet." / "Noch keine XP."
4. Charter: the three places amended to match (the request is the authorization).
5. Tests: the multiplayer board test asserts that earlier weeks count.
