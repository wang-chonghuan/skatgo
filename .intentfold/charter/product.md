# Product

Human-authored. The machine reads this as binding intent and edits it only with the human's explicit
approval (Redlines). Section shape is fixed by `.intentfold/readme.md`. The human's words are quoted
where they carry the intent.

## Contract

**What this product is**

An interactive Skat course at skatgo.com, in German and English. Eleven lessons take a learner from "what is this
deck" to a full game: each lesson teaches with cards the learner can touch, then checks with
exercises that are judged on the spot and explain every wrong answer. Overall progress is visible from
the course map, and the last lesson is a whole game against two computer players. The aim, in the
human's words: 「只要进度走完，就能短时间把skat学会，学到可以和已经会的人打牌的水平」. For whoever
wants to play first, "Skat in 5 Minuten" under the course (SKATGO-89) is the twelve rules the human told
his son, after which he could play on SkatGo (「他听完就会在skatgo上打牌了」) — kept as the human said
them, translated and nothing added — then the way to the table.

A daily Skat tournament at `/daily`, in two lengths (SKATGO-77): every day the same 6 deals for every
player (SKATGO-62), shown first, and separately the same 12 deals for every player; each deal played
against two computer players, Lina and Noah, and scored by Seeger-Fabian; one entry per player per
tournament per day; scores are the server's, from the cards actually played. A player who sees too many
deals ahead does not start, so the short one leads (the human, 2026-10-10: 「用户看到太多，就不想打了」).
Results are ranked and compared by the player's own Seeger-Fabian total, the standard German players
know from their clubs and tournaments (SKATGO-81, the human: 「按他们习惯的标准来」). Each tournament has a
leaderboard per day, which can be looked at for seven days, today's included (SKATGO-80, the human:
「要保留显示最近7天的」), ranked by that total; every entry stands by its own. A finished entry stands on
its board at once, with nothing to fill in (SKATGO-90, the human: 「让用户填名字，太麻烦了」), under the player's
name: the one they set before, or a name of two friendly German words given at random — never the
email address, never words of cards, a number only when every name without one is taken; the same
device, or the same account, keeps its name. A player may change it, for today's entries and from now
on, to a name no other player holds. A name already on a board is never changed (the human's red line:
「禁止改变任何已经有的用户的名字……这是绝对红线」). The AI stands on it too, for
everyone, today's board included: its total over the tournament from the player's seat, among the
players', after any player with the same, taking no rank — its total only, never a deal (SKATGO-80, the
human: 「都显示，只在leader board上显示总成绩即可」). There is no other measure beside it (SKATGO-81, the human:
「saldo都移除吧」).

After each deal the player sees how the computer, named "AI", played the same deal from their seat
(SKATGO-42): a score sheet of all three seats' scores, the player's deal over the AI's, each with a
line saying what the deal was — declarer, game and bid, won or lost with the card points,
Schneider, Schwarz or overbid; then the tournament so far in one line; then the deal's play record
("Spielverlauf", SKATGO-79). The play record is open, never folded: trick by trick, who played which card
in order and who took it with how many card points, and, for the trick the player taps, their hand before it
(SKATGO-100).
Wherever SkatZero would have played another card in the player's seat, that card stands under the
player's; the trick where the player's card fell furthest below SkatZero's choice is marked and summed
up in one line on top — ranked, with no threshold (the human: 「通过10墩排序的方式，选出最差的」). It is the
engine's record and SkatZero's choices only: no language model explains it (the human, 2026-10-11:
「解读太麻烦了」). A deal all players passed has no play record. The tournament's page keeps a row per
finished deal with the player's and the AI's score, opening to that deal's score sheet and play
record, and under the rows the score sheet of the whole tournament so far; the newest row opens after
each deal and on the tournament's page mid-day (SKATGO-48). The page lists all of the chosen
tournament's deals from the start (SKATGO-63): the finished ones in that comparison, the rest by number
as in progress or not yet played, never with their cards.

