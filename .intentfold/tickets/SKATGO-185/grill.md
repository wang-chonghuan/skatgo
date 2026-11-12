# SKATGO-185 grill

## Your decisions

2. **What PostHog keeps after a deletion.** Recommendation was: remove the nickname from the PostHog person, keep the
   events, say so in the privacy policy. **Answer: PostHog is not touched.** 「posthog暂时不动，我后面要专门处理posthog，你不动，
   也不要在章程中涉及」 — this ticket changes nothing in analytics and the charter says nothing about it. The ticket's
   source marker (Scope 6, AC 8) goes with it: the app still starts at `https://skatgo.com/?src=android`, which PostHog's
   own page views already record as the URL; no code reads it.

## Recommendations you approved

1. **The Android package name: `com.skatgo.app`.** 「包名同意」.

## Approvals (Redlines)

- product.md Redline 1 and the other charter files: taken from the same answer, which says only what the charter must
  leave out (「也不要在章程中涉及」) — the charter describes the app and the deletion, nothing of PostHog.
- engineering.md Redline 3: the Android shell (Bubblewrap's Gradle project, `androidbrowserhelper`) is the human's
  「开工单，把这些都做了」 over the list naming the `android/` shell; recorded in the ticket's Constraints.

## Decided for you

3. **The way in.** A link "Delete account" in the settings under the nickname, beside "Your Skat profile", to the page
   `/delete-account` (`/en/delete-account`, `/de/konto-loeschen`), noindex. The same page is the public address Google
   Play asks for: signed out it explains and offers sign-in, plus the support address for whoever cannot sign in.
   Basis: one place for both; Play requires the in-app path and a web address.
4. **Confirming.** The page's button opens the kit's `Modal`; deleting signs out and the page says the account is gone.
   Basis: ui.md's kit; a destructive action is confirmed once.
5. **What is deleted.** The account's id and every `anon:` id aliased to it, in `daily_entries`, `daily_players`,
   `play_deals`, `ladder_answers`, `bidding_answers`, `profile_notes`, `dod_shares` (its shared links stop working),
   `account_referrals` (as newcomer or host), `forum_reports` (its reports), `player_aliases`. Forum posts and comments
   stay with the author `gone`. Private rooms are left to expire. A hand-written alias between two accounts loses only
   this account's row. Basis: the ticket's Scope 2 and Constraint 「帖子改匿名」; rooms are temporary (store.ts).
6. **Order.** SkatGo's data first, then the Clerk user; a Clerk failure answers an error and the deletion can be asked
   again. Basis: never an account left without its data being deletable; the data step is idempotent.
7. **The device.** The deletion answers with a new device cookie, so the browser's next guest games start fresh.
   Course progress and settings in the browser's storage are the device's, not the account's: they stay, and the page
   says so. Basis: SKATGO-182's device cookie; progress.ts keeps progress in the browser only.
8. **The forum's deleted author** reads "Deleted player" / "Gelöschter Spieler". Basis: shown in review.
9. **Manifest** served by server.ts from `constants.ts` (one source for the theme colour, as the `theme-color` meta).
10. **Service worker**: hand-written (no dependency); network for pages, the offline page only when the network fails;
    pictures and sounds from cache, refreshed behind; never `/api`, `/hx` or another origin. The offline page is a page
    of the site (kit and tokens, no second stylesheet), precached in both languages with its stylesheet; the worker's
    address carries the build's version so each deploy refreshes it. Registered on a production build only.
12. **The shell**: app name "SkatGo", white splash, the existing 512 and maskable icons, start
    `https://skatgo.com/?src=android`. Bubblewrap through `npx` at a pinned version, its JDK and SDK in `~/.bubblewrap`.
    `android/` commits `twa-manifest.json` and the generated project; build outputs and the key are ignored.
13. **The upload key** lives in `~/.config/skatgo-android/` (outside the repo, mode 600), its password beside it; the
    human backs both up. Google's Play App Signing fingerprint is added to `assetlinks.json` once Play is set up.
