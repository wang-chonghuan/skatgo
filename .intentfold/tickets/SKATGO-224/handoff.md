# SKATGO-224 handoff

## What changed

- **The front page's colour cards** (`app/src/components/skat/entry-page.tsx`): back to their first order and colours,
  the same for everyone — 1 deal today (green), Free play (red), Learn (orange), Ranked match (navy), as before
  SKATGO-221. `tileTones` gives the deal of the day `tileGreen` / `elev.tileGreen` and free play `tileRed` /
  `elev.tileRed` again. The League keeps SKATGO-221's "Hot" ribbon (16px, 148px band) and gold cup. Icons, titles,
  card art, links and click tracking (`primary`, `free`) unchanged; no token added or changed.
- **Charter** `ui.md`: the order sentence and the two colour rows, with the human's words; SKATGO-223 noted as dropped.

## AC results

Playwright, headed, on the production build (web 55224): English at `/en`, German at `/` (`<html lang>` and the League
card's title prove the page); PC 1280, phone 375 and 320; signed out and signed in (local test account) —
`tmp/ac.mjs`, `tmp/ac.log` (60 checks), screenshots in `tmp/`.

1. **Order** — PASS. daily, play, course, league everywhere.
2. **Colours** — PASS. daily `rgb(0, 130, 26)`, play `rgb(200, 40, 26)`, course `rgb(229, 111, 0)`, league
   `rgb(2, 38, 87)`, each shadow its own colour.
3. **League keeps its ribbon and cup** — PASS. "Hot" with every band corner 9px outside the card, the gold cup; no
   other card has a ribbon. No sideways overflow at any width.
4. **Same for everyone** — PASS. Signed in: the same order and colours.
5. **Live** — after deploy (cap4).

(The first runs' failures were the check script's: waiting for network idle on a signed-in page that keeps a
connection open, and counting the signed-in history card, which is also a link card, as a fifth colour card. The script
was corrected; the page was not changed.)

Mechanical defence: typecheck, build, app tests (353/353), client-bundle, design-token, literal grep, server link, SEO
built check and SEO tests (28/28) — pass.

Owner's-eye review (fresh reviewer: the human's words, the original layout's picture, the built screenshots): matches
the original in order and colours on all six screenshots, signed in and out; Ranked match keeps "Hot" and the cup. It
noted the German phone title breaking "Ranglis-tenspiel" — that is ui.md's rule for a phone (SKATGO-210, the human's
choice), unchanged here.

## Deviations

None from plan.md.

## Environment

- Port used: web 55224 (as computed). No env key added, changed or removed.

## Residual

- Clicks on the Learn and Ranked match cards are still not tracked (only `primary` and `free`); SKATGO-223 would have
  added them and was dropped with it.

## Check

Finish is auto-deploy. On https://skatgo.com/en after deploy: 1 deal today green top left, Ranked match navy with "Hot"
and the gold cup bottom right.

## Decided for you

- "The original" is the order and colours before SKATGO-221.
- The League keeps its "Hot" ribbon and gold cup (not part of the layout; the human kept the ribbon in SKATGO-223).
- Click tracking unchanged.
