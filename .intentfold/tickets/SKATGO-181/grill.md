# Decided for You

1. What does the 35% observation constrain?
   Recommendation/decision: ordinary-card long-run player-side outcomes, not
   displayed short windows. The live incident and mode-specific human counts
   settle the distinction. `recordOf` is already authoritative.
2. How is the statistical gate fixed before tuning?
   Recommendation/decision: the first 600 verified pool deals train, the remaining
   400 are untouched holdout, three fixed role seeds, 10,000 deal-cluster bootstrap
   resamples and one-sided Bonferroni family adjustment for 17 profiles. Also
   report individual-seed Wilson intervals, not a false 1,200 independent trials.
   This is a reversible engineering implementation of the ticket's proposal.
3. Do selected daily-one cards share the 35% gate?
   Recommendation/decision: no. Preserve its selection mechanism, report that
   mode independently and flag insufficient dates. Human mode rates in the ticket
   already rule out applying an ordinary-deck gate there.
4. What changes existing snapshots?
   Recommendation/decision: nothing. Keep the old executable adapter, freeze the
   new policy in future snapshots, and activate new traits no earlier than
   2026-11-11 Berlin. Old snapshots with no policy field remain v1. No migration,
   history recomputation or production activation belongs to this run.
5. Which modules and dependencies change?
   Recommendation/decision: persona modules, CLI, local skill and focused
   acceptance only. Use `Policy.score/ranked`, `bidValueTable`, `toZ`, rules
   legality checks and existing PostgreSQL storage; no new dependency or schema.
6. How does expansion preserve previous identities and attendance?
   Recommendation/decision: keep all legacy random draws and add a separate
   strength stream. New bounded traits vary within the tested training envelope;
   expansion remains a configuration capability, not a 500-table or 500-profile
   statistical certification.

No question reaches the human: the ticket, observed APIs and existing constraints
settle scope/authority; calibration thresholds are predeclared engineering choices.
