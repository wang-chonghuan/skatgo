# SKATGO-126 handoff

The nickname moves into the settings and shows everywhere; the board no longer renames; no switch to hide a name.

## What changed

- **Service** — `multiplayer/src/daily.ts`: `dailyName` sets an account's name without a finished tournament and no
  longer rewrites entries; `dailyNick` (`POST /daily/nick`) reads it; `dailyBoard` shows each entry under its
  player's current name (`daily_players`), the entry's own only when there is none.
- **Web** — `daily-handler.ts`: `nick` among the ops; `name` and `nick` for accounts only (401). `daily-api.ts`:
  `dailyNick`.
- **Settings** — `frame.tsx`: for an account, a first section "Spitzname" / "Nickname": the name in a text field,
  "Speichern" (enabled when changed), "Dieser Name ist schon vergeben." / "Bitte wähle einen anderen Spitznamen.";
  nothing for a guest.
- **Board** — `daily-table.tsx`: the name line ("Auf der Rangliste als … Ändern") and its form are gone.
- **Messages** — `settings_nickname` added; `daily_nick_on`, `daily_nick_change`, `daily_nick_label` removed.
- **Charter** — product (one nickname, set in the settings, shown everywhere; the red line read as the system never
  renaming; no hiding), ui (the settings' first section; the board without a name line), engineering.

## AC results

1. **No rename on the board.** PASS — as the test account, yesterday's board: no name line, no "Ändern".
2. **The nickname in the settings, everywhere.** PASS — the settings show "Kluger Hase"; saved "Flinker Skater";
   yesterday's board, the forum author and the front page's Elo board show "Flinker Skater" (`tmp/ac.mjs`).
3. **Taken or refused.** PASS — "Julien": "Dieser Name ist schon vergeben.", nothing changed; an empty field cannot
   be saved.
4. **Guests.** PASS — the settings have no nickname section.

Mechanical defence and `npm --prefix multiplayer run check` — pass (282 unit tests).

## Deviations

None from `plan.md`.

## Environment

Ports: web 55126, multiplayer 56126, database 57126 (a copy of the live tournament data; the local test account
`nick` with a finished entry on 2026-10-22 and a forum post). No env change.

## Residual

None.

## Check

1. http://localhost:55126/ — open the gear: "Spitzname" first (the review browser has no test account: as a guest
   the section is not there; it shows when signed in).
2. http://localhost:55126/de/taeglich — the board without "Auf der Rangliste als … Ändern".

## Decided for you

- No switch to hide a name on the boards: the default name is two random words, the nickname is the player's choice
  (chess.com and Lichess have none; Duolingo only by leaving its leagues).
- "Spitzname" is the settings' first section, above the deck.
- An account without a name sees an empty field and may set one; otherwise its first finished tournament gives it a
  random one, as before.
- Earlier boards follow the current name (「改一次，整体都改」); SKATGO-90's red line is read as the system never
  changing a player's name.
