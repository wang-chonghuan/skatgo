# SKATGO-181 Handoff

Verified for review on 2026-11-10. No merge, deployment, production mutation,
pending-job migration or production pause was performed.

## What Changed

- Updated the project persona skill before code/configuration: outcome semantics,
  independent holdout, date clustering, versioned decisions and expansion limits.
- Added persona-only bidding estimate noise, pickup/Hand, legal contract/discard
  selection and contextual declarer/defender card errors. Standard policies,
  models, encoder, rules, early ending, scoring and XP formulas are unchanged.
- Added policy identifiers to future snapshots; kept the executable v1 route for
  old jobs, including snapshots without a policy field. Unknown/mismatched routes
  fail without publishing a result.
- Added resumable `calibrate`, `calibrate-daily` and read-only `diagnose` commands,
  full legal move logs, phase audits and independent-cluster statistics.
  Bidding audits record the estimate offset and planned maximum; strict-value
  loss/rank diagnostics describe evaluated pickup, discard, contract and cards.
- Retained all 17 identities/names and old activity/legacy-trait random streams.
  Added strength parameters and a separate expansion stream; no dependencies,
  Terms, Charter, UI, room adapters or cloud resources changed.

## AC Results

1. **Passed: incident and semantics.** Read-only production export was legally
   replayed in local schema `review181`. `diagnose` reports total 184, own-side
   2/6 wins, scores `[0,0,98,86,0,0]`, and equal AI table scores on all six deals.
   Declarer, defence, all-pass, tiny samples and genuine six-win counting pass.
2. **Passed: predeclared ordinary holdout.** Training used pool indices 0-599;
   holdout used 600-999, all 17 profiles and seeds `strength-a/b/c`.
   Training replayed 61,800 games; holdout replayed 41,200, including 400
   canonical games. Each persona has 400 independent cards and 1,200 seeded
   games, with 1,120-1,158 valid non-all-pass outcomes. Confidence resamples
   cards, not replicas: 10,000 fixed cluster draws and the predeclared
   one-sided `1-.05/17` family quantile. All 17 upper bounds are below 35%.
3. **Passed: paired distributions.** Population mean win rate is 34.39% -> 19.84%;
   mean score 16.78 -> -9.69; negative-score fraction 8.66% -> 18.43%;
   XP/deal 10.40 -> 9.48. Declaration share stays 33.54% -> 33.77%, not
   suppressed attendance/bidding dilution. Conditional declaration wins are
   73.18% -> 43.11%; defence wins 14.93% -> 8.20%.
   Fixed six-card rounds: 1,570/3,366 AI-score copies -> 289/3,366
   (46.64% -> 8.59%), six-win rounds 24 -> 0 observed, not prohibited.
   New scores exceed AI in 957/20,400 games; round maxima still reach 582.
   Audited strict-value deviations: pickup 1,292/6,551, contract 824/4,396,
   actual discard 793/4,396, cards 58,146/162,569. No results were filtered.
4. **Passed: authoritative games/boards.** Every calibration game legally
   replays and its XP recomputes. Isolated v1/v2 free and actual prepared
   daily-one/six jobs complete; saved totals and XP equal SDK/HTTP reads.
   The original incident remains unchanged beside local v2 daily jobs
   (one: -142, six: -532, XP 54). English web/proxy and backend board reads
   return the same rows. Human fixture names/records and canonical games stay
   unchanged. UI pixels were not changed; SDK/HTTP is the approved backend
   acceptance surface, so no visual-review pass was required.
5. **Passed: snapshots/growth.** Restart/config changes preserve saved jobs,
   logs, completed rows and pool indices without duplicate XP. Missing-policy
   v1 jobs retain the old adapter; unknown policies are refused. Exact legacy
   names/traits/activity and prefix identity hold at 17/100/200/300/400/500.
   Near-canonical new strength configuration is rejected. This screening is
   not a statistical certification of all 500 generated profiles.
