# SKATGO-188 计划

## 代码里看到、工单没写的
- `app/public/` 下的文件由 Nitro 原样从站点根目录发出（`robots.txt`、`.well-known/assetlinks.json` 就是这样发的），不经过 `server.ts` 的语言中间件，所以密钥文件放进 `app/public/` 即可。
- 两个 sitemap 的网址都写成 `SITE_URL`（`app/src/lib/origin.ts`，`https://skatgo.com`），预览站上读到的 sitemap 也列生产网址。所以“是不是生产”可以直接比较：所给站点的主机名是否等于 sitemap 里网址的主机名。脚本里不需要再写一遍 `skatgo.com`。
- `sitemap-forum.xml` 在论坛服务不应答时返回 503（operations.md Contract）。
- operations.md 发布后步骤里已经写着“Submit changed URLs to Bing too”（手动 URL Submission）；IndexNow 是它的自动化版本。

## 路线
1. 用 `openssl rand -hex 16` 生成密钥，写成 `app/public/<密钥>.txt`，内容就是密钥。
2. 新增 `app/scripts/indexnow.mjs <origin>`（只用 Node 自带的 fetch，不加依赖）：
   - 从 `app/public/` 找出唯一一个 `<32 位十六进制>.txt` 文件当密钥（文件名和内容必须一致），不在脚本里再写一份密钥；
   - 读 `<origin>/<密钥>.txt`，内容必须等于密钥；
   - 读 `<origin>/sitemap.xml` 和 `<origin>/sitemap-forum.xml`，取出全部 `<loc>`；任一读取失败或一个网址都没有，就退出码非 0，不做部分提交；
   - origin 的主机名不等于 sitemap 网址的主机名时，只打印将提交的网址和数量，不发送（预览、本地）；
   - 主机名一致时（生产），一次 POST 到 `https://api.indexnow.org/indexnow`（host、key、keyLocation、urlList），打印返回码，只有 200/202 算成功。
3. operations.md：发布后检查那段 SEO 检查之后加上这条命令；「Search consoles」补一行说明 IndexNow 和密钥文件；把发布后“Submit changed URLs to Bing too”改成由这条命令完成。
4. `app/scripts/README.md` 补一小节用法。

## 和提案的差异
无实质差异。
