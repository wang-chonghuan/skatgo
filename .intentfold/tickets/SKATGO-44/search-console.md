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

No Search Console settings, removals or indexing submissions were changed. The sitemap already
works; submitting it again before release would not expose these fixes. Google's German root
selection was not evidence that English was the main indexed language.

## After Release

Pending, because this ticket delivers for review and does not release:

1. Run Operations' exact deployed-commit guard and the live SEO checker.
2. Use Search Console live URL tests on the root, German course, rules, free play and daily landing.
3. Request indexing of the changed German entry pages; resubmit the existing sitemap only after
   confirming production serves the new 32-page list.
4. Wait for Google to recrawl; check root canonical, German legacy-home redirect and independent
   English page signal. Record the inspection/crawl dates, not just a green dashboard indicator.
5. Compare subsequent German query/page impressions and clicks over complete dated periods.

Google's processing and any ranking/traffic change remain unverified. Do not use removals to hide
the English page or submit fake traffic/link campaigns. Bing verification, backlink acquisition and
large new content production are deferred: they do not block this narrow technical repair.
