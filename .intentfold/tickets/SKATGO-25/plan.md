# SKATGO-25 plan

## What the code and the outside world say that the ticket does not

- **PostHog: the Risetive organization cannot hold a second project.** Its plan is free. It reports
  `organizations_projects` with `limit: 1`, and its one project ("Default project", 279099, `app_urls`
  risetive.com, `anonymize_ips: true`) is already taken. Risetive's personal API key has scope `*`
  over every organization of that PostHog account. So "a new project called skatgo, with the same
  key" needs a decision (grill Q1).
- **skatgo has no analytics and no privacy page.** `__root.tsx` says Parrottoon's beacon was left out
  on purpose. `charter/product.md` states "Nothing measures it yet: there is no analytics on
  skatgo.com". That line goes stale with this ticket. It is human-owned, so I report it and don't
  edit it.
- **Browser chunks may not contain `process.env`** (`check-client-bundle.mjs`, engineering Redline 6).
  The key has to come from the server, through a server function, the way trovestep does it.
- **The public origin is already one constant**: `SITE_URL` in `lib/site.ts`. The "only the published
  site reports" rule is derived from it rather than written a second time.
- **Learners include children (6–99).** This affects the privacy settings (grill Q4).

## Route

1. **PostHog project** (Q1, settled): the SkatGo organization's project 287504 is named `skatgo`, has `anonymize_ips: true` and `app_urls` `https://skatgo.com`. Its public key goes in `app/.env` as `POSTHOG_PROJECT_KEY`, never committed.
2. **Dependency** (Q2): `posthog-js` in `app/package.json` and the lockfile, the same major line as
   trovestep.
3. **`app/src/lib/analytics.ts`** holds:
   - a `createServerFn` that reads `POSTHOG_PROJECT_KEY` and returns it only when it matches
     `^phc_[A-Za-z0-9]+$`;
   - `isPublishedSite(hostname)`, derived from `SITE_URL`.
4. **`app/src/components/analytics.tsx`**: `ProductAnalytics`. It is a `useEffect` that dynamically
   imports `posthog-js` and does nothing unless it has a key and is on the published host. Settings as
   in trovestep:
   - EU `api_host` / `ui_host`, fixed in code;
   - `persistence: 'localStorage'`;
   - autocapture;
   - `capture_pageview: 'history_change'`;
   - session recording and surveys off;
   - no `identify`.

   No UI and no styles.
5. **`__root.tsx`**:
   - a root `loader` calls the server function, with `staleTime: Infinity` so client navigations don't
     re-fetch the key;
   - `RootDocument` renders `<ProductAnalytics projectKey=… />`;
   - the "left out on purpose" comment is updated.
6. **Operations note**: the production Render service will need `POSTHOG_PROJECT_KEY` before a deploy
   (Q3). Setting it is part of the deploy, not of this merge.

## Redline lookup (route above)

- engineering 3, dependency → Q2 (approval).
- operations 5, new production env key → Q3 (approval).
- operations 3, creating a cloud resource → the human asked for the PostHog project in the request.
  The form it takes depends on Q1.
- operations 2, acceptance must not write external data → Q5 (acceptance intercepts PostHog; no real
  events).
- engineering 1: nothing committed. The key lives in `.env` only.
- product Redline 2: `product.md` is not edited.
