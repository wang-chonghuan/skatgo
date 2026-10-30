# SKATGO-158 acceptance checks

Checked on the running ticket build (`/en/play`, free play, faces on), measured in the browser. The SKATGO-34 values
are computed in the same felt from the pre-SKATGO-147 formulas, so "same as before" is checked against the old
geometry itself.

1. **Frame and stacks as before SKATGO-147.** At 390×844, 369×664 and 1280×800, the frame's left, top and width, and
   each stack's centre line, match the SKATGO-34 formulas within 1px. The stacks' cards keep SKATGO-148's size.
2. **Faces on or off, same table.** At the same three viewports, with faces switched off in the settings, the frame's
   rect is identical to the faces-on rect.
3. **Faces whole, clear of board, frame and stacks.** At the three viewports, each face's rect does not intersect
   the info board, the frame, or a ten-card stack.
4. **Frame centred.** At the three viewports the frame's horizontal centre equals the felt's within 1px, and its
   vertical position is the one in check 1.
5. **Cards over plates.** With a trick on the table, at the point where a trick card and a seat plate overlap,
   `elementFromPoint` returns the card, not the plate. The same holds for the skat pile during bidding. Played by the
   human, not scripted, so this check reads the paint order: plates come before the trick cards in the frame, and the
   skat pile is positioned.
