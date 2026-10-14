# SKATGO-102 acceptance checks

构建产物 web 55102、multiplayer 56102，Playwright 有头浏览器，桌面 1280×820、手机 375×812（`tmp/ac.mjs`）。不打牌，只看牌桌开局时的牌背。

- AC1：设置里有「Kartenrücken」，列出 34 个牌背，默认选中 k5-logo。
- AC2：
  - 牌桌上的牌背默认是 k5-logo，铺满整张牌；
  - 改选 bdr-3-red 后立刻换成它，刷新后仍是它；
  - 选原来的炭黑花纹时有 3px 白框；
  - 每个牌背的图片都能取到。
- AC3：使用条款（德英）里有 jeffshee CC BY 3.0 的署名。
- 页面不报错。
