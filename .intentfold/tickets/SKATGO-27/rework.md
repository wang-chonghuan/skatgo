# SKATGO-27 rework

`handoff.md` froze at `905914e`. After it:

1. **`65fd364`**. The ask: "我感觉牌怎么有个丑陋的黑边呢？" (the cards have an ugly black edge).
   - **Cause:** the deck frames every face with a black-stroked rect. It was the deck's own and present
     on `main` too. Clipped by the card's 8px rounded corners, it showed as an uneven black edge.
   - **Change:** the face is rendered with that rect's stroke removed. The card's white face and its
     shadow draw the edge.
   - **Rechecked:**
     - `tmp/ac.mjs`, all three criteria at both viewports, on-screen pixel counts: 36/36.
     - Unit tests: 70/70.
     - A zoomed screenshot of a card corner on `main` and on the branch: the stroke is gone.

Net effect relative to the handoff: `playing-card.tsx` only, three lines.
