# UI Requirements

Binding on every UI change. **UI work follows this file strictly** — the agent does not invent
alternatives to what is written here. Section shape is fixed by `.intentfold/readme.md`.

> Seeded 2026-09-21 by intentfold cap1 from the repository, and accepted by the human as written.
> The design system below was extracted from the running code on 2026-09-27 (SKATGO-18) as the
> binding reference for large-scale development (「当前的风格就可以」), and turned into tokens the same
> day (SKATGO-19, 「把一切都token化」): every design value now lives in a registry under
> `app/src/theme/`, and product code names it.

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
What the course controls is what it hands them — course tokens only, in
`components/skat/ask-thread.tsx` and `lib/clerk-appearance.ts` — and the shell around them, which is
the kit. Tokens reach them as CSS variables, which inherit into deep-chat's shadow root. Clerk's
windows stay in English; the human chose not to add its translation package. Icons come from
**lucide-react** and appear only in the assistant (the launcher, the window header and the send
button); the course itself uses emoji and the suit symbols instead of icons.

**Token registries — the only place a design value is written**

Product code outside `app/src/theme/` names tokens and never writes a colour, size, weight, duration or
breakpoint of its own; `check-design-tokens.mjs` (Tools) fails the build otherwise. The registries:

| File | Exports | Owns |
|---|---|---|
| `skat.stylex.ts` | `skat` | the palette (`defineVars`) |
| `breakpoints.stylex.ts` | `bp` | media-query keys (`defineConsts` — a media query cannot read a variable) |
| `scale.stylex.ts` | `space`, `radius`, `border`, `size`, `opacity`, `layer` | spacing, corners, border widths, component dimensions and geometry, opacity, stacking |
| `effects.stylex.ts` | `shadow`, `texture`, `move`, `timing` | shadows, felt gradients and the card back, transforms, CSS transition timing |
| `type.stylex.ts` | `family`, `fontSize`, `weight`, `leading` | typography primitives — used only by `type.ts` |
| `type.ts` | `typography` | the typography roles product code picks from |
| `constants.ts` | `phoneQuery`, `themeColor`, `icon`, `stepSlide`, `deal`, `playIn`, `trick`, `finish`, `shake`, `confettiBurst` | values for code that cannot read a CSS variable: `matchMedia`, the `theme-color` meta, lucide sizes, `motion` and `canvas-confetti` |
| `parrottoonTheme.ts` | the Astryx theme, compiled to `parrottoon.{css,js,d.ts}` | the reset and prose defaults underneath (the name is historical) |

The registry holds the value and a comment saying what it is for; this file holds the rules for
choosing. Read the registry for any value.

**The look: a card room**

Green baize, cream paper, brass. Every screen is built from four surfaces, and each surface decides
its text colour:

| Surface | What it is | Built from | Text on it |
|---|---|---|---|
| **Page** | the reading column | `skat.paper` | `skat.ink` |
| **Felt** | where cards lie — the whole-game table, a drill's hand, the course map's hero | `skat.felt` under `texture.feltTable` / `feltDrill` / `feltHero`; the table and drills add `shadow.table` / `shadow.feltInset` | `skat.white` |
| **Deep felt** | the header bar, the assistant window's header, a seat at the table | `skat.feltDeep` | `skat.white` |
| **Paper on felt** | a light box set on felt — the table's action area, the map's progress box, a bid bubble | `skat.paper` | `skat.ink` |

Interactive tiles on the page — a lesson card, an answer option, a contract button, a toggle — are
`skat.white` with a `skat.paperEdge` border, so they stand off the cream page.

**Colour roles** (`skat`, one fixed palette, deliberately not a light/dark pair: a card table is green
at any hour and the cards must stay paper-white)

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

The browser's toolbar colour on phones is `themeColor` (`constants.ts`), the header's `feltDeep`.

**Typography**

Product code picks a **role** from `typography` (`type.ts`) and never sets `fontFamily`, `fontSize`,
`fontWeight` or `lineHeight` itself. A role fixes family, size (and its phone size), weight and, where
the design sets one, leading; a role without a leading keeps the one it sits in. Colour is not part of
a role — the surface decides it.

| Roles | For |
|---|---|
| `hero`, `stepTitle` | the course map's title and a teaching step's title — the display serif (`family.display`) |
| `finishTitle`, `pageTitle`, `resultTitle` | the finish screen, the game step and free play, the settlement — the heading stack (`family.heading`) |
| `brand`, `cardTitle`, `contract`, `name`, `windowName`, `bid`, `badge` | names and titles inside the UI |
| `prompt` | the question of an exercise |
| `body`, `bodySmall` | reading text (`leading.reading`) |
| `say`, `note`, `context`, `loading` | the table's running line, notes in panels, context lines, the loading line |
| `link`, `small`, `meta`, `smallBold`, `switch`, `label`, `pill`, `micro`, `windowSub`, `verdictMark` | small text: links, counts, captions, labels under cards, pills, seat meta |
| `control`, `controlSm`, `controlMd`, `controlLg`, `option`, `toggle` | native controls (they restate the family, which controls do not inherit) |
| `emphasis` | `**bold**` inside course text |
| `stars`, `closeGlyph`, `markGlyph`, `seatFace`, `emojiTile`, `celebrate` | emoji and glyphs sized as pictures |
| `frame` | the frame's family, which everything inside inherits |

