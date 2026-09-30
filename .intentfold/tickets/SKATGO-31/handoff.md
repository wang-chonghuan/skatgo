# SKATGO-31 handoff — a larger brand in the front page header

## What changed

- `frame.tsx` `LandingHeader`: the mark uses the new style `landingMark`, and the name uses the new
  role `typography.landingBrand`. The rail keeps `brandMark` (40px).
- Tokens (additions only):
  - `dims.landingMark` 56px and `dims.landingMarkPhone` 44px;
  - `typography.landingBrand` 28px (24px on a phone), bold, at 1.2.

## AC results (built server, 55031)

- **AC1 — PASS.** At 1280 the mark is 56px and the name 28px. Both are centred in the 100px header,
  to 0px off centre. Screenshot taken.
- **AC2 — PASS.** At 375 the mark is 44px and the name 24px. The language, settings and menu buttons
  end at 255, 299 and 355px, all inside the 375px viewport, with `scrollWidth` 375. Screenshot taken.
- **Mechanical defence — PASS.**

## Deviations

None.

## Environment

Web on 55031, left running for review. No env key changed.

## Residual

None.
