# SKATGO-196 plan

What the code already says, beyond the ticket:
- The front page's head comes from `app/src/routes/index.tsx` → `pageHead({ title: m.home_meta_title(), … })`
  (`app/src/lib/head.ts`), which writes `<title>`, `og:title` and `twitter:title` from the same string. So one
  message changes all three; nothing else reads `home_meta_title`.
- `check:seo` requires unique titles across indexable pages and `twitter:title == title`. The new German title
  differs from every other page's, including the noindexed `/de/spielen` ("Skat kostenlos spielen – ohne
  Anmeldung, ohne Werbung | SkatGo").
- No charter line fixes the home title; no test pins its text.

Route: change `home_meta_title` in `app/messages/de.json` only. English `en.json` untouched. After deploy,
the post-deploy block already submits IndexNow (SKATGO-188), so Bing hears about the changed root.
