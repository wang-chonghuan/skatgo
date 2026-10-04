User request: finish Google Search Console and Bing configuration; explicitly confirmed site verification, sitemap submission and core German URL requests on 2026-10-04.

# Console Configuration Follow-Up

The first `handoff.md` remains frozen. This round changes console/DNS configuration and its records,
not product code. The ticket's finish stays review; no merge or deployment.

## Delivered and Verified

- Retained Google's verified domain property and ownership TXT. Confirmed valid robots.txt.
- Google accepted resubmission of the existing sitemap. Exactly one row: submitted 2026-10-04,
  last read 2026-10-03, Success, 34 pages.
- Google completed live indexability testing and returned `Indexing requested` for all five core
  German entries: root, course, rules, free play and daily landing.
- Bing independently verified the added skatgo.com site via the exact DNS-only CNAME. The record
  resolves at public resolvers; no GSC import/OAuth grant, apex or unrelated-property change.
- Bing read the sitemap: Success, 34 URLs, zero errors/warnings, submitted/crawled 2026-10-04.
- Bing accepted the five matching entry URLs: five rows, success message, quota 100 -> 95.
- Bing has zero URL blocks and default crawl control. Google's manual-action/security reports
  contain no current issues; recent removal/SafeSearch-request lists are empty. No penalty inferred
  from canonical clustering or missing indexing.

`search-console.md` carries the exact observations and DNS name; Operations carries the maintained
console and ownership addresses. The backend follow-up comment records the user's both-console
amendment and its observed results.

## Verification Boundary

This round's authoritative evidence was the authenticated native browser, public DNS resolution
and live sitemap HTTP 200. Product code and dependency files are unchanged, so the original 78-test,
build and headed acceptance evidence remains valid and was not rerun for documentation-only edits.

Both submissions target the old production surface, still 34 sitemap URLs. The reviewed branch's
32-page sitemap and corrected canonical/SSR behavior are not released. After release, run the exact
commit guard and live SEO checker, then repeat changed-URL/sitemap submissions against that version.
Actual indexing, ranking and traffic outcomes remain unverified.

No API keys, notification subscriptions, paid resources, account permissions or player data changed.
No IndexNow automation was introduced. Existing preview services remain available for review.

## Authorized Release Repair

Human ask on 2026-10-04: close the ticket and publish. PR #43 landed as
`6467c305207d4266842bea488b4cc062e3e6d7e7`. The final mechanical defence passed again.
After backend closure, that exact web commit deployed successfully; multiplayer was not deployed.
The post-release checker verified all 32 pages, content, metadata and resources, then correctly
failed because `/de` and `/de/` returned an absolute HTTP Location behind Render's TLS proxy.
The ticket was reopened rather than recording this failed release criterion as passed.

This repair uses a same-site relative 301 Location, preserving the visitor's public HTTPS and
query without trusting proxy headers or changing the infrastructure. The checker retains every
assertion and now waits for page resources to load before inspecting loaded stylesheets; the
no-JavaScript document previously raced that observation.

Frozen first-delivery evidence stays unchanged. The replacement worktree retains the original
baseline and ports, with branch `codex/SKATGO-44-https-redirect`. No dependency, environment,
game rules, player data or DNS change is required. The repair must pass the mechanical defence
and same live SEO checker before successful release is reported. Final results belong in the
backend release comment.

Repair verification: typecheck, production build, 78 tests, 14 client chunks, 93 token-checked
sources, literal check and SSR linking passed. Headed no-JavaScript acceptance on the built
web port passed: 32 indexable pages, two noindex links, 36 assets and both negative controls.
A request with the public Host and forwarded HTTPS header returned 301 with
`Location: /?source=seo`, independently of the internal HTTP request URL.
