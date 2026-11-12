# SKATGO-188 handoff

## What changed
- **密钥文件** `app/public/c720dba3cf670e864c48b7a42254f2ec.txt`：内容就是文件名里的密钥，由 Nitro 从站点根目录原样发出（和 `robots.txt` 一样）。
- **提交脚本** `app/scripts/indexnow.mjs <origin>`（只用 Node 自带 fetch，没有新依赖）：
  - 从 `app/public/` 找出唯一的 `<32 位十六进制>.txt` 当密钥，并确认站点确实发出了它；
  - 读两个 sitemap 的全部 `<loc>`；任一 sitemap 不是 200 就退出码 1，什么都不发；论坛没帖子时它的 sitemap 为空，照常继续；
  - origin 的主机名等于 sitemap 网址的主机名（即 `skatgo.com`）才一次 POST 到 `api.indexnow.org`，只认 200/202；否则只列出网址（dry run）。
- **operations.md**：
  - 发布后检查在 `check:seo` 之后加一行 `node app/scripts/indexnow.mjs "$URL" || exit 1`；
  - “Submit changed URLs to Bing too” 改为“上面那段已经提交，Bing 手动 URL Submission 只留给两次发布之间需要重抓的页面”；
  - 「Search consoles」补上论坛 sitemap 已提交 Bing（2026-11-12）和 IndexNow 一条。
- **`app/scripts/README.md`**：加 IndexNow 一节用法。

## AC results
在本单端口跑生产构建：web 55188，multiplayer 56188，本地库 57188（论坛 0 帖）。
1. **AC1 密钥文件**：`/c720dba3cf670e864c48b7a42254f2ec.txt` 返回 200，正文与密钥逐字相同。**PASS**
2. **AC2 预览只列不发**：用 `tmp/guard.mjs` 拦截所有非本机请求运行脚本，退出码 0，列出 52 个网址 = `sitemap.xml` 52 + `sitemap-forum.xml` 0，拦截记录 0 条。停掉 multiplayer 时论坛 sitemap 返回 503，脚本退出码 1、未发送。**PASS**（最终构建上复跑过）
3. **AC3 生产提交**：发布后才能验证（不能为验收另向 IndexNow 发提交，operations.md Redline 2）。已在本机替身上走通生产路径：把 `skatgo.com` 的读取指到预览、截住发往 `api.indexnow.org` 的 POST，请求体 host=skatgo.com、key 正确、keyLocation=`https://skatgo.com/c720….txt`、52 个网址，脚本退出码 0。**待发布后验证**

## Mechanical defence
typecheck、build、346 个单测、client bundle、design tokens、字面量 grep、server 链接、`check:seo --built`（52 个可收录页）、`test:seo`（28 项）全部通过。

## Deviations
- 计划里“任一 sitemap 没有网址就失败”改为“读不到才失败，论坛为空照常”：本地新库论坛 sitemap 为空时脚本误报失败，空论坛是正常状态（见 grill 5）。

## Environment
- 端口：web 55188，multiplayer 56188，database 57188。
- env 键：无新增、修改或删除。工作区 `multiplayer/.env` 的 `DATABASE_URL` 端口改成了 57188，只为本地起本单数据库，不同步回主检出。
- 本单建了本地容器 `skatgo-multiplayer-db-57188`（colima skatgo profile），cap4 清理。

## Residual
- 写入官方论坛文章后（直接写生产库），可手动跑一次 `node app/scripts/indexnow.mjs https://skatgo.com`，让新文章不必等下一次发布。

## Check
1. 无需肉眼判断的改动。合并发布后看 Bing 站长工具 → IndexNow 页是否出现 skatgo.com 的提交记录（AC3）。

## Decided for you
- 发布后脚本提交，不在服务启动时提交（避免每次重启重复提交）。
- 每次提交两个 sitemap 的全部网址（目前 62 个），不挑“改过的”。
- 密钥作为公开文件提交进仓库：协议本来就要求公开，不是账号凭据。
- 用 `api.indexnow.org` 公共入口，Bing、Yandex、Seznam 等都会收到。
- 论坛 sitemap 503 时整次不提交；为空时照常提交。
