# SKATGO-53 handoff

## What changed

**Score sheet** (`/de/regeln/skatliste`, `/en/rules/score-sheet`)
- Component `components/skat/score-sheet-page.tsx`; route `routes/rules_.score-sheet.tsx`.
- An empty Skatliste for three players and one DSkV series of 36 games:
  - columns Nr., Spiel, Wert and Spieler 1–3;
  - the Seeger-Fabian settlement as the same table's footer: final points, won games × 50, lost games × 50 (subtract), games the others lost × 40, total. Sharing the player columns saves a second header, which is what fits 36 rows on one A4 page.
- On screen the page also shows a lead, how to keep score, the PDF download and the ways on. On paper only the title and the table.
- Row height is the new token `dims.scoreRow` (`6mm`, human-approved, ui.md Redline 1).
- On paper the article keeps `space.x2` at each side, so the table's outer border is not cut at the page edge.

**Rules summary** (`/de/regeln/zum-ausdrucken`, `/en/rules/printable`)
- Component `components/skat/rules-summary-page.tsx`; route `routes/rules_.printable.tsx`.
- Text in `lib/skat/rules/summary.{de,en}.ts` (type `RulesSummary`), six sections:
  - cards and points;
  - trumps and following suit;
  - bidding;
  - picking up and discarding, or Hand;
  - games and game value, with every multiplier part named;
  - winning and scoring.
- The tables (card points, base values, Null values, bid ladder) render through the rules page's own `Block`, now exported, so every number is the engine's. Prints on two A4 pages.
- The rules page's "full bidding table" link under the ladder is now hidden on paper.

**PDFs**
- `app/public/downloads/skatliste.pdf`, `skat-score-sheet.pdf` (1 page each), and `skatregeln.pdf`, `skat-rules.pdf` (2 pages each).
- Written by the new `app/scripts/make-printables.mjs`. It uses Playwright, an existing devDependency, against a built server, and finds every sitemap page with a `pdf-download` link, printing it to that file (A4, 10 mm margins). Rerun it whenever the printables' text or the rules change.
- `lib/printables.ts` is the one place that maps each PDF to its page.

**PDF canonical header** (the human's decision during development)
- `vite.config.ts` passes Nitro `routeRules`, so each PDF answers with `Link: <its page>; rel="canonical"`. The page addresses are computed from the Paraglide patterns. `SITE_URL` moved to `lib/origin.ts` so the config can read it; `site.ts` re-exports it.
- `scripts/check-seo.mjs`: an internal link that is not HTML must now answer 200 and name a sitemap page as its canonical, instead of declaring noindex. It is reported as "linked files".
- `scripts/seo-inventory.mjs` reads `SITE_URL` from `origin.ts`.

**Engine**
- `tournament.ts` exports `SEEGER_FABIAN` (won 50, lost 50, defender 40); `seegerFabian()` uses it, and its behaviour is unchanged.

**Entry points**
- `components/skat/print-links.tsx` (`PrintLinks`, `PdfLink`, `pdfOf`), hidden on paper. It appears:
  - on the rules page under its top buttons and in "Abrechnung";
  - on the bidding table after its links;
  - on the course page under the lesson list.

**Other**
- Paraglide patterns, the sitemap's `PAGES`, 25 messages per language (`score_*`, `summary_*`, `printables_*`), and preview images `og/score-sheet-*` and `og/rules-printable-*`.

## AC results

`tmp/ac.mjs`, headed Chromium, built server on 55053: 46/46 pass.

1. **Score sheet**, both languages, server HTML:
   - 6 columns and 36 rows numbered 1–36;
   - the settlement's 50 / 50 / 40 equal `SEEGER_FABIAN`;
   - print emulation shows only the h1 and the table, and prints on one A4 page;
   - the PDF answers 200 `application/pdf`, is 1 page, with the canonical header pointing at its page.
2. **Rules summary**, both languages:
   - card points, base values, Null values and the 63-value ladder equal the engine;
   - the text names picking up and discarding, Hand, and every multiplier part;
   - printed it has no navigation and no buttons, on 2 A4 pages;
   - the PDF answers 200, is 2 pages, with the canonical header.
3. **Entry points and SEO**:
   - the rules, bidding table and course pages link to both printables in German and English;
   - the sitemap lists all 4 addresses with alternates;
   - `check:seo -- --built` reports 42 indexable pages and 4 linked files with canonical; `test:seo` 25 pass.
4. **Layout and existing pages**:
   - no horizontal scroll on the 4 new pages and the rules, bidding table and course pages at 1280×820 and 375×812;
   - the rules page keeps 8 sections, the bidding table 85 cells, the course 11 lessons.

Mechanical defence: typecheck, build, 83 tests, bundle, tokens, literal grep and SSR link passed. Then `check:seo` failed twice and was fixed:
- the PDF link: the human chose the canonical header, and the checker was extended;
- `SITE_URL`'s move: the inventory now reads it from `origin.ts`.

The SEO checks were rerun and pass.

## Deviations

- Grill Q6 said "near Reizen" for the second link on the rules page; it went into "Abrechnung", where a score sheet belongs.
- The Seeger-Fabian block is the table's footer instead of a second table: one A4 page.
- The SEO checker and the canonical header were not in plan.md. They follow the human's mid-development choice, recorded in a ticket comment on 2026-10-07. The check keeps its strength: a linked file must still answer 200 and point to a sitemap page.

## Environment

- Port: web 55053. No multiplayer or database was used.
- No env key added, changed or removed.

## Residual

- Charter drift, not edited (human-owned):
  - `engineering.md` Tools should name `app/scripts/make-printables.mjs` and when to rerun it;
  - its route list and path table lack `/rules/score-sheet`, `/rules/printable`, the printables files, `lib/printables.ts` and `lib/origin.ts`;
  - its search-surface lines should say that linked files carry a canonical header;
  - `ui.md`'s sub-page list lacks the printables and the token table lacks `scoreRow`.
- After release, submit the 4 new pages to Google (quota) and Bing.
