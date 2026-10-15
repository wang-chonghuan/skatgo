# SKATGO-103 acceptance checks

Run against the ticket's web service (port in ticket.json), desktop 1280×820 and phone 375×812.

1. **Hub: 12 type cards, open/close, 36 exercises** — Playwright on `/de/skat-tricks`: 12 cards; each tap
   opens it to 3 exercise links and a second tap closes it; 36 distinct links in total. Each of the 36
   exercise pages loads its question (no answering — basic function only).
2. **Exercise page: answer, analysis, back** — on one Choice, one Pick and one Play exercise: answer once,
   the verdict, the right answer and the explanation show; the trick link where there is one; the back
   button returns to `/de/skat-tricks`. No sign-in prompt; reload shows the exercise fresh (nothing saved:
   no new `localStorage` key).
3. **Article at its new address** — `/de/skat-tricks/12-tricks` and `/en/skat-tricks/12-tricks` render the
   article (12 tricks, the three daily buttons); the hub's small link under the cards opens it.
4. **Result page link** — on a finished free-play deal (the same `DealAnalysis` as daily and lesson 11) the
   link points to `/de/skat-tricks` with the new text.
5. **Exercise answers are verified** — `npm test` in `app` (exact answers equal the engine's) and the
   SkatZero test in `multiplayer` pass; the handoff lists all 36 with answer and verification.
6. **Deck follows the setting** — switch to the Deutsches Blatt in settings; an exercise's cards render
   with the German pictures.
7. Mechanical defence per `engineering.md` Tools.
