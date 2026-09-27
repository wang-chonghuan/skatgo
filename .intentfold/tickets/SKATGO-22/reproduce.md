# SKATGO-22 Reproduction

This is a disposable offline experiment. Nothing in the evidence bundle is a
production AI adapter. Do not run it with application secrets or online traffic.
The report and Plane comment identify the downloadable evidence bundle and its
SHA-256. It contains the exact probes, patches, inputs, raw outputs and execution
records, but no environments, credentials, candidate source trees or model weights.

## Layout and Prerequisites

Use a checkout of Skatgo base `dbb2c4dc60152283534fad69f9746e7495a8a53b`.
Install the existing application dependencies with `npm --prefix app install`;
the temporary baseline imports this checkout's unchanged TypeScript AI through
its existing `jiti` installation. No `.env` is needed for any experiment.

Extract the bundle under `.intentfold/tickets/SKATGO-22/tmp/`. Preserve its
`results/` as an original-evidence directory and create an empty `results/`
before a fresh run: runners write output under the same deterministic names.
Do not resume a failed comparison by shrinking its sample or removing its failures.

The reference machine was macOS arm64, Apple M5 Pro, 24 GiB RAM, 15 logical CPUs.
Install Python 3.12.13 and Java 21.0.12.1+1 outside the product. The probes expect:

- `tmp/runtime/venv/bin/python`, with `numpy==2.5.3` and `onnxruntime==1.30.0`;
- `tmp/runtime/jdk-21.0.12.1+1/Contents/Home/bin/java` and `javac`;
- Node 24.16.0 on `PATH`;
- `tmp/runtime/node_modules/onnxruntime-node`, version `1.30.0`;
- `tmp/runtime/slf4j-simple.jar`, version `2.0.17`.

On another OS, adjust only the disposable `run.py` JDK discovery. `run.py`
constructs a credential-free environment; use it to launch external runtimes.
Its commands and original absolute paths are retained as evidence, not as portable
configuration. `launch.py` derives the current paths again.

## Source and Weight Pins

Clone these repositories into the named directories, then check out the exact
commits. The source lock and all file digests are in `results/provenance.json`.

| Directory Under `tmp/sources/` | Repository | Commit |
| --- | --- | --- |
| `skatzero` | `Jimboom7/SkatZero` | `1fe5cabbd5f9c3e77ab51714b0ac702e5a71e53b` |
| `skat-ai` | `honkphluxx/skat-ai` | `8cd77cd59899b96d29f204e2f06645619899ef9a` |
| `skat-ai/third_party/jskat` | `honkphluxx/jskat` | `733a05fd555258720fe487a0a46b477bf8ab5bff` |
| `skat-ml-models` | `avaskys/skat-ml-models` | `c7cd5f31c5a95a7726e4ecfd74d8f5837e8ac151` |

The JSkat fork's own `CHANGES.md` identifies its upstream base as
`57dd2cba6dd0574731605d7b23d5ebbcac5f9569` and describes five changes.
Initialize that submodule after pinning `skat-ai`; do not update it to upstream HEAD.

SkatZero's nine ONNX files and bidding tables are in its pinned repository.
SkatKlar's model is the pinned `belief-model/` directory. Never load `.pth` files.
Download the nine `.onnx`/`.onnx.data` assets from the official
`avaskys/skat-ml-models` release `v1.4.0` into
`sources/skat-ai/third_party/jskat/.jskat/models/`. Use the asset URLs and SHA-256
digests recorded in `runtime/ml-release.json`. External data files must remain
beside their ONNX graph. `models.py` verifies these hashes before inference.

Apply `patches/jskat-experiment.patch` to the downloaded JSkat checkout only.
It fixes completed-trick player identity encoding and selects one inference
thread. This is not a product patch and is not an upstream release.

## Build

Run the following from the ticket checkout root. `T` is just a local path.
The pinned Gradle wrappers fetch Gradle 9.3.1 and nested JSkat Gradle 8.6.

