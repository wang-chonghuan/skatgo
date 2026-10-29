# SKATGO-149 plan

## What the code already says (and the ticket does not)

- SkatZero's bidding exists only on the server (`multiplayer/src/skatzero/bidding.ts`); the browser may not run it
  (engineering.md). Its answer per seat is already stored in free play's pool (`multiplayer/skatzero/free-pool.json.gz`,
  1,000 deals × 3 seats, `maxBid`; 17 and 0 both mean pass).
- `maxBid` is a threshold over the expected result, not a named game. Measured over the pool's 3,000 hands:
  1,428 pass, 893 where the limit is exactly one suit/Grand game's value counted from the ten cards, 113 Null
  (23/35/46/59), and 566 where it matches no single ten-card value (Schneider expected, skat expected, or two games
  sharing a value). Only the first three kinds can be explained honestly as "plays X: with n, game n+1 × base".
- The Skat-Tricks exercise page already has every piece a question needs: the situation line ("You are middlehand"),
  the hand as a `CardRowView`, the `Choice` widget (`once`), the verdict `Panel`, "Next" / done links, and the guest
  gate `LadderGate` (Clerk sign-in, `LADDER_FREE = 2`). `useLadder().account` tells a guest from an account.
- `multiplayer/scripts/make-open-endgames.ts` is the pattern for data made on the server side and committed into
  `app/` as a generated `.data.ts`, proven again by tests.
- Front page: the `more` grid uses the ways' columns `1fr 1fr 2fr`; a third picture card in column 3 at `dims.half`
  is exactly one `1fr` wide (both are a quarter of the width less the gaps), so friends | forum | practice line up
  under the colour cards with no new token. Under `bp.cards` (two columns) it flows to the next row.
- `/skat-tricks` is a search entry in `sitemap.ts` `PAGES`; a new indexable page joins that list and `check:seo`.

## Route

1. **Data** — `multiplayer/scripts/make-bidding-practice.ts`: deal every pool deal with the app's `deal`, take each
   seat's ten cards, position (0 fore, 1 middle, 2 rear) and `maxBid`; keep pass hands (`maxBid < 18`), Null limits,
   and limits equal to exactly one suit/Grand ten-card value; shuffle with a fixed seed into one order, about one
   question in three a pass, positions mixed; write `app/src/lib/skat/bidding/practice.data.ts`
   (`{ deal, seat, hand, position, bid }`, `bid` 0 = pass). A multiplayer test re-reads the pool and holds every entry
   to its deal's seat: same cards, same position, same SkatZero answer.
2. **Logic** — `app/src/lib/skat/bidding/practice.ts` (pure): per question, the game behind the answer and its
   calculation (base, with/without n, game n+1); the options — Pass and three values, the answer among them, the
   others the hand's other suit/Grand values (nearest first, distinct); each option's calculation for the
   explanation. Unit tests.
3. **Page** — `/bidding-practice` (`routes/bidding-practice.tsx` through `client-page`, `components/skat/bidding-practice-page.tsx`):
   a sub-page on grey like an exercise — H1, a "Question n" pill, the white card with the position, the hand and the
   `Choice` ("How high do you bid?"), then the verdict panel: right/wrong, the AI's answer with its calculation, what
   each other number would have been, "Next question". Question number kept in this browser (localStorage, try/catch);
   after the last, back to the first. A guest answers questions 1 and 2; question 3 shows the sign-in gate in its
   place. Search entry: `sitemap.ts`, head with title/description, en/de messages.
4. **Front page** — the fourth colour tile becomes "Bidding practice" / "Reizen üben" (navy tile kept, lucide `Gavel`,
   its own card art) to `/bidding-practice`; the practice picture card (cover B, `public/practice-card.webp`,
   612×344) after the forum card, title "Practice" / "Üben" and one line, to `/skat-tricks`.
5. **Charter** — product.md (the front page's tile → picture card for the exercises; the bidding practice paragraph)
   and ui.md (the front page's tiles and picture cards; the page) amended per the ticket's constraint.

## Redline lookup

- ui.md 1 (token registries): none planned — `dims.half`, `homeLongColumn`, existing tile tone and icons cover it.
  If one turns out missing, stop and ask.
- engineering.md 3 (dependencies): none. 4 (route imports only via `client-page`): followed. 6 (server-only in a browser
  chunk): the data file is plain data; SkatZero stays in `multiplayer/`.
- product.md Redline 1 (editing product.md): the ticket's own constraint, from the human's request, authorizes it.
- operations.md: no production data touched.
