# SKATGO-14 grill (human, one round — as the human allowed)

1. **Streaming.** Asked: without backend changes `/api/ask` answers whole; keep the waiting dots, or fake
   typing? **Human: 「后端不改是指llm加载的内容不改，这种流式等等必须和trovestep一样」.** So: the endpoint
   streams like trovestep's (`text/event-stream`, each event the whole answer so far, or one error
   event), deep-chat shows it as it grows, and the send button is Stop while it streams. What the model
   is given does not change: same system prompt and page context, same limits (6 messages, 500
   characters, 700 answer tokens, per-visitor rate, daily cap), same model and effort. Every refusal
   before the model call keeps its status code and JSON body.
2. **Conversation.** **Human: like trovestep** — one conversation for the whole site, kept across pages
   and reloads in this tab, cleared by "New conversation"; each question still carries the page it is
   asked on (and the table on `/play`). Owner: the account when signed in, otherwise a guest owner;
   signing out forgets it (trovestep's rule), signing in starts the account's own.
3. **Launcher.** **Human: like trovestep, round icon**, in the current felt green.
4. **Phone.** **Human: like trovestep, full screen**, keyboard-aware, page behind locked.

Derived while planning (no new question needed):

5. **History length vs the endpoint's 500-character check.** The handler refuses any message over 500
   characters — assistant answers included — and answers may run to 700 tokens. A site-wide
   conversation would soon carry a long answer and every following question would be refused.
   Trovestep trims replayed history on the client (`historyMessageChars`); here the client trims
   replayed assistant turns to 500 characters, so the endpoint's rules stay exactly as they are.
6. **Colours** stay the course's tokens; trovestep's Ant tokens are mapped to their roles here: primary
   → felt/brass as today, container → paper, borders → paperEdge, error → bad/badSoft.
