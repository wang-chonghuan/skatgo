# SKATGO-234 plan

## What the code already promises, and what the ticket does not say

- Forum sections are a plain `text` column; `FORUM_SECTIONS` / `OFFICIAL_SECTIONS` in `app/src/lib/forum.ts` drive the
  tabs, the service's checks and the list. A guide's number and its previous/next lesson (`number`, `prev`, `next`,
  `neighbours()`) exist only for `guides`. Production holds no guide; a stray one becomes an announcement in the
  migration. An unknown `?section=` already falls back to the forum's home (`routes/forum.tsx`).
- "Practice"/"Üben" is only the front page card's title (`home_practice`); everywhere else `/skat-tricks` is already
  "Skat tricks" (`tricks_title`, footer, rules, course). The hub (`tricks-page.tsx`) is a numbered list of kinds.
- The bidding practice keeps its page and address `/bidding-practice` (indexed, in the sitemap); only its front card goes.
- The front page's picture cards are friends, forum, then a pair (practice, bidding), each with a picture in the
  forum picture's flat style. The new course card needs its own picture in that style (Azure `gpt-image-2`, edits
  with the existing cards as references, as the bidding card was made).
- The course's lesson engine (`lib/skat/lessons`: teaching steps and exercises judged by the rules engine; the
  player, the first card for search engines, the folded full text) can carry an advanced lesson unchanged. Lessons
  are keyed by id; progress (`lib/skat/progress.ts`) is keyed by id too.
- The solver already decides Null with every card open (`nullBreaks`) and what a declarer can be sure of
  (`nullSure`), so the lesson's Null answers can be proven in tests.
- Undecided: the first lesson's topic (grill), the card's picture (three drawn, one chosen in review).

## Route

1. **Forum, two sections.** `FORUM_SECTIONS = ['news', 'talk']`, `OFFICIAL_SECTIONS = ['news']`; drop `number`,
   `prev`/`next`, `neighbours`, the guide mark and words; migration `guides` → `news`. Tests follow.
2. **Skat Tricks.** Front card title "Skat Tricks" (EN and DE), its line naming bidding too; the bidding card goes.
   The hub gets the bidding practice as its last numbered entry, a link to `/bidding-practice`.
3. **Advanced course.** `/advanced-course` (indexed list page) and `/advanced-course/$slug` (a lesson page in the
   course's lesson player and folded text), its lessons in `lib/skat/lessons/advanced.{en,de}.ts` with their own
   guides (slug per language, question title, description). In the sitemap. Front card "Advanced course" /
   "Fortgeschrittenenkurs" in the bidding card's place with its new picture; the course page links to it too.
4. **First lesson** (topic per grill): rewritten in SkatGo's own words from the books' chapters, with SkatGo's own
   hands; its exercises' answers proven by the solver in a test.
5. **Charter**: product.md (forum two lists; Skat Tricks with bidding; the advanced course), ui.md (front cards, hub
   entry, course pages), engineering.md (files, sitemap).
6. **Checks**: unit tests, multiplayer forum tests, mechanical defence, AC at both sizes, EN and DE.
