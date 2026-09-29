# SKATGO-26 reference measurements

Measured 2026-09-29 from Funbridge's live pages with `getComputedStyle` and
`getBoundingClientRect`. Only style values are recorded here: sizes, colours, type, radii, shadows
and layout. No Funbridge code, image, logo, font file or text is copied into skatgo.

Sources:
- play.funbridge.com in the human's signed-in Chrome, viewport 1534×878;
- funbridge.com in the in-app browser at 1280×820 and 375×812.

Screenshots are reference only and live in `tmp/`, uncommitted.

## Global

| What | Value |
|---|---|
| App page background | `rgb(242,244,247)` |
| Body text | `rgb(41,50,61)`, 400 16/24 |
| Headings / strong text (navy) | `rgb(2,38,87)` |
| Secondary text (slate) | `rgb(93,109,125)`; darker slate `rgb(62,76,93)` |
| Hairline | `rgb(224,229,235)` |
| Typeface | nexa (commercial) for everything; Bebas Neue for bid labels |

## App frame (lobby)

- **Left rail**: 120 wide, white, full height.
  - Items: 105×85, padding 16/6, icon above a label, 700 14/21 in `rgb(62,76,93)`.
  - The logo mark sits at the top.
- **Top bar**: 96 tall, padding 16 24 16 16, translucent white. It holds:
  - on the left, a greeting and a sub-line (16/24, navy);
  - on the right, a row of controls, 40 tall, gap ≈16:
    - the primary action: green `rgb(0,163,54)`, white 16px, radius 32, padding 0 16;
    - stat pills: white, radius 32, navy 16px;
    - a promo pill: `rgb(255,236,238)` bg, `rgb(89,11,0)` text, radius 32;
    - round icon buttons, 44;
    - a red count badge: 24 round, 700 16.
- **Section title**: 900 20.46/24.5, uppercase, navy, ≈32 above its grid.

## Lobby tiles

- **Size**: 279×223 (single) or 573×223 (double), in a gap of ≈15. Grid left edge at x=192 (72 past
  the rail).
- **Shape**: radius 18.18, padding 27.28.
- **Colour**: a photo under a colour overlay. The shadow is the tile's own colour,
  `0 5px 16px -6px`. Tile colours:
  - green `rgb(0,130,26)`;
  - orange `rgb(229,111,0)`;
  - indigo `rgb(51,42,176)`;
  - teal `rgb(7,119,148)`.
- **Content**:
  - an outline icon at the top-left, ≈48;
  - a title at the bottom-left, 500 25/30, white;
  - an optional sub-line, 700 18.18/21.8, white.
- **Event cards** (the row below): 302×370, radius 18.18, shadow `rgba(93,109,125,.5) 0 5px 16px -6px`.
  An artwork top, and a title 500 25/30.

## Sub-page (practice list)

- **Colour band**: 160 tall, in the section's colour (orange `rgb(229,111,0)`), with a coloured shadow
  `0 8px 16px`.
  - The title is centred at the bottom: icon plus 700 30/45, white.
  - Back ("‹ 返回") and home on the top left, 16px white.
- **Option cards**: white, radius 19.6, padding 24, shadow `rgba(0,0,0,.3) 0 5px 16px -6px`.
  - Featured card: full width, 150 tall, deeper shadow `0 12px 22px -6px`, with an arrow disc on the
    right.
  - Grid cards: 620×170 in two columns.
  - Each has an orange line icon, a title 700 26.95/40.4 navy, and a description 700 19.6/23.5 slate.
  - A faint large watermark icon sits bottom-right.

## Game table

- **Felt**: radial gradient centred on the table. Green `rgb(8,84,53)` in the inner 20%, falling to
  `rgb(5,51,32)`. It fills the viewport left of the side panel.
- **Side panel**: 450 wide, `rgb(242,244,247)`, radius 12 on the left corners, shadow
  `rgba(24,30,37,.16) 0 5px 8px 2px`.
  - At the top, two tabs (game / settings): 56 square tiles, radius 12. The active one is
    mint-green, with a label under each. A hairline sits below.
  - The auction grid:
    - column heads 21.45px in `rgb(99,155,61)`;
    - columns 65×207, `rgb(37,37,37)`, radius 8;
    - bid chips inside the columns: green for pass, pale suit tints for bids.
  - The footer holds full-width buttons, 284×40, radius 12, white 16px, each with a shadow in its own
    colour at .2 (`0 4px 8px 1px`):
    - blue `rgb(9,94,207)` (claim);
    - red `rgb(229,47,29)` (leave).
- **Centre**: a square frame with a 2–3px border `rgb(237,160,16)` (gold). It is 403 during the
  auction and 306 during play.
  - Seat plates sit on its edges: dark `rgb(37,37,37)`-ish bars carrying the name in white, and a green
    direction tag `rgb(0,122,40)` (28 square, radius 6, 600 16).
  - The player's own plate is orange.
  - Trick counts sit in two corners: a label 14.2px orange `rgb(255,158,16)`, with the count below.
  - A status line in the centre ("your turn"): 11.4px, near-white.
- **Bid box**, a panel inside the frame:
  - one column per strain, each value a tile tinted by suit;
  - a wide green pass button (Bebas Neue);
  - double / redouble in red and teal.
  - Bid chips appear beside each seat as they are made.
- **Hands**:
  - own hand: a fan of large cards along the bottom edge (≈230×280 each, overlapping);
  - opponents: face-down backs, stacked along the edges.
- **Floating controls**:
  - a hint lightbulb on the left edge, a dark rounded tab;
  - undo, 60×70, `rgb(93,109,125)`, radius 12, shadow in its own colour.
- **Dialogs**:
  - white, radius ≈21.6, centred on a `rgba(0,0,0,.5)` scrim;
  - an X at the top right;
  - one full-width green button.

## Marketing landing (funbridge.com)

| What | Desktop 1280 | Phone 375 |
|---|---|---|
| Header | 100 tall, white, shadow `rgba(0,0,0,.075) 0 2px 4px`, padding 0 20 | 64 tall, burger menu |
| H1 | 900 72/86.4 navy | 900 36/43.2 |
| Lead (h2) | 700 28/33.6 slate | 700 24/28.8 |
| Section H2 | 800 36/43.2 navy | 800 24/28.8 |
| Body | 500 20/30 slate | |
| Primary button | green `rgb(0,168,120)`, radius 14, 700 20/30, padding 8 24, own-colour shadow; hero CTA 700 22, padding 16 48 | |
| Secondary button | slate `rgb(62,76,93)`, radius 14 | |
| Page gutter | 63–75 | 12 |
| Footer | `rgb(54,68,96)` | |

Hero: headline and lead on the left, a device mockup on the right, and a stats strip below. Then
alternating text/image feature sections.

## Not measured

- The signed-in app at phone width: the Chrome window could not be made narrower than the desktop
  viewport.
- The learn content pages.
