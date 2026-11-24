# SKATGO-231 plan

## What the code already promises, and what the ticket does not say

- The forum is SkatGo's own: `app/src/lib/forum.ts` (shared rules), `multiplayer/src/forum.ts` (routes, store),
  `app/src/components/skat/forum-page.tsx` (list and post), `forum-body.tsx` (the text's marks). Sections are a
  plain `text` column, so a new section needs no schema change, only a data update.
- Production holds 6 posts, all SkatGo's: 1 announcement and 5 articles (ids 3–7); no player has posted yet. So
  moving `articles` to the discussion section moves only SkatGo's five articles.
- A post's address is its number and title, with no section in it: moving the five keeps every address.
- SkatGo's posts already carry the site's pictures (`![…](file.svg)`, one per language). A guide's cover is its
  first picture; a video's YouTube address is the first YouTube link in its text. Neither needs a new column.
- The site loads its fonts from Google Fonts in `routes/__root.tsx`. Geist is there too, so Geist comes in the
  same link: no file download, no npm dependency.
- Vercel's Geist values were read from community.vercel.com's own CSS (light and dark) and its rendered pages
  (`.intentfold/tmp/forum-research/geist-tokens.txt` in the main checkout). Measured:
  - page white; text #171717; secondary #4d4d4d; hairline rgba(0,0,0,.08); fills #f2f2f2 / #fafafa;
  - Geist Sans: h1 32/40 600 −1.28px; post title 24/32 600 −0.96px; section heading 18/28 500;
    card title 18 600; row title 16/24 500; text 14/20 400; name 14/20 500; small 12/16 400;
  - left navigation 14/20, icons 16px, active row #f2f2f2 rounded 4px; pills 14/16, 8×12 padding, round, the
    chosen one #171717 on #f2f2f2 text; avatars 40px in a list, 24px on a post; icon buttons 32×32, 1px hairline,
    radius 4px; the main column 1000px beside a 200px navigation.
- Still undecided: whether the site's header and footer stay SkatGo's (decided below: they stay).

## Route

1. **Sections.** `FORUM_SECTIONS` = news, talk, guides, videos; only `talk` is open to players. The service's
   migration moves `articles` to `talk` (idempotent). Old `?section=articles` links fall back to the forum's home.
2. **Service.** The list answers, for the home (no section, first page): the newest announcements and guides,
   the newest videos, and the discussion stream; a section's page lists that section — guides oldest first and
   numbered by publication, everything else by latest activity. Each summary carries its newest visible
   comment (name and excerpt, in the reader's language), its cover picture and its YouTube address. A guide's
   page gets its number and the guides before and after it.
3. **Design registry.** `app/src/theme/geist.stylex.ts`: Geist's colours (day and night through
   `light-dark()`, as `color.stylex.ts` does), its radii, borders, shadows and the forum's dimensions. Geist's
   family, the sizes, weight 500, leadings and letter-spacings it needs go into `type.stylex.ts`; the forum's
   roles into `type.ts`. Geist joins the Google Fonts link.
4. **Pages.** `forum-page.tsx` rebuilt in Vercel's layout from a small Geist kit (`forum-ui.tsx`: button,
   pill, icon button, avatar, row): left navigation (on a phone a row of pills); the home with its heading, the
   featured announcement/guide and the tabs All / Announcements / Guides, the videos row and the discussion
   stream; a section's page; a post's page with breadcrumb, title, author line, body, prev/next for a guide,
   "Watch on YouTube" for a video, and comments in the same rows. Report, delete and hide become small icon
   buttons. `forum-body.tsx` takes the Geist text roles on the forum.
5. **Words.** New messages in `app/messages/{en,de}.json` for the sections and the new blocks.
6. **Charter.** product.md (the forum's four sections; the Skat-Tricks articles now SkatGo's posts in
   Discussion), ui.md (the forum's Geist look and its registry), engineering.md (the sections, the font).
7. **Release note for cap4.** Post 7's tier numbers (1500 / 3000) become 1000 / 2000 in production, by hand, as
   SkatGo's posts are edited; the section move runs by the migration.

## Departures from the proposed solution

- The video row shows no thumbnails: Vercel's own row has none (date, kind and title), and fetching YouTube's
  thumbnails would send every visitor's address to Google. A video is a text card that opens YouTube.
- Guides are numbered by publication order rather than a stored position: one rule, no new field.
