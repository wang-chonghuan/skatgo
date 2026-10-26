# SKATGO-134 plan

## What the code says that the ticket does not

- **A course table is the table with hints.** `GameTable` sets `hints` true for the course's own table and lesson 11
  only (`game-table.tsx`: `remote ? !!server?.hints : true`); free play, both daily tables, private tables and the
  shared-practice table have none. The short wording keys off that same flag, so the course keeps every long line
  untouched and no new prop is needed at the table's callers.
- **Lesson 11's result also shows the play record's note** "Where the AI would have played another card…"
  (`DealAnalysis` in `daily-comparison.tsx`, used by free play, the daily results and lesson 11). Removing it must leave
  lesson 11's: `DealAnalysis` takes an `explain` flag, passed only by lesson 11.
- **The private table's settlement is the only result that still prints `result_line`, `result_points` and the score
  line.** Free play and the daily results already show title, score sheet and formula. The same branch also serves the
  course's own table, which keeps the long settlement.
- **`profile_lead` is also `/profile`'s meta description**, and **`game_learning_title` is the home page's nav label**:
  both must survive with their text where they are used (Constraint: titles, descriptions, H1 unchanged).
- **The home FAQ is checked by `check-seo.mjs`**: every FAQPage question and answer must be visible on its page. The
  FAQPage JSON-LD moves with the questions to the About page.
- **"Opening a table takes a free account…"** lives in `table-room.tsx`'s guest prompt (`OpenTable`), not in the page.
- **The /daily deal-of-the-day side ends with "Play more: free play"** (`dod_free`, SKATGO-131) after the folded AI
  comparison. It is one link to a game, not the reading block's link row; the ticket's list does not name it, so it stays.

## Route

1. **About page** — `about-page.tsx`, route `/about` (`/de/ueber-skatgo`, `/en/about`, grill 1), `client-page` entry,
   head (title, description, breadcrumbs, the FAQPage moved from `/`), sitemap via the source as every page. Sections:
   the five questions (`lib/faq.ts`, unchanged data); "Daily Skat" — the deal of the day and the six-deal tournament,
   the same cards, Seeger-Fabian, the boards and the seven days, the AI's row, the day turning at midnight in Berlin
   (the facts of `daily_about_intro`, `daily_scoring_text`, `game_learning_text`, tightened); "Private tables" — open
   with an account, friends join with a name, up to two, the AI in an empty seat, ISkO without Kontra/Re/Ramsch/Bock,
   all three Seeger-Fabian scores, the AI playing on for whoever drops until they return by the same link.
2. **Footer** — "About SkatGo" and "Rules" after the existing links.
3. **Home** — the FAQ section and its styles go; its JSON-LD goes to About.
4. **/daily** — `GameReading` leaves the page; the file goes (its `readingLink` moves to the friends page's own style).
5. **/with-friends** — title, a one-line lead (grill 2), the button; the guest prompt's sentence goes, its sign-in button stays.
6. **/skat-tricks** — the lead paragraph goes.
7. **Profile** — a one-line lead (grill 2); the old text stays as the meta description under its own key.
8. **Tables** (`hints` false): no line on the speaker's turn, while picking up or Hand, while putting away, or while
   playing; asked to hold, "18?" with "Yes" / "Pass"; forehand alone, one short line; the contract picker without the
   covers / Schneider / Schwarz / Hand notes, a short line only when no game reaches the bid or the chosen game cannot be
   announced; a wrong card, "Follow suit: play ♣."; the private table's settlement under its title: one line of facts and
   the SKATGO-127 formula line, then the skat and the standings. The play record's "Where the AI would…" note only in
   lesson 11.
9. **Charter** — `ui.md`: the four copy rules under Guidance; the front page without FAQ, the About page, the footer, /daily,
   /with-friends, the tricks page, the profile and the table's lines brought to the product; `engineering.md`: the
   route, page file and `lib/faq.ts`'s new owner. `product.md` names nothing removed beyond the private tables' and the
   tournament's facts, which stay true; it gets the About page in "What this product is".
10. **Messages** — new short keys for the real tables; keys no longer used anywhere removed in both languages.

Order: 8 (tables, the largest) → 1–3 → 4–7 → 9–10, each slice run on the ticket's port as it lands.
