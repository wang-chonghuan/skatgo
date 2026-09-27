# UI Requirements

Binding on every UI change. **UI work follows this file strictly** — the agent does not invent
alternatives to what is written here. Section shape is fixed by `.intentfold/readme.md`.

> Seeded 2026-09-21 by intentfold cap1 from the repository, and accepted by the human as written.
> The design system below (surfaces, type, shape, spacing, elevation, components, motion) was
> extracted from the running code on 2026-09-27 (SKATGO-18), at the human's request, as the binding
> reference for large-scale development: 「当前的风格就可以」 — it records the current style, it does
> not redesign it.

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

Two third-party components draw their own markup and styles, both approved by the human: **deep-chat**
(the assistant's chat body, SKATGO-9) and **Clerk**'s sign-in window and account menu (SKATGO-12).
What the course controls is the palette handed to them — course tokens only, in
`components/skat/ask-thread.tsx` and `lib/clerk-appearance.ts` — and the shell around them, which is
the kit. Clerk's windows stay in English; the human chose not to add its translation package.
Icons come from **lucide-react** and appear only in the assistant (the launcher, the window header and
the send button); the course itself uses emoji and the suit symbols instead of icons.

**The look: a card room**

Green baize, cream paper, brass. Every screen is built from four surfaces, and each surface decides
its text colour:

| Surface | What it is | Built from | Text on it |
|---|---|---|---|
| **Page** | the reading column | `paper` | `ink` |
| **Felt** | where cards lie — the whole-game table, a drill's hand, the course map's hero | `felt` with a radial gradient `feltLight` → `felt` → `feltDeep`, and on the table and drills an inset 3px `feltDeep` ring | `white` |
| **Deep felt** | the header bar, the assistant window's header, a seat at the table | `feltDeep` | `white` |
| **Paper on felt** | a light box set on felt — the table's action area, the map's progress box, a bid bubble | `paper` | `ink` |

Interactive tiles on the page — a lesson card, an answer option, a contract button, a toggle — are
`white` with a `paperEdge` border, so they stand off the cream page.

**Colour roles**

Every colour is a named token; no product file names a colour.

- **`app/src/theme/skat.stylex.ts`** — the course's palette (`stylex.defineVars`). One fixed palette,
  deliberately not a light/dark pair: a card table is green at any hour and the cards must stay
  paper-white. Read the file for the values; this table says what each name is for.
- **`app/src/theme/parrottoonTheme.ts`** — the Astryx theme the reset and body tokens come from,
  compiled to `parrottoon.{css,js,d.ts}`. The course reaches it only through the page canvas and the
  prose defaults. (The name is historical: it came from Parrottoon.)

| Token | Role |
|---|---|
| `felt` | the table surface; hover of a felt control |
| `feltDeep` | header bars, seats, the table's inset ring, the ledge under a felt button |
| `feltLight` | the lit centre of a felt gradient; a felt button's face |
| `feltLine` | reserved for rules drawn on felt (defined, not yet used) |
| `paper` | the page and every paper box |
| `paperDeep` | quiet surfaces on paper: a quiet button, an ink pill, the assistant's answer bubble, hover behind a round icon |
| `paperEdge` | borders and rules on paper; a progress track; the ledge under quiet buttons and options; an unearned star |
| `ink` | primary text on paper |
| `inkSoft` | secondary text: leads, notes, captions, counts |
| `inkFaint` | tertiary text: minutes, placeholders |
| `brass` | the one call to action; highlights, focus rings, the current state, earned stars, the progress fill |
| `brassDeep` | the ledge under a brass button; a chosen tile's border; card-row captions |
| `brassSoft` | tip panels, a chosen tile's fill, the lesson emoji tile, the learner's own chat bubble |
| `red` | the red suits (♥ ♦) in text, and the card back |
| `good` / `goodSoft` | a right answer: border / fill — and nothing else |
| `bad` / `badSoft` | a wrong answer or a refusal: border / fill — and nothing else |
| `white` | text on felt; the face of cards and interactive tiles |
| `shadow` | a card's own shadow; a floating window's shadow |
| `shadowSoft` | hover lift; the launcher's drop shadow; the hatching on a card back |
| `glow` | the halo around a glowing (hinted or winning) card |
| `scrim` | reserved for dimming the page behind an overlay (defined, not yet used) |

**Typography**

Two families, both loaded from Google Fonts in `app/src/routes/__root.tsx`:

- **Body — DM Sans**, set once on the frame with CJK fallbacks (`"DM Sans", "PingFang SC", "Hiragino
  Sans GB", "Microsoft YaHei", "Noto Sans SC", sans-serif`). Every control sets `fontFamily: 'inherit'`.
- **Display — Fraunces**, with `"Songti SC", "Noto Serif SC", serif`, only for the two big titles:
  the course map's `h1` and a teaching step's title.

The type scale in use — size in px (phone size after the slash), weight, line height:

| Role | Size | Weight | Line height | Where |
|---|---|---|---|---|
| Hero title (Fraunces) | 36 / 28 | 800 | 1.2 | the course map's `h1` |
| Step title (Fraunces) | 26 / 22 | 800 | 1.25 | a teaching step |
| Finish title | 28 | 800 | — | the lesson-finished screen |
| Page title | 24 | 800 | — | the game step, free play |
| Result title | 20 | 800 | — | the game's settlement |
| Prompt | 19 / 17 | 600 | 1.6 | the question of an exercise |
| Card title | 17 | 800 | — | a lesson card; the brand |
| Body | 16 | 400 | 1.7–1.75 | teaching paragraphs, leads, finish notes |
| Option | 16 | 600 | 1.4 | an answer option |
| Name | 15 | 800 | 1.3 | a seat's name at the table; the assistant's name |
| Say | 15 | 400 | 1.5–1.7 | the table's running line; game-step paragraphs |
| Note | 14 | 400 | 1.5–1.6 | notes in panels, lesson promises, context lines |
| Small | 13 | 400–700 | — | counts, captions, minutes, the language switch, small buttons |
| Micro | 12 | 400–700 | — | pills and felt labels under cards (700); seat meta, a page subtitle (400) |

Weights are 400, 600, 700 and 800 only: 800 for titles and names, 700 for controls, labels and
`**bold**`, 600 for prompts, options and small meta, 400 (inherited) for running text. Emoji and
glyphs are sized as pictures, not text: 20–28 in a tile or seat, 88 on the finish screen.

**Shape**

Corner radius, by what the thing is:

| Radius | Used for |
|---|---|
| `999` (fully round) | buttons, pills, the progress bar, toggles, round icon buttons, the launcher, number badges |
| `24` | the big felt surfaces: the course map's hero, the game table |
| `18`–`20` | panels, lesson cards, the progress box, the table's action area; `20` for a drill's felt |
| `14`–`16` | answer options, contract buttons, seats, the lesson emoji tile, chat bubbles and input; `16` for the assistant window |
| `12` | a bid bubble; Clerk's windows |
| `8` / `6` / `4` | playing cards (`md`/`lg` / `sm` / `xs`) and the brand mark (`8`) |
| `0` | the assistant window as a full-screen phone sheet |

Border widths: **1** for a panel, the assistant window and a toggle; **2** for interactive tiles
(lesson card, option, contract button, seat); **3** for the white frame of a card back and a felt's
inset ring.

**Spacing**

Structural literals in the `stylex.create()` block that uses them — there is no spacing scale in the
palette — drawn from the steps **2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 24, 28**. The odd values 1, 3
and 5 appear only as optical nudges inside small pieces (stars, pills, labels under cards, the
language switch); 40 and 80 are the vertical breathing room of the finish and loading screens.

| Where | Desktop | Phone |
|---|---|---|
| Reading column padding (block / inline) | 28 / 24 | 16 / 12 |
| Header padding (block / inline) | 12 / 24 | 12 / 14 |
| Hero padding | 28 | 18 |
| Panel padding | 20 | 16 |
| Felt padding (drill / table) | 16 | 8 / 10 |
| Gap between page sections | 18–24 | same |
| Gap inside a stack of content | 12–16 | same |
| Gap in a row of controls or a list | 10 | same |
| Gap among pills, chips, small cards | 6–8 | same |

**Elevation**

Depth comes in four fixed forms, all coloured by tokens:

- **Ledge** — a solid shadow straight down, `0 3px 0 <deeper shade>` (`0 2px 0` on an answer option):
  what makes a button or a current lesson card look pressable. Pressing moves it `translateY(2px)`.
- **Lift** — on hover, a tile rises `translateY(-2px)` with `0 6px 14px shadowSoft`; a clickable card
  rises `-6px`, a selected one sits at `-16px`.
- **Card** — every playing card carries `0 2px 6px shadow`.
- **Float** — the assistant window, `0 14px 40px shadow`; the game table adds `0 10px 30px shadow`
  under its inset ring.

**Components — the kit (`ui.tsx`)**

| Component | Variants | Use it for |
|---|---|---|
| `Btn` | tone `primary` (brass, the one main action), `quiet` (paperDeep: back, pass, secondary), `felt` (feltLight: hints, checks, actions that belong to the table, sign-in on the header), `danger` (badSoft; available, not yet used); size `sm` / `md` / `lg`; `grow`; `disabled` | every action |
| `linkLook(tone, size)` | the same tones and sizes as `Btn`, for a router `<Link>` | navigation that looks like a button: an action is a `Btn`, navigation is a link |
| `Panel` | tone `paper`, `tip` (brassSoft, with 💡), `good`, `bad`; `pad` | tips, feedback on an answer, a refusal, a settlement |
| `Pill` | tone `felt` (on felt: facts and state), `brass` (the contract, whose turn it is, who took the trick), `ink`, `good` | short facts, never actions |
| `ProgressBar` | `value`, `label` | progress through a lesson |
| `Stars` | `n` of 3 | a lesson's result |
| `Rich` | — | every piece of course text: renders `**bold**` and colours ♥ ♦ red |

Button sizes: `sm` 13px (padding 6 / 12), `md` 15px (10 / 18), `lg` 17px (14 / 26). A disabled button
is at 45% opacity with no ledge. Focus is a 3px `brass` outline offset 2px.

**Components — the course's widgets**

| Widget | File | What it is |
|---|---|---|
| `PlayingCard` | `playing-card.tsx` | one card, 5:7, public-domain faces (`@letele/playing-cards`); sizes `xs` 34, `sm` 52, `md` 72 (phone 58), `lg` 96 (phone 72) px wide; states `selected`, `dimmed`, `glow`, `verdict` good/bad, `faceDown` (red hatched back in a white frame) |
| `Fan` | `card-row.tsx` | a hand held as a fan: slots shrink and overlap to fit; more than six cards split into two rows on a phone; order badges; `data-answer` / `data-order` for scripted checks |
| `CardRowView` | `card-row.tsx` | a labelled, wrapping row of cards for reading, with optional captions or ✓ / ✗ |
| `Shake` / `Feedback` | `exercises.tsx` | the wordless "no" after a wrong answer, and the good/bad panel that explains it |
| `GameTable` | `game-table.tsx` | the whole-game felt: two seats, the trick in the centre, a strip of pills, the learner's hand, and a paper action area |

Recurring patterns built on native elements — reuse them rather than inventing a neighbour:

- **Tile choice** — a white tile, 2px `paperEdge` border that turns `brass` on hover; chosen:
  `brassDeep` border on `brassSoft`; right: `good` on `goodSoft`; wrong: `bad` on `badSoft` at 60%.
  Answer options, contract buttons and toggles are all this.
- **Lesson card** — a white tile with the emoji in a 52px `brassSoft` square; states `done`
  (`good` on `goodSoft`), `next` (brass border and ledge), `open` (brass border on hover).
- **Round icon button** — 34–36px, transparent, a `paperDeep` (on paper) or `felt` (on felt)
  background on hover: close, new conversation, copy.
- **Floating launcher** — a 56px round `feltLight` button fixed bottom-right with a felt ledge.

**Layout and responsive**

- The frame (`app/src/skat-layout.tsx`): a `feltDeep` header — the brand (♣ on a 30px brass mark) on
  the left, the language switch and account on the right — then a reading column at most 860px wide,
  centred.
- **The phone step is `max-width: 480px`**, used throughout; the course map's hero stacks at 720px and
  the contract picker wraps at 600px. On a phone a hand of more than six cards is held as two rows,
  because ten cards in one row at 375px leave each card too narrow to tap. Answer options go from two
  columns to one. The assistant window becomes a full-screen sheet.
- A lesson keeps its "back / continue" bar sticky at the bottom, on `paper` with a `paperEdge` rule.
- **Every UI change is checked at desktop 1280×820 and phone 375×812.**

**Motion**

- **Transitions** (StyleX): buttons 120ms, tiles 140ms, cards 160ms `ease-out`, the progress fill
  400ms `ease-out`.
- **Animations** (`motion`): a lesson step slides in and out by 28px in 0.2s; cards are dealt into a
  fan in 0.22s, staggered 0.025s; a played card springs onto the table (stiffness 380, damping 28);
  the finish emoji springs in (260, 16); a wrong answer shakes `x: 0, -9, 9, -6, 6, 0` in 0.35s.
- **Celebration** (`canvas-confetti`): on finishing a lesson and on winning a game — nowhere else.

**Design source of truth**

This file for the rules — what each surface, token, size and component is for — and the running
implementation for the values. It began as a byte copy of parrottoon.com/skat (2026-09-21) and was
verified pixel-identical to it. That parity was a requirement of the split, not of the product:
skatgo now develops on its own, and parrottoon.com/skat is not a reference for new work.

## Tools

The literal check — part of `engineering.md`'s mechanical defence:

```bash
git grep -nE "className=|style=\{\{|#[0-9a-fA-F]{6}" -- app/src ':(exclude)app/src/theme/**'
```

It must return **exactly one** tracked product line: the `theme-color` meta in
`app/src/routes/__root.tsx`, which cannot read a CSS variable. `app/src/theme/` is excluded because
colour literals are what a registry is made of; ignored generated output is not product source.

Rebuilding the Astryx theme after an approved change to `parrottoonTheme.ts`:

```bash
(cd app && npx @astryxdesign/cli theme build src/theme/parrottoonTheme.ts --out src/theme/parrottoon.css --icons-specifier ./icons)
```

## Guidance

**Build from the system above.** A new screen is assembled from its surfaces, its type roles, its
shape and spacing steps, its elevation forms and its components. A value outside those tables — a new
font size, radius, shadow form or spacing step — is a question for the human, not a judgement call.

**Choosing components.** Reach for a custom component only when the kit genuinely has nothing that
fits — not because the existing one needs configuring, and not because writing one looks faster.

**One primary per view.** A view has at most one `brass` action; the rest are `quiet` or, on and
around the table, `felt`. Hints are always a `felt` `sm` button.

**Choosing a token.** Use the role, not the colour that looks right: `ink` / `inkSoft` / `inkFaint`
for text on paper by importance, `white` for text on felt, `brass` for the one call to action and for
highlights, `good` / `bad` (with their `Soft` backgrounds) only for judging an answer. State the text
colour on every heading and paragraph: the Astryx theme colours `h*` and `p` itself, and in dark mode
that colour is light — unreadable on paper. A missing token is a stop, not a reason to compose one.

**Interaction states.** A wrong answer explains itself, shakes, and never advances; "continue" stays
disabled until the step is solved. An illegal card is refused with the follow-suit reason and stays in
the hand. Anything still loading shows the course's own "正在发牌……". A card that cannot be played
now is dimmed but still tappable, so the table can say why. Every control shows the brass focus ring.

**Content and tone.** Direct and a little playful in every language the course speaks, written for
learners from six to ninety-nine alike (「不枯燥的」). The German words a Skat table actually uses — Grand, Null, Hand, Schneider,
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
