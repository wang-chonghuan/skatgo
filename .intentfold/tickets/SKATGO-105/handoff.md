# SKATGO-105 handoff

## What changed

- **Entries to the exercises.** The front page's Tricks tile and the course's Skat-Tricks card now open `/skat-tricks` (`entry-page.tsx`, `course-home.tsx`). Their words now describe the exercises:
  - Tile: "36 interaktive Aufgaben zum Reizen, Drücken, Ausspielen, Mitzählen und zum Null – jede mit Lösung und Erklärung." Button: "Jetzt üben".
  - Course card: "36 interaktive Aufgaben – vom Reizen bis zum Null, jede mit Erklärung."
  - English: "36 interactive puzzles on bidding, putting away, leading, counting and Null – each with the answer explained." / "Practise now" / "36 interactive puzzles – from bidding to Null, each explained."
- **The article.** An answered exercise no longer links to the article (`tricks-exercise-page.tsx`; message `tricks_ex_trick` removed). The small link under the exercise list is the article's only way in from the site. The article itself is unchanged: still served, indexed and in the sitemap.
- **Header** (`frame.tsx`):
  - The name reads "SkatGo" without ".com" (message `site_domain` removed).
  - The right-hand group (flags, gear, sign-in or menu) is spaced `space.x16` on a desktop, `space.x12` on a phone and `space.x10` below 360 px. Before, it was `x12` and `x2`.
  - The gear stays in the bar.
  - The `narrowPhone` breakpoint's comment in `breakpoints.stylex.ts` was updated because it described ".com". The value is unchanged.
- **Charter.** These edits ship with the review, for your approval before merge:
  - `ui.md`: the header name, the tile, the exercise page without the trick link, and the article as search-only;
  - `product.md`: the same about the exercise page and the articles.

## AC results

Checked on the built server on port 55105, at desktop 1280×820 and phone 375×812 (`tmp/ac.mjs`):

1. The front page's tile shows the exercises' words, and "Jetzt üben" opens `/de/skat-tricks`. ✅
2. The course card shows the exercises' words and opens `/de/skat-tricks`. ✅
3. An answered exercise has no link to `12-tricks`. The small link under the list opens the article. ✅
4. `/de/skat-tricks/12-tricks` answers 200 and is in the sitemap. ✅
5. The header reads "SkatGo" and the gear opens the settings. Measured gaps (`tmp/gap.mjs`):
   - flags–gear and gear–sign-in/menu are 16 px at 1280 and 900, 12 px at 375, and 10 px at 320;
   - live before this change they were 12, 12, 2 and 2;
   - no horizontal overflow at any width.

   Screenshots `tmp/after-*.png` against `tmp/before-*.png`. ✅
6. Mechanical defence passes: typecheck, build, 130 tests, bundle, tokens, literal grep, SSR import, `check:seo -- --built`, `test:seo` 25/25. ✅

No console errors.

## Deviations

The tile's and the card's words were written by the agent (grill Q2). They are shown here for approval.

## Environment

Port 55105 (built server, left running for review). No env keys changed.

## Residual

None.
