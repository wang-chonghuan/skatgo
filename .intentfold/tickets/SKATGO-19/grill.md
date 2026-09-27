# SKATGO-19 grill

Mode: human (ticket row `Grill: human`). Inputs: the live ticket, `plan.md`, `ac.md`, the four charter
files, and the styled code under `app/src` (inventory in `plan.md`).

## Batch 1

### Q1. Keep every current value exactly, or consolidate into clean scales?

Today the code uses 9 line heights, 19 spacing values and ~35 typography combinations. Tokenizing
them as-is gives zero visual change but turns that scatter into official scales, and future work
will pick from a messy menu. Consolidating gives a small, clean menu at the cost of a few 1–2px
shifts.

**Recommended: consolidate, with only these changes:**
- **Line height** → 5 steps: `1` for glyphs; `1.2` for titles (currently 1.2, 1.25 and 1.3);
  `1.4` for controls; `1.6` for compact text (currently 1.5 and 1.6); `1.75` for reading text
  (currently 1.7 and 1.75).
- **Spacing** → `2 4 6 8 10 12 14 16 18 20 24 28`, plus `40` and `80` for page breathing room.
  - The odd values move to their neighbour: 1→2 (the gap between stars), 3→4 (pill vertical
    padding, the gap under trick cards), 5→6 (language-switch vertical padding).
  - The large button's 26px horizontal padding becomes 24.
- **Font sizes, radii, colours**: unchanged.

AC1 then accepts pixel differences **only** on those elements.

**Why:** the ticket exists so that large-scale development builds from a system. The shifts are
1–2px, on elements the learner doesn't compare. The alternative locks in accidents, such as 1.25
beside 1.2.

**Decision:** accepted as recommended — human, 2026-09-27 (「同意」)

### Q2. What does "everything" cover?

**Recommended: every design value becomes a named token.**
- **Colour, type and spacing**: colour, font family, size, weight and line height, spacing.
- **Shape**: radius, border width, shadow, gradient, filter, opacity, z-index.
- **Motion and breakpoints**: CSS durations and easings, JS motion and confetti parameters,
  breakpoints.
- **Component dimensions and geometry**: card widths, fan slots, the launcher, icon buttons, the
  emoji tile, the reading column, the assistant window, the table centre, trick positions,
  overlaps, hover and press offsets, grid templates, the card aspect ratio.
- **Third-party strings**: the CSS strings handed to deep-chat and Clerk.

A component may still write only neutral literals: `0`, `1` (flex), `'100%'`, and keywords
(`auto`, `none`, `inherit`, `transparent`…). This is a stricter reading than "the scales in
ui.md". Component geometry is included because otherwise the check needs a judgement-based
allowlist, and the rule would erode.

**Why:** the rule becomes mechanical ("no digit outside `theme/`") and needs no allowlist.

**Decision:** accepted as recommended — human, 2026-09-27 (「同意」)

### Q3. Weight 800: load it, or declare 700?

- **Current state**: 13 places request 800. The page loads DM Sans and Fraunces only up to 700,
  so browsers render those places at 700 today.
- **Option A (declare 700)**: weights become `400 / 600 / 700`. Rendering is unchanged, and no
  extra font bytes are loaded.
- **Option B (load 800)**: add 800 to the Google Fonts request. Titles, names and badges get
  visibly heavier than buttons, which is the hierarchy the code intended. It costs one more font
  file per family.

**Recommended: A.** It keeps the look you approved, and the title/button hierarchy already reads
through size.

**Decision:** accepted as recommended — human, 2026-09-27 (「同意」)

### Q4. How is "no literal" enforced? This involves a dependency, so it needs your approval (engineering.md Redline 3)

- **Why a parser is needed**: the check must understand code structure, i.e. what sits inside
  `stylex.create(...)` and inside `motion` props. A regex cannot do that reliably.
- **Why TypeScript can't do it**: this repo's TypeScript is 7.0 (native), which exposes no JS
  parser API.
- **Recommended: declare `@babel/parser` as a devDependency** and use it from
  `app/scripts/check-design-tokens.mjs`.
  - It is already in the lockfile at the version `@stylexjs/babel-plugin` pulls in, so nothing new
    is downloaded.
  - It never ships to the browser or server bundle.
- **Rejected**:
  - The official `@stylexjs/eslint-plugin`: it brings in ESLint, which the repo doesn't have, and
    it has no "tokens only" rule.
  - Using `@babel/parser` without declaring it: it would work until a StyleX upgrade silently
    drops it.
  - Regex over source: fragile both ways.

**Decision:** accepted as recommended — human, 2026-09-27 (「同意」)

