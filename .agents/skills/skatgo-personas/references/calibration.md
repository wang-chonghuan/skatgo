# Strength Calibration

Read before changing playing strength. Results, scores, participation volume and
board displays are never controls for enforcing an outcome.

## Measurement Contract

Use `recordOf` for both humans and personas: seat zero wins when its own
declaration wins or an opponent's declaration loses; exclude all-pass games from
the win-rate denominator. Count them in score/XP summaries. Report declarations,
declaration/defence wins, contract strata, effective games and distinct cards.
Merge existing human aliases in read-only diagnosis; report each person and each
mode so a prolific person or selected daily-one cards do not dictate the target.
Do not infer nationality, private traits or identity from human samples.

35% is the November 2026 ordinary-card sample's reference upper edge, not a
universal human limit. The initial ordinary-card hypotheses are roughly 15-25%
for most characters and 26-30% for a few stronger ones, with overlapping outcomes.
Selected daily-one cards need their own sample, including selection-rule/date
provenance. Never change mode attendance to dilute an overly strong profile.

## Frozen Experiment

For the SKATGO-181 baseline experiment:

- Use the verified 1,000-deal free pool in its stored order. Indices 0-599 are
  training; indices 600-999 are holdout. Deck identity, not persona or random seed,
  is the unit of separation. Detect repeated decks and overlapping partitions.
- Use seeds `strength-a`, `strength-b`, `strength-c` for every persona and policy.
  Parameters may be chosen only from training output. Freeze the roster/hash and
  policy before examining holdout. Failed holdout cannot become new training.
- Run canonical opponents and the unchanged standard seat-zero plan. Compare old
  and new persona adapters on identical cards and seeds. Cache only pure model
  evaluations and fixed inputs; never cache or filter a desired result.
- Resample distinct deals as clusters, keeping all seeds/old/new records of a
  deal together. Use 10,000 deterministic percentile bootstrap resamples.
  Ordinary-card acceptance uses a one-sided family-adjusted upper quantile
  `1 - 0.05 / number_of_profiles`, <=0.35 for each of the 17 profiles. Report
  unadjusted 95% cluster bounds too. This is an approximate sample-based bound,
  not an absolute guarantee or certification of unseen generated profiles.
- Report one-sided Wilson 95% bounds for each individual seed's independent
  cards as diagnostics only. Do not apply Wilson with `400 * 3 * 17` trials.
  Bootstrap is inappropriate when too few independent clusters exist; mark
  small-date/contract strata as insufficient rather than declaring success.
- Group ordinary cards into fixed non-overlapping six-deal rounds within each
  seed for score replication/all-win/tail diagnostics; do not wrap leftovers or
  combine cards across seeds. Real daily-six dates remain separate date groups.

Record pool/model/hash, partition identities, seed names, config, policy, runtime,
errors and complete move logs. Verify all generated games legally replay, then
summarize every result, including negative scores and all-pass games.
Tune stage-specific tendencies, not a single generic mistake probability.

The implementation's `calibrate`/`diagnose` CLI and `multiplayer/README.md` own
current arguments and artifact formats. A small `--deals` run is a smoke check,
never holdout acceptance. Keep expensive outputs under the ticket's ignored
`tmp/`; retain durable experiment metadata/results in its handoff.

For daily-mode evidence, export only server deals and simulated records in a
read-only date range, then use `calibrate-daily` with the same frozen training
configuration. Keep each daily-six date as one uncertainty cluster and each
selected daily-one date as its own cluster. Preserve the server's selection,
benchmark and opponents; neither generate easier replacement cards nor treat
three seeds or 17 characters as independent dates. Report available dates and
declare fewer than 40 date clusters insufficient for a long-run conclusion.

## Decision and Audit Contract

Use persona-only bounded adapters for bidding estimate noise, pickup/Hand,
discard/contract judgement and declarer/defender card errors. Only claim dimensions
actually consumed by runtime. Obvious forced moves remain normal; contextual
complexity and persistent per-activity form affect errors without reading future
results, hidden hands, board ranks or prior win counts.

Audit phase, role, contract, legal candidates, selected rank and strict-value
deviation. Raw model losses are not points or win chances; compare rank-depth
within a contract, not one shared absolute temperature across suit/Grand/Null.
Trace a chosen alternative through its legal move log. A deviation need not
change settlement and a score change need not change victory.

Compare per-profile/mode/role means and spreads, negative-score fraction, AI gap,
XP per deal, round upper quantiles, six-win frequency, and whole-round per-deal
score equality with AI. Repeated zero scores in lost defence are naturally equal.
Never require every deal to differ or hide short-window 100% records.

## Revision and Growth

Keep old adapters and snapshots executable. Declare the Berlin-day effective
boundary in bundled configuration; existing jobs/results remain unchanged.
New jobs freeze policy, exact traits and seeds. A registered identity's growth
prefix keeps its legacy name/activity draws; strength uses a separate stream.
Validate new profiles against the supported calibrated envelope and make
uncalibrated strength conspicuous. Config bounds are a screening gate, not proof
that 500 independently generated profiles satisfy a statistical limit.

Production deployment, pending-job migration, activation and history changes
are separate human decisions. Diagnosis never silently modifies the next game.
