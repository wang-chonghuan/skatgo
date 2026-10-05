# SKATGO-47 plan

## What the code says that the ticket does not

- **The Astryx theme sets `<p>` and `<small>` to 400 itself** (`:where(p)`, `:where(small)` in
  `theme/parrottoon.css`, from Astryx's `--font-weight-normal`). A site-wide default on the frame only
  reaches text whose element the theme does not style. Every paragraph therefore needs a role that
  carries its own weight. A role without `fontWeight` (`body`, `say`, `note`, `context`, `small`, …)
  currently falls through to that 400.
- `appText` (27 uses) is mostly reading text. A few uses are controls: the language menu's items in
  `frame.tsx` and the rules contents links. `appBtn` is the weight of every `Btn` / `linkLook` in the
  `pill` shape and of `Pill`; it is 400.
- Baseline, measured on the built current code (`tmp/weights-before.json`; Red Hat Display text only,
  share of characters under 500):
  - home 3%;
  - course 14%;
  - lesson 79%;
  - rules 78%;
  - daily 71–73%;
  - free play 75–76%;
  - daily table 33%.

  The biggest sources are rules sections and tables, lesson intros, `game-reading`, the rules contents
  links, the table's seat names, the history lines, and the info board's small lines.
- **Card corners.** All 32 Skat cards draw their corner index as one unfilled stroked path of width 80:
  - 7–10: symbol `a`;
  - ace: symbol `b`;
  - J/Q/K: symbol `h`.

  These are exactly the paths `inked()` in `playing-card.tsx` already rewrites. Each symbol is a
  1000-unit box whose strokes reach ±460, so a width above 80 crosses the box edge (±500). A symbol
  clips to its box, so it needs `overflow="visible"` or the thickened ends are cut off.
- A stroke width is an SVG attribute here and cannot read a CSS variable. Its token belongs in
  `constants.ts`, the registry for values code reads directly.

## Route

1. `theme/type.stylex.ts`: two purpose-named weights in `weight` — `text: '500'` for reading text, and
   `ui: '600'` for controls, navigation, labels and meta. The existing `regular` … `black` stay; Bebas
   Neue roles keep `regular`, since the face has one weight.
2. `theme/type.ts`:
   - `frame` gets `fontWeight: weight.text`, the default for roleless text.
   - Reading roles get `weight.text`: `body`, `bodySmall`, `say`, `note`, `context`, `loading`,
     `appText`, `greeting`, `landingBody`.
   - UI roles get `weight.ui`: `small`, `micro`, `windowSub`, `appBtn`, `bandBack`, `landingNav`,
     `tileTitle`, `plateName`, `tricksLabel`, `auctionHead`, `infoSub`.
   - A new role `appLink` (16 px, `weight.ui`, `leading.ui`) is for links and menu items set as text.
   - Roles already at 600–900 are untouched.
3. Product code:
   - the rules contents links and the language menu's items take `appLink`;
   - any text the post-change measurement still finds under 500 gets the reading role it lacks;
   - no other component changes.
4. `theme/constants.ts`: `cardIndex = { stroke: <grill Q4> }`. In `playing-card.tsx` `inked()`, an
   inked path with `fill="none"` and a stroke takes `strokeWidth={cardIndex.stroke}`, and the inked
   symbols get `overflow="visible"`. Pips, the court figures and the card back are untouched.
5. Rebuild, then measure again with the same script. Run the AC checks, look at the cards close up,
   and check headers, buttons, the table's info board and sidebar for wrapping at 1440 and 390.
