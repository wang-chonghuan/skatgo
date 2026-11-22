# SKATGO-229 handoff

## What changed
- `app/src/lib/brands.ts` — four brand pages' words (Skat Palast, Skatstube, Euroskat, Skat-Online), German and English: title,
  description, H1, an intro, eight things each offers, five or six questions with answers, each statement with its source
  (the SKATGO-228 crawl of 2026-11-22); `brandHead` (WebPage, FAQPage, breadcrumbs).
- `app/src/components/skat/brand-page.tsx` — the page: link back to the comparison, H1, intro, the box to SkatGo's front page
  (free, no sign-up), what the brand offers, a table of the brand beside SkatGo (from `lib/compare.ts`), its questions, the box
  again, the link back, the trademark note and the correction line.
- Four static routes `app/src/routes/skat-sites-compared_.{skat-palast,skatstube,euroskat,skat-online}.tsx`; their URL patterns
  (`/de/skat-online-vergleich/<brand>`, `/en/skat-sites-compared/<brand>`); `client-page.tsx` entries; `PAGES`.
- The comparison page's portraits of those four end in a "Mehr über …" link. The footer and the rest of the app are unchanged.
- Charter: product.md (approved), engineering.md structure, ui.md layout.

## AC results (web 55229; headed Chromium; `tmp/ac.mjs`, `tmp/ac-result.txt`: 85 checks)
1. **Pass.** All 8 addresses 200, "index, follow", in the sitemap; `check:seo -- --built` OK with 62 indexable pages (54 before).
2. **Pass.** Each page: intro over 200 characters, 5–6 questions matching its FAQPage, 6 comparison rows, two boxes to `/de` or
   `/en` saying free and no sign-up.
3. **Pass.** Any two German pages share 13–15 % of their 5-word phrases (the common frame: buttons, headings, SkatGo's column);
   beyond that frame 0–1 %.
4. **Pass.** No pictures, no outside links, no negative or money words; trademark note present.
5. **Pass.** The comparison links all four pages in both languages; each links back; no brand-page link in the footer, on the
   front page, About or the rules.
6. **Pass.** No sideways scroll at 1280, 375 and 360 px.
7. Recorded at close (Search Console and Bing submissions).

Mechanical defence passed in full: typecheck, build, 353 tests, client bundle, design tokens, literal grep, SSR link,
`check:seo -- --built`, `test:seo` (28 pass).

## Deviations
- Spiele123 has no page (too little to say; the plan allowed "视情况").

## Environment
Port web 55229 only (no multiplayer or database needed). No env key changed.

## Residual
- If Search Console shows a brand page picking up its brand's searches, more brands (e.g. Skat Treff, Isar Interactive's Skat app)
  could follow the same way.

## Check
1. `/de/skat-online-vergleich/skat-palast` and the other three — the wording.

## Decided for you
See `grill.md`: the four brands, static routes, addresses, page structure, no outbound links or pictures, no re-crawl, the
overlap check against doorway pages.
