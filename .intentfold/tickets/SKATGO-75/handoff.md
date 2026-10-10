# SKATGO-75 handoff

This work came through an open development phase; this file records what was delivered and verified,
not which tool or skill produced each edit.

## What changed

1. **Tap-to-collect is a setting; tricks collect by themselves by default.**
   - `lib/skat/settings.ts` gains `tapToCollect`, default off and stored with the deck. `useTapToCollect` keeps hydration safe.
   - In `game-table.tsx` a finished trick goes after `TRICK_PAUSE` (1200 ms) unless the setting is on. With it on, SKATGO-72's hand and full-screen tap apply.
   - A hand card tapped while a trick waits takes it at once and is played if the learner leads.
   - The early-end reveal (SKATGO-65) always waits for a tap.
2. **Settings dialog** (`frame.tsx`):
   - It has three sections: Kartenblatt, Stiche (the tap-to-collect switch) and Sprache. The language uses the header menu's `setLocale`, so both always show the same language.
   - The dialog is portalled to `body`. The page behind gets `inert` and its scrolling is turned off; Escape closes the dialog.
   - The dialog scrolls inside itself when the screen is short, and sits on the new `layer.modal`.
3. **Tips on top** (rework):
   - The table's top band, holding the hint or refusal, rises to the new `layer.tip`, over the drawer and side panel.
   - A pointerdown anywhere closes the tip and still acts.
4. **Side panel** (rework):
   - The three tabs sit in equal grid columns (`dims.panelTabs`).
   - Kurs is replaced by Regeln, which opens the rules in the panel (`RulesInPanel`: the rules page's sections, without its intro, links or print links) with a Zurück button back to the game view.
   - The assistant's launcher floats at the felt's top left on the play page and stays bottom right elsewhere. The tabs no longer leave room for it.

Registry additions, from the human's requests in this ticket:
- `layer.tip` and `layer.modal`;
- `dims.panelTabs` and `dims.panelBackRow`.

New messages: the settings section and switch texts, and `panel_back`.

## AC results

Built product on port 55075, free play, scripted legal moves (`tmp/check.mjs`, `tmp/reveal.mjs`, `tmp/tip.mjs`, `tmp/panel.mjs`), at desktop 1280×800 and phone 390×844.

1. **Default: a trick goes by itself after about 1.2 s, no hand.** Met: it went after 1178–1185 ms with no hand.
2. **Tap-to-collect on: the trick waits with the hand; a tap takes it.** Met: the trick was still there after 2.5 s and gone after one tap.
3. **An early end is always laid open until a tap.** Met (desktop): with the default setting, a computer's claim showed the reveal and no settlement until the tap.
4. **Language in the settings follows the header.** Met: choosing English loaded `/en/play` with `lang="en"`, and the header's menu ticked English.
5. **The page behind the open settings neither scrolls nor takes a touch.** Met.
   - With the dialog open, `html` overflow was `hidden`, 3 `body` children were inert, and a point over the hand did not reach it.
   - After closing, both were restored.

Rework checks:
- **Tips on top.** The bidding tip was topmost at three points and gone after a tap elsewhere, on desktop and phone.
- **Tabs, rules and launcher.**
  - Tab tile centres were evenly spaced: 109/109 px on desktop and 103/104 px on phone.
  - The launcher sat at the felt's top left (16, 16 on desktop; 8, 8 on phone).
  - The rules view showed 8 sections, and Zurück returned to the game view.

Mechanical defence passed in full:
- typecheck and build;
- 101 tests;
- 21 client chunks;
- 120 token files;
- literal grep 0;
- SSR link;
- `check:seo --built` and `test:seo`.

## Deviations

None from the ticket. The 1.2 s pause was the developer's call, as the ticket asked.

## Environment

- Ports 55075 / 56075 / 57075; local database container `skatgo-multiplayer-db-57075`.
- The worktree's `MULTIPLAYER_URL` and `DATABASE_URL` ports were pointed at the ticket ports locally.
- No env key added, changed or removed.

## Residual

- `dims.launcherRoom` is now unused. Removing it is a registry change, so it was left for the human.
- On a phone with the side panel open, the launcher at the felt's top left touches the panel's left edge by a few pixels.
- The header-to-settings direction of the language sync was not driven separately; both read the same locale.
- Charter drift: `ui.md` does not describe the settings sections, the tap-to-collect default, the panel's Regeln tab, the launcher's place at the table, or the new layers.
