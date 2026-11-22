# SKATGO-227 handoff

## What changed

- **Tracking plan** (`app/src/lib/analytics.ts`): `home_cta_clicked` carries `card` (`HomeCard`: daily / play /
  course / league) and `position` (1–4, reading order); `button` (`primary` / `free`) is now optional.
- **Front page** (`app/src/components/skat/entry-page.tsx`): every colour card sends it on click — `Way` reports its
  `section` and its place in `CARD_ORDER` (daily, play, course, league, the order the cards stand in), with `button`
  on the deal of the day (`primary`) and free play (`free`). `heroClick` is gone. Nothing on the page changes.
- No charter text names this event; none amended.

## AC results

Playwright, headed, on the production build (web 55227), PC 1280×820 and phone 375×812, English at `/en` and German at
`/`; each click caught from the page's `skatgo:track` announcement (off the published site nothing reaches PostHog) —
`tmp/ac.mjs`, `tmp/ac.log` (36 checks).

1. **Every card reports** — PASS. One `home_cta_clicked` per click: daily 1, play 2, course 3, league 4, with `locale`
   and `page` as every event.
2. **Old names kept** — PASS. daily `button: primary`, play `button: free`; course and league without `button`.
3. **Looks the same** — PASS. daily, play, course, league in green, red, orange, navy; the League's "Hot" and cup.
4. **Live** — after deploy (cap4), without clicking (ops Redline 2).

Mechanical defence: typecheck, build, app tests (353/353), client-bundle, design-token, literal grep, server link, SEO
built check and SEO tests (28/28) — pass.

Owner's-eye review: not run — nothing the human would judge by looking changed.

## Deviations

None from plan.md.

## Environment

- Port used: web 55227 (as computed). No env key added, changed or removed.

## Residual

- In PostHog, reports on `home_cta_clicked` can now break down by `card` and `position`; events before this deploy
  have only `button`.

## Check

Finish is auto-deploy. In PostHog (project 287504), after real visitors click: `home_cta_clicked` with `card` and
`position`.

## Decided for you

- Position is the reading order (daily 1, play 2, course 3, league 4), from one list beside the cards.
- `button` stays on the deal of the day and free play only.
- The live check does not click a card, so no test event reaches PostHog.
