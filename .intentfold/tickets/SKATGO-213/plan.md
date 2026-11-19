# SKATGO-213 plan

Found in the code: the League page's tier cards (`league-tiers.tsx`) draw `public/league/<tier>.webp` (480×384, the
emblem top right with its sparkles on the tier's flat colour, the name and fee in HTML over it); the badges
(`league.tsx`, `xp-board.tsx`) draw `public/league/badge/<tier>.webp`. SKATGO-212 changed the badges and left the cards
(its grill, decision 6). And it showed why the live site kept the old badges: the service worker (`public/sw.js`, SKATGO-185)
serves a picture from the device first and refreshes it behind, and the browser's own cache answers that refresh too —
a picture replaced under the same address stays old on every device that had it, for hours.

Route:
1. **The cards** (`tmp/cards.mjs` over `tmp/art.mjs`, the SKATGO-212 emblem code made a module): on each card the old
   emblem is filled with the card's flat ground — its faint edge with it, its sparkles left — and SKATGO-212's emblem laid
   at the old one's centre, rendered at the card's scale from the same pictures: Silver and Gold the bronze medal in their
   metal at the bronze medal's size; Platinum the teal shield with the white star and Diamond the darker diamond, each at
   its own size; Legend the orange cup with its shine and glow, the cup the gold card's cup's size, the glow fading inside
   its square. Bronze's card is unchanged. 480×384 WebP q90.
2. **New addresses** for all twelve pictures, so a device that kept the old ones has nothing to show from its cache:
   `public/league/v2/<tier>.webp` and `public/league/v2/badge/<tier>.webp`; the old files go. One place names the folder
   (`league-tiers.tsx`, beside `tierName`), with the reason, for the next change to the art.
3. **Charter** `ui.md`: the tier pictures' and the badges' lines.

No token, no new value. One commit for the pictures and the code, one for the charter and records.
