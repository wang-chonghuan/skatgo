# Grill

Authority: live ticket `Grill: self`, explicit human delegation of SEO and charter decisions. Agent self-adjudication recorded after persisting the complete batch.

1. Should the existing root become German, or should every German URL move to the root namespace?
   Recommendation: German 200 root; /de redirects to it; keep the translated /de subpages.
   Reason: GSC already indexes root with German content and /de/spielen independently. Broad migration has no demonstrated need.
   Decision: accepted by agent. Existing GSC consolidation and Paraglide's central URL patterns support this narrow migration.
2. How can free play have genuine visible content without changing the game?
   Recommendation: keep the unchanged first-screen table; allow scrolling to a static reading section below. Give the no-JS fallback a real illustration and clear JavaScript requirement, not a fake playable table.
   Reason: game-table owns full-screen geometry and uses browser state. Static content can be rendered separately using current tokens.
   Decision: accepted by agent. The fullScreen table has its own viewport height; a sibling reading section requires only removing the free-play outer scroll lock. Existing hero-table.webp supplies an honest fallback visual.
3. Should daily landing and execution both compete for indexing?
   Recommendation: index the static explanatory landing; noindex execution, exclude it from sitemap and alternates.
   Reason: execution is per-player client state, whereas the landing can describe the real 12-deal, Berlin-midnight tournament.
   Decision: accepted by agent. Existing daily table requires player state; landing copy can use DAILY_DEALS and existing tournament behavior.
4. Are the required runtime resources available?
   Recommendation: isolated local PostgreSQL and both built services using ticket ports, no production writes.
   Reason: copied ignored env exists, Docker responds, committed models and pool exist. Local database helper supports ticket-specific provisioning.
   Decision: accepted by agent. Docker server 29.5.2 responds, both npm projects install from committed lockfiles, and the local helper names isolated containers by port. Ticket env overrides must point only at loopback.
5. Can this ticket claim new indexing or search traffic, and should it deploy?
   Recommendation: deliver verified branch for review; document delayed/external actions and do not submit stale production pages as if fixed.
   Reason: live ticket Finish is review, no release authority was given, and GSC reports remain delayed.
   Decision: accepted by agent. No GSC modification is justified before release: sitemap is already successful and URL inspection has established the baseline. Future index requests are explicitly pending.
6. Which charter contradictions may be corrected?
   Recommendation: German-primary positioning, English retained, existing PostHog, static SSR versus client-only state, stable locale/SEO runtime and sitemap-derived release verification.
   Reason: human expressly authorized SEO charter changes; keep unrelated design, engine, infrastructure and data boundaries intact.
   Decision: accepted by agent under explicit human charter authorization. No token additions or unrelated design changes are needed. Replace the stale post-release route-prefix loop with a sitemap-derived checker while preserving commit identity verification.
