# Rework

## Request

During closure, the human asked to reconcile the Engineering Charter with the anonymous assistant
behavior delivered by SKATGO-13. The stale contract still said that `/api/ask` and the assistant
required a signed-in account.

## Change

`engineering.md` now states that any visitor may use the assistant, that a Clerk session is optional
and used only as the rate-limit identity when present, and that neither the course nor the assistant
requires an account.

No application code, Search Console configuration, DNS record, production runtime, or Azure resource
changed.

## Rechecked

- Compared the revised contract with `app/src/lib/ask/handler.ts`, which treats Clerk authentication
  failure as signed out and admits anonymous requests by client address.
- The project mechanical defence was rerun on the rebased final branch before merge.

## Net effect

The SKATGO-15 Search Console delivery is unchanged. The repository's human-authorized Charter now
describes the already-shipped SKATGO-13/14 assistant behavior accurately.