### Q5. The `theme-color` meta colour

- **Current state**: `#F5F5F5`, a leftover from Parrottoon. It is the one allowed colour literal
  outside `theme/`, and it matches neither the page nor the header.
- **Recommended**: move it to `app/src/theme/` and set it to the header colour (`feltDeep`'s
  value). The literal check then expects **zero** hits instead of one.
- **Visible effect**: on phones, the browser's address bar turns the same green as the site
  header. Nothing inside the page changes.
- **Alternative**: move it but keep `#F5F5F5`.

**Decision:** accepted as recommended — human, 2026-09-27 (「同意」)

### Q6. Typography as roles, not free-standing size and weight tokens

**Recommended: typography roles.**
- **How it works**: `theme/` exports complete typography roles, each fixing family, size, weight,
  line height and phone size together, e.g. `hero`, `stepTitle`, `prompt`, `body`, `note`,
  `control`, `label`, `micro` and so on (about 20 after Q1).
- **Rule for components**: they choose a role and never set a font property. The checker forbids
  `fontFamily`, `fontSize`, `fontWeight` and `lineHeight` outside `theme/`.
- **Rejected**: exposing size and weight tokens separately. A component could then combine them
  freely, and the ~35 current combinations would regrow.

**Why:** a type scale is only a scale if combinations are fixed.

**Decision:** accepted as recommended — human, 2026-09-27 (「同意」)

### Q7. Charter edits this ticket makes (they are human-owned, so confirming explicitly)

- **engineering.md → Tools → Mechanical defence**: add `node app/scripts/check-design-tokens.mjs`,
  plus its bullet explaining what it catches. Change the literal-grep expectation from `= 1` to
  `= 0` if Q5 is accepted. Record `@babel/parser` if Q4 is accepted.
- **ui.md**:
  - The Contract's design-system sections name tokens instead of numbers.
  - Redline 1's registry list gains the new theme files.
  - Tools gets the new check.
  - The literal-check wording follows Q5.
- **product.md, operations.md**: untouched.

**Recommended: approve both edits as described.**

**Decision:** accepted as recommended — human, 2026-09-27 (「同意」)

## Outcome

All seven accepted as recommended by the human in one answer (「同意。改完就关闭工单」). The same
answer sets the run's effective finish to **auto-merge**: close the ticket once verified (no deploy).
Approvals recorded against Redlines: ui.md Redline 1 (new token registries, per the ticket request),
engineering.md Redline 3 (`@babel/parser` as a devDependency, Q4), and the charter edits in Q7.
AC1 in the ticket now names the Q1 normalizations as the only allowed pixel differences.

## Batch 2 — a Q3 premise failed during development

### Q8. Weight on the two display-serif titles: accept the lighter Chinese, or load 800?

**What I found:** Q3's recommendation ("declare 700; rendering is unchanged") was measured on the
fonts the page loads, where it holds. DM Sans and Fraunces top out at 700, so 800 already rendered as
700 for Latin text and for the sans titles. It does not hold for **Chinese in the display serif**: the
CJK fallback there is the system font Songti SC, which has a heavier face and does honour 800.

**Evidence:** I built a variant that is the candidate with only the weight put back to 800, and
diffed it against the candidate. The only differing pixels in all 18 states are the Chinese glyphs of
the course-map hero title and the teaching-step titles (`tmp/weight-compare.png`, and
`tmp/weight-options.png` for all options in zh and en). Every other diff comes from the Q1
normalizations. The isolation build — candidate with the Q1 values and weight 800 put back — is
pixel-identical to the baseline in all 18 states.

**Options:**
- **A — 700 everywhere (the current branch):** declared = loaded everywhere. The zh hero and step
  titles become visibly lighter; en/de unchanged.
- **C — load Fraunces up to 800 and give `hero` / `stepTitle` a `heavy` (800) weight:** declared =
  loaded. zh unchanged; the Latin letters of those two titles (en/de titles, "Skat" in the zh hero)
  become slightly heavier. The Google Fonts request asks for Fraunces up to 800.
- **B — keep 800 without loading it:** no visual change, but that is the original bug, kept on
  purpose. Rejected.

**Recommended: C.** zh is the launch language and the hero title is the site's face. C's change in
en/de is the smaller of the two visible changes, and 800 is what the display titles were designed at.

**Decision:** A, as on the branch — human, 2026-09-27. Shown A and C, the human answered 「关闭工单吧」
without choosing C, so the branch as verified (700 everywhere) lands. The lighter Chinese serif titles
are accepted with it. C remains available as a follow-up.
