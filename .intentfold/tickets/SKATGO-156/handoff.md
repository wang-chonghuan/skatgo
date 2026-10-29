# SKATGO-156 handoff

## What changed

### Deploy hand-over (multiplayer)

- **The cause:** Render switched traffic to the new instance as soon as `/healthz` answered. The old leader kept the advisory lock until Render stopped it, about 60 s after the new instance went live, and on the last three deploys the new instance was ready only after 178, 178 and 180 s. In that gap the game routes answered `not_ready`.
- **The new flow:** once SkatZero is loaded, the new instance sends `NOTIFY skatgo_leader_handoff` every 2 s. The leader then:
  - closes its tables (`matchMaker.gracefullyShutdown`; their state is in the database, so the newcomer restores them);
  - releases the lock (`Store.stepDown`);
  - stays up and healthy until Render stops it.
  
  The newcomer acquires the lock within a second.
- **Files:** `store.ts` (`listenHandoff`, `requestHandoff`, `stepDown`), `server.ts` (the request in `elect`, `handOver`, `stop` tolerating closed tables) and the new `test/handoff.test.ts`.
- **`render.mjs`:** the readiness wait is 10 minutes instead of 3, because the first deploy's old instance cannot hand over yet.

### Bidding practice (`bidding-practice-page.tsx`)

- Beside "x/600" there is a round white button (the header gear's look, lucide `LayoutGrid`). It opens "All questions" / "Alle Aufgaben" in the same `Modal` as the cheat sheet:
  - all 600 numbers, as the Skat-Tricks levels' tiles;
  - a mistake not yet put right is red (`badSoft`/`bad`);
  - the current question is ringed `go`;
  - questions not reached yet are slate and disabled;
  - the list scrolls inside the dialog, which has its close button.
- The folded "Mistakes" card and its message are gone.
- Order: only the run's own question and earlier ones can be opened.
- The cheat sheet link has no icon and stays on the seat's line (`nowrap`). On a phone it reads "Cheat sheet" / "Spickzettel", because the full name does not fit beside the seat at 375 px.

### Daily page

- The two toggles are `linkLook` md buttons, the chosen one `go` and the other `quiet`: 16 px, 40 tall, where they were 13 px pills.

### Charter

ui.md, product.md and operations.md.

## AC results

1. **PASS locally.**
   - Two instances on one database: the second was ready 2 s after starting. The first logged `handover`, then `stepped_down`, answering `/healthz` 200 and `/readyz` 503, and exited 1 s after SIGTERM.
   - `handoff.test.ts` passes.
   - Production will show it from the deploy after this one. This deploy still waits for the old instance, which predates the hand-over.
2. **PASS** (`tmp/ac.mjs`, PC and phone): 600 numbers; the mistake (1) red; the current one (2) ringed; it scrolls inside; opening question 1 from the list works, and so does closing; the "Mistakes" fold is gone.
3. **PASS.** The link has no icon and sits on the seat's line on PC, phone en and phone de.
4. **PASS.** Only 1 and 2 are enabled at question 2.
5. **PASS.** Both daily buttons are 16 px and 40 tall, the chosen one green, on PC and phone.
6. **PASS.** No sideways scroll on the practice or daily page, PC or phone. The bidding practice regression passes 10/10.

Mechanical defence passed: typecheck, build, 306 tests, bundle, tokens, literal grep, SSR link, `check:seo --built` and `test:seo`. Multiplayer check: 36/36.

## Deviations

- "Cheat sheet" is the phone label, as above.

## Environment

- Ports: web 55156, multiplayer 56156, database 57156.
- No env keys or schema changed.

## Residual

None.

## Check

1. The list button beside 1/600 and its dialog: tile look, red mistakes, slate unreached numbers.
2. The daily page's two buttons: the chosen one green, as standard buttons.
3. "Cheat sheet" (short) on a phone.

## Decided for you

- The hand-over runs over Postgres NOTIFY, not a stricter health check, which would have deadlocked this first deploy.
- The icon is `LayoutGrid`.
- The numbers use the Skat-Tricks levels' tiles.
- The daily toggles are chosen `go` / other `quiet`.
