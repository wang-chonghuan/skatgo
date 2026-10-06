# SKATGO-50 AC check plan

The built server runs on web port 55050. The pages are static, so the multiplayer service is not needed. Each criterion is checked once, with JavaScript disabled where the criterion concerns server-rendered HTML.

## AC1 — Bidding table page

- **Check**: fetch `/de/regeln/reiztabelle` and `/en/rules/bidding-table` with plain `curl`, without JavaScript.
  - Every value in the HTML's bid ladder must equal `BID_LADDER`.
  - Each cell of the matrix must equal base × multiplier, with base taken from `SUIT_BASE` / `GRAND_BASE` and the upper limits from the engine's constants.
  - The Null values must equal `NULL_VALUES`.
- **Check**: the rules page has a link to the table page, in both languages.
- **Check**: in Playwright, `page.emulateMedia({ media: 'print' })`, then a screenshot. The visible elements must be only the title and the tables: the header, footer, assistant, buttons and links all have `display: none` or zero size.
- **True when** all the numbers match and the print screenshot shows only the tables.

## AC2 — Rules and course pages

- **Check** the German pages' title, description and h1:
  - the rules page contains "Skat Regeln";
  - the course page contains "Skat spielen lernen".
- **Check**: `#grand`, `#null-ouvert` and `#ramsch` each exist on the rules page in both languages, inside a heading. Opening `/de/regeln#ramsch` must scroll that heading to just below the top bar.
- **True when** all are present.

## AC3 — Play page

- **Check**: the German play page's title, description, and the visible SSR text in `main` contain "kostenlos", "ohne Anmeldung" (or "ohne Registrierung"), "ohne Werbung" (or "werbefrei"), and "gegen den Computer".
- **Check**: the whole page, the English page included, contains none of "offline", "Offline", "ohne Internet".
- **True when** every keyword is present and none of the false claims appear.

## AC4 — Sitemap, SEO check, no horizontal scroll

- **Check**: `sitemap.xml` contains both addresses of the new page, with hreflang alternates.
- **Check**: `npm run check:seo -- --built` and `npm run test:seo` pass.
- **Check**: at 1280×820 and 375×812, `/de/regeln/reiztabelle`, `/en/rules/bidding-table`, `/de/regeln`, `/de/kurs` and `/de/spielen` each have `scrollWidth ≤ innerWidth`.
- **Check**: existing functions still work:
  - the play page still renders the table and loads its first deal;
  - the course page's lesson list is intact;
  - the rules page's existing anchors are still there.
- **True when** all pass.
