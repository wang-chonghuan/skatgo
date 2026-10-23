# SKATGO-126 plan

## What the code already says

- A player's current name is `daily_players.nickname` (random two German words at the first finish, unique, checked
  by `cleanNickname`). The forum's authors and the Elo board already show it.
- The daily boards show the name written into each entry when it finished (`daily_entries.nickname`); the board's first
  line, "Auf der Rangliste als … Ändern", changes the name for today's entries and from then on (`dailyName`, SKATGO-90,
  SKATGO-97), and only after a finished tournament.
- The settings dialog (`frame.tsx`, the gear in the header) holds the deck, the card back, tricks, sounds, language.
- Playing the tournament needs an account since SKATGO-123.

## Route

1. **Service** — `dailyName` no longer asks for a finished tournament and no longer rewrites today's entries; a new
   read, `dailyNick`, answers the account's current name (or none). `dailyBoard` shows each entry under its player's
   current name (the stored one only when the player has none), so a change shows on every day's board at once.
2. **Web** — `/api/daily/nick` (read) and `/api/daily/name` for accounts only (401 otherwise).
3. **Settings** — for a signed-in account, a first section "Spitzname": the current name in a text field, "Speichern",
   the same refusals as before (taken, refused), a quiet "Gespeichert" once saved. Nothing for a guest.
4. **Board** — the name line and its "Ändern" are gone.
5. **Charter** — product (names: one nickname, set in the settings, shown everywhere), ui (settings, board), engineering
   (the daily contract's naming lines).
