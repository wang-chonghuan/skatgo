# SKATGO-107 AC check plan

1. **Front page main script smaller, other pages' code not in it** — built `index-*.js` size vs 1,021,513 B
   at 349992a; source-map breakdown shows no page components (lessons, rules pages, tricks pages, legal
   text) in it.
2. **Stall much shorter** — the same Playwright measurement as the diagnosis (phone 375×812, CPU 4×,
   long-task observer; desktop 1280×820): longest main-thread task vs 4.2 s phone / 0.83 s desktop.
3. **All pages work; readable without JS** — Playwright over 21 addresses (front page both languages,
   course, a lesson in each language, quick start, rules, bidding table, score sheet, printable, tricks,
   the 12-tricks article, a Null-Risiko and an Endspiel exercise, daily, play, with friends, privacy, terms,
   404) on desktop and phone: status, h1, main text, no page errors; a client-side navigation from the
   front page without reload; a Null-Risiko exercise answers. `check:seo -- --built` (JS disabled) passes
   in the mechanical defence and live.
