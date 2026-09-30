# SKATGO-30 rework

Reconstructed at close; `handoff.md` is unchanged.

- **Rebased onto `main` after SKATGO-29 landed** (the human: 「这两个工单都合并，然后部署」). There was no
  conflict: SKATGO-29 touched none of the icon files.
- **SKATGO-29's 32 share images** (`app/public/og/`) draw `logo-96.png`. Its handoff's residual said
  the ticket landing second regenerates them, so they were regenerated with
  `.intentfold/tickets/SKATGO-29/og.mjs` against this branch's build. Checked by eye: the new mark
  sits beside "SkatGo" in `home-en.png`.
- **Criteria rechecked:** none of AC1–AC3 is affected by the rebase or the share images. The
  mechanical defence runs once more at close.
