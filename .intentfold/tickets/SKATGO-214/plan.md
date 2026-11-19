# SKATGO-214 plan

Found in the code: the rule is one constant, `SAVE_AT` in `app/src/lib/skat/league.ts`, read by `dealOutcome`; the
multiplayer service scores every League deal with that shared function (`multiplayer/src/league.ts` imports it), so the
service applies the change and must be released first. The words: `league_about_deal` (the League page's rules, EN/DE)
names 31; `league_deal_saved` (the result line for a saved defence) says "Schneider avoided", which is no longer true at
40. The forum article "declare or defend" (production `forum_posts` 7, SKATGO-210) states the rule and its numbers.

Route:
1. `SAVE_AT` 31 → 40, its comments; the unit test at 31/39 (−1) and 40 (0).
2. Words: the rules line's 31 → 40; the saved line "The declarer made it – 80 card points at most" / "Der Alleinspieler
   hat gewonnen – höchstens 80 Augen".
3. Charter `product.md` (the rule) and `ui.md` (the result line).
4. The article: recomputed on the same 352 deals at 40 (`tmp/article-declare-or-defend-v3.md`); its body replaced in
   production right after the release, the current body backed up first.
5. Release: multiplayer, then web; then the article.
