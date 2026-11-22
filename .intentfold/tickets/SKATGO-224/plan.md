# SKATGO-224 plan

## What the code already says that the ticket does not

- The four colour cards are placed by page order (grid auto-placement) in `entry-page.tsx`; since SKATGO-222 they read
  League, daily, course, play, and `tileTones` gives daily `tileRed` and play `tileGreen`. Before SKATGO-221 they read
  daily, play, course, League, with daily `tileGreen`, play `tileRed` (git `a2ba721`).
- The order is the same for every visitor; nothing reads the sign-in state for it (SKATGO-223 was cancelled before any
  code).
- The League's "Hot" ribbon (SKATGO-221: `ribbon` type, 148px band) and gold cup are props of its card, independent of
  where the card stands.
- `ui.md` describes the order and colours in the tile sentence and the two colour rows (SKATGO-222's wording).

## Route

1. Page order back to daily, play, course, League; the comment above them keeps the human's words.
2. `tileTones`: daily `tileGreen` / `elev.tileGreen`, play `tileRed` / `elev.tileRed`.
3. `ui.md`: the order sentence and the two colour rows, with the human's words.

No token change. One commit for code and charter, then the handoff.
