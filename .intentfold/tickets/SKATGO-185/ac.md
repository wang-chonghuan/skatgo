# SKATGO-185 acceptance checks

Local: web 55185, multiplayer 56185, database 57185, the production build with `SKATGO_TEST_ACCOUNTS=1`. Playwright
headed, desktop 1280×820 and phone 375×812, scripts in `tmp/`. Data to delete is written into the ticket's local
database the way the product stores it (no games are played).

## 1. APK, AAB and asset links
Command: Bubblewrap's build gives a signed APK and an AAB; `apksigner verify --print-certs` and `aapt2 dump badging`
give the certificate's SHA-256 and the package; `curl` of the built server's `/.well-known/assetlinks.json` answers 200,
JSON, naming the same package and fingerprint. After deploy: Google's Digital Asset Links API lists the statement for
skatgo.com.

## 2. Delete from the settings
Playwright, a test account with a nickname, XP, a daily entry, a forum post and comment: settings → "Delete account" →
the page → the button → confirm. The answer is 200; the header then offers sign-in. Command, Clerk's development
instance: a user made through Clerk's API, its session token sent to `/api/account/delete`, after which Clerk answers 404
for that user.

## 3. Gone from the boards and the record
After 2: the front page's XP board and that day's daily board no longer show the nickname; a query over every table in
the plan finds no row under the account's ids or its device's.

## 4. Forum posts stay, anonymous
After 2: the post and the comment still show, the author "Deleted player" (EN) / "Gelöschter Spieler" (DE), the old
nickname nowhere on the page.

## 5. The public deletion page
A fresh signed-out context: `/en/delete-account` and `/de/konto-loeschen` answer 200 with the explanation and a way to
sign in; `/en/privacy` and `/de/datenschutz` link to it.

## 6. Manifest
`curl /site.webmanifest`: JSON, `display` `standalone`, `theme_color` and `background_color` set.

## 7. Offline
Playwright: open a page, wait for the service worker, go offline, open another page: the SkatGo offline page in that
page's language (EN and DE). Online again, a reload: a card picture's response comes from the service worker.

## 8. The app's start address
Command: the APK's manifest (`aapt2 dump xmltree`) and `android/twa-manifest.json` start at
`https://skatgo.com/?src=android`. No analytics code changes (the diff touches nothing of PostHog).
