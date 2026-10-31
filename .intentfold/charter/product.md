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

The deal of the day (SKATGO-131, the human: 「每日一副就是一副，每日6副就是6副。否则玩家有残缺感」): every day one deal,
the same for everyone, played once and done — a competition of its own beside the six deals, with its own board ranked
by its Seeger-Fabian score and the AI's row on it, never in the Elo. A guest may play it (the human: 游客能打); only the
six deals need an account. It is chosen, not just dealt (「每日一副要挑选那种好玩的，刺激的，最好不要让玩家一直被压着打的」): of
fresh random deals, only one where the AI in the player's seat declared and won with 61–89 card points, won a Null, won
Schneider or better, or defended and brought the declarer down — never the same kind two days running, the contract
rotating (「不要每天选一样的」). It is the front page's main way in; once played, the page says it is done and asks the player
to share it so friends try the same cards — no scores, no place (「我不懂你显示这些垃圾干什么」, 「1 played today · you're #1
这个不要显示」) — with the ways to share it, and the card it goes out with under them that tells nothing of the cards: to WhatsApp,
Facebook, Telegram and X by their own share addresses, through the phone's share sheet, or the link copied — no
Instagram and no picture to download (SKATGO-132, the human: 「至少这五个平台」, then 「picture不要了，不分享instagram」). What goes out is a card on white — the day, the score,
the table's three Seeger-Fabian scores with the declarer badged, the challenge to play the same cards; no AI, no place,
no card, contract or name (「分享出去要有精美的卡片」, 「就显示三家的fabian分数，不要显示ai的」, 「不要显示排名」) — and a link to the shared result, read from
a code so no one can make it say what was not played; whoever opens it plays the same deal: on its day as the day's
deal, after it as practice on no board (「点击就能也打这一副牌」, 「过期的牌开放练习」).

Beside the daily boards stands the tournament's Elo, one number per player (SKATGO-123, the human: 「既专业，
又简单，别人容易理解，还能从给我的系统里产生出来的elo排名……别人看了，觉得不离谱，觉得能理解，还想通过我的系统来参与」),
made as chess makes it so anyone can follow and check it: each ended tournament day is one game against
everyone else who played it and against the AI — the six deals' and, for the days it was played, SKATGO-77's twelve's,
each its own game (SKATGO-140, the human: 「要算，5天」) — won by the higher Seeger-Fabian total of the day, an equal one
drawn; the expectation is FIDE's formula against each opponent, averaged; the number moves by K × (score −
expectation), K 40 for a player's first 30 days and 20 after; everyone starts at 1500 and the AI stands fixed at
1700, the scale's anchor (players' day totals beat its total about a quarter of the time). A number is
provisional under five games; staying away costs nothing. A day counts once it is over, its field complete. One
person under several ids — guest days on other devices, a guest who signed up later — counts as one, as the
human names them (「ju开头那几个人，算一个人……mark也是同一个人」, 「alice跟olena是一个人」). The front page shows the ten highest with the AI's
number among them, and how it is counted.

