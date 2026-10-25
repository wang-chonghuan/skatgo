# SKATGO-132 plan

## Found in the code that the ticket does not say

- Link previews are static PNGs per page (`app/public/og`, `pageHead` `image` key); nothing renders an image on
  request. The web server is Nitro; a native image module is simpler in `multiplayer/` (plain Node), which the web
  already proxies with the admission key.
- Red Hat Display has no suit glyphs; the card shows card backs (no spoiler either) and the logo, not suits.
- Free play's sealed game token (`free.ts` `seal` / `open`) is the pattern for a game the server keeps nothing of —
  what practising a past deal of the day needs; the day's computers' plans are stored in `daily_deals`.
- `share.ts` (SKATGO-131) builds the shared line and calls the share sheet or the clipboard.

## Route

1. **Share codes** (`multiplayer`): `dod_shares` (code, day, player, score, ai), one per player and day;
   `/daily/share` gives the player's finished deal of today its code; `/daily/shared` reads a code — day, score,
   the AI's, whether it is today — never a player id or name.
2. **Cards**: `multiplayer/src/card.ts` draws the card in SVG — felt green, the logo, "1 Spiel heute · 25. Okt.", the
   score large, the AI's beside it, "Kannst du das schlagen?", card backs fanned — and `@resvg/resvg-js` turns it into
   a PNG, wide (1200×630, link previews) or tall (1080×1350, Instagram), in the code's language; cached in memory. The
   web serves it at `/api/card/<code>-<lang>-<wide|tall>.png`.
3. **The shared page** `/d/<code>` (each language): the result shared (no name), the challenge, and the way to play —
   today's deal on the day (ranked), the same deal as practice after it; noindex; its link preview is the card.
4. **Practice**: `/daily/practice/new` and `/act` play a past day's deal of the day from a sealed token, nothing
   stored; the page shows the player's score against the shared one and the AI's.
5. **Sharing on the result**: "Ergebnis teilen" stays the one `go` (share sheet with the card image on a phone, the
   link copied elsewhere); under it WhatsApp, Instagram (phone: the share sheet with the image; computer: the image
   downloaded), Facebook, Telegram, X, and "Bild herunterladen"; each link names its platform (`?via=`).
6. **Charter**: product, engineering, ui, operations (the font files, the dependency).
