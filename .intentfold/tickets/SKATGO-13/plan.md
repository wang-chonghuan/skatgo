# SKATGO-13 plan

## What the code says that the ticket does not

- Two gates from SKATGO-12: `components/skat/ask.tsx` renders a sign-in prompt instead of the chat for
  signed-out visitors (`<Show when="signed-out">`); `lib/ask/handler.ts` returns 401 when Clerk finds
  no session. A third, quieter one: `authenticateRequest` throwing (Clerk unreachable, bad key) would
  fail the whole request.
- The rate limit is keyed by account (`limits.ts`); SKATGO-9 keyed it by address (`x-forwarded-for`).
- Login itself lives in `skat-layout.tsx` (header button / avatar), `__root.tsx` (`ClerkProvider`),
  `start.ts` (middleware) — none of them gate anything.

## Route

1. `ask.tsx`: always render the chat; keep the conversation keyed by account + page (so a different
   person signing in on the same tab still starts empty). Remove the gate's styles and its two messages.
2. `handler.ts`: no 401; read the session only to pick the rate key — `user:<id>` when signed in,
   `ip:<address>` otherwise; a Clerk failure counts as signed out.
3. `limits.ts`: per-visitor instead of per-account (same numbers); test renamed.
4. Comments that said "only the assistant is behind a login" corrected in code. Charter lines that say
   the same are human-owned — reported in the handoff, not edited.
