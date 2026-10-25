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

A daily Skat tournament at `/daily`: every day the same 6 deals for every player (SKATGO-62), each deal
played against two computer players, Lina and Noah, and scored by Seeger-Fabian; one entry per player per
day; scores are the server's, from the cards actually played. Playing it needs a free account (SKATGO-123,
the human: 「要求参加锦标赛必须登录」); its page and boards are open to everyone. A player who sees too many deals ahead does
not start (the human, 2026-10-10: 「用户看到太多，就不想打了」). The second, twelve-deal tournament of SKATGO-77
is gone (SKATGO-119, the human: 「取消每日锦标赛12幅牌的，只保留6幅牌。数据库可以先不删」): nothing shows or
serves it, and its stored deals and entries stay in the database.
Results are ranked and compared by the player's own Seeger-Fabian total, the standard German players
know from their clubs and tournaments (SKATGO-81, the human: 「按他们习惯的标准来」). The tournament has a
leaderboard per day, which can be looked at for seven days, today's included (SKATGO-80, the human:
「要保留显示最近7天的」), ranked by that total; every entry stands by its own. A finished entry stands on
its board at once, with nothing to fill in (SKATGO-90, the human: 「让用户填名字，太麻烦了」), under the player's
name: the one they set before, or a name of two friendly German words given at random — never the
email address, never words of cards, a number only when every name without one is taken; the same
device, or the same account, keeps its name. An account sets its nickname in the settings, to a name no other
player holds, and it shows everywhere at once — on every day's board, earlier days' included, the Elo board and the
forum (SKATGO-126, the human: 「允许用户给自己搞个昵称，从设置里可以搞，然后排行榜就用这个昵称，改一次，整体都改」); the board
itself offers no renaming (「禁止改名了」). The system never changes a player's name (the human's red line:
「禁止改变任何已经有的用户的名字……这是绝对红线」). A name cannot be hidden from the boards: the name is the
player's own choice, the default one says nothing about who plays (SKATGO-126). The AI stands on it too, for
everyone, today's board included: its total over the tournament from the player's seat, among the
players', after any player with the same, taking no rank — its total only, never a deal (SKATGO-80, the
human: 「都显示，只在leader board上显示总成绩即可」). There is no other measure on the daily board (SKATGO-81, the
human: 「saldo都移除吧」).

Beside the daily boards stands the tournament's Elo, one number per player (SKATGO-123, the human: 「既专业，
又简单，别人容易理解，还能从给我的系统里产生出来的elo排名……别人看了，觉得不离谱，觉得能理解，还想通过我的系统来参与」),
made as chess makes it so anyone can follow and check it: each ended tournament day is one game against
everyone else who played it and against the AI, won by the higher Seeger-Fabian total of the day, an equal one
drawn; the expectation is FIDE's formula against each opponent, averaged; the number moves by K × (score −
expectation), K 40 for a player's first 30 days and 20 after; everyone starts at 1500 and the AI stands fixed at
1700, the scale's anchor (players' day totals beat its total about a quarter of the time). A number is
provisional under five days; staying away costs nothing. A day counts once it is over, its field complete. One
person under several ids — guest days on other devices, a guest who signed up later — counts as one, as the
human names them (「ju开头那几个人，算一个人……mark也是同一个人」, 「alice跟olena是一个人」). The front page shows the ten highest with the AI's
number among them, and how it is counted.

