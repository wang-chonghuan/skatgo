# SKATGO-118 draft — what the conversation settled (2026-10-22)

The human opened with Flarum and asked where to put it; the discussion moved through subdomain vs. path,
industry practice, the coming Expo apps, and whether to write our own. It settled on our own simple forum.

## Agreed approach
- Our own forum in the product's code, on the main site's paths — not Flarum, not a subdomain. Reasons the
  human accepted: the design system and the SkatGo account are used directly, the Expo apps can reuse the same
  JSON routes, search value stays on skatgo.com, no new service to run or pay for.
- Data in multiplayer's PostgreSQL behind the admission key, the web passing requests on (`/api/forum/*`), as
  the daily tournament and the ladder do. Every read and write is a JSON route, so the apps reuse them.
- The agent's 7 changes and the header link, all accepted (「都同意」): four sections (announcements official
  only, articles, discussion, feedback), user content called posts and not indexed until the official marks
  it, the latest announcement as a line on the front page and /daily for 14 days, minimal moderation (report,
  hide with a reason, delete own, daily limits, a list of reports for the official), card rows in posts, one
  forum per language, the Tricks article stays where it is and the forum links to it, "Forum" as the header's
  sixth link.

## Where the first ticket text was wrong, and what replaced it
The first filing (before the discussion) had no sections, indexed user posts like official ones and had no
moderation or announcement line. The live ticket was rewritten with the human's agreement; its Request quotes
the discussion.

## Ruled out, and why
- Flarum (PHP service, SSO bridge, theme mapping, separate deploy and cost; it cannot attach discussion to
  the product's own objects without writing extensions anyway).
- A subdomain (only right for separate forum software; it would split search value and the app links).
- Notifications of any kind, nested replies, image upload, search, profiles, likes, blocking users (later,
  with the Expo app), competitions (later, in the app).
- Editing a post or comment: not asked for; deleting one's own is.

## Premises probed
- `nameOf` in multiplayer/src/daily.ts gives any player their leaderboard name (or a new one): reusable for
  authors.
- check-seo's inventory assumes every sitemap page exists in every language and rejects dynamic routes that are
  not lessons or private: forum posts (one language each, from the database) need their own sitemap and their
  own checks.
