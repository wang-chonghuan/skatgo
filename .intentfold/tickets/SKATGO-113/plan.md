# SKATGO-113 plan

## 代码里看到的（工单没写）

- **语言规则（`lib/locale.ts` 的 `chooseLocale`）：** 对 `/` 固定返回德语，其他地址依次看 URL、页头保存的选择（cookie `PARAGLIDE_LOCALE`）、浏览器首选语言，都没有时用德语。浏览器语言的判断 `browserLocale` 已经有了：首选德语给德语，其他语言给英语，没有给 undefined。
- **Paraglide 中间件的跳转：** 只对带 `Sec-Fetch-Dest: document` 的请求跳转。如果只把 `/` 的语言改成英语，不带这个头的请求（curl、部分爬虫和链接预览）会在 `/` 上直接拿到英文内容，而不是跳到 `/en`。所以首页跳转不能交给中间件。
- **SEO 检查：**
  - `check-seo.mjs` 现在要求 `/` 对任何语言头和 cookie 都是 200 德文（「Stable German root」）；
  - 它用 Chromium 抓站点地图里的每一页，Chromium 默认带 `en-US`，改了以后抓 `/` 会被带到 `/en`。
- **charter 里写着「德文根稳定」的地方：** product.md「The German homepage is the same for every browser」、operations.md 第 20 行、engineering.md 第 118、252 行。

## 路线

1. **首页语言（`lib/locale.ts`）：** 新增 `rootLocale({ cookie, acceptLanguage })`，依次看保存的选择、浏览器首选语言，都没有时用德语。`chooseLocale` 对 `/` 仍返回德语，不变。
2. **跳转（`server.ts`）：** 在 Paraglide 中间件之前处理 `/`：
   - `rootLocale` 是英语 → 307 跳到 `/en` 并保留查询参数。用相对地址，和 `moved.ts` 一样，在 Render 的代理后面也安全。
   - 德语 → 照常渲染德文首页，响应加 `Vary: Accept-Language, Cookie`。跳转的响应也带这个头。
3. **单元测试（`locale.test.ts`）：** 补 `rootLocale` 的用例。
4. **SEO 检查（`check-seo.mjs`、`seo.test.mjs`）：**
   - 把「Stable German root」改成新规则：不带语言头 → 200 德文；德语 → 200 德文；英语或法语 → 307 到 `/en` 并保留参数；英语浏览器但选过德语 → 200 德文；德语浏览器但选过英语 → 307 到 `/en`；
   - 抓页面的 Chromium 设成德语，`/` 还按德文页检查；
   - 负面对照按新规则调整。
5. **charter：** 只改上面列出的几行，改到和本单一致为止（工单已授权）。
