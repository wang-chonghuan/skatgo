# SKATGO-147 acceptance checks

1. **Avatars, chosen style.** /en/play at 1280×820 and 375×812: an image above Lina's cards and one above Noah's,
   Lina's the woman, Noah's the man, in the approved style (looked at in a screenshot). Same on /en/daily/play.
2. **Bid won → laugh.** Drive the face function with a game whose auction Lina (then Noah) won: her face is the
   laughing one until the first card; checked in the browser where a deal reaches it (no scripted deals: one
   pass at most), otherwise by the unit check of the face function.
3. **Trick won/lost.** Face function: at `trickEnd`, the taker's side laughs and the other side sulks; neutral
   again once the trick is collected. Seen once in the browser on a trick end.
4. **No overlap.** At 1280×820 and 375×812 (plus 375×667), the avatar's box intersects no card, no plate, no
   info board, the table's line or the talk card: measured with `getBoundingClientRect`.
