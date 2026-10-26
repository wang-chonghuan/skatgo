# SKATGO-137 plan

## What the code and the data say that the ticket does not

- Production (read only): olena — her account and the earlier guest id `player_aliases` already counts as hers — has 14
  days with the AI's games; konanekane 5 days. `playProfile` reads both, so the home card draws both curves; no data
  change is needed.
- The card's drawing is stretched (`preserveAspectRatio="none"`); labels drawn in SVG would stretch with it, so they are
  HTML around it.

## Route

1. `progressCurve.line` 4 → 6 (dot 6).
2. Under the curve the first and the last day (`meta`, slate); at its right the AI's tag (`Who`) centred on the zero
   line — one vertical label. The drawing fills a box that takes what the card has left, so the card keeps its size.
3. To show the two curves: their production rows copied into the local database under test accounts.
