# SKATGO-118 Handoff

Delivered for review (`finish: review`). No merge, deployment or production data change. The approach was
agreed in discussion before any code (`draft.md`), so there was no grill.

## What Changed

**The forum's rules, shared** (`app/src/lib/forum.ts`, tested by `forum.test.ts`)

- Sections `news` (official only), `articles`, `talk`, `feedback`; lengths; `DAILY_LIMITS` (5 posts, 30
  comments, 20 reports a day, the official unlimited); `postIndexable` (official, or marked by the official;
  never hidden, never feedback); the address `/forum/<id>-<slug>` (German letters spelt out); the text's marks
  (`parseBody`: paragraphs, `##`/`###`, `-`/`1.` lists, `**bold**`, `[text](https://…)` and bare https links, a
  line `[♠A ♠10 ♥K]` as a card row with A K D/Q B/J 10 9 8 7).

**Storage and routes** (`multiplayer/src/forum.ts`, tables in `store.ts`, tested by `test/forum.test.ts`)

- `forum_posts`, `forum_comments`, `forum_reports` (once per reporter and thing). Routes under `/forum` behind
  the admission key: `list`, `post`, `create`, `comment`, `delete`, `report`, `reports`, `moderate`
  (`hide` with reason / `restore` / `dismiss` / `index` / `unindex`), `latest`, `sitemap`. Hidden content only
  for its author and the official; authors under their leaderboard name (`nameOf` exported from `daily.ts`);
  `mine` instead of any account id. 403 non-official announcement, 404 unknown/hidden, 429 past the limit.

**Web** (`app/src/lib/forum-handler.ts`, `forum-api.ts`, `server.ts`, `public/robots.txt`)

- `/api/forum/<op>`: names the viewer and whether the account is in `FORUM_OFFICIALS`; refuses a browser
  that names either; writes need a session (401). `/sitemap-forum.xml`: indexable posts, each with only its
  own language as alternate; 503 while the forum does not answer; announced in `robots.txt`.
- Loaders read through `createIsomorphicFn` (server: straight to the forum as the request's viewer; browser:
  `/api/forum`). The announcement is cached a minute on the server and waits at most 1.5 s.
- A post the forum cannot answer for goes out as 503 with `retry-after` (the loader marks the response,
  `server.ts` sets the status — the router itself only answers 200/404/500); the list stays a 200 page with
  a line saying the posts cannot be read now.

**Pages** (`routes/forum.tsx`, `routes/forum_.$post.tsx`, `components/skat/forum-page.tsx`, `forum-body.tsx`,
`forum-announcement.tsx`; Paraglide `/de/forum`, `/en/forum`, `…/forum/:post`)

- List: H1, lead, the sign-in line or "Neuer Beitrag" (`go`) and the composer (section `Toggle`s, title,
  text, the marks' hint, Veröffentlichen / Abbrechen), the official's reports panel, the section filter
  (links), the link to the Skat-Tricks article, posts as white cards (title over one line of small facts:
  section, author or "SkatGo" in green, date, comments), older/newer pages. The reports panel shows only while
  there are open reports. The forum's pages are on the grey sub-page background (`frame.tsx` `sectionOf`). A filtered or later page is noindex.
- Post: "← Alle Beiträge" and the section, H1, facts, a hidden post's reason, the text, actions (Melden;
  Löschen with a second confirmation; for the official Ausblenden / Wieder anzeigen and, on a player's
  non-feedback post, Für Suchmaschinen freigeben), flat comments with the same actions, the comment box with
  the "@Name" hint or the sign-in invitation. A post asked for in the other language goes to that language's
  list; a wrong slug is corrected with a 301. Article or DiscussionForumPosting JSON-LD, breadcrumbs.
- `pageHead` learns a one-language page (`only`), a data-decided `indexable` and a filtered view (`search`).
- Kit: `Toggle` moved from `daily-page.tsx` into `ui.tsx` with `toggleLook` for links; new `TextArea`
  (grows with its text, `field-sizing: content`).

