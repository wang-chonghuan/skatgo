# SKATGO-128 handoff

## What changed

- **Recording free deals** (`multiplayer/src/free.ts`, `src/profile.ts`, `src/store.ts`): a new table `play_deals`
  (player, game, day, at, score, ai). `/free/review`, which the table asks for by itself when a deal ends, now takes
  an optional `user:` player; when given it records the deal's Seeger-Fabian score and the AI's from the same seat,
  once per game (`free:<pool>:<deal>:<start>`), the day by the tournament's `dayOf`. Lesson 11's game counts too.
- **Reading the record** (`multiplayer/src/profile.ts`, `src/daily.ts`): `POST /daily/profile`, an account only —
  every tournament deal of the player's entries with its day's benchmark, and every free deal, in order; the ids
  `player_aliases` names as one person count as that person.
- **Web proxies** (`app/src/lib/free-handler.ts`, `daily-handler.ts`, `daily-api.ts`): `/api/free/review` passes
  `user:<id>` for a signed-in player and refuses a browser-sent player; `/api/daily/profile` answers a guest 401.
- **The page** (`app/src/components/skat/profile-page.tsx`, `app/src/routes/profile.tsx`, `lib/skat/profile.ts`):
  `/de/profil`, `/en/profile`, noindex. H1, lead, a summary line, a white card with the curve (one point per deal,
  own score minus the AI's, zero line, a hairline per new day, max/min beside it, a note), and a white card with one
  row per day, newest first: date, deals, the day's sum against the AI. Guest: sign-in button. No deals: a card with
  the ways to the tournament and free play.
- **Way in** (`frame.tsx`): a link "Dein Skat-Profil" in the settings under the nickname, for an account.
- **Registry** (`theme/constants.ts`): `profileChart`, the curve's SVG geometry.
- **Lists** (`paraglide.options.ts`, `lib/indexability.ts`, `lib/sitemap.ts`, `client-page.tsx`): the address, noindex,
  among the pages.
- **Charter**: product.md (the record of play; free play records a signed-in player's deals), engineering.md
  (`play_deals`, `/free/review` records, `/daily/profile`, structure, routes), ui.md (the page, the settings link).
- **Tests**: `multiplayer/test/profile.test.ts` (tournament and free deals, a review asked twice records once,
  aliases as one person, the per-day sums), `app/src/lib/profile-handler.test.ts` (who the proxies name).

## AC results

Local web 55128, multiplayer 56128, database 57128, seeded with a copy of one production player's 14 tournament
days and two free deals today under the local test account `test_profile` (`tmp/seed.mjs`; the copy is deleted at
close). `tmp/ac.mjs`, desktop 1280×820 and phone 375×812, English and German: 24 of 24 passed.

1. **Signed-in opens the profile; a guest is asked to sign in** — passed: the signed-in page shows H1, curve and
   days; a guest gets the sign-in button and no curve, in both languages and sizes.
2. **Deals per day match** — passed: the 14 day rows' counts equal those worked out from the database
   (`tmp/expected.json`).
3. **One point per deal, own minus AI** — passed: 75 points, the same differences in the same order as the database.
4. **A finished free deal adds a deal and a point** — passed by test, not by playing (acceptance plays no games):
   `profile.test.ts` records a free deal twice → one row, shown on its day; `profile-handler.test.ts` shows the web
   naming the signed-in account with the review and no one for a guest. The live path — finish a free deal signed
   in, reload the profile — is left to the human's own testing.
5. **Readable on phone and PC, no sideways scroll** — passed: `scrollWidth <= innerWidth` at both sizes;
   screenshots `tmp/pc-*.png`, `tmp/phone-*.png`.

Mechanical defence: passed (typecheck, build, 291 unit tests, bundle, tokens, literal grep, SSR import, SEO built
check, SEO tests). `npm --prefix multiplayer run check`: passed (28 tests).

## Deviations

- `lib/sitemap.ts` lists `/profile` among the pages (filtered out of the sitemap as noindex): the sitemap test
  requires every route there. Not in the plan.

## Environment

Ports: web 55128, multiplayer 56128, database 57128. No env key added, changed or removed. `play_deals` is created
by the multiplayer service's migration at start.

## Residual

- Free deals count from the release on; there is no history before it.
- The order of a tournament deal against a free deal on the same day is approximate (the entry's start, then the
  deal's number).

## Check

Raised by the look through your eyes, not changed yet (for the discussion):
- On a phone the curve is about 80px tall and its spikes run together.
- The note under the curve and the max/min labels are smaller than the body text.
- The day lines on the curve carry no dates, so a spike cannot be matched to its day.

1. http://localhost:55128/de/profil (signed in with your account; the local database holds a copy of one player's 14
   tournament days and two free deals under it)
   — the curve, the day list and the wording: is this the record you meant to start the discussion from?
2. http://localhost:55128/en/profile on a phone width — the curve is short there; enough for a first version?
3. The settings (gear) on any page while signed in — the link "Dein Skat-Profil" under the nickname.
4. Play a free deal signed in, then reload the profile — today's count goes up by one and the curve gets a point.

## Decided for you

- Which deals count: the tournament's (from its first day) and free play's (from now on, signed in), lesson 11's
  included; not private tables or the course's own game, which have no AI on the same cards.
- The difference: your Seeger-Fabian score minus the AI's on the same deal from the same seat.
- Your own profile only; no public profile yet.
- The curve's x-axis is every deal in order, a hairline where a day starts; the per-day counts are their own list.
- The way in is the settings, under the nickname. Name: "Dein Skat-Profil" / "Your Skat profile".
- A day's sum against the AI and the average per deal are shown signed, never green/red.
