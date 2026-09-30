# SKATGO-33 handoff — a sharp hero picture

## What changed

- `app/public/hero-table.webp`: the human's illustration `6.png` (1448×1086; WebP quality 88, 152 KB),
  replacing the 434×602 screenshot.
- `dims.heroArtRatio`: `1448 / 1086`. The box keeps the picture's proportions at every width, so it is
  shown whole.
- `entry_art_alt`: describes the illustration ("Three friends playing Skat around a table shaped like a
  club" / "Drei Freunde spielen Skat an einem Tisch in Kreuzform").
- The share images (`app/public/og/`, 32) are regenerated. `og.mjs` now fits the picture to the column's
  width, so a landscape picture no longer runs off the image's edge.

## AC results (built server, 55033)

- **AC1 — PASS.** Natural width 1448. It is shown at 353px on desktop (4.1×) and 351px on a phone
  (4.1×).
- **AC2 — PASS.** The box is 353×265 at 1280 and 351×263 at 375: 1.333, the picture's own ratio. It is
  shown whole with `contain`, and there is no horizontal scroll at 375.
- **Mechanical defence — PASS** (75 tests).

## Deviations

The planned 3× table capture was dropped on the human's choice of their own illustration.

## Environment

Web on 55033, left running for review. No env key changed.

## Residual

At a third of the hero's width, a landscape picture is shown fairly small on desktop (353×265). Widening
the picture's column (for example to half) is a one-token change if wanted.