Free play at `/play`: a round of six deals against the same two computer players, the deal going round
as at a real table, so the player sits in each position twice (SKATGO-88: 「自由对局也要换发牌人……默认6
deals」); unranked, free and without an account (SKATGO-40, SKATGO-50). The table shows which deal of
six it is and the player's Seeger-Fabian total so far. A finished deal shows a score sheet in
Seeger-Fabian — the player's deal over the AI's, the same deal played by the computer from the player's
seat (SKATGO-86: 「打完了能显示AI打这幅牌叫的啥，打几分」) — then the way to the next deal and the same
play record; after the sixth, the round in one row per deal and its score sheet, as at the end of a
tournament, and a new round. Lesson 11's game is one game with the same result. Changing the language
mid-round keeps the game and the round (SKATGO-79, SKATGO-88), and so does a reload or coming back within a
day (SKATGO-96: 「刷新一下页面，当deal丢了，连game也丢了」). The player may give up a round for a new one,
never one deal alone, so a round's total stays honest; the tournament cannot be given up.

A rules reference: the whole rules at `/rules`, with anchors for what people look up by name (Grand,
Null ouvert, Ramsch); the bidding table; and two printables, a score sheet and a short version of the
rules, each also as a PDF (SKATGO-29, SKATGO-50, SKATGO-53). Every number in them is the rules
engine's.

Skat-Tricks at `/skat-tricks` (SKATGO-82, SKATGO-103): practice and strategy articles for players past the
basics. The section's own page is its exercises: twelve kinds — bidding, putting away, choosing the game,
leading and smearing as a defender, counting, "can I still lose?", open endgames, cracking a Null ouvert,
how safe a Null is, probabilities, the declarer's first lead — as cards that open to three exercises each,
36 in all, chosen by hand, not generated. An exercise is answered once: then its page shows whether it was
right, the right answer and why. No sign-in, nothing saved. Every answer is the
rules engine's or an exact solver's, or SkatZero's choice clearly ahead of the next; positions may draw on
Skat books (the human, SKATGO-103: 「可以参考书上的」). The list of exercises is a search entry in both
languages, a single exercise is not (the human: 「单页不收录，但是题目页要收录」). The articles are in plain
words — the human: 「文章要写得深入浅出，让用户能看懂，别故作高深」 — the first, twelve tricks for bidding,
playing alone and defending, written for the search "Skat Tricks", at `/skat-tricks/12-tricks`, each trick
linking to the exercises that practise it; later articles get their own addresses under the section, each
for its own search term. The articles are for search engines (the human, SKATGO-105: 「只用于seo」): the
site's ways in — the front page's tile, the course, the header — lead to the exercises, and an article is
reached only by a small link under them. Every article leads to the daily tournament, where each trick can be tried and
compared with the AI. The articles' text is SkatGo's own: no book's passages, examples or order are copied,
and the articles recommend no books. After every deal, the play record links to the exercises.

**Who it is for**

Learners from 6 to 99 (the human, 2026-09-21: 「年龄改为6-99岁」), who want to be able to sit down at a
table with people who already play.

Germany is the primary market. German search entry pages and vocabulary take priority; English
remains an independent secondary language (human, 2026-10-04, SKATGO-44: 「主要用户应该是德国的，
英文用户占比百分之一应该」). That percentage is a positioning expectation, not measured traffic.

**What good looks like**

A learner who finishes the progress can play with people who already know the game. On the way, it is
「不枯燥的」 — they keep going rather than drop out.

PostHog measures published-site visits and product events; Search Console measures Google search
exposure. Neither alone proves that learners can play, and delayed search reports are not total traffic.

**What this product is not**

- It speaks German and English only. Public URLs determine page language, and learners can switch it
  themselves. The German homepage is the same for every browser (SKATGO-44).
- It is the course, free play, the daily tournament, private tables with friends, the Skat-Tricks and
  the rules reference — nothing from
  Parrottoon, from which it was split on 2026-09-21: none of Parrottoon's English content, and no link
  back to it.

## Tools

## Guidance

## Redlines

1. **Editing this file** — not without the human's explicit approval. Product intent is the human's
   exclusively.
