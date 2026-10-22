# SKATGO-119 grill

1. How tall should the boxes be? Recommendation: the post's text about 10 lines, a comment about 4.
   Asked before development. **Answer (the human): 「你用最佳实践，但是不要给的行太多」** → about 6 lines for a
   post's text and 3 for a comment, still growing with the text.

Below the bar, decided:
2. Old `?deals=12` links: they open the six-deal tournament (the routes simply keep no search); no redirect code.
3. A request body that still names `size` (an old page open during the deploy) is refused like size 12; it
   goes away on reload. No compatibility code (the human ruled it out before, SKATGO-48).
4. Analytics events keep `deals: 6`, so earlier dashboards stay comparable.
