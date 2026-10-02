# SKATGO-41 plan

## What the code already says that the ticket does not

- **The felt is expensive to paint.**
  - The felt's background (`fill.felt`, `theme/elevation.stylex.ts`) is a radial gradient under an SVG
    `feTurbulence` noise tile.
  - It sits on `styles.felt` (`game-table.tsx`), the same box that holds everything on the table.
  - So whenever something on the table needs paint, the noise and gradient are rasterized again over
    the felt's area.
- **The moving things, and how they move (all `motion`):**
  - Hand slots (`card-row.tsx` `Fan`, `row` + `flight`): each slot is a `motion.div` with `layout`, so
    when a card leaves the hand the rest close up by transform. They are also dealt in
    (`initial` y + opacity).
  - The flying card: the hand's inner `motion.div` and the trick's `motion.div` share a `layoutId`
    (`flightId`). The trick card is the element that animates: transform from the hand slot's box,
    including a **scale** from the hand card's size to the trick card's size, over `trick.flight`.
  - Opponents' cards: the trick `motion.div` enters from `trick.from[seat]` at `trick.fromScale`.
  - Trick collection: `exit` to opacity 0 at `trick.exitScale`.
  - The action drawer rises (`drawer`).
  - The hint tab and the side panel transition by CSS.
  - None of these carries `will-change`, and motion does not add it.
- **Server tables play the same component.** Free play and lesson 11 use `ServerTable` → `GameTable`
  (SKATGO-40); the tournament uses `DailyTable` → `GameTable`. One change covers all three.
- **The look is already measured in the stage's unit** (`theme/table.stylex.ts`). Nothing about sizes
  or routes needs to change.
- **Reproduced locally** with the ticket's method (`tmp/paint-trace.mjs`):
  - Setup: headless Chromium, 390×844, 3× pixels, CPU slowed 4×, 2.7 s from the click on `/en/play`
    at 55041.
  - Raster: 298–333 tasks, 98–155 ms in total.
  - Paints: 72–88 paints covering most of the screen.
  - In headed Chromium the GPU rasterizes, so raster ms there is not comparable. Headless is the
    measuring browser.
- **Scale and sharpness.** Chrome keeps a `will-change: transform` layer's raster scale while its
  transform scale changes. A card first rastered at a smaller scale could therefore stay soft once it
  stops. This is what the "not blurry" criterion is about. It has to be looked at, not assumed.

## Route

1. **Layer hint in the registry.** Add a `defineConsts` entry in `theme/effects.stylex.ts` (next to
   `move` and `timing`): `layerHint.moving = 'transform'`. Product code names it; no literal in
   components.
2. **Give the moving things their own layers:**
   - the hand slot (`styles.slot` when `flight`, i.e. only the card table's hand; drills untouched);
   - the trick card (`styles.trickCard`);
   - the action drawer.
3. **Give the felt's background its own layer.** Move `fill.felt` from `styles.felt` onto an
   absolutely positioned, `aria-hidden` backdrop inside the felt, with the layer hint. The felt keeps
   its size container and clipping. Cards moving over it then never invalidate the noise.
4. **Measure, then decide scale** (grill Q3).
   - Same trace after the change.
   - Then a screenshot of each card at rest after its flight, compared at 3× against the same card
     before the change.
   - If a card stops soft, end its hint once its animation completes (motion's
     `onAnimationComplete`), so Chrome rasters it once at its final scale. Route and timing stay
     unchanged.
   - Translate-only is the fallback, and only with the human's agreement.
5. **Check the three tables.** Free play (`/en/play`, full screen), lesson 11 (embedded) and the
   tournament (`/en/daily/play`, local multiplayer and DB at 56041/57041).

Files: `app/src/theme/effects.stylex.ts`, `app/src/components/skat/card-row.tsx`,
`app/src/components/skat/game-table.tsx`. Nothing else is expected.

## Redline lookup

| Action | Entry | Result |
|---|---|---|
| Design value in a component | ui.md registries / `check-design-tokens.mjs` | the hint value lives in `effects.stylex.ts` |
| New dependency | engineering.md R3 | none |
| Production data / schema / env | operations.md R5 | none |
| Animation route, duration, curve | ticket constraint | unchanged (`constants.ts` not touched) |

## Grill outcome

Settled 2026-10-02 (`grill.md`, self-adjudicated by pm under the human's authorization).
- Q1, Q3, Q4 and Q6 as recommended. Translate-only stays excluded without the human. CSS transform
  transitions need nothing.
- Q2: a felt repaint is a paint of the felt-background element, found in the trace by its node, not a
  large clip. The backdrop carries `data-testid="skat-felt-bg"` so the trace can find it.
- Q5: the real-phone look is the human's.
