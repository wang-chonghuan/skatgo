# SKATGO-22: Preregistered Pilot

Recorded on 2026-09-27, before any formal match. This is an offline selection
experiment, not a production integration or an estimate of Render performance.

## Sampling

- Formal seeds: `202609271`, `202609272`, `202609273`.
- Each seed: 60 independent deals from the pinned arena's `Board.of(seed,index)`.
- Comparisons: SkatZero versus JSkat MLPlayerPro, SkatZero versus the unchanged
  Skatgo heuristic, and JSkat MLPlayerPro versus the unchanged Skatgo heuristic.
- Each deal is played six times: A occupies each singleton seat against B/B,
  then B occupies that seat against A/A. Provider seeds depend on board and
  seat, never on contestant identity.
- Contracts cycle Clubs, Spades, Hearts, Diamonds, Grand, Null. Declarer is
  `floor(boardIndex / 6) mod 3`; dealer rotates through `Board.of`.
- Both halves receive identical post-discard ten-card hands and two-card skat.
  The two cards are predetermined random discards; no contestant chooses them.
  The existing `GameEngine.startChallengeDeal` drives the game, not new rules.
- This deliberately forced contract mix is a stress test, not a sample of human
  auctions or of naturally selected makeable games. All deals, including
  hopeless contracts and zero-difference deals, stay in the denominator.
- Plain pickup games only in the formal card-play pilot. Hand and Ouvert are
  separate support questions, not implied by a passing plain-game result.

## Controls and Failures

Smoke/control seeds do not enter formal estimates. Before the formal pilot,
run identical-player comparisons and hidden-card perturbations. The latter
keep the opening seat's hand, visible skat and provider seed constant, and
change only hidden allocations; they do not establish a proof for all later
game states.

Stop an affected comparison on a timeout, illegal action, provider exception,
substitute-player action or confirmed feature-contract inconsistency. Preserve
the offending board and logs. Do not score a substituted action as the
candidate's action. If a disposable external-runtime correction is needed,
retain both its original failure evidence and its exact patch, label the
corrected configuration, rerun affected controls, and never describe the
configuration as unmodified upstream.

Sampling stops at 60 deals per seed, regardless of the observed scores. A
failed comparison is incomplete, not a smaller successful sample. Per-process
wall time is capped at 20 minutes. No new seeds are selected to improve an
interval. No cloud, public game-server traffic or training is permitted.

## Analysis

The sampling unit is the independent deal, not the six correlated games.
Report the mean paired game-point difference per singleton game and a
two-sided 95% interval, using the sample standard deviation across board
differences divided by sqrt(n). Also retain the upstream tournament scoring,
per-contract and per-role counts, failures and raw per-game records.

The three pairwise intervals are exploratory and unadjusted for multiple
comparisons. A confidence interval crossing zero is inconclusive, not a tie.
The 180-deal pilot deliberately replaces the advisory 900-deal proposal;
larger confirmation is future work, not an unreported continuation.

## Runtime

Use CPU inference, one arena thread, credential-free child environments,
pinned source commits and model hashes. Report actual inference thread
configuration; do not imply equal threads where the original runtime uses
automatic sizing. Graph timings use 20 warmups and 200 repetitions with one
intra-op and one inter-op thread. Graph latency is separate from complete
decision latency, protocol overhead and cold process startup.

Node/Python parity compares identical input tensors. Passing it establishes
graph/runtime compatibility only, not a completed TypeScript feature encoder
or behavioral parity with the original training framework.

## Pre-Formal Correction

The original JSkat adapter stack completed six smoke deals (seed `91002`), but
the library-backed `HistoryAudit` confirmed six player-identity mismatches in
nine cards across the three possible trick leaders. `Trick.getCard(Player)`
indexes position within the trick; the ML history builder treated that argument
as the absolute player. Those original smoke scores are invalid for ranking.

The formal JSkat configuration uses two explicit, disposable changes in the
downloaded source only: derive completed-history player identities from each
trick's actual leader, and set ONNX intra/inter-op threads to one. Its weights
and card-selection policy are unchanged. Results must be labelled
"JSkat MLPlayerPro + experimental history fix", never stock JSkat. Both source
diffs and the original failure remain in the evidence bundle. No project
source, project dependency or online resource is changed.

## Supplement Authorized on 2026-09-27

The user subsequently authorized all three researched candidates. SkatKlar is
tested as `belief-32-shipped` at the same pinned `skat-ai` revision, with the
bundled belief model, 32 trump-game worlds and 128 Null worlds, one search
thread and no native solver. The preceding main comparisons continue unchanged.

Before its first mixed result is examined, the supplementary sample is fixed
at the first 18 deals of each original formal seed (54 independent deals per
pair), six rotations each, against each main candidate and the Skatgo baseline.
This smaller exploratory supplement has its own intervals; it is not pooled
with the 180-deal main comparisons or enlarged based on scores. A six-deal
identical-player smoke run and the same 108 opening hidden-card perturbations
must pass before mixed matches begin. The same 20-minute per-process cap applies.

Because the challenge entry point skips discarding, the disposable coordinator
sets SkatKlar's `buried` memory to the declarer's own predetermined discard.
No defender receives those cards. This is an explicit experiment adapter,
not a shipped integration. A card-play observer must confirm an actual completed
search on every decision with more than one legal card; otherwise the match
fails rather than scoring its silent heuristic fallback.

### Resource-Based Amendment Before Mixed Matches

During the identical-player control, the Java-only search completed 15 games
in approximately 149 seconds. Before any SkatKlar mixed match was started or
examined, reduce the supplement to six deals per original seed against SkatZero
only (18 independent deals, 108 games total). Keep the same contracts,
seat rotations, hidden-information control and per-process stopping rules.
The original 54-deal, three-opponent proposal above is superseded for runtime,
not because of observed strength. This is a low-power feasibility comparison,
not a complete four-player ranking. Main comparisons remain unchanged.
