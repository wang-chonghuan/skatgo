# SKATGO-104 rework (since the frozen handoff, 35b24c1)

1. **「同意你的决定」** — the human accepted dropping ".com" on the narrowest phones instead of shrinking
   the brand (`4a656d9`). Below 360px (`bp.narrowPhone`) the header shows "SkatGo" at full size; the
   narrow-phone font step, `dims.landingMarkNarrow` and the brand-gap step were removed. Rechecked
   AC 1 (header fits at 1280 / 375 / 360 / 320, brand at 375 still 197px wide, as live) and AC 3.
2. **「我觉得你国旗小了点」** — flags enlarged (`1ed48b3`): 30×20 on desktop, 28×19 on a phone, sized by
   `dims.flagWidth*` / `flagHeight*` on the caller's box (the SVGs now fill it); the settings dialog's
   flag sits in the same box. Phone: flags 6px apart, the header's end group gap 4→2. Rechecked
   AC 1–3: all fit, 360px keeps 9px between "SkatGo.com" and the controls.

Net against the handoff: the narrow-phone step hides ".com" rather than shrinking; flags are larger
and token-sized. Mechanical defence rerun once on the final branch: pass (124 tests, SEO 46 pages,
test:seo 25/25).