```bash
T="$PWD/.intentfold/tickets/SKATGO-22/tmp"
P="$T/runtime/venv/bin/python"
"$P" "$T/run.py" --name build --timeout 1200 -- \
  sh gradlew :arena:classes :arena:writeClasspath --no-daemon --max-workers=2 \
  -I ../../runtime/probe.init.gradle
"$P" "$T/launch.py" compile-patch
"$P" "$T/launch.py" compile
"$P" "$T/launch.py" feature-audit
```

The arena uses Java ONNX Runtime 1.19.2, not the Python/Node 1.30.0 runtime.
`compile-patch` writes isolated override classes before the upstream classes in
the classpath. `HistoryAudit.java` documents the original index mismatch;
`HistoryFeatureAudit.java` invokes the corrected feature builder and real model.
Do not remove the patch to reproduce a reported corrected-player result.

## Model and Stage Checks

```bash
"$P" "$T/run.py" --name model-load -- "$P" "$T/models.py"
"$P" "$T/run.py" --name python-parity -- "$P" "$T/parity.py"
"$P" "$T/run.py" --name node-parity -- node "$T/parity.mjs"
"$P" "$T/run.py" --name skatzero-phases --timeout 300 -- "$P" "$T/phases.py"
"$P" "$T/run.py" --name skatzero-position-audit -- "$P" "$T/position_audit.py"
"$P" "$T/launch.py" full jskat-ml-pro skatgo full-smoke-ml-base 6 91003
"$P" "$T/launch.py" full belief-32-shipped skatgo full-smoke-kk-base 1 91003
```

Parity fixtures prove Python/Node graph equivalence, not feature-encoder
equivalence. The SkatZero fixtures use the upstream feature encoder; the JSkat
fixtures are interface-shaped, not claimed as golden behavior. `phases.py`
uses the original SkatZero API functions, replacing only its PyTorch environment
loader with the verified ONNX agents. Full-game smoke scores are not ranked:
the external adapters do not provide a validated equal full-game contract.

## Controls and Registered Comparisons

```bash
"$P" "$T/launch.py" fixed skatzero skatzero control-skatzero 18 91002
"$P" "$T/launch.py" fixed jskat-ml-pro jskat-ml-pro control-jskat 18 91002
"$P" "$T/launch.py" fixed skatgo skatgo control-skatgo 18 91002
"$P" "$T/launch.py" hidden skatzero - hidden-skatzero 36 91001
"$P" "$T/launch.py" hidden jskat-ml-pro - hidden-jskat 36 91001
"$P" "$T/launch.py" hidden skatgo - hidden-skatgo 36 91001
"$P" "$T/suite.py"
"$P" "$T/launch.py" fixed belief-32-shipped belief-32-shipped control-skatklar 6 91002
"$P" "$T/supplement.py"
"$P" "$T/analyze.py"
"$P" "$T/evidence.py" --validate
```

The six-game rotations, forced contracts, seeds, sample sizes and stopping
rules are in `methodology.md`, including the pre-mixed-run resource amendment.
No search-size or sampling adjustment may be made after examining mixed scores.
Each process is bounded at 20 minutes. SkatKlar uses the Java solver; its message
that no native solver exists on macOS arm64 is expected and is not a substituted
player. Its observer rejects silent delegation or incomplete searches.

`analyze.py` recomputes board differences from the raw six-game records and
checks them against the recorded paired CSV. It uses independent boards as
the sampling unit, reports normal-approximation 95% intervals, retains all
zero-difference boards, and writes `summary.json`. Small-sample intervals,
forced-contract scores and unadjusted exploratory comparisons require the
limitations in the report.

`position_audit.py` tests the driver's varying `pos` field through the actual
feature encoder and ONNX agents. All 18 contract/role fixtures produce identical
card-play features and outputs for positions 0/1/2; six positive controls
confirm that the field does change discard features. It is inactive during the
fixed card-play pilot, not a confirmed adapter defect.

The evidence retains the initial probe compilation failure (missing classes in
its classpath), the original JSkat history defect and excluded stock smoke.
A position-audit invocation also initially failed before child startup because
relative paths were resolved from the external source directory. All commands
above use absolute `T`/`P` paths. These setup failures did not enter match scores.
