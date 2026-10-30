# SKATGO-162 plan

## Found in the code
- The five pages' columns end in `paddingBottom: space.x72` at every width (since SKATGO-26); their top padding
  and gaps already shrink on a phone, the bottom does not. The footer adds its own 20px above its links.
- `scale.stylex.ts` has no 36px step: adding `x36` changes a governed registry (ui.md Redline 1); the human named
  the value (「72和36吧」), which is the approval — recorded here and in the ticket.

## Route
1. `theme/scale.stylex.ts`: add `x36: '36px'`.
2. `entry-page.tsx`, `bidding-practice-page.tsx`, `course-home.tsx`, `tricks-page.tsx`, `tricks-exercise-page.tsx`:
   `paddingBottom: { default: space.x72, [bp.phone]: space.x36 }`.
3. `ui.md`: note the bottom spacing (72px, 36px on a phone).
