# SKATGO-101 handoff

## 改了什么
- 牌桌加三种声音，用人从 6 套里选定的第 2 套「Kenney Leicht」（Kenney 最轻的几个牌声）：
  - 发牌时一段拨牌声；
  - 每打出一张牌一声轻放牌声（玩家和电脑都响）；
  - 一墩收走一声轻滑。

  所有牌桌都有：自由对局、第 11 课、每日赛、好友牌桌。中途接着打的牌局不为已打过的牌补响。
- 设置里「Töne · Kartengeräusche」开关，默认开，记在本浏览器。
- 文件：5 个 MP3，共 15 KB，由 `make-sounds.sh` 从 Kenney Casino Audio（CC0）生成，附 Kenney 授权文件。试听用的其他文件和选择器已删除。
- 浏览器规定页面被点过之前不能出声。点进牌桌通常已经算点过；不能出声时，牌照常打。
- charter engineering.md 加了音效文件的来源和生成方式。

## 验证
- 机械检查全过：typecheck、build、单元测试 124/124、client bundle、设计令牌、git grep、SSR、SEO（46 页）、SEO 测试 25/25。
- 浏览器 `tmp/ac.mjs` 14 项全过（桌面、手机，选定第 2 套后重跑）：
  - 默认开；
  - 最后一墩响出牌声和收牌声；
  - 下一副响一次发牌声；
  - 关掉后新的一副不出声；
  - 刷新后仍是关的；
  - 页面不报错。

## 试听
人在设置里试了 6 套（Kenney Original / Leicht / Hell、BMacZero、Mix、合成的 Papier），选了第 2 套。试听期间 `tmp/sets.mjs` 16 项全过。

## 没法自动验证的
声音好不好听、大小合不合适，只能人来听。音量是 0.45。

## 服务
web http://127.0.0.1:55101（自由对局 /de/spielen）、multiplayer 56101、数据库 57101 在跑。
