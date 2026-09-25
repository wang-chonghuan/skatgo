# SKATGO-14 handoff — 问答助手弹窗按 trovestep 的样式与交互重做

## What changed

Modelled on Trovestep's `src/components/context-chat/` (read in full; plan.md lists what it does).

- `components/skat/ask.tsx` (rewritten) — the shell: rendered only after hydration; a round 56px
  launcher in felt green with a chat icon and a tooltip, hidden while the window is open, focus returned
  to it on close; desktop window bottom-right, `min(480px, …) × min(576px, …)`; phone (≤ 480px, the
  charter's phone step) full screen, placed over the visual viewport while the keyboard is open, page
  behind locked; header = 「斯卡特助手」 + the page's own title + New conversation / Copy (✓ for 2s) /
  Close, the first two disabled when empty; Esc closes; changing page closes the window and aborts an
  answer in flight; wheel and touch never scroll the page behind.
- `components/skat/ask-thread.tsx` (new) — deep-chat, loaded on first open: streaming `connect.handler`
  (fetch + AbortController), Stop while answering, an arrow send icon, in-page navigation for site links
  in answers, a memoised wrapper so parent renders never reach deep-chat, course-token styles.
- `lib/ask/conversation.ts` (new) — one conversation for the whole site in the tab's sessionStorage
  (last 60 messages), owned by the account or the guest; `historyForRequest` trims replayed answers to
  the endpoint's 500-character limit (grill 5).
- `lib/ask/azure.ts` + `handler.ts` — the answer streams as Trovestep's does (`text/event-stream`, each
  event the whole answer so far, or one error event). What the model is given is unchanged: same system
  prompt and page context, messages, model, effort, 700-token cap; every refusal before the model call
  keeps its status and JSON body; the 30s limit now covers the whole stream; a reader leaving aborts the
  model call.
- Messages: `ask_name`, `ask_page_home`, `ask_new`, `ask_copy`, `ask_copied`, `ask_copy_you` added;
  `ask_button`, `ask_title`, `ask_subtitle` removed; the intros no longer say a reload clears the chat.
- Tests: the upstream stream parser (pieces across chunk boundaries, `[DONE]`), and the tab
  conversation (owner, trimming, broken storage). Icons from lucide-react, already in the project.

## AC results

Built server on port 55014 with `app/.env`, headed Playwright, signed out; `tmp/ac.mjs`, `tmp/ac2.mjs`
(uncommitted). Basic function only.

1. **Launcher and window — pass** (desktop and phone): round 56px launcher; window titled
   「第 4 课 · 跟牌与赢墩」; desktop 480×576 floating bottom-right inside the viewport, phone 375×812
   full screen; launcher hidden while open; Esc closes and focus returns to the launcher.
2. **One conversation — pass**: 2 questions asked on lesson 4 were there on the course map (window
   titled 「课程目录」) and after a reload on the table; New conversation emptied it, also after reload.
3. **Copy — pass**: clipboard held 「你: 叫牌时三个座位分别做什么？ … 斯卡特助手: …」, the button showed ✓, then
   returned after ~2s; New and Copy disabled while empty.
4. **Streaming, Stop, signed out, languages — pass**: the answer grew on screen in steps; the send button
   became Stop while answering and Stop ended it; `curl` shows `text/event-stream` with 309 events
   spread over 1.4s for a long answer; refusals still JSON (501 characters → 413); wheel over the window
   left the page at scrollY 400 while wheel outside still scrolled it; en/de show their own labels;
   no page errors; no horizontal scroll.
- Mechanical defence (typecheck, build, 67 tests, client-bundle check, grep = 1, SSR link) passes.

## Deviations

- Grill 1 changed the plan: streaming needed the endpoint's reply to stream (the human: "backend
  unchanged" means what the model is given).
- Phone breakpoint is the charter's 480px (Trovestep switches below 768px).

## Environment

Ports: web 55014. No env keys added, changed or removed.

## Residual

- **Pre-existing, not changed (it is part of what the model is given):** the 700-token answer cap counts
  the reasoning model's thinking. Long questions — above all on a lesson page, whose context is larger —
  can end mid-sentence or come back empty (shown as 「刚才没答上来」). Production, still non-streaming,
  failed the same long question 3 of 3 times; the streaming build answered 3 of 4 (text written before
  the cap now arrives). Raising the cap or lowering the effort is the human's call.
- Charter: `ui.md` names deep-chat as a third-party component — still true; `engineering.md` does not
  mention that `/api/ask` streams — worth one line when the human next edits it.
