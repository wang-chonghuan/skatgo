# SKATGO-186 acceptance check

Production build on 55186/56186, test account on phone and desktop, EN.
1. **"You" tag at night:** on /daily (6 deals) the `[data-who="you"]` tag's computed background is `#1A4383`; by day it stays `#022657`.
2. **Header in one line:** on /daily (6 deals) at 375px and 1280px, the "You" tag and "Points" in the header share one line (same top, cell height equal to a single line).
3. **Front page at night:** the front page's background equals /daily's (`rgb(16, 22, 30)`); by day it stays white.
4. **Forum comments on a phone:** at 375px, signed in and as a guest, a post opens with its comments, and a signed-in user can write and send a comment.
5. **Forum sections:**
   - the forum shows the filters All, Announcements and Articles only;
   - a signed-in player's new-post form offers only the sections they may post in;
   - `?section=talk` shows all posts;
   - multiplayer rejects `section: 'talk'` on create.
6. **Loader glow at night:** `fill.loaderGlow`'s gradient resolves to white (`rgb(255, 255, 255)`) at night.
