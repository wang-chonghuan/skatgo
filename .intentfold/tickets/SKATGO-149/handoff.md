# SKATGO-149 handoff

## What changed

- **Bidding practice** at `/bidding-practice` (en/de), a search entry.
  - `app/src/lib/skat/bidding/practice.ts`: values each game from ten cards, names the game behind an answer, offers Pass and three numbers.
  - `practice.data.ts`: 300 questions (100 passes) in one fixed order. They are generated from free play's pool by `multiplayer/scripts/make-bidding-practice.ts` (SkatZero's `maxBid` per seat). Only hands one game explains are used: 1,428 passes, 1,006 bids and Nulls qualify.
  - `multiplayer/test/bidding-practice.test.ts` holds every question to the pool again: same cards, same position, same answer.
  - Page: `components/skat/bidding-practice-page.tsx` and `routes/bidding-practice.tsx`.
    - Question number, the seat, the hand as big as at the table, four choice tiles.
    - Verdict panel: the AI's answer with the trumps and the calculation, or for a pass the best trump suit and its trumps. One line per other number. "Next question".
    - Guest gate from question 3. How far this browser has got is kept in localStorage.
    - Under the card: links to the bidding table and the rules, then one small line for the search entry.
- **Front page** (`entry-page.tsx`):
  - The fourth colour tile is "Bidding practice" / "Reizen üben" (navy, lucide `Gavel`).
  - "Practice" / "Üben" is a picture card with cover B (`public/practice-card.webp`, 612×344) after the forum card. On PC it is as wide as a colour card (third column at `dims.half`).
- **Messages**: `home_bidding`, `home_practice_text`, `bidpractice_*` (en/de).
- **Wiring**: `client-page.tsx` registry, `sitemap.ts` page list, `routeTree.gen.ts` (generated).
- **Charter**, per the ticket's constraint:
  - product.md: the exercises' way in; the bidding practice paragraph; the product list.
  - ui.md: colour tiles, front page, the page.
  - engineering.md: module row.

## AC results

Run against web 55149 and multiplayer 56149, built. Script: `tmp/ac.mjs`; signed-in case: `tmp/account.mjs`.

1. **PASS.** The fourth tile reads "Bidding practice" on `/en` and "Reizen üben" on `/de`. Each leads to `/{lang}/bidding-practice` with that H1.
2. **PASS.** In `entry-more` the cards run friends, forum, tricks. `/practice-card.webp` loads (612px). Clicking lands on `/en/skat-tricks`.
3. **PASS.** Each question shows 10 cards, "You sit in …", and the options [Pass, numbers]. A wrong answer shows "Not quite." and, for example, "The AI bids up to 18: Diamonds ♦ with your 6 trumps, without 1, game 2 × 9 = 18." Nothing else is asked.
4. **PASS.** `npm --prefix multiplayer run check`: 33/33 tests, including the bidding-practice test of all 300 questions against the pool.
5. **PASS.** A fresh guest answers questions 1 and 2. Question 3 shows the sign-in gate with no options, at 1280×820 and 375×812. A local test account at question 3 gets the question with no gate.
6. **PASS.** At 1280×820 and 375×812: the picture cards' boxes do not intersect, the cards and options sit inside the card, and nothing scrolls sideways beyond the viewport. The emulated phone's existing 1px header rounding (376 vs 375) shows on every page and is not this ticket's.

Mechanical defence passed:
- typecheck, build, 300 app tests, client bundle, design tokens, literal grep, SSR link.
- `check:seo --built`: 52 indexable pages. `test:seo` passed.

## Deviations

- The plan said the hand would be shown as the exercises' `CardRowView`. It uses the ladder's `Fan` (`lg`, `row`) instead, as big as at the table, after the fresh-eyes look (SKATGO-109 「最好和手牌一样大」).
- The explanation names the trumps the hand holds, added after the fresh-eyes look, so that it shows the thinking and not only the sum.
- The first question is rendered on the server. A small line at the page's foot says what the page is. The SEO check requires both for a search entry; the line sits at the foot, not under the title.

## Environment

- Ports: web 55149, multiplayer 56149, database 57149.
- No env keys added, changed or removed.

## Residual

None.

## Check

1. The bidding practice's explanation (the review's main doubt): it names the game, its trumps and the calculation, but cannot say *why* SkatZero chose that game beyond these facts. SkatZero gives only a limit, no reasons.
2. The small line at the page's foot: it exists for the search entry. Delete it and the page needs another way to carry 200 characters of content.
3. The phone front page: Practice stands alone on the left of its row (three picture cards in two columns).
4. The "Bidding practice" tile: the title wraps to two lines; the icon is a gavel.

## Decided for you

- Questions are hands one game explains (a pass, a Null, or exactly one game's ten-card value): 300 in one order, a third passes, then back to the first.
- Options: Pass and three numbers, the others being what the hand's most-trump games are worth.
- The answer is called "the AI", never SkatZero.
- Nothing is recorded on the server; the question number is kept in this browser.
- Address `/bidding-practice` in both languages, indexable.
- The three `reizen` exercises in Skat-Tricks are kept.
