# SKATGO-232 acceptance checks

Headed Playwright against the production build on 55232, multiplayer 56232, local database 57232; desktop 1280×820
and phone 375×812, English (German page load only). Test accounts `test_anna`, `test_ben`, `test_cara`. Scripts and
screenshots in `tmp/`.

1. /profile shows the avatar; "New look" changes its address, and it is the same after a reload.
2. Uploading a JPG, a PNG and a WebP each makes a 256×256 image (`naturalWidth`), ≤ 64 KB, still after a reload.
3. The face shows in the forum: the post's byline, a comment, the list's commenters — the same address as on /profile.
4. A second upload changes the address; the first address answers 404.
5. "New look" after an upload asks first; cancel keeps the picture; confirm shows a drawn avatar and the old
   picture's address answers 404.
6. A text file and a 12 MB image each show the one-line notice; the avatar address is unchanged.
7. Deleting the account removes its `player_avatars` and `forum_mentions` rows (multiplayer test).
8. Anna writes "@Ben Name hi" in a comment: Ben's unread count is 1, Cara's 0, Anna's 0 (service and
   `/api/forum/unread`); the header badge renders on a Clerk session (checked in the human's demo).
9. Ben's /profile lists the mention (Anna, the post title, the line, the time); after viewing, the count is 0;
   clicking opens the post with the comment in view.
10. /de/profile renders; no sideways scroll at 1280×820 and 375×812 on /profile and the post.
