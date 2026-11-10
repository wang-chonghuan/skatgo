# Implementation

The card wrapper currently usually selects the second-best card, while every
pickup/discard/contract decision is canonical. Saved jobs freeze traits but not
their executable policy. `recordOf` already uses the correct player's-side
outcome; the incident is score replication, not a six-win record.

1. Extend the local skill with executable calibration, grouped uncertainty and
   rollout contracts before implementing runtime/config changes.
2. Add a persona-owned adapter for role-specific card errors, bidding estimate
   noise, pickup/Hand, contract and discard selection using existing public
   evaluation/rules APIs. Preserve the exact old adapter for old snapshots.
3. Freeze policy version in new activity snapshots, use a declared Berlin-day
   activation boundary, retain legacy traits/identity/activity random streams.
4. Add resumable offline calibration and read-only diagnosis with full legal
   logs, paired old/new comparison and stage/rank/severity audits.
5. Tune only on the training partition, freeze the config, then run untouched
   holdout and isolated persistence/board acceptance. No production writes.

The fixed statistical protocol is recorded in the skill's calibration reference.
The 17-role family uses a simultaneous bound rather than independently selecting
the apparently strongest favorable result. Selected daily-one games are reported
separately, not mixed into ordinary-card acceptance or used to dilute it.

Redline lookup: no dependencies, UI/Terms/Charter changes, shared rules/model
changes, human-name edits, remote writes or deploys are required.
