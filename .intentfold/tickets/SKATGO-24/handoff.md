# SKATGO-24 handoff — 部署命令只部署网站服务

## What changed

No code. `.intentfold/charter/operations.md` § Deploy only:
- **New command**: finds the service named exactly `skatgo` (the same lookup the post-deploy check
  uses) and deploys the merged `main` commit with `render deploys create "$SERVICE_ID" --commit …
  --wait --confirm`.
- **Replaces**: `release.py --only skatgo`.
- **Why**: `--only` matches any service whose name *contains* the text, so the old command also
  released `skatgo-multiplayer`. Found while deploying SKATGO-23, when its dry run listed both
  services.
- **Note in the file**: a short paragraph now says why it is not `release.py`.

## AC results

1. **Only `skatgo` is selected — pass.** I ran the Deploy block from the edited file with its
   `render deploys create` line removed (read-only: fetch, head check, key, service lookup). It
   printed exactly one ID, `srv-dasmrm3ncjis73ardq2g`, which is `skatgo`; `skatgo-multiplayer` is
   `srv-daso93h7lnhs73a2pg2g`.
2. **Nothing else in operations.md changed — pass.** `git diff -U0` shows hunks only at lines
   163–178, inside § Deploy. The post-deploy check, the multiplayer deploy and the Redlines are
   untouched.

The same command already did the SKATGO-23 production release (deploy `dep-dasqhgo473hc739h76o0`
of `1c04f21`), and the post-deploy check passed.

## Deviations

None.

## Environment

- **Ports**: no service was started.
- **Env keys**: none changed.
- **Deploys**: nothing was deployed by this ticket.

## Residual

`release.py --only` is a substring filter by design. Other projects with services that share a name
prefix could hit the same thing; that belongs to the ips-render-ops skill, not to skatgo.
