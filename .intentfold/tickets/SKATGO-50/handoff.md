# SKATGO-50 handoff

## What changed

**Bidding table page (new)**
- `/de/regeln/reiztabelle` and `/en/rules/bidding-table`: route `app/src/routes/rules_.bidding-table.tsx`, page `components/skat/bidding-table-page.tsx`, wired through `client-page.tsx`. The URL pattern is in `paraglide.options.ts`, and the page is in the sitemap's `PAGES` (`lib/sitemap.ts`).
- The page is rendered on the server and contains, in order:
  - the h1 and lead;
  - the multiplier × game grid: rows 2–18, columns Karo 9, Herz 10, Pik 11, Kreuz 12 and Grand 24, with Grand empty above 11;
  - the four Null values;
  - the full bid order;
  - "how to work out your bid", with two worked examples;
  - links to the rules' bidding section, lesson 7, and the table.
- On a phone the suit columns show the suit symbol instead of the name, so the six columns fit.
- Every number comes from the engine. `value.ts` now exports `MIN_MULTIPLIER` and `MAX_MULTIPLIER`, and `BID_LADDER` is built from them; the ladder's values are unchanged.
- **Print**: `bp.print` (`@media print`) is added to `breakpoints.stylex.ts`, approved by the human under ui.md Redline 1.
  - `skat-layout.tsx` wraps the header, and the footer with the assistant, in a `display: contents` box that is `none` in print. This applies site-wide.
  - On the bidding page, the lead, the explanation and the links are hidden in print, leaving the title and three tables.
- Preview images `public/og/bidding-table-{de,en}.png`, drawn by `.intentfold/tickets/SKATGO-50/og.mjs` (SKATGO-29's script, limited to the pages named on the command line).

**Rules page**
- Title, description and lead are aimed at "Skat Regeln einfach erklärt" / "Skat rules explained simply", with a new h1 key `rules_h1`. The page name `rules_title` in links and breadcrumbs is unchanged.
- New block kind `sub` (`rules/types.ts`): an h3 with a fixed anchor, also listed under its section in the contents, landing below the header.
- `#grand` and `#null-ouvert` are in "Spielarten". The Null ouvert text moved there from the Ouvert paragraph and was expanded.
- `#ramsch` is in "Hausregeln", with a fuller description of the common variants (Jungfrau, Durchmarsch, Schieben), marked as regional and not played by SkatGo. The closing "SkatGo uses none" paragraph became part of the section's opening line.
- The bidding ladder now links to the bidding table.
- The untrue "SkatGo doesn't score by Seeger-Fabian" is corrected: the daily tournament scores by Seeger-Fabian; free play counts game values only.

**Course page**
- The German title, description, h1 (`course_title`, so links and breadcrumbs too) and lead target "Skat spielen lernen" and "für Anfänger".
- In English the title, description and lead change; the h1 stays the same.

**Play page**
- German title: "Skat kostenlos spielen – ohne Anmeldung, ohne Werbung | SkatGo".
- h1: "Skat kostenlos spielen – gegen den Computer".
- The description and the server-rendered intro add free, no sign-up or registration, no ads, against the computer. English likewise. Nothing about offline play.
- Preview images for the rules page (de/en), the German course page and the play page (de/en) were redrawn because their h1 changed. The English course h1 is unchanged and its image is byte-identical.

**Test**
- `rules/rules.test.ts`: the rules page's banned-word check no longer bans "daily / tournament" words. That ban predates the daily tournament (SKATGO-29 vs SKATGO-35), and the corrected Seeger-Fabian line names it.
- The check still bans promises of unshipped things ("soon", "puzzles"). The lesson pages' ban is unchanged.

## AC results

Checked by `tmp/ac.mjs` in a headed Chromium against the built server on 55050, with the multiplayer service on 56050 and the database on 57050: 43/43 pass.

1. **Bidding table**:
   - In both languages, without JavaScript, the ladder equals `BID_LADDER` (63 values).
   - The base values are 9/10/11/12/24, and all 85 grid cells equal base × multiplier up to the engine's limits ("–" above them).
   - Every value in the grid is a legal bid, and every non-Null bid appears in the grid.
   - The Null values are 23/35/46/59.
   - Both rules pages link to the table.
   - Print emulation shows only the h1 and the two tables plus the ladder: no header, footer, nav, button or link (`ac1-print.png`).
2. **Rules and course**:
   - The German rules title, description and h1 contain "Skat Regeln".
   - The German course title, description and h1 contain "Skat spielen lernen".
   - `#grand`, `#null-ouvert` and `#ramsch` are headings with contents links in both languages.
   - `/de/regeln#grand` and `#null-ouvert` land at 80px, the header's bottom edge.
3. **Play page**:
   - "kostenlos", "ohne Anmeldung" and "ohne Werbung" are in the German title, description and server-rendered `main`.
   - "gegen den Computer" is in the description and the h1.
   - Neither language's page contains "offline" or "ohne Internet".
4. **Sitemap, SEO, layout, existing functions**:
   - The sitemap has both addresses with hreflang alternates.
   - `check:seo -- --built` reports 38 indexable pages OK, and `test:seo` passes (mechanical defence).
   - No horizontal scroll on the 8 affected pages at 1280×820 and at 375×812 (`isMobile`, `hasTouch`).
   - The course lists its lessons, and the rules keep all 8 section anchors.
   - Free play renders the table and deals a game (bidding buttons shown, no server problem; `ac4-play.png`).

Mechanical defence: typecheck, build, 83 tests, client bundle, design tokens, literal grep, SSR link, `check:seo -- --built`, `test:seo` — all pass.

## Deviations

- The Grand Hand example uses "ohne 2" instead of "ohne 1", to avoid "1 Spitzen". It is not in plan.md, and its numbers still come from the engine.
- The h3 sub-headings use the existing `appBtnStrong` role, as the page's example titles do; no new typography role.
- Q7 follows the grill answer, not the first recommendation: a shorter play title, with "gegen den Computer" moved to the h1 and description.
- The rules test change is above (Specification first: the ban was outdated, not the code).

## Environment

- Ports: web 55050, multiplayer 56050, database 57050.
- The worktree's `app/.env` `MULTIPLAYER_URL` and `multiplayer/.env` `DATABASE_URL` point at the ticket ports for local acceptance only. These are not key changes: no env key added, changed or removed for main.

## Residual

- Charter drift, not edited (human-owned):
  - `engineering.md`'s route list (`app/src/routes/`) lacks `/rules/bidding-table`, and its path table lacks `bidding-table-page.tsx`;
  - `ui.md`'s Responsive section and breakpoint keys do not mention `bp.print` or the site-wide print rule;
  - `ui.md`'s sub-page list does not name the bidding table.
- The OpenSEO tags page-bidding / page-rules / page-course / page-play are ready for rank tracking a few weeks after release (SKATGO-49).