After each deal the player sees how the computer, named "AI", played the same deal from their seat
(SKATGO-42): a score sheet of all three seats' scores, the player's deal over the AI's, each with a
line saying what the deal was — declarer, game and bid, won or lost with the card points,
Schneider, Schwarz or overbid; the deal's whole calculation in one line, base value, multiplier and score
(SKATGO-127, a player's suggestion); then the tournament so far in one line; then the deal's play record
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
each deal and on the tournament's page mid-day (SKATGO-48). The page lists all of the
tournament's deals from the start (SKATGO-63): the finished ones in that comparison, the rest by number
as in progress or not yet played, never with their cards.

Free play at `/play`: a round of six deals against the same two computer players, the deal going round
as at a real table, so the player sits in each position twice (SKATGO-88: 「自由对局也要换发牌人……默认6
deals」); unranked, free and without an account (SKATGO-40, SKATGO-50). Its table is the tournament's: no hint of any kind
(SKATGO-130, the human: 「砍掉自由牌局时的提示，和锦标赛应该一模一样」); lesson 11's game keeps its hints (「11课的保留」). There is no
AI assistant on the site any more (SKATGO-130: 「先开单子砍ai助手」, 「彻底删」). The table shows which deal of
six it is and the player's Seeger-Fabian total so far. A finished deal shows a score sheet in
Seeger-Fabian — the player's deal over the AI's, the same deal played by the computer from the player's
seat (SKATGO-86: 「打完了能显示AI打这幅牌叫的啥，打几分」) — then the way to the next deal and the same
play record; after the sixth, the round in one row per deal and its score sheet, as at the end of a
tournament, and a new round. Lesson 11's game is one game with the same result. Changing the language
mid-round keeps the game and the round (SKATGO-79, SKATGO-88), and so does a reload or coming back within a
day (SKATGO-96: 「刷新一下页面，当deal丢了，连game也丢了」). The player may give up a round for a new one,
never one deal alone, so a round's total stays honest; the tournament cannot be given up.

A signed-in player's record of play at `/profile` (SKATGO-128, the human: 「每个用户的打牌档案页面，每天打了几副牌，就按deal算，
而且每个deal都要算和ai的差值，做成一个曲线」): every deal they played against the AI on the same cards — the daily tournament's,
from its first day, the twelve-deal tournament's kept rows included (「他的全档案必须建立好」), and free play's (lesson 11's game included), recorded from SKATGO-128 on for a signed-in player
when the deal's comparison is worked out — counted per day. A deal is judged against the whole table and against the AI (the human: 「每个deal的差值=用户-lina+
用户-noah……然后比较用户的差值和ai的差值，算这个差值的差」): the player's Seeger-Fabian score minus each opponent's, less the
same for the AI's game of the same cards from the same seat, so defence counts too. The curve is one point a day, the
day's average per deal, so whether the player gets better shows from the first days, not after a fixed number of
deals (「30副不行」); the last day stands against the days before, better or worse only beyond the noise of single
deals, also under a finished tournament, as the reason to come back (「我主要想让这个做为一个留存点」). A week can have its
analysis on the same page (「本周ai分析加上到档案页，每周一个」): only what mattered that week, as many points as there were,
and a conclusion (「不一定是四条吧，为啥这么死板」). While players are few it is written by hand from the week's deals, for whom
the human names (「挑重点，目前用户少，可以手动做……就做我和mark的」), in English and German; a week without one shows none. It is the player's own: no one else sees it, and a guest is asked to sign in.
The ids one person plays under count as one, as on the Elo board. Free play stays free and needs no account; only
an account's deals are recorded. A first version, to be refined with the human (「我看到后，开始和你讨论如何优化和细化」).

Private tables at `/with-friends` (SKATGO-61): a host opens a table and sends its link; up to two
friends sit down with a name, and the AI takes an empty seat. Opening a table takes an account,
joining one does not (SKATGO-117, the human: 「我现在想把 private table的改为必须注册用户才能玩」, then,
after comparing other products, 「可以吧」 to the host signing in and the invited playing as guests). A
guest who signs up while sitting at someone's table is recorded once as brought by its host, so it
shows who brings players in; nothing else is recorded about it, and it needs no consent banner.

A rules reference: the whole rules at `/rules`, with anchors for what people look up by name (Grand,
Null ouvert, Ramsch); the bidding table; and two printables, a score sheet and a short version of the
rules, each also as a PDF (SKATGO-29, SKATGO-50, SKATGO-53). Every number in them is the rules
engine's.

Skat-Tricks at `/skat-tricks` (SKATGO-82, SKATGO-103): practice and strategy articles for players past the
basics. The section's own page is its exercises. First come twenty open-card endgames (SKATGO-110, the
human: 「把tricks卡片的内容，彻底改成明牌残局练习」): positions from real deals with three to five tricks to go, every hand
open, where with both sides at their best exactly one of the learner's cards wins, as declarer or as a
defender. They climb in order as numbered levels (SKATGO-111, the human: 「像那种两步杀，消消乐那种……简洁，
直接，内聚」). A puzzle is played on the game's own table, the learner's side's card points against what that
side needs — 61 as declarer, 60 as the defenders (SKATGO-115) — and the others answer each card with their
best. A wrong card is not marked: the learner plays on until the game is decided and is told then, with the
mistake and the card that would have won (SKATGO-111, the human: 「打完后告诉它错了，记下来，但是可以重试」);
any puzzle can be played again. The first two are free; from the third the learner signs in (SKATGO-109,
the human: 「前2题不登录可以做，第三题必须登录才可以做」), and every answer is recorded — a guest's in this
browser, an account's on the server — so the levels show which were solved and which went wrong, and how
often. Under them come the kinds SKATGO-110 had hidden, shown again since SKATGO-119 (the human:
「恢复以前删掉的那些专题练习题」): the "Sieg sichern" ladder of closed-card endgames and twelve kinds of three
exercises each, each kind a card opening to its exercises; they need no account and record nothing. Every answer is an exact solver's or the rules engine's; positions may draw on Skat books (the
human, SKATGO-103: 「可以参考书上的」). The list of exercises is a search entry in both languages, a single
exercise is not (the human: 「单页不收录，但是题目页要收录」). The articles are in plain
words — the human: 「文章要写得深入浅出，让用户能看懂，别故作高深」 — and are SkatGo's posts in the forum's
Articles, nowhere else on the site (SKATGO-120, the human: 「移除这个文章在app里的所有其他引用的，就放论坛里」). The
first, twelve tricks for bidding, playing alone and defending, written for the search "Skat Tricks", is one
post, in English, read in German as its translation (SKATGO-124, the human: 「12 个 Skat 技巧会出现两次。保留英文版」;
the German post deleted, SKATGO-125: 「你彻底删掉」), each trick linking to the exercises that practise it; its old address,
`/skat-tricks/12-tricks`, and the German post's lead to it. SkatGo's announcement is in English too, its German the
translation, made ahead (「公告也保留英文版，德语用翻译的，但是提前做好」). A later article is another post,
for its own search term. The articles are for search engines (the human, SKATGO-105: 「只用于seo」): the
site's ways in — the front page's tile, the course, the header — lead to the exercises. Every article leads to the daily tournament, where each trick can be tried and
compared with the AI. The articles' text is SkatGo's own: no book's passages, examples or order are copied,
and the articles recommend no books. After every deal, the play record links to the exercises.

