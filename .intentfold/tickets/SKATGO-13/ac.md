# SKATGO-13 acceptance check plan (basic function only)

Built server on port 55013 with `app/.env` (Clerk development instance, model key), headed Playwright.

1. Fresh (signed-out) context, `/zh/lesson/4`, `/en`, `/de/play` at desktop and phone: the launcher opens
   the chat (deep-chat present, no sign-in prompt, `ask-sign-in` absent). On desktop zh: ask a question,
   an answer appears.
2. `curl -X POST /api/ask` with a valid body and no cookie → 200 with `text` (not 401).
3. Header sign-in button present and opens Clerk's window; signed-in check uses the dev-instance
   account per operations.md (create one if none) → chat present and answers.
