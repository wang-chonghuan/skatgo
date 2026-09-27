# Grill

1. **Azure boundary**
   - Question: Does "no Azure" include the assistant's Azure OpenAI endpoint?
   - Recommendation: Keep Azure OpenAI as the only Azure dependency and remove Azure only from
     hosting, images, database identity, and domain origin.
   - Reason: The live ticket explicitly names Azure OpenAI as the exception, and the existing
     implementation already uses Trovestep's `LLM_BASE_URL` / `LLM_API_KEY` Bearer contract.
   - Decision: Accepted under `Grill: self`. The local Trovestep and Skatgo values have matching
     hashes, and a live `gpt-5.6-luna` request returned HTTP 200 with a non-empty answer.

2. **Render service shape**
   - Question: Should production use a free sleeping service or a paid always-on service, and should
     pushes deploy automatically?
   - Recommendation: One Frankfurt Docker Web Service on the Starter plan, one instance,
     `autoDeploy` off, health check `/zh`, with releases pinned to an explicit commit.
   - Reason: Production currently keeps one instance live, and an explicit release prevents an
     unreviewed branch push from becoming production.
   - Decision: Accepted under `Grill: self`, based on the existing always-on production contract and
     the ticket's requirement to deploy the merged `main` commit.

3. **Production configuration**
   - Question: Which existing values move to Render?
   - Recommendation: Transfer the production Clerk publishable/secret keys from `ca-skatgo`; transfer
     `LLM_BASE_URL` and `LLM_API_KEY` from Trovestep's local environment; set
     `LLM_MODEL=gpt-5.6-luna` and `LLM_EFFORT=medium`; omit all database variables.
   - Reason: These are the only runtime inputs the application reads. The Azure-created database
     schema and role are unused.
   - Decision: Accepted under `Grill: self`, based on source inspection and the live Azure
     Container App environment inventory.

4. **Cutover order**
   - Question: In what order can DNS and Azure resources move without creating downtime or an
     unverified destructive step?
   - Recommendation: Deploy and verify the Render hostname first; add the Render custom domain;
     change Cloudflare DNS; wait for Render verification and TLS; prove the public site is served by
     Render; only then delete the Azure app, schema/role, image repository, and obsolete Azure domain
     verification record.
   - Reason: This keeps the old origin available until the new origin is independently healthy and
     makes the irreversible cleanup depend on public cutover evidence.
   - Decision: Accepted under `Grill: self`. The ticket requires this order, and the user explicitly
     approved Operations redlines 3, 4, 5, and 6 in the current conversation; that approval is also
     recorded on the Plane ticket.