**Ways in**: the header's sixth link "Forum" and the phone menu (`frame.tsx`), the footer (`legal-footer.tsx`),
the announcement line above the front page's headline and under `/daily`'s lead (both routes got a loader).

**Legal** (`lib/legal.ts`, both languages, updated 2026-10-22): a forum section in privacy (what is stored,
public under the leaderboard name, reports seen by the operator, no notifications, deleting, indexing) and in
terms (rules, reporting, hiding with a reason, rights to one's text).

**SEO** (`scripts/seo-inventory.mjs`, `check-seo.mjs`, `seo.test.mjs`, `app/public/og/forum-{de,en}.png`): forum
posts are a database-backed route (`DATA_PAGES`); the checker reads `/sitemap-forum.xml`, requires one-language
alternates in the right language's address, validates every post like any page, and asks for a missing post's
404; where the forum does not answer it says so — on the published site that fails. Two new negative controls
(two-language post, forum soft 404) and inventory tests.

**Charter and docs** (asked for by the request; Constraints): product.md (the forum's paragraph and the list
of what the product is), ui.md (footer, kit rows, widgets, six header links, hero and daily line, the forum's
pages), engineering.md (stack, accounts, structure, routes, key decision on one-language posts and their
sitemap, SEO tools), operations.md (runtime, multiplayer routes, `FORUM_OFFICIALS` locally and in production,
deploy order), `multiplayer/README.md`, `app/scripts/README.md`.

## AC Results

Local: web built server on 55118, multiplayer on 56118, its own database on 57118; Chromium headed at
1280×820 and 375×812 (`isMobile`, `hasTouch`), local test accounts (`test_admin` official). Script
`tmp/ac.mjs`, screenshots in `tmp/shots/`. The forum tables were emptied first.

1. PASS — without JavaScript `/de/forum` listed the 3 German posts and not the English one, `/en/forum` only
   the English one; a post showed title, text, author, date, section and both comments.
2. PASS — the official's composer offered news/articles/talk/feedback and published an announcement and an
   article with the SkatGo pill; a player's offered articles/talk/feedback only and published under
   "Bunte Gazelle"; an announcement by the player through the route → 403; no account id or email on the list.
3. PASS — the list showed all sections; each filter showed only its section.
4. PASS — two comments in the order written, "@Bunte Gazelle …" as written, no reply control; the only API
   requests were `/api/forum/comment` and the reload's `/api/forum/post`.
5. PASS — a guest saw the sign-in invitations, no composer or comment box; create/comment without a session → 401.
6. PASS — `[♣B ♠B ♥A ♥10 ♥K ♦A]` rendered as the cards CJ SJ HA H10 HK DA.
7. PASS — the line on `/` and `/de/taeglich` led to the German announcement, on `/en` and `/en/daily` to the
   English one; with the announcements moved 15 days back (local database) it was gone from all four.
8. PASS — the player's post was noindex and absent from `/sitemap-forum.xml` until the official marked it,
   then index and listed; a feedback post had no control, the route refused (409), it stayed noindex.
   `npm run check:seo -- http://127.0.0.1:55118`: OK, 50 indexable pages, 3 forum posts, 60 noindex pages.
9. PASS — a report reached the official's list; hidden with a reason → 404 for others and gone from their
   list, the author saw the reason; the author deleted her comment and a post (then 404); the sixth post of a
   day was refused with "Für heute ist Schluss: höchstens 5 Beiträge am Tag."
10. PASS — the header link on `/`, `/de/regeln`, `/de/taeglich`, `/de/forum`, the footer link on each, the
    phone menu's link opens the forum; the articles section links to `/de/skat-tricks/12-tricks`.

Mechanical defence (engineering.md) passed: typecheck, build, 286 unit tests, client bundle, design tokens,
literal grep 0, SSR link, `check:seo -- --built` (50 pages, 3 forum posts), `test:seo` 28/28.
`npm --prefix multiplayer run check`: 27/27, the forum's test included. With the multiplayer service stopped,
`check:seo -- --built` passed with "forum not checked", posts answered 503 and the list 200.

## Deviations

- From `plan.md`: post and comment boxes grow with their text instead of a fixed number of rows — a fixed
  height would be a new design value (ui.md Redline 1) and no existing token fits.
- The official writes as "SkatGo" (the pill) rather than under the owner's leaderboard name, which is a
  random two-word name.
- Each post page links its section beside "← Alle Beiträge" (a second contextual link the SEO rules ask of an
  indexable page).
- Editing a post or comment is not offered (not asked for; deleting one's own is).
- After a fresh-eyes review of the screenshots: the forum moved onto the grey sub-page background (it was
  white, like every page the frame does not name), the facts under a title became one even line of small
  text, the announcement's title is an underlined link beside a soft "Neu" pill (no second green in the
  hero), the lead no longer repeats the sign-in line, the reports panel hides when empty, search-engine
  status shows only to the official and not on hidden posts, and the daily-limit refusal names only the
  limit that was hit.

## Environment

- Ports: web 55118, multiplayer 56118, database 57118 (container `skatgo-multiplayer-db-57118`).
- `app/.env`: **added** `FORUM_OFFICIALS` (local value `test_admin`); `SKATGO_TEST_ACCOUNTS=1` (local only, as
  operations.md says); `MULTIPLAYER_URL` pointed at this ticket's port for the run.
- `multiplayer/.env`: `DATABASE_URL` pointed at this ticket's database port for the run.
- Local data: the acceptance run's posts stay in the ticket's database; the announcements' dates were set back
  to now afterwards so the line shows.
- Production needs `FORUM_OFFICIALS` = the owner's Clerk account id on the `skatgo` web service at deploy;
  multiplayer deploys first (new tables and routes).

## Residual

- The Skat-Tricks page, its article and the legal pages are on a white background, though ui.md puts every
  sub-page on the grey one (`sectionOf` sends every path it does not name to the front page's white). Not
  changed here: it is a visible change to pages this ticket does not touch.
- A client-side move into the forum shows an empty page for about 0.8 s while its code and posts load (no
  loading line); a fresh page load renders on the server at once.

- Blocking users and deleting a SkatGo account's forum content with the account — needed for the App Store /
  Google Play apps (Expo), as agreed.
- Fonts still come from Google Fonts on every page (not this ticket's change).

## Check

1. The text boxes of the composer and the comment box start one line high and grow as you type: a fixed
   taller box needs a new size token (ui.md Redline 1) — say if you want it, and how tall.
2. The header says "Anmelden" in the local test accounts: they are not Clerk sessions, so the header (Clerk)
   does not know them; a real sign-in shows the avatar. To act as SkatGo locally, run in the browser console
   `document.cookie='skatgo_test_account=admin.'+Date.now()+';path=/'` and reload.
3. http://localhost:55118/de/forum — the list as a guest: the cards, the section pills, the Tricks link.
4. http://localhost:55118/de/forum/2-wann-lohnt-sich-ein-grand — an official article with a card row.
5. http://localhost:55118/de/forum as SkatGo (item 2) — write an announcement and an article.
6. http://localhost:55118/ (German browser) or http://localhost:55118/en — the announcement line above the
   headline; also under the lead of /de/taeglich.
7. Phone width: http://localhost:55118/de/forum and a post — the composer and the comment box.

## Decided for You

- Post and comment boxes grow with what is written rather than having a fixed height.
- SkatGo's own posts and comments show the "SkatGo" pill instead of a player name.
- Limits: 5 posts, 30 comments and 20 reports per account per day; titles 3–120 characters; posts up to
  20,000 characters, comments up to 3,000.
- No editing, only deleting one's own; deleting a post deletes its comments.
- Dates are shown as the day in UTC (the same on the server and in the browser).
- The announcement line sits above the front page's headline and under `/daily`'s lead.
