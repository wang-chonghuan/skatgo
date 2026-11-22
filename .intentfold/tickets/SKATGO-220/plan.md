# SKATGO-220 plan

Found in the code: `MeCard` in `app/src/components/skat/league.tsx` lays each stat out as a column
(`styles.stat`, `flexDirection: 'column'`): the coin icon with the number, then "coins", then
"+100 today" each on their own line; the points number, then "League points", then the promotion /
relegation lines. The two stats sit in a wrapping row (`styles.stats`) that already stacks them on a phone.
`charter/ui.md` (The League) says "Münzen" and "+100 heute" go *under* the number — this ticket amends
that phrase to match the request.

Route (one slice):
1. In each stat, put the value and its words in one wrapping row (`flexWrap: 'wrap'`, baseline-aligned,
   existing `space` tokens only): coins row = icon + number + "coins" + "+100 today"; points row =
   number + "League points". The promotion/relegation lines stay under the points row.
   The icon is centred on the number; the number's baseline lines up with the words.
   Items move to the next line only when the row cannot hold them; nothing is `nowrap`, so no
   horizontal overflow at any width.
2. Amend the one League sentence in `charter/ui.md`.

No business logic, copy, testid or token changes.
