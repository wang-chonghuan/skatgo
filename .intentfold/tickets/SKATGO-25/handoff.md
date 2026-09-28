# SKATGO-25 handoff

## What changed

skatgo.com now reports product analytics to PostHog Cloud EU. The target is organization **SkatGo**,
project **skatgo** (287504), set up the way Risetive is (TROVESTEP-315/318).

- **PostHog, outside the repo**:
  - the human created the SkatGo organization;
  - the agent renamed its project from "Default project" to `skatgo`;
  - the project already had `anonymize_ips: true` and `app_urls` `https://skatgo.com`.
- **`app/package.json`, `app/package-lock.json`**: new dependency `posthog-js` `^1.434.17`, approved
  in the grill (Q2).
- **`app/src/lib/analytics.ts`**:
  - `readProjectKey` is an isomorphic function. On the server it reads `POSTHOG_PROJECT_KEY` and
    accepts only `phc_…`. On the client it returns `null`.
  - `isPublishedSite(hostname)` is derived from `SITE_URL`.
- **`app/src/components/product-analytics.tsx`**: `ProductAnalytics`. In an effect it dynamically
  imports `posthog-js`, only with a key and only on skatgo.com, and starts it once. Settings:
  - EU hosts, fixed in code;
  - localStorage, no cookie;
  - autocapture;
  - `$pageview` on history change;
  - session recording and surveys off;
  - no `identify`.

  The SDK is its own lazy chunk, so the first page's scripts don't carry it.
- **`app/src/routes/__root.tsx`**:
  - a root `loader` (`staleTime: Infinity`) hands the key to the page;
  - `<ProductAnalytics>` is rendered first in `<body>`;
  - the "left out on purpose" comment is updated.

## AC results

Checked against the built server (`node .output/server/index.mjs`) on port 55025. Playwright ran
headed, at 1280×820 and 375×812. Every PostHog request was intercepted and answered locally, so no
event reached PostHog (grill Q5).

1. **A skatgo project exists, separate from Risetive's** — PASS. Read-only API:
   - organizations Risetive (`01a0bb56…`) and SkatGo (`01a0e9f1…`);
   - project 287504 `skatgo` in SkatGo, token `…uKopZv`, `anonymize_ips: true`;
   - Risetive's project 279099 is untouched.
2. **On skatgo.com, page views and clicks go to the skatgo project** — PASS at both viewports. The
   browser mapped skatgo.com to the local server. Opening `/en`, then clicking to `/en/course`, then
   to `/en/lesson/1`, captured:
   - `$pageview` ×3 (`http://skatgo.com/en`, `/en/course`, `/en/lesson/1`), `$autocapture` ×2 and
     `$pageleave`;
   - every event carries token `…uKopZv`, the skatgo project's, and a `$current_url` host of
     `skatgo.com`;
   - no page errors.
3. **Local and Render hostnames send nothing** — PASS at both viewports. `localhost:55025`,
   `127.0.0.1:55025` and `skatgo.onrender.com` (mapped) each sent 0 PostHog requests and did not load
   the posthog-js chunk.
4. **Without a key the site works and PostHog is not loaded** — PASS at both viewports. The server
   was restarted with `POSTHOG_PROJECT_KEY` unset. On skatgo.com (mapped), navigating through the
   course gave no page errors, 0 PostHog requests, and no posthog-js chunk.

Mechanical defence (`engineering.md` Tools) passed:
- typecheck;
- build;
- 70 tests;
- client-bundle check (14 chunks);
- design-token check (58 files);
- literal grep (0 lines);
- SSR bundle import.

## Deviations

- **Plan step 5**: the key is read with `createIsomorphicFn` instead of a server function. A
  server-function call from the browser goes to `/_serverFn/…`, and the language middleware in
  `src/server.ts` would redirect it for having no language prefix. The first page carries the
  server's answer in the loader data, and PostHog stays started once it is running.
- **`ac.md`**: the check needs `--disable-blink-features=AutomationControlled`, and the mocks follow
  production responses. Without that flag, PostHog's bot filter (`navigator.webdriver`) drops every
  event from an automated browser.

## Environment

- Ports: web 55025. The review server is running there with `app/.env` loaded.
- Env keys added: **`POSTHOG_PROJECT_KEY`** in `app/.env`. It is the public project token of PostHog
  project `skatgo`. Unset or malformed means analytics is not loaded.
- Production: the Render service `skatgo` needs `POSTHOG_PROJECT_KEY` set before the deploy that
  ships this. The human approved this in the grill (Q3). It is done at deploy time, not by the merge.

## Residual

- A privacy notice / terms that mentions PostHog, in three languages. The human said
  「terms其他工单再做」: a separate ticket.
- `charter/product.md` still says "there is no analytics on skatgo.com". It is human-owned; the human
  decides the new wording.
- After the deploy, confirm the first real events in PostHog project `skatgo`. That is a
  production observation, not part of this ticket.
