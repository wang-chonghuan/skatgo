# SKATGO-247 plan

## What the code already does (not on the ticket)
- `FORUM_SECTIONS = ['news', 'talk']`, `OFFICIAL_SECTIONS = ['news']`, `sectionsFor(official)` in `app/src/lib/forum.ts`; the service filters every list by `p.section` and refuses a player's post into `news`.
- `/forum` shows tabs (Announcements / Discussion), the composer has section toggles for the official, a post's breadcrumb is "Forum › <section>", and SkatGo's byline mark is its section's icon.
- The front page's and /daily's "Neu" line is the newest `section = 'news'` post of the last 14 days (`forumLatest`).
- `forum_posts.section` is NOT NULL; store init already folded `articles` and `guides` into `news`.
- Old `?section=` links: the route validates the key; once sections are gone the key is simply dropped.

## Route
1. `lib/forum.ts`: drop the sections (`FORUM_SECTIONS`, `ForumSection`, `OFFICIAL_SECTIONS`, `sectionsFor`) and `section` on a post summary; `postIndexable` no longer takes it.
2. `multiplayer/src/forum.ts`: lists read every post (no section filter); create takes no section and writes the column's one value, `'talk'`; anyone signed in may post (the Forbidden check goes); the "Neu" line is SkatGo's own newest post of the last 14 days (`official`, not `section = 'news'`). The column stays, unread (no DDL); old rows keep their value.
3. `routes/forum.tsx`, `forum-api.ts`: no section in the search or the calls; `?section=news|talk` opens the one list.
4. `forum-page.tsx`: no tabs, no section toggles; one empty line; the breadcrumb is "Forum"; SkatGo's mark stays the navy megaphone (what was the announcements' mark).
5. Messages: drop `forum_sections`, `forum_section_news/talk`, `forum_field_section`, `forum_empty_news`; `forum_empty_talk` becomes `forum_empty`, same words.
6. Tests: service tests read one list; `sectionsFor` tests go; `postIndexable` without section.
7. Charter: product.md forum paragraph and ui.md forum bullet to one list (the ticket's Constraints authorise it).
