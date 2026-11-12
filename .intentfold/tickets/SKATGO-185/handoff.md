# SKATGO-185 handoff

## What changed

- **Account deletion.** The game service gets `POST /daily/forget` (`multiplayer/src/forget.ts`): in one transaction it
  deletes every row under the account and the guest devices joined to it (`daily_entries`, `daily_players`,
  `play_deals`, `ladder_answers`, `bidding_answers`, `profile_notes`, `dod_shares`, `account_referrals`, `forum_reports`,
  `player_aliases`) and gives its forum posts and comments the author `gone`; a hand-written alias to another account
  leaves that account its person. Test: `multiplayer/test/forget.test.ts`. The web's `POST /api/account/delete`
  (`app/src/lib/account-handler.ts`, signed in, JSON only) calls it, then deletes the user at Clerk, and sets a new
  device cookie (a local test account loses its cookie instead).
- **The page** `/en/delete-account` / `/de/konto-loeschen` (`delete-account-page.tsx`, noindex): what is deleted, what
  stays, how; signed in a red button and a confirming dialog, signed out the sign-in and the operator's address. Settings:
  "Delete account" in slate on the line of "Your Skat profile". Forum: a deleted account's writing shows "Deleted player" /
  "Gelöschter Spieler". Privacy policy (EN/DE): a section "Deleting your account" linking the page; the data-request
  paragraph no longer says deletion keeps tournament records.
- **Manifest** `/site.webmanifest` from `app/src/lib/web-manifest.ts`: `standalone`, white theme and background (from
  `constants.ts`). The static file is gone.
- **Service worker** `app/public/sw.js` (hand-written), registered on production builds as `/sw.js?v=<build>`
  (`lib/service-worker.ts`, `VITE_BUILD_ID` in `vite.config.ts`): offline, a page becomes `/en/offline` or `/de/offline`
  (`offline-page.tsx`, bundled with `client-page.tsx`); pictures, sounds and fonts come from the device and are refreshed
  behind; `/api`, `/hx` and other origins untouched.
- **Android app** `android/`: Bubblewrap 1.27.0's Trusted Web Activity shell from `twa-manifest.json` — package
  `com.skatgo.app`, "SkatGo", start `https://skatgo.com/?src=android`, min Android 7.0 (API 24), target 36.
  `app/public/.well-known/assetlinks.json` names the upload key's SHA-256. No PostHog code changed.
- **Charter**: product.md (the app, deletion), engineering.md (structure, decisions, generated `android/`), ui.md
  (settings link, the two pages, the forum's deleted author, `stop`), operations.md (building the app, the key, the
  asset-links check). Nothing about PostHog.

## AC results

1. **APK, AAB, asset links** — pass. `apksigner` SHA-256 of the APK and `keytool -printcert` of the AAB:
   `FD:18:0E:…:FD:00:FA`, the same as `assetlinks.json`; `aapt2 dump badging`: `com.skatgo.app`, label SkatGo, target 36;
   the built server answers `/.well-known/assetlinks.json` 200 `application/json`.
2. **Delete from the settings** — pass, desktop and phone (test accounts): settings → "Delete account" → page → button
   → "Yes, delete": 200, the page comes back with only "Your account is deleted" and "Home"; opened again, it offers
   sign-in and no delete button. Clerk (development instance): a
   user signed in in the browser with a one-time sign-in ticket deleted itself on the page: 200, signed out, Clerk
   answers 404 for the user.
3. **Off the boards** — pass: the nickname is gone from the front page's XP board and yesterday's board; no row under
   the account in the 14 table/column pairs.
4. **Forum anonymous** — pass: post and comment stay, authors "Deleted player" (EN) / "Gelöschter Spieler" (DE), the old
   nickname nowhere in the thread.
5. **Public deletion page** — pass: `/en/delete-account`, `/de/konto-loeschen` 200 signed out with the sign-in;
   `/en/privacy` and `/de/datenschutz` link to them.
6. **Manifest** — pass: `application/manifest+json`, `standalone`, `#FFFFFF` / `#FFFFFF`.
7. **Offline** — pass, desktop and phone: after one visit, offline `/en/rules` → "No connection", `/de/regeln` →
   "Keine Verbindung", styled; online "Try again" opens `/de/regeln`; on the next load 20 of 20 pictures came from the
   worker.
8. **Start address** — pass: the APK's `launchUrl` resource is `https://skatgo.com/?src=android`; no analytics file in
   the diff.

Mechanical defence: web green (346 tests, bundle, tokens, literal grep, SSR link, check:seo 52 pages, test:seo 28/28);
multiplayer `run check` 69/69 (its first run lost the leader lock to the ticket's running service; rerun with it
stopped).

## Deviations

- Source marker (plan step 6) dropped: the human, 「posthog暂时不动……你不动」. The start URL keeps `?src=android`.
- The offline page is bundled into `client-page.tsx` instead of its own lazy chunk: offline, no chunk can be fetched.
- The service worker also keeps the pictures the offline page shows at install (the header's logo).
- `minSdkVersion` 24, not Bubblewrap's 21: `androidbrowserhelper` 2.7.4 requires it.
- From the look through the human's eyes: the dialog's buttons got room for their shadow, the page after deletion shows
  only the confirmation and the way home, and the dialog no longer says "for good" and "cannot be undone" twice.

## Environment

Ports web 55185, multiplayer 56185, database 57185. No env key added, changed or removed. Outside the repo:
`~/.bubblewrap/` (JDK 17, Android SDK, `config.json`), `~/.config/skatgo-android/` (upload key and its password).

## Residual

- Google Play: developer account, store listing, Data safety, content rating, the closed test, upload — the human's.
- Once Play App Signing is on, add Google's app-signing SHA-256 to `assetlinks.json` (one line).
- PostHog's handling of deleted accounts and of app traffic — the human's own later work.

## Check

1. The forum's "Deleted player" / "Gelöschter Spieler" — the request said 「帖子改匿名」; "Anonymous" is the other reading.
2. The delete-account page and the confirming dialog: wording, the red buttons; the support address there is the
   operator's published one (intentplex@gmail.com).
3. "Delete account" in the settings, slate, at the right of "Your Skat profile".
4. The offline page.
5. The APK on an Android phone (shows an address bar until this is deployed: the asset links are not live yet).

Seen in passing, not this ticket: on a 375 px phone the German header's "Anmelden" runs past the right edge — on
production today as well (its right edge at 403 px).

## Decided for you

- Deletion lives on one page, the settings link to it and Google Play gets its address; noindex.
- SkatGo's data first, then Clerk; Clerk's 404 counts as done; a new device cookie after deletion.
- Private rooms are left to expire; shared results' links stop working; another account aliased by hand keeps its person.
- Course progress and settings in the browser stay; the page says so.
- The manifest is served from code so its colour is the theme constant.
- Service worker hand-written; offline pages per build version; only pictures, sounds and fonts cached.
- App name "SkatGo", white splash, existing icons; Bubblewrap via `npx` at 1.27.0, not a package dependency.
- Upload key in `~/.config/skatgo-android/` (mode 600); back it up.
