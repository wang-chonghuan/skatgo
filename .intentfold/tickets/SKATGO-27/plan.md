# SKATGO-27 plan

## What the code says that the ticket does not

- **The deck's colours are few and structural** (`@letele/playing-cards`).
  - A card's pips and corner indices are `<use>` references to one suit symbol and one rank symbol.
  - The red suits' symbols carry `fill="red"`; the black suits' carry no fill and inherit black.
  - The court figures are separate paths with `#44F` blue, `#FC4` gold, white and black, and do not
    use those symbols.

  So the suit colour can change without touching the figures: pips and indices take the colour, the
  figures keep theirs.
- **Suit symbols in running text** are coloured by `Rich` (`ui.tsx`), which today only reds ♥ ♦.
- **Hydration.** The front page and the course map render on the server. A setting read from
  `localStorage` during the first render would hand the browser different markup from the server's.
  The server renders the default (German), and a stored choice applies after mount, the way progress
  already does.
- **No settings surface exists.** The only per-browser preference today is the language, a native
  select beside the account.

## Route

1. **Registry.** `theme/suits.stylex.ts` defines `suit` = { clubs, spades, hearts, diamonds } as
   `defineVars`, with the German Skat colours as the default. Two `createTheme` variants cover
   four-colour and two-colour. Colours only, from the ticket's tables (four-colour values per Q1).
2. **The preference.** `lib/skat/settings.ts`: a small zustand store persisted under its own
   versioned key, `skatgo-settings-v1`, holding `{ cardColours: 'german' | 'four' | 'two' }` and
   defaulting to `german`. It is separate from progress, so a change of shape here can never lose
   progress.
3. **Applying it.** The frame (`skat-layout.tsx`) applies the chosen theme to its root element after
   mount; the server and the first client render use the default. Everything below reads `suit.*`.
4. **Cards.** `PlayingCard` sets `color` to its suit's variable. One rule in `styles/app.css`, the
   only stylesheet, makes a face's symbols take the current colour:
   `[data-face] use, [data-face] [fill="red"] { fill: currentColor }`. That is a descendant selector,
   which StyleX cannot express. Backs are unchanged.
5. **Text.** `Rich` colours each of ♣ ♠ ♥ ♦ with its suit variable, not only the red two. So do the
   other suit glyphs in the interface: the front page's four suits and the contract names in the
   picker.
6. **The settings button** (Q2): a gear button beside the language menu in the public header and in
   the sub-page band, and as the table side panel's settings tab. It opens a small dialog listing the
   three schemes, each with a swatch of ♣ ♠ ♥ ♦ in its colours and the current one marked; choosing
   applies at once. New strings in zh, en and de.

## Redline lookup

- No dependency change: zustand, lucide-react and StyleX are already present.
- No new stylesheet: one rule in `app.css`, which is the product's stylesheet.
- No token written outside `app/src/theme/`; the checks stay green.
- Product and operations redlines: none touched.
