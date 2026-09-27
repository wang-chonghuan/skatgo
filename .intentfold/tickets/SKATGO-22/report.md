# SKATGO-22: Skat AI Offline Evaluation

Date: 2026-09-27. Baseline: Skatgo `dbb2c4dc60152283534fad69f9746e7495a8a53b`.
This is a selection experiment, not an integration or a production benchmark.

## Decision

**Prioritize a SkatZero integration prototype; retain JSkat ML as the alternative.**
Both outperformed the unchanged Skatgo heuristic in the registered fixed-contract
pilot. Their direct comparison did not resolve the primary metric. SkatZero's
measured decision path was much faster and its ONNX graphs ran directly in Node.
This is an engineering preference, not a claim that SkatZero is universally stronger.

JSkat's tested configuration is **MLPlayerPro on the pinned SkatKlar fork, plus an
experimental history-identity fix**. Do not substitute the old desktop release,
call this stock upstream JSkat, or omit the patch when reproducing its numbers.
The dense models were loaded and checked for runtime parity, not separately ranked.

SkatKlar is a supplemental Java-search candidate, not a replacement for the two
main candidates. Its pure-Java configuration is substantially more expensive on
this machine. Its small comparison must not become a full four-way ranking.
Native-solver performance on Linux/Render was not tested.
Defer this configuration for integration: the supplement establishes no strength
advantage and exposes multi-second tail latency.

## What Was Run

The exact design and its pre-mixed-run resource amendment are in `methodology.md`.
Raw output, commands, feature fixtures and digests are in the accompanying evidence
bundle. `reproduce.md` gives the setup and commands.

- Two main candidates plus the unchanged Skatgo baseline: three pairings, three
  seeds, 60 boards per seed, six games per board: **3,240 games**.
- The same 180 independent boards are reused across main pairings. There are not
  540 independent deals or 3,240 independent statistical observations.
- Each pair: 540 singleton-seat games per side; each role has 180 games per side.
  Each contract has 30 independent boards, 90 singleton games per side, or 30
  per side and role. Roles are declarer, next defender, remaining defender.
- Predetermined post-discard hands and skat; no candidate chooses its discard.
  Contracts cycle Clubs, Spades, Hearts, Diamonds, Grand and Null. All are plain
  pickup games. This intentionally includes hopeless contracts.
- All decisions use the same pinned arena rules and scoring. Skatgo decisions
  import the existing `ai.ts` and `cards.ts`; product files are not changed.

## Main Results

Positive differences favor the first named candidate. Intervals are approximate
95% normal intervals over paired **board** differences, not over individual games.
All comparisons are exploratory and unadjusted for multiplicity.

| Pair | Game Points/Game, Primary | 95% Interval | Seeger-Fabian Points/Game, Secondary | 95% Interval |
| --- | ---: | --- | ---: | --- |
| SkatZero - JSkat MLPlayerPro* | +0.73 | [-0.83, +2.29] | +3.88 | [+0.45, +7.31] |
| SkatZero - Skatgo | +5.34 | [+3.28, +7.39] | +11.82 | [+7.37, +16.26] |
| JSkat MLPlayerPro* - Skatgo | +6.20 | [+3.98, +8.42] | +11.86 | [+7.38, +16.35] |

`*` Experimental history fix, detailed below.

Do not rank SkatZero below JSkat because their separate differences against the
baseline are 5.34 and 6.20: these are different opponents and team compositions.
Their direct primary interval crosses zero. The favorable secondary interval for
SkatZero is useful exploratory evidence, not permission to switch primary metrics.

The primary metric is the ordinary declarer score; a defending singleton receives
zero. Defender contribution is visible in the secondary tournament score and raw
results. This metric is not an Elo estimate or a human win-rate prediction.

### Contract Breakdown

Primary paired mean differences; **30 boards per cell**. Full intervals and
role counts are in `results.json`.

| Contract | SkatZero - JSkat* | SkatZero - Skatgo | JSkat* - Skatgo |
| --- | ---: | ---: | ---: |
| Clubs | +1.47 | +5.87 | +6.40 |
| Spades | +0.86 | +6.84 | +5.13 |
| Hearts | +1.67 | +3.78 | +5.56 |
| Diamonds | +0.90 | +3.70 | +3.30 |
| Grand | +0.27 | +14.13 | +16.80 |
| Null | -0.77 | -2.30 | 0.00 |

