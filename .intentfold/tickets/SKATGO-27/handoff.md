# SKATGO-27 handoff

## What changed

Card colours in three schemes, chosen in a settings dialog. Only colours change (the human:
「只改颜色，不要改其他东西，避免扩大化」).

- **Registry.** New `app/src/theme/suits.stylex.ts` defines `suit` with the German Skat colours as the
  default (♣ `#000000`, ♥ `#E02424`, ♠ `#059669`, ♦ `#D97706`), plus two themes: `fourColours`
  (♠ black, ♥ `#FF0000`, ♣ `#00A859`, ♦ `#0071E3`) and `twoColours` (the deck as printed). Each scheme
  carries two sets:
  - card colours, exact on a white face;
  - text colours, where a suit that is black in the scheme takes the text's own colour
    (`currentColor`), so it stays legible on the dark felt and the info board.
- **The preference.** New `app/src/lib/skat/settings.ts` is a zustand store persisted in this browser
  under its own key, `skatgo.settings.v1`, defaulting to `german`. It is separate from the progress.
- **Applying it** (`skat-layout.tsx`). The frame's root wears the chosen theme after mount. The server
  and the first client render use the default, so the markup hydrates.
- **Card faces** (`playing-card.tsx`). The face is rendered with only its suit symbols recoloured, to
  the card's colour.
  - The deck was surveyed card by card. On 7–10 and the ace, symbols `a` and `b` are the corner index
    and the pips. On a court, `a` is the pip and `h` the corner letter, and the figure is other symbols
    (`b` gold, `c` red, `d` blue, `e` outline).
  - Those two symbols' fill and stroke are set to `currentColor` on the element tree. No stylesheet is
    involved (`app.css` is unchanged): a selector cannot reach the copies a `<use>` renders.
- **Text** (`ui.tsx` `Rich`, the front page's suits). Every suit symbol takes its scheme text colour;
  before, only ♥ and ♦ were coloured.
- **The settings button** (`frame.tsx`). A gear beside the language menu in the public header and in
  the band, and a "设置" tab in the table's side panel. It opens a dialog of three schemes: each shows
  ♣ ♠ ♥ ♦ in its own card colours, the current one is checked, and choosing applies at once. Strings
  are in zh, en and de.
- **Phone band.** The row gets room for the gear: on phones the gear is 32px, and the row's gaps and
  the language pill's side padding are tighter. This is spacing only.

## AC results

Built server on port 55027, Playwright headed, 1280×820 and 375×812 (`tmp/ac.mjs`, 36 checks, exit 0).
Card colours are measured **on screen**: each distinct face-up card's rendered face is copied into an
isolated white box and its pixels are counted.

1. **First visit is German Skat — PASS.**
   - Front page: all 14 distinct face-up cards show their German suit colour. The table hand: 10 of 10.
   - Text suits on the front page are in German colours.
   - Court figures keep their gold and blue, and their own red (♣/♠ courts) or black outline (♥/♦
     courts). These counts are identical across all three schemes.
2. **The settings button switches and remembers — PASS.**
   - It opened from the band (course), the header and the table panel; each offered 3 schemes.
   - Four colours chosen from the band held after reloading the front page and in a new page at the
     table (cards and text in four colours).
   - Two colours chosen at the table held after a reload.
3. **Four and two colours as specified — PASS.**
   - Four colours: ♠ black, ♥ `#FF0000`, ♣ `#00A859`, ♦ `#0071E3`.
   - Two colours: ♥♦ `#FF0000` and ♠♣ black on the faces; text ♥♦ in the previous `#D6281B`.

**The court check was shown able to fail.** `ac.mjs --prove-it-can-fail` injects the first, faulty
approach (a stylesheet rule that coloured every `<use>`). Every court check then fails, with the figure
gone solid.

Also run:
- Mechanical defence: typecheck, build, 70 tests, client bundle, design tokens (61 files), literal
  grep, SSR import. All pass.
- Overflow probe: 8 pages × 375/768/1280, no overflow.
- The settings dialog fits the screen in all 27 cases (3 widths × 3 languages × 3 openers).

## Deviations

- **A black suit in text takes the text's colour**, not `#000000`. Text sits on white and on the dark
  felt; pure black would vanish on the felt. On card faces the scheme's exact values are used.
- **Phone band spacing tightened** (gear 32px, smaller gaps and select padding) so the added gear fits
  the German labels at 375px. Nothing else in the band changed.
- **The first approach was discarded**: a stylesheet rule on `<use>` recoloured the court figures (the
  human caught it). The plan's `app.css` rule was replaced by the element-tree rewrite described
  above.

## Environment

- Ports: web 55027, where the review server is running.
- Env keys: none added, changed or removed. New browser key: `skatgo.settings.v1` (local storage).

## Residual

- At 320px, below the agreed 375 floor, the English band row overflows by 3px. The row was already
  near its limit there before the gear.
