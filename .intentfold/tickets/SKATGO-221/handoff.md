# SKATGO-221 handoff

## What changed

- **The ribbon** (`app/messages/en.json`, `de.json`, `app/src/components/skat/entry-page.tsx`): the message
  `home_league_new` ("New" / "Neu") is now `home_league_hot`, "Hot" in both languages. Its words use a new `ribbon`
  type role, 16px bold (the shared 13px `badge` role before, still used by the other badges). Colour, angle, length and
  place are unchanged.
- **The gold cup** (`app/src/components/skat/gold-trophy.tsx`, new; `entry-page.tsx`): the League tile's outline
  `Trophy` is replaced by `GoldTrophy`, an inline SVG in lucide's 24-unit box at 44px (`goldTrophy.size`, a step above
  the other tiles' 36px icons; `Way` takes an `iconSize`): bowl, foot and handles in a diagonal gold gradient, a lit
  rim, an engraved star, a white highlight down the bowl's left, a soft gold glow. A white band of light, clipped to the
  cup, crosses it once every 2.8s (about 1s over the cup, then out of sight); two four-pointed sparkles beside it
  twinkle every 1.6s, half a swing apart, from faint and small to full. Under `prefers-reduced-motion`
  nothing moves: the band stays off the cup, the sparkles stay lit. `Way` now takes the cup or a lucide icon.
- **Tokens** (ui.md Redline 1, approved by the request — the human's words are quoted on each):
  - `color.trophyLight` `#FFE7A0`, `trophyGold` `#F7B61E`, `trophyDeep` `#C27A0A`, `trophyGlow` `rgba(255, 196, 60, 0.6)`;
  - `fill.trophyGlow` `drop-shadow(0 0 6px …trophyGlow)` (elevation.stylex.ts);
  - `timing.shine` 2.8s, `timing.twinkle` 1.6s, `timing.twinkleBehind` −0.8s, `timing.easeInOut`; consts `shine`
    (`translateX(0)` → `translateX(60px)`) and `twinkle` (opacity 0.15 → 1, scale 0.4 → 1) (effects.stylex.ts);
  - `goldTrophy`, the drawing, its 44px size and its gradient stops (constants.ts);
  - `typography.ribbon` (type.ts).
  The highlight and the band reuse `color.onColorSoft`.
- **Charter** `ui.md`: the League tile's sentence (gold cup, "Hot" in `ribbon` type), the `stop` row, the registry
  table rows, the `ribbon` role, and a line on the cup's shine under motion.

## AC results

Playwright, headed, on the production build (web 55221), PC 1280×820 and phone 375×812, EN at `/en` and DE at `/`
(each with its browser locale; the tile's title, "Ranked match" / "Ranglistenspiel", and `<html lang>` prove the page)
(`tmp/ac.mjs`, `tmp/ac.log`, screenshots in `tmp/`).

1. **"Hot" in both languages** — PASS. The League ribbon reads "Hot" on `/en` and `/de`, PC and phone; no tile ribbon
   reads New or Neu.
2. **Gold with a highlight** — PASS. The gradient's stops compute to the three trophy colours; bowl and foot are filled
   with it; one white (`onColorSoft`) highlight stroke; the drop-shadow glow is applied.
3. **It shines, looping** — PASS. The band (2.8s) and both sparkles (1.6s) run with infinite iterations; the cup
   frozen mid-pass and at rest gives different pictures.
4. **Still under reduced motion** — PASS. `reducedMotion: 'reduce'`, PC and phone: no animations on the cup, the band
   at its start (off the cup), the gold stops unchanged.
5. **Fits on PC and phone** — PASS. The cup (44×44) lies inside the tile and clear of the title; the ribbon's middle is
   inside the tile; EN and DE.
6. **"Hot" a little larger** — PASS. 16px (was 13px), EN and DE, PC and phone; `tmp/ribbon-compare.png` shows the
   ribbon at 13px beside 16px, 3×.

Mechanical defence: typecheck, build, app tests (353/353), client-bundle, design-token, literal grep, server link, SEO
built check and SEO tests (28/28) — pass, on the final code. A first run failed one SEO test only because the review
preview held port 55221, which that test also binds; with the preview stopped it passes.

Owner's-eye review (fresh reviewer: the Request, this grill, SKATGO-135/204/206/212/213 records, screenshots):
- The first German screenshots were the English page: `/de` is not the German front page. The check now opens `/`
  with a German locale and proves the language; AC 1, 5 and 6 rerun in German — pass.
- At 36px the cup's star and highlight did not read and the shine was hard to notice; the owner asked for a cup that
  shines as a retention lever and once picked a cup with 「b，稍微大点」 (SKATGO-212). Fixed: the cup is 44px, the band
  wider and every 2.8s, the sparkles larger and twinkling deeper. AC 2–5 rerun — pass.
- "Hot" at 16px may still read small to the owner (SKATGO-135: 「四个卡片上的字还是太小」); kept at the asked
  「稍微大一点」, shown side by side with 13px — first in Check.

## Deviations

- The cup is 44px, not `icon.tile`'s 36px as plan.md had it, after the owner's-eye review (above).
- Added mid-development at the human's word (「彩带上的Hot字体稍微大一点」): the `ribbon` type role and AC 6, written
  into the live ticket with a comment; plan.md had kept the ribbon's `badge` type.

## Environment

- Port used: web 55221 (as computed). The multiplayer service and database were not started; the front page's tiles
  do not need them.
- No env key added, changed or removed.

## Residual

- `effects.stylex.ts`'s existing `turn` (the loading logo) is not in ui.md's registry table; this ticket added only its
  own `shine` and `twinkle` there.
- The League page's own card still shows the outline `Trophy` (ui.md, the League card); the gold cup could go there too
  if wanted.

## Check

1. http://127.0.0.1:55221/en — the "Hot" on the red ribbon: big enough now? (`tmp/ribbon-compare.png`: 13px before, 16px now)
2. http://127.0.0.1:55221/en — the gold cup on the Ranked match tile: its size, and whether the passing light and the
   sparkles are noticeable without being restless.
3. http://127.0.0.1:55221/ — the same tile in German ("Ranglistenspiel"), ribbon "Hot".

## Decided for you

- German ribbon also "Hot", not "Heiß".
- The ribbon keeps its red, angle, length and place; only its words and their size change (16px, from 13px).
- The cup is drawn in SVG (gold gradient, lit rim, engraved star, highlight), not the League's tier picture.
- "Flash" is a band of light crossing the cup every 2.8 seconds (about 1 second over it) plus two twinkling
  sparkles and a soft glow — not a constant blink.
- The cup is 44px, a step larger than the other tiles' 36px icons; the sparkles stand just outside that box.
- With reduced motion the cup stays still; gold day and night, as the tiles.
