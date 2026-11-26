# SKATGO-247 acceptance checks

Run on the ticket's ports (web 55247, multiplayer 56247, db 57247) with a local DB holding an official post (as an announcement, `section = 'news'`) and a player's post (`section = 'talk'`).

1. Guest opens `/forum`: no `forum-sections` tabs; the list holds both the official post and the player's post. Pass = both titles in `forum-list`, no tab nav.
2. Signed-in test player clicks "New post": the composer has no section toggle; publishing lands on the post page and the title then shows in `/forum`'s list. Pass = no `forum-section-*` toggle, post visible in list.
3. A post page's breadcrumb is only the "Forum" link. Pass = breadcrumb text is "Forum", no section name.
4. `/forum?section=news` and `/forum?section=talk` each load the list (HTTP 200, both posts listed). Pass = 200 and the list.
5. `/daily` shows the "Neu" line with SkatGo's newest post when it is under 14 days old — also when it was written as a discussion post. Pass = the line links the newest official post. (Corrected from "front page and /daily": the front page has had no such line since SKATGO-131; the charter's mention was stale.)
