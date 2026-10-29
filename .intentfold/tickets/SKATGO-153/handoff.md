# SKATGO-153 handoff

## What changed

- **`daily-comparison.tsx`**: `TrickReplay` restored from `d7d924f^` line for line (one variable renamed), with its styles.
  A new `PlayRecord` card holds it.
  - The card is a `<details>`, closed at first: a `hairline` box with "Every trick vs. the AI" / "Jeder Stich im Vergleich zur KI" and a chevron.
  - It sits last in `VsAiReview`, under the trick of the biggest difference, and only for a deal that was played.
  - Every after-deal review shows it: daily dialog, deal of the day, free play, lesson 11, and the rows on /daily.
- **Messages**: the five removed `daily_replay_*` keys are back (en/de as they were), plus the new `review_play_record`.
- **Charter**: product.md (the after-deal paragraph, and why no hint comes back) and ui.md (the `VsAiReview` row).
- **No hint was added**: the human dropped the bidding suggestion, because free play feeds the record of play.

## AC results

Acceptance plays no game (the human's standing rule), so no finished deal was reached by script.

1. **PASS by code.**
   - `diff` of the restored `TrickReplay` against `d7d924f^`: identical except a renamed arrow parameter.
   - The review still carries `tricks`, `skat`, `early`, `hand` and `differs`, the same type the old play record read.
   - `PlayRecord` sits in `VsAiReview`, the one review every after-deal place renders.
   - Opening it after a deal is the human's look on the preview.
2. **PASS.** On `/en/play`, `/de/play` and `/en/daily`, at 1280×820 and 375×812, there are no hint controls (the `hints` switch is untouched) and no page errors.
3. **PASS.** The en/de messages compile (typecheck). The pages load with no sideways scroll at both sizes.

Mechanical defence passed: typecheck, build, 303 tests, bundle, tokens, literal grep, SSR link, `check:seo --built` and `test:seo`. Multiplayer is unchanged.

The fresh-eyes look was not run: there is no screenshot of the opened card without playing a deal.

## Deviations

- The bidding suggestion was dropped by the human's decision before any code. The ticket was amended.

## Environment

- Ports: web 55153, multiplayer 56153, database 57153.
- No env keys changed.

## Residual

None.

## Check

1. After a deal, at the bottom: the folded card "Every trick vs. the AI". Open it and compare with what Konanekane missed:
   - every trick, each card under its player's name;
   - the AI's card under yours where it differs;
   - the worst trick on pink;
   - tap a trick to see your hand before it;
   - the skat under the table.

## Decided for you

- The card appears under every after-deal review, including the rows on /daily.
- Only the play record comes back; the one-line "best move" summary that once sat above it is not restored, because the trick of the biggest difference shows it.
- The card is titled "Every trick vs. the AI" ("Jeder Stich im Vergleich zur KI").
