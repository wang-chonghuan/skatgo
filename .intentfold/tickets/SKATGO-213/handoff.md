# SKATGO-213 handoff

## What changed

- **The tier cards** (`app/public/league/v2/<tier>.webp`, 480×384 WebP q90): each card's old emblem is filled with the
  card's flat ground — its faintest soft edge with it — and SKATGO-212's emblem is laid at the old one's centre, rendered
  at the card's scale from the same pictures:
  - Silver and Gold: the bronze medal in their metal, at the bronze medal's size. Bronze's card is the shipped one.
  - Platinum: the teal shield with the white star at its own size — the badge's teal, lighter, because on its own teal
    card the badge's shade sank into the ground.
  - Diamond: the darker diamond, at its own size. Legend: the orange cup with its shine and glow, the cup the gold card's
    old cup's size, the glow fading inside its square.
  - The sparkles: every one kept, lifted off and laid back over the emblem (so the glow does not dim them); the three the
    new emblems would have covered (Gold's beside the old cup's stem, Legend's two on the rim and one under the stem)
    moved clear, the shortest way out.
- **New addresses**: all twelve pictures (cards and badges) moved to `public/league/v2/` and `public/league/v2/badge/`;
  the old files are gone. `league-tiers.tsx` names the folder once (`ART`, with `tierPicture` and `tierBadge`), with the
  reason: the service worker shows a device's kept copy of a picture first, so a picture replaced under the same address
  stays old on every device that had it (what the human saw after SKATGO-212). The boards and the cards use the helpers.
- **Silver's and Gold's badges** rebuilt: the ribbon's half-covered edge pixels had come out a little greyer than the
  red test's saturation bar and took the metal's colour, a dotted line round the ribbon; the bar is .3 now (the ribbon's
  hue, under 15°, stays far from the bronze metal's 20–30°).
- **Charter** `ui.md`: the tier pictures and the badges, at their new addresses, and why a changed picture gets a new
  folder.
- The art code is a module now (`tmp/art.mjs`, the SKATGO-212 cut, rendering and cup glow) with `tmp/cards.mjs` and
  `tmp/badges.mjs`; moved to `.intentfold/tmp/SKATGO-213/` at close.

## AC results

Run with `tmp/ac.mts`: the web server on 55213 is started by the script, first from the base build (919ea8d, a detached
worktree beside this one), then from this build; six seeded accounts in the ticket database.

1. **Bronze, silver, gold one medal** — PASS. Bronze's card is byte-identical to the shipped one. Silver: red ribbon 2989
   px, grey metal 11601 px, blue ribbon 0 (3465 before). Gold: red ribbon 3141 (0 before), yellow metal 12552.
2. **Platinum, Diamond, Legend** — PASS. Platinum: teal shield 13685 px, white star 1836. Diamond: mean lightness 0.78
   against 0.87. Legend: orange cup 12045 px, glow 7764, laurel green 0 (6718 before).
3. **Unchanged around them** — PASS. Outside the emblem corner no pixel of any card differs from the shipped one; every
   shipped sparkle is found again (4, 5, 4, 4, 5), where it was or moved, brighter than what is round it. EN and DE,
   1280 and 375: six cards, each the same size, picture fill and word lines as on the base build (the German fee already
   takes two lines on a phone there).
4. **A device that kept the old pictures** — PASS. A profile on the base build: the service worker controls the page and
   holds all twelve old pictures. Server switched to this build: on the first load the cards and both boards' badges are
   `/league/v2/…`, their bytes this build's files.

Mechanical defence (engineering.md) on the final branch: passed — typecheck, build, 353 unit tests, client bundle, design
tokens, literal grep 0, SSR link, SEO (52 indexable pages) and its 28 tests. Multiplayer unchanged, not run.

Screenshots: `tmp/tiers-PC-1.png`, `tmp/tiers-PC-2.png`, `tmp/tiers-phone-1.png`, `tmp/tiers-phone-2.png`.

## Deviations

From `plan.md`: Platinum's shield on the card is lighter than the badge's (the badge's shade sank into the teal card);
sparkles are laid back over the emblems and the covered ones moved (the plan kept them where they were); Silver's and
Gold's badges rebuilt for the ribbon edge. All three from the look at the result.

## Environment

Ports used: web 55213, multiplayer 56213, database 57213. No env key added, changed or removed. The base build lives in
`../skatgo--SKATGO-213-base` (detached worktree, its `app/node_modules` a link to this one's), removed at close.

## Residual

- On a phone (cards 147×118) the tier's name runs into the bottom of the picture's emblem on Diamond (as before) and on
  Legend (the cup's foot where the laurel's ends were). The cards' layout is not this ticket's.

## Check

1. http://localhost:55213/en/league — the Platinum card: the shield is the badge's teal made lighter so it stands out on
   the teal card; it is the brightest emblem of the six.
2. http://localhost:55213/en/league — scroll the Tiers row: Silver and Gold now the medal, Diamond darker, Legend the
   orange cup with its glow and sparkles; Bronze as it was.
3. http://localhost:55213/en/league on a phone width — Diamond's and Legend's names touch their emblems (Diamond did
   before too).

## Decided for you

- Platinum's shield on its card is a lighter teal than its badge, so it does not sink into the teal card.
- Sizes on the cards: the medals as big as the bronze medal, the cup as big as the gold card's old cup, shield and
  diamond their own.
- Each card keeps its own sparkles; the three the new emblems would cover moved clear, and all are drawn over the glow.
- All twelve pictures (cards and badges) moved to new addresses, so devices that kept the old ones show the new at once.
- Silver's and Gold's badges rebuilt to take the dotted line off the ribbon's edge.
