# SKATGO-34 handoff

Preview: http://localhost:55034/en/play (built server).

## What changed
- The learner's card flies from its own place in the hand to the trick: the hand and the trick share a
  motion `layoutId` (`Fan` `flight` prop, `flightId`). It is opaque the whole way and shrinks into place.
- Opponents' cards fly in from their side (±170px), opaque, with no fade.
- `trick.flight` in `theme/constants.ts`: a 0.3s ease-out tween with no spring.
- Bot delay (850ms) and trick pause (1300ms) are unchanged.

## Acceptance (`tmp/perf.mjs`, `tmp/opp.mjs`; phone 390×844; perf under 4× CPU slowdown)
- AC1 ✓ the first frame is at the hand (10,703) at opacity 1, and the card moves monotonically to the trick (164,427).
- AC2 ✓ it settles at 231–240ms with no overshoot. Before the change on production, the card vanished, a
  transparent copy faded in about 170px away, and the copy sprang past its place.
- AC3 ✓ HJ starts 165px left of its place and CJ starts 175px right, both at opacity 1.

## Mechanical defence
typecheck, build, 75 unit tests, client bundle, design tokens, no raw styles, SSR import: all pass.
