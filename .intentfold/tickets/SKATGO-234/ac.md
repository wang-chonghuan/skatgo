# SKATGO-234 acceptance checks

Headed Playwright against the production build on 55234 (multiplayer 56234, database 57234), 1280×820 and
375×812, English and German. Test accounts `test_player`, `test_admin` (official). Scripts and shots in `tmp/`.

1. /forum shows two tabs, Announcements and Discussion (DE Ankündigungen, Diskussion); no "Advanced course";
   `/forum?section=guides` shows the announcements with status 200.
2. `test_player` creates a post in Discussion; the new-post form offers Announcements only to `test_admin`; the
   service refuses a player's announcement (multiplayer test).
3. The front page has no bidding card; the card titled "Skat Tricks" (EN and DE) opens /skat-tricks.
4. /skat-tricks lists the bidding practice; it opens /bidding-practice, which plays as before.
5. No link to /skat-tricks anywhere is labelled Practice / Üben (grep of messages and the built pages).
6. The front page's former bidding place holds "Advanced course" / "Fortgeschrittenenkurs", opening the course page,
   which lists the lessons.
7. The first lesson opens from the list, runs its exercises to the end, and its title names its topic; its
   answers are the solver's (unit test).
8. No sideways scroll at 1280×820 and 375×812 on /, /forum, /skat-tricks, the course page and the lesson, EN and DE;
   `check:seo` passes with the new pages in the sitemap.
