# SKATGO-101 grill

人：「开始开发，setting里做一个音效的开关，默认开，其他不用问我了」。下载 Kenney 包也算在「不用问」里。agent 自己定的：

- **选哪些声音**：
  - 发牌：`card-fan-1/2`（拨牌）；
  - 出牌：`card-slide-5/2/3/4`（抽牌出去）；`card-slide-1` 去掉静音后只剩 0.11 秒，换成 `card-slide-5`；
  - 收墩：`card-shove-3/4`。

  `card-shuffle` 长 3 秒，用来配发牌太长，不用。
- **格式**：这台机器的 ffmpeg 没有 OGG 编码器，所以只用 MP3，所有现在的浏览器（含 Safari）都能解码。8 个文件共 64 KB，统一到约 -24 dB。
- **什么时候响**：
  - 新的一副牌（叫牌前、牌面没出过）响一次发牌声；
  - 牌桌上多一张牌就响一次出牌声（玩家自己的牌一点就响，电脑的牌随它出现时响）；
  - 一墩收走响一次收牌声。

  中途接着打的牌局（刷新、换语言）不为已经打过的牌补响。
- **音量**：0.45。同一种声音两次至少隔 80 毫秒，免得叠成噪音。
- **开关**：设置里「Töne · Kartengeräusche」/「Sound · Card sounds」，默认开，记在本浏览器（`skatgo.settings.v2`）。已有设置的老用户也是默认开。
- **浏览器的出声限制**：页面第一次被点之前，浏览器不让网页出声。用户点进牌桌（比如在首页点「Heute spielen」）通常已经算点过，之后在任何地方点一下也会解锁。声音不能出时，牌照常打。
- **charter**：engineering.md 加一行说明 `app/public/sounds` 的来源、授权和生成脚本，与卡牌图片、图标同样处理。

## 试听（人：「有没有其他音效选择，这个好像太沉重，你可以临时在setting里加上很多音效套装，我一个一个试试？」）
- 另找到 BMacZero 的 Playing Card Sounds（CC0，https://opengameart.org/node/118338），声音短而脆。
- 设置里临时加了「Klangset (zum Ausprobieren)」，6 套，点一套就选中并立刻试播一遍（发牌、三张牌、收墩）：
  1. Kenney Original：原来那套；
  2. Kenney Leicht：轻放牌声、轻滑，偏小声；
  3. Kenney Hell：原那套快放 30%，音更高更脆；
  4. BMacZero：洗牌、接触声、切牌声；
  5. Mix：BMacZero 的发牌和收墩，Kenney 的轻放牌声；
  6. Papier：浏览器用噪声合成，不用文件。
- 人选定后：只留选中的那套，删掉选择器和其他文件，再交付。

## 选定（人：「选2号」）
- 保留第 2 套「Kenney Leicht」：
  - 发牌 `card-fan-1`；
  - 出牌 `card-place-1/2/3`（把牌轻放下）；
  - 收墩 `card-slide-6`（轻滑）；
  - 音量各为 0.7、0.8、0.8 倍。
- 去掉试听选择器、其他 5 套和 BMacZero 的文件。设置里只剩「Töne · Kartengeräusche」开关。
