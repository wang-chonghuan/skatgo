# SKATGO-19 handoff — 设计值全面 token 化并修正字重与失效引用

## What changed

**Registries** (new, `app/src/theme/`):
- `breakpoints.stylex.ts` — `bp` (`defineConsts`: phone, contracts, hero).
- `scale.stylex.ts` — `space`, `radius`, `border`, `size`, `opacity`, `layer`.
- `effects.stylex.ts` — `shadow`, `texture`, `move`, `timing`.
- `type.stylex.ts` — `family`, `fontSize`, `weight`, `leading` (primitives).
- `type.ts` — `typography`, about 45 complete roles.
- `constants.ts` — `phoneQuery`, `themeColor`, `icon`, and the motion and confetti parameters.

**Product code**: all 13 styled files now name tokens: 11 under `components/skat/` plus
`skat-layout.tsx`, `lib/clerk-appearance.ts` and `routes/__root.tsx`.
- deep-chat and Clerk receive tokens as CSS variables.
- No component sets a font property any more.

**Grill Q1 normalizations**:
- Line heights: 1.25/1.3→1.2, 1.5→1.6, 1.7→1.75.
- Spacing: 1→2, 3→4, 5→6.
- Large-button horizontal padding: 26→24.

**Weights** — `weight` has only 400/600/700, the weights the page loads (grill Q3, Q8).

**`theme-color`** — now the header felt `#134A35`, from `constants.ts` (grill Q5).

**Enforcement**:
- `app/scripts/check-design-tokens.mjs` parses `app/src` outside `theme/` with `@babel/parser`.
  The parser is a new devDependency (grill Q4), pinned to the 7.29.8 already in the lockfile, so the
  lockfile gains only its declaration line.
- It fails on:
  - numbers, digit strings, template literals, font properties and typed `@media` keys inside
    `stylex.create`;
  - numbers in `motion` props, `confetti(...)`/`animate(...)` calls and numeric JSX attributes;
  - CSS lengths, durations or colours in any string;
  - an empty source tree.

**`app.css`** — the comment no longer points at the missing "ui.md § Switching the theme" and no
longer claims every value is an Astryx token.

**Charter** (grill Q7):
- `ui.md`: the Contract is rewritten around the registries and token names. Tools gets the token
  check, and the literal grep now expects 0 hits. Redlines 1 and 3 cover every registry and the
  token check.
- `engineering.md`: the mechanical defence adds `check-design-tokens.mjs` and expects `= 0` from the
  grep; the bullets are updated.

## AC results

Built servers, headed Chromium, seeded `Math.random`. There are 18 states: map fresh and with
progress, the assistant open, teach/choice-wrong/pick/order/play steps and the table at the
learner's first bid, each at 1280×820 and 375×812. Scripts are in `tmp/`: `shots.mjs`,
`compare.mjs`, `ac2.py`, `ac3.sh`, `ac4.py`.

1. **Looks the same except the accepted changes — pass.**
   - **Harness is deterministic**: baseline vs baseline, 0 of 18 differ, with a 16/255 colour
     tolerance for GPU gradient dithering.
   - **Tokenization is faithful**: an isolation build — the candidate with the Q1 values and weight
     800 temporarily put back — vs the baseline gives **0 of 18 differ**.
   - **Weight-only diff**: candidate vs the candidate with weight 800 differs only in the Chinese
     glyphs of the display-serif titles, in 7 states (`tmp/weight-options.png`).
   - Every remaining candidate-vs-baseline difference therefore comes from the Q1 list, or from the
     weight change that grill Q8 accepted.
2. **Requested weights are loaded — pass.** Candidate: DM Sans 400/600/700 and Fraunces 700, all
   within loaded faces. Baseline failed: DM Sans 800 and Fraunces 800 were requested but not loaded.
   The card faces' embedded SVG credit text ("www.me.uk", font Bariol) is third-party artwork and is
   excluded.
3. **A literal breaks the check — pass.** Each of these, written into `free-play.tsx`, exits 1 naming
   file:line: `gap: 7`, `transitionDuration: '90ms'`, `color: '#123456'`, `fontSize: 15`,
   `transition={{ duration: 0.3 }}` and a typed `@media` key. Reverted, it exits 0. On an empty
   source tree it exits 1.
4. **ui.md names only existing tokens — pass.** 199 references resolved and 0 unresolved, including
   `app.css`'s paths and its `§ Tools` reference. A planted bad name (`shadow.liftt`) is caught.

Mechanical defence (updated engineering.md command) passes: typecheck, build, 67/67 tests,
client-bundle, token check (52 files), literal grep = 0, SSR link.

Gameplay beyond the first bid is left to the human's own testing.

## Deviations

- **Q3 premise partly failed (grill Q8).** Declaring 700 does not keep Chinese display-serif titles
  unchanged: Songti SC has a heavier face. Option A (as built) and option C (load Fraunces 800, keep
  800 on `hero`/`stepTitle`) were shown. The human closed the ticket on A.
- **Typography roles**: about 45 roles, not the "about 20" Q6 estimated. Keeping font sizes (Q1) and
  pixel parity leaves that many distinct combinations.
- **Some roles carry no line height**: roles for elements that inherited their leading from the
  theme's `p`/`h*` defaults keep inheriting it. Setting one would have moved text that Q1 did not
  list.
- **`family.heading`** writes out the Astryx heading stack instead of `var(--font-family-heading)`.
  That variable is not defined where StyleX's variables are, and the first build fell back to the
  system font.
- **Checker scope**: no Proposed-solution departure. Structural literals `0`, `1` and `'100%'`, and
  plain keywords, stay allowed. Behaviour timings (bot delay, trick pause, copy confirmation) are not
  design values and stay in their components.

## Environment

Ports used, all stopped at close:
- 55019: candidate.
- 55919: baseline.
- 55916–55918: variant builds.

No env keys were added, changed or removed.

## Residual

- **Option C** (grill Q8) if the heavier Chinese display titles are wanted back.
- **`breakpoints.stylex.ts` and `phoneQuery`** state the phone width twice (a `defineConsts` value
  cannot be read as a plain string). Both are in `theme/`, with a comment; change them together.
- **`themeColor`** repeats `skat.feltDeep`'s hex, for the same reason.
