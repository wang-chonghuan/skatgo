# SKATGO-84 handoff

Chore: charter text only (`charter/operations.md`). No code, dependency, environment or production change.

## What changed

- Redline 5 is removed. It required the human's approval before changing production schema, infrastructure,
  ingress, scaling, required env keys, or the Dockerfile's base image, port or start command. Redlines 6–8
  are renumbered 5–7. Nothing else referenced them by number.
- The line "the production database takes no outside connections, so run it inside the multiplayer service as
  a Render one-off job" is replaced. Production queries now go through ips-render-ops cap5: open the database's
  IP allow list for the session, run the work, then close it again with an empty list.
- Kept, per the ticket: cloud resources, first production service, domain pointing, re-dealing days (deletes
  players' entries), no production mutation from acceptance, no unrun check recorded as passed, post-deploy
  check, and no Cloudflare proxy on the apex.

## Proof (observable done-state)

- `grep -n "Changing production schema" .intentfold/charter/operations.md` → no match.
- `grep -n "ips-render-ops cap5" .intentfold/charter/operations.md` → the new query line.
- The Redlines section lists seven entries: 1 unrun check, 2 acceptance mutation, 3 cloud resources,
  4 first production service, 5 domain, 6 post-deploy check, 7 Cloudflare proxy.

## Environment

None.
