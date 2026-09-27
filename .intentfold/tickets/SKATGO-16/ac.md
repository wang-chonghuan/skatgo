# AC1 - Public domain serves Render

Check `https://skatgo.com` and `https://www.skatgo.com` over HTTPS after DNS
cutover. Require successful canonical navigation, working localized pages and
assets, a valid certificate, DNS records that no longer point at the Azure
Container Apps address, and response evidence that Render is the origin.

# AC2 - Course, account state, and assistant survive migration

Use the production Render deployment. Confirm a signed-out learner can open the
course and navigate to lesson and play routes. Send one assistant question while
signed out and require a non-empty streamed answer. Verify the production Clerk
configuration exposes the sign-in flow; when an existing signed-in browser
session is available, also confirm the account menu renders after sign-in.

# AC3 - Render owns the production workload

Read Render's live service and deploy state. Require one non-suspended `skatgo`
Web Service in the `skatgo/production` environment, built from this repository,
serving the merged `main` commit, with only the required Clerk and LLM
configuration plus Render-provided runtime variables.

# AC4 - Azure hosting is retired and operations point to Render

Read Azure Container Apps, PostgreSQL, and ACR state after cutover. Require no
`ca-skatgo`, no `skatgo-schema`/`skatgo-user`, no `skatgo` image repository, and
no Skatgo Container Apps Job. Run repository searches that require deployment
and operations instructions to identify Render as the host, while allowing the
intentional Azure OpenAI provider references.
