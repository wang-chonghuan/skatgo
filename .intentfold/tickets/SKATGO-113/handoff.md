# SKATGO-113 handoff

首页 `skatgo.com/` 按访客语言分流：页头选过的语言优先，其次看浏览器首选语言，德语留在德文首页，其他语言 307 到 `/en` 并保留参数；请求不带语言时给德文首页。

## What changed

- **`lib/locale.ts`：** 新增 `rootLocale`，依次看保存的选择、浏览器首选语言，都没有时给德语。首页本身仍按德语渲染（`chooseLocale` 不变）。
- **`server.ts`：** 在 Paraglide 中间件之前处理 `/`：
  - 非德语 → 307，`Location: /en?…`，用相对地址，在代理后面也安全；
  - 德语 → 正常渲染；
  - 两种都带 `Vary: Accept-Language, Cookie`；
  - 不交给中间件，因为它只对浏览器的文档请求跳转，否则别的请求会在德文地址上拿到英文。
- **单元测试：** `locale.test.ts` 补了 `rootLocale` 的用例。
- **SEO 检查：**
  - `check-seo.mjs` 原来要求首页对所有语言都是德文，改为检查新规则：6 种组合，包括保留参数和 Vary；
  - 抓页面的浏览器设成德语，相当于不带语言的爬虫；
  - `seo.test.mjs` 加了一个负面对照：英语请求没跳转就必须失败。
- **charter**（工单已授权，只改到和本单一致）：
  - product.md：首页按语言分流；
  - operations.md：根地址的行为；
  - engineering.md：German-first 那条，以及 SEO 检查说明里的「stable German root」。

## Grill

grill.md：链接预览和爬虫不特殊对待，只看请求头（人：「都按建议」）。

## AC results

本地构建版 55113：

1. **非德语浏览器：** `curl` 带 en-US 或 fr-FR 请求 `/?utm_source=test`，得到 307 到 `/en?utm_source=test`；Playwright 用 en-US 和 fr-FR 浏览器打开，最终落在 `/en?utm_source=test`，`lang="en"`。✅
2. **德语和没有语言：** de-DE 和不带语言都得到 200 德文首页，带 Vary 头。✅
3. **保存的选择优先：**
   - curl：英语浏览器加 cookie de → 200；德语浏览器加 cookie en → 307 到 `/en`；
   - Playwright 实际点页头语言：英语浏览器选德语后回到 `/` 是德文；德语浏览器选英语后回到 `/` 进 `/en`。✅
4. **SEO：** `check:seo -- --built` 通过，包含新的首页规则；`test:seo` 26 项通过，包含新的负面对照。✅

机械防线全部通过：typecheck、build、test 267 项、bundle、tokens、literal grep、SSR import、`check:seo`、`test:seo`。

## Environment

端口 55113，构建版留着运行供审阅。没有 env 变更。

## Residual

- 上线后按 operations.md 在 Search Console 检查德文首页和 `/en` 的收录。人工操作，不在本单。
- Facebook 链接预览带不带语言头没法在本地确认；按 grill 决定，不特殊处理。
