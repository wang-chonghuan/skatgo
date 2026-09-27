# SKATGO-19 plan

## What the code says that the ticket does not

- Only colour is a token today (`theme/skat.stylex.ts`, `defineVars`). Everything else is a literal in
  11 styled files under `app/src` (`components/skat/*.tsx`, `skat-layout.tsx`), plus CSS strings handed
  to deep-chat (`ask-thread.tsx`) and Clerk (`lib/clerk-appearance.ts`), plus JS numbers passed to
  `motion` and `canvas-confetti`.
- Distinct typography combinations in use: ~35 (size × weight × line height × family). Line heights
  alone take 9 values (1, 1.2, 1.25, 1.3, 1.4, 1.5, 1.6, 1.7, 1.75). Spacing takes 19 values incl.
  1/3/5/26/40/80. A token set that preserves every pixel codifies that scatter; a clean scale moves some
  elements by 1–2px. → grill Q1.
- Media-query keys cannot hold a CSS variable. StyleX 0.19 has `stylex.defineConsts`, which inlines at
  compile time and can be used as a computed key. `defineVars` values reach runtime as `var(--…)`
  strings, which is what deep-chat and Clerk already receive for colours.
- Weight 800 is requested in 13 places; the Google Fonts URL loads DM Sans 400–700 and Fraunces
  400–700, so the browser renders 700 (a real 700 face exists, so no synthesis). → grill Q3.
- `theme-color` meta is `#F5F5F5`, a Parrottoon leftover that matches neither the page (`paper`) nor
  the header (`feltDeep`). → grill Q5.
- TypeScript here is 7.0 (native), which has no JS compiler API. `@babel/parser` is in the lockfile as a
  dependency of the declared `@stylexjs/babel-plugin`, but is not declared itself. → grill Q4.

## Route

1. **Registries in `app/src/theme/`** (each a new file; `skat.stylex.ts` colours untouched):
   - `breakpoints.stylex.ts` — `defineConsts`: `phone` (480), `hero` (720), `contracts` (600).
   - `scale.stylex.ts` — `defineVars`: `space`, `radius`, `border`, `size` (component dimensions:
     card widths, fan slots, launcher, icon buttons, emoji tile, reading column, window, table centre,
     trick positions, overlaps), `opacity`, `layer` (z-index).
   - `effects.stylex.ts` — `defineVars`: shadows (ledge per tone, lift, card, float, glow, verdict
     rings, felt inset), felt gradients, the card-back hatching, the dimmed filter; `duration` and
     `easing` for CSS transitions.
   - `type.stylex.ts` — `defineVars` for families, sizes, weights, leadings; plus `type.ts` exporting
     `stylex.create` **typography roles** (complete: family+size+weight+leading, phone size included).
     Components pick a role and never set a font property.
   - `motion.ts` — plain constants for `motion` / `canvas-confetti` parameters.
   - `meta.ts` — the `theme-color` value (so no product file names a colour).
2. **Migrate the 11 styled files + deep-chat + Clerk** to those names, one file per commit-sized step,
   building as I go.
3. **Enforcement** — `app/scripts/check-design-tokens.mjs`: parses every `app/src` file outside
   `theme/`, and fails on, inside `stylex.create(...)`: a numeric literal other than 0/1, a string with
   a digit other than `100%`, a template literal, a `font*`/`lineHeight` property, a hard-coded
   `@media` key; and in `motion` props / `confetti(...)` args: a numeric literal other than 0/1. Exits
   non-zero if it scanned zero files. Added to engineering.md's mechanical defence and ui.md Tools.
4. **Fonts** per Q3; **app.css** comment rewritten to point at what exists (ui.md Tools) and to stop
   claiming values are Astryx tokens.
5. **ui.md** Contract rewritten to name tokens instead of numbers; Redline 1's registry list extended
   to the new files; the literal-check rule updated if Q5 moves the meta colour.

Verification: before/after screenshots of the same states at both viewports, pixel-compared.
