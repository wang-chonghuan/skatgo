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
human's words: 「只要进度走完，就能短时间把skat学会，学到可以和已经会的人打牌的水平」.

A daily Skat tournament at `/daily`, in two lengths (SKATGO-77): every day the same 6 deals for every
player (SKATGO-62), shown first, and separately the same 12 deals for every player; each deal played
against two computer players, Lina and Noah, and scored by Seeger-Fabian; one entry per player per
tournament per day; scores are the server's, from the cards actually played. A player who sees too many
deals ahead does not start, so the short one leads (the human, 2026-10-10: 「用户看到太多，就不想打了」).
A seat's own score says nothing about how it did against the table, so results are read by **Saldo**:
(the seat − Lina) + (the seat − Noah), per deal and per tournament (SKATGO-79, the human: 「我的分数减去
我的两个对手的分数」). Each tournament has a leaderboard, ranked by the tournament's Saldo; every entry,
those from before SKATGO-79 included, stands by its own Saldo.

After each deal the player sees how the computer, named "AI", played the same deal from their seat
(SKATGO-42): a score sheet of all three seats' scores, the player's deal over the AI's, each with its
Saldo and a line saying what the deal was — declarer, game and bid, won or lost with the card points,
Schneider, Schwarz or overbid; then the tournament so far in one line; then the deal's play record
("Spielverlauf", SKATGO-79). The play record is open, never folded: trick by trick, who played which card
in order and who took it with how many card points, and under every trick the player's hand before it.
Wherever SkatZero would have played another card in the player's seat, that card stands under the
player's; the trick where the player's card fell furthest below SkatZero's choice is marked and summed
up in one line on top — ranked, with no threshold (the human: 「通过10墩排序的方式，选出最差的」). It is the
engine's record and SkatZero's choices only: no language model explains it (the human, 2026-10-11:
「解读太麻烦了」). A deal all players passed has no play record. The tournament's page keeps a row per
finished deal with the player's and the AI's Saldo, opening to that deal's score sheet and play
record, and under the rows the score sheet of the whole tournament so far; the newest row opens after
each deal and on the tournament's page mid-day (SKATGO-48). The page lists all of the chosen
tournament's deals from the start (SKATGO-63): the finished ones in that comparison, the rest by number
as in progress or not yet played, never with their cards.

Free play at `/play`: one game at a time against the same two computer players, unranked, free and
without an account (SKATGO-40, SKATGO-50). A finished game shows its result, the way to the next game,
and the same play record. Changing the language mid-game keeps the game (SKATGO-79); a reload starts
a new one.

A rules reference: the whole rules at `/rules`, with anchors for what people look up by name (Grand,
Null ouvert, Ramsch); the bidding table; and two printables, a score sheet and a short version of the
rules, each also as a PDF (SKATGO-29, SKATGO-50, SKATGO-53). Every number in them is the rules
engine's.

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
- It is the course, free play, the daily tournament and the rules reference — nothing from
  Parrottoon, from which it was split on 2026-09-21: none of Parrottoon's English content, and no link
  back to it.

## Tools

## Guidance

## Redlines

1. **Editing this file** — not without the human's explicit approval. Product intent is the human's
   exclusively.
