# SKATGO-178 plan

What the code says that the ticket does not:
- The streak exists only on the week's XP board: `streakOf` in `app/src/lib/skat/xp.ts`, `DEAL_DAYS` and the `streak`
  field in `multiplayer/src/xp.ts`, the 🔥 cell in `xp-board.tsx`, `xp_title` and `xp_how_week` in en/de. Header,
  profile and rewards never showed it.
- Every deal row `weeklyXp` reads already carries the player's `declarer` and `won` (`daily_entries.deals[]` and
  `play_deals.mine`), so the win rate needs no new query.
- The product already has one win rate: `recordOf` in `lib/skat/profile.ts` (deals all passed left out; won = the
  game as declarer or the declarer's loss as defender), used on the profile and the home progress card, labelled
  "Win rate" / "Gewinnquote".

Route:
1. `lib/skat/xp.ts`: remove `streakOf`; `XpBoard` rows carry `winRate: number | null` instead of `streak`.
2. `multiplayer/src/xp.ts`: drop `DEAL_DAYS`; select `mine` as a `Played` per deal, keep the week's games per person,
   `winRate` = whole percent of `recordOf(games)`, null when no game had a declarer. Order unchanged (XP).
3. `xp-board.tsx`: the streak cell becomes the win rate ("54%", "–" when null), `slate`, labelled "Win rate" for
   screen readers; comments updated.
4. en/de: `xp_title` "Weekly XP" / "Wochen-XP"; `xp_how_week` explains the win rate instead of the streak.
5. Tests: `xp.test.ts` loses the streak case; `multiplayer/test/xp.test.ts` expects `winRate`.
6. Charter: product.md, engineering.md, ui.md lines on the streak describe the win rate (the human's request).
