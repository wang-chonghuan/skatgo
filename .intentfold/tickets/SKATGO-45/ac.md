# Acceptance Check Plan

## AC 1: Current-Code Command And Process Ownership

Run the root `npm run check:seo` in the ticket worktree with no manually started web server.
Observe a fresh production build, identified loopback target, non-empty crawl counts and exit 0.
After completion, verify the selected port has no remaining owned listener. Repeat with a failed
build or failed crawl and interruption; failure must propagate and owned processes must stop.
Occupy the preferred port with a separate local listener: the command must not reuse or stop it.
Explicit-origin mode must perform only read-only checks and leave the target process intact.

## AC 2: Coverage And SEO Contracts

Use the current built production surface and its authoritative page, language and lesson sources.
Check exact sitemap coverage, canonical/reciprocal alternates, German root and independent English,
robots directives, visible no-JavaScript main content, unique metadata, accurate structured data,
resources and links, noindex execution pages, permanent HTTPS/query-preserving redirects and 404s.
Introduce a legitimate derived target in an isolated fixture and verify it joins discovery; remove
an expected sitemap entry or language and verify it fails rather than reducing the expected count.
Do not assert that the product must forever contain 32 pages.

## AC 3: Failing End-To-End Controls

Against the local built preview only, intercept/serve one defective response per scenario:
wrong canonical, missing sitemap entry/language, empty or hidden main content, inappropriate
noindex, crawler-blocking robots, missing asset, downgraded or query-losing redirect, and unknown
URL returning 200. The same crawler must return nonzero with the failed rule and affected target.
No player actions, database mutation, authenticated consoles or production changes.

## AC 4: Delivery And External-State Boundary

Run the documented mechanical defence with the integrated local npm SEO gate.
Invoke explicit-origin mode and verify it neither requests indexing nor uses console credentials.
Retain release-identity verification as a separate prerequisite to production acceptance.
Usage/output must distinguish rendered crawlability from external indexing/ranking/traffic.
Run existing required typecheck, build, rules tests, bundle/token/literal and SSR-link checks.
