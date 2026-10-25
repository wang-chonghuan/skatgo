# SKATGO-132 handoff

## What changed

- **Share codes** (`multiplayer/src/shares.ts`, `/share` behind the admission key): `dod_shares` (code, day, player,
  score, AI's), one per player and day; `/share/code` gives a finished deal of the day its 8-letter code; `/share/read`
  reads a code back — day, score, AI's, whether today — never the player.
- **The card** (`multiplayer/src/card.ts`): SVG in the site's colours with Red Hat Display (static TTFs, OFL, in
  `multiplayer/assets/fonts`) and the clear logo; three card backs drawn (the font has no suits; a pictured back pushed
  the PNG past WhatsApp's ~300 KB); "1 Spiel heute · 25. Okt.", the score large, "KI +72", "Kannst du das schlagen?";
  no card face, contract or name. `@resvg/resvg-js` 2.6.2 (exact; approved) renders it: wide 1200×630 (~123 KB),
  tall 1080×1350 (~212 KB); kept in memory per code. Docker copies `assets/`.
- **Practice** (`/share/practice/new`, `/act`): a past day's deal of the day from a sealed token (`free.ts` `seal`/`open`
  made generic, `tokenKey` with its own label), nothing stored, on no board.
- **Web**: the share ops through `/api/daily/*` (`share` names the player, guest or account; `shared`, `practice-*`
  name no one); the card at `/api/card/<code>-<de|en>-<wide|tall>.png` (404 for an unknown code); `pageHead` takes an
  `imageUrl`; `lib/share-api.ts` reads a code on the server for the page's head.
- **Result page** (`deal-of-day.tsx`, `lib/share.ts`): "Ergebnis teilen" stays the one `go` — the phone's share sheet
  with the tall card as a picture (where Instagram is), the line and link copied elsewhere; under it WhatsApp,
  Instagram (phone: the sheet; computer: the picture saved), Facebook, Telegram, X by their public share addresses (no
  script of theirs), "Bild herunterladen", "Link kopieren". Every link names its platform (`?via=`).
- **The shared page** `/d/<code>` and `/de/d/<code>` (`shared-page.tsx`, noindex): "Kannst du das schlagen?", the day,
  the shared score and the AI's, "Dieses Spiel spielen · 2 Min." — on its day to today's deal (ranked), after it to the
  practice table `/d/<code>/play` (full screen), which ends with the player's score beside the shared one and the AI's.
  Its `og:image` is the card. Unknown codes say so, with the way to today's deal.
- **Analytics**: `dod_shared` by platform, `dod_share_opened` with `via` and whether on its day.
- **Privacy policy** (both languages, dated 2026-10-26): a shared result is stored under a code; no name shown; the
  platforms' scripts are not loaded.
- **Charter**: product, engineering, ui.

## AC results

Local web 55132, multiplayer 56132, database 57132 (test data: a finished deal of today for the test account
`share`; a code `past0001` for yesterday's deal). `tmp/ac.mjs`, PC and phone, German: all passed.

1. **Sharing** — passed: WhatsApp, Facebook, Telegram and X each link to their share address with the line and the
   shared page; Instagram, picture download (`skatgo.png` saved) and copy are offered; "share" the one `go`. The share
   sheet and what each app does with the link are left to the human on a phone, after release (the apps cannot reach
   a local preview).
2. **The card** — passed: 1200×630 PNG, 123 KB; the tall one 1080×1350; a made-up code 404; the shared page's
   `og:image` is the card; the score comes from the code only.
3. **Today** — passed: today's code's page leads to today's deal (`size=1`), ranked.
4. **After the day** — passed: yesterday's code's page offers the same deal as practice; the practice table opens.
   Playing it through and its comparison are left to the human.

Mechanical defence: passed (typecheck, build, 283 tests, bundle, tokens, literal grep, SSR import, SEO built
check, SEO tests). `npm --prefix multiplayer run check`: passed (30).

## Deviations

- The card shows drawn card backs, not the table's pictured back: the pictured one made the PNG 420–470 KB.
- The privacy policy gained a paragraph (sharing stores a result under a code), required by what is stored.

## Environment

Ports: web 55132, multiplayer 56132, database 57132. No env change. New dependency in `multiplayer/`:
`@resvg/resvg-js` 2.6.2 (its Linux glibc build installs in the `node:24-slim` image).

## Residual

- The practice table itself does not name the shared deal or the score to beat while it is played; the comparison
  comes at its end.
- The platform buttons are words, no logos (lucide has no brand icons; no icon dependency was added).

## Check

Raised by the look through your eyes, not changed: the platform buttons are plain words next to the green
"Ergebnis teilen"; the tall card leaves room around the cards; the shared page on a PC is short (score card and one
button).

1. http://localhost:55132/de/taeglich (signed in as the local test account `share`) — the share buttons under the
   result.
2. http://localhost:55132/api/card/past0001-de-wide.png and `-de-tall.png` — the card, wide and tall.
3. http://localhost:55132/de/d/past0001 — a friend's view of an earlier day; play it as practice to the end.
4. After release, on a phone: share to WhatsApp, Instagram, Facebook, Telegram, X and open the link from another
   phone.

## Decided for you

- No name on the card or the shared page (as daily games' shares do).
- Only `@resvg/resvg-js`; the card's template is our own SVG.
- The card is drawn in the multiplayer service and served through the web.
- Practice keeps nothing and is on no board.
- The shared page's button reads "Dieses Spiel spielen · 2 Min." on its day and after it.
