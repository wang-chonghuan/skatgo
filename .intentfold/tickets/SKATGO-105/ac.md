# SKATGO-105 acceptance checks (built server, desktop 1280×820 and phone 375×812, plus a 320 px phone for the header)

1. Front page: the Tricks tile's button opens `/de/skat-tricks`; the tile's text is about the exercises.
2. Course page: the Skat-Tricks card opens `/de/skat-tricks`; its text is about the exercises.
3. An answered exercise has no link to `/skat-tricks/12-tricks`; the small link under the exercise list still opens the article.
4. `/de/skat-tricks/12-tricks` answers 200 and is in `/sitemap.xml`.
5. Header shows "SkatGo" with no ".com"; flags, gear and sign-in / menu do not touch (measured gaps ≥ the token gap) at 1280, 900, 375 and 320; the gear still opens the settings.
6. Mechanical defence per engineering.md Tools.
