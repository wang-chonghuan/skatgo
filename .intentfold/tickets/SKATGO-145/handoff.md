# SKATGO-145 handoff

## What changed

The screen after a deal against the AI is rebuilt from zero: result card, bidding, the one trick of the biggest
difference, the way on. Nothing else.

- **`app/src/lib/skat/i18n.ts`** — `settlementRows`: the calculation a step a row (base value, multiplier, game
  value or Null's fixed value, overbid, the outcome, the player's Seeger-Fabian score; a defender's +40 or 0).
  `settlementFormula` stays for the private table.
- **`app/src/components/skat/daily-comparison.tsx`** — `VsAiReview` (fetches the review once) with `BidCompare`
  (the player's and the AI's bidding in three shared columns; one row with both tags when the two read the same)
  and `WorstTrick` ("Biggest difference from the AI": trick n and the AI's card, the cards on the table and the
  hand before the trick as `xs` cards 8px apart, the player's card ringed navy + "You", the AI's ringed blue +
  "AI", who took it). `GameTag`: the contract in its tint and "Declarer: name". `ScoreSheet` per deal,
  `TrickReplay`, `DealAnalysis`, `FreeVsAi`, `DealVsAi`, the skat and the exercises link are gone; `VsAiTable`
  rows open to `VsAiReview` (a `review` prop instead of `analysis`), the /daily total sheet is unchanged.
- **`game-table.tsx`** — daily, free play, lesson 11 and the passed-in dialog: `ResultCard` (`Panel` good/bad,
  title + score, `GameTag`, the rows) → `VsAiReview` → button. The "after n of 6" line, the early-claim line and
  the skat are no longer in them. The private table's branch is untouched.
- **`server-table.tsx`** — the free round keeps each deal's review with the round, so its summary rows open to it.
- **`daily-table.tsx`, `deal-of-day.tsx`** — pass the new `review` prop.
- **Messages** — 19 new keys en/de, 13 removed (`daily_after*`, `daily_replay*`, `daily_review_card/marks`,
  `tricks_more_link`, `free_ai_*`).
- **`formula.test.ts`** — five `settlementRows` cases.
- **Charter** (as the ticket asked) — `product.md` after-deal and free-play paragraphs, the articles' "play record
  links to the exercises" line; `ui.md` colour roles, the `ScoreSheet` / `VsAiTable` / `VsAiReview` rows, the result
  card's calculation, the rules panel line; `engineering.md` and `operations.md` review wording.

## AC results

1. **Content and order** — PASS by reading the three branches and by the human's own look at six rounds of phone
   screenshots of the free-play dialog with real SkatZero reviews; grep: no `daily-replay`, `daily-deal-scores`,
   `tricks-more-link`, `daily-after` left in `app/src`.
2. **Calculation rows** — PASS: `formula.test.ts` 11/11 (won, lost, defender of a lost and a won game, Null Hand,
   overbid); pink card on a loss seen on the screenshots, green on a win by `Panel tone="good"` (not screenshotted:
   no won deal came up).
3. **Bidding** — PASS on the dialog (two rows, scores, card points, Schneider); the merge rule settled in the grill
   and AC3 amended on the ticket.
4. **The trick** — PASS on the dialog: trick 1, two cards on the table, ten in hand, one You and one AI mark,
   "Noah took it · 24 points".
5. **/daily rows, deal-of-the-day details, free-round rows** — same `VsAiReview` component; **not checked by
   script**: the owner's days copied from production carry no moves (demo-me strips them), so they cannot be
   reviewed locally, and acceptance plays no game. Left to the human's local play (see Check).
6. **One phone screen** — PASS: at 375×812 the dialog's `scrollHeight` = `clientHeight` (719/719) on the longest
   case, trick 1 with ten cards in hand.
7. **Languages, private table** — de keys present for every new message; private-table branch unchanged in the
   diff. German dialog not screenshotted.

Mechanical defence (`engineering.md`): PASS — typecheck, build, 288 tests, client bundle, design tokens, literal
grep, SSR link, `check:seo --built`, `test:seo`.

The fresh-context "look as the human will" review was not run: the human looked at every change directly, six
rounds, and each of their asks is in `grill.md`.

## Deviations

- AC3 merge rule narrowed to "completely the same" (grill Q2, approved).
- The trick's labels sit at the left of the cards (not above) to keep one phone screen.
- The contract/declarer tag sits in the result card (the human's ask), so /daily rows, which have no result card,
  show it only through the bidding lines.

## Environment

Ports: web 55145, multiplayer 56145, database 57145. No env keys added, changed or removed.

## Residual

- `demo-me.sh` copies production days without their moves, so copied days cannot be reviewed locally, and a local
  multiplayer started before it prepares its own deals for today; worth fixing in the script (not in this repo's
  tracked code).

## Check

1. Play a deal of the day or a free deal on the local link, win one: the card is light green.
2. After the deal of the day, open "How the AI played this deal" on /daily: bidding and the trick, no score sheet.
3. Switch to German once.

## Decided for you

- Loss card pink, win green (approved). Merge only when both rows read the same (approved).
- Early-claim line, three-seat sheet, skat, exercises link, lesson 11's record note dropped ("其他不显示").
- Result title keeps "Your side won!" / "This game is lost"; score at its right.
- Last calculation row is the player's own score, a defender's +40 or 0.
- Free round keeps reviews in the browser with the round; an old stored round's rows don't open.
- Type on the dialog: 22 title, 14 bold headings, 13 lines, 12 quiet lines; one rule, between bidding and trick.
