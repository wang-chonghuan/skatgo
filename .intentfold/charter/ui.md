# UI Requirements

Binding on every UI change. **UI work follows this file strictly** — the agent does not invent
alternatives to what is written here. Section shape is fixed by `.intentfold/readme.md`.

> Seeded 2026-09-21 by intentfold cap1 from the repository. Items marked *(inferred — confirm)* are
> the machine's reading, not a stated decision.

## Contract

**Styling stack — Astryx + StyleX**

Every style is a StyleX rule in the file that owns the element, compiled at build time through
Astryx's build integration. Astryx supplies the reset, the theme's prose defaults and the CSS layer
order underneath. There is no utility-CSS framework and no hand-written component CSS.

**Where components live**

`app/src/components/skat/`. The course has **its own small kit** in `ui.tsx` (`Btn`, `Panel`, `Pill`,
`ProgressBar`, `Stars`, `Rich`) and renders on native elements styled with StyleX; it uses no Astryx
components. That was deliberate when the course was built: an Astryx control follows the app theme's
light/dark mode, while the course's palette is fixed, and a dark-mode control on cream paper is
unreadable. A new widget reuses the kit first.

**Tokens**

Every colour is a named token; no product file names a colour.

- **`app/src/theme/skat.stylex.ts`** — the course's palette (`stylex.defineVars`). One fixed palette,
  deliberately not a light/dark pair: a card table is green at any hour and the cards must stay
  paper-white. Its names are roles — felt, paper, ink, brass, good/bad and their soft and deep
  variants. Read the file for the values.
- **`app/src/theme/parrottoonTheme.ts`** — the Astryx theme the reset and body tokens come from,
  compiled to `parrottoon.{css,js,d.ts}`. The course reaches it only through the page canvas and the
  prose defaults. (The name is historical: it came from Parrottoon.)

Spacing, radii and sizes in the course are structural literals in the `stylex.create()` block that
uses them; there is no spacing scale in the course palette.

**Layout and responsive**

- The frame (`app/src/skat-layout.tsx`): a felt-green header, then a reading column at most 860px
  wide, centred.
- **The phone step is `max-width: 480px`**, used throughout; the course map's hero stacks at 720px and
  the contract picker wraps at 600px. On a phone a hand of more than six cards is held as two rows,
  because ten cards in one row at 375px leave each card too narrow to tap.
- **Every UI change is checked at desktop 1280×820 and phone 375×812.**

**Design source of truth**

The running implementation. It began as a byte copy of parrottoon.com/skat (2026-09-21) and was
verified pixel-identical to it; since then the header has lost the "← 回 Parrottoon" link at the
human's instruction, and the two are no longer kept in step. *(Whether skatgo should keep looking
like Parrottoon's course from here on is a question for the human — confirm.)*

## Tools

The literal check — part of `engineering.md`'s mechanical defence:

```bash
grep -rnE "className=|style=\{\{|#[0-9a-fA-F]{6}" app/src --exclude-dir=theme
```

It must return **exactly one** line: the `theme-color` meta in `app/src/routes/__root.tsx`, which
cannot read a CSS variable. `app/src/theme/` is excluded because colour literals are what a registry
is made of.

Rebuilding the Astryx theme after an approved change to `parrottoonTheme.ts`:

```bash
(cd app && npx @astryxdesign/cli theme build src/theme/parrottoonTheme.ts --out src/theme/parrottoon.css --icons-specifier ./icons)
```

## Guidance

**Choosing components.** Reach for a custom component only when the kit genuinely has nothing that
fits — not because the existing one needs configuring, and not because writing one looks faster.

**Choosing a token.** Use the role, not the colour that looks right: `ink` / `inkSoft` / `inkFaint`
for text on paper by importance, `white` for text on felt, `brass` for the one call to action and for
highlights, `good` / `bad` (with their `Soft` backgrounds) only for judging an answer. State the text
colour on every heading and paragraph: the Astryx theme colours `h*` and `p` itself, and in dark mode
that colour is light — unreadable on paper. A missing token is a stop, not a reason to compose one.

**Interaction states.** A wrong answer explains itself, shakes, and never advances; "continue" stays
disabled until the step is solved. An illegal card is refused with the follow-suit reason and stays in
the hand. Anything still loading shows the course's own "正在发牌……". A card that cannot be played
now is dimmed but still tappable, so the table can say why.

**Content and tone.** Chinese, direct and a little playful, written for twelve-year-olds and adults
alike (「不枯燥的」). The German words a Skat table actually uses — Grand, Null, Hand, Schneider,
Schwarz, Ouvert, Matador — stay German, because those are what the learner will hear at a real table.

## Redlines

1. **Changing a governed token registry** — adding, renaming, removing or retuning a value — not
   without the human's explicit approval. Registries: `app/src/theme/skat.stylex.ts`,
   `app/src/theme/parrottoonTheme.ts` (and its generated `parrottoon.{css,js,d.ts}`). A missing token
   is a stop; reaching for a raw value instead of asking is the evasion this entry exists to name.
2. **Tailwind, or any utility-CSS framework** — forbidden outright. Detectable from
   `app/package.json` and from any class attribute.
3. **`className=`, `style={{…}}`, a second stylesheet, or a colour literal in `app/src` outside
   `app/src/theme/`** — forbidden outright. Detectable by the grep in `Tools`. `app/src/styles/app.css`
   is the only stylesheet.
