# SKATGO-152 handoff

## What changed

- **Relay** — `app/src/lib/analytics-relay.ts` (new), routed from `app/src/server.ts` before the language middleware: `/hx/static/*`, `/hx/array/*` → `eu-assets.i.posthog.com`; everything else under `/hx/` → `eu.i.posthog.com`. It passes only content-type, content-encoding and user-agent, never cookies. X-Forwarded-For carries the visitor's IP, using `clientIp`, now exported from `lib/free-handler.ts`. Timeout is 10 s; a failure returns 502.
- **Init** — `components/product-analytics.tsx`: `api_host: '/hx'` (`RELAY_PATH` in `lib/analytics.ts`), `person_profiles: 'always'`, `ui_host` unchanged. The component now sits inside `ClerkProvider` and the test-account provider (`routes/__root.tsx`).
- **Identify** — `identify()` in `lib/analytics.ts`, called once Clerk is loaded:
  - Signed in: PostHog identifies the Clerk id, with `player: user:<id>` and `$set_once account_created_at`. Anonymous history merges into the account.
  - Signed out after being signed in: `posthog.reset()`.
  - A local marker `skatgo.account.v1` records the first sign-in in a browser. It announces `skatgo:identify` and, for an account made within the hour, `account_signed_up`.
  - The local test account now carries its `createdAt` (`lib/test-account.ts`, `lib/use-account.ts`).
- **Events** (`ProductEvents`):
  - `game_finished` gains `role`, `contract`, `bid`, `sf` and `ai_sf`, the AI's score taken from the cached review (`server-table.tsx`).
  - New `free_round_finished`, when free play's 6-deal round ends.
  - New `exercise_finished` in `tricks-exercise-page.tsx` and `bidding-practice-page.tsx`.
  - New `sign_in_clicked {at}` on all 10 sign-in/sign-up buttons. Clerk calls the child's `onClick` and then opens the modal.
  - New `account_signed_up`.
  - `daily_finished` gains `name`, read from the board's `me.nickname` right after the finish (`daily-table.tsx`).
  - `setPerson({nickname})` runs after a daily finish and after a nickname change (`frame.tsx`).
- **Privacy** — `lib/legal.ts`: the analytics section's "does not identify accounts" sentence is replaced in EN and DE by "linked to your account after sign-in, including earlier events from the same browser, until sign-out; sent via skatgo.com". The date is now 2026-10-29.
- **Charter** — `engineering.md` PostHog entry, and the PostHog sentence in `product.md` (the human's request).
- **Tests** — `lib/analytics.test.ts`: game_finished's new fields, and the three identify cases (announced once with signup, an older account not counted, sign-out noticed).

## AC results

Live-site parts are checked after the deploy (cap4); listed per criterion.

1. **Account id and merged history** — Locally, test account `newbie`, made 1 minute earlier: identify ran, and the marker holds `test_newbie`. Unit test: the first sign-in is announced once. Live: pending deploy, by checking persons by Clerk id.
2. **After logout, events not attributed** — Locally, after the cookie was cleared the marker was removed (identify null, which calls reset on the published site). Unit test: the sign-out is announced. Live: pending.
3. **No posthog.com domains; events via skatgo.com; country is the visitor's** — Locally, on 55152:
   - `/hx/array/<key>/config.js` returns 200 application/javascript (887 B, eu-assets).
   - `/hx/static/array.js` returns 200 (338 KB).
   - `POST /hx/flags/?v=2` with a fake key reached PostHog: 401 authentication_failed.
   - X-Forwarded-For is set from `clientIp`; cookies are not passed (header whitelist).
   - Live: pending — the network panel, and `$geoip_country_name`.
4. **uBlock Origin defaults** — Fetched EasyList, EasyPrivacy, uBlock filters, uBlock privacy and Peter Lowe's list.
   - No rule matches `/hx/e/`, `/hx/array/phc_…/config.js` or `/hx/flags/`. The only generic `/e/` rules need an `ip=` parameter, and the live site's posthog-js 1.434 sends none (live resource URLs today: `…/array/phc_…/config.js` and `…/e/`).
   - The PostHog-path rules target `/s/…`, `/ingest/`, `/ingress/` and `/hog/`.
   - Live with uBlock: pending.
5. **New visitor profile with first source and landing page** — `person_profiles: 'always'`; posthog-js sets `$initial_referrer` and `$initial_current_url` on the person. Live: pending.
6. **New fields and events; no per-card or per-bid events** — Locally, on `skatgo:track`:
   - `sign_in_clicked {at: header}` and `{at: home}`, and the Clerk modal still opens.
   - `exercise_finished {section: sieg-sichern, number: 1, right: true}`.
   - `exercise_finished {section: bidding, number: 1, right: false}`.
   - `account_signed_up`: unit test.
   - `game_finished` (with its new fields) and `free_round_finished` were not played locally (no games are played for acceptance). The code path is typechecked and the shape is unit-tested.
   - No `track` call exists in bid or card paths: grep of `track(` call sites.
7. **Daily finished events carry the leaderboard name** — Code path read after a finish (board `me.nickname`, given at finish since SKATGO-90). Not played locally. Live: pending, from the first daily finish after deploy.
8. **Privacy mentions linking and forwarding; no popup** — `/en/privacy` and `/de/datenschutz` show the new sentence and date 2026-10-29. No dialog appears.

Mechanical defence: all passed (EXIT 0; 306 unit tests, client bundle, design tokens, grep 0, SSR import, check:seo --built, test:seo), run on f54fd40. The later privacy-text trim was rechecked with typecheck and unit tests (306 passed).

## Deviations

- Email and real name are not person properties. The existing privacy sentence says Google login details are not sent to analytics; the nickname covers finding a person.
- The privacy sentence does not mention the IP. PostHog always received it; the relay only keeps it accurate. Trimmed after the fresh-eyes look, which found the first wording long.

## Environment

Ports: web 55152 (multiplayer and database not started; not needed). No env keys added, changed or removed.

## Residual

- Live AC 1–5 and 7, after deploy.

## Check

1. `/en/privacy` — the trimmed analytics sentence.
2. After deploy, PostHog — your own person found by Clerk id, with pre-login pageviews merged in.

## Decided for you

- Relay path `/hx`.
- distinct_id is the Clerk id, plus `player = user:<id>`.
- No email or real name on the person; the nickname is set when known.
- Signup means: the first sign-in in a browser for an account made within the hour.
- `sign_in_clicked.at` names one of the 10 button positions; the page comes with every event.
- Daily name read from the board after the finish, with no multiplayer change.
- `ai_sf` from the cached review; null when unknown.
- `exercise_finished` covers Skat-Tricks (section = type) and bidding practice (section = `bidding`).
