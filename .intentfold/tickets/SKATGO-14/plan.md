# SKATGO-14 plan

## Reference read (trovestep `src/components/context-chat/`)

- `context-chat.tsx` — the shell: rendered only after hydration; a round icon FloatButton (primary
  colour, tooltip "Ask about this page") hidden while open, focus returned to it on close; desktop panel
  bottom-right `min(480px, 100vw−2m) × min(576px, 100dvh−…)`, rounded, bordered, brand-tinted shadow;
  phone (below md) a full-screen sheet placed over the visual viewport while the keyboard is open, page
  scroll locked; header = assistant name + page title (ellipsis) + New conversation (+) / Copy (copy →
  check for 2s) / Close, first two disabled when empty; one conversation for the whole site in memory +
  sessionStorage (kept across pages and reloads; only "New", sign-out or another account replaces it);
  changing page closes the window and aborts an answer in flight; Esc closes; wheel/touch never scroll
  the page behind (only the messages / input scroll, and stop at their ends).
- `deep-chat-thread.tsx` — deep-chat with a custom `connect.handler` (fetch + abort signal; stream in
  trovestep), Ant ArrowUp as the send icon, in-page navigation for site links in answers, a memoised
  wrapper so parent renders never reach deep-chat, `overscroll-behavior: contain`, error/loading/intro
  bubble styles, scroll to bottom when the keyboard changes the visible area.
- `conversation-store.ts` — sessionStorage `{owner, messages}` (last 60), discarded for another owner.

## What skatgo has, and what does not change

- `components/skat/ask.tsx` already uses deep-chat with course tokens (colours stay — constraint 2) and
  `POST /api/ask` (JSON `{text}`, limits: 6 messages, 500 chars — constraint 3: backend unchanged).
  Signed-out use stays open (constraint 1).
- The table view goes with every question on `/play` (`useTableSnapshot`) — kept.

## Route

1. `lib/ask/conversation.ts` (new): the tab's conversation — module + sessionStorage, owner-keyed
   (account id, or a guest owner), last 60 messages; unit-tested.
2. `components/skat/ask.tsx` rebuilt after trovestep: launcher, panel, header actions, phone sheet +
   keyboard viewport + scroll lock, gesture containment, page-change close/abort, focus return,
   mount-after-hydration; deep-chat via a memoised wrapper and a `connect.handler` that POSTs to
   `/api/ask` with an AbortController (no streaming — the endpoint answers whole).
3. Icons from lucide-react (already in the project); colours only from `skat.*`; StyleX only.
4. New messages in zh/en/de (new conversation, copy, copied, launcher tooltip, page titles reuse
   existing ones).
