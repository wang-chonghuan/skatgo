# SKATGO-15 plan — 把 skatgo.com 加入 Google Search Console

No product code changes. Operations in the human's signed-in Chrome (Search Console) and the Cloudflare
`skatgo.com` zone, following ips-golive cap4.

1. Add a **Domain** property `skatgo.com` (covers www and every protocol). Decline Google's
   "authorise Google to access Cloudflare" shortcut (an OAuth grant); choose "Any DNS provider" to get the
   `google-site-verification` TXT value instead.
2. List existing records in the zone first; add the TXT at the apex — add, never replace. DNS writes in
   this zone need the human's approval (operations.md redline 6), asked once.
3. Confirm the record on the authoritative server and a public resolver, press Verify.
4. Confirm `https://skatgo.com/sitemap.xml` serves 200 XML and robots.txt points at it; submit it.
5. Record evidence and residuals.
