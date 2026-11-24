# SKATGO-231 handoff

## What changed

- **The forum's design is Vercel's Geist** (`app/src/theme/geist.stylex.ts`, new registry): its colours with night
  values, radii and dimensions, read from community.vercel.com's own stylesheet and measured on its pages; Geist from
  Google Fonts (`routes/__root.tsx`, same link as the other faces, no dependency); its sizes, weights 500/600, line
  heights and tracking in `type.stylex.ts`; the forum's roles `forum*` in `type.ts`; icon sizes in `constants.ts`.
- **The forum's own kit** (`components/skat/forum-ui.tsx`): button, pill, icon button, avatar (SkatGo's logo or a
  player's initial), text field and area.
- **The forum's pages** (`forum-page.tsx`, rewritten): the navigation (Forum and the four sections) beside the
  column, a wrapping row on a phone; the home with its featured block (the newest picture with its title, the tabs
  All / Announcements / Guides), the videos row and the discussion; each section's page; a post with breadcrumb,
  byline, Geist text (`forum-body.tsx` gains a Geist look; `Rich` takes a bold style), "Watch on YouTube", a
  guide's previous and next, comments; report, delete, hide and show as 32px icon buttons.
- **Four sections** (`lib/forum.ts`): news, talk, guides, videos; players write in talk only. A guide's cover is
  its first picture (`coverOf`), a video's address its first YouTube link (`videoOf`).
- **The service** (`multiplayer/src/forum.ts`): the home (featured and videos), guides oldest first with number
  and neighbours, the newest comment on each listed post, translated; the migration (`store.ts`) moves `articles`
  to `talk`.
- **Words** (`app/messages/{en,de}.json`): the sections and the new blocks; the foot line and the "cannot load"
  line name the four sections; `forum_section_articles` and the unused `forum_empty` removed.
- **Tests corrected for the new sections**: `app/src/lib/forum.test.ts` (sections; `coverOf`, `videoOf` added),
  `multiplayer/test/forum.test.ts` (home, guides' order and neighbours, videos, newest comment, the migration),
  `multiplayer/test/forget.test.ts` (a player's post is in talk).
- **Charter** (the human's request is the authorization): product.md (the four sections; the Skat-Tricks articles
  in the discussion), ui.md (the forum's Geist design, the registry, the family), engineering.md (the forum's row).

## AC results

Headed Playwright on the production build, web 55231, multiplayer 56231, local database 57231 seeded with
production's six posts and ten comments (read-only copy) and marked samples for guides, a video and a discussion;
full log in `tmp/ac-run.txt`. All 29 checks pass.

1. Geist: home and post — family Geist (loaded), text rgb(23,23,23), secondary rgb(77,77,77), hairline
   rgba(0,0,0,0.08), avatars 40×40 round, pills 34px round with the chosen one rgb(23,23,23). PASS
2. Navigation EN "Forum | Announcements | Discussion | Guides | Videos", DE "Forum | Ankündigungen | Diskussion |
   Anleitungen | Videos"; each section lists only its own posts. PASS
3. Tabs: All shows guides and news, Announcements only news, Guides only guides. PASS
4. Discussion row: avatar, "Flinker Fuchs", "2 comments", excerpt, newest comment "Thanks – that helps…". PASS
5. Player: no section choice (Discussion only); service answers 403 to news, guides, videos. Official: four. PASS
6. Guides numbered 1, 2, 3; guide 2 links to guide 1 (previous) and guide 3 (next). PASS
7. Video link `https://www.youtube.com/watch?v=…`, `target=_blank`. PASS
8. Report on post and comment: 32×32, `aria-label="Report"`, no visible text. PASS
9. Production's articles 3–7 (seeded as `articles`, moved by the migration at start) in Discussion, addresses 200,
   post 6's comment there. PASS — post 7's 1500 / 3000 are corrected in production at release (below).
10. `/en/forum`, `/forum`, a section and a post in EN and DE at 1280×820 and 375×812: no sideways scroll. PASS

Mechanical defence (engineering.md Tools) on the final code: pass — 355 unit tests, client bundle, tokens (233
files), literal grep 0, SSR link, check:seo (62 indexable pages; the forum is not served by that preview) and
test:seo 28/28. `npm --prefix multiplayer run check`: typecheck and build pass; tests 70, the 8 of
`personas-strength.test.ts` failed only because the running ticket service held the database's leader lock, and
pass 8/8 in a database of their own.

A fresh-context look through the human's request raised: the featured picture had no title (fixed: section and
title under it); on a phone Guides and Videos were scrolled out of sight (fixed: the row wraps); the foot line named
the old sections (fixed). It also noted two "Sign in" buttons; the forum's own one beside the title is the human's
SKATGO-118 choice and stays.

## Deviations

- From plan.md: the featured block shows a picture only when one of the newest announcements and guides has one;
  without, the list stands alone (an empty grey tile read as a gap).
- From the proposed solution: video cards carry no YouTube thumbnail (Vercel's own row has none, and fetching them
  would send visitors' addresses to Google); no VideoObject data yet.

## Environment

Ports: web 55231, multiplayer 56231, database 57231 (container `skatgo-multiplayer-db-57231` on Colima `skatgo`).
No env key added, changed or removed; the services were started with `MULTIPLAYER_URL`, `DATABASE_URL`, `PORT`,
`SKATGO_TEST_ACCOUNTS=1` and `FORUM_OFFICIALS=test_admin` given on the command line only.

## Release notes for cap4

- Deploy `multiplayer` first (its routes answer the new shape and its migration moves the five articles), then
  `web`.
- Post 7 in production: "Every tier starts you at 1500 points and the next one is at 3000: those 1500 points" and
  "each tier starts you at 1500 points, 3000 moves you up" → 1000 / 2000 (and "those 1000 points"), as SkatGo's
  posts are edited, by hand.

## Residual

- A guides overview as an indexable search page (sections stay noindex views today).
- VideoObject structured data once real videos are up.
- Locally, a test account is not shown as signed in by the site's header (Clerk's); production is not affected.

## Check

The list given to the human in the review message (below).

## Decided for you

- Only the forum's content wears Geist; the site's header and footer stay SkatGo's.
- Buttons and pills are Geist's near-black, not SkatGo's green.
- The forum's home replaces the old "All" list: featured announcements and guides, videos, discussion.
- Videos are text cards that open YouTube in a new tab; no thumbnails.
- Guides are numbered by publication order.
- Empty sections say so in one line ("The first videos are on their way.").
- Night mode uses Geist's own dark values.
- Players have no pictures: an initial on grey; SkatGo's posts carry its logo.
- Dates stay dates ("Nov 7, 2026"), not "5 days ago".
- Section pages stay out of search indexes; posts and the forum's home are indexed as before.
- The foot line and the "cannot load" line now name the four sections.
