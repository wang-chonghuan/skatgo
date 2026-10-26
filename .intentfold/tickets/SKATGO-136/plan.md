# SKATGO-136 plan

## What the code says that the ticket does not

- The card's curve is `Progress` in `entry-page.tsx`: a straight-segment `polyline` through each day's point, 2px
  (`profileChart.line`, shared with `/profile`), with a dot per day.
- The card stretches the drawing (`preserveAspectRatio="none"`) and keeps strokes in screen pixels
  (`vectorEffect="non-scaling-stroke"`), so a thicker line stays thick at any card size.

## Route

1. Replace the polyline with one SVG path through the points, a monotone cubic (Fritsch–Carlson): smooth, and never
   above the highest day or below the lowest between two days.
2. Its width from a new constant for the card, twice the record of play's, round caps and joins; no dots, except the one
   point when there is a single day.
3. `/profile`'s curve untouched (Constraint). Charter `ui.md`'s front-page line on the curve updated.
