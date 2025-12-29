# 🕵️‍♂️ AI Product Research

> **From Input to Insight.** > 一个纯 AI Vibe Coding 驱动的产品研究自动化工具。

![License](https://img.shields.io/badge/license-MIT-blue.svg) ![AI-Powered](https://img.shields.io/badge/AI-Powered-purple) ![Vibe-Coding](https://img.shields.io/badge/Vibe-Coding-000000)

## 📖 简介 (Introduction)

体验链接：https://ai.studio/apps/drive/1s1Q8iDck_tg9gx23KF6w1v_hch9sxyRa

**AI Product Research** 是一个旨在解放产品经理和投资者双手的自动化调研工具。

在这个项目中，你只需要提供**产品名称**和**官方链接**，系统就会启动一个智能 AI 工作流。它不仅会深度阅读你提供的链接内容，还会自主联网进行全网调研（Competitors, User Reviews, Market Fit），最终生成一份结构化、有深度的产品研究报告。

本项目完全遵循 **"Vibe Coding"** 理念构建——由 AI 辅助编写，核心逻辑由 LLM 驱动，旨在探索 AI Native 应用的极致效率。

## ✨ 核心功能 (Key Features)

* **⚡️ 一键启动**：仅需输入 Name + URL，无需复杂配置。
* **🌐 深度联网调研**：
    * **定向阅读**：爬取并深度理解提供的官网/文档链接。
    * **广度搜索**：自动搜索全网相关评价、竞品对比、融资背景等信息。
* **🧠 智能综合分析**：模拟资深分析师思维，将多源信息整合成逻辑严密的报告。
* **📝 结构化输出**：生成 Markdown 格式报告，包含产品定位、核心功能、商业模式、SWOT 分析及市场反响。

## ⚙️ 工作流原理 (Workflow)

```mermaid
graph LR
    A[用户输入: 名称 + URL] --> B{AI Agent Controller}
    B --> C[🕷️ 爬取目标网页]
    B --> D[🔍 全网搜索调研]
    C --> E[信息清洗与提取]
    D --> E
    E --> F[🧠 LLM 深度思考与推理]
    F --> G[📄 生成最终研究报告]