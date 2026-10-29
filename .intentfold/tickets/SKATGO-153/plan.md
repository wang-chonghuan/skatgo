# SKATGO-153 plan

## What the code already says

- The review (`DealReview`) still carries what SKATGO-145's removed play record read: `tricks`, `skat`, `early`, `hand`
  and every differing play in `differs`; only the component was removed. No new computation, no server change.
- `VsAiReview` (daily-comparison.tsx) is the one after-deal review: the daily dialog, the deal of the day, free play,
  lesson 11 and the rows of the tournament's table on /daily all render it.
- Free play's hints stay off (the human: 「同意，去掉叫牌建议，只做逐墩对比」).

## Route

1. Restore `TrickReplay` from `d7d924f^` unchanged, with its styles and its five `daily_replay_*` messages (en/de).
2. `PlayRecord`: a `<details>` card, closed at first, "Every trick vs. the AI" / "Jeder Stich im Vergleich zur KI" and a
   chevron; opened, `TrickReplay` with the review's data. Last in `VsAiReview`, only for a deal that was played.
3. Charter: product.md (the after-deal paragraph), ui.md (`VsAiReview` row).

## Redline lookup

ui.md 1: no new tokens. engineering.md 3: no dependency. No server or data change.
