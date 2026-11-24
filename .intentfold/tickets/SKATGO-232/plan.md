# SKATGO-232 plan

## What the code already promises, and what the ticket does not say

- The forum only ever lets names out of the service, never a player id (`multiplayer/src/forum.ts`). A player's
  picture must travel the same way: the service answers each author's *face* — nothing (the picture of their
  name, as now), a seed they refreshed to, or the id of an uploaded picture — never the account.
- Avatars today: `avatarPath(seed)` draws DiceBear Avataaars of any text on the web (`lib/forum-handler.ts`), a
  year in the browser's cache. A refreshed face is a new random seed, so it is just another address.
- Nicknames have spaces ("Flinker Fuchs"), 2–20 characters (`lib/skat/nickname.ts`): "@Name" is matched by the
  longest known name after the "@".
- The header's account is Clerk's `UserButton`; a local test account is not a Clerk session, so it sees the
  sign-in button. The badge sits on Clerk's picture; it is checked with a real sign-in (the human's demo), the
  count behind it with test accounts.
- Account deletion is `multiplayer/src/forget.ts`, deleting the `OWN` tables by `player`.

## Route

1. **Store.** `player_avatars (player PK, seed, image_id UNIQUE, image bytea, image_type, updated_at)` and
   `forum_mentions (id, player, post_id → forum_posts CASCADE, comment_id → forum_comments CASCADE, created_at,
   read_at)`, one row per player and post/comment. Both join `OWN` in forget.ts.
2. **Faces in the forum.** Posts, comments and the commenters carry `face` (`Face` in `lib/forum.ts`);
   `facePath(face, name)` is the address. Uploaded pictures at `/api/forum/avatar/u/<id>`: the web asks the
   service for the bytes; immutable, as a new upload is a new id. A post's own picture (of its title) stays.
3. **Own face.** Forum ops `me` (name, face, unread count, the latest 20 mentions), `unread` (the count),
   `face` (`refresh` | `upload` with base64), `seen` (marks all read). Refresh after an upload deletes the
   picture. Upload: JPEG/PNG/WebP chosen in the browser, cropped to the centre square, drawn 256×256, WebP
   (JPEG where the browser cannot write WebP), at most 64 KB; the service checks the type by its bytes and size.
4. **Mentions.** On a post or comment, each "@" is matched against the account players' names (longest first,
   the writer excluded, at most 10 players a write); one row per player. Listed newest first, hidden posts and
   comments left out; who, the post's title, one line of the text, the time, linking to the post at
   `#comment-<id>`.
5. **Pages.** /profile, signed in: at the top the avatar (96px), name, "New look" and "Upload picture", one
   line for a refused file; then "Mentions" (only when there are any), unread ones marked; opening it marks
   them read and clears the header. Header: a small count on Clerk's picture.
6. **Charter.** product.md: players' pictures and in-site mention notices (no email, no push); ui.md: the
   profile's avatar block, the mention list, the badge, new tokens; engineering.md: the two tables, the ops,
   the upload rule, forget.
7. **Checks.** Unit tests for mention matching and the face path; multiplayer forum tests for faces, upload
   validation, mentions, seen, forget; mechanical defence; AC headed at both viewports.
