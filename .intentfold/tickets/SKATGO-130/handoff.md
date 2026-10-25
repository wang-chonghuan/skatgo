# SKATGO-130 handoff

## What changed

- **Free play without hints** (`game-table.tsx`, `server-table.tsx`): the table's hint switch is on only for the
  course's own table and for a server game that asks for hints; lesson 11 asks, free play does not. Every hint control
  — the bidding, skat, discard, declaring and play hints, and the hint tab — reads that switch.
- **The AI assistant removed** — no hidden switch:
  - deleted: `components/skat/ask.tsx`, `ask-thread.tsx`, all of `lib/ask/` (handler, model call, context, limits,
    conversation, their tests), `lib/skat/table-snapshot.ts`, `lib/skat/table-view.ts` (and its test);
  - unmounted from `skat-layout.tsx`; `/api/ask` gone from `server.ts` (now 404); the table no longer publishes its
    view; `assistant_asked` gone from `analytics.ts`; the 19 `ask_*` messages per language gone;
  - the coach's promise in free play's copy (`entry_game_text`, on the course page and after a lesson) — only that
    sentence;
  - the chat's own tokens (`dims.launcherLift*`, `closeButton`, `window*`, `chat*`; `icon.sendStroke`;
    `typography.windowName`, `windowSub`); `dims.launcher` and `icon.launcher` stay — the table's way-out button uses
    them;
  - `deep-chat-react` uninstalled (approved in the ticket); comments that named the assistant corrected.
- **Legal text** (`lib/legal.ts`, both languages, dated 2026-10-25): the assistant's section and every mention gone;
  Microsoft (Azure OpenAI) stays as the forum's translator (SKATGO-124, never stated before); and the free-play
  paragraph no longer says the server stores nothing per game — since SKATGO-128 a signed-in player's finished deals
  are stored for their record of play. The privacy page's meta description follows.
- **Charter**: product.md (free play's table is the tournament's, no assistant), engineering.md, ui.md and
  operations.md (no `/api/ask`; the web service carries no `LLM_*`; the model serves the forum's translation from
  `multiplayer` only).

## AC results

Local web 55130, multiplayer 56130, database 57130 (today's deals prepared locally). `tmp/ac.mjs`, desktop 1280×820 and
phone 375×812; no game played through.

1. **No assistant anywhere, its endpoint gone** — passed: `POST /api/ask` 404; no launcher or chat on `/en`, `/de`,
   the course, lesson 11, the rules, `/daily`, `/play`, the forum; no `deep-chat` in the built client.
2. **No hint in free play** — passed: at free play's auction no hint control on PC or phone; lesson 11 shows "How high
   can I bid?" at its auction on both. The skat, discard, declaring and play hints read the same switch (code).
3. **Free play's controls match the tournament table's** — passed: at the auction the visible controls of both tables
   are the same list on PC and on phone (the hand's cards left out, as they are the deal's); screenshots
   `tmp/{pc,phone}-{free,daily}.png`.

Mechanical defence: passed (typecheck, build, 280 unit tests, bundle, tokens, literal grep, SSR import, SEO built
check, SEO tests). Multiplayer unchanged.

## Deviations

- The legal text's free-play paragraph and Microsoft's role were corrected while the assistant's paragraphs were
  removed: both were stale since SKATGO-128 and SKATGO-124.

## Environment

Ports: web 55130, multiplayer 56130, database 57130. No env key added or changed in the code. **At deploy**: remove
`LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL`, `LLM_EFFORT` from the `skatgo` web service (the multiplayer service keeps its
own `LLM_*` for the forum's translation); the Azure deployment stays (shared with Trovestep).

## Residual

- Differences between free play and the tournament that are the function itself, kept: free play's menu offers
  "Neue Runde" (give up the round, SKATGO-96); its way out goes to the front page, the tournament's to `/daily`;
  after six deals free play shows its round's result and a new round, the tournament its day; the settlement line
  under a deal names the tournament's standing or free play's round. The table, its board, panel, tabs and controls
  are the same.
- The tables keep the room at the top left where the launcher stood; nothing sits there now.

## Check

1. http://localhost:55130/en/play — free play: no hint button in any phase (bid, skat, discard, declare, play).
2. http://localhost:55130/en/daily/play (signed in) and /en/play side by side — the same table.
3. http://localhost:55130/en/course/ready-for-a-real-game — lesson 11 still has its hints.
4. http://localhost:55130/en/privacy — the privacy text without the assistant.

## Decided for you

- Lesson 11 gets its hints from a flag on the server game; the course's own local table keeps its hints too.
- Microsoft stays in the privacy policy, as the forum's translator.
- The table's empty top-left corner is left as it is; no re-layout.
- The way-out button keeps the launcher's size tokens it was built on.
