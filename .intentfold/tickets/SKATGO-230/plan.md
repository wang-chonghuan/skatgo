# SKATGO-230 plan

## 看到的、工单没说的
- 对方首页截图会带出敏感内容：Skatstube 标题下一行写"Skat um echtes Geld"，Skat-Online 首页下方有"Skat um Geld spielen"，Euroskat 首页有 cookie 弹窗——都要裁掉。
- 截图只能自己截（cloak-fetch），不能用对方的宣传图或商店图；配网站名和月份说明来源。
- 页面上"打开网页就能玩"最有说服力的证据是 SkatGo 自己打开即发好牌的画面：在 `make-compare-shots.mjs` 加一张横版截图。

## 路线
1. cloak-fetch 截四家首页，ffmpeg 裁剪（Skatstube 用页头 + "Anmeldung kostenlos"表单两段拼接，避开真钱那句），cwebp → `app/public/compare/brands/`。
2. `brands.ts` 加 `screenshot`、`signup`；`brand-page.tsx`：介绍旁放截图和说明；绿色"Seite öffnen und losspielen"块（SkatGo 截图、三步、按钮）；对比表第一行"Spielen ohne Anmeldung"；共用按钮框文字改为突出免注册。
3. charter 按人的要求修改"不展示对方图片"。
