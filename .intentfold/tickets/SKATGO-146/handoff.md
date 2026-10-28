# SKATGO-146 handoff

## What changed

- `daily-comparison.tsx` — `GameTag`, `BidCompare`, `WorstTrick` and the review's loading/failure lines use the app
  roles: words `appText` (16), headings and numbers `appBtnStrong` (16); no `small` / `smallBold` / `micro` /
  `note` left in them. New `SeatScores`: the deal's Seeger-Fabian score of You, Lina and Noah, name over score, the
  player's cell on white.
- `game-table.tsx` — `ResultCard`: `SeatScores` under the contract line; calculation rows `appText` /
  `appBtnStrong`. The "Next deal" button is pinned at the dialog's foot (`position: sticky`); the content above it
  scrolls on a phone when taller than the screen.
- `ui.md` — the result card paragraph and the `VsAiReview` row: the app roles, `SeatScores`, the pinned button.

## AC results

1. **Sizes** — PASS: in the dialog at 375×812 no text node outside the You/AI tags computes under 16px
  (`getComputedStyle` over the dialog, empty list); title 22px; grep finds no course roles in the touched
  components.
2. **Three scores** — PASS on the free-play dialog: "You 0 · Lina 0 · Noah +96" for Noah's won Null Ouvert (46 + 50),
  own cell white (`data-own`).
3. **Rows** — same components in `VsAiTable` (shared code); not opened by script (acceptance plays no game).
4. **Languages, private table** — no new message keys; private-table branch untouched.

Mechanical defence: PASS (typecheck, build, 288 tests, bundle, tokens, literal grep, SSR link, SEO).

## Deviations

- One screen no longer holds on a phone (content 779 px for 736 px); per grill decision 1 the content scrolls and
  the button stays pinned.

## Environment

Ports: web 55146, multiplayer 56146, database 57146. No env keys changed.

## Residual

None.

## Check

1. Play a deal on the phone: text size, the three scores under the contract, the button pinned while scrolling.

## Decided for you

- Taller than a phone: content scrolls, "Next deal" pinned at the foot.
- Block headings 16 bold (`appBtnStrong`), not 14.
- Own score cell on white; You/AI tags unchanged.