A forum at `/forum` (SKATGO-118), in the product's own code: the human wanted
「官方发公告，官方发一些技术的文章，用户可以评论，用户也可以发文章……就做一个简单版本的。以后既能用来seo又有个公告和用户交流，放文章的地方」.
Four sections: announcements, which only SkatGo writes; articles, by SkatGo or a player; discussion; and feedback.
The list shows them together, newest activity first, the latest announcement of the last two weeks on top, and
can be narrowed to one. Under every post, comments in the order written, flat — no reply to a comment; whom one
means is "@Name" in the text (the human: 「评论不要搞嵌套，太麻烦，用户自己 @ 一个人就行，也不用通知」). Nothing in the forum
notifies anyone. Anyone reads; writing takes an account, and a player writes under their leaderboard name, never
an email address; SkatGo writes as SkatGo. SkatGo's posts are for search engines; a player's post only once SkatGo
marks it, and feedback never. The latest announcement also stands as one line on the front page and on `/daily`
for two weeks. The least moderation the law asks of a host: anyone signed in may report a post or comment,
SkatGo hides with a reason its author sees, an author may delete their own, and each account writes only so much
a day. It is one forum for both languages (the human, in review: 「德语和英语论坛不要分开」): its own words follow the
site's language, and a post or comment is in whatever language its author writes (「别人想发什么语言就发什么语言」);
and each reader sees it in the language they read the site in: machine-translated by the site's model, once per text
and language and kept, saying so in a small line with the text as written one tap away (SKATGO-124, the human:
「不管用户发啥语言的帖子，看到的都是他ui上的语言的翻译版。用便宜的翻译功能实现」, 「用户可以点击查看原文，有个非常小的链接式的
小按钮」); a text already in the reader's language, or saying it in both, stands as written. The Skat-Tricks' articles
are SkatGo's posts in its articles section (SKATGO-120). Not in it, by the
human's agreement (「都同意」): notifications, nested replies, pictures in players' posts (SkatGo's own posts may show the site's own pictures, one per
language — SKATGO-129, the human: 「给论坛增加加图片的功能」), search, profiles, likes, blocking (with the
apps later) and competitions (later, in the product itself).

**Who it is for**

Learners from 6 to 99 (the human, 2026-09-21: 「年龄改为6-99岁」), who want to be able to sit down at a
table with people who already play.

English-speaking Skat players come first: people who already play Skat but have nobody to play
with — the ISPA circle in North America, the UK, German families abroad (human, 2026-10-18,
SKATGO-114: 「去服务那些有需求却一直没被满足的人」). Next come English speakers who want to learn Skat;
Germany remains the large long-term market. The first market counts as proven when, of the people who
come from the English Skat community, 30% come back to play on 3 different days within two weeks; if
that does not happen, this positioning is to be reconsidered.

**What good looks like**

A learner who finishes the progress can play with people who already know the game. On the way, it is
「不枯燥的」 — they keep going rather than drop out.

PostHog measures published-site visits and product events; Search Console measures Google search
exposure. Neither alone proves that learners can play, and delayed search reports are not total traffic.

**What this product is not**

- It speaks German and English only. Public URLs determine page language, and learners can switch it
  themselves. The homepage `skatgo.com/` follows the visitor's language: a German browser, or a request
  that names no language, gets the German homepage; any other language goes to `/en`; a language the
  visitor picked in the header wins (SKATGO-113).
- It is the course, free play, the daily tournament, private tables with friends, the Skat-Tricks, the
  rules reference and the forum — nothing from
  Parrottoon, from which it was split on 2026-09-21: none of Parrottoon's English content, and no link
  back to it.

## Tools

## Guidance

## Redlines

1. **Editing this file** — not without the human's explicit approval. Product intent is the human's
   exclusively.
