# SKATGO-118 acceptance checks

Local only: web + multiplayer + local database on the ticket's ports, the production build, Playwright headed at
1280×820 and 375×812. Accounts: `skatgo_test_account` cookies; `test_admin` is official
(`FORUM_OFFICIALS=user:test_admin`), `test_anna` and `test_ben` are ordinary.

1. **Reading, one forum for both languages, without JS** — seed a German and an English post with comments; with
   JavaScript disabled, `/de/forum` and `/en/forum` list the same posts, whatever their language, under German and
   English page words; a post page (both addresses) shows title, body, author name, date, section and every
   comment. True when all are in the server's HTML. (Rework 1, the human: 「德语和英语论坛不要分开」.)
2. **Who may post what** — `test_admin` posts in news and articles, each with the official badge; `test_anna` sees
   only articles/talk/feedback in the composer and posts one; a direct `/api/forum/create` with `section: news`
   as `test_anna` is refused (403). No email appears anywhere (names are leaderboard names). True when all hold.
3. **Section filter** — the list shows all sections by default; each filter pill shows only its section.
4. **Flat comments, @ as text** — `test_ben` comments "@Name …" on anna's post; comments are in time order with no
   reply control; the @ text shows as written; no notification UI or request exists (network log).
5. **Signed out** — a guest sees an invitation to sign in instead of the composer and comment box; direct
   `create`/`comment` without a session answer 401.
6. **Card rows** — a post with `[♠A ♠10 ♥K]` shows three playing cards (`PlayingCard` SVGs) in a row.
7. **Announcement line** — after the news post, the front page and /daily in both languages show one line
   linking to the newest announcement, whatever its language; with the announcement's date moved 15 days back in the local
   database, the line is gone.
8. **Indexing** — `npm run check:seo` with the forum running: the official posts are in `/sitemap-forum.xml`
   at their German and English addresses with the usual alternates and pass the page checks; anna's post is `noindex` and absent until the official
   marks it, then present and indexable; a feedback post stays `noindex` even when the official tries (no
   control offered, route refuses); the existing SEO checks pass.
9. **Moderation** — `test_ben` reports anna's post; `test_admin` sees it in the reports list, hides it with a
   reason; ben and guests get 404 for it and do not see it listed; anna sees it with the reason. anna deletes
   her own comment and post; a third post in a day beyond the limit (lowered limit not possible — use the real
   limit) is refused with the reason shown.
10. **Ways in** — header (desktop) and menu (phone), and footer, link to the forum on pages with the header;
   the forum's articles section links to the Skat-Tricks article.
