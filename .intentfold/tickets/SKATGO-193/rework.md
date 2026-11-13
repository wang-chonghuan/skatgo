# SKATGO-193 rework

Against the frozen handoff (front card one line a game, no day, cards cut with an ellipsis), one round:

1. 「你看看这个history在home上的加载速度如何，是否需要优化，这个工单里看看」 — `d40feb7`: measured first — locally the
   profile answer takes 25 ms, on skatgo.com ~300 ms at the server and ~950 ms in the browser, asked only after the page
   loaded and the browser's account was known. The front page's games are now read while the page is made, through the
   same `/api/daily/profile` handler with the page's cookies (`lib/history-api.ts`), and streamed in behind the page, not
   awaited; the browser asks only after a link on the site or a change of account. On a slowed network (300 ms latency,
   250 kB/s) the rows showed at ~10.4 s with the live version and ~3.7 s with this one, together with the page. Rechecked:
   the ticket's rows (desktop, 375, 320 px), the record unchanged, a stranger sees no games and the sign-in button, a link
   back to the front page still brings the games; the page's HTML holds 20 rows for the owner, none for a stranger.

Net effect against the handoff: the same rows, now arriving with the page. Mechanical defence run once over the final
branch before the merge.
