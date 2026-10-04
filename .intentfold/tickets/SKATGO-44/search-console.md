# Search Console Baseline

Authenticated inspection on 2026-10-04, property skatgo.com. These are Google's saved observations,
not a live crawl of this branch.

| URL | Saved observation |
|---|---|
| `/` | Indexed. Saved crawled HTML has German title, description and content. |
| `/de` | Crawled 2026-10-02; not independently indexed. Google canonical `/`, declared `/de`. |
| `/en` | Crawled 2026-09-30; not independently indexed. Google canonical `/`, declared `/en`. |
| `/de/spielen` | Indexed, crawl 2026-10-03 21:20:13; canonical agrees. Production raw HTML has a hidden H1 but no readable body. |
| `/de/kurs` | Discovered from sitemap, not crawled/indexed. |
| `/de/regeln` | URL unknown to Google. |

Sitemap submitted 2026-09-27: Success, last read 2026-10-03, 34 discovered URLs.
The Pages report still says processing data, so a total indexed count cannot be established.
The performance panel displayed 0 clicks and 2 impressions for 2026-09-26 through 2026-09-29 only.
It is not the current total traffic of the site.

At first handoff, no Search Console settings, removals or indexing submissions had been changed.
The sitemap already worked; a pre-release resubmission would not expose the unmerged code fixes.
Google's German root selection was not evidence that English was the main indexed language.

## Confirmed Console Operations

On 2026-10-04 the human requested configuration of both search consoles and explicitly confirmed
adding/verifying Bing, submitting both sitemaps and requesting the core German URLs. These operations
targeted the current production site, not the unreleased branch.

### Google

- Existing domain property `sc-domain:skatgo.com`: verified owner; public Google verification TXT
  retained unchanged. Settings reported all robots.txt files valid; AI search inclusion remained on.
- Resubmitted the existing `https://skatgo.com/sitemap.xml`. The console confirmed submission,
  retained exactly one sitemap, and showed submitted 2026-10-04, last read 2026-10-03, Success and
  34 discovered pages. The last-read date has not yet advanced.
- Requested indexing once for `/`, `/de/kurs`, `/de/regeln`, `/de/spielen` and `/de/taeglich`.
  Each request completed its live indexability test and returned `Indexing requested`: added to
  Google's priority crawl queue. This does not mean the page has been indexed.
- The refreshed saved lookup reported course/daily as unknown and rules as discovered but not
  indexed. Those observations differ from the earlier baseline and are not evidence of a penalty.
- Manual actions and Security issues both reported `No issues detected`. Temporary removals and
  SafeSearch filtering reported no requests in the last six months. The message list contained only
  two onboarding notices, not a penalty notice. No current manual penalty was found; this is not a
  claim that all historical or algorithmic ranking factors can be ruled out.

### Bing

- The existing signed-in account initially had no skatgo.com site. Added `https://skatgo.com/`
  manually, without importing GSC or granting cross-account OAuth access.
- Added the exact requested DNS-only CNAME:
  `ca6fc5fd7d1f41d62b788e61032110a4.skatgo.com` -> `verify.bing.com`, TTL 300.
  Both Google Public DNS and Cloudflare Public DNS resolved it. Bing confirmed site verification
  and successful addition. The apex, other sites and existing verification records were unchanged.
- Submitted `https://skatgo.com/sitemap.xml`. Initially Processing, then verified Success:
  submitted/crawled 2026-10-04, 34 discovered URLs, one sitemap, zero errors and zero warnings.
- Submitted the same five German entry URLs. Bing confirmed `5 URLs submitted Succesfully`, showed
  five matching rows and reduced the daily quota from 100 to 95.
- Block URLs showed zero active, expiring or expired blocks. Crawl Control remained Default;
  no custom throttling or increased crawl intensity was introduced.

No removals, account permissions, API keys, notification subscriptions, paid resources or production
game data were changed. No code was merged or deployed. IndexNow automation was not added: the
manual URL and sitemap submissions need no additional key or application release.

## After Release

Pending, because this ticket delivers for review and does not release:

1. Run Operations' exact deployed-commit guard and the live SEO checker.
2. Use Search Console live URL tests on the root, German course, rules, free play and daily landing.
3. Submit the changed German entry pages to both engines after release; resubmit the existing
   sitemap to both only after confirming production serves the new 32-page list. Today's operations
   targeted the old live version and do not verify the release.
4. Wait for Google to recrawl; check root canonical, German legacy-home redirect and independent
   English page signal. Record the inspection/crawl dates, not just a green dashboard indicator.
5. Compare subsequent German query/page impressions and clicks over complete dated periods.

Google/Bing indexing and any ranking/traffic change remain unverified. Do not use removals to hide
the English page or submit fake traffic/link campaigns. Backlink acquisition and large new content
production remain deferred; Bing verification and initial submission are now complete.