After each deal the player sees the deal's result and how the computer, named "AI", played the same deal from their
seat (SKATGO-42) — the most important first, each fact once (SKATGO-166, the human: 「以常玩的用户的视角，重要的在前面。信息不重复。
不要用超过4种层级的字体。一个信息只出现在一个地方……红框和绿框里的东西不要塞太多」; before it SKATGO-127/145/146/148). First, in a box green
when the player's side won and pink when it lost, only who won or lost which game ("Lina won Spades") and, in one line,
why: the card points, or how a Null went, and Schneider, Schwarz, an announcement missed, an overbid or a deal decided
early. Under it each seat's Seeger-Fabian score of the deal and the running totals — the board's — in the board's order;
then the skat, and how the score is counted in one line, without the scores. A private table's result is this and the
way on. Against the AI there follows the AI's side (SKATGO-145, the human: 「先显示叫牌和ai的不同，再显示打的和ai最不同（打的最不好的一个
trick），其他不显示」): "If the AI had played your cards" and its deal told as the result tells the player's (「你那个+86是什么意思？然后70 50
什么意思，然后为啥不写ai打的时候，最后每个人得几分呢」): the bidding only where it bid otherwise, who won or lost which game and
why, and each seat's score of its deal; then the one trick
where the player's card was furthest from the AI's: which card the AI would have played, the cards already on the table,
the player's hand at that moment with their card and the AI's marked, and who took the trick with its card points —
ranked over every play, with no threshold (the human: 「通过10墩排序的方式，选出最差的」); last, folded, every trick against the
AI (SKATGO-153, after a player's word in the forum — "Now I am not seeing the AI difference for each Stich … These were
excellent learning tools!" — the human: 「放到最下面一个明显的折叠卡片里，点了后就跟删掉的内容一样」; kept by SKATGO-166, 「最后那个ai打的如何的10
tricks的东西要保留」): opened, the play record trick by trick with the AI's card under the player's wherever it differs and
the hand before a tapped trick; then the way on. A deal all passed has the same result, "All three passed", in a white
box. No hint comes back to
free play: its deals feed the record of play (SKATGO-153, the human: 「同意，去掉叫牌建议，只做逐墩对比」). A deal where every card was the AI's choice says so in one
line; a deal all players passed has no trick. It is the engine's record and SkatZero's choices only: no language
model explains it (the human, 2026-10-11: 「解读太麻烦了」), and SkatZero's own numbers are not shown. The tournament's page keeps a row per
finished deal with the player's and the AI's score, opening to that deal's bidding and trick, and under the rows the
score sheet of the whole tournament so far; the newest row opens after
each deal and on the tournament's page mid-day (SKATGO-48). The page lists all of the
tournament's deals from the start (SKATGO-63): the finished ones in that comparison, the rest by number
as in progress or not yet played, never with their cards.

Free play at `/play`: a round of six deals against the same two computer players, the deal going round
as at a real table, so the player sits in each position twice (SKATGO-88: 「自由对局也要换发牌人……默认6
deals」); unranked, free and without an account (SKATGO-40, SKATGO-50). Its table is the tournament's: no hint of any kind
(SKATGO-130, the human: 「砍掉自由牌局时的提示，和锦标赛应该一模一样」); lesson 11's game keeps its hints (「11课的保留」). One exception,
free play's alone: a bid calculator in the bidding drawer (SKATGO-157, the human: 「减少玩家技术性的负担，但是不减少思维的挑战」) —
the player picks a contract and it counts that contract's value with the ten cards in hand (matadors, multiplier, base,
and Hand one step more; Null's four fixed values). It never says which contract, whether to bid, or how high. On by
default, a switch in the settings; never in the tournament, at a private table or in an exercise. There is no
AI assistant on the site any more (SKATGO-130: 「先开单子砍ai助手」, 「彻底删」). The table shows which deal of
six it is and the player's Seeger-Fabian total so far. A finished deal shows the tournament's result,
bidding against the AI — the same deal played by the computer from the player's seat (SKATGO-86: 「打完了能显示AI打这幅牌叫的啥，打几分」)
— and trick, then the way to the next deal; after the sixth, the round in one row per deal, each opening to its
bidding and trick, and its score sheet, as at the end of a tournament, and a new round. Lesson 11's game is one game with the same result. Changing the language
mid-round keeps the game and the round (SKATGO-79, SKATGO-88), and so does a reload or coming back within a
day (SKATGO-96: 「刷新一下页面，当deal丢了，连game也丢了」). The player may give up a round for a new one,
never one deal alone, so a round's total stays honest; the tournament cannot be given up.
At free play's and the daily tournament's tables Lina and Noah talk while a deal is played (SKATGO-142, the human: 「就像真人打牌时，根据打的好坏或叫的好坏，
碎碎念的一些话，一局里3次，尽量放到牌局里，不要牌局打完了说」, then 「对手赢牌，或者输牌时，说一句即可，叫赢了也可以说，总共不超过3次」): three
lines a deal, all while it is played — the bidding just won when it is worth a word (the player won it, bid too high or
passed too early, or it reached 30), and tricks Lina or Noah took or lost, spread over the play; a deal decided early by a
claim gets a line on that — never on the tenth trick or after the deal. Each is written there and then by the site's
model in the page's language, Lina quick, competitive and dry, Noah warm, a little superstitious and laughing at himself
(「人设同意」). How good the player's own bid or card was is SkatZero's judgement; the line only says it, as the speaker's own — the model is told "I", never SkatZero's name (SKATGO-146, the human: 「不要提及SkatZero这个东西，如果AI要自指，用I就行了」). A line names nothing
not yet played and never says what to play or bid; the two may tease each other, never the player. Free play and
the daily tournament, its six deals and the deal of the day alike (「只开自由对局」, then 「锦标赛也加进去，1deal和6deal都加」);
not a private table or the course. The settings switch it off.

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

