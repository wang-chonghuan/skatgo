# SKATGO-186 handoff

## What changed (one commit per item)
1. **"You" tag at night:** the tag has its own token `youTag`: navy `#022657` by day (unchanged) and a deep blue `#1A4383` at night, with white text. It used `navy`, which turns near-white at night.
2. **"You Points" header on one line:**
   - the header cell no longer wraps;
   - on a phone the deal-number and chevron columns narrow (`dims.vsAiColumnsPhone`, 2.5em and 2em instead of 3.5em and 5em), so the two score columns have room;
   - one line from 360px up, EN and DE. At 320px the text runs 5px into the column gap, not into the AI column.
3. **Front page at night:** its background is the new token `homePage`. It is white by day (unchanged) and `#10161E` at night, the same as /daily and every sub-page.
4. **Forum on a phone:**
   - **Cause:** in the list only a post's title was a link, so a tap on the excerpt or on "5 comments" did nothing. Reproduced on skatgo.com at 390px: tapping the excerpt or the comment count stays on /forum.
   - **Fix:** the title's link now covers the whole card. Signed in and as a guest, a tap anywhere on the card opens the post with its comments, and writing a comment works.
5. **Forum sections:**
   - **What is left:** Announcements and Articles only; a player posts under Articles.
   - **Code removed:** the two sections' messages, the feedback special cases in multiplayer (not markable, kept out of the sitemap), and the privacy clause about feedback posts (EN and DE).
   - **Copy:** the front page's forum line now reads "News and articles about Skat." / "Neuigkeiten und Artikel rund um Skat.".
   - **Charter:** `product.md` and `ui.md` follow.
   - **Follow-ups:**
     - Old `?section=talk` / `?section=feedback` links, and any unknown section, showed "The posts can't be loaded" (production does the same for `?section=xyz`). The router kept the search key the validation dropped. Such links now show all posts.
     - With two pills fewer, the forum page when its posts cannot be read fell to 198 characters (check:seo wants 200). Its foot line about the forum now stays in that case too.
   - **Production data:** 0 posts in those sections (4 articles, 1 announcement), so nothing was deleted.
6. **Loading logo at night:** the disc behind it is drawn in white day and night (`fill.loaderGlow` uses `color.onColor`).

## Acceptance
Production build on 55186/56186. Script: the main checkout's `.intentfold/tmp/SKATGO-186/ac.mjs`. 18/18 PASS.
- **"You" tag:** `rgb(26, 67, 131)` with white text at night and navy by day, on phone and desktop.
- **Header:** one line, clear of the AI column, on phone and desktop, day and night.
- **Front page:** at night `rgb(16, 22, 30)`, equal to /daily; by day white.
- **Loader:** its gradient is `rgb(255, 255, 255)` at night.
- **Sections:** the pills are All|Announcements|Articles; a player is offered Articles only; multiplayer refuses `section: 'talk'` (403); an old `?section=talk` shows all posts.
- **Forum on a phone:** signed in, a post was written, opened, commented and shown; tapping a card's excerpt opens it, signed in and as a guest.

## Mechanical defence
- **App:** typecheck, build, 346 tests, client bundle, design tokens, the literal grep, server link, check:seo --built and test:seo all pass.
- **Multiplayer:** `npm --prefix multiplayer run check` passes.
- **Tests corrected for the removed sections:** `app/src/lib/forum.test.ts` and `multiplayer/test/forum.test.ts` (players now post under Articles; the "not markable" case uses the official's article).

## Deploy note
- Multiplayer imports the section list from the app, so both services deploy: multiplayer first, then web.

## Decided for you
- **The night "You" blue** is `#1A4383`, the navy tile's night colour; pure `#022657` would vanish into the dark panel.
- **Only the front page** got the darker background, as asked. Skat-Tricks, bidding practice, about, profile and the friends' page also have a white day page, so at night they are `#19212B`, one step lighter than /daily.
- **The welcome post** "Tell us what you think" (production content) still says "Post it under **Feedback** or **Discussion**". It was not edited.
- **Not in scope:** on the forum, the "All" pill also carries `aria-current` when a section is chosen, as in production today. It is invisible.
