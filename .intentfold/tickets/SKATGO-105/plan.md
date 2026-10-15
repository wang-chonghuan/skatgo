# SKATGO-105 plan

What the code says that the ticket does not:
- The article is linked from three places in the UI: the front page's Tricks tile (`entry-page.tsx`), the course's Skat-Tricks card (`course-home.tsx`), and the "Trick n: …" line under an answered exercise (`tricks-exercise-page.tsx`). The small link under the exercise list (`tricks-page.tsx`) is the one that stays. The article's own "Üben: …" links go *to* the exercises and stay.
- The header's right-hand group (`frame.tsx` `landingEnd`) has a gap of `space.x12` on a desktop and `space.x2` on a phone — the phone value is why flags, gear and menu touch. The ".com" is `m.site_domain()` in its own span, already hidden on the narrowest phones (SKATGO-104).

Route:
1. Tile and course card → `/skat-tricks`; their words (de/en) describe the exercises; the tile's button "Jetzt üben" / "Practise now".
2. Remove the exercise page's link to the article and the message it used.
3. Header: drop the ".com" span (and the now unused message); widen `landingEnd`'s gap to `space.x16` desktop, `space.x12` phone, `space.x10` on the narrowest phone — existing tokens.
4. Charter: the sentences on the tile, the course card, the exercise page's trick link and the header's ".com" (`product.md` / `ui.md`), as SKATGO-103's approval covered the Skat-Tricks descriptions; the header line is the human's own request here.
