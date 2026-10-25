# SKATGO-129 handoff

## What changed

No code. SkatGo's post 4 in production's forum, section Articles, written as SkatGo (the official account):
"SkatGo Saldo: measuring Skat skill deal by deal, defence included". Its text is `article.md` in this folder, posted
through the multiplayer service's `/forum/create`, so the forum translated it to German as it was written.

- The method named **SkatGo Saldo** (one of the two names the human gave): table balance B = 2 × you − left − right in
  Seeger-Fabian; SkatGo Saldo = B in your game − B in the AI's game of the same deal from the same seat.
- Defence at its centre (the human: 「尤其是这段」): Seeger-Fabian gives defenders a fixed 0 or +40, so a plain
  comparison is blind for defence; two real defence deals (Oct 12 +24, Oct 9 −24), one declarer deal (Oct 10 −640).
- The owner's own record only (the account "Wyong"): 131 deals on 13 days, Oct 9–24, both tournament sizes; how to read
  progress per day with its uncertainty; limits.

## Done-state observed

1. **Published, open to everyone, in both languages** — `https://skatgo.com/en/forum/4-skatgo-saldo-measuring-skat-skill-deal-by-deal-defence-inclu`
   and the German address answer without a session; the German page carries the translation ("SkatGo-Saldo",
   "Tischbilanz", "Augen") with its "Automatisch übersetzt" line, numbers intact.
2. **Name, definition, formula, real deals incl. defence, progress per day** — in the text.
3. **Every number recomputed** from production's rows of the owner's account (`tmp/stats.py` over `tmp/owner.json`,
   a copy deleted at close): 131 deals, 79 defended, plain ties 75, SkatGo Saldo ties 54, 21 deals with a plain 0 and a
   non-zero SkatGo Saldo — all defence — mean −109, standard deviation 212, the per-day averages, recent 12 deals −21.5
   against −118 before, twice the uncertainty 129. No other player's data.
4. **In `/sitemap-forum.xml`** — both addresses listed; both pages indexable, with an Article JSON-LD by SkatGo.

## Environment

None.

## Residual

- The profile page (SKATGO-128) does not compute SkatGo Saldo yet in what was handed off; another session is working in
  that worktree.
- Search Console: request indexing for the two addresses (operations.md's search consoles), if wanted.

## Check

1. https://skatgo.com/en/forum/4-skatgo-saldo-measuring-skat-skill-deal-by-deal-defence-inclu — the article as Google
   will read it: the name, the tone, the defence section.
2. https://skatgo.com/de/forum/4-skatgo-saldo-measuring-skat-skill-deal-by-deal-defence-inclu — the German translation.

## Decided for you

- Name: "SkatGo Saldo" (German page: "SkatGo-Saldo"), not "SkatGo score".
- Written in English, the German by the forum's translation, as SkatGo's other articles.
- Written in the first person as the site's owner ("my own games"), so the data is plainly yours.
- Title: "SkatGo Saldo: measuring Skat skill deal by deal, defence included".
