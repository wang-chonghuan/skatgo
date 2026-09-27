# SKATGO-23 acceptance checks

Built server on 55023, headed Playwright, fresh context (signed out, nothing done), desktop 1280×820
and phone 375×812 (`isMobile`, `hasTouch`), each of `/zh`, `/en`, `/de`. Scripts under `tmp/`.

## AC1 — four cards, in the page's language, fitting both viewports
On `/{lang}`: exactly four `[data-testid=entry-card]`, with `data-section` course, play, duplicate,
puzzles in that order. Each card's text equals that language's catalogue strings (read from
`app/messages/{lang}.json`, not typed into the script). `document.documentElement.scrollWidth ≤
innerWidth`, and every card's box lies inside the viewport width. Screenshots are saved for the
human.

## AC2 — Course and Play open the existing features
Click the Course card, and the URL becomes `/{lang}/course`, `[data-testid=skat-home]` shows 11
lesson cards; clicking "start" opens lesson 1 (`[data-testid=skat-lesson]`). Back on `/`, click the
Play card, and the URL becomes `/{lang}/play`, `[data-testid=skat-table]` appears and deals: the
learner's hand has 10 cards. No game is played.

## AC3 — Duplicate and Puzzles do nothing, and say so
Each of the two cards has no `a`/`button` inside it and `aria-disabled="true"`, and shows the
language's "coming soon" string. Clicking its centre leaves the URL unchanged, and no new
navigation or request fires (URL and history length compared before and after, plus a short wait
for a navigation event that must not come).

## AC4 — back links
From a lesson, ✕ goes to `/{lang}/course`; from the finish screen, "back" goes to `/{lang}/course`
(reached by writing progress, not by playing through). An unknown lesson id redirects to
`/{lang}/course`. Free play's back link goes to `/{lang}`. The header brand goes to `/{lang}`.

Plus: the sitemap test passes (part of `npm test`), and the mechanical defence passes, including the
token check.