No direct SkatZero/JSkat contract interval separates the candidates. Null's many
unmakeable forced deals produce little signal: JSkat/baseline's all-zero primary
differences do not establish equivalent Null skill. Keep Null-specific,
naturally makeable positions in the next integration acceptance work.

## SkatKlar Supplement

All three registered seeds completed: **18 independent boards, 108 games**,
against SkatZero only. Each contract has three boards; each side has 54
singleton games, 18 per role, or three per contract/role. Taking the first six
indices means the declarer is absolute seat zero; dealer and singleton seats
still rotate. This is a feasibility sample, not the 180-board main pilot.

| Pair | Game Points/Game, Primary | 95% Interval | Seeger-Fabian Points/Game, Secondary | 95% Interval |
| --- | ---: | --- | ---: | --- |
| SkatKlar - SkatZero | -13.24 | [-28.44, +1.96] | -21.76 | [-44.46, +0.94] |

Both approximate intervals cross zero. The negative means do not establish
that SkatKlar is weaker; the sample is too small for a decisive ranking.
It supplies no evidence of an advantage sufficient to offset the measured
latency cost. No comparison against JSkat or the baseline was run for SkatKlar.

## Stage Coverage

| Candidate | Bidding and Pickup Choice | Discard and Declaration | Card Play |
| --- | --- | --- | --- |
| SkatZero | Actual upstream API algorithms, ONNX loader | Actual upstream API algorithms, ONNX loader | Registered pilot through the upstream external driver |
| JSkat MLPlayerPro* | Full-game smoke | Full-game smoke | Registered pilot with corrected history encoding |
| SkatKlar `belief-32-shipped` | Full-game smoke | Full-game smoke | Self-control, privacy control and small supplement |
| Existing Skatgo | Existing functions through a disposable protocol bridge | Existing `chooseDeclaration` | Existing `advise`, unchanged |

SkatZero used the API's documented hand, forehand, seed `202609270`, 231 pickup
iterations with the upstream 60-second cap. The actual answers were bid `72`,
pickup choice `GH`, and pickup discard/declaration `G.CT.ST`.
The three independent stage calls took 1.293 s, 1.272 s and 9.089 ms. The latter
two exercise alternative branches, not a claim that a Hand game also picks up.
This is one fixture per stage, not a latency distribution or bidding-strength test.

JSkat full-game smoke completed 6 boards/36 games; SkatKlar completed 1 board/6
games. Both also seat their candidate in the two-player side, so singleton
declaring counts alone do not describe all callbacks. Observed candidate calls:

| Candidate | Bid Calls | Pickup Calls | Discard Calls | Announcement Calls |
| --- | ---: | ---: | ---: | ---: |
| JSkat MLPlayerPro* | 172 | 16 | 16 | 16 |
| SkatKlar | 9 | 1 | 1 | 1 |

**There is no validated full-game strength ranking.** The upstream SkatZero arena
driver always returns zero for bidding; its tested API route is separate. The
JSkat adapter resets auction sessions before card play, hardcodes a plain
`GameContract`, and retains an algorithmic Grand-promotion rule. Those limitations
prevent full-game smoke scores from answering the full-game comparison question.
The one-board SkatKlar smoke's upstream `NaN` interval is invalid and not used.

**Hand/Ouvert:** SkatZero's Hand choice executed; no Hand or Ouvert tournament
was run. The fixed pilot's results cover neither variant. JSkat's adapter does
not faithfully preserve their flags in card play. SkatKlar's variants were not
validated here. Do not report source-level support as a passing variant test.

## Correctness and Fairness

- The main candidates and baseline each passed an identical-player control:
  18 boards/108 games, every paired difference exactly zero.
- SkatKlar passed 6 boards/36 identical-player games, also exactly zero.
- Opening hidden-card checks keep the seat's own visible information and seed
  fixed and reshuffle only hidden allocations. These are real independent
  perturbations, not the external driver's self-reported "Honesty control".
- Checks cover openings only, not every later history or every lifecycle.
- Across all 3,348 formal games: zero detected illegal actions, provider errors,
  substituted decisions or process timeouts. All 360 identical-player control
  games passed; all 432 hidden-card comparisons matched.
- The external protocol supplies complete deals to its process bridge. Its
  decision adapter retains only the allowed seat view before calling the AI.
  A future product adapter must enforce privacy at the input boundary itself;
  the present local test bridge is not suitable for production.
