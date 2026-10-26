# SKATGO-140 plan

## What the code says

- `dailyElo` (`multiplayer/src/daily.ts`) reads size 6 only; SKATGO-77's twelve-deal rows are kept (sizes 6: 52, 12: 27 in
  production). Konanekane: six-deal days 10-16, 10-24 (10-26 not ended), twelve-deal days 10-17, 10-21.
- Live phone check: the "?" text opens under the folded board, below the screen's foot, ~440px tall, no close button; the
  menu has no dim, a tap outside reaches the page behind (it opened a forum post), Escape does nothing.
- The settings already are a proper dialog (scrim, Escape, X, page inert).

## Route

1. Elo: sizes 6 and 12 (`ELO_SIZES`), each day of each its own game; 5 games to drop the "?".
2. The settings' dialog lifted into the kit as `Modal`; the settings and the Elo explanation use it.
3. Explanation: three lines.
4. Menu: a dim under it that closes it and takes the tap, Escape, closing on a link or a page change, the page locked.
