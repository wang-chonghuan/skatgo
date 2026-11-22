# SKATGO-226 rework

## Round 1 — 「同意，处理好这个工单，上线了，然后再开始新工单」 (2026-11-22)

The human, after looking at the Skat Palast comparison page: 「那你这个比较有啥用，我认为你文案不好，没突出我的优点，而且对比页面内部布局太稀疏……先和我讨论」. The discussion settled on a multi-site comparison page as a new ticket, and on landing this ticket with item 1 only.

- Removed item 2 entirely: the route `/skat-palast-alternative`, `palast-page.tsx`, its URL pattern, the `client-page` entry, the `PAGES` entry, About SkatGo's link, all `palast_*` / `about_palast_link` messages (English messages are again identical to main), and the page's entries in `product.md`, `engineering.md` and `ui.md`.
- Kept item 1 unchanged: German says "Computer" for the opponents; the German front page's new search description.
- Live ticket amended (Scope item 2, AC 3 and 5 marked moved out); `ac.md` trimmed to criteria 1 and 2 plus "no Skat Palast in the front page title or header".
- Rechecked: AC 1, AC 2 and the title/header check on the rebuilt app (headed Chromium, 8 checks pass); `/de/skat-palast-alternative` answers 404. Mechanical defence passed on the reworked branch (`check:seo`: 52 indexable pages, as on main).

Net effect against the frozen handoff: only "What changed" item 1 and its AC results remain true; everything the handoff says about the Skat Palast page, its sources, its charter entries and its Check items 1, 3 no longer applies to this delivery.