Private tables at `/with-friends` (SKATGO-61) are rooms since SKATGO-163 (the human: 「一个人开一个房间，可以打2个ai。另一个人
可以加入进来，需要6位数字邀请码，是房间号。还能再加入一个人，替换掉ai。如果三人满了，输入房间号就不能再加人了」, 「用同类游戏的最常见的实践，
但是是简洁直观版，不要复杂化」): a room waits first, showing its six-digit number with its link to copy; friends come in
with the number, or the link, and sit down at once; the host gives a seat nobody takes to the AI, or takes it back, and
starts the game once every seat is taken (「房间建好后，房主点进去，应该有个等待的页面，显示口令，复制按钮，然后等待拿到口令的人加入（或者设置为
AI），点开始游戏」). Once it plays, a friend coming in takes a computer's seat from the next deal, starting at 0; with three
people the number lets nobody else in. Everyone at the table has an account, the room's host and
whoever comes in alike (the human: 「我打算把私人桌改成必须三个玩家都登录」), and sits under the name the boards show; an
account is in one room at a time. The page offers two cards, a new room and a room to come into, or, while the account
is in one, the way back to it (「私人桌进入后，两张卡片，新建房间，加入房间。如果已经在了一个房间，则显示回到房间」). At the table the
room's number is an item of the table's menu, and a tap copies its link (「点击后复制链接，而不只是房间号」, then, the
corner not working: 「我建议放到退出按钮里，加一个菜单项」); a room's menu button is the table's, not the way out of other
tables (「私人牌桌中，不要退出按钮，而要一个牌桌按钮。以示不同。然后菜单内容还相同」).
The seat of someone away, whom a computer plays for, may be taken by someone coming in; the host may take a person out,
who may come back with the number (「别人可以占用，但是房主可以踢人」, 「踢了还可以自己加，基于信任」). Leaving passes the host's role
on; the last one leaving closes the room. A deal's end waits until every person at the table has asked for the next
(SKATGO-165, 「需要所有非ai玩家点了next deal后，才能进入next deal」); someone away, whom the AI plays for, does not hold it. The
table counts its deals ("Spiel 3", no total) and keeps every finished one for its statistics. A newcomer who signs up to come into a room is recorded once as brought by its
host (SKATGO-117), so it shows who brings players in; nothing else is recorded about it, and it needs no consent banner.