6. **Passed: skill/delivery.** Skill validator and documented validate/plan,
   diagnosis and calibration CLI commands ran. Full mechanical defence:
   backend typecheck/build and 66 tests; frontend typecheck/build, 344 tests,
   client bundle, token/literal checks, SSR link, built SEO and 28 SEO tests.
   After the elapsed-time signature repair, backend typecheck/build and all
   8 strength tests passed again in a separate local verification database.
   Offline SEO explicitly reports forum posts not checked; backend forum tests
   passed. No test/assertion was weakened.

### Holdout Per Profile

Rates exclude all-pass. Upper is the approximate simultaneous one-sided bound,
not a guarantee. All rows use 400 distinct cards and three seeds.

| ID | Wins/Valid Games | Win % | Family Upper % | Mean Score | XP/Deal |
|---|---:|---:|---:|---:|---:|
| moss | 173/1158 | 14.94 | 18.59 | -25.71 | 9.21 |
| fern | 170/1128 | 15.07 | 19.06 | -11.78 | 9.29 |
| river | 201/1147 | 17.52 | 21.85 | -19.45 | 9.24 |
| cedar | 238/1134 | 20.99 | 25.75 | -4.12 | 9.60 |
| bright | 258/1139 | 22.65 | 27.64 | -6.22 | 9.67 |
| willow | 236/1137 | 20.76 | 25.42 | -8.04 | 9.50 |
| silver | 288/1144 | 25.17 | 30.19 | -0.66 | 9.79 |
| quiet | 265/1142 | 23.20 | 27.89 | -4.31 | 9.64 |
| katrin | 233/1131 | 20.60 | 25.27 | -5.06 | 9.53 |
| jochen | 248/1148 | 21.60 | 26.39 | -9.01 | 9.70 |
| ute | 182/1120 | 16.25 | 20.44 | -7.91 | 9.25 |
| alex | 235/1153 | 20.38 | 24.93 | -14.32 | 9.46 |
| heide | 221/1140 | 19.39 | 23.82 | -8.34 | 9.49 |
| paul | 250/1129 | 22.14 | 27.22 | 0.59 | 9.61 |
| frank | 235/1143 | 20.56 | 25.13 | -9.95 | 9.49 |
| nico | 167/1156 | 14.45 | 18.31 | -27.25 | 9.12 |
| sunny | 244/1134 | 21.52 | 26.39 | -3.25 | 9.60 |

Role strata cover 120-181 distinct declarer cards and 248-290 defender cards
per profile, with their own bounds in the report. Ordinary C/S/H/Grand and
Grand-Hand have >=40 card clusters for all profiles. D has enough for 16/17;
Null (22-36), Null-Hand (4-8) and suit-Hand strata do not. No separate
long-run claim is made for those limited strata.

### Daily Modes

Actual server deals from 2026-11-02 through 2026-11-10 were retained, including
selected-one provenance and original benchmark/opponents. No new selected
cards were generated for this comparison. Whole daily-six dates are clusters;
selected-one dates are clusters, with no fabricated six-card rounds.

- Daily-six: 9 dates/54 cards, 162 seeded games per persona, 5,562 total
  replayed games including old/new/canonical. Population win rate
  31.89% -> 17.33%; full AI-score copies 167/459 -> 22/459 rounds.
- Selected daily-one: 9 dates/9 cards, 27 seeded games per persona, 927
  total replayed games. Population win rate 72.98% -> 27.23%;
  new individual observations 11.11%-40.74%.
- Both modes have only 9 independent date clusters: **insufficient** for
  a long-run conclusion. Neither uses the ordinary 35% gate. Same-period
  human mode observations were 15.8% daily-six, 33.3% free, 42.9% selected-one;
  small human samples do not define universal limits.

### Frozen Evidence

- Model commit: `1fe5cabbd5f9c3e77ab51714b0ac702e5a71e53b`;
  verified pool `skatzero@1fe5cab`.
