# SKATGO-43 AC checks

All against the built server on the ticket port (`operations.md` Tools), headed Playwright, script in
`tmp/`. Sizes: the ticket's desktop 1440 and phone 390, plus the charter's 1280×820 and 375×812
(`isMobile`, `hasTouch`). Pages: `/en/course`, `/en/rules`, `/en/daily`, `/de/kurs`, `/de/regeln`,
`/de/taeglich` (grill Q1/Q2). `/daily` needs the multiplayer service and local database running.

## AC1 — same header, no rail, no tab bar

From `/en` (and `/de`), click the header's daily / course / rules link (on a phone through the header's menu).
Pass: the opened page has `[data-testid=landing-header]` whose brand, nav links and end controls match
the front page's (same text, same bounding box at the same width); `[data-testid=rail]` and
`[data-testid=tab-bar]` are absent (count 0).

## AC2 — no orange band, title visible

Pass: `[data-testid=band]` count 0 on all three pages; each page's single `<h1>` is visible and reads the
former band title (`m.course_title()` / `m.rules_title()` / `m.daily_title()` in that language), and it is
present in the server HTML (curl).

## AC3 — content unchanged

Compare before (`main`, same build on a second port) and after, per language: the text of
`[data-testid=skat-home]` minus the band (lead, pills, progress card, buttons with their `href`, every
lesson card with `data-lesson`/`data-state`/`href`), and of `[data-testid=rules]` minus the band
(intro, contents links, every section's text, lesson links), and of `[data-testid=daily]` minus the band
(the lead with date and countdown, the start button, the leaderboard). Pass: equal.

## AC4 — no horizontal scroll, front-page style

At each size: `document.documentElement.scrollWidth <= innerWidth`. Screenshots of each page beside the
front page at the same size, looked at for the same header and the page's own content style.
