# SKATGO-22 Handoff

Verified on 2026-09-27; awaiting human review. Finish: `review`.
Development result: `de16357`. No merge, closure or deployment.

## Delivered

Offline evaluation of SkatZero, JSkat MLPlayerPro with an experimental history
fix, and supplementary SkatKlar, against the unchanged Skatgo baseline at
`dbb2c4dc60152283534fad69f9746e7495a8a53b`.

- `report.md`: results, phase coverage, recommendation and limitations.
- `methodology.md`: registered seeds, samples, metrics and stopping rules.
- `reproduce.md`: isolated setup and exact experiment commands.
- `results.json`: paired estimates, contract/role counts, performance and validation.
- `provenance.json`: source commits, runtime versions, weights and baseline hashes.
- `evidence.json`: uploaded raw-evidence archive, size and verified SHA-256.

Only ticket documents and generated result records are committed. Experiment
scripts, downloaded sources, temporary patches, runtimes and weights remain
under ignored `tmp/`. The archive preserves the scripts, patch, fixtures, raw
outputs, failures and licenses, but excludes weights, environments and secrets.

## Acceptance

The four live Plane criteria were read at this handoff. This is an offline
chore; executable evidence, not a product browser session, settles its criteria.

| Criterion | Result | Observed evidence |
| --- | --- | --- |
| Reproducible candidate execution and phase coverage | PASS | 14/14 ONNX graphs loaded; release asset hashes verified. Actual SkatZero bid, Hand-choice and discard/declaration calls completed. JSkat and SkatKlar full-game phase smoke completed. Unsupported full-game ranking, Hand and Ouvert coverage are explicit. |
| Paired comparison and unchanged baseline | PASS | Three main pairings, each 180 independent boards/1,080 games; 3,240 main games. SkatKlar supplement adds 18 boards/108 games. Raw six-game records reproduce the paired CSV; contract/role counts and board-level intervals are in `results.json`. |
| Legality, visible information and controls | PASS | Zero detected illegal actions, provider errors, substitutions or timeouts in 3,348 formal games. All 360 identical-player games and 432 opening hidden-card comparisons passed. Stock JSkat's 6/9 history-identity failures and its excluded 36-game smoke are retained; the corrected actual feature-builder/inference audit passed. |
| Performance, Node feasibility and bounded scope | PASS | Same-machine callback latency, throughput and sampled whole-process memory recorded. All 14 same-input Node/Python graph outputs matched exactly. Full TS encoders are not delivered. Product diff is empty; no product dependencies, cloud resources, production traffic, training or paid resources were changed/used. |

The main primary SkatZero/JSkat difference is +0.73 game points/game,
approximate 95% interval [-0.83, +2.29]: inconclusive. Both beat the baseline
in this forced-contract pilot. SkatKlar/SkatZero is also inconclusive on its
small sample. Prefer a SkatZero integration prototype for its measured latency;
retain corrected JSkat as the alternative and defer the tested SkatKlar setup.

## Mechanical Defence

Ran the complete `engineering.md` Tools command once against committed
`de16357`; exit 0:

- Typecheck and production build passed.
- Six test files, 67 tests passed.
- Ten client chunks passed the server-only-reference check.
- The tracked StyleX literal check found exactly its one permitted occurrence.
- The built SSR module linked successfully.

The build emitted existing native-config-loader and large-chunk warnings.
No assertions or checks were weakened, and no generated product changes remain.
IntentFold's cap3handoff freshness update succeeded. This charter does not
configure an IntentFold usage declaration.

## Evidence Durability

The 183-entry archive is 2,106,724 bytes. It was uploaded through n-plane and
downloaded again; both size and SHA-256 matched:

`7606e72bb1c344ba55f637bba0a054f502c90f55ecc1bc0d1abaee1d2dcec99e`

The durable Plane asset URL is in `evidence.json`. No expiring signed URL was
committed. The original compilation failure and failed relative-path launch are
disclosed; neither entered a match score.

## Deviations

The advisory 900-board proposal became a preregistered 180-board main pilot.
The separately authorized SkatKlar supplement was reduced for runtime before
any mixed SkatKlar results to six boards per original seed against SkatZero.
Its original proposed larger scope and amendment remain in `methodology.md`.

JSkat's disposable source patch repairs confirmed history-identity encoding
and selects one inference thread. It is not stock upstream and not a product
patch. Full-game smoke scores are not ranked because the existing candidate
adapters do not preserve equivalent complete lifecycles and variant flags.

## Environment

Worktree: `/Users/yong/work/skatgo-ws/skatgo--SKATGO-22`.
Branch: `SKATGO-22-ai-benchmark`.
Reserved web port: `55022`; unused and confirmed free. No preview is required
for this offline artifact. All benchmark processes have exited.

Application env keys added, changed or removed: none. Test child environments
were credential-free. Azure, Render, DNS and production configuration were not
touched. Other tickets and the main checkout were not changed.

## Residual Work

A separate integration enabler should verify complete TS feature encoders,
all auction/discard/card-play phases, legal-action rejection, hidden information
through later histories, Hand/Ouvert, and the separation of opponent choices from
teaching explanations. A JSkat route must carry or upstream the history fix.
Naturally selected contracts and larger independent samples are needed for a
full-game strength claim. Native Linux search and actual Render capacity remain
unmeasured. None of these future changes are silently included in this chore.
