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

A daily Skat tournament at `/daily`: every day the same 6 deals for every player (SKATGO-62), each played
against two computer players and scored by Seeger-Fabian; one entry per player per day; scores are
the server's, from the cards actually played. After each deal the player sees how the computer, named "AI", played the same deal
from their seat (SKATGO-42), in a table of both that grows by one row per deal, also on the day's page
and its result. Each row gives both Seeger-Fabian scores with each side's role and the difference; opened,
it tells both deals in full — the contract, won or lost with the card points, Schneider, Schwarz or
overbid, the game value, and how many card points that side took. The newest row opens after each deal
and on the day's page mid-day (SKATGO-48).

Free play at `/play`: one game at a time against the same two computer players, unranked, free and
without an account (SKATGO-40, SKATGO-50).

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
