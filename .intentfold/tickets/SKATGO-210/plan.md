# SKATGO-210 plan

Found in the code: the front page's League tile takes its title from `home_league` ("League" / "Liga"); the League page
has its own `league_title`. The names on the front page are the XP & win rate board's (`xp-board.tsx`, rows from
`multiplayer/src/xp.ts`): accounts, under the id `player_aliases` counts them as, and personas (`sim:`). League tiers:
`league_players.tier` for accounts (a row once the account opened the League); a persona plays at the tier whose band
(`bandOf`, by weakness) it is in. The League board's badge is `/league/badge/<tier>.webp`, `dims.badge`, `radii.tag`.

Route (the ticket's proposed solution):
1. `home_league`: EN "Ranked match", DE "Ranglistenspiel" (the human's answer). The League page's own title stays.
2. `XpBoard` rows carry `tier`: an account's `league_players.tier` (max over its alias ids), else Bronze; a persona's
   band tier (`personaTier` in league.ts, beside `bandOf`).
3. `xp-board.tsx`: the badge before the name, as the League board puts it, centred on the row.
4. Charter ui.md: the tile's title, the XP board's row.
