# SKATGO-179 handoff

## What changed
- Multiplayer `POST /daily/xp` (`multiplayer/src/xp.ts`): `weeklyXp` → `xpBoard`; the query sums every deal ever played (tournament entries and `play_deals`), no week filter; the answer is `{ rows }`, `resetsIn` gone. Route in `multiplayer/src/daily.ts`.
- `app/src/lib/skat/xp.ts`: `weekStart`, `daysToReset` and `XpBoard.resetsIn` removed.
- Texts (`app/messages/en.json`, `de.json`): title "XP & win rate" / "XP & Gewinnquote"; the how dialog's last line `xp_how_rate` "Win rate: deals won, deals all three passed left out. Signed-in players only." / "Gewinnquote: die gewonnenen Spiele, eingepasste nicht mitgezählt. Nur angemeldete Spieler."; empty "No XP yet." / "Noch keine XP.".
- Comments in the board, home page, xp-api, handler, theme; charter product.md / engineering.md / ui.md amended (no weekly reset).
- Tests: `multiplayer/test/xp.test.ts` counts the week before (Ben 40 XP, Carl on the board); `app/src/lib/skat/xp.test.ts` loses the week tests.

## AC results
1. Title — PASS. Playwright, desktop 1280×820 and phone 375×812: heading "XP & win rate" on `/en`, "XP & Gewinnquote" on `/` (de); board and how dialog contain no week/monday/woche/montag.
2. Earlier deals count — PASS. Ticket DB with the owner's rows (deals in the weeks of 5 Oct to 2 Nov, none this week): `/api/daily/xp` answers Wyong 2446 XP, 21 %; the old board would be empty this Monday. Multiplayer xp test asserts sums including the earlier week.
3. No countdown — PASS. The answer is `{"rows":[…]}` with no `resetsIn`; nothing on the board shows days.
4. Empty text — PASS. Built bundle carries "No XP yet." / "Noch keine XP."; the old week strings are absent.

Mechanical defence: app chain exit 0; `npm --prefix multiplayer run check` 50 pass, 0 fail.

## Deviations
None from plan.md.

## Environment
Ports web 55179, multiplayer 56179, database 57179. Worktree `app/.env` MULTIPLAYER_URL and `multiplayer/.env` DATABASE_URL point at the ticket ports (local only, not synced back). No env keys added, changed or removed.

## Residual
None.

## Check
1. http://localhost:55179/en — the board's title "XP & win rate" and the ? dialog's last line.

## Decided for you
- German title "XP & Gewinnquote".
- The win rate is all-time too, the same deals as the XP.
- The dialog's last line keeps win rate and "signed-in players only", dropping only the week and Monday.
