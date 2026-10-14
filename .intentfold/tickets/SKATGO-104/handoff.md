# SKATGO-104 handoff

## What changed
- **Header language switch** (`app/src/components/skat/frame.tsx`): the flag button and its dropdown
  card are gone. `LanguageSwitch` is now a radiogroup of two bare flags, English then German; one tap
  switches through Paraglide's `setLocale` (carrying a free-play game as before). The language in use
  is full colour with a 2px `color.go` ring 1px off the flag; the other keeps its colours at
  `opacity.flagOff` (0.4), `flagHover` (0.8) under the pointer or keyboard focus. No frame, no padding;
  each button is 32px tall (the header's control height) and as wide as its flag, 8px apart.
- **English flag** (`app/src/theme/flags.tsx`): `FlagEN` replaces `FlagUS` — the United States top
  left, the United Kingdom bottom right, split on the diagonal with a thin white line; clip ids from
  `useId`. Both flags now 24×16. The settings dialog's language choice uses it too.
- **Phone header fit**: two flags are 16px wider than the old button. To keep everything in one row on
  a 360px phone: header gap 8→6, the end group's gap 8→4, the menu button 44→32 (the gear's size).
  Below 360px (`bp.narrowPhone`) the mark steps to 36px, "SkatGo.com" to 20px and its gap to 6.
- **Tokens** (ui.md Redline 1, approved by the request — see draft.md): `opacity.flagOff`,
  `opacity.flagHover`, `border.flagOffset`, `radii.flag`, `dims.landingMarkNarrow`,
  `bp.narrowPhone`; removed `dims.langMenu`, `dims.langMenuTop`.
- **Charter** `ui.md`: the header line, the flags row, the icon list (the switch uses no icon).

## AC results
1. **Both flags visible, header fits** — PASS. Playwright on `/en` and `/` at 1280×820, 375×812 and
   320×640: two radios visible; `scrollWidth` equals the viewport; the menu button ends 12px inside the
   right edge (363 at 375, 308 at 320); header height unchanged (80 / 64). The live site at 320 already
   overflowed by 29px before this ticket; it no longer does.
2. **English flag is the diagonal US/UK flag** — PASS. 6× screenshot of the pair read: stars and
   stripes top left, Union Jack bottom right, white diagonal between.
3. **Highlight and switching** — PASS. On a phone, `/en/course`: English `aria-checked=true`, opacity 1,
   outline solid rgb(0,163,54); German opacity 0.4. Tap German → `/de/kurs`, German checked and
   ringed, English 0.4.

Mechanical defence: PASS (typecheck, build, 124 unit tests, client bundle, design tokens, literal
grep, server bundle links, SEO 46 pages, test:seo 25/25). Multiplayer untouched, its check not run.

## Deviations
- From plan: the buttons are as wide as the flag (24px), not 32×32 — at 32 wide each the phone header
  overflowed. Tap target 24×32. Added the phone-header tightening and the narrow-phone step, which the
  plan did not foresee.

## Environment
- Ports: web 55104 (multiplayer and database not started). No env keys changed.

## Residual
- None.
