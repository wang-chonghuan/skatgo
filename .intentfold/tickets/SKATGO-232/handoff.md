# SKATGO-232 handoff

## What changed

- **Faces** (`app/src/lib/forum.ts`): a player's face is null (the picture of their name), `{ seed }` (a look they
  drew) or `{ image }` (a picture they uploaded); `facePath`, `imagePath`, `imageTypeOf`, the size rules
  (256×256, ≤ 64 KB, files ≤ 10 MB) and `mentionCandidates`. Posts, comments and commenters carry `face`.
- **Service** (`multiplayer/src/forum.ts`, `store.ts`): tables `player_avatars` and `forum_mentions`; ops `me`,
  `unread`, `seen`, `face` (`refresh` | `upload`), `image`; mentions recorded on post and comment (longest name
  after "@", accounts only, never the writer, ≤ 10); hidden posts and comments drop out of the list and count.
  `forget.ts` deletes both tables' rows with the account.
- **Web** (`lib/forum-handler.ts`): the new ops signed-in only; uploaded pictures at `/api/forum/avatar/u/<id>`,
  immutable, a new id with each upload.
- **Pages**: `/profile` top block (`profile-me.tsx`): avatar, name, "New look" (asks first after an upload),
  "Upload picture" (browser cuts and shrinks it, `lib/face-image.ts`), one-line notice for a refused file; the
  Mentions list linking to `#comment-<id>`; opening it marks them seen. Header: an unread count on Clerk's
  picture (`frame.tsx`, `lib/use-unread.ts`). Forum bylines and commenters use the face; comments carry
  `id="comment-<id>"`.
- **Tokens**: `dims.avatarProfile`, `dims.mentionBadge`, `dims.mentionBadgeOffset`. **Words**: EN/DE.
- **Charter**: product.md (pictures, mentions on the site only, deletion), ui.md (profile block, header count,
  forum author lines), engineering.md (faces, tables, ops, file map).

## AC results

All against the production build on 55232 / 56232 / 57232, headed, script `tmp/ac.mjs`:

1. PASS — new look changes the avatar's address, kept after reload.
2. PASS — JPG, PNG and WebP each become a 256×256 WebP of about 2.5 KB, kept after reload.
3. PASS — the uploaded picture shows on the comment's byline and in the list's commenters.
4. PASS — each upload replaces the one before; the old address answers 404.
5. PASS — new look after an upload asks; cancel keeps it; confirm draws a look and the picture answers 404.
6. PASS — a text file and a 12 MB file show the one line; avatar unchanged.
7. PASS — `multiplayer/test/forget.test.ts`: no `player_avatars` / `forum_mentions` rows left for the account.
8. PASS for the count (Ben 1, Cara 0, Anna 0, guest 401). The badge itself sits on Clerk's picture, which a test
   account does not have: seeded for the human's local Clerk account — Ben mentions "Kartenfreund" in post 4.
9. PASS — Ben's /profile lists it, count 0 after viewing, the link opens the post with the comment in view.
10. PASS — /profile, /de/profile and the post: no sideways scroll at 1280×820 and 375×812.

Mechanical defence passed; multiplayer `forum` and `forget` tests pass.

## For the human

- Sign in with Gmail at http://localhost:55232/en/forum to see the red "1" on your picture, then open your profile.
- Not done: the header still shows Clerk's account picture, not the forum avatar (not asked).
