# SKATGO-222 plan

## What the code already says that the ticket does not

- The four colour cards are placed by their order in `entry-sections` (grid auto-placement; only the long white cards
  have their own grid places). SKATGO-221 left them League, free play, the course, the deal of the day.
- Each card's colour is its `tone`, mapped in `tileTones` in `app/src/components/skat/entry-page.tsx`: background and
  shadow together (`color.tile*`, `elev.tile*`; ui.md: every coloured surface casts a shadow in its own colour). The
  mapping is not a token registry, so swapping it adds or changes no token.
- `tileGreen` and `tileRed` colour nothing else that means the deal of the day or free play (`tileRed` also marks the
  declarer's tag on the table, unrelated).
- The cards' clicks are tracked by `heroClick('primary')` (the deal of the day) and `heroClick('free')` (free play).
- `ui.md` names the tiles' colours in three places: the colour-tile surface row and the `tile*` token row (both
  already stale: they give green to free play and red to a private table) and the front page's tile sentence.

## Route

1. Order: League, the deal of the day, the course, free play.
2. `tileTones`: the deal of the day `tileRed` / `elev.tileRed`, free play `tileGreen` / `elev.tileGreen`; the comment
   says why.
3. `ui.md`: the order sentence and the two cards' colours in the tile sentence; the two table rows say which card
   each colour now marks.

One commit for code and charter, then the handoff.
