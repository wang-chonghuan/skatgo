# SKATGO-70 handoff

## What changed

No code; only the master logo and what is generated from it.

- **`app/brand/skatgo-logo.png`**: now the human's tweaked logo (`skatgo-logo.jpg`, 1408×1408), converted to PNG with its pixels unchanged (grill Q1). The path the charter names is unchanged.
- **`app/public/` icons**, regenerated from it by `.intentfold/tickets/SKATGO-23/icons.mjs` with the same crop and padding as before (grill Q2): `favicon.ico` (16/32/48), `favicon-32.png`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `logo-96.png`.
  - The script crops to the drawn area (1092×1088 in the new image) before padding, so the mark fills each icon as it did.
- **`app/public/og/*.png`**: all 40 link previews redrawn by `.intentfold/tickets/SKATGO-50/og.mjs` from the built site on 55070 (grill Q3).
  - The pages come from the sitemap. The friends page is left out, since it shares free play's picture.
  - The front page's two were drawn last from the front page itself, because the privacy and terms pages share them.

## AC results

Built web on 55070. Checked by `tmp/ac70.mjs` and `tmp/ogdiff.mjs` (headed Chromium, desktop 1280×820 and phone 375×812).

1. **The tab, the header and the home-screen icons show the new logo, matching the given image, no white-edge misalignment or specks.** Met.
   - Each icon has its old pixel size. Each is served by the site exactly as committed, and each differs from the one on main.
   - Along every icon's edges the ground is white: 0 pixels below 250, so no grey frame and no JPG specks.
   - The header shows `/logo-96.png` at both sizes, and the page names the regenerated icons.
   - A contact sheet (`tmp/sheet.png`) shows every icon beside the master, alike.
2. **Every page's preview shows the new logo.** Met.
   - 38 of the 40 differ from the old ones only inside the 50×50 logo box: 619 pixels each, everything else identical.
   - The front page's two (`home-de.png`, `home-en.png`) also have a new title. The old pictures still read "Daily Skat tournament" / the old German heading, while the front page's H1 is now "Play Skat online". The charter has these pictures drawn from each page's H1, so the redraw follows it.
3. **The files named in the ticket are updated at their old sizes.** Met locally: the served files and their hashes are above. Checking them on skatgo.com belongs to the deploy, at close.

**Mechanical defence**: passed in full — typecheck, build, 101 tests, bundle, tokens, literal grep, SSR link, `check:seo -- --built`, `test:seo` 25/25.

## Deviations

- The front page's preview titles were refreshed along with the logo (above). They had fallen behind the page's H1.
- The first run of `og.mjs` let the terms page overwrite `home-*.png`, because the three pages share the picture. The front page was then drawn again last; the result was checked.

## Environment

- Web 55070 is left running for review. No multiplayer or database needed.
- No env key added, changed or removed.

## Residual

- The friends page (`/with-friends`) still shares free play's preview picture; a picture of its own would be new content.
- The Clerk sign-in window's logo is set in Clerk's dashboard, outside the repository.
- Browsers and search engines cache favicons; the new one shows as their caches expire.
