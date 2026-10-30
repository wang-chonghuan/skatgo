# SKATGO-162 handoff

## What changed

- `app/src/theme/scale.stylex.ts`: a new spacing step `x36` (36px). The human named the value (「72和36吧」), which is the approval ui.md Redline 1 asks for.
- The page column's bottom padding is now `{ default: space.x72, [bp.phone]: space.x36 }`, on the five pages that ended in 72px at every width:
  - `entry-page.tsx` (front page)
  - `bidding-practice-page.tsx`
  - `course-home.tsx`
  - `tricks-page.tsx`
  - `tricks-exercise-page.tsx`
- `ui.md`: the spacing line records `x36` and the 72/36px column bottom.

## AC results

Measured from the bottom of the column's last block to the footer's top border, headed Chromium, built server on 55162 (`tmp/ac.txt`):

1. **375×812 (phone) — pass.** 36px on `/en`, `/en/bidding-practice`, `/en/course`, `/en/skat-tricks`, `/en/skat-tricks/sieg-sichern-1`.
2. **1280×820 — pass.** 72px on the same five pages.

Mechanical defence passed: typecheck, build, 317 tests, client bundle, design tokens, grep 0, SSR link, check:seo, test:seo.

## Deviations

None.

## Environment

- **Port:** web 55162.
- **Env keys:** no change.

## Residual

None.

## Check

1. The bottom of the front page and the bidding practice on a phone.

## Decided for you

- **Which pages:** the three siblings with the same 72px rule (the course map, the Skat-Tricks list and an exercise) change too, so they don't keep the same gap.
- **Breakpoint:** the phone value applies at `bp.phone`, the same breakpoint as these pages' top padding.
- **No fresh-eyes review:** the values are the human's own, so a reviewer had nothing to judge beyond them.
