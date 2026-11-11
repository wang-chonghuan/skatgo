# SKATGO-186 plan

## Found in the code (not on the ticket)
- **The "You" tag** is `Who` in `daily-comparison.tsx` (`whoYou`: `color.navy` fill, `onColor` text). It is used in the 6-deal "Today's deals" header, the per-deal score sheets and the deal reviews. Since SKATGO-184, `navy` is near-white at night (`#EAF0F7`), so the tag turns a pale chip with white text.
- **The header's "You" + "Points"** sit in one flex cell (`headWho`) with `flexWrap: 'wrap'`. It wraps when the `minmax(0, 1fr)` column is narrow.
- **The front page's background** is `color.surface` (`skat-layout.tsx` `landing`). By day it is white like the cards; at night it is `#19212B`, while sub-pages such as /daily are `color.page` (`#10161E`).
- **The loader's glow** is `fill.loaderGlow`, a radial gradient of `color.surface`, so it goes dark at night.
- **Forum sections:** `FORUM_SECTIONS = ['news', 'articles', 'talk', 'feedback']` in `app/src/lib/forum.ts`. Multiplayer imports the same list (`multiplayer/src/forum.ts`), so both services deploy, multiplayer first.
  - `feedback` has two special cases in multiplayer, "not markable" and "never in the sitemap", and one in `forum-page.tsx`.
  - No DB constraint on `section`. Production has 0 posts in `talk` or `feedback` (4 articles, 1 news, all official).
  - `?section=talk` falls back to all posts (`validateSearch`).
- **Forum comments on a phone:** in production, as a guest on a 390px phone (Chromium), the list opens a post, and its 5 comments and the sign-in line show. No console error. The signed-in path (comment box) is checked locally.

## Route (one commit per item)
1. **"You" tag:** new token `youTag`, `#022657` by day (navy, unchanged) and `#1A4383` at night, a dark blue chip with white text. `whoYou` uses it.
2. **Header:** `headWho` does not wrap (`nowrap`). The cell's columns are checked at phone width so the two fit.
3. **Front page at night:** new token `homePage`, `#FFFFFF` by day and `color.page`'s night `#10161E` at night. `skat-layout` `landing` uses it.
4. **Forum comments on a phone:** find the failure (signed-in phone, the comment box, Android/iOS widths) and fix it.
5. **Forum sections:** remove `talk` and `feedback` from `FORUM_SECTIONS`, their messages, their special cases and tests. `home_forum_text` named them ("News, articles, discussion and feedback."), so it now names what is left.
6. **Loader glow:** `fill.loaderGlow` draws in white day and night (`color.onColor`).

## Redlines
- **ui.md Redline 1** (registries): items 1, 3 and 6 change `color.stylex.ts` and `elevation.stylex.ts`. Each is the human's direct colour request, so the request is the approval (recorded in `grill.md`).
