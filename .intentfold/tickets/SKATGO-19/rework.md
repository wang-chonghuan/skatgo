# SKATGO-19 rework

No change was asked for after the handoff.

**At close (cap4):** the branch was rebased onto `origin/main`, which had gained SKATGO-20 (the
multiplayer backend).
- **Overlap**: SKATGO-20 also edited `.intentfold/charter/engineering.md` (stack, structure, the
  multiplayer guide and defence), in regions separate from this ticket's (the mechanical-defence
  command and its bullets).
- **Result**: Git merged it without conflict, and both sets of changes are kept.
- **Not touched**: nothing under `app/`, which is what this ticket's acceptance criteria depend on.

**Verification on the rebased branch**: the mechanical defence in its rebased form passes —
typecheck, build, 67/67 tests, client-bundle check, token check (52 files), literal grep = 0, SSR
link. The screenshot criteria were not rerun, because no file they depend on changed.
