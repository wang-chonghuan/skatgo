# SKATGO-118 plan

## What the code already promises (and the ticket does not say)
- Every sub-page is server-rendered through `client-page.tsx`; routes may import pages only through it.
- `lib/sitemap.ts` + `scripts/seo-inventory.mjs` assume a page exists in every language, with x-default German,
  and reject a dynamic route that is neither a lesson nor private. A forum post exists in one language and
  comes from the database, so posts get their own sitemap (`/sitemap-forum.xml`, listed in robots.txt) and the
  checker gets a forum part; `/sitemap.xml` and its inventory stay as they are.
- Player names: `daily_players` via `nameOf` (multiplayer/src/daily.ts). Only names leave the service, never a
  player id — the forum follows the leaderboard's rule (`mine` flags instead of author ids).
- Server-only reads in loaders use `createIsomorphicFn` (lib/analytics.ts, lib/test-account.ts).
- No new dependency (engineering Redline 3): the post format is our own small parser rendering React elements
  (no HTML injection); inputs reuse the kit (`TextField`; a multi-line `TextArea` joins it, sized by `rows`).
- No new design token is planned; if one turns out necessary it is a stop (ui.md Redline 1).

## Route
1. **Shared rules** `app/src/lib/forum.ts`: sections (`news` official only, `articles`, `talk`, `feedback`),
   limits (title, body, comment lengths; posts/comments/reports per day), the slug, `indexable(post)` (not hidden,
   not feedback, official or marked), the body parser (paragraphs, `##`/`###` headings, `-`/`1.` lists,
   `**bold**`, `[text](https://…)` links, card rows `[♠A ♠10 ♥K]` with A K D/Q B/J 10 9 8 7). Unit tests.
2. **Storage and routes** `multiplayer/src/forum.ts`, tables in `store.migrate()` (`forum_posts`,
   `forum_comments`, `forum_reports`), routes under `/forum` behind the admission key: `list`, `post`, `create`,
   `comment`, `delete`, `report`, `reports`, `moderate` (hide / restore / dismiss / index / unindex), `latest`,
   `sitemap`. Hidden content is seen only by its author (with the reason) and the official. Authors' names from
   `nameOf`. Multiplayer tests against the local database.
3. **Web** `app/src/lib/forum-handler.ts` (`/api/forum/*`: names the player and whether the account is official —
   `FORUM_OFFICIALS`, a comma list of Clerk ids — and passes on), `lib/forum-api.ts` (isomorphic readers for
   loaders; browser actions), `server.ts` wiring and `/sitemap-forum.xml` (503 when the forum is unreachable),
   robots.txt.
4. **Pages** Paraglide patterns `/de/forum`, `/en/forum`, `…/forum/:post`; routes `forum.tsx` (list, `?section`,
   `?page`; filtered or later pages noindex) and `forum_.$post.tsx` (loader; unknown or hidden → 404; another
   language → that language's list; slug corrected by redirect; head single-language, indexable per post);
   `forum-page.tsx` (lead, section filter, list, composer, the official's reports), `forum-post-page.tsx` (post,
   actions, flat comments, comment box), `forum-body.tsx` (renders parsed bodies with `Rich` and `CardRowView`).
   `pageHead` learns a one-language, data-indexed page.
5. **Ways in** header's sixth link and the phone menu, footer link; the announcement line on the front page and
   /daily (loaders; cached a minute on the server; nothing when the forum does not answer).
6. **Legal** privacy and terms sections for the forum; `LEGAL_UPDATED`.
7. **SEO** OG pictures for the forum (`og.mjs`), check-seo's forum part (forum sitemap: one-language alternates,
   every post validated like a page; a missing post 404s; 503 only accepted off production), inventory knows the
   database-backed route, test:seo negative control.
8. **Charter and docs** product.md, ui.md (header's six links, forum pages, announcement line), engineering.md
   (module, routes, tables, env, sitemap), operations.md (web env `FORUM_OFFICIALS`, forum routes),
   multiplayer/README.md, app/scripts/README.md.

Local acceptance uses test accounts (`SKATGO_TEST_ACCOUNTS=1`), with `FORUM_OFFICIALS=user:test_admin` in the
worktree's app/.env. Production needs `FORUM_OFFICIALS` set to the owner's Clerk id at deploy (operations.md).

## Redline lookup (before code)
- engineering 3 (dependencies): none added. 4 (route imports): routes use `clientPage` only. 5 (generated
  files): not hand-edited. 6 (server refs in browser): server reads live in isomorphic server branches and
  handlers; the bundle check runs. 7 (weakening checks): the SEO checker is extended for a new page kind, not
  loosened — the existing sitemap's rules are untouched.
- ui 1 (token registries): no change planned; 2/3: StyleX only.
- operations 2 (production data from acceptance): acceptance is local only. 3/4/5: no cloud resource, no new
  service, no DNS. Production env var `FORUM_OFFICIALS` is set at deploy time, not by this ticket.
- product / charter edits: asked for by the human's request (Constraints).
