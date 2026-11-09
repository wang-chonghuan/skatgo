# SKATGO-179 rework

## Round 1 — 「经验就从上周开始算起，就是延续上周的表，目前这个榜单只有我一个人，不行」 (f7a2d51)
- XP and win rate count deals from Monday 2 November 2026 on (`XP_SINCE` in `app/src/lib/skat/xp.ts`; the query in `multiplayer/src/xp.ts` filters `day >= XP_SINCE`): the last weekly board continued, never reset. Charter product/engineering/ui name the date.
- `multiplayer/test/xp.test.ts`: deals before the start left out, a later week's deal added to the same board.
- Preview: production's board rows from 2 November (read only, `tmp/board-since.sh`) copied into the ticket DB; the local board showed the six accounts of production (Wyong 576, Olena 352, Konanekane 220, Grüner Wolf 196, Spinnifix 138, yunzhu 62).
- Rechecked: AC 1 (Playwright desktop/phone, en/de, 6 rows), AC 2 (board from the start date, test), AC 3 (no resetsIn).

## Net effect against the handoff
The board is not all-time but from 2 November 2026 on; nothing else changed.
