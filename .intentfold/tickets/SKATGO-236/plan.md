# SKATGO-236 plan

## What the code already promises, and what the ticket does not say

- The daily board (`multiplayer/src/daily.ts` `dailyBoard`) answers rows of rank, nickname, total, `me` — an account's
  entries, a guest device's (`anon:`), and the personas' (`persona_jobs` / `persona_players`) in one list; only names
  leave the service (SKATGO-36).
- A face (SKATGO-232) is `null` (the picture of the name), `{ seed }` or `{ image }`, kept in `player_avatars` for
  accounts only; `facePath(face, name)` is its address; the forum's `Avatar` draws it.
- The board's rows render in `daily-table.tsx` (`DailyBoard`), the AI's line beside them with its own mark (`Who`).

## Route

1. `daily.ts`: each row carries `face` — the account's from `player_avatars`, null for a guest or a persona.
   `faceOf` moves to a shared place (`forum.ts` exports it).
2. `tournament.ts` `BoardRow`: `face: Face`.
3. `daily-table.tsx`: the small avatar (`Avatar` `small`, 24px) between the rank and the name, on every row and the
   own row below; the AI's line unchanged.
4. Test: an account's board row carries its face; a persona's null. Charter: ui.md's board, engineering.md.
