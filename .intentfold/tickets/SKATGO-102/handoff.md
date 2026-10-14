# SKATGO-102 handoff

## 改了什么
- **默认牌背 `k5-logo`**：Kenney 的蓝底边框牌背（CC0），中间的花色换成 SkatGo logo，用边框的深蓝色淡淡地画在原来花色的位置。中间试过白圈版和彩色版，人都不要。
- **其他候选全部保留**，设置里新增「Kartenrücken」，34 个缩略图可选，记在本浏览器：
  - Kenney 7 个；
  - BdRGames 8 个；
  - Sylly 6 个；
  - jeffshee 5 个；
  - itch 6 个；
  - 原来的炭黑花纹。
- **文件**：`app/public/cards/backs/` 下 33 个 500×700 的 WebP，共约 1.4 MB，由 `make-backs.mjs` 生成，来源和授权在 `LICENSES.txt`。原来的炭黑花纹仍是 `app/public/cards/back.webp`。每页只加载选中的那一个牌背；设置面板打开时缩略图才加载。
- **授权**：jeffshee 那 5 个是 CC BY 3.0，使用条款里加了署名（德英），`LEGAL_UPDATED` 改为 2026-10-14。
- **charter**：ui.md 的牌背描述、engineering.md 加一行牌背文件。

## 验证
- 完整机械检查全过：typecheck、build、单元测试 124/124、client bundle、设计令牌、git grep、SSR、SEO（46 页）、SEO 测试 25/25。
- 浏览器 `tmp/ac.mjs` 18 项全过（桌面、手机）：
  - 默认牌背；
  - 设置里 34 个；
  - 切换后立刻生效，刷新后保留；
  - 原来的炭黑花纹有白框；
  - 全部图片都能取到；
  - 条款里有署名；
  - 页面不报错。

## 之后
人说「我再选选」：候选可以在设置里直接试，定下后删掉不要的，从 `backs.ts` 和 `make-backs.mjs` 里去掉即可。

## 服务
web http://127.0.0.1:55102（自由对局 /de/spielen）、multiplayer 56102、数据库 57102 在跑。
