# Product

Human-authored. The machine reads this as binding intent and never edits it.
Section shape is fixed by `.intentfold/readme.md`.

> Seeded 2026-09-21 by intentfold cap1. **Not derived from code** — every line below restates what
> the human said when commissioning the course (PARROT-42 in Parrottoon, 2026-09-20) and when
> splitting it out as skatgo.com (2026-09-21); their words are quoted where they carry the intent.
> Anything the human has not said is left as a prompt. Correct whatever misreads you — this is the
> file whose accuracy matters most.

## Contract

**What this product is**

An interactive Skat course at skatgo.com, in German and English. Eleven lessons take a learner from "what is this
deck" to a full game: each lesson teaches with cards the learner can touch, then checks with
exercises that are judged on the spot and explain every wrong answer. Overall progress is visible from
the course map, and the last lesson is a whole game against two computer players. The aim, in the
human's words: 「只要进度走完，就能短时间把skat学会，学到可以和已经会的人打牌的水平」.

A daily Skat tournament at `/daily`: every day the same 12 deals for every player, each played
against two computer players and scored by Seeger-Fabian; one entry per player per day; scores are
the server's, from the cards actually played.

**Who it is for**

Learners from 6 to 99 (the human, 2026-09-21: 「年龄改为6-99岁」; at commissioning it was
「12岁及其以上的包括成人用户」), who want to be able to sit down at a table with people who already play.

Germany is the primary market. German search entry pages and vocabulary take priority; English
remains an independent secondary language (human, 2026-10-04, SKATGO-44: 「主要用户应该是德国的，
英文用户占比百分之一应该」). That percentage is a positioning expectation, not measured traffic.

**What good looks like**

A learner who finishes the progress can play with people who already know the game. On the way, it is
「不枯燥的」 — they keep going rather than drop out.

PostHog measures published-site visits and product events; Search Console measures Google search
exposure. Neither alone proves that learners can play, and delayed search reports are not total traffic.

**What this product is not**

- It speaks German and English. Chinese was removed in SKATGO-28. Public URLs determine page
  language, and learners can switch it themselves. The German homepage is stable for every browser,
  replacing the original browser-selected homepage contract (human-authorized SKATGO-44).
- It is the course and the daily tournament. When it was split from Parrottoon the instruction was
  「只要课程」: none of Parrottoon's English content, and no link back to Parrottoon. The daily
  tournament was added by the human on 2026-10-01 (SKATGO-35).
- <Further deliberate non-goals. The most useful part of this file — it is what stops scope from
  drifting outward one reasonable-sounding ticket at a time.>

## Tools

## Guidance

## Redlines

1. **<What this product must never become>** — forbidden outright. <The removed feature that must not
   come back, the shape it must not take. Keep it detectable: name the route, the file, the
   dependency, so crossing it is visible without judgement.>
2. **Editing this file** — not without the human's explicit approval. Product intent is the human's
   exclusively; the German-market and SEO corrections here were authorized in SKATGO-44.
