# SKATGO-25 grill

Mode: human. Inputs: the live ticket, `plan.md`, `ac.md`, the charter, trovestep's PostHog integration
(TROVESTEP-315/318), and read-only PostHog API probes.

## Batch 1

### Q1. Where does the "skatgo" PostHog project live? (the premise failed)

Risetive's PostHog organization is on the free plan, which allows **1 project**. It already has its
"Default project", so a second project cannot be created in it without upgrading the plan.

**Recommended: a new PostHog organization called skatgo, under the same PostHog account, with one
project called skatgo.** Free, and the same personal API key (scope `*`, all organizations) manages
it. If the API refuses to create an organization, you create it once in the PostHog UI and I do the
rest.

Alternatives:
- (b) Upgrade Risetive's organization to a paid plan, then add the project inside it. This spends
  money, so it is your call.
- (c) Put skatgo's events into Risetive's existing project. This contradicts "要新建一个项目", so not
  recommended.

**Decision:** a new PostHog organization **SkatGo**, which the human created in the UI — human, 2026-09-28 (「新的org已经创建好」). Its project (287504) carries the key the human supplied. It already had `anonymize_ips: true` and `app_urls` `https://skatgo.com`. The agent renamed it from "Default project" to `skatgo`, as the request asks.

### Q2. Add the `posthog-js` dependency? (engineering Redline 3)

**Recommended: yes**, the same package trovestep uses. No existing dependency can send PostHog events.
It is loaded only in the browser, by dynamic import, so the server bundle and first paint are
untouched.

**Decision:** approved, the same as Risetive — human, 2026-09-28 (「全部和risetive的一样」).

### Q3. Where does the project key come from, and may production get a new env key? (operations Redline 5)

**Recommended: a server-side env variable `POSTHOG_PROJECT_KEY`, as in trovestep.** Reasons:
- it is unset in development and in tests, so they stay silent by default;
- the key never sits in the repository (engineering Redline 1 names tokens).

The consequence is that the production Render service needs the new key `POSTHOG_PROJECT_KEY` set
before the next deploy. I ask you to approve that now, but I set it only at deploy time. This ticket
ends at merge (Finish: review).

Alternative: write the public `phc_` key as a constant in code, which needs no Render change. Not
recommended, because of the Redline 1 wording.

**Decision:** env variable `POSTHOG_PROJECT_KEY`, the same as Risetive. Adding it to the production Render service at deploy time is approved — human, 2026-09-28 (「全部和risetive的一样」). The human supplied the project key in chat. It lives in `app/.env` only.

### Q4. Privacy settings — the learners include children

**Recommended, the same as Risetive plus nothing more:**
- anonymize IPs (project setting);
- no cookie (localStorage);
- no session recording, no surveys;
- never `identify` a Clerk account, so events stay anonymous;
- autocapture of clicks and page views only (PostHog does not capture typed text by default).

skatgo has **no privacy page**. Adding one is new user-facing content in three languages, so it is
not in this ticket. If you want it, it gets its own ticket.

**Decision:** the same as Risetive, as recommended. The privacy page / terms is another ticket — human, 2026-09-28 (「全部和risetive的一样，terms其他工单再做」).

### Q5. How is "events reach the skatgo project" accepted without polluting it? (operations Redline 2)

**Recommended:**
- run the built app locally under the hostname skatgo.com (browser host mapping);
- intercept every PostHog request in Playwright and answer it locally;
- assert that the payloads carry the skatgo project's token, `$pageview` and click events, and a
  skatgo.com URL.

No test event is sent to PostHog. Seeing real events arrive is a post-deploy observation, not part of
this ticket.

**Decision:** accepted as recommended (covered by 「全部和risetive的一样」) — human, 2026-09-28.

### Note (no decision needed here)

With this ticket, `charter/product.md`'s line "Nothing measures it yet: there is no analytics on
skatgo.com" goes stale. The file is yours (product Redline 2), so I only report it. You may want to
edit it after the merge.
