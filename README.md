# AI Product Research · AI 产品调研库

面向 AI 产品经理的研究档案：通过本机 Skill 开展调研，将有来源的 Markdown 报告保存到 GitHub，再自动发布为适合检索和长文阅读的网页。

**[调研库](https://askfanxiaojun.github.io/AI-Product-Research/) · [安装 Skill](https://askfanxiaojun.github.io/AI-Product-Research/install/) · [原有在线调研工具](https://askfanxiaojun.github.io/AI-Product-Research/legacy/)**

原有 React 在线调研工具、三阶段研究流程、Gemini / 自定义 OpenAI 兼容 API、Markdown 报告预览与下载均保留，作为次级入口。网页不内置 API Key，使用者在设置中填写自己的密钥，保存在当前页面内存中。

## 安装到自己的电脑

在网站“安装 Skill”下载 ZIP，解压后把整个 `ai-product-research` 文件夹放入：

| 客户端 | macOS / Linux | Windows |
| --- | --- | --- |
| Codex | `~/.agents/skills/`（兼容 `~/.codex/skills/`） | `%USERPROFILE%\.agents\skills\` |
| Claude Code | `~/.claude/skills/` | `%USERPROFILE%\.claude\skills\` |

也可通过 Git + Python 3 安装：

```sh
git clone https://github.com/askfanxiaojun/AI-Product-Research.git
cd AI-Product-Research
python3 scripts/install-skill.py --client codex
# 或 --client claude；Windows 可用 py 替代 python3
```

已有同名安装时脚本停止，先备份再替换。安装后在新会话调用。安装不会自动提供联网能力、模型服务或 GitHub 写入权限。

调用示例：

> 使用 ai-product-research 调研 Notion，官网 https://www.notion.com，重点关注 AI 功能与商业模式。将报告归档到我的仓库 owner/repo。

其他用户安装后指定自己的归档仓库，不会默认上传到本项目作者的仓库。首次设置可在归档仓库根目录创建本机专用 `.ai-product-research.json`，包含 `repository` 和 `siteUrl`，不要写入凭据；此文件已被忽略。

## 报告与网站

Markdown 是唯一正文来源，摘要元数据与正文放在同一文件；Astro 构建时生成首页、产品历史、报告详情及目录。首页搜索仅处理摘要、标题和标签，不下载所有正文。仓库目前没有正式报告，网站展示开始指引，不用虚构报告填充。

```text
content/products/<product-slug>/reports/YYYY-MM-DD.md
public/images/<product-slug>/<date>/
skills/ai-product-research/       # 可分发的本机 Skill
src/                            # Astro 阅读网站
App.tsx、components/、services/   # 保留的 React 调研工具
.github/workflows/pages.yml      # 校验、构建、Pages 发布
```

报告字段与章节见 [报告规范](skills/ai-product-research/references/report-format.md)，安全同步与发布检查见 [同步规范](skills/ai-product-research/references/publishing.md)。同次调研纠错更新原文件，新的调研日期新建文件。目录与 frontmatter 必须一致，不支持正文原始 HTML。引用使用普通 Markdown URL，不保存会话内部引用标识。

## 开发与发布

需要 Node.js 22、npm 和 Python 3：

```sh
npm ci
npm run dev          # 调研库
npm run dev:legacy   # 原在线工具
npm run build        # 校验报告、打包 Skill、构建 Astro 与原工具
npm run preview
```

GitHub Settings → Pages → Source 选择 **GitHub Actions**。推送 `main` 后自动构建并发布；PR 仅校验构建。`dist/legacy/` 为原工具，`dist/downloads/ai-product-research.zip` 为安装包。首次未开启 Pages 时部署会失败，启用后重新运行 workflow。

Fork 后修改 `astro.config.mjs` 的 site/base、package.json 中 legacy base，以及页面中的仓库与源码链接。发布站点内容是公开的，只归档适合公开的研究。

发布前可运行内容与搜索逻辑验证：

```sh
npm test  # 自动生成并清理临时报告，校验归档路径、报告渲染、目录、搜索和分类
```

浏览器端检查：先用临时报告构建，再运行 `npm run test:browser`（需先安装 Chromium）。受限运行环境可能无法启动浏览器，此项独立于内容校验。
