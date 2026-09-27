# SKATGO-15 handoff — 把 skatgo.com 加入 Google Search Console

## What changed

No product code. Outside the repo:

- **Search Console** (human's Google account): Domain property `sc-domain:skatgo.com` added and
  verified ("Ownership verified", method: domain name provider). Google's one-click Cloudflare OAuth was
  declined; verification is by a manual TXT record.
- **Cloudflare, zone `skatgo.com`**: one record added, approved by the human (redline 6):
  `TXT skatgo.com "google-site-verification=ujF0PlMiMRmTBxr1xsnROxwYV-zIWx8yFlL_X3EEUp4"`, TTL auto,
  comment "SKATGO-15 …", record id `df46b0fb…`. Nothing else touched: the apex A is still DNS-only, the
  `asuid` TXT and all CNAMEs unchanged (listed before and after). **Removing this TXT un-verifies the
  property.**
- **Sitemap** `https://skatgo.com/sitemap.xml` submitted.

## AC results

1. **Property verified — pass**: GSC dialog "Ownership verified"; the property's Overview opens and
   says "Processing data, please check again in a day or so".
2. **Sitemap submitted — pass (submission)**: listed under Submitted sitemaps, 27 Sept 2026. Its status
   reads **"Couldn't fetch"**, and URL Inspection shows the sitemap as "Temporary processing error" —
   Google's usual state for a sitemap on a property minutes old. The file itself is sound: 200,
   `application/xml` (also to a Googlebot user agent), well-formed XML, 6 `<loc>`, and `robots.txt`
   allows everything and names it. Recheck in 1–3 days; if it still says "Couldn't fetch", resubmit.
3. **DNS — pass**: the TXT is served by the authoritative server (`aragorn.ns.cloudflare.com`) and by
   1.1.1.1. 8.8.8.8 still returned its cached "no TXT" for the first minutes (negative caching); Google
   verified anyway.

## Found along the way (not changed — needs a ticket if wanted)

URL Inspection for `https://skatgo.com/en`: Google has **already crawled it** (27 Sept 2026 03:18,
Googlebot smartphone, fetch successful, indexing allowed) but did **not index it**: "Duplicate, Google
chose different canonical than user" — user-declared canonical `https://skatgo.com/en`, Google-selected
`https://skatgo.com/`. Likely cause: `/` answers **307 (temporary)** to `/en`, and the pages declare
`hreflang="x-default"` → `https://skatgo.com/`; with a temporary redirect Google keeps the source URL as
canonical, so the English home is folded into `/`. Options for a follow-up ticket: make `/` a permanent
redirect (301/308) or serve content at `/`, and/or point `x-default` at a URL that answers 200. The same
pattern probably applies to `/de` and `/zh` only via hreflang (not checked in GSC).

## Environment

No ports used, no env keys added or changed. Cloudflare credentials read from the shell, never printed.

## Residual

- Data starts today and does not backfill; Performance/Indexing reports fill in over 2–3 days.
- Bing Webmaster Tools not set up (optional in ips-golive cap4; it can import from GSC).
- Canonical issue above.
