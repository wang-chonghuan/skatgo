# Implementation Plan

## Findings

- The existing search checker already observes the built site with JavaScript disabled and checks
  most SKATGO-44 invariants. It should remain the single crawler.
- It defaults to production, is absent from npm scripts, and resolves Playwright from an external
  installation. A future developer can check old production instead of the code being delivered.
- Sitemap-only discovery cannot establish that an otherwise valid page was omitted. The product
  owns route declarations, localized URL patterns, lesson guides and indexability; use those
  authoritative sources to check completeness without duplicating a fixed page list.
- Page visibility currently checks only selected computed styles; robots protection only catches
  a whole-site wildcard block. Strengthen those observations without removing existing assertions.
- There is no CI. Engineering requires local mechanical defence, and Operations requires a
  release-identity guard before the production crawl. Neither should be replaced or bypassed.
- Root has no npm package today; Engineering explicitly calls app and multiplayer standalone.
  A minimal root command dispatcher therefore needs a narrow Charter correction.

## Approved Decisions

The human approved the complete question in `grill.md` on 2026-10-04. Playwright, the root dispatcher
and narrow Charter corrections are authorized; review remains the delivery boundary.

## Implementation Route

1. Add a private dependency-free root dispatcher and the app npm entry. Pin Playwright as an app
   devDependency and document Chromium installation. Keep app and multiplayer independently owned.
2. Add a local runner that builds the current app, launches its built server on the ticket/main
   web port or a free port in the allowed block, refuses to reuse unrelated processes, waits for
   readiness, and cleans up only its own child process on success, failure or interruption.
   An explicit origin invokes a read-only crawl without starting or stopping that server.
3. Reuse and strengthen `app/scripts/check-seo.mjs`: authoritative page completeness, loaded
   visible SSR content, crawler-specific rules, metadata/structured data, resource and link
   responses, independent language URLs, noindex execution pages, proxy-aware HTTPS redirect
   preservation and unknown-page status. Derive targets; do not preserve a 32-page expectation.
4. Exercise real response-level regressions against the built preview so the crawler, not merely
   an isolated validator, rejects representative broken states. Cover runner cleanup and wrong
   target risks too. Test mutations never reach production or player APIs.
5. Update only relevant usage and Charter command sections. Put the npm SEO entry in the required
   local delivery defence and retain the production commit guard before the same explicit-origin
   entry. Be clear that passing checks does not promise indexing, rankings or traffic.
6. Run mechanical defence and focused acceptance, record evidence, and hand off for review.

## Redline Lookup

- Engineering dependency changes: explicit approval required for Playwright devDependency.
- Human-owned Charter: explicit approval required for root dispatcher and command integration.
- No generated file edits, credentials, weakened assertions, production writes or deployment.
- No account, DNS, browser permission, external-console or multiplayer state changes.
- All development remains in the ticket worktree; main stays untouched.
