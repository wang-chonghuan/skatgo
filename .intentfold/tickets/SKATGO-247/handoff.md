# SKATGO-247 handoff

## What changed
- Forum is one list: SkatGo's and players' posts together, newest first (or most active), searchable. No "Announcements"/"Discussion" tabs.
- Composer has no section choice; any signed-in player posts (the service no longer refuses a player's post anywhere).
- A post's breadcrumb is the one link "Forum". SkatGo's byline mark is the navy megaphone (the announcements' mark of before).
- `/daily`'s "Neu" line is SkatGo's own newest post of 14 days (was: newest `news` post).
- Old `/forum?section=news|talk` open the list.
- Files: `app/src/lib/forum.ts` (sections removed), `multiplayer/src/forum.ts` (no section filter/check; new posts write `'talk'`; latest = official), `app/src/routes/forum.tsx`, `app/src/lib/forum-api.ts`, `app/src/components/skat/forum-page.tsx`, `forum-announcement.tsx` (comment), messages (section keys dropped, `forum_empty_talk` → `forum_empty`, `forum_about` reworded), tests, charter `product.md` + `ui.md`.
- DB: no DDL or data change; `forum_posts.section` stays, unread.

## AC results (local, web 55247 / multiplayer 56247 / db 57247)
1. PASS — guest `/en/forum`: no tabs; old announcement, SkatGo's talk post and a player's post all listed.
2. PASS — signed-in test player: composer has 0 section toggles; published post listed.
3. PASS — post page breadcrumb text "Forum".
4. PASS — `?section=news` and `?section=talk`: 200, all three posts listed.
5. PASS — `/en/daily` line shows SkatGo's newest post (written as a discussion post). AC5 corrected from "front page and /daily": the front page has had no such line since SKATGO-131 (ticket comment).
Mechanical defence: all parts green (one SEO failure fixed, see Deviations); multiplayer check 70/71 with the League test timing out under load, passing alone (171 s).

## Deviations
- `forum_about` reworded ("news from SkatGo, articles on Skat technique, and players' questions and feedback, all in one list"): without the tab labels the forum page had under 200 characters of SSR text when the service is down, failing `check:seo`.
- Charter's stale "front page and /daily" fixed to /daily.

## Environment
Ports 55247 / 56247 / 57247. No env keys added, changed or removed.

## Residual
None.

## Check
1. Guests still sign in to post ("谁都能" read as everyone with an account; posting without an account would lose daily limits and reports).
2. `/en/forum` — one list look; SkatGo posts marked only by the green "SkatGo" name.
3. The forum's foot line, reworded.

## Decided for you
- Guests sign in to post, as before.
- `/daily`'s "Neu" line = SkatGo's newest post of two weeks.
- SkatGo's byline mark stays the navy megaphone.
- Stored `section` column kept and unread; no migration.
- Foot line reworded (needed by the SEO check).
