# SKATGO-120 Handoff

Delivered for review (`finish: review`). No merge, deployment or production data change.

## What Changed
- `app/src/components/skat/entry-page.tsx`: `HeroArt` is `display: none` at `bp.phone`, and its `<picture>` gives a
  phone (`phoneQuery`) an empty source, so the picture is not fetched there. Desktop and tablet unchanged.
- `.intentfold/charter/ui.md`: the hero's illustration line says it is not shown on a phone (SKATGO-120).

## AC Results
Built server on 55120, headed Chromium (`tmp/ac.mjs`, screenshots in `tmp/shots/`).
1. PASS — phone 375×812: German and English, the picture not shown and not requested; the first tile's top at 452 /
   462 px, inside the first screen (it was about 270 px lower with the picture).
2. PASS — desktop 1280×820: the picture shown and fetched, first tile at 437 / 516 px as before.

Mechanical defence passed (typecheck, build, 286 tests, bundle, tokens, literal grep, SSR link,
`check:seo -- --built`, `test:seo` 28/28).

## Deviations
None.

## Environment
Port: web 55120. No env change.

## Residual
None.

## Check
1. http://localhost:55120/ at phone width — the hero without the picture, the four tiles right under it.

## Decided for You
- The phone step is the site's 480px one: tablets keep the picture.
