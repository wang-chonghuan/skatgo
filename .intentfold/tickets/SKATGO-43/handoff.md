# SKATGO-43 handoff

## What changed

The three pages the front page's header links to — the daily tournament, the course and the rules —
now wear the front page's frame: the same `LandingHeader`, no rail, no bottom tab bar, no orange band.
Lessons keep the app frame; the full-screen tables are unchanged.

- `app/src/components/skat/frame.tsx`: new `frameOf(pathname)` / `useFrame()` — `table` for `/play` and
  `/daily/play`, `app` for a lesson (`/course/<slug>`), `landing` for everything else (`/`, `/daily`,
  `/course`, `/rules`). `sectionOf` is unchanged and still drives the rail's active item. Comments name
  `Band` as the lesson's band now.
- `app/src/skat-layout.tsx`: picks the frame by `frameOf`. The front page keeps its white page; the
  three sub-pages keep the grey `color.page` under the white header (grill Q5).
- `course-home.tsx`, `rules-page.tsx`, `daily-page.tsx`: `<Band>` removed; its title is the content
  column's first element, an `<h1>` in `typography.landingHeading` and `color.navy` (grill Q4). The
  band's Back and Home links are gone; the header's logo goes home.
- `rules-page.tsx`: each section gets `scrollMarginTop` of the header's height (`dims.landingHeader`,
  phone `dims.landingHeaderPhone`), so a jump from the contents (or a lesson's rules link) lands below
  the header, which stays on top. Not in the plan; needed because the header is sticky and the band was
  not.

No token registry changed; no dependency changed; multiplayer untouched.

## AC results

Built server on 55043 against `main` (`5b9613a`) built on 55143, the same multiplayer (56043) and local
database (57043). Headed Chromium, `tmp/ac43.mjs`; full output `tmp/ac43-results.txt`: **134/134 pass**.
Sizes: 1440×900, 1280×820, 390×844 and 375×812 (phones `isMobile`, `hasTouch`); English and German;
`/en/daily`, `/en/course`, `/en/rules`, `/de/taeglich`, `/de/kurs`, `/de/regeln`.

1. **Same header, no rail, no tab bar** — pass at every size and language. Each page was reached by
   clicking the front page's header link (on phones through the header's menu). The header's box and
   every part (brand, four links, language, settings, sign-in: text and bounding box) equal the front
   page's at the same size; `rail` and `tab-bar` count 0.
   - The first run failed 4 desktop cases on `/daily`: every part right of the brand sat 15px further
     right than on the front page. Cause: in a headed desktop browser with classic scrollbars, the long
     front page loses 15px to its scrollbar and the short daily page does not. The check now reserves
     the scrollbar gutter on both pages before measuring, and all cases pass.
2. **No orange band, title visible** — pass. `band` count 0 on all three pages. There is exactly one
   visible `<h1>`, and its text equals the band title on `main`:
   - Learn to play Skat / Skat lernen;
   - Skat rules / Skatregeln;
   - Today's Skat challenge: 12 deals, one leaderboard / Das tägliche Skat-Turnier: 12 Spiele, eine
     Rangliste.

   The `<h1>` is also in the server's HTML for all six pages.
3. **Content unchanged** — pass. Each page root's text without the title equals `main`'s text without
   its band; the countdown is masked because it moves by the minute. Every link (href, `data-lesson`,
   `data-state`, text) is also equal:
   - course: 13 links (lead, pills, progress card and its buttons, 11 lesson cards);
   - rules: 20 links (intro, buttons, contents, sections, lesson links);
   - daily: the lead with date and countdown, the start button, and the leaderboard.
4. **No horizontal scroll, front-page style** — pass. `scrollWidth ≤ innerWidth` at every size.
   Screenshots `tmp/ac-*.png` beside `tmp/ac-home-*.png` show the same header over the sub-pages' grey
   page with their own white cards; looked at for daily/course/rules at 1440 and the phones.

Also checked (`tmp/anchor.mjs`, 1280 and 375): a rules contents jump puts the section heading below the
header (96 ≥ 80, 80 ≥ 64). A lesson (`/en/course/ready-for-a-real-game`) still has band, rail and tab
bar, and no landing header.

Mechanical defence (engineering.md Tools) passed once: typecheck, build, 75 tests, client-bundle
check, design-token check (90 files), literal grep, SSR link.

## Deviations

- `scrollMarginTop` on rules sections (above), not in `plan.md`.
- AC4's sizes: the ticket's 1440 / 390, plus the charter's 1280×820 / 375×812.

## Environment

- Ports: web 55043, multiplayer 56043, database 57043. Base comparison build: web 55143, from a
  detached worktree `../skatgo--SKATGO-43-base`.
- Env keys: none added, changed or removed. The worktree's `app/.env` `MULTIPLAYER_URL` and
  `multiplayer/.env` `DATABASE_URL` point at the ticket ports; that is local only, not a key change.

## Residual

- Lessons (`/course/<slug>`) still wear the rail and the orange band (grill Q3). Moving them to the
  header needs a decision on where "back to course" goes; the pm session proposes a follow-up ticket.
- Charter drift, not edited:
  - `ui.md` "Layout and responsive" still describes the earlier frame (a `feltDeep` header, the reading
    column) and says nothing of the lobby frames. After this ticket: the front page's header also
    covers the tournament, course and rules; the rail and the band are the lessons' only.
  - `engineering.md`'s module map lists routes `/`, `/course`, `/lesson/$id`, `/play`. It is missing
    `/rules`, `/daily` and `/daily/play`, and lessons are `/course/$slug`.
