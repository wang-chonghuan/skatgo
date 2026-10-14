# SKATGO-102 acceptance checks

构建产物 web 55102、multiplayer 56102，Playwright 有头浏览器，桌面 1280×820、手机 375×812（`tmp/ac.mjs`）。不打牌，只看牌桌开局时的牌背。

- AC1：设置里「Kartenrücken」列出 5 个牌背（原版、charcoal、navy、burgundy、green），默认选中原版。
- AC2：
  - 牌桌上的牌背默认是原版，在 3px 白框里；
  - 改选 navy 后立刻换成它，刷新后仍是它，也在白框里；
  - 每个牌背的图片都能取到。
- 页面不报错。
- 人看过对比图，对四种新牌背满意（「这几个我很满意」）。
