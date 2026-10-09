# UI Requirements

Binding on every UI change. **UI work follows this file strictly** — the agent does not invent
alternatives to what is written here. Section shape is fixed by `.intentfold/readme.md`.

> Seeded 2026-09-21 by intentfold cap1 from the repository, and accepted by the human as written.
> The design system below was extracted from the running code on 2026-09-27 (SKATGO-18) as the
> binding reference for large-scale development (「当前的风格就可以」), and turned into tokens the same
> day (SKATGO-19, 「把一切都token化」): every design value now lives in a registry under
> `app/src/theme/`, and product code names it. The lobby design (SKATGO-26) replaced that look; this
> file was brought up to date with the code on 2026-10-05 (SKATGO-47, the human: 「都在这个工单里一起
> 改掉」).

## Contract

**Styling stack — Astryx + StyleX**

Every style is a StyleX rule in the file that owns the element, compiled at build time through
Astryx's build integration. Astryx supplies the reset, the theme's prose defaults and the CSS layer
order underneath. There is no utility-CSS framework and no hand-written component CSS.

**Where components live**

`app/src/components/skat/`. The product has **its own small kit** in `ui.tsx` and renders on native
elements styled with StyleX; it uses no Astryx components, whose colours follow the app theme's
light/dark mode while this palette is fixed. A new widget reuses the kit first.

