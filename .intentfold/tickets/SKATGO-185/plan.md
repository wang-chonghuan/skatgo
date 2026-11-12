# SKATGO-185 plan

Found in the code that the ticket does not say:

- An account's data is keyed `user:<clerk id>` in multiplayer's PostgreSQL: `daily_entries`, `daily_players` (the
  nickname), `play_deals`, `ladder_answers`, `bidding_answers`, `profile_notes`, `dod_shares`, `account_referrals`
  (as `account` or `referrer`), `forum_reports` (`reporter`), `player_aliases`. A device's guest games (`anon:<sha>`) join
  the account through `player_aliases` at sign-in (SKATGO-182), so they are the account's too. Private rooms
  (`multiplayer_rooms`) are temporary and expire on their own.
- Forum posts and comments name their author by id and show the `daily_players` nickname; with no row the name is `''`.
- Local test accounts (`test_<name>`, SKATGO-117) have no Clerk user; the Clerk development instance does.
- `site.webmanifest` is static with `display: browser`; the theme colours live in `app/src/theme/constants.ts`
  (`themeColor`, `themeColorDark`), which the literal check guards.
- Program files under `/assets/` are cached for a year; public pictures and sounds carry no cache header; no service worker.
- No Java or Android SDK on this Mac.

Settled in the grill: package `com.skatgo.app`; PostHog is not touched by this ticket.

## Route

1. **Deletion in the service** — `multiplayer/src/forget.ts`, `POST /daily/forget {player}` behind the admission key:
   in one transaction, the account's ids (itself and the `anon:` ids aliased to it) leave every table above; forum posts
   and comments get the author `gone`. Idempotent. A test for it beside the forum's.
2. **Deletion on the web** — `app/src/lib/account-handler.ts`, `POST /api/account/delete` (server.ts): signed-in only;
   calls `forget`, then deletes the Clerk user (a local test account has none, and loses its cookie instead); answers
   with a new device cookie.
3. **The page** — `/delete-account` (`/en/delete-account`, `/de/konto-loeschen`), noindex: what goes, what stays, how;
   signed in, a button and a `Modal` to confirm; afterwards signed out, the page says it is done. Settings: a link under
   the nickname, beside the record of play's. Forum: `gone` shows as "Deleted player" / "Gelöschter Spieler". Privacy
   policy (both languages): a section on deletion linking the page.
4. **Manifest** — `/site.webmanifest` answered by server.ts from `constants.ts`: `standalone`, theme and background colour,
   `id`, `scope`, icons as now. The static file goes.
5. **Service worker** — `app/public/sw.js`, hand-written, registered from the client with the build's version: navigations
   go to the network and fall back to the cached offline page of their language; pictures and sounds of the site are
   served from cache and refreshed behind; `/api`, `/hx` and other origins are never touched. The offline page is a page of
   the site, `/offline` (`/en/offline`, `/de/offline`), noindex, out of the sitemap, precached with its stylesheet.
6. **Android shell** — `android/`: `twa-manifest.json` and the Gradle project Bubblewrap generates from it; package
   `com.skatgo.app`, start `https://skatgo.com/?src=android`. The upload key outside the repo. Built APK and AAB;
   the key's SHA-256 in `app/public/.well-known/assetlinks.json`.
7. **Charter** — product.md (the app, deletion), engineering.md (structure, forget, the shell, generated files),
   ui.md (settings link, the page, the forum's deleted author, the offline page), operations.md (building the shell).
