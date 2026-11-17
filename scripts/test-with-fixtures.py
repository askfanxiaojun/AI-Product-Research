"""Exercise content rendering using disposable reports, never publish fixtures."""
from pathlib import Path
import subprocess
import shutil
root=Path(__file__).resolve().parent.parent
folder=root/'content/products/test-fixture-only'
if folder.exists(): raise SystemExit('Fixture directory already exists')
try:
    (folder/'reports').mkdir(parents=True)
    for date,title,category in [('2026-11-16','第一次','AI 助手'),('2026-11-17','第二次','开发工具')]:
        (folder/'reports'/f'{date}.md').write_text(f'''---
title: "测试产品：{title}"
product: "测试产品"
productSlug: "test-fixture-only"
website: "https://example.com"
date: "{date}"
category: "{category}"
summary: "仅供本机测试，不发布。"
tags: ["验证"]
sources: ["https://example.com"]
---
## 功能分析

这是用于验证路径、目录与 Markdown 渲染的测试内容。

| 能力 | 边界 |
| --- | --- |
| 测试 | 未亲测 |

## 结论

测试归档行为。
''')
    subprocess.run(['npm','run','build'],cwd=root,check=True)
    subprocess.run(['node','tests/content.mjs'],cwd=root,check=True)
finally:
    shutil.rmtree(folder)
