# SKATGO-221 AC

Checked on the ticket's web (port 55221), PC 1280×820 and phone 375×812, Playwright. English at `/en`, German at `/`
(paraglide's url patterns; `/de` is not the German front page), each with its browser locale; the tile's title proves the
language.

1. **"Hot" in both languages** — `/en` and `/de`: the League tile's ribbon (`entry-badge`) reads "Hot"; no tile on
   either page shows "New" or "Neu".
2. **Gold with a highlight** — screenshot of the tile; the cup's fill is the gold gradient (computed `stop-color`s are
   the three trophy tokens), and the white highlight stroke is present.
3. **It shines, looping** — the shine band and both sparkles have a running CSS animation with infinite iterations
   (`getAnimations()`), and two screenshots of the cup taken during the pass and during the rest differ.
4. **Still under reduced motion** — with `reducedMotion: 'reduce'`: the cup's elements have no running animations;
   the cup is drawn gold, the band is not over it.
5. **Fits on PC and phone** — the ribbon and the cup sit inside the tile's box, and the cup's box does not overlap the
   tile's title, at both viewports; screenshots EN and DE.
6. **"Hot" a little larger** — the ribbon's computed font size is above the 13px it had and at most 18px, EN and DE,
   PC and phone; seen in the tile screenshots.
7. **No corner shows** — the ribbon's untransformed box turned 45° about its middle: each of its four corners lies at
   least 4px outside the tile, EN and DE, PC and phone; close-ups `tmp/corner-PC.png`, `tmp/corner-phone.png`.
8. **League first, the deal of the day fourth** — the four colour cards in page order are league, play, course, daily,
   EN and DE, PC and phone; screenshots of the front page.
