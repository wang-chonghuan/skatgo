# SKATGO-222 handoff

## What changed

- **The front page's colour cards** (`app/src/components/skat/entry-page.tsx`): in page order the League (navy), the
  deal of the day (red), the course (orange), free play (green). The deal of the day moved from fourth to second and
  free play from second to fourth; in `tileTones` the deal of the day now takes `tileRed` / `elev.tileRed` and free play
  `tileGreen` / `elev.tileGreen`, so every place keeps the colour it had. Icons, titles, card art, links and click
  tracking (`primary`, `free`) are unchanged. No token added or changed.
- **Charter** `ui.md`: the tile sentence (order, which card is red and which green, the human's words) and the two
  colour rows, which also stop naming a private table for red.

## AC results

Playwright, headed, on the production build (web 55222), PC 1280×820 and phone 375×812, English at `/en` and German at
`/` (the League card's title and `<html lang>` prove the page) — `tmp/ac.mjs`, `tmp/ac.log`, screenshots in `tmp/`.

1. **Order** — PASS. league, daily, course, play on every page and size.
2. **Colours** — PASS. daily `rgb(200, 40, 26)`, play `rgb(0, 130, 26)`, league `rgb(2, 38, 87)`, course
   `rgb(229, 111, 0)`; each card's shadow starts with its own colour.
3. **Same cards, same ways** — PASS. daily: `/en/daily` · `/de/taeglich`, the calendar icon, "1 deal today" /
   "1 Spiel heute"; free play: `/en/play` · `/de/spielen`, the swords, "Free play" / "Freies Spiel". (The first run's
   AC3 failures were the check script's own errors — it read the card art's `svg` as the icon and expected a German
   path the site never had; the script was corrected, the page was not changed.)
4. **Live** — after deploy, on https://skatgo.com/en (cap4).

Mechanical defence: typecheck, build, app tests (353/353), client-bundle, design-token, literal grep, server link, SEO
built check and SEO tests (28/28) — pass.

Owner's-eye review (fresh reviewer: the human's words, the approved mock-up, the built screenshots): matches the
mock-up in places, colours, icons and card art on PC and phone, EN and DE. It noted only what this ticket does not
touch: the XP board is empty locally (no multiplayer service), and long German titles run into the card art, as titles
already did before.

## Deviations

None from plan.md.

## Environment

- Port used: web 55222 (as computed). No env key added, changed or removed.

## Residual

- The League card's clicks on the front page are still not tracked (only `primary` and `free` are), so the effect of
  SKATGO-221/222's new order on the League cannot be read from analytics yet.

## Check

Finish is auto-deploy; the human approved the mock-up before filing. On https://skatgo.com/en after deploy: 1 deal
today red, top right; Free play green, bottom right.

## Decided for you

- Each card's shadow changes colour with it.
- Click tracking names stay (`primary` for the deal of the day, `free` for free play).
- The cards' art stays: hearts on the deal of the day's red, spades on free play's green.
- ui.md's two colour rows now say red is the deal of the day (they named a private table before).
