# SKATGO-234 handoff

## What changed

- **Forum, two lists** (`lib/forum.ts`, `forum-page.tsx`, `multiplayer/src/forum.ts`, `store.ts`): Announcements
  (SkatGo only) and Discussion (players' own threads, SkatGo too). The advanced-course list, its lesson numbers and
  previous/next links are gone; the migration makes any `guides` post an announcement (production has none). Words EN/DE.
- **Skat Tricks**: the front card is "Skat Tricks" in both languages, its line naming bidding; the bidding card is
  gone; the hub lists "Bidding practice" / "Reizen üben" as its last entry, opening `/bidding-practice` (address,
  sitemap entry and records unchanged; its breadcrumb is now Skat Tricks › Bidding practice).
- **Advanced course** `/advanced-course` (DE `/de/fortgeschrittenenkurs`): list page, lesson pages in the course's
  lesson player and folded text, sitemap, SEO inventory, link previews (`og/advanced-*`). Front card in the bidding
  card's place with a new picture (`advanced-card.webp`, option A of three, Azure `gpt-image-2` with the bidding and
  practice cards as style references; prompts and all three in the main checkout's `.intentfold/tmp/SKATGO-234/course-card/`).
  The course page links it beside Skat Tricks.
- **First lesson, Schneider** (`lib/skat/lessons/advanced.{en,de}.ts`, id 101, 12 steps, the human's choice): the 90
  and the 31, its worth, the silent Schneider and the overbid it risks, win first then Schneider, announcing only a
  sure one, defending to 31. SkatGo's own words and hands after the books' Schneider chapters; `advanced.test.ts`
  proves every answer with `settle` and `sureOf`.
- Charter: product.md, ui.md, engineering.md.

## AC results

All against the production build on 55234 / 56234 / 57234, headed, `tmp/ac.mjs`:

1. PASS — /en/forum and /de/forum show Announcements/Discussion (Ankündigungen/Diskussion); `?section=guides` 200.
2. PASS — the official's composer offers the two lists; a player posts in Discussion (200); a player's announcement 403; `guides` 400.
3. PASS — no bidding card; "Skat Tricks" (EN and DE) opens /skat-tricks.
4. PASS — the hub's last entry opens /bidding-practice.
5. PASS — no "Practice"/"Üben" label on the front page in either language.
6. PASS — the "Advanced course" / "Fortgeschrittenenkurs" card opens the course page with the Schneider lesson.
7. PASS — the lesson runs its 12 steps to its end screen; back on the list it is marked done; answers proven by unit test.
8. PASS — 10 pages, EN and DE, 200 and no sideways scroll at 1280×820 and 375×812.

Mechanical defence passed (check:seo: 66 indexable pages); multiplayer forum and forget tests pass.

## For the human

- Pick the card picture: A (in place), B or C.
- No env change. Multiplayer deploys first (the migration), then web.
