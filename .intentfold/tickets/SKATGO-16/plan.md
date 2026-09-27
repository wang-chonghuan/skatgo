# Findings

- Skatgo already uses the same Azure OpenAI-compatible contract as Trovestep:
  `LLM_BASE_URL`, `LLM_API_KEY`, Bearer auth, and `/chat/completions`. The local
  endpoint and key match, so the model implementation does not need a second
  provider path.
- The root Dockerfile is structurally compatible with Render, but its comments,
  default port, and exposed port are Azure-specific.
- Deployment truth currently lives in `.intentfold/project.json`,
  `.intentfold/charter/engineering.md`, `.intentfold/charter/operations.md`, and
  `README.md`; all still direct future operations to Azure.
- Render project `skatgo` already has an empty `production` environment. No
  Skatgo service exists there yet.
- Production DNS still points the apex at the Azure Container Apps environment.
  The existing `www` record is proxied and redirects to the apex.
- Azure has one `ca-skatgo` Container App, no Skatgo Container Apps Jobs, one
  `skatgo-schema` database schema/role, and one `skatgo:latest` ACR repository.
- `ips-golive` can audit the final public site, but its domain-binding capability
  is Azure-specific. Render domain binding follows `ips-render-ops` capability 9.

# Route

1. Make the container runtime Render-native while preserving local and
   platform-provided `PORT` overrides.
2. Replace Azure deployment and operating instructions with Render service
   discovery, deploy, status, log, and post-deploy checks. Keep Azure OpenAI as
   the documented model provider.
3. Commit and push the ticket branch, then create a paid always-on Docker Web
   Service in `skatgo/production` from that branch.
4. Transfer only the required production configuration: Clerk production keys
   from the current app, and the Trovestep-compatible LLM endpoint/key contract.
   Do not transfer `DATABASE_URL` or `DATABASE_SCHEMA`.
5. Verify the Render hostname, locale redirects, assets, anonymous assistant,
   and production Clerk sign-in entry before changing DNS.
6. Merge to `main`, deploy that exact commit on Render, add the apex custom
   domain, switch Cloudflare DNS, wait for Render TLS, and prove Render is the
   serving origin.
7. After cutover proof, remove the Skatgo Azure Container App and database
   schema/role through n-easyapp's guarded deletion flow, then remove the
   Skatgo ACR repository and verify no Skatgo hosting resource remains.