About SkatGo at `/about` (SKATGO-134): the questions people ask, how the daily Skat is played, scored and ranked, and how a
private table goes — what the game pages no longer explain (the human: 「我现在特别讨厌游戏页面里那么多垃圾的文字……所有seo的都专门
做seo页面」). The game pages keep a title and a line; their search entry stays their own title and description.

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
site's ways in — the front page's picture card (its colour tile since SKATGO-149 the bidding practice's), the course, the header — lead to the exercises. Every article leads to the daily tournament, where each trick can be tried and
compared with the AI. The articles' text is SkatGo's own: no book's passages, examples or order are copied,
and the articles recommend no books.

A bidding practice at `/bidding-practice` (SKATGO-149, the human: 「practice卡片的位置，做成一个叫牌练习的东西，只叫牌」):
ten cards and the seat at the bidding; nothing is played or put away. Since SKATGO-151 it asks in the order a learner
thinks (the human: 「我想的是我能打什么合约」, 「答题分两步吧，先点什么合约，再点最高叫到几点」): first what do you play — a suit,
Grand, Null (「你还没说null呢」) or pass, every contract offered on every hand — then, unless the AI passes, how high you can
bid with the AI's contract, whatever was chosen first, so the counting is practised on every hand it plays. Each step
says right or wrong at once; then why, step by step as asked (the human: 「为啥你现在这个解析反而还不如以前详细了？」): the
contract — the trumps of every suit and the cheat sheet's rule the hand meets ("Trumps per suit: ♣ 3 · ♠ 4 · ♥ 3 · ♦ 6. 6
trumps and an Ace: a good game."; for a pass "The most is 3: too few"; Grand's count), said only as far as the facts go;
the bid — the matadors card by card, game, the base ("Without 1 (♣B not in your hand), plus 1 for game = 2, × 9 = 18"), or a
Null's fixed value; then a contract chosen instead, its trumps and Aces by the same rules, and a wrong number, what it
would have needed ("27 = 3 × 9 would need with or without 2"). The answer is SkatZero's highest bid for those cards from that
seat (「这个不用skatzero吗」) and the game it plays there: at that bid it picks up and plays that game in most skats
(SKATGO-154, the human: 「你看看叫牌练习的第五题，答案对吗」) — a number that only happens to match a game is not a question.
Since SKATGO-159 (the human: 「叫牌练习感觉搞的太简单了……基本就是看有几个B，然后再看哪个花色多」, 「不用600个，可以减少，但是要
稍微难一点，不要我说那种套路，套路应该有，但是是基础的，低难度的」) the run is about 150 questions: a few the rules of thumb answer
— the suit with most trumps, played with 6 trumps, 5 and an Ace, or 2 Buben and 2 Aces, bid to its count — open it;
every other one the rules of thumb get wrong in a step: a pass with such a hand, a game without one, another game than
the longest suit, or a bid below the count ("how far", the human: 「加入」; SkatZero bids past the count only in a Hand
game, which is not asked). Those are explained with SkatZero's own
numbers, which SKATGO-149 kept off the page, said as the AI's (SKATGO-146), each once: the chance it makes a game at a bid, over every skat — of each number offered,
of the longest suit beside the game it plays, of the routine's game where it passes — and a bid off the count is asked
only where that chance falls right above it, or for a borderline game said at 18. The run goes from the rules of thumb's
questions to those where they miss the bid or pass and play, then those where they miss the game. A bidding cheat sheet
opens beside the question (「这个要做成一个卡片弹窗放在叫牌页面，用户点开就能看，名字叫叫牌秘籍之类的」): the order to think in,
the rules of thumb, the point count with its thresholds, Grand's count, how high to bid, the seat and Null — every point
of the Skat books' teaching, clearer and never twice (「你必须覆盖刚才书上原文所有的点，还要写的更好更易懂，但是不能啰嗦和重复」),
in SkatGo's own words. A guest answers two, from the third an account (「不登录可以练2题」), the sign-in saying why in one
short line — to keep the mistakes and the analysis (SKATGO-150: 「登录时为了保存用户的错题本，帮助用户提高，文字要精简」). Each
question's first complete attempt is recorded — an account's on the server, a guest's two in the browser until it signs
in — and whether it was put right since (SKATGO-150, 「用户能记录下来他哪个题出错了吗」). The answers to the questions before SKATGO-159 are
deleted, an account's and a browser's, and the run starts again at 1 (the human: 「用户已经答过的，可以删除记录，不要影响新版」). Under the question the player sees
their own bidding as shares, no AI (「最好有个比率分析」): how many answered, then right, the contract wrong and the bid wrong —
the two steps' outcomes, three rows adding up (SKATGO-154, the human: 「问题是item太多了，名字莫名其妙，百分比倒没啥」); the wrong
contract covers the human's 「超叫还是不敢叫还是叫错」 in one. Only first attempts count. Beside the place in the run, every
question by number in a dialog, the mistakes not yet put right in red, each opening its question again — but only those
reached: the questions run in order from the first, any before can be done again (SKATGO-156, the human: 「最好不要让用户能
选择后面的题，要从1题开始按顺序做，但是能回到之前的题」). There is no set of ten (「不要10题，你就自然，先不用这个复杂」). It is a
search entry.

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

PostHog measures published-site visits and product events, linked to the account once a visitor signs in
and with no consent popup (SKATGO-152, the human: 「在不增加隐私弹窗的情况下，尽量最大化保存用户的使用信息（但是不要每次出牌都发事件）」);
Search Console measures Google search exposure. Neither alone proves that learners can play, and delayed search reports are not total traffic.

**What this product is not**

- It speaks German and English only. Public URLs determine page language, and learners can switch it
  themselves. The homepage `skatgo.com/` follows the visitor's language: a German browser, or a request
  that names no language, gets the German homepage; any other language goes to `/en`; a language the
  visitor picked in the header wins (SKATGO-113).
- It is the course, free play, the daily tournament, private tables with friends, the Skat-Tricks, the
  bidding practice, the rules reference and the forum — nothing from
  Parrottoon, from which it was split on 2026-09-21: none of Parrottoon's English content, and no link
  back to it.

## Tools

## Guidance

## Redlines

1. **Editing this file** — not without the human's explicit approval. Product intent is the human's
   exclusively.
