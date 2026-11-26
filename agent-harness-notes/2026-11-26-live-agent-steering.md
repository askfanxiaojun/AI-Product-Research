# 第 02 期｜执行中改口，Agent 什么时候听进去？

2026-11-26 · 阅读约 8 分钟

你让出行助手比较三个停车场。它还在等地图服务，你补了一句「只看有充电桩的」。屏幕马上出现这句话，但几秒后第一批查询结果仍包含没有充电桩的停车场。这里有三个可独立验证的时刻：**系统接收输入、模型看到输入、业务结果采用输入。** 这三个时刻相隔多久，决定了用户觉得自己是在指挥一个正在工作的人，还是在给一个还没空看的客服留言。

## Codex：先校验你指定的轮次，再在合适的请求边界交给模型

1. **提交。** App Server 的 `turn_steer_inner` 要求传入 `expected_turn_id`，然后调用 `steer_turn`。核心 `Session::steer_input` 持有活动轮锁，校验是否有可转向的普通轮、ID 是否匹配、输入是否为空等。普通轮通过后，核心把输入写入该轮的 pending queue，通知队列活动，并返回轮 ID。Review 和 Compact 都有明确的拒绝分支。对集成方来说，这个回执能证明目标轮接纳了消息。它没有承诺模型已经处理，也没有承诺在该轮无法接纳时会自动另开一轮。[App Server 入口](https://github.com/openai/codex/blob/5148e3d6421c3adb9991b712b85f973ac33b9e50/codex-rs/app-server/src/request_processors/turn_processor.rs#L1184-L1268) · [核心校验与入队](https://github.com/openai/codex/blob/5148e3d6421c3adb9991b712b85f973ac33b9e50/codex-rs/core/src/session/turn_input.rs#L1064-L1176)
2. **投递。** `run_turn` 在允许取队列输入时调用 `get_pending_input`，运行输入 hook，记录通过检查的输入，再组装采样请求。新轮刚开始时先采样首条输入。源码还规定，一些自动压缩后的模型或工具续跑会延后队列提取。这意味着「下一次采样就看到」也取决于执行边界。测试 `injected_user_input_triggers_follow_up_request_with_deltas` 用受控时序确认第二条输入没有出现在已发出的第一份请求，而出现在第二份请求。[取队列与组装](https://github.com/openai/codex/blob/5148e3d6421c3adb9991b712b85f973ac33b9e50/codex-rs/core/src/session/turn.rs#L547-L674) · [输入 hook](https://github.com/openai/codex/blob/5148e3d6421c3adb9991b712b85f973ac33b9e50/codex-rs/core/src/session/turn.rs#L1207-L1257) · [模型请求测试](https://github.com/openai/codex/blob/5148e3d6421c3adb9991b712b85f973ac33b9e50/codex-rs/core/tests/suite/pending_input.rs#L1281-L1369)
3. **例外与界面策略。** 有些等待型工具可被输入唤醒，例如测试覆盖的 `wait_agent` 路径，随后新输入进入后续模型请求。这个能力依赖等待点配合。另一方面，所查 TUI 提交流程在遇到过期轮 ID 时可对服务端给出的实际轮 ID 重试一次，活动轮消失时清除旧轮 ID 并退出这段处理。这是客户端策略，集成方可以根据消息是否仍适用，决定要不要重试。[等待工具测试](https://github.com/openai/codex/blob/5148e3d6421c3adb9991b712b85f973ac33b9e50/codex-rs/core/tests/suite/pending_input.rs#L755-L835) · [TUI 竞态处理](https://github.com/openai/codex/blob/5148e3d6421c3adb9991b712b85f973ac33b9e50/codex-rs/tui/src/app_server_session/user_message_submission.rs#L223-L268)

## DeepSeek Harness：先给输入选队列，再由步骤领取并接纳

1. **路由。** 默认 `ReactLoopAgent` 的 `steer()` 指向 `next-step` 并唤醒驱动，`followup()` 指向 `next-turn` 并唤醒驱动，`inject()` 也进入 `next-step`，但本身不唤醒。运行中的驱动会自行消费队列，空闲时唤醒会启动驱动。如果正在收尾的活动已被取消，能唤醒的输入改投 `next-turn`。这些方法体现的是默认驱动的接口语义。不同客户端是否把所有入口呈现给用户，要看其各自调用方式。[默认驱动入口与唤醒](https://github.com/deepseek-ai/deepseek-harness/blob/4b399c39a6d1479cd84ca591b4d7c88e24d38a96/packages/core/agent-loop/src/agent.ts#L168-L255)
2. **领取。** inbox 的活动状态由 Session 的 `agent/inbox/spliced` 事件折叠而来。轮内 `claim()` 领取当前所有下一步消息。若在新轮边界，还会取至多一条下一轮消息。逐消息的 `agent/inbox/claimed` 表示消息已经出队。它与普通移除不同，后者会标为取消。待处理消息可以按 ID 替换或删除，已被领取的消息找不到对应队列位置时，这些方法返回 `false`。投影拒绝两条待处理列表间重复的消息 ID，适用范围是当下的 pending inbox。[投影规则](https://github.com/deepseek-ai/deepseek-harness/blob/4b399c39a6d1479cd84ca591b4d7c88e24d38a96/packages/core/agent-loop/src/inbox.ts#L25-L54) · [领取及待处理编辑](https://github.com/deepseek-ai/deepseek-harness/blob/4b399c39a6d1479cd84ca591b4d7c88e24d38a96/packages/core/agent-loop/src/inbox.ts#L102-L155) · [事件写入](https://github.com/deepseek-ai/deepseek-harness/blob/4b399c39a6d1479cd84ca591b4d7c88e24d38a96/packages/core/agent-loop/src/inbox.ts#L206-L228)
3. **接纳并发给模型。** `preStep()` 先领取，再让 `agent/pre-step` 扩展点检查这一批消息。扩展可拒绝或改写输入。通过检查后，准备模型请求的过程还可能被取消。只有到首次尝试真正写入 `user/message`，随后由 `deriveMessages()` 生成并冻结请求消息列表，接纳后的内容才确定进入该次请求的消息快照。能看见领取事件的 UI 因此还需要另一个正面信号来确认投递。[领取与扩展检查](https://github.com/deepseek-ai/deepseek-harness/blob/4b399c39a6d1479cd84ca591b4d7c88e24d38a96/packages/core/agent-loop/src/agent.ts#L286-L315) · [写入与发送](https://github.com/deepseek-ai/deepseek-harness/blob/4b399c39a6d1479cd84ca591b4d7c88e24d38a96/packages/core/agent-loop/src/agent.ts#L431-L484) · [请求快照](https://github.com/deepseek-ai/deepseek-harness/blob/4b399c39a6d1479cd84ca591b4d7c88e24d38a96/packages/core/agent-loop/src/agent.ts#L714-L732)

## 同一个场景，两种接口默认值

| 问题 | Codex 所读路径 | DeepSeek Harness 默认驱动 |
|---|---|---|
| 指令必须归属原活动轮吗？ | 显式 `turn/steer` 用期望轮 ID 校验，过期可以返回错误，由调用方决定如何处理。 | `steer` 表达下一步投递意图。驱动已取消时，唤醒型输入可改投下一轮。 |
| 一条消息何时能给模型看？ | 待输入取出、通过 hook，并被组装进后续采样请求时。 | inbox 领取、通过 `pre-step`、写入会话，并进入冻结的模型请求时。 |
| 能立即停下正在做的事吗？ | 取决于执行路径。所读代码证实某些等待工具能提前退场，也证实普通续跑可等到下个采样边界。 | 默认 `steer` 写入 inbox，运行中的驱动在适当边界取出。主动 `cancel` 有独立入口。 |

**设计取舍。** 如果指令只对某个活动任务有意义，例如「只看有充电桩的」，绑定任务能防止它串到另一个正在处理的请求。如果指令本身是完整的，例如「再帮我找附近咖啡店」，允许在下一轮执行能减少用户重说一次。两者都可以使用同一段对话界面，底层应分别表达归属和投递时机。上述结论基于 11 月 26 日核对的 Codex `main` 与 DeepSeek Harness `master` 源码，具体发布版本和宿主界面可能采用不同路径。

## 放进 PRD：执行中追加筛选条件

以「只看有充电桩的停车场」为例，让每个搜索任务持有任务 ID 和当前约束版本。当用户追加条件时，把输入关联到原搜索任务，并给出「收到，正在筛选有充电桩的停车场」这一类进度反馈。业务层接纳后提交新版约束。随后每个工具查询和结果发布都带上约束版本。旧查询如果仍在途中，可以让它回完；只有在旧结果能被可靠地重新过滤时才复用。界面在新版结果就绪后更新列表。如果没有符合条件的结果，也要明确告诉用户，防止出现旧列表被当作新筛选结果的情况。

| 验收时序 | 预期 |
|---|---|
| 地图查询尚未发送时收到新条件 | 首次查询即使用新约束，用户无需再发一遍。 |
| 旧查询已经发出，新查询比旧查询先回来 | 界面发布新版结果，旧回包迟到时不覆盖。 |
| 用户切到另一个出行任务后，旧任务才收到延迟指令 | 按任务 ID 隔离这条指令，并告知原任务已结束或已更新。 |
| 指令收到后，被输入规则拒绝或查询失败 | 显示实际失败状态，保留可恢复的操作入口，不显示「已筛选」。 |

埋点分三段：**提交→入队、入队→请求包含新约束、请求包含新约束→结果生效**。分别看 P50/P95，再监测过期结果覆盖率、跨任务错误归属率和未生效却报告完成的比例。一个常见误判是只看消息已送达的比例：传输可靠，也可能出现界面公布旧结果。

## 近 24 小时默认分支更新

核对窗口为北京时间 11 月 25 日 09:56 至 11 月 26 日 09:56。以下为默认分支提交精选，是否已进入你安装的版本需按版本另行核对。

- **Codex #64002｜启动与挂起撞车时保住首条输入。** 启动如果在等待宿主环境列表期间被挂起，清理可能漏掉尚未记录的原始输入。变更把它暂存在共享 `TurnContext`，恢复路径能取得它，并用活动轮锁协调只有一个路径认领。与本期相关的是接收之后的移交时序，提交针对首条输入。[提交及差异](https://github.com/openai/codex/commit/44d359767fa12b5c75f0b6f57a5c795428c3ec6f)
- **Codex #64018｜流式输出期间仍可看到中断提示。** 工作状态行隐藏时，在输入区显示中断快捷键。非分阶段消息完成后，如果执行仍在继续，则在满足流队列条件时恢复状态。测试覆盖纯空白流和窄屏。它改进了用户看到的中断入口，运行中指令的投递规则见上文。[提交及测试](https://github.com/openai/codex/commit/58b14699ec8dcd9f6efd27ef776036c2ae1b943b)
- **Codex #64015｜后台命令可以在原轮结束后补报结果。** 终端继续跟踪后台命令，在可更新的会话视图中补到原记录。原记录已经打印到滚动历史时可追加结果，未打印时可替换队列中的启动记录。回归覆盖中断后返回及侧边会话切换。产品上，它说明会话轮结束后仍可能收到有效的外部结果。[提交及测试](https://github.com/openai/codex/commit/ad07f04e470afd3ed700d591c58f8ab7ae57b94f)
- **DeepSeek Harness｜窗口内无默认分支新提交。** `master` 的 HEAD 仍为 11 月 22 日 16:50 的 `0.2.3-alpha.2` 发布变更。[当前 HEAD](https://github.com/deepseek-ai/deepseek-harness/commit/4b399c39a6d1479cd84ca591b4d7c88e24d38a96)
