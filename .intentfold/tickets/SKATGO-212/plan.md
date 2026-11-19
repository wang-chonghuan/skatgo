# SKATGO-212 plan

Found in the code: both boards — the home XP board (`xp-board.tsx`) and the League board (`league.tsx`) — draw the same
`public/league/badge/<tier>.webp`, 96×96, cut square from each tier picture's top right with the tier's own colour as
its ground (SKATGO-206), shown at `dims.badge` (24px) with `radii.tag` corners. At 24px the ground fills most of the
square, which is the "一坨颜色". The tier pictures themselves (the League page's carousel) are not part of this.

Route (the ticket's proposed solution):
1. **The six badges** (`app/public/league/badge/<tier>.webp`, still 96×96 WebP q90, same names): each emblem taken off
   its ground from the shipped tier pictures — alpha from each pixel's distance to the ground colour, the colour
   un-blended from it, the small sparkles dropped (parts under 4% of the biggest), cut to a tight square with a 4%
   margin. Bronze, silver and gold are all the bronze picture's ribboned star medal: silver's and gold's metal recoloured
   to the metal the pictures already use for those tiers (the silver medal's grey, the gold cup's yellow), lightness
   kept so the rim, disc and star stay apart; the red ribbon kept. Platinum keeps its shield; diamond its diamond, 10
   points darker; legend takes the gold picture's cup. Script kept in the ticket's `tmp/emblem.mjs`.
2. **No corners on a picture with no square**: `radii.tag` comes off both boards' badge style, so nothing clips the
   ribbon's ends. Size, place and alignment unchanged.
3. **Charter** `ui.md`: the League board's badge line (SKATGO-206's "cut square on its colour") says what it is now.

No token change, no new value. One commit for the badges and the code, one for the charter and records.
