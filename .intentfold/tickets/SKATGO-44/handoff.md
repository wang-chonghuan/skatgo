# SKATGO-44 Handoff

Delivered for review. No merge, deployment or production data mutation.

## What Changed

- German root is a stable 200 page regardless of browser/cookie preferences. Legacy `/de` redirects
  permanently to `/`, preserving queries; English `/en` remains independently self-canonical.
- Shared Paraglide patterns, page head and sitemap agree. Each page's x-default is its German
  equivalent, not an unrelated homepage. Existing German subpage addresses remain unchanged.
- Free play retains its full first-screen table, followed by visible SSR reading content and links.
  Its fallback uses the existing product illustration. Daily landing has static product facts,
  scoring and related links instead of only date placeholders.
- Personal daily execution declares noindex and has no language alternate/indexable sitemap entry.
  Unknown lesson slugs return actual 404 with localized missing-page content.
- Added truthful WebApplication/WebPage structured data. Corrected existing FAQ scoring and
  passed-in-game answers; visible answers and FAQ JSON-LD use the same messages.
- Added `app/scripts/check-seo.mjs`: derives pages from served sitemap, verifies no-JS content,
  canonical, reciprocal alternates, metadata, assets, robots, internal links, redirects and 404s.
  Deliberately broken canonical/content observations must fail.
- Updated authorized product, engineering, UI and operations charter areas. Search Console
  baseline and pending post-release work are in `search-console.md`.
- Updated obsolete language/sitemap tests; added stable-root, query-preserving migration and noindex
  coverage. Assistant launcher scrolls with the free-play table rather than covering reading text.

## AC Results

1. **Passed locally.** Headed SEO checker traversed 32 indexable URLs in two languages: all direct
   200, self-canonical, correct html lang, reciprocal head/sitemap alternates and unique metadata.
   Root remained German under all tested language headers and English cookie. Both legacy German
   home forms redirected 301 with query preserved. Unknown localized routes and lesson slugs were
   404. Browser language switching preserved home identity and translated lesson identity.
2. **Passed locally.** Every sitemap page had visible H1, substantive main text and internal links
   without JavaScript. Headed 1280x820 and mobile 375x812 checks exercised home, course, lesson,
   rules, free play and daily entry. Real free-game actions returned 200; daily tables loaded against
   the isolated local backend. No page errors, server failures or horizontal overflow. Table heights
   remained 820/812. Screenshots inspected; reading obstruction repaired and reverified at both sizes.
3. **Passed locally.** JSON-LD parsed with correct URLs/languages; FAQ entries matched visible text.
   Two derived personal execution links declared noindex and stayed out of sitemap. All 36 derived
   local assets returned 200. Wrong-canonical and empty-content negative controls were rejected.
4. **Passed as recorded baseline and follow-up, not a release outcome.** Authenticated GSC findings,
   crawl/report dates and canonical values are recorded. Existing successful sitemap requires no
   pre-release change. Production live tests, index requests and Google's processing are pending.

Mechanical defence: typecheck and production build passed; 78 tests in 9 files passed; 14 client
chunks passed server-reference check; 93 sources passed token check; literal check and SSR bundle
link passed. After the narrow launcher repair, affected type/build/bundle/token/link checks passed
again; unrelated successful rule-engine test evidence was retained.

Evidence scripts/results/screenshots remain ignored in `tmp/`: `ac.mjs`, `ac-results.json`,
`reading.mjs`, `reading-results.json`, and desktop/phone screenshots. Reproduce the SEO check with
Engineering's command against the running preview.

## Deviations

No material route departure. A screenshot revealed the fixed assistant launcher obscured free-play
reading text; absolute positioning within the free-play page corrected it without changing chat
behavior. Existing unit tests were updated because they asserted the explicitly replaced homepage
and sitemap contracts, not because valid assertions failed.

## Environment

Preview: web 55044, multiplayer 56044, isolated PostgreSQL 57044.

Copied ignored app/multiplayer env files. No environment keys added, changed or removed for the
product or production, and no env sync-back is required. Runtime-only local overrides selected
loopback multiplayer/database ticket ports and the existing `colima` Docker context; the copied
env named an unavailable context. Secrets were not printed or committed.

Both preview services and the named local PostgreSQL remain running for review. The initial dev
server hit the existing `@letele/playing-cards` dev resolver defect; acceptance used the successful
production build as Operations requires.

## Residual

- Merge/release and subsequent Search Console live URL tests, sitemap reread and index requests
  remain pending. No ranking, indexing or traffic improvement is claimed.
- Performance panel covered only 2026-09-26 through 2026-09-29; 0 clicks/2 impressions is not current
  total site traffic. Root's saved crawled HTML was already German.
- Bing verification, relevant backlinks and large new content production were deferred; no paid
  resources, purchased links/traffic or invented engagement were introduced.
- Existing app dependency install reported 7 audit findings (2 moderate, 5 high); no automatic
  dependency churn was folded into this SEO repair. Bundle-size warning is existing technical work,
  not a claim of measured Core Web Vitals improvement.