- SkatKlar's challenge entry skips discarding. The disposable coordinator sets
  only the declarer's `buried` memory to its already-known predetermined skat.
  An observer requires a completed search for every non-forced decision;
  silent heuristic substitution fails the game.
- No author or third-party tournament numbers enter any measured estimate.

### JSkat Failure and Correction

The uncorrected stack completed a six-board smoke, but its history feature
builder associated completed cards with the wrong players after the leader
changed. The library-backed audit found **6 wrong identities among 9 cards**
across the three possible leaders. Those original smoke scores are excluded.

`Trick.getCard(Player)` refers to a position inside a trick. The ML feature
builder treated it as an absolute player. The scratch-source correction walks
the actual trick leader and the three cards in play order. The subsequent audit
invoked the actual protected feature builder and real ONNX model and obtained
the expected `[[1,0],[2,1],[0,2]]` history. The experimental patch also sets ONNX
intra/inter-op thread counts to one. Weights and selection policy are unchanged.

The fork already carries five upstream adaptations/fixes in its `CHANGES.md`.
Both that base and this extra patch must be disclosed. This chore does not
publish an upstream fix or silently modify product dependencies.

### SkatZero Position Check

The external driver's `pos` tracks the trick leader, while the API sets the
original position. The actual encoder uses this field only when `drueck` is
true (discarding); the pilot always has it false. An executable audit of
18 contract/role fixtures, with positions 0/1/2, confirmed identical card-play
features and real ONNX outputs. Six positive controls changed the discard
features as expected. This investigated discrepancy does not invalidate the
card-play results. It is still relevant when implementing the discard encoder.

### Excluded and Failed Setup Work

The initial disposable Java probe failed to compile because its classpath
omitted project classes. The corrected compile is recorded separately; the
failure log remains in the bundle. A position-audit launch also failed before
child creation because relative executable paths were resolved in the source
directory; the absolute-path invocation passed. Neither produced match scores.

The 36-game unpatched JSkat smoke is retained but excluded from ranking because
of the 6/9 history-identity failures. The one-board SkatKlar full-game smoke
printed an undefined upstream confidence interval; it remains phase evidence
only. These are not silently discarded successful experiments.

## Runtime and Node Feasibility

Reference host: Apple M5 Pro, 24 GiB RAM, 15 logical CPUs, macOS arm64.
CPU inference only; JVM heap limit 2 GiB. The SkatZero match driver sets
intra-op threads to one and leaves inter-op at the library default. The JSkat
patch sets both to one; SkatKlar has one search thread. The separate graph
microbenchmarks explicitly set both inference thread counts to one.
These are same-machine configurations, not equal per-move compute budgets:
the neural policies and multi-world search do different amounts of work.
Python 3.12.13 / NumPy 2.5.3 / ONNX Runtime 1.30.0; Node 24.16.0 /
`onnxruntime-node` 1.30.0; Java 21.0.12.1+1 / ONNX Runtime 1.19.2.

**14/14 ONNX graphs loaded and produced exactly matching Node/Python outputs**
for the same tensors: maximum absolute error zero, no mismatched values and
matching argmax. The JSkat release assets also match the official SHA-256 digests.
This proves graph/runtime compatibility, not a completed TypeScript feature
encoder or parity against the original training framework.

Node graph-only measurements, 20 warmups and 200 timed iterations per graph:

| Model | p50 | p95 | Graph Load |
| --- | ---: | ---: | ---: |
| SkatZero nine graphs | 0.162-0.191 ms | 0.176-0.211 ms | first 30.2 ms, others about 3 ms |
| JSkat bidding transformer | 0.356 ms | 0.698 ms | 64.7 ms |
| JSkat card-play transformer | 4.183 ms | 5.073 ms | 126.5 ms |
| JSkat game-eval transformer | 0.446 ms | 0.494 ms | 27.6 ms |

SkatZero uses actual opening-state tensors and legal-action batches from its
upstream encoder. JSkat uses deterministic interface-shaped fixtures. These
fixture differences and runtime versions matter; this is not a FLOP-matched
algorithm benchmark.

Complete decision callbacks in the main pilot, including protocol overhead:

| Player | Calls | p50 | p95 | Maximum |
| --- | ---: | ---: | ---: | ---: |
| SkatZero | 28,835 | 0.526 ms | 1.035 ms | 4.226 ms |
| JSkat MLPlayerPro* | 28,820 | 18.157 ms | 19.946 ms | 39.583 ms |
| Skatgo | 28,487 | 0.264 ms | 0.274 ms | 2.604 ms |

