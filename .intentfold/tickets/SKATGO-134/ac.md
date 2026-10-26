# SKATGO-134 acceptance checks

Local web 55134, multiplayer 56134, database 57134. `tmp/ac.mjs` (Playwright, PC 1280×820 and phone 375×812, both
languages unless named). It plays no game: table states are reached by the smallest step that shows them (a free-play
deal is opened and only its first decision is read; later states are read from the component through the course's and
the real table's render paths, see 8).

1. **Home without FAQ** — `/` and `/en`: no `entry-faq`, no FAQPage in the head; the slogan, the lead, both hero buttons,
   the Elo board, the four tiles with their titles and the rules / course links are present with the same text as on
   `main` (compared against a capture taken from the base build before the change).
2. **About page** — `/de/ueber-skatgo` and `/en/about` answer 200 with JavaScript off and show the five questions and
   answers, the daily section (deal of the day, six deals, Seeger-Fabian, boards) and the private-table section (opening,
   rules, a dropped player). Both are in `/sitemap.xml` with each other as alternates; `npm run check:seo -- --built` and
   `npm run test:seo` pass.
3. **Footer** — on the home page, /daily, a lesson, the rules and the forum: "About SkatGo"/"Über SkatGo" and
   "Rules"/"Regeln" link to the page in the page's language.
4. **/daily** — on both toggles: nothing after the board but the folded AI comparison and the free-play link where they
   already were; no `game-reading`, no "Rules · Course · Play · Home".
5. **/with-friends** — the column holds only the H1, one paragraph and the open-table control (guest: the sign-in
   button alone).
6. **/skat-tricks** — the element after the H1 is the first exercise card.
7. **Profile** — the lead's rendered height at 1280×820 is one line (height ≤ its line height).
8. **Table lines** — acceptance plays no game. Free play: the first decision the table offers (bidding) shows its
   buttons and at most one sentence, none of the ticket's listed ones. For the states after it (pick up, put away,
   contract, play, a wrong card, settlement): every listed sentence's message is referenced only on the course branch
   (`hints` true) — a grep over `app/src`, naming each key — and the real-table branch's messages are the short ones.
   Lesson 11's play-record note keeps its message, passed by lesson 11 only. Playing those states through is the
   human's, on the review link.
9. **Charter** — `ui.md` carries the four rules; its front page, sub-page, footer and table text match the product (read).

Mechanical defence (`engineering.md`) once before the handoff.