- Config hash: `ec0e0d3f71d233ee654c719ac6787dd55a3bdbe45e635d05bfdfa90809ed8614`.
- Stable training signature:
  `aca7a82680356a422f6163ee5205b2c18fb8c83eced1f368cf80db4d79c59dc0`.
- Daily fixture hash:
  `ab660da98f9b794ea30685eeb88608546dbbd42351252b55d3536e37fa81aabe`.
- Ignored evidence: `tmp/train-final`, `tmp/holdout-final`, `tmp/daily-final`,
  `tmp/incident.json`, `tmp/incident-acceptance.json`, diagnosis and test logs.
  Each experiment retains full per-game logs and manifest, role/contract
  bounds, per-seed Wilson diagnostics, score/round quantiles and audit summaries.
  Initial training took approximately 562 seconds; holdout approximately 585
  seconds for game/checkpoint work, plus report calculation. Resume timings
  describe saved-log processing, not newly played independent games.

From the repository root, after building, reproduce with the CLI commands in
`multiplayer/README.md`; use new output folders for a fresh experiment, or the
unchanged final folders to resume. Diagnosis exports only server deals and
simulated records. No production human account/game data is committed.

## Deviations

The proposed 15%-25% majority and 26%-30% stronger bands were hypotheses.
Training produced roughly 12%-23%; holdout roughly 14%-25%. Kept this outcome
instead of adding stronger profiles solely to fill a desired distribution.
Daily modes use actual stored dates and openly insufficient uncertainty.
The final diagnostic repair excludes elapsed time from the training signature.
Original experiment folders remain intact; every existing checkpoint was
replayed into fresh final metadata, with identical statistics and no rerolls.
A targeted recheck initially collided with the preview's database-wide leader
lock; it passed in its own local database without changing product checks.

## Environment

- Worktree: `/Users/yong/work/skatgo-ws/skatgo--SKATGO-181`;
  branch `codex/SKATGO-181-strength`, base `39e784beb6a84e964e4e30a5eb5a11383f9a3f50`.
- Web `55181` (PID 14527), backend `56181` (PID 14454), PostgreSQL `57181`,
  Docker context `colima-skatgo`. Preview deliberately remains running for review.
- Preview uses local schema `review181`; final tests use separate local
  database `skatgo_strength_final181`. Persona background control is disabled
  in the preview; imported/locally completed rows are review fixtures, not
  production activity.
- No persistent application key changes to sync. Local env files remain
  ignored. Preview process overrides: `PORT`, `DATABASE_URL` search path,
  `MULTIPLAYER_URL`, local admission key and `SKATGO_TEST_ACCOUNTS=1`;
  backend receives its existing translation keys from the development env.
- Bundled `strengthSince=2026-11-11` is a Berlin-day lower boundary, not a
  deployment promise. Before it, new snapshots are v1; afterward, newly
  planned activities are v2. Already-saved jobs of any day stay v1/v2 as
  recorded. An already-planned production day is not silently replaced.
  The preview's one-character fixture explicitly overrides this date locally.

## Residual

Collect more independent selected/daily dates and rare-contract cards before
making stronger claims. Retuning must keep a genuinely unseen holdout, not
reuse examined cards to select favorable profiles. Growth to 100-500 retains
identity/config contracts but still needs upper-tail calibration of the
generated population. No finite evaluation guarantees that every displayed
short-window win rate stays below 35%, or that personas are indistinguishable
from humans. Deployment/activation and any queued-job migration need separate
explicit approval.

## Check

No visual, wording or interaction change needs subjective acceptance.
English local preview: `http://localhost:55181/en/daily`.
The measured strength choice and limitations above are the review decision.

## Decided for You

- Calibrate long-run ordinary-card decisions, never enforce a displayed quota.
- Keep 17 measured profiles; do not manufacture a stronger subgroup.
- Preserve all old snapshots/history and use the next eligible fresh Berlin-day
  plan, not a silent pending-job migration.
- Report selected-mode and expansion uncertainty independently.
