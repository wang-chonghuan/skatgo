# SKATGO-142 handoff

## What changed

- **The moment and the facts** (`multiplayer/src/talk.ts`): from the deal's own record, the moment among the moves
  since the browser last asked — the game just decided before trick 10, else a trick of the first seven where the
  player's card was a slip (15 below SkatZero's best) or the strong one (the best by 10), or that took 20 card points,
  else the bidding just over when it is worth a word (the player's bid bold or pass cautious against SkatZero's highest
  bid for the hand, from the pool, or a bid of 30 or more; an 18 everyone passed is not). Each kind at most once a deal.
  Before the game is chosen the model is told no game has been chosen and not to name one. The model is told only public facts: bids, contract, played cards, card points taken; about the
  computers only what everyone saw. Thresholds from SkatZero's measured spread on 25 deals of its own play.
- **The line** (`talk.ts`, `src/llm.ts`): the site's model (Luna, low) writes one muttered line, asked for at most 9
  words and dropped above 12, no semicolons or dashes, in the page's language, the player addressed as you / du, by Lina (quick, competitive, dry) or Noah (warm, superstitious, laughs at himself); never a card not yet
  played, never advice, teasing each other but not the player. Nothing on no moment, no model, a 6 s timeout, a reply
  that is not one short line by Lina or Noah, or 3,000 lines a day used up. `src/llm.ts` is the model call the forum's
  translations now share.
- **Route**: `POST /free/talk` (`free.ts`); the web's `/api/free/talk` with free play's per-address move limit.
- **Browser** (`server-table.tsx`): after each reply of free play (never lesson 11), one question at a time, three
  lines a deal; a line waits until the table has shown every move of that reply, so it never runs ahead of the felt,
  and is dropped when later than 7 s; a resumed game talks only about what follows. It shows for 6 s as a white card
  on the speaker's side (`game-table.tsx`): on a wide table (`bp.pinned`) beside the trick frame, level with its top,
  toward Lina's or Noah's cards (`dims.talkWidth`, 220px, new); narrower, just over the frame at its left or right.
- **Settings** (`frame.tsx`, `settings.ts`): "Table talk — Lina and Noah talk in free play" / "Tischgespräche — Lina und
  Noah reden im freien Spiel", on by default; off, nothing is asked.
- **Registry** (`shape.stylex.ts`): `dims.talkWidth`, the card's width beside the frame — the human's request for the
  line on the speaker's side is its approval.
- **Charter**: product.md (the talk at free play), engineering.md (SkatZero judges, the model voices; the route, the
  rules, the limits), ui.md (the card in the top band, the switch).
- **Tests**: `multiplayer/test/talk.test.ts` (SkatZero's verdict thresholds; six pool deals SkatZero plays through,
  asked as the browser asks: each kind at most once, "decided" only with tricks left, every fact sent names only cards
  already played).

## AC results

Local web 55142, multiplayer 56142 with the site's model, database 57142. No game played: the player only passes.

1. **A line during the deal, at most three, on the speaker's side, none after the deal** — passed: after the bidding
   a line by Lina or Noah on their side, PC and phone (`tmp/pc-en.png`, `tmp/phone-en.png`); three a deal, once a kind,
   and the decided moment only with tricks left by `talk.test.ts` (six real deals: bid, play and decided moments seen);
   the browser stops at three.
2. **Related to the deal, in the page's language** — passed: e.g. "Noah: I scraped through at 18, lucky me.",
   "Lina: Eighteen secured. Now the mystery begins.", German "Noah: Clever gepasst, bei 35 wird mir schon warm." (the
   player's pass judged cautious by SkatZero); every line 6–8 words; tablet 768 too (`tmp/tablet-en.png`).
3. **No unplayed card told to the model, no advice** — passed: `talk.test.ts` checks every fact sent against the cards
   played so far; the prompt forbids advice and unplayed cards.
4. **Other tables silent** — passed: lesson 11 asks nothing (`tmp/ac.mjs`); only free play's `server-table` passes
   `talk`, and the tournament, deal of the day and private tables have no `talk` and never call `/talk` (diff).
5. **Switch** — passed: off, no question to the model and no line.
6. **Model unavailable** — passed: multiplayer without the model's keys, `/api/free/talk` answered `{"kind":null}`, no
   line, the deal went on (Lina declared Spades).

Mechanical defence: passed (typecheck, build, 283 tests, bundle, tokens, literal grep, SSR import, SEO built check, SEO
tests). `npm --prefix multiplayer run check`: passed (32 tests).

## Deviations

- After the look through the owner's eyes: lines made short muttering (they read as written captions), no game named
  before it is chosen (a line said "Grand" while the declarer was still looking at the skat), a line held until the
  table has shown its moves (one spoke of the passes while the felt still showed the bidding), the bidding talked about
  only when notable, and the card beside the frame on a wide table, over it elsewhere (first above the frame, which on a
  phone covered the table's line with a long line, then in the top band). Registry: `dims.talkWidth` added for it.

## Environment

Ports: web 55142, multiplayer 56142, database 57142. No env key added or changed: the multiplayer service already has
`LLM_BASE_URL` / `LLM_API_KEY` (SKATGO-124). Locally they came from Render into the ticket's git-ignored `tmp/llm.env`.

## Residual

- The trick and decided lines are proven by tests on SkatZero's own play, not seen at the table: the human's play.

## Check

1. http://localhost:55142/en/play — play a deal: are the three lines fun, timely and short enough, and do they come at
   the right moments (after the bidding, during the play, when it is decided)?
2. Settings → "Table talk" — the switch.

## Decided for you

- SkatZero judges only your own bid and cards; about Lina's and Noah's it says only what everyone saw (judging their bid
  would tell you about their hands).
- A slip is a card 15 below SkatZero's best, a strong card the best by 10; a big trick 20 card points.
- A line comes at most 7 s after its moment or not at all, and stays 6 s.
- At most 3,000 lines a day (about a dollar), against a free table being run through on purpose.
- The switch is on by default, like the sounds.
