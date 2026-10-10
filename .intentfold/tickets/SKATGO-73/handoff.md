# SKATGO-73 handoff

This work came through an open development phase; this file records what was delivered and verified,
not which tool or skill produced each edit.

## What changed

Cause found:
- At server-owned tables (free play, lesson play, the daily tournament, private tables) the learner's card appeared only once the server had answered. That answer includes the computers' thinking.
- SKATGO-72's full-screen tap cover swallowed a tap on a hand card while a trick waited, so leading the next trick took two taps.

Fix, in `app/src/components/skat/game-table.tsx`:
- **Shown at once.** At a remote table a play move is applied locally at once (`pending`, via the engine's `playCard`) and shown until the server's state replaces it. If the server answers without a new state (refused or unreachable), it is withdrawn.
- **One tap leads.** A tap on the cover finds the hand card under it (`elementsFromPoint`). The trick is collected and the card is kept as `intent`. Once the trick has gone, the card is played if the learner is on lead; otherwise it is dropped.

Fix in `server-table.tsx`, `daily-table.tsx` and `table-room.tsx`:
- The tap-to-collect hold is now a `release` flag instead of the tapped state object, so a tap made on the locally shown trick, before the server's trickEnd state arrives, still releases it.

## AC results

Built product on port 55073, desktop 1280×800, scripted legal moves.

1. **A tapped legal card is on the table at once.** Met: 5–11 ms over 14 taps.
2. **One tap on a hand card while a won trick waits.** Met: the trick was collected and the tapped card was in the frame 23–24 ms after the single tap (2 cases).

Mechanical defence passed in full:
- typecheck and build;
- 101 tests;
- 21 client chunks;
- 120 token files;
- literal grep 0;
- SSR link;
- `check:seo --built`: 42 indexable and 6 noindex pages;
- `test:seo`.

## Deviations

None.

## Environment

- Ports 55073 / 56073 / 57073; local database container `skatgo-multiplayer-db-57073`.
- The worktree's `MULTIPLAYER_URL` and `DATABASE_URL` ports were pointed at the ticket ports locally.
- No env key added, changed or removed.

## Residual

The computers' replies are still shown one by one, `BOT_DELAY` 850 ms apart. This is the pace of the table, not the learner's tap.
