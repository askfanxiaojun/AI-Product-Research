# 归档与发布

## 目标与权限

先检查用户明确指定的仓库、默认分支、权限和最新内容。使用用户现有 GitHub 连接，或本机已经认证的 Git/GitHub CLI。不在文件、网页、命令参数和日志中写入 Token。安装者自己的目标优先于任何示例。

## 本机 Git 路径

1. 检查 `git status`、remote 和分支。若工作区有无关修改，创建独立 worktree，不 stash、reset 或覆盖用户改动。
2. 获取远端最新状态，基于目标分支创建工作分支。不要强推。
3. 查找已有产品 slug 和日期版本，生成报告及所需图片。
4. 运行项目的 `npm ci`（需要时）及 `npm run build`。该项目会校验元数据、日期、路径和站点构建。
5. 只 stage 本次报告和图片，提交并推送。用户明确授权直接同步且分支允许时可 fast-forward 更新目标分支，否则创建 PR，并说明报告尚未发布。不要自动修改仓库分支保护。
6. 发生并发冲突时先读取新版本再合并，无把握时保留工作分支并报告冲突。

## GitHub 工具路径

读取目标分支最新 commit/tree，批量创建此次变更的 blobs/tree/commit，以该最新提交为父提交，更新 ref 时使用预期旧 SHA；冲突后重新读取，不强推。若连接不提供原子写入，可创建独立分支逐文件写入后提交 PR。不要每份报告手工改网页或索引。

## Pages

本项目 `main` push 后运行 `.github/workflows/pages.yml`，先构建 Astro 调研库和原有 Vite 工具，再上传 Pages artifact 并部署。首次需在 Settings → Pages 选择 GitHub Actions。报告 URL：`<siteUrl>/reports/<product-slug>/<YYYY-MM-DD>/`；产品历史：`<siteUrl>/products/<product-slug>/`。

提交成功不等于发布成功。检查实际默认分支的 workflow（包括 push 触发的 runs）；部署失败时读日志，说明报告已保存及失败步骤；修复仅限授权范围。发布后验证 URL 状态和内容。若通过 PR，同步状态标为“PR 待合并”，不能宣称已经上线。
