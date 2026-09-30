# SKATGO-30 handoff — the four-suit icon everywhere

## What changed

- `app/brand/skatgo-logo.png`: the master is now the human's `5.png` (1254², the club in the middle
  as the table; diamond, spade and heart as the three players).
- Regenerated from it by `.intentfold/tickets/SKATGO-30/icons.mjs` (SKATGO-23's cutter, no dependency),
  each cropped to the drawn area and padded per use (grill Q1):

  | File | Use | Mark fills |
  |---|---|---|
  | `favicon.ico` (16/32/48), `favicon-32.png` | browser tab | 94% |
  | `logo-96.png` | header and rail mark, shown at 40px | 88% |
  | `icon-192.png`, `icon-512.png` | installed app (rounded) | 80% |
  | `apple-touch-icon.png` | iOS home screen (iOS rounds it) | 76% |
  | `icon-maskable-512.png` | Android adaptive icon | 58%, all inside the safe circle |

- No code change: every file keeps its name and size.

## AC results

- **AC1 — PASS.** On the built server (55030), all seven files answer 200 and are byte-identical to the
  regenerated files, and every one differs from `main`'s. Screenshots: the new mark in the front
  page's header and in the course page's rail.
- **AC2 — PASS.** The drawn area touches no edge in any file, and its centre is within 1.6% of the
  image's centre. It fills 94 / 88 / 76 / 80% as planned. At 32px magnified ×4 the four colours stay
  distinct (`tmp/sheet.png`).
- **AC3 — PASS.** No drawn pixel of the maskable icon lies outside the centred 40%-radius circle.
- **Mechanical defence — PASS** (typecheck, build, 65 tests, bundle, tokens, literal grep, SSR link).

## Deviations

None from `plan.md`.

## Environment

- Web on 55030 (built server), left running for review. No env key changed.

## Residual

- SKATGO-29's share images draw `logo-96.png`. Whichever of the two lands second regenerates them with
  `.intentfold/tickets/SKATGO-29/og.mjs`, so they carry the new mark.
- `charter/ui.md` / `engineering.md` still name SKATGO-23's `icons.mjs` as the cutter. It now lives in
  SKATGO-30's folder — human-owned wording.
