# SKATGO-102 grill

人从候选对比图里定的：
- 「默认选k5，但是中间的花色，要换成我的logo的那个，你试试。然后其他的保留，我再选选，给用户切换的机会。但是 你先换这个k5作为默认」
- 看了白圈版：「太丑了，不要那个白色的圈」
- 看了彩色版：「也不要彩色的，要想原图那样隐去」

所以默认牌背 `k5-logo`：Kenney K5 的蓝底和边框（用 Kenney 的矢量图，K3 就是 K5 去掉中间花色），中间换成 SkatGo logo，用边框的深蓝 `#3D77AB` 画，和原图花色一样淡淡地隐在中间。

agent 自己定的：
- **其他候选全部保留**，设置里加「Kartenrücken」让用户换（人说「我再选选」，之后再删减）。共 34 个：
  - k5-logo；
  - Kenney 蓝 1–5、红 1、绿 3；
  - BdRGames 1–3 蓝和红、2 绿、3 黑；
  - Sylly 6 个；
  - jeffshee 5 个；
  - itch 6 个；
  - 原来的炭黑花纹（ornament）。
- **尺寸**：都重画为 500×700（5:7）的 WebP。Kenney 和 Sylly 的 PNG 太小，从它们的矢量文件裁出。比 5:7 差几个百分点的整张拉伸到 5:7，不裁掉它们自己的边框。
- **边框**：新牌背自带边框，铺满整张牌。原来的炭黑花纹保留我们的白框。
- **授权**：jeffshee 是 CC BY 3.0，必须署名，在使用条款「Inhalte und Verfügbarkeit / Content and availability」加一句出处。所有来源写在 `app/public/cards/backs/LICENSES.txt`。
- **旧的选择**：存着的选择若以后被删掉，回到默认牌背。
- **charter**：ui.md 的 PlayingCard 牌背描述、engineering.md 加一行牌背文件的来源和生成方式。
