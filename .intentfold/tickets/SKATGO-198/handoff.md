# SKATGO-198 handoff

## What changed
- Footer (`app/src/components/skat/legal-footer.tsx`): under the existing links a "Friends" / "Freunde" section — four
  entries, each the site's own picture in a 40px square (`dims.control`, `radii.tag`, `hairline` border, on `imageDim`)
  beside its name; links open in a new tab, `rel="noopener"`, followed.
- `app/src/lib/friends.ts`: the four sites (32karten, pagat.com — its German page in German —, DSkV, The Checker Maven).
- `app/public/friends/*.webp`: 80×80 pictures cut from each site's own files (fetched from the sites in this ticket).
- Messages: `footer_friends` en/de. Charter: `ui.md` Footer row, `engineering.md` the public files.

## AC results (Playwright on :55198, light, after the pictures loaded)
1. /en/rules and /de/rules: heading "Friends" / "Freunde"; four entries with names, every `img` `naturalWidth` 80 — pass.
2. Links: https://32karten.de/, https://www.pagat.com/ (de: /de/), https://www.dskv.de/, https://checkermaven.com/,
   all `target="_blank"` — pass.
3. 375px: scrollWidth 375 = innerWidth; the row's right edge 357 — pass.
Screenshots: `en-desktop.png`, `de-desktop.png`, `en-phone.png` beside this file.
Mechanical defence: passed (346 tests, client bundle, design tokens, literal grep, SSR link, check:seo --built, test:seo).

## Deviations
- The first cut pictures (pagat's jester, 32karten's jack with strips, the checker off-centre) were recut after the
  look-through: pagat's own "P" from its wordmark, 32karten's jack on its banner blue, the checker centred.
- No `width`/`height` attributes on the pictures: the design-token check forbids the raw number; the size comes from
  the token.

## Environment
web 55198 only (the footer needs no multiplayer or database). No env keys changed.

## Residual
None.

## Check
1. The four pictures — recognisable as each site, not placeholders? 32karten has no wordmark, so its picture is a jack
   from its header; pagat is the "P" of its banner.
2. Phone: The Checker Maven wraps to its own second line.

## Decided for you
- Heading "Friends" / "Freunde".
- Followed links (no nofollow), new tab.
- 40px pictures (an existing token, no registry change).
- pagat.com's German page on the German site.
- Order: 32karten, pagat.com, DSkV, The Checker Maven.
