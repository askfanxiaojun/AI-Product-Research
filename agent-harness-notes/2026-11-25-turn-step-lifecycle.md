# 第 01 期｜Agent 何时算做完：Turn、Step 与继续执行

2026-11-25 · 阅读约 8 分钟

## 先记住一个判断

**模型说完了一句话、当前轮执行结束、用户目标达成，是三个可以分别发生的事件。** 普通对话可以把它们做得很接近，能调用工具和接受中途指令的 Agent 必须区分它们。否则「已为你安排」可能只表示模型生成了这几个字，「停止」也可能和已经执行的外部动作混为一谈。

可以把 **Turn** 理解为一次有独立生命周期的交互执行，把 **Step** 理解为其中的一次模型请求以及随后的工具处理。这里采用 DeepSeek Harness 对 Step 的定义；Codex 一栏比较的是对应的采样和工具执行过程，两边内部类型及边界并非逐一对应。一个更长的业务任务还可能跨多个 Turn。

## 顺着两份源码走一遍

### Codex：采样结束后，再决定这一轮是否继续

`RegularTask` 启动普通轮次后调用核心 `run_turn`。循环先在合适的边界读取等待中的输入并为模型准备请求。一次采样和相应工具处理返回后，核心会分别看模型侧是否需要后续处理、当前轮是否还有排队输入。源码将这两者合成 `needs_follow_up`。因此，模型做完当前段工作时，运行中收到的新消息仍可能让同一轮继续。

常规后续工作用尽后，还有 Stop hook。源码里有一条具体分支：hook 阻止结束且提供有效的继续指令时，Codex 会把该指令写入会话，继续循环。没有有效指令时，代码会发出警告。换句话说，模型给出一段看起来完整的答案之后，宿主仍可能要求同一轮完成额外工作。