The primitives behind the roles (`type.stylex.ts`): families `body` (DM Sans with CJK fallbacks),
`display` (Fraunces with Songti), `heading` (the Astryx heading stack); sizes `f12`–`f88`; weights
`regular`, `semibold`, `bold` — only weights the page actually loads; leadings `glyph`, `tight`,
`control`, `compact`, `reading`. A new combination is a new role in `type.ts`, never an inline style.

**Shape** (`radius`, `border`)

| Radius | Used for |
|---|---|
| `round` | buttons, pills, the progress bar, toggles, round icon buttons, the launcher, number badges |
| `stage` | the big felt surfaces: the course map's hero, the game table |
| `felt` | a drill's felt |
| `panel` | panels, lesson cards, the progress box, the table's action area |
| `window` | the assistant window (`0` as a full-screen phone sheet) |
| `tile` | answer options, contract buttons, seats, the lesson emoji tile, chat bubbles and input |
| `control` | a bid bubble; Clerk's windows |
| `card` / `cardSm` / `cardXs` | playing cards (`md`/`lg` / `sm` / `xs`) and the brand mark (`card`) |

Border widths: `border.hair` for a panel, the assistant window, a toggle and the chat input;
`border.tile` for interactive tiles; `border.frame` for a card back's white frame. Focus rings are
`border.focus` offset `border.focusOffset` (`focusSm` / `focusOffsetSm` in the header).

**Spacing** (`space`, named by size: `x2 x4 x6 x8 x10 x12 x14 x16 x18 x20 x24 x28`, and `x40`, `x80` for
the vertical room of the finish and loading screens)

| Where | Desktop | Phone |
|---|---|---|
| Reading column padding (block / inline) | `x28` / `x24` | `x16` / `x12` |
| Header padding (block / inline) | `x12` / `x24` | `x12` / `x14` |
| Hero padding | `x28` | `x18` |
| Panel padding | `x20` | `x16` |
| Felt padding (drill / table) | `x16` | `x8` / `x10` |
| Gap between page sections | `x18`–`x24` | same |
| Gap inside a stack of content | `x12`–`x16` | same |
| Gap in a row of controls or a list | `x10` | same |
| Gap among pills, chips, small cards | `x6`–`x8` | same |

Component dimensions and geometry — card widths, fan slots, the reading column, the launcher, the
window, the table centre, trick positions, overlaps, grid templates — are named in `size`.

**Elevation** (`shadow`, `move`)

- **Ledge** — `shadow.ledgePrimary` / `ledgeQuiet` / `ledgeFelt` / `ledgeBrass` / `ledgeOption`: the
  solid shadow that makes a button or the current lesson card look pressable. Pressing moves it
  `move.press`; at rest it is `move.rest`.
- **Lift** — on hover a tile rises `move.lift` with `shadow.lift`; a clickable card rises
  `move.cardHover`, a selected one sits at `move.cardRaised` with `shadow.cardRaised`.
- **Card** — every playing card carries `shadow.card`; a hinted or winning one `shadow.cardGlow`; a
  judged one `shadow.verdictGood` / `verdictBad`.
- **Float** — the assistant window, `shadow.float`; the launcher, `shadow.launcher`; the game table,
  `shadow.table`. What floats is stacked by `layer`.

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

Button sizes pair a role with padding: `sm` is `controlSm` with `space.x6`/`x12`, `md` is `controlMd`
with `x10`/`x18`, `lg` is `controlLg` with `x14`/`x24`. A disabled button is at `opacity.disabled`
with no ledge.

**Components — the course's widgets**

| Widget | File | What it is |
|---|---|---|
| `PlayingCard` | `playing-card.tsx` | one card, `size.cardAspect`, public-domain faces (`@letele/playing-cards`); sizes `xs`, `sm`, `md`, `lg` (`size.card*`, phone widths for `md`/`lg`); states `selected`, `dimmed` (`texture.dimmed`), `glow`, `verdict` good/bad, `faceDown` (red hatched back, `texture.cardBack`) |
| `Fan` | `card-row.tsx` | a hand held as a fan: slots (`size.slot*`) shrink and overlap to fit; more than six cards split into two rows on a phone; order badges; `data-answer` / `data-order` for scripted checks |
| `CardRowView` | `card-row.tsx` | a labelled, wrapping row of cards for reading, with optional captions or ✓ / ✗ |
| `Shake` / `Feedback` | `exercises.tsx` | the wordless "no" after a wrong answer (`shake`), and the good/bad panel that explains it |
| `GameTable` | `game-table.tsx` | the whole-game felt: two seats, the trick in the centre, a strip of pills, the learner's hand, and a paper action area |

