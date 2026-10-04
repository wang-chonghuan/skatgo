# SKATGO-45 Handoff

## What Changed

- Root and app expose `npm run check:seo`. The default builds the current checkout and inspects an
  owned production preview; `--built` is reserved for the defence that already built it. Explicit
  origin is read-only. Server/browser cleanup runs on success, failure and interruption.
- Playwright 1.63.0 is pinned in app devDependencies; only its lock entries were added.
- The existing crawler remains the single observation path. `seo-inventory.mjs` cross-checks actual
  file routes, the sitemap registry, course lesson IDs, translated guides, private-page policy and
  URL patterns. No fixed count or second product page list exists.
- Strengthened visible SSR text, ancestor/offscreen hiding, crawler meta/header/robots rules,
  source-backed reciprocal alternates, social tags, structured data, private execution pages,
  resource responses, public HTTPS behind a reverse proxy and direct 404s.
- `test:seo` uses an owned built server and fault-injecting local HTTP proxy to prove failures.
  Engineering requires both commands; Operations uses the unified explicit-origin entry after its
  unchanged exact-release guard. Usage is in `app/scripts/README.md`.
- The human's 2026-10-04 approval for Playwright, root dispatcher and narrow Charter changes is
  recorded in grill.md and the live ticket. Finish remains review.

## Acceptance Results

1. **Current-code command and ownership: passed.** Root `npm run check:seo` built current source,
   inspected `http://127.0.0.1:55045`, reported 32 indexable pages, 2 noindex pages and 36 assets, and
   exited 0 with no listener left. Tests occupied the preferred port: the runner used 55000 and left
   the unrelated listener intact. Success, crawl failure and SIGINT released the owned port. A
   deliberately failed build returned CLI exit 1 before any preview was launched. Explicit-origin
   mode passed through proxy 55001 and left both target servers alive.
2. **Coverage and SEO contracts: passed.** Current production build passed all source-backed
   canonical/language/sitemap, metadata, robots, SSR, JSON-LD, resources, links, noindex, legacy
   redirects and unknown-page checks. An isolated source fixture added a valid static route and
   translated lesson; four new URLs joined discovery. Missing registry entries, empty locales or
   guides, asymmetric guides, course/guide omissions and unsupported dynamic families failed.
   Headed Chromium additionally read all 32 built pages at 1280x820 and 375x812, signed out with
   JavaScript disabled. Screenshots and the reproducible script are in ignored `tmp/`.
3. **Actual failure controls: passed.** All 25 Node tests passed, with no skip/cancellation. Twenty
   real-response faults were rejected by the same crawler with the failed rule: canonical, empty
   body, hidden ancestor, offscreen body, noindex, crawler meta, head alternate, wrong language,
   invalid JSON-LD, missing sitemap page or language, Googlebot and Bingbot disallow, X-Robots-Tag,
   Googlebot-only canonical, missing asset, indexable execution page, proxy-only HTTPS downgrade,
   dropped redirect query and soft 404.
4. **Delivery/external boundary: passed.** The complete Engineering mechanical defence exited 0:
   typecheck, production build, 78 existing tests in 9 files, 14 client chunks, 93 token-checked source
   files, tracked-source literal check, SSR import, local SEO crawl and all 25 SEO tests. No original
   required checks were removed. No console credentials, account/DNS changes, URL submissions,
   production writes, deployment or multiplayer/database changes were made.

## Deviations

No material scope departure. Source inventory reads typed product data through a narrowly scoped
Node 24 resolver and parses route/constant/course declarations with the existing Babel parser,
rather than executing a generated route tree or running another bundler. HTTP proxy faults test
served responses; the original validator negative controls remain too. A separate detached preview
is deliberately kept for review, outside the check command's owned lifecycle.

## Environment

- Node 24.16.0; pinned Playwright Chromium installed.
- Root/app npm entries added; no production dependency, image or required environment key changed.
- Existing ignored app environment loaded without printing values. Optional `INTENTFOLD_TICKET`
  selects a recorded ticket in a differently named worktree; `HEADED=1` remains optional.
- Check/test ports: 55045, 55000 and 55001; owned check/test processes stopped.
- Review preview: `http://127.0.0.1:55045`, PID 56351, built server in this ticket checkout. Only web
  runs; multiplayer 56045 and database 57045 were not started.
- Checkout: `/Users/yong/work/skatgo-ws/skatgo--SKATGO-45`.
- Branch: `codex/SKATGO-45-seo-check`. Verified implementation: `0c01f5e046ae14d8d7baab64054b0e39c6545ef0`.
- Main checkout remains clean and unchanged. No merge or release.

## Residual

Actual indexing, selected canonical, rankings, traffic and account/DNS ownership remain external
state, not local-test guarantees. Future new dynamic page families need a source-backed inventory
adapter; static routes and lesson additions derive automatically.

Install reported seven audit findings in existing dependencies (Astryx/glob, Vitest/mocker and
js-yaml); none concerns Playwright. No unrelated dependency upgrade or audit fix was included.
