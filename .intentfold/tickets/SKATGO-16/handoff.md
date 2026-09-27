# SKATGO-16 handoff - 将生产托管从 Azure 迁移到 Render

## What changed

- `Dockerfile` now uses Render's `PORT=10000` container default while preserving runtime overrides;
  the build and start commands remain the existing Nitro Docker contract.
- `.dockerignore` excludes IntentFold and local verification artifacts from the Render build context.
- `.intentfold/project.json`, `README.md`, and the Engineering, UI, and Operations charters now make
  Render the production host and deployment path. Azure remains only as the explicitly retained
  OpenAI provider.
- The style literal defence now uses `git grep`, so it checks tracked product source and does not
  count Paraglide's ignored generated README.
- Created Render Web Service `skatgo` (`srv-dasmrm3ncjis73ardq2g`) in
  `skatgo/production`: Frankfurt, Starter, one instance, Docker, health check `/zh`, automatic
  deploys off. Its first deploy is live on commit
  `576a15981aec6ed6018fb4987a54199fb5f05a27`.

## AC results

1. **Public domain serves Render - pending cap4 cutover.** The Render origin is independently live at
   `https://skatgo.onrender.com`; `/zh` returns 200 with `x-render-origin-server: Render`.
   `skatgo.com` still points to Azure until the merged-main deploy and DNS/TLS cutover.
2. **Course, account state, and assistant survive migration - pass on Render origin.** Headed
   Playwright at 1280x820 and 375x812 opened the 11-card course map, lesson 1, and the play table
   without horizontal overflow or page errors. The production sign-in control is visible. A
   signed-out request to `/api/ask` returned HTTP 200 `text/event-stream` with a non-empty answer at
   both viewports.
3. **Render owns the production workload - pre-merge portion passed.** Render reports one
   non-suspended `skatgo` Web Service in environment `evm-dasmjfrbc2fs73fu7t30`, on Starter in
   Frankfurt, with exactly the six required Clerk/LLM keys and no database variables. It is live on
   the ticket commit; cap4 must switch the service to `main` and deploy the squash-merge commit.
4. **Azure hosting retired and operations point to Render - repository portion passed, retirement
   pending cap4.** Searches of active deployment documentation find no Azure Container App,
   n-easyapp, ACR, database-schema, or old-host references. The old Azure resources remain until the
   public Render cutover is proven, as required by the ticket.

Mechanical defence passed: TypeScript, production build, 67 tests, client-bundle scan, tracked-source
style literal count, and SSR link check. Render's own Docker build also completed successfully.

## Deviations

- No model-call code changed: inspection and a live probe proved Skatgo already uses Trovestep's
  `LLM_BASE_URL` / `LLM_API_KEY` Bearer contract with `gpt-5.6-luna` and medium effort.
- The first draft of `ac.md` expected anonymous `/api/ask` requests to be rejected. Current product
  behavior and the live ticket require the assistant to work for signed-out learners, so the check
  was corrected before handoff.
- A local Docker image build could not run because the Colima Docker socket was absent. The same
  root Dockerfile was built successfully by Render, which is the deployment target.

## Environment

- Local verification: production build on web port `55016`.
- Render application keys added: `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL`, `LLM_EFFORT`,
  `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`.
- Render application keys deliberately omitted: `DATABASE_URL`, `DATABASE_SCHEMA`,
  `EASYAPP_DEPLOY_COMMIT`, and a manually configured `PORT`.
- No env file or secret value was committed or printed.

## Residual

- cap4 must squash-merge the PR, point the Render service at `main`, deploy the exact merge commit,
  add and verify the custom domain, switch Cloudflare DNS, and run the public post-deploy check.
- After public Render origin proof, n-easyapp capability 4 still requires the human's exact
  confirmation phrase before deleting `ca-skatgo` and its schema/role. The ACR `skatgo` repository
  and obsolete Azure `asuid` DNS record are deleted only after that guarded step succeeds.
