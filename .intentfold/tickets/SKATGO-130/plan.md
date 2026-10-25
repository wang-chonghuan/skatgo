# SKATGO-130 plan

## Found in the code that the ticket does not say

- The assistant reaches further than its own files: `skat-layout.tsx` mounts `AskLauncher`; `game-table.tsx` publishes
  the learner's view (`table-snapshot.ts`, `table-view.ts`) only for it; `server.ts` answers `/api/ask`; `analytics.ts`
  has `assistant_asked`; the `ask_*` messages; the chat's tokens in `shape.stylex.ts` (`chat*`) and the launcher's room
  in the table's geometry (`dims` comments); `lib/legal.ts` — the privacy policy and terms — describe the assistant,
  its stored questions and Microsoft as its provider.
- Microsoft (Azure OpenAI) still serves the forum's machine translation (SKATGO-124, in `multiplayer/`), so the
  privacy policy keeps Microsoft, now as the translator, not the assistant.
- `AskReview` / `dailyAsk` / `ask(token)` in the tables are the review fetch (SKATGO-79), not the assistant; they stay.
- Hints come from one switch, `hints = !tournament && !room && !exercise`, which is on for every server game — free
  play and lesson 11 alike. `ServerTable` knows its mode (`free` / `lesson`).
- The `table` frame keeps room for the launcher at the top left (`dims` geometry the side tabs and the board use).

## Route

1. Hints: `ServerGame` gets `hints`; lesson 11 passes it, free play does not. `hints` = the local table (the course's
   own game) or a server game that asks for them. Everything else at the free-play table already follows the switch.
2. Remove the assistant: delete `ask.tsx`, `ask-thread.tsx`, `lib/ask/` (with its test), `table-snapshot.ts`,
   `table-view.ts` (with its test) where nothing else reads them; unmount it from the layout; drop `/api/ask`, the
   view publishing, the analytics event, the `ask_*` messages, the chat tokens no one uses after; `deep-chat-react`
   uninstalled (approved in the ticket). Comments elsewhere that name the assistant are corrected.
3. Legal text: the privacy policy and terms no longer describe the assistant; Microsoft stays as the forum's
   translation provider.
4. Free play against the tournament table: list each remaining difference at the same screen size; align what can be;
   what is the function itself (giving up a round, its six-deal round result, the way out) goes in the handoff.
5. Charter: product.md, engineering.md, ui.md, operations.md as the ticket says.
6. After deploy: remove the web service's assistant-only `LLM_*` variables (operations.md names them).

## Slices

1. Free play without hints. 2. The assistant removed. 3. Legal text. 4. Alignment list and fixes. 5. Charter.
