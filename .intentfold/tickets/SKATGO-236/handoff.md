# SKATGO-236 handoff

## What changed

- `multiplayer/src/daily.ts` `dailyBoard`: each row carries `face` — an account's from `player_avatars`, null for a
  guest device or a persona (the picture of the name). `faceOf` moved to `app/src/lib/forum.ts`, shared.
- `app/src/lib/skat/tournament.ts` `BoardRow.face`.
- `daily-table.tsx`: the forum's small `Avatar` (24px, round) between rank and name on every row and the own row
  below; board rows centred on one line; the AI's line keeps its mark.
- Tests: `personas.test.ts` — the account's look on its board row, a persona's none; and its stale `notes`
  expectation left from SKATGO-232 fixed (the whole multiplayer suite, 71 tests, passes).
- Charter: ui.md (the board's avatars), engineering.md (the board's faces).

## AC results

Headed, production build on 55236 / 56236 / 57236, 14 seeded entries a board (an uploaded picture, a drawn look,
11 guests, the viewer last):

1. PASS — every row of the 1-deal and 6-deal boards has an avatar, PC and phone, EN and DE.
2. PASS — the accounts' avatar addresses equal their forum faces.
3. PASS — guests show the picture of their name; personas: unit test (face null).
4. PASS — the viewer's own row below the top has its avatar.
5. PASS — no sideways scroll at 1280×820 and 375×812.

Mechanical defence passed.
