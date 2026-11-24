# SKATGO-231 acceptance checks

All UI checks: headed Playwright against the production build on the ticket's web port (55231) with the ticket's
multiplayer (56231) and local database (57231), desktop 1280×820 and phone 375×812 (`isMobile`, `hasTouch`),
English and German. Signed-in checks use local test accounts (`test_player`, and `test_admin` as the official).
Seeded forum rows go into the ticket's local database only. Scripts and screenshots in `tmp/`.

## AC1 — Geist design
The forum's list and a post render in Geist: computed `font-family` starts with Geist; text colour
rgb(23,23,23), secondary rgb(77,77,77); hairlines rgba(0,0,0,0.08); post rows 40px round avatars; pills 34px tall
and fully round, the chosen one rgb(23,23,23). Screenshots of home and a post beside Vercel's (main checkout
`.intentfold/tmp/forum-research/`) look like the same design. True when every computed value matches.

## AC2 — four sections
The navigation lists Announcements, Discussion, Guides, Videos (German: Ankündigungen, Diskussion, Anleitungen,
Videos) in that order, and each link shows only that section's posts (`data-section` of every row). True when
each of the four filters shows only its own section.

## AC3 — featured block with tabs
The home shows the newest announcements and guides beside a featured one, with tabs All / Announcements /
Guides; choosing a tab leaves only that kind in the block. True when each tab's rows carry only its kind.

## AC4 — discussion stream rows
Each discussion row shows avatar, author, date, title, a two-line excerpt and, when commented, the newest
comment's author and text. True for a seeded post with two comments: the second comment's text shows.

## AC5 — who may post where
A player's composer offers only Discussion, and the service refuses a player's post to news, guides or videos
(403). The official's composer offers all four. True when both hold.

## AC6 — guides in order
Guides list oldest first, numbered 1, 2, 3; guide 2's page links to guide 1 as previous and guide 3 as next.
True for three seeded guides.

## AC7 — videos open YouTube
A video shows as a card; its link's `href` is the YouTube address in its text and opens in a new tab. True for a
seeded video.

## AC8 — small report button
On someone else's post and comment, report is an icon button of at most 32×32 px with an accessible name; the
text "Report" is not shown until it is opened. True when its bounding box is ≤ 32×32.

## AC9 — the five articles in Discussion
After the service's migration on a copy of production's five articles (ids 3–7, section `articles`), all five
show under Discussion, their addresses open with 200 and the comment on post 6 is there. Post 7's tier numbers
read 1000 / 2000 once corrected (checked in production after release, read-only).

## AC10 — both languages, no sideways scroll
`/forum`, a section and a post in English and German at 1280×820 and 375×812: `scrollWidth ≤ clientWidth`.
