# skatgo

斯卡特（Skat）中文互动课程，线上地址 https://skatgo.com 。11 节课，边学边练，最后和两个电脑对手打完整的一局。

这门课原本在 [Parrottoon](https://parrottoon.com/skat) 里开发（PARROT-42），这里是它的独立站点，**视觉上与 parrottoon.com/skat 一致**。课程代码、主题与样式都是从 Parrottoon 原样复制的；改动只有路由路径（`/skat/...` → `/...`），以及头部不显示「← 回 Parrottoon」链接。

## 结构

与 Parrottoon 相同：仓库根放 `Dockerfile`（构建上下文是仓库根），`app/` 是独立的 TanStack Start 项目。

| 路径 | 内容 |
|---|---|
| `app/src/lib/skat/` | 规则引擎（按 ISkO）、电脑对手、课程与练习生成器、进度存储 |
| `app/src/components/skat/` | 牌面、练习、课程播放器、牌桌 |
| `app/src/theme/` | 主题（Astryx，StyleX 编译）与课程调色板 `skat.stylex.ts` |
| `app/src/routes/` | `/` 课程目录、`/lesson/$id`、`/play` |

进度只存在浏览器 localStorage 里；账号由 Clerk 托管，只用于问答助手。应用没有数据库。

## 本地

```bash
npm --prefix app install
npm --prefix app run dev          # http://localhost:3220
```

检查（部署前跑一次）：

```bash
npm --prefix app run typecheck && npm --prefix app run build && npm --prefix app run test && \
  node app/scripts/check-client-bundle.mjs
```

## 部署

生产运行在 Render 的 `skatgo` Project / `production` Environment 中，服务是 Frankfurt 区域的
Docker Web Service `skatgo`。服务关闭自动部署，发布时显式指定已合入 `main` 的提交：

```bash
eval "$(grep '^export RENDER_API_KEY' ~/.zshrc)"
python3 ~/.agents/skills/ips-render-ops/scripts/release.py --only skatgo --commit "$(git rev-parse HEAD)"
```

域名 `skatgo.com` 在 Cloudflare，apex 使用扁平化 CNAME 指向 `skatgo.onrender.com` 并保持
**DNS-only（灰云）**；`www` 重定向到 apex。生产环境只配置 Clerk 与问答助手需要的变量，
不配置数据库。问答助手仍使用与 Trovestep 相同的 Azure OpenAI-compatible
`LLM_BASE_URL` / `LLM_API_KEY` 合同。
