# SKATGO-25 acceptance checks

Run against the built server (`operations.md` "judged from what ships") on the ticket's web port,
with `app/.env` loaded. Playwright runs headed, at 1280×820 and 375×812.

Hostname mapping: Chromium's `--host-resolver-rules="MAP skatgo.com 127.0.0.1:<port>"` makes
`http://skatgo.com/...` reach the local server, so the page believes it is the published site.

Every request to `*.posthog.com` is intercepted with `page.route` and answered locally. Nothing
reaches PostHog (Q5).

## AC1 — a skatgo project exists, separate from Risetive's

Read-only PostHog API: list the organizations/projects of the account. Pass when a project named
`skatgo` exists and it is not Risetive's project 279099. Record its id and the last 6 characters of
its `api_token`.

## AC2 — on skatgo.com, page views and clicks go to the skatgo project

Open `http://skatgo.com/en`, then navigate in-app to the course and click a lesson card, then a
button. Decode the intercepted capture payloads. Pass when all of these hold:
- the events include `$pageview` for the first page and for the in-app navigation, plus at least one
  `$autocapture` click;
- every payload's `token` equals the skatgo project's `api_token` from AC1;
- `$current_url` host is `skatgo.com`.

## AC3 — local and Render hostnames send nothing

Open `http://localhost:<port>/en` and `http://127.0.0.1:<port>/en`, and click around. Then request
`https://skatgo.onrender.com/en` in the mapped browser: map `skatgo.onrender.com` to the local server
the same way. Pass when zero requests to `*.posthog.com` are observed and no `posthog-js` chunk is
loaded.

## AC4 — without a key the site works and PostHog is not loaded

Restart the built server with `POSTHOG_PROJECT_KEY` unset. Open `http://skatgo.com/en` (mapped) and
use the course. Pass when:
- the page works: header and course render, no console errors;
- zero requests to `*.posthog.com` are observed and no `posthog-js` chunk is loaded.
