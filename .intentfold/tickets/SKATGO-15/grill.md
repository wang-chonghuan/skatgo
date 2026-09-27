# SKATGO-15 grill

Grill: human. One question, asked at the moment it mattered:

1. **May the agent add the TXT record at the apex of `skatgo.com` (redline 6)?** — Human: 同意新增
   (only add; the apex A stays DNS-only; `asuid` TXT untouched).

Decided without asking (no product intent involved):

- Domain property rather than URL-prefix: one property covers `www`, http and https.
- Manual TXT rather than Google's Cloudflare OAuth shortcut: no standing access for Google to the DNS
  account.