源码：[RegularTask](https://github.com/openai/codex/blob/ebd0765aafa255d63ebf690ebdffe0164dc14a0c/codex-rs/core/src/tasks/regular.rs#L43) · [输入队列、采样与继续条件](https://github.com/openai/codex/blob/ebd0765aafa255d63ebf690ebdffe0164dc14a0c/codex-rs/core/src/session/turn.rs#L546-L746) · [Stop hook](https://github.com/openai/codex/blob/ebd0765aafa255d63ebf690ebdffe0164dc14a0c/codex-rs/core/src/session/turn.rs#L858-L912)

### DeepSeek Harness：用显式事件划出 Turn 和 Step

默认驱动 `ReactLoopAgent` 启动时向 Session 追加 `turn/start`，然后尝试领取输入并执行 `preStep`。如果输入被拒绝，或者首个输入在进入前已被改写为空，这一轮可以在 **零次模型调用** 的情况下结束。只有真正进入执行，代码才写入 `step/start`，调用模型并处理工具，最后写入 `step/end`。工具处理可能要求下一次模型请求。同理，本轮还有下一步输入时，驱动也可继续。

代码到达准备结束的位置时，会触发串行的 `agent/turn-stopping` 扩展点，随后再查一次下一步队列。最终的 `turn/end` 进入 Session 日志，附有结束原因。默认驱动本身通过 Cordis 作为服务注册，插件可以围绕相关事件扩展执行逻辑。其中 `turn/*`、`step/*` 是持久会话事实，`agent/turn-stopping` 是运行中的扩展事件。

源码：[驱动注册](https://github.com/deepseek-ai/deepseek-harness/blob/4b399c39a6d1479cd84ca591b4d7c88e24d38a96/packages/core/agent-loop/src/index.ts#L175) · [Turn 和 Step 的控制流](https://github.com/deepseek-ai/deepseek-harness/blob/4b399c39a6d1479cd84ca591b4d7c88e24d38a96/packages/core/agent-loop/src/agent.ts#L322-L418) · [工具执行](https://github.com/deepseek-ai/deepseek-harness/blob/4b399c39a6d1479cd84ca591b4d7c88e24d38a96/packages/core/agent-loop/src/agent.ts#L565-L605) · [事件体系](https://github.com/deepseek-ai/deepseek-harness/blob/4b399c39a6d1479cd84ca591b4d7c88e24d38a96/docs/architecture.md#turn-flow)

## 两套实现的差别会体现在哪里

| 产品问题 | Codex | DeepSeek Harness |
|---|---|---|
| 用户执行中补充条件，能否接着做？ | 核心在合适的采样边界处理当前轮的待输入，继续采样取决于模型后续需求和队列 | inbox 区分下一步输入与下一轮排队消息，驱动按轮内阶段分别领取 |
| 怎样给“快结束了”这一步加业务规则？ | Stop hook 可以阻止结束并提供明确的继续指令 | 默认驱动发表 `agent/turn-stopping`，之后再次检查下一步 inbox |
| 怎么对外描述执行进度？ | 普通任务有 TurnStarted 生命周期，近期 TUI 修复覆盖了 Stop hook 继续时实时显示与重放 | 持久事件明确区分 Turn 和 Step 起止，运行中扩展与持久事实有各自的事件 |

两边有个共同的产品原则：**用执行状态驱动界面，用业务工具的回执判断结果。** 例如写文件成功与文件通过检查是两个事实。最后一段文字只能汇报已有证据，执行器仍需决定是否继续。

## 迁移到个人出行 Agent 的一个决策

用户先说「帮我安排下班去杭州接人」，在规划途中补充「改到杭州东站，先别发到车上」。同样一句话，在不同执行时刻应有不同反馈：

- **路线方案还在生成**：修订当前计划，用新地点生成路线。进度改为「正在更新目的地」。
- **旧路线已生成，尚未下发**：将旧方案标记为过期，保留新的草稿，下发权限仍由用户控制。
- **旧路线已下发**：展示实际回执，明确哪条路线已经下发。撤回或覆盖由独立动作和回执确认。

PRD 可把三件事分别记录：新指令何时被接受、新计划何时生效、外部动作何时确认。验收至少覆盖三种时序：新指令在执行前到达、在外部请求途中到达、在外部回执后到达。量化时分别看「变更指令接纳率」「外部状态与界面一致率」「重复执行次数」以及「接纳到生效的耗时」。指标最好依据执行日志和工具回执计算。

## 默认分支近 24 小时更新

观察窗口约为北京时间 11 月 24 日 14:53 至 11 月 25 日 14:53。下列为选读，按默认分支可见提交核对。合入源码与用户端版本发布是两个时间点。

- **Codex · Stop hook 继续时恢复 Working。** 一段答案出现后可能先隐藏 Working，随后 hook 又让同一轮继续。修复用属于当前运行轮的 HookPrompt 恢复状态行，测试同时覆盖实时更新和历史快照重放。这正是本期主题的界面实例。[提交 #63736](https://github.com/openai/codex/commit/32f77f824d9e84e8cc7d16a836225c118c4f6a30)
- **Codex · 修复接纳中途指令后的误中断。** 后端已接纳指令但旧快捷键提示还在上一帧时，抑制一次由过期提示诱发的中断及按键重复。新的独立按键仍可中断。这是输入队列状态和界面刷新之间的竞态。[提交 #63784](https://github.com/openai/codex/commit/a6fadff7a2be56b2681f4784aab9741cfd15ec9d)
- **Codex · 附加上下文更易保留。** 一项变更持久化已渲染上下文的指纹与历史项 ID，帮助恢复后避免重复插入，并支持压缩后恢复活动条目。另一项把单个附加上下文值的截断阈值从 1,000 调到 10,000 tokens。需要区分单个条目的阈值和整个模型上下文窗口。[提交 #63769](https://github.com/openai/codex/commit/ff2ee6212c05e0e53eb97c47d49f4a9e952816a1) · [提交 #63843](https://github.com/openai/codex/commit/ba4e278273d3249c7846dec3b0d4dc5da56f9458)
- **DeepSeek Harness · 窗口内未查到默认分支新提交。** 当前查到的最新一条为 11 月 22 日北京时间 16:50 合入的 `0.2.3-alpha.2` 发布变更。[提交 #8961](https://github.com/deepseek-ai/deepseek-harness/commit/4b399c39a6d1479cd84ca591b4d7c88e24d38a96)