Two third-party components draw their own markup and styles, both approved by the human: **deep-chat**
(the assistant's chat body, SKATGO-9) and **Clerk**'s sign-in window and account menu (SKATGO-12).
What the product controls is what it hands them — tokens only, in `components/skat/ask-thread.tsx`
and `lib/clerk-appearance.ts` — and the shell around them, which is the kit. Tokens reach them as CSS
variables, which inherit into deep-chat's shadow root. Clerk's windows stay in English; the human
chose not to add its translation package. Icons are **lucide-react** outline icons at the sizes in
`icon` (`constants.ts`): the header's menu, language and settings controls, the table's side panel and
edge tabs, an exercise's controls, the assistant, the comparison's open/close chevrons, and the
download button. Suits are the text glyphs ♣ ♠ ♥ ♦, never icons.

**Token registries — the only place a design value is written**

Product code outside `app/src/theme/` names tokens and never writes a colour, size, weight, duration or
breakpoint of its own; `check-design-tokens.mjs` (Tools) fails the build otherwise. The registries:

| File | Exports | Owns |
|---|---|---|
| `color.stylex.ts` | `color` | the palette (`defineVars`) |
| `suits.stylex.ts` | `suit` | the suits' colours: the French deck's four-colour tournament colouring (SKATGO-27, SKATGO-66) |
| `breakpoints.stylex.ts` | `bp` | media-query keys (`defineConsts` — a media query cannot read a variable) |
| `scale.stylex.ts` | `space`, `border`, `opacity`, `layer` | spacing, border widths, opacity, stacking |
| `shape.stylex.ts` | `radii`, `dims` | corner radii; component dimensions and geometry |
| `elevation.stylex.ts` | `elev`, `fill`, `pose`, `veil` | shadows, fills (the felt, filters), transforms of the card art and the table, a tile's veil |
| `effects.stylex.ts` | `move`, `timing`, `layerHint` | where a thing rests, is pressed or rises; CSS transition timing; the compositing hint for things that move (SKATGO-41) |
| `table.stylex.ts` | `stageUnit`, `stage` | the card table's stage, measured in one unit that follows the felt's room (SKATGO-34), including the trick's steps (SKATGO-68) |
| `type.stylex.ts` | `family`, `fontSize`, `weight`, `leading` | typography primitives — used only by `type.ts` |
| `type.ts` | `typography` | the typography roles product code picks from |
| `constants.ts` | `phoneQuery`, `pinnedQuery`, `themeColor`, `icon`, `stepSlide`, `deal`, `cardIndex`, `playIn`, `trick`, `finish`, `shake`, `drawer`, `confettiBurst` | values for code that cannot read a CSS variable: `matchMedia`, the `theme-color` meta, lucide sizes, SVG attributes, `motion` and `canvas-confetti` |
| `flags.tsx`, `icons.tsx` | `FlagUS`, `FlagDE`; the Astryx icon registry | the language menu's flags; the icons the Astryx theme is built with |
| `parrottoonTheme.ts` | the Astryx theme, compiled to `parrottoon.{css,js,d.ts}` | the reset and prose defaults underneath (the name is historical) |

The registry holds the value and a comment saying what it is for; this file holds the rules for
choosing. Read the registry for any value.

**The look: the lobby design** (SKATGO-26, after Funbridge; measured in
`.intentfold/tickets/SKATGO-26/reference.md`)

A light grey page with white surfaces, navy titles and slate secondary text; one action green; the
sections as colour tiles; and the card table as a dark green felt at any hour. The palette is one
fixed light palette, not a light/dark pair.

| Surface | What it is | Built from | Text on it |
|---|---|---|---|
| **Page** | every sub-page's background; the front page's is white | `color.page` (front page `color.surface`) | `color.text`, titles `color.navy`, secondary `color.slate` |
| **Header** | the public site's white bar over every page but the tables | `color.surface`, `elev.landingHeader` | `color.navy`, links `color.slate` |
| **Option card** | a white card on the page: a lesson, the course's progress, the tournament's board and results, a panel | `color.surface`, `radii.option`, `elev.option` (the featured one `elev.optionFeatured`) | `color.navy` / `color.slate` |
| **Colour tile** | a section on the front page: ♣ the course (`tileOrange`), ♠ free play (`tileGreen`) | its `color.tile*`, `radii.tile`, its own `elev.tile*`, its card art under `veil.tile` | `color.onColor` |
| **Felt** | where cards lie: the table, a drill's hand | `fill.felt` (`feltInner` → `feltOuter`, with a fine grain) | `color.onColor`; highlights `color.gold` / `color.amber` |
| **Board and plates** | the table's info board, the seat plates, dark pills | `color.board` with `color.boardLine`; `color.plate` | `color.onColor`, quieter `color.onColorSoft` |
| **Footer** | the legal links under every header page (SKATGO-46) | `color.surface` with a `hairline` rule | links in `color.info` |

**Colour roles** (`color`)

| Tokens | Role |
|---|---|
| `page`, `surface`, `hairline` | the page, white surfaces, rules and borders |
| `text`, `navy`, `slate`, `slateDeep`, `onColor` | body text, titles and links, secondary text, a darker slate (the slate button), text on colour or felt |
| `go` | the one call to action, and the current state; `goLanding` is the public site's own green on its landing buttons |
| `info` | links in text, the hint button, the focus ring |
| `stop` | leaving the table |
| `tileGreen`, `tileOrange` | the front page's section tiles: ♠ free play, ♣ the course |
| `feltInner`, `feltOuter`, `gold`, `amber`, `plate`, `hintTab`, `board`, `boardLine`, `onColorSoft`, `roleTag`, `auctionHead`, `tabActive` | the card table |
| `good` / `goodSoft`, `bad` / `badSoft` | a right / wrong answer: border / fill — and nothing else |
| `tintClubs` … `tintNull` | one tint per contract, from the reference's bid boxes |
| `scrim` | the dim behind a dialog |

The browser's toolbar colour on phones is `themeColor` (`constants.ts`), the header's white.

**Suit colours** (`suits.stylex.ts`, SKATGO-27, SKATGO-66)

One colouring, the four-colour tournament colouring of the French-suited deck: ♣ black, ♠ green, ♥ red,
♦ gold. There is no choice of colours (SKATGO-66). `suit.card*` colours a card face's pips and corner
index; `suit.text*` colours a suit glyph in running text, where a black suit takes the text's own
colour so it stays legible on white and on felt.

**Typography** (`type.stylex.ts`, `type.ts`)

Product code picks a **role** from `typography` and never sets `fontFamily`, `fontSize`, `fontWeight`
or `lineHeight` itself. A role fixes family, size (and its phone size), weight and, where the design
sets one, leading. Colour is not part of a role — the surface decides it.

- **Families**: one geometric sans, **Red Hat Display** (`family.body`), for everything; **Bebas Neue**
  (`family.numeral`) only for Reizen values, "Passe" and the table's numbers. It has a single weight.
- **Weights** (SKATGO-47): two by purpose — `weight.text` (500) for reading text: paragraphs,
  explanations, leads, table rows; `weight.ui` (600) for controls, navigation, links, labels and meta:
  buttons, pills, the table's names and small lines. Titles, emphasis and the large numbers keep
  `bold` (700) to `black` (900). `regular` (400) is only Bebas Neue's. **Every role that sets text
  states its weight** (glyph roles and `control` inherit theirs): the Astryx theme sets `<p>` and
  `<small>` to 400 itself, so a weight a role leaves out is 400, not the frame's. The frame's default is
  `weight.text`.
- **Sizes** are named by their px (`f12` … `f72`, with the reference's measured sizes such as `f19_6`);
  **leadings** `glyph`, `tight`, `control`, `compact`, `reading`, `ui`.
- **Roles**, by where they are used:
  - the public site: `landingHero`, `landingHeroLead`, `landingBrand`, `landingHeading` (the h1 of
    every sub-page, and the front page's section headings), `landingBody`, `landingNav`, `landingBtn`,
    `landingCta`;
  - the app's pages: `appText`, `appBtn`, `appBtnStrong`, `appLink`, `optionTitle`, `optionDesc`,
    `tileTitle`, `tileSub`, `dialogTitle`;
  - the course and its exercises: `prompt`, `body`, `bodySmall`, `note`, `context`, `loading`,
    `emphasis` (**bold** in course text), `link`, `small`, `meta`, `smallBold`, `label`, `micro`,
    `badge`, `toggle`, `option`, `control`, `stars`, `verdictMark`;
  - the assistant's window: `windowName`, `windowSub`;
  - the card table: `tabLabel` (the side panel's tabs), `plateName`, `roleTag`, `tricksLabel`,
    `auctionHead`, `panelLabel`, `bidChip`, `contractTile`, `infoLabel`, `infoValue`, `infoNumber`,
    `infoSub`;
  - `frame`: the family and default weight everything inside inherits.

  A new combination is a new role in `type.ts`, never an inline style.

**Shape** (`radii`, `border`)

`radii.pill` for the app's buttons and pills, `landingBtn` for the public site's buttons, `tile` for
colour tiles, `option` for option cards, `dialog` for dialogs, `panel` for the table's side panel, its
tabs and block buttons, `column` for an auction column, `tag` for a seat's role tag, `card` / `cardSm` /
`cardXs` for playing cards, `round` for round things. Borders: `border.hair` for panels and inputs,
`border.tile` for interactive tiles, `border.frame` for a card back's frame; the focus ring is
`border.focus` offset `border.focusOffset` (`focusSm` on small header controls).

**Spacing and dimensions** (`space`, `dims`)

Spacing steps are named by their px (`space.x2` … `x80`, with the reference's `x15`, `x27`, `x32`,
`x48`, `x72`). Component dimensions — the header, the reading column (`dims.readingColumn`) and the
wider page column (`dims.pageColumn`), controls, card sizes and slots, the table's panel and drawer,
grid templates, the printable score sheet's handwriting row (`dims.scoreRow`, 6 mm) — are named in
`dims`; the table's stage in `stage` (`table.stylex.ts`).

**Elevation and motion** (`elev`, `fill`, `pose`, `move`, `timing`, `layer`, `layerHint`)

- Every coloured surface casts a shadow in its own colour (`elev.tile*`, `elev.btn*`); white cards
  `elev.option` / `optionFeatured`; floating panels `elev.panel`; playing cards `elev.card`, a raised
  one `elev.cardRaised`, a glowing (hinted or winning) one `elev.cardGlow`, a judged one
  `elev.verdictGood` / `verdictBad`.
- A tile rises `pose.lift` on hover; a clickable card `move.cardHover`, a selected one `move.cardRaised`;
  a pressed button `move.press`.
- **Things that move over the felt** (SKATGO-41): a flying card carries `layerHint.moving` while it
  moves, so the browser moves a finished bitmap instead of repainting the felt under it; a card at rest
  in the trick sits on `move.ownLayer`, drawn at its final size and sharp. The felt's own backdrop is a
  separate element at `layer.backdrop` inside an isolated felt, so nothing that moves repaints it.
- **Transitions** (`timing`): `press`, `tile`, `card`, `progress`, eased `easeOut`; under
  `bp.reducedMotion` every transition is `timing.instant`, and animations follow motion's
  `MotionConfig reducedMotion="user"` (SKATGO-29).
- **Animations** (`constants.ts`, for `motion`): a lesson step slides by `stepSlide`; cards are dealt by
  `deal`; a drill's played card rises by `playIn`; a played card flies onto the table by `trick`; the
  side panel's drawer rises by `drawer`; the finish emoji springs in by `finish`; a wrong answer shakes
  by `shake`.
- **Celebration** (`confettiBurst`): on finishing a lesson and on winning a game — nowhere else.
- Stacking: `layer.launcher` for the header and the assistant's launcher, `layer.window` for its window,
  menus and dialogs.

**Components — the kit (`ui.tsx`)**

| Component | Variants | Use it for |
|---|---|---|
| `Btn` | tone `go` (the one main action), `quiet` (white: secondary), `info` (hints), `stop` (leaving the table), `slate`; shape `pill` (the app's buttons), `block` (the table's full-width buttons), `landing` (the public site's, heavier type); size `sm` / `md` / `lg`; `grow`; `disabled` | every action |
| `linkLook(tone, size, shape)` | the same tones, sizes and shapes as `Btn`, for a router `<Link>` | navigation that looks like a button: an action is a `Btn`, navigation is a link |
| `Panel` / `Tip` | tone `card` (white), `tip` (white with an amber border), `good`, `bad`; `pad` | tips, feedback on an answer, a refusal, a settlement |
| `Pill` | tone `quiet`, `go`, `good`, `dark`, `amber` | short facts, never actions |
| `ProgressBar` | `value`, `label` | progress through a lesson |
| `Stars` | `n` of 3 | a lesson's result |
| `Rich` | — | every piece of course text: renders `**bold**` and each suit glyph in its suit's colour |

**Components — the course's and the table's widgets**

| Widget | File | What it is |
|---|---|---|
| `PlayingCard` | `playing-card.tsx` | one card, by default of the Turnierblatt (the German Skat association's tournament deck: French suits in German colours, SKATGO-66), drawn as one SVG: the corner index top left and turned bottom right — the rank as Bebas Neue outlines (`card-glyphs.ts`, never text, which a search engine would read), in every language official Skat's B / D / K / A, or J / Q / K / A when the learner chose that deck in the settings, over the suit's pip; the pips of 7–10 in their traditional places; the ace's one large pip; a court's double-headed figure in a frame notched for the index. Pips and index take the suit's colour. The settings also offer the Deutsches Blatt: the same layout with the German suit symbols (pictures) as pips, its own courts (Unter, Ober, König) and Daus pictures, and K / O / U / A. The court figures, Daus, German symbols and the back are skatgo's own pictures (`app/brand/cards`, served from `/cards`). Sizes `xs`, `sm`, `md`, `lg`, `table`, `trick`, `fill`; states `selected`, `dimmed` (`fill.dimmed`), `glow`, `verdict` good/bad, `faceDown` (the charcoal and white ornament in a white frame) |
| `Fan` / `CardRowView` | `card-row.tsx` | a hand held as a fan (two rows of a long hand on a phone; `data-answer` / `data-order` for scripted checks), and a labelled row of cards for reading |
| `Shake` / `Feedback` | `exercises.tsx` | the wordless "no" after a wrong answer, and the good/bad panel that explains it |
| `TitleWithDownload` / `PdfLink` | `print-links.tsx` | every download (SKATGO-53): the page's h1 with, beside it, the page's one `go` button — lucide's `Download` icon at `icon.inline` and "PDF herunterladen" / "Download PDF" — which moves under the title on a phone and is left off paper |
| `PrintLinks` | `print-links.tsx` | the "Zum Ausdrucken" links to the score sheet and the short rules, on the rules page, the bidding table and the course; left off paper |
| `VsAiTable` | `daily-comparison.tsx` | the daily tournament's comparison with the computer (SKATGO-48): one row per finished deal — the deal's number, the player's and the AI's score each with its role, and the difference, signed and bold, never `good` / `bad` — that opens to both deals told in full; a total row. Rows collapse instead of scrolling sideways; the newest opens after a deal and on `/daily` mid-day. On `/daily` while the day runs (`DayDeals`, "Die Spiele von heute", also rendered on the server; SKATGO-63) every deal of the day has a row: the ones not finished follow by number, "läuft" for the one being played and "offen" for the rest, with nothing of their cards; the total row appears once a deal is finished |
| `GameTable` | `game-table.tsx` | the whole-game table: the felt and its stage, the info board, the seat plates, the trick, the learner's hand, the edge tabs, and the side panel — pinned beside the felt at `bp.pinned`, a drawer otherwise (SKATGO-34). The trick's cards and the skat are as big as the hand's; the trick's overlap, each toward who played it and one step higher than the card to its left (`stage.trickSecond`, `stage.trickThird`), the later on top, so every card's top-left number and suit stay in the open whatever was played last (SKATGO-68) |

Recurring patterns — reuse them rather than inventing a neighbour:

- **Option card** — a white `radii.option` card with `elev.option`, `optionTitle` over `optionDesc`;
  a lesson card's states: `next` (a `go` border), `done` (`goodSoft`), open.
- **Choice tile** — a white tile with a `border.tile` in `hairline` that turns `go` on hover; chosen,
  right and wrong as the `go`, `good` and `bad` tokens say. Answer options, contracts and the settings'
  decks are this.

**Frames and pages**

- **The frame** (`skat-layout.tsx`, `components/skat/frame.tsx`): every page but the tables wears the
  public site's header (SKATGO-43; lessons too since SKATGO-47). The header has:
  - the SkatGo mark (`dims.landingMark`) and name (`landingBrand`);
  - the four links, in this order (the human, 2026-10-01): the daily tournament, free play, the
    course, the rules;
  - on the right, the language menu (a flag button opening a card of flags), the settings gear (the
    choice of deck: the Turnierblatt by default, the Deutsches Blatt, or the Turnierblatt with English
    letters J / Q / K / A — SKATGO-66), and sign-in
    or the account.

  On a phone the links and the account fold into a menu. Under the page sits the legal footer. The
  header is the same on every page; it shows no current-page highlight (its links carry
  `aria-current`).
- **The front page** (`entry-page.tsx`), on white:
  - the hero: the daily tournament's headline (`landingHero`) and lead (`landingHeroLead`) in navy;
    its one green landing action (play today's deals); a quiet ✓ line of what a first visitor wants to
    know; and the human's illustration (SKATGO-33). Never on felt (Redline 4);
  - the sections as colour tiles, one suit each: ♣ the course, ♠ free play, each with its card art and
    a `quiet` button;
  - plain links to the rules and the course, and the questions people ask.
- **A sub-page** (the course, a lesson, the rules, the bidding table, the score sheet, the short rules,
  the daily tournament, the legal pages), on the grey page: its title is the column's first element, an
  `<h1>` in `landingHeading`, `color.navy`; then its content — white option cards where it offers
  choices (the course's lessons, the tournament's board), reading text and tables elsewhere. A
  printable has its download beside the title (`TitleWithDownload`). A lesson starts playing at once: under its title only a
  one-line kicker and the lesson's promise, then the lesson, which keeps its "back / continue" bar
  sticky at the bottom of the screen. Its short explanation for readers and search engines follows the
  lesson, visible, under "Kurz erklärt" / "In short" (SKATGO-52); then its ways on: the next lesson,
  its section of the rules, and all lessons.
- **The tables** (`/play`, `/daily/play`): the felt fills the first screen and never scrolls. Free play
  keeps a scrollable reading section below it; the personal daily page has none (SKATGO-44).
- **Public search content** (SKATGO-44): titles, explanations and contextual links remain visible
  without JavaScript, in the lobby's own tokens and typography — never hidden keyword text or new
  decorative containers.

**Responsive**

- **The phone step is `bp.phone`** (480), used throughout; `bp.cards` takes option cards to one column,
  `bp.hero` stacks the hero, `bp.contracts` wraps the contract picker, `bp.portrait` turns the table's stage upright, `bp.pinned` pins its side panel.
- **Print** (`bp.print`, SKATGO-50): on paper every page leaves out the header, the footer and the
  assistant (`skat-layout.tsx`). The bidding table and the printables print only their title and their
  tables: the score sheet on one A4 page, the short rules
  on two, whose tables run across on paper and wide screens (a phone keeps them tall). Their PDFs are
  these printouts (`engineering.md` Tools).
- On a phone a hand of more than six cards is held as two rows, and the assistant's window becomes a
  full-screen sheet (`phoneQuery`).
- **Every UI change is checked at desktop 1280×820 and phone 375×812.**

**Design source of truth**

The registries under `app/src/theme/` hold the values, and this file holds the rules: what each
surface, token, role and component is for. `.intentfold/tickets/SKATGO-26/reference.md` is the
measured reference of the lobby design. The course began as a byte copy of parrottoon.com/skat; that
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
and components above. A value the registries do not have — a new size, radius, shadow, role, weight or
spacing step — is a question for the human (Redline 1), not a judgement call, and never an inline
value.

**Choosing components.** Reach for a custom component only when the kit genuinely has nothing that
fits — not because the existing one needs configuring, and not because writing one looks faster.

**One primary per view.** A view has at most one `go` action; the rest are `quiet`, or on the table
`block` buttons in their own tones. Hints are an `info` button.

**Choosing a token.** Use the role, not the value that looks right: `navy` for titles and strong text,
`text` for body, `slate` for secondary text, `onColor` on colour and felt, `go` for the one call to
action and the current state, `good` / `bad` (with their `Soft` fills) only for judging an answer.
State the text colour on every heading and paragraph, and give every text a role that carries its
weight: the Astryx theme colours `h*` and `p` and sets `p` and `small` to 400 itself. A missing token
is a stop, not a reason to compose one.

**Interaction states.** A wrong answer explains itself, shakes, and never advances; "continue" stays
disabled until the step is solved. An illegal card is refused with the follow-suit reason and stays in
the hand. Anything still loading shows the product's own loading line (`m.loading()`, "dealing the
cards…"). A card that cannot be played now is dimmed but still tappable, so the table can say why.
Every control shows the focus ring in `color.info`.

**Content and tone.** Direct and a little playful in every language the product speaks, written for
learners from six to ninety-nine alike (「不枯燥的」). The German words a Skat table actually uses —
Grand, Null, Hand, Schneider, Schwarz, Ouvert, Matador — stay German, because those are what the
learner will hear at a real table.

## Redlines

1. **Changing a governed token registry** — adding, renaming, removing or retuning a value — not
   without the human's explicit approval. Registries: every file under `app/src/theme/` —
   `color.stylex.ts`, `suits.stylex.ts`, `breakpoints.stylex.ts`, `scale.stylex.ts`,
   `shape.stylex.ts`, `elevation.stylex.ts`, `effects.stylex.ts`, `table.stylex.ts`,
   `type.stylex.ts`, `type.ts`, `constants.ts`, `flags.tsx`, `icons.tsx`, and `parrottoonTheme.ts`
   (with its generated `parrottoon.{css,js,d.ts}`). A missing token is a stop; reaching for a raw value instead of asking
   is the evasion this entry exists to name.
2. **Tailwind, or any utility-CSS framework** — forbidden outright. Detectable from
   `app/package.json` and from any class attribute.
3. **`className=`, `style={{…}}`, a second stylesheet, or a design value written in `app/src` outside
   `app/src/theme/`** — forbidden outright. Detectable by the token check and the literal check in
   `Tools`. `app/src/styles/app.css` is the only stylesheet.
4. **A felt surface in the front page's hero** — forbidden outright (the human, 2026-09-27:
   「hero区域禁止再用绿色卡了」). Detectable from the hero's styles in
   `app/src/components/skat/entry-page.tsx`: no `color.feltInner` / `color.feltOuter` background and
   no `fill.felt`.
