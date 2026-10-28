# SKATGO-144 handoff

## What changed

- **Front page** (`entry-page.tsx`, `styles.elo`): on PC the Elo board's card no longer sizes its row — no height of its
  own, the row's as its minimum — so it is exactly as tall as the Learn and Practice cards beside it and its list scrolls
  inside; the gap under those cards is gone. Under `bp.cards` (tablet, phone) as before.
- **Charter** `ui.md`: the board never taller than the cards beside it.

## AC results

Local web 55144 with a copy of production's tournament rows (17 players on the board).

1. **Aligned and scrolling** — passed at 1280, 1440 and 1920 wide: board 434–643px, the course card 434–643px; the
   list 291px tall in 113px, scrolling (`tmp/pc.png`).
2. **No gap** — passed: the picture cards follow right under the colour cards.
3. **Phone** — passed: no sideways scroll, the board folded behind its line as before (`tmp/phone.png`).

Mechanical defence: run before merge.

## Deviations

None.

## Environment

Ports: web 55144, multiplayer 56144, database 57144. No env change.

## Residual

None.

## Check

1. http://localhost:55144/en on PC — the Elo board beside Learn and Practice, scrolling.

## Decided for you

- The colour cards set the row's height; the board follows it.
