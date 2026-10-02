# SKATGO-41 handoff

## What changed

The cause: the felt's cloth (radial gradient + SVG `feTurbulence` noise) sat on the same box as
everything on the table. Each frame a card moved, the browser painted the whole felt again. The fix
only changes how things are painted. No animation value changes: `constants.ts` and every
`initial` / `animate` / `exit` / `transition` are untouched.

**Registries — `app/src/theme/`**
- `effects.stylex.ts`:
  - `layerHint.moving = 'transform'` (`defineConsts`), the layer hint for things that move over the
    felt;
  - `move.ownLayer = 'translateZ(0)'`, the layer of a card at rest in the trick.
- `scale.stylex.ts`: `layer.backdrop = '-1'`, the felt's backdrop under everything on it.

**Table — `app/src/components/skat/game-table.tsx`**
- The felt's cloth moved off `styles.felt` onto an `aria-hidden` backdrop (`data-testid="skat-felt-bg"`)
  inside the felt. The backdrop is absolutely positioned, has `zIndex: layer.backdrop` and
  `pointer-events: none`, and is a layer of its own. The felt keeps its size container and clip, and
  gains `isolation: isolate` so the backdrop stays under the felt's contents.
- Trick cards:
  - While a card flies in, its box is a `will-change: transform` layer.
  - Once its animation completes (`onAnimationComplete` / `onLayoutAnimationComplete`), the box
    gives up the hint and the card's face (a new wrapper) takes `move.ownLayer`.
  - `AnimatePresence onExitComplete` clears the landed list after each trick is collected.
- The action drawer is a layer of its own.

**Hand — `app/src/components/skat/card-row.tsx`:** in the card table's hand (`flight`), each card's
flight wrapper is a layer of its own. The hint sits on the card, not the slot: a slot changes width as
the fan closes up, and a layer that changes size is redrawn. Drills' fans are untouched.

**Why the landing swap (measured):** a card resting on the `will-change` layer it flew in on keeps
that layer's flight-time scale and looks soft: edge contrast is about 30 % lower than an unlayered
card. A `translateZ(0)` layer made at rest is drawn at final size, as sharp as an unlayered card. A
`will-change: opacity` layer, or a layer kept from the flight, stays soft.

## AC results

**Setup:** local web 55041, multiplayer 56041, PostgreSQL 57041.

**Measurement:** headless Chromium; phone 390×844, 3× pixels, touch, CPU slowed 4×. The trace runs
from the click on the learner's card until the learner's next card. Scripts are in `tmp/`:
`paint-trace.mjs`, `sharp.mjs`, `layer-probe.mjs`, `flight-probe.mjs`, `look.mjs`.

**Baseline:** base `2e8807b`, built beside the fix on 55141 (inside the web block) and interleaved
with it. Eight runs each.

**Mechanical defence:** PASS.
- app: typecheck, build, 75/75 tests, client-bundle and design-token checks, no raw styles, server
  bundle links.
- multiplayer: check 19/19 (multiplayer itself unchanged).

**AC1 — the learner's card: raster ≤ 1/3 (relaxed from 1/5 by the human), no felt repaint:** PASS

| | Raster ms, first 2.7 s (8 interleaved runs) | Median |
|---|---|---|
| Base | 102.9, 94.8, 88.6, 113.9, 57.8, 75.1, 105.6, 112.5 | 98.85 |
| Fix | 26.2, 26.8, 33.8, 22.6, 27.6, 24.9, 29.5, 13.7 | 26.5 |

- Ratio **0.27** (≤ 1/3). The ticket's reference is ≈ 120 ms.
- Felt repaints (paints of the felt-background node, grill Q2): base 28–44 per run, fix **0** in every
  run.

**AC2 — opponents' cards and trick collection:** PASS
- The same traces cover the window up to the learner's next card: both opponents' cards, the
  trick-end glow and the collection.
- Felt repaints: 0 in every fix run.

**AC3 — looks the same, sharp at rest:** PASS
- The diff changes no motion value, and `constants.ts` is unchanged. Route, duration, curve, the
  flight's scale and the trick's exit are as before.
- `sharp.mjs`, three runs on a frozen clock at trick end: each trick card and a hand card are
  captured as built, then with every layer lifted.
  - Edge strength is equal: 18.67 / 18.68, 37.40 / 37.40, 37.77 / 37.77, 21.05 / 21.07.
  - The only differing pixels lie on the card's border (corner antialiasing), 0.4–0.8 % of the
    card.
  - Hand cards: 0–0.02 %.

**AC4 — all three tables:** PASS

| Table | Base raster | Fix raster | Felt repaints (base → fix) |
|---|---|---|---|
| Free play `/en/play` | full measurement above | | |
| Lesson 11 (embedded felt) | 102 ms | 26.7 ms | 29 → 0 |
| Tournament `/en/daily/play` | 94 ms | 14 ms | 40 → 0 |

- `look.mjs` at desktop 1280×820 and phone 375×812, on all three tables:
  - the backdrop fills the felt and carries the cloth (gradient + grain);
  - fix and base screenshots of free play look the same;
  - no page errors.

**Left to the human (grill Q5):** how it feels on a real phone (iPhone Safari / Android Chrome), after
handoff or deploy. Not recorded as passed.

## Deviations

- **AC1 threshold 1/5 → 1/3, decided by the human on 2026-10-02 (「保清晰，放宽 AC1」).** AC1 and AC3
  conflicted. The live ticket is updated, a ticket comment explains it, and `ac.md` / `grill.md`
  record it.
  - Keeping trick cards on their flight layers gave a median of 13.75 ms (0.14) but soft cards.
  - Drawing each card once more on landing costs the difference.
- **Plan changes:**
  - Hand: the plan had the hint on the slot; it moved to the card (the slot's width change redraws
    its layer; measured 18–25 → 11–19 ms).
  - Trick: the landing swap was added (plan step 4 / grill Q3).
  - Translate-only was not used.
- **Measurement:**
  - Raster is compared by medians of interleaved runs. Single runs vary by about ±30 % with the deal
    and the machine.
  - One trace covers the learner's card through to their next card, rather than two separate traces.
    The window start shifts with the server round trip, so `feltRepaintsAfterFlight` is not
    meaningful; zero felt repaints over the whole window covers AC1 and AC2.

## Environment

- **Ports:** web 55041, multiplayer 56041, PostgreSQL 57041. The base build on 55141 was used for
  measuring only, then stopped and removed.
- **Env keys:** none added, changed or removed. The worktree's own `app/.env` `MULTIPLAYER_URL` and
  `multiplayer/.env` `DATABASE_URL` point at the ticket ports; these are local only, not synced.
- No dependency, schema or production change.

## Residual

- **Charter drift, not edited (ui.md is human-owned):**
  - ui.md's registry table lists `effects.stylex.ts` as exporting `shadow, texture, move, timing`. It
    already differs from the code (shadows and fills live in `elevation.stylex.ts`), and now also
    lacks `layerHint`.
  - ui.md's `layer` row does not mention `backdrop`.
  - A line under Motion could record "things moving over the felt are layers of their own; the cloth
    is a backdrop layer".
- **Remaining raster is the card faces themselves** (complex SVGs at 3×): a card landing, the trick-end
  glow, the hand dimming when it is not the learner's turn. On a phone's GPU raster these cost far
  less than in this CPU-raster measurement.
- **The learner's card squeezes during its flight.** Motion measures the hand's narrow, overlapping
  slot, so the scale starts at about (0.84, 1.16). This is existing SKATGO-34 behaviour, left
  unchanged by the constraint. A future ticket could fly the card from its full face instead.
