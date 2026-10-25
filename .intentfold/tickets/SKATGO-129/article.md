**SkatGo Saldo** measures how well you played one deal of Skat. You and an AI play the same cards from the same seat. For each of the two games, take your Seeger-Fabian score minus each opponent's score; the SkatGo Saldo is your number minus the AI's. Above zero, you played the deal better than the AI; below zero, worse. Unlike your own score, it also counts how well you defended.

This article explains why we built it, gives the formula with real deals, and shows how to read progress from it without fooling yourself. All examples are from my own games on SkatGo, not from other players.

## Why your score does not measure your skill

In a single game of Skat the cards decide more than the player. Clubs and tournaments deal with that by playing many games. A second way is the duplicate principle from bridge: compare players on the same cards. SkatGo's daily tournament does exactly that. Every deal you play is also played by the AI, SkatZero, from your seat, against the same two opponents, Lina and Noah.

The obvious comparison is your score minus the AI's score on the same deal. It works when you declare. It goes blind when you defend.

## The defence problem

Seeger-Fabian scores the declarer: a won game counts its value plus 50, a lost game minus twice its value minus 50. When the declarer loses, each defender also gets 40. A defender's score is therefore fixed: 0 when the declarer wins, +40 when the declarer loses. Nothing in it says how well you defended.

Hold the declarer to 61 card points or let the declarer make Schneider: as a defender you score 0 either way. Push a lost game further down: still +40. In my 131 deals I defended 79. For most of a session, the plain comparison with the AI cannot see what I did.

The fix is to look at the whole table, not only at your own score. What a good defence saves shows up in the declarer's score, so the declarer's score has to be part of the measure.

## The formula

All scores are Seeger-Fabian scores of one deal, from your seat.

**Table balance** of a game:
B = (you − left opponent) + (you − right opponent) = 2 × you − left − right

**SkatGo Saldo** of a deal:
SkatGo Saldo = B in your game − B in the AI's game of the same deal

What B comes to, for a game of value v:

- You declare and win: B = 2 × (v + 50)
- You declare and lose: B = 2 × (−2v − 50) − 80
- You defend and the declarer wins: B = −(v + 50)
- You defend and the declarer loses: B = 2v + 90
- Everyone passes: B = 0

As a defender, your table balance now moves with the declarer's result: every card point you take from the declarer, every Schneider you prevent, every game you help to lose by more.

## Example 1: a defence the plain score cannot see

October 12, 2026. Noah plays a Grand after a bid of 24, in my game and in the AI's game, and wins both times. Both times the defenders score 0, so the plain difference to the AI is 0.

But in my game we held Noah to 76 card points: a Grand worth 96, scored 146. In the AI's game Noah took 99 card points: Schneider, a Grand worth 120, scored 170.

- My table balance: −146
- The AI's table balance: −170
- SkatGo Saldo: +24

The same happens the other way. On October 9 Lina made Schneider with a Grand in my game (105 card points, scored 170), while the AI's defence held her to 89 (scored 146). SkatGo Saldo: −24.

Of my 131 deals, 21 were like these: a plain difference of exactly 0, and a SkatGo Saldo that is not. All 21 were defence.

The chart shows only the deals where both I and the AI defended, averaged per day. The plain difference stays on the zero line almost every day; it cannot tell a good defence from a bad one. The SkatGo Saldo moves: on October 13 my defence cost 91 per deal against the AI's.

![Defence only, average per deal per day: the plain difference stays near 0, the SkatGo Saldo shows how the defence went](skatgo-saldo-defence.svg)

## Example 2: a declarer's game

October 10, 2026. I and the AI both play Clubs after a bid of 44, a game worth 60. I took 45 card points and lost: −170 for me, +40 for each opponent. The AI took 84 and won: +110.

- Plain difference: −170 − 110 = −280
- My table balance: 2 × (−170) − 40 − 40 = −420
- The AI's table balance: 2 × 110 = 220
- SkatGo Saldo: −640

As declarer the SkatGo Saldo is about twice the plain difference, because what you lose, the opponents gain. That is intended: the declarer's game is the largest swing at the table.

## My own record

October 9 to 24, 2026: 131 deals on 13 days in SkatGo's daily tournament.

- Plain difference to the AI: 75 of 131 deals exactly 0 (57%).
- SkatGo Saldo: 54 of 131 deals exactly 0 (41%). The rest carry information.

Day by day, the SkatGo Saldo sees at least as many deals as the plain difference, and on 11 of the 13 days more. On October 9 the plain difference saw nothing at all (0 of 6 deals), the SkatGo Saldo 4 of 6.

![Share of deals per day whose comparison with the AI is not 0: the SkatGo Saldo line lies on or above the plain difference every day](skatgo-saldo-information.svg)
- Average SkatGo Saldo: −109 per deal. The AI plays these deals clearly better than I do.
- Spread of a single deal: a standard deviation of 212.

Average SkatGo Saldo per deal, by day:

- Oct 9: −13 (6 deals)
- Oct 10: −204 (6 deals)
- Oct 11: −147 (10 deals)
- Oct 12: −126 (18 deals)
- Oct 13: −35 (18 deals)
- Oct 14: −130 (18 deals)
- Oct 15: −122 (18 deals)
- Oct 16: −163 (12 deals)
- Oct 17: −102 (6 deals)
- Oct 18: −24 (1 deal)
- Oct 19: −208 (6 deals)
- Oct 23: −52 (6 deals)
- Oct 24: +9 (6 deals)

## How to read progress without fooling yourself

One deal tells you almost nothing: with a spread of 212, a single good or bad deal is mostly noise. So read the SkatGo Saldo as an average per deal over a day, and compare days.

An average of n deals is uncertain by about 212 divided by the square root of n: about ±87 for a day of 6 deals, about ±50 for 18. Count it as progress only when the recent average beats the earlier one by more than twice that uncertainty. Anything less is "about the same".

My last two days, October 23 and 24, averaged −21.5 per deal over 12 deals. The 119 deals before averaged −118. That is 96.5 better, but twice the uncertainty is 129: promising, not yet proven. A few more days at that level would settle it.

## What SkatGo Saldo does not do

- Once the play differs, the opponents react to different cards. The two games share the deal, not every situation in it.
- The AI is a strong benchmark, not a perfect one. A positive SkatGo Saldo means you played this deal better than this AI, nothing more.
- Bidding counts. If you pass a hand the AI plays and wins, your table balance is lower, and so it should be.
- It judges deals, not players over time. For a ranking of players, SkatGo uses an Elo number from the daily tournament's results.

## In short

- Table balance: your Seeger-Fabian score minus each opponent's, B = 2 × you − left − right.
- SkatGo Saldo: your table balance minus the AI's on the same deal from the same seat.
- It sees defence, which the declarer-centred Seeger-Fabian score of a defender cannot.
- Read it as an average per deal per day, and call it progress only beyond twice its uncertainty.

You can play the same deals as the AI every day in the [daily Skat tournament](https://skatgo.com/en/daily).
