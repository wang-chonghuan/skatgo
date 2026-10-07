# SKATGO-52 AC check plan

Built server on web port 55052; JavaScript disabled for the server-HTML criteria. Free play is not touched, but lesson 11's game needs multiplayer, so the multiplayer service (56052) and the database (57052) run for the "course still works" check.

## AC1 — Eleven German lessons

- **Check**: for each lesson, fetch `/de/kurs/<slug>` and read the title, the meta description, the h1, and the `lesson-intro` text in the server HTML. The assigned primary keyword (from the table in the handoff) must appear in the title, the description and the h1, case-insensitively. The intro must be present in the server HTML.
- **True when** all 11 lessons pass.

## AC2 — Lesson 10 takes the tips searches

- **Check**: the German title or intro of lesson 10 contains "Skat Tipps" or "Todsünden". Every tip it names is one the lesson teaches, checked against `content.de.ts` lesson 10 by reading.
- **True when** both hold.

## AC3 — English entry page

- **Check**: the English lesson 1 page's title and h1 contain "how to play Skat" or "Skat card game", case-insensitively.
- **True when** both contain one of them.

## AC4 — One page per keyword, SEO, course unchanged

- **Check**: for every keyword in the table, gather the titles of all 38 indexable pages (sitemap). The keyword must appear in exactly one page's title, the page assigned to it.
- **Check**: `npm run check:seo -- --built` and `npm run test:seo` (mechanical defence).
- **Check**: the course still works.
  - Desktop 1280 and phone 375: the course page lists 11 lessons.
  - Lesson 2's player starts, and its first exercise accepts an answer.
  - Lesson 11 deals a game.
  - No horizontal scroll on lesson pages 1, 10 and 11 at either width.
- **True when** all pass.
