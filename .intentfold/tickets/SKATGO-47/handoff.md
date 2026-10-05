# SKATGO-47 handoff

## What changed

Reading text is now 500 across the site, and controls, links, labels and meta are 600. Titles,
emphasis and other 700–900 text are unchanged. Every card's corner index is drawn 40% bolder. Each
of these comes from one token in `app/src/theme/`.

- `theme/type.stylex.ts`: `weight.text = 500` (reading text) and `weight.ui = 600` (controls, links,
  labels, meta), added beside the existing `regular` … `black`.
- `theme/type.ts`:
  - `frame` defaults to `weight.text`.
  - Reading roles take `weight.text`: `body`, `bodySmall`, `say`, `note`, `context`, `loading`,
    `appText`, `greeting`, `landingBody`.
  - UI roles take `weight.ui`: `small`, `micro`, `windowSub`, `appBtn`, `bandBack`, `landingNav`,
    `tileTitle`, `plateName`, `tricksLabel`, `auctionHead`, `infoSub`.
  - New role `appLink` (16 px, `weight.ui`, family inherited) for links and menu items set as text.
  - A header comment records why every role states its weight: the Astryx theme sets `<p>` and
    `<small>` to 400 itself.
  - Bebas Neue roles keep `regular`.
- `components/skat/rules-page.tsx` (contents links) and `frame.tsx` (language menu items):
  `appText` → `appLink`.
- `theme/constants.ts`: `cardIndex = { stroke: 112 }`.
- `components/skat/playing-card.tsx`, in the existing `inked()` rewrite:
  - the inked symbol's one unfilled stroked path, which is the corner index, takes
    `strokeWidth={cardIndex.stroke}`;
  - inked symbols get `overflow="visible"`, so the thicker strokes' ends are not clipped at the symbol
    box.

  Pips, court figures and the card back are untouched.

Approvals for the registry changes (ui.md Redline 1): the human approved `weight.text`/`weight.ui`,
the role changes, `appLink` and `cardIndex.stroke = 112` on 2026-10-05, relayed through the pm session
and recorded in the ticket comment and `grill.md`.

## AC results

Built server on 55047, `main` (`d36eb0d`) built on 55147 for the comparisons, multiplayer on 56047,
local database on 57047.

1. **Weights** — pass.
   - Script and data: `tmp/weights.mjs` → `weights-before.json` (main) and `weights-after.json`;
     `tmp/ac1.py`, 1015 texts over 7 pages × 2 sizes (1440, 390), 0 failures.
   - Pages: home, course, a lesson, rules, daily, free play, the daily table.
   - Every visible Red Hat Display text is ≥ 500.
   - Every text inside a control (`a`, `button`, `select`, `label`, tab, menu item) is ≥ 600, and so is
     every text of the header, the table's names, the info board's lines, the history lines and any
     12–13 px text.
   - Nothing that was 700–900 on main is lighter.
   - Characters under 500, main → change:

     | Page | main | change |
     |---|---|---|
     | home | 3% | 0% |
     | course | 14% | 0% |
     | lesson | 79% | 0% |
     | rules | 78% | 0% |
     | daily | 71–73% | 0% |
     | free play | 75–76% | 0% |
     | daily table | 33% | 0% |

   - The text left at exactly 500 is all reading text: paragraphs, leads, FAQ answers, rules body and
     tables, lesson intros, the table's running line, the board's empty line, the front page's
     "Free / No sign-up" points.
2. **Card corners** — pass.
   - `tmp/card-index.test.tsx`, run through `tmp/vitest.cards.config.mts` with StyleX stubbed, renders
     all 32 cards through the product's `PlayingCard`:
     - each has exactly one index path, at width 112 (≥ 107 = 80 × 4⁄3);
     - both inked symbols are `overflow="visible"`;
     - no other path carries 112 (courts keep their 3/6 strokes);
     - rows are in `tmp/card-index.txt`.
   - The check fails when the token is set back to 80 (`expected 80 to be greater than or equal to
     106.67`).
   - Close-ups (`tmp/cards-zoom.png`, and `cards-{before,after}-{110,56}.png`): 7, 10, A, J, Q, K in
     clubs and hearts are visibly thicker. "10" keeps its gap, no stroke end is clipped, and pips and
     figures are unchanged.
3. **Tokens** — pass.
   - `weight.text` was temporarily set to 900, rebuilt and measured on `/en/rules` (`tmp/ac3.mjs`,
     `tmp/ac3-900.txt`):
     - the 48 section paragraphs and both lead paragraphs computed 900;
     - contents links (600) and headings (700) were unchanged;
     - 4 paragraphs with their own bold role stayed 700.

     The token was then restored to 500.
   - The design-token check (98 files) and the literal grep pass.
4. **No overflow** — pass, 84/84 (`tmp/ac4.mjs`, `tmp/ac4-results.txt`, headed, 1440 / 1280 / 390 /
   375, change beside main):
   - no horizontal scroll;
   - no link or button wraps onto more lines than on main;
   - no new element clips its text.

   The first run reported 5 failures, all from the check:
   - the table panel's "Course" icon link and the reading section's "Course" link shared a key;
   - the felt's overflow at 1280 (975 > 922) exists on main too, and was keyed by the deal's text,
     which differs between runs.

   Controls are now keyed with an occurrence number, and clipping by element and test id. One rerun
   stopped on a timeout while the local service was dealing tomorrow's day; the next run passed.
   Screenshots `tmp/w-{before,after}-*.png` were looked at.

Mechanical defence (engineering.md Tools) passed once:
- typecheck, build, 83 unit tests;
- client-bundle check, design-token check, literal grep, SSR link;
- `check:seo -- --built` (36 indexable pages) and `test:seo` (25 pass).

## Deviations

- `appLink` restates the family (`'inherit'`) because the language menu items are native buttons.
- The card-face check renders through vitest with StyleX stubbed (StyleX compiles at build time), not
  through the running page, so that all 32 faces are covered deterministically. The close-ups use
  that same rendering from main and from this branch.

## Environment

- Ports: web 55047, multiplayer 56047, database 57047. The comparison build ran on 55147 from a
  detached worktree, since removed.
- Env keys: none added, changed or removed. The worktree's `app/.env` `MULTIPLAYER_URL` and
  `multiplayer/.env` `DATABASE_URL` point at the ticket ports, locally only.

## Residual

- Grey secondary text colour (grill Q5): not changed here. The pm session proposes a follow-up ticket.
- `ui.md`'s typography section is still the pre-lobby description. It names roles such as `hero` and
  weights "`regular`, `semibold`, `bold` — only weights the page actually loads". It does not mention
  `weight.text` / `weight.ui`, `appLink` or `cardIndex`. Reported, not edited.
