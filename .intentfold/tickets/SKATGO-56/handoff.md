# SKATGO-56 handoff

## What changed

Only the four Charter files, as the human authorized. Each statement below was checked against the code before it was kept, changed or removed.

**product.md**
- Removed:
  - cap1's seeding note, which said unsaid lines were left as prompts;
  - the template placeholders: a non-goal bullet and a placeholder Redline 1;
  - the history clauses: the age once 12+, the old browser-chosen homepage, Chinese removed in SKATGO-28.
- The opening line now agrees with the Redline: editing needs the human's approval; it no longer says "never edits".
- "What this product is" now includes free play (`/play`) and the rules reference (rules, bidding table, score sheet, short rules with PDFs). These already exist and contradicted "it is the course and the daily tournament", which was rewritten. The Parrottoon exclusion is kept.
- The single remaining Redline is now number 1.

**engineering.md**
- Removed:
  - the seeding note;
  - the history in the multiplayer guide line and in the Parrottoon split (`/skat/...`);
  - an empty "Architecture and generation" heading.
- Stack: `/api/free/*` added beside `/api/daily/*`; Paraglide and PostHog added.
- Routes: `/rules/score-sheet` and `/rules/printable`.
- Path table:
  - the components row names every page file;
  - the rules row includes the short rules;
  - a new printables row covers `score-sheet-page.tsx`, `print-links.tsx`, `lib/printables.ts`, `lib/origin.ts`, `public/downloads/` and the canonical header.
- Tools:
  - the SEO usage link no longer points one directory too high;
  - the search surface states the linked-file canonical rule;
  - a "Generated, never hand-edited" section now lists the route tree, Paraglide output, the Astryx theme, the preview pictures (`og.mjs`) and the PDFs, with `make-printables.mjs` and when to rerun it.

**ui.md**
- Icons: the comparison's chevrons and the download button.
- `dims.scoreRow`.
- Widgets: `TitleWithDownload` / `PdfLink` (every download) and `PrintLinks`.
- Front page: its plain links.
- Sub-pages:
  - now include the score sheet and the short rules;
  - "option cards" is limited to pages that offer choices; the rules pages are plain text and tables;
  - a printable's download sits beside its title.
- Tables and public search content: the repeated description of free play's reading section is now said once.
- Print: the printables' pages (1 and 2 A4), the summary's wide tables, and the PDFs.

**operations.md**
- Runtime: the web serves `/downloads/` PDFs with their canonical header. The homepage line is stated without history.
- Local environment: `POSTHOG_PROJECT_KEY` is optional.
- Search consoles: the daily request limits observed today (Google about 10, Bing 100).

## AC results

`tmp/ac.py`, a command check, since a Charter change has no running product: 14/14 pass.

1. **Everything named exists**:
   - 62 repo paths named in backticks exist;
   - 17 named routes are file routes or server paths;
   - every npm script and script file named exists;
   - 63 registry keys named (`dims.*`, `bp.*`, `color.*`, …) exist in their registries.
2. **Everything that exists is described**:
   - every file route is named;
   - every file under `app/src/theme/` is in ui.md's registry table;
   - every `*-page.tsx` component is named.
   - The first run found the old `/skat/...` route and three unnamed page files. Both were fixed and the check rerun.
3. **Format**: all four files keep exactly Contract / Tools / Guidance / Redlines. There are no deletion markers and no template placeholders.
4. **Only `.intentfold/` changed.**

Mechanical defence passed in full: typecheck, build, 83 tests, bundle, tokens, literal grep, SSR link, `check:seo -- --built` 42 pages and 4 linked files, `test:seo`.

## Deviations

None from plan.md beyond the two AC findings above.

## Environment

- No service run, no port used.
- No env key added, changed or removed.

## Residual

None.
