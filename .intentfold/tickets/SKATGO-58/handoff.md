# SKATGO-58 handoff

## What changed

- **`components/skat/ui.tsx` `Pill`**:
  - no longer `whiteSpace: nowrap` without a limit: it is at most as wide as its container (`maxWidth: '100%'`), centred, and a long text wraps inside it, with `paddingBlock: space.x6` so two lines still fit the rounded pill;
  - a pill's text made of parts joined by " · " breaks only right after a dot, never inside a part or before the dot (`keepParts`, non-breaking spaces);
  - short pills look as before: one line, 40 px.
- **`components/skat/game-table.tsx`**: the play-phase pill is split in two: "Stich n von 10" (existing `info_tricks`) and "Augen: Alleinspieler x · Gegenspieler y" (new `table_points`, en "Card points: declarer x · defenders y").
- **Messages**: `table_trick_count` removed; `table_points` added.
- No design value added.

## AC results

`tmp/ac.mjs` and `tmp/narrow.mjs`, headed Chromium, web 55058, multiplayer 56058, database 57058: 12/12 pass.

The daily table was brought into the play phase (trick 3) through the page's own API; no game was played for its own sake.

1. **Every pill inside the panel**, none clipped:
   - at 1280×820 with the panel pinned (358 px), in German and English;
   - at 375×812 with the drawer open, German and English;
   - at 920×820, the narrowest pinned panel (280 px), where the two long German pills wrap onto two lines inside the panel.
2. **The panel shows** "Stich 3 von 10" / "Trick 3 of 10" and both sides' card points.
3. **The course page's three pills** are unchanged: one line each, 40 px.

Mechanical defence passed in full: typecheck, build, 83 tests, bundle, tokens, literal grep, SSR link, `check:seo -- --built` 42 pages and 4 linked files, `test:seo`.

## Deviations

- The pill's line-break rule was not in plan.md. At the narrowest panel, plain wrapping and balanced wrapping both split "gereizt bis 18" or began a line with "·".
- The AC script's text match normalizes non-breaking spaces. The visible text is unchanged.

## Environment

- Ports: web 55058, multiplayer 56058, database 57058, for local acceptance only.
- No env key changed.

## Residual

- Releasing this is a web-only deploy; multiplayer is unchanged.
