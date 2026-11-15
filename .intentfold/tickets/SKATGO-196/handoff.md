# SKATGO-196 handoff

## What changed

- `app/messages/de.json`: `home_meta_title` is now "Skat online kostenlos spielen – ohne Anmeldung | SkatGo"
  (was "Skat online kostenlos: gleiche Karten für alle | SkatGo"). The front page's `<title>`, `og:title` and
  `twitter:title` all come from this one message (`pageHead` in `app/src/lib/head.ts`).
- English, the description, the page's visible text and every other page are untouched.

## AC results

Production build of this branch on http://localhost:55196, compared with https://skatgo.com (live 0157242, this
branch's base).

1. **PASS.** `/`: `<title>`, `og:title` and `twitter:title` are all "Skat online kostenlos spielen – ohne
   Anmeldung | SkatGo".
2. **PASS.** `/en`: title still "Skat Card Game – Play Free Online | SkatGo".
3. **PASS.** `/` and `/en`: meta description identical to production. Visible text identical word for word
   except the XP board's rows, which come from the multiplayer service's live data (the local build had no
   multiplayer running, so its board was empty); no copy differs.

Mechanical defence passed once: typecheck, build, unit tests, client bundle, design tokens, literal grep, SSR
link, `check:seo --built` (52 indexable pages, unique titles, twitter:title = title) and `test:seo`.

The look through the human's eyes was not run: nothing changes on the page, and the human approved the exact
title text in the Request.

## Deviations

None from `plan.md`.

## Environment

Ports: web 55196 (multiplayer and database not started). No env keys added, changed or removed.

## Residual

- Bing reacts only after it recrawls `/`; the post-deploy IndexNow submission tells it. Whether impressions for
  the German "kostenlos spielen / ohne Anmeldung" queries come back is visible in Bing Webmaster Tools in a week
  or two.

## Check

1. https://skatgo.com/ — the browser tab reads "Skat online kostenlos spielen – ohne Anmeldung | SkatGo".

## Decided for you

- og:title and twitter:title change with the title (Scope item 2; they share one message).
- The en dash "–" exactly as approved in the Request.
- Meta description, H1 and slogan unchanged (Constraints).
