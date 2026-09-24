# SKATGO-13 handoff — 拆掉问答助手的登录门禁

## What changed

- `components/skat/ask.tsx`: the chat opens for everyone — the signed-out prompt and its sign-in
  button are gone (styles and two messages removed). The conversation is still kept per account + page,
  so another person signing in on the same tab starts empty; that decides whose chat you see, not
  whether you may chat.
- `lib/ask/handler.ts`: no 401. The session is read only to choose the rate key — `user:<id>` when signed
  in, `ip:<address>` (from `x-forwarded-for`, as SKATGO-9 did) otherwise — and a failure at Clerk counts
  as signed out, so Clerk can never block a question.
- `lib/ask/limits.ts`: per-visitor instead of per-account; same numbers (10 per minute per visitor,
  500 per day site-wide, 500 characters per question). Test renamed.
- `start.ts`: its comment no longer says the assistant is behind a login.
- Found and fixed in acceptance (grill 6): the chat body (`Chat`) renders again only when its page or
  conversation changes. Otherwise Clerk finishing loading — or refreshing a signed-in session — renders
  the launcher again and deep-chat clears the conversation on screen, losing an answer in flight.
- Login itself untouched: header sign-in button, Clerk's window, account menu, `ClerkProvider`,
  middleware.

## AC results

Built server on port 55013 with `app/.env` (Clerk development instance, model key), headed Playwright,
`tmp/ac.mjs` (uncommitted).

1. **Signed out, chat opens and answers — pass** (zh/en/de × desktop/phone): the launcher opens deep-chat,
   no sign-in prompt, header sign-in still there, no horizontal scroll, no page errors; zh desktop asked
   「第 4 课讲的是什么？」 and got an answer.
2. **Endpoint without any session — pass**: `curl -X POST /api/ask` with no cookie → 200 and an answer.
3. **Login still works — pass**: signed in with the dev-instance account (SKATGO-12's), the chat answers.
4. **Question sent before Clerk loads** (Clerk's script delayed 5s, `tmp/probe4.mjs`): before the fix the
   answer came back 200 but the chat showed nothing; after it, question and answer stay.
- Mechanical defence (typecheck, build, 62 tests, client-bundle check, grep = 1, SSR link) passes.

## Deviations

- The re-render fix (grill 6) was not in `plan.md`; it was needed for AC1 to hold.

## Environment

Ports: web 55013. No env keys added, changed or removed (the worktree uses a copy of `app/.env`).

## Residual

- **Charter drift for the human** (charter is human-owned; not edited):
  - `engineering.md` Stack: "`POST /api/ask` … only for a signed-in account (SKATGO-12)" and "The only
    thing behind a login is the assistant" — now nothing is behind a login.
  - `engineering.md` Structure: `lib/ask/` "the `/api/ask` handler (with its session check)" — the check
    now only picks the rate key.
- **Cost exposure is back to SKATGO-9's**: anyone may call the model; the brakes are the per-address
  rate and the site-wide 500/day cap. A school behind one address shares one per-minute allowance
  unless its learners sign in.
- The `ask_login_required` / `ask_sign_in_required` messages are gone; if a gate returns later they
  need writing again.