These include forced one-legal-card decisions. The temporary bridge contributes
to Skatgo latency; it is not the latency of the browser's direct `advise` call.
The Node graph result must not be substituted for the Java callback result.

The separate SkatKlar/SkatZero supplement:

| Player | Calls | p50 | p95 | Maximum |
| --- | ---: | ---: | ---: | ---: |
| SkatKlar `belief-32-shipped` | 1,458 | 0.750 ms | 1,443.909 ms | 22,675.922 ms |
| SkatZero | 1,452 | 0.534 ms | 1.055 ms | 2.164 ms |

The low SkatKlar median must not obscure its tail: late or forced moves can be
cheap while difficult searches take seconds. Its mean was 302.6 ms. These are
the observed Java-search results, not a prediction for its native Linux solver.

JSkat discard smoke: 16 calls, p50 420.9 ms, p95 604.3 ms. SkatKlar's 9
`prepareDeal` callbacks were p50 757.7 ms, p95 1,522.4 ms; 9 subsequent bidding
callbacks were p50 197.1 ms, p95 839.7 ms. Its one discard call is insufficient
for a tail-latency claim. Do not compare a cached pickup boolean with the cost
of deciding whether to pick up.

Indicative cold-path observations: SkatZero's first helper startup appears in
`startGame` (observed maximum 174.7 ms); JSkat's first pooled player allocation
appears in `createSession` (observed maximum 1,463.0 ms). These are not repeated
isolated process-start distributions.

Whole-process-tree sampled peak RSS, including JVM, both contestants and helpers:
SkatZero/JSkat 782-861 MiB; SkatZero/baseline 536-569 MiB;
JSkat/baseline 644-780 MiB. Sampling interval is 0.5 s and can miss short peaks.
SkatKlar/SkatZero was 800-1,135 MiB, taking 445.5 s for its 108 formal games.
These are not per-bot allocations. SkatKlar's 36-game self-control took 242.3 s.
Some local setup/tests overlapped; no timing is a quiet production capacity test.
There is no measured Render latency, memory budget, concurrency or cost result.

Whole-command throughput, including arena startup, scoring and both players,
was 4.62 games/s for SkatZero/JSkat, 33.45 for SkatZero/baseline, 4.93 for
JSkat/baseline and 0.24 for SkatKlar/SkatZero. These are mixed-match throughputs
on different-sized samples, not per-bot request capacity.

## Integration Boundaries

SkatZero's pure Node route remains a prototype to build, not something delivered
here. Port and verify suit normalization, relative seats, legal-action order,
history, discard encoding, bidding simulation and the API's look-ahead step.
Keep the existing Skatgo rules authoritative and reject illegal model proposals.
Do not pass complete room state to a seat's AI.

For JSkat, direct ONNX use can avoid shipping Java, but still needs the feature
encoder and complete phase policies. A Java sidecar preserves more reference
code but introduces another runtime, model pool and lifecycle. The history bug
and adapter variant loss are concrete acceptance cases for either route.

SkatKlar needs its search, sampler and belief together; loading the small belief
network alone does not reproduce its playing strength. No TypeScript SkatKlar
port or Node-callable search engine was validated. Native Linux performance is
a separate future experiment, not a number to infer from this Mac.

Current Skatgo opponents and teaching hints share `ai.ts`. Replacing opponents
does not make the old rule-based explanation a valid account of a neural
choice. A future integration ticket must preserve or redesign that boundary.

## Maintenance and Provenance

Source and model maintenance are separate. SkatZero's pinned commit is
2025-06-19; the seed records the author's 2026 reply. That is low-frequency
maintenance, not evidence of frequent new algorithms. JSkat's model release is
`v1.4.0`, 2026-02-17, independently of main-program commits. The pinned SkatKlar
commit is 2026-09-27, but recent activity does not establish long-term support.
See SKATGO-21 for the original research links and author statements.

Repository license declarations: SkatZero MIT; JSkat Apache-2.0; separate
JSkat model repository MIT; SkatKlar BSD-3-Clause. Keep notices and the modified
fork/patch provenance in any future integration. This is a source inventory,
not a commercial licensing clearance.

No product code, lockfile, rules, teaching hints, UI, Azure, Render, DNS or
production configuration changed. No training, paid resource or public game
server was used. The ticket's finish remains `review`.
