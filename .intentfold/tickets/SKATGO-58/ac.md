# SKATGO-58 AC check plan

Built web on 55058, multiplayer on 56058, database on 57058. Free play brings the table to the play phase: bid by passing until someone declares, then stop at the first card. No game is played for its own sake.

## AC1 — No pill overflows the side panel

- **Check**: in the play phase, at 1280×820 (panel pinned) and at 375×812 (drawer opened), every pill in the panel lies inside the panel's box (`right` and `left` within the panel's), and no pill's `scrollWidth` exceeds its `clientWidth`.
- **Check**: the same with the longest German text forced, by playing in German, where the panel is narrowest.
- **True when** none overflows.

## AC2 — Trick number and both sides' points still shown

- **Check**: the panel contains "Stich n von 10" and "Augen: Alleinspieler x · Gegenspieler y".
- **True when** both are present.

## AC3 — Other pills unchanged

- **Check**: the course page's three pills render on one line each at 1280 width, with the same height as before (40 px, `dims.control`).
- **True when** they do.
