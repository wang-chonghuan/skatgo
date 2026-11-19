# SKATGO-212 handoff

## What changed

- **The six tier badges** (`app/public/league/badge/<tier>.webp`, still 96×96 WebP q90, same names, so both boards pick
  them up unchanged): the emblem alone on a transparent ground, without the sparkles, cut to a tight square — no more
  coloured square. Taken from the shipped tier pictures (`app/public/league/<tier>.webp`), so the drawing is the same:
  - Bronze, Silver, Gold: the bronze picture's ribboned star medal. Silver's metal is the grey of the silver picture's
    medal, Gold's the yellow of the gold picture's cup, each keeping the medal's light rim, disc and darker star; the red
    ribbon is the same on all three.
  - Platinum: its shield. Diamond: its diamond, 10 lightness points darker. Legend: the gold picture's cup.
  - How: each pixel's alpha from its distance to the picture's ground colour, its colour un-blended from that ground,
    parts smaller than 4% of the biggest dropped (the sparkles), a 4% margin. The script is the ticket's
    `tmp/emblem.mjs` (`node emblem.mjs <decoded pictures> <out>`, then `cwebp -q 90 -exact`), moved to
    `.intentfold/tmp/SKATGO-212/` at close.
- **Both boards' badge style** (`xp-board.tsx`, `league.tsx`): `radii.tag` removed — a picture with no square has no
  corners to round, and the rounding would clip the ribbon's ends. Size, place and alignment unchanged.
- **Charter** `ui.md`: the League board's badge description (SKATGO-206's "cut square on its colour") now says what the
  badges are.

## AC results

Run with `tmp/ac.mts` against a production build on the ticket's ports, six seeded accounts (one per tier, one with a
long name) in the ticket database.

1. **No coloured square** — PASS. All four corner pixels of every badge are fully transparent; on the home board and the
   League board, EN and DE, 1280 and 375, all six tiers are drawn with `border-radius: 0px`.
2. **Bronze, silver, gold one medal in three colours** — PASS. The three alpha masks are identical (largest difference
   0); the metal is bronze hue 24° sat 0.58, silver sat 0.01, gold hue 42° sat 0.93.
3. **Legend the cup, diamond darker** — PASS. Legend: 100% yellow, no green (the crown's laurel), stem 8px against a
   51px bowl. Diamond: mean lightness 0.77 against the shipped diamond's 0.86.
4. **Fits** — PASS. Home and League page, EN and DE, 1280 and 375: every badge 24×24 and within 1px of its row's centre;
   every name (the long one cut with "…"), win rate, XP and League points on one line inside its row.

Mechanical defence (engineering.md): passed — typecheck, build, 353 unit tests, client bundle, design tokens, literal
grep 0, SSR link, SEO (52 indexable pages) and its 28 tests. Multiplayer unchanged, not rerun.

Screenshots: `tmp/home-PC.png`, `tmp/home-phone.png`, `tmp/League-PC.png`, `tmp/League-phone.png`.

## Deviations

None from `plan.md`.

## Environment

Ports used: web 55212, multiplayer 56212, database 57212. No env key added, changed or removed.

## Residual

None.

## Check

1. http://localhost:55212/league — Platinum's shield (Maximiliane): the independent look found it the faintest — pale
   grey with a white star on the white page, it can read as greyed out next to the other five, and it is the closest to
   Silver (both grey; told apart by shape). Left as drawn: the request names no change for Platinum.
2. http://localhost:55212/league — the League ranking: the three medals in bronze, silver and gold, the darker diamond
   and the cup, at the size they really show.
3. http://localhost:55212/en — the home XP board on the same six players (on a phone width the list scrolls).

## Decided for you

- The red ribbon stays on all three medals; only the metal changes colour.
- Platinum keeps its shield (not named in the request).
- Legend's cup is the gold tier picture's cup, as drawn.
- Diamond is 10 lightness points darker, hue kept.
- The League board changes too: it uses the same badges.
- The big tier pictures in the League page's carousel are unchanged.
