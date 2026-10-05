# SKATGO-47 rework

Changes after the frozen `handoff.md` (`f0ff0c4`), from two rounds the human asked for on 2026-10-05.
Each round is one commit whose message is the ask.

## Round 1 — `3733924`: charter drift and the lesson pages' sidebar

The ask: bring ui.md's outdated typography up to date, together with the drift reported before, and
change the lesson pages that still used the sidebar — all in this ticket.

- **Lesson pages** (`/course/<slug>`) wear the front page's header like every other page but the
  tables. The lesson's title is the first element of its column, an `<h1>` in `landingHeading`, navy.
  The lesson's sticky "back / continue" bar now sits at the very bottom of the screen; it used to sit
  above the tab bar on a phone.
- The rail, tab bar, band and app shell are removed from `frame.tsx`, and the app frame from
  `skat-layout.tsx`. `frameOf` is `landing | table`.
- **Charter**, edited at the human's request:
  - `ui.md` rewritten to the lobby design the code carries: registries, palette, suit schemes,
    weights and roles, shape, spacing, elevation and the SKATGO-41 compositing rules, kit, widgets,
    frames and pages, responsive, and the registry file names in Redlines 1 and 4.
  - `engineering.md`: the routes, the frame, `daily-comparison.tsx`, and the daily AI result as a key
    decision (SKATGO-42).
  - `operations.md`: day preparation time with the AI result (about 30–35 s local, 6–6.5 min in
    production), and the re-deal script.
  - `product.md`: the daily AI comparison.
- Rechecked:
  - all 11 lessons, English and German, at 1440/1280/390/375: 96/96. Each has the header, no rail, tab
    bar or band, one h1 also in the SSR HTML, the sticky bar at bottom 0, and no horizontal scroll
    (`tmp/lessons.mjs`);
  - AC1 weights: 1017 texts, 0 failures;
  - the token, literal and client-bundle checks.

## Round 2 — `2829a54`: clean the registries and ui.md

The ask: clean the registries and ui.md to the real state, delete outdated and contradictory content
outright, no "removed" markers; then close and redeploy without stopping.

- **Registries**: every key that no code uses is deleted, 129 in all. The search ran repeatedly until no
  unused key was left, because a key used only by a deleted key goes too:
  - colours: footer, three section tiles, `suitRed`, two overlays;
  - 56 `dims`: rail, tab bar, band, the old lobby grid, plates, sheet and others;
  - shadows, fills and poses;
  - `bp.mid`;
  - unused spacing, opacity and border steps;
  - 8 font sizes;
  - `family.display` / `heading` and `weight.medium`;
  - 31 typography roles;
  - icon sizes;
  - `stage.band`.
- `weight.semibold` folds into `weight.ui`, since both are 600. Names that described removed things
  are renamed: `railLabel` → `tabLabel` (the table panel's tabs), `icon.tab` → `icon.menu`,
  `icon.bandNav` → `icon.gear`. Comments that described the rail or band are rewritten.
- `ui.md` names exactly what the registries hold; a script checked every token, role and colour name
  against them. The "kept without a current use" lines and the "there is no rail…" sentence are gone.
- The mechanical defence's SEO check then failed: lesson 11 had only one contextual link once the
  band's back and home links were gone. Every lesson now ends with an "All lessons" link to the course
  (new message `lesson_all`, English and German). The now unused `nav_back` message is deleted.
- Rechecked:
  - the full mechanical defence: typecheck, build, 83 tests, client bundle, tokens (98 files), literal
    grep, SSR link, `check:seo` (36 pages), `test:seo` (25);
  - lessons 96/96;
  - AC1 weights 1015 texts, 0 failures;
  - AC2 all 32 card indices at 112.

## Net effect against the handoff

Everything in `handoff.md` still holds. In addition:
- lessons share the header;
- no page has a rail, tab bar or band, and no code or token for them remains;
- the registries hold only values in use;
- the four charter files describe the current product.
