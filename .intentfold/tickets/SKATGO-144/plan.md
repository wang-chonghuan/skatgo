# SKATGO-144 plan

The front page's grid (SKATGO-135) puts the Elo board in the third column of the second row; its card sized the row by
its content (ten players), so the row grew taller than the two colour cards beside it and left a gap under them. The
card gets no height of its own on PC (`height: 0`) and takes the row's (`min-height: 100%`); the board's list already
scrolls inside (`EloBoard fill`). Under `bp.cards` nothing changes.