Recurring patterns built on native elements — reuse them rather than inventing a neighbour:

- **Tile choice** — a white tile, `border.tile` in `paperEdge` that turns `brass` on hover; chosen:
  `brassDeep` border on `brassSoft`; right: `good` on `goodSoft`; wrong: `bad` on `badSoft` at
  `opacity.spent`. Answer options, contract buttons and toggles are all this.
- **Lesson card** — a white tile with the emoji in a `size.emojiTile` `brassSoft` square; states
  `done` (`good` on `goodSoft`), `next` (brass border and `shadow.ledgeBrass`), `open` (brass border on
  hover).
- **Round icon button** — `size.closeButton` / `size.iconButton`, transparent, a `paperDeep` (on
  paper) or `felt` (on felt) background on hover: close, new conversation, copy.
- **Floating launcher** — a `size.launcher` round `feltLight` button fixed bottom-right with
  `shadow.launcher`.

**Layout and responsive**

- The frame (`app/src/skat-layout.tsx`): a `feltDeep` header — the brand (♣ on a `size.brandMark` brass
  mark) on the left, the language switch and account on the right — then a reading column at most
  `size.column` wide, centred.
- **The phone step is `bp.phone`**, used throughout; the course map's hero stacks at `bp.hero` and the
  contract picker wraps at `bp.contracts`. On a phone a hand of more than six cards is held as two
  rows, because ten cards in one row at 375px leave each card too narrow to tap. Answer options go
  from two columns to one. The assistant window becomes a full-screen sheet (`phoneQuery`).
- A lesson keeps its "back / continue" bar sticky at the bottom, on `paper` with a `paperEdge` rule.
- **Every UI change is checked at desktop 1280×820 and phone 375×812.**

**Motion**

- **Transitions** (`timing`): `press` for buttons, `tile` for tiles, `card` for cards, `progress` for the
  progress fill, with `easeOut`.
- **Animations** (`constants.ts`, for `motion`): a lesson step slides by `stepSlide`; cards are dealt
  into a fan by `deal`; a drill's played card rises by `playIn`; a played card springs onto the table
  by `trick`; the finish emoji springs in by `finish`; a wrong answer shakes by `shake`.
- **Celebration** (`confettiBurst`): on finishing a lesson and on winning a game — nowhere else.

**Design source of truth**

The registries under `app/src/theme/` for the values, and this file for the rules — what each surface,
token, role and component is for. The course began as a byte copy of parrottoon.com/skat
(2026-09-21); that parity was a requirement of the split, not of the product, and parrottoon.com/skat
is not a reference for new work.

## Tools

The token check — part of `engineering.md`'s mechanical defence. It parses every source file under
`app/src` outside `theme/` and fails, naming file and line, on a design value written there instead of
named (the rules are in the script's header):

```bash
node app/scripts/check-design-tokens.mjs
```

The literal check — also part of the mechanical defence:

```bash
git grep -nE "className=|style=\{\{|#[0-9a-fA-F]{6}" -- app/src ':(exclude)app/src/theme/**'
```

It must return **no** tracked product line. `app/src/theme/` is excluded because literal values are
what a registry is made of; ignored generated output is not product source.

Rebuilding the Astryx theme after an approved change to `parrottoonTheme.ts`:

```bash
(cd app && npx @astryxdesign/cli theme build src/theme/parrottoonTheme.ts --out src/theme/parrottoon.css --icons-specifier ./icons)
```

## Guidance

**Build from the tokens.** A new screen is assembled from the surfaces, roles, scales, elevation forms
and components above. A value the registries do not have — a new size, radius, shadow, role or
spacing step — is a question for the human (Redline 1), not a judgement call, and never an inline
value.

**Choosing components.** Reach for a custom component only when the kit genuinely has nothing that
fits — not because the existing one needs configuring, and not because writing one looks faster.

**One primary per view.** A view has at most one `brass` action; the rest are `quiet` or, on and
around the table, `felt`. Hints are always a `felt` `sm` button.

**Choosing a token.** Use the role, not the value that looks right: `ink` / `inkSoft` / `inkFaint`
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
   without the human's explicit approval. Registries: every file under `app/src/theme/` —
   `skat.stylex.ts`, `breakpoints.stylex.ts`, `scale.stylex.ts`, `effects.stylex.ts`,
   `type.stylex.ts`, `type.ts`, `constants.ts`, and `parrottoonTheme.ts` (with its generated
   `parrottoon.{css,js,d.ts}`). A missing token is a stop; reaching for a raw value instead of asking
   is the evasion this entry exists to name.
2. **Tailwind, or any utility-CSS framework** — forbidden outright. Detectable from
   `app/package.json` and from any class attribute.
3. **`className=`, `style={{…}}`, a second stylesheet, or a design value written in `app/src` outside
   `app/src/theme/`** — forbidden outright. Detectable by the token check and the literal check in
   `Tools`. `app/src/styles/app.css` is the only stylesheet.
