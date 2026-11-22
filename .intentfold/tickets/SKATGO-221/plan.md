# SKATGO-221 plan

## What the code already says that the ticket does not

- The tile is `Way` in `app/src/components/skat/entry-page.tsx`: the League tile passes lucide's `Trophy` (an outline,
  `icon.tile` 36px, `icon.outline` stroke, white) and `badge={m.home_league_new()}`; the ribbon's red, angle and place
  are its own style (`styles.badge`: `stop`, `pose.ribbon`, `dims.ribbonWidth`/`ribbonRight`) and stay.
- The ribbon's words are `home_league_new` in `app/messages/en.json` ("New") and `de.json` ("Neu"); no test names them.
- Nothing on the front page animates today. The one CSS animation in the app is the loading logo's turn
  (`table-loading.tsx`): `stylex.keyframes` with `from`/`to` only, its values from `turn` and `timing.spin` in
  `effects.stylex.ts`, `animationName: 'none'` under `bp.reducedMotion`. The token check rejects keyframe percentages,
  numeric JSX attributes and gradient offsets typed outside `app/src/theme/`, so every number of the drawing lives in
  the registry — as the tap hand's drawing does (`tapHint` in `constants.ts`, SKATGO-72).
- `color.gold` / `amber` are the card table's highlight colours; the cup gets its own role tokens rather than borrowing
  them ("Use the role, not the value that looks right").
- The section tiles have one colour day and night; the cup does too (navy tile `#022657` by day, `#1A4383` at night).

## Route

1. Ribbon: rename the message `home_league_new` → `home_league_hot`, "Hot" in English and German.
2. `GoldTrophy` (`app/src/components/skat/gold-trophy.tsx`): an inline SVG in a 24-unit box like lucide's, drawn at
   `icon.tile`:
   - cup, handles, stem and base filled/stroked with a diagonal gold gradient (light → gold → deep);
   - a white highlight streak on the bowl's left, and a small engraved star in the deep tone;
   - a soft gold glow around it (`filter: drop-shadow`);
   - the shine: a white diagonal band, clipped to the cup's shape, crossing it left to right about once every three
     seconds and resting in between (one linear `from`/`to` pass whose path is wider than the cup, so no keyframe
     percentages are needed);
   - two small four-pointed sparkles beside the cup, twinkling, out of step;
   - under `prefers-reduced-motion`: no animation; the band rests outside the cup, the sparkles stay lit.
   `Way` takes it in place of a lucide icon.
3. Registry (ui.md Redline 1, approved by the request): the cup's colours in `color.stylex.ts`; its glow (a
   `filter`, not a box shadow) beside the shadows in `elevation.stylex.ts`; the shine's and the sparkles' timing and
   their `from`/`to` values in `effects.stylex.ts`; the drawing `goldTrophy` in `constants.ts`.
4. Charter `ui.md`: the League tile's sentence (red "Neu" ribbon, lucide's `Trophy`) and the registry rows for the new
   tokens; the motion list gains the cup's shine.

## Slices

One commit for the code and registry, one for the charter and records.
