# SKATGO-53 AC check plan

The built server runs on 55053. These are static pages, so no multiplayer service or database is needed.

## AC1 — Score sheet

- **Check**: `/de/regeln/skatliste` and `/en/rules/score-sheet` render the table in the server HTML, read with JavaScript off. The table has the agreed columns and rows, and the Seeger-Fabian box's 50 / 40 equal the engine's `SEEGER_FABIAN`.
- **Check**: print emulation shows only the title and the table(s); no header, footer, navigation, buttons or links.
- **Check**: the PDF link answers 200 with `application/pdf`, and the PDF is one A4 page. The page count is read by counting `/Type /Page` objects in the file, since no PDF library may be added.
- **True when** all of the above hold in both languages.

## AC2 — Rules summary

- **Check**: in the server HTML of `/de/regeln/zum-ausdrucken` and `/en/rules/printable`, the card points, base values, Null values and bid ladder equal `POINTS`, `SUIT_BASE`, `GRAND_BASE`, `NULL_VALUES` and `BID_LADDER`.
- **Check**: print emulation shows no navigation and no buttons. `page.pdf({ format: 'A4' })` of the page gives two pages or fewer, and the downloadable PDF has two pages or fewer.
- **True when** all hold in both languages.

## AC3 — Entry points, sitemap, SEO

- **Check**: the rules page, the bidding table page and the course page each link to both new pages, in both languages.
- **Check**: `sitemap.xml` lists the 4 new addresses with hreflang alternates.
- **Check**: `npm run check:seo -- --built` and `test:seo` (mechanical defence).
- **True when** all hold.

## AC4 — Layout and existing pages

- **Check**: at 1280×820 and 375×812 (`isMobile`, `hasTouch`), the 4 new pages and the rules, bidding table and course pages have no horizontal scroll.
- **Check**: the rules page keeps its 8 anchors; the bidding table still shows 85 cells; the course page lists 11 lessons.
- **True when** all hold.
