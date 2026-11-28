# 第 04 期｜工具没回执，Agent 能说“失败，请重试”吗？

2026-11-28 · 约 8 分钟

用户说「把明天九点的个人提醒改到十点」。助手发出修改请求，连接在收到结果前中断。提醒可能已经改好，也可能没改成。直接显示「修改失败，点此重试」会让用户依据尚未确认的状态做决定。如果工具改约的实现包含取消旧提醒、创建新提醒两个动作，重试还可能重复创建。

**请求失败描述的是这次交互，业务失败描述的是外部状态。** 黑屏、超时、断线只告诉我们没收到可用的结果。产品需要区分能证明未执行、能证明执行失败、以及结果未知，并给每种状态配上不同的反馈和后续动作。

## Codex：工具错误可以回给模型，运行时错误可以结束处理

`ToolCallRuntime::handle_tool_call()` 等待工具执行路径返回。正常返回的工具结果被封装成响应项，`FunctionCallError::Fatal` 则升级成 `CodexErr::Fatal`。其余错误进入 `failure_response()`，通常转换为带同一 `call_id` 的输出。普通函数与自定义工具使用错误文本及 `success: Some(false)`。工具搜索的特殊分支返回空工具列表，协议状态为 `completed`。这三个分支说明，看到一次返回或者外层完成字段时，仍要按工具类型检查载荷与业务回执。[直接执行](https://github.com/openai/codex/blob/246e5bae5a370ab2ef7e379c2074ccd9f72817dc/codex-rs/core/src/tools/parallel.rs#L147-L197) · [失败输出](https://github.com/openai/codex/blob/246e5bae5a370ab2ef7e379c2074ccd9f72817dc/codex-rs/core/src/tools/parallel.rs#L498-L524)

在解析模型响应项时，也能看到类似分流。工具请求若可以当场构造一个给模型的回应，`stream_events_utils.rs` 将提示写入会话并标记需要后续处理。致命错误则向外返回。对已入队的执行，`drain_in_flight()` 把拿到的输出写入会话。代码还有明确的 `aborted_before_dispatch()` 分支，与执行中的用户中断采用不同表述。这里核对的是直接工具和相关中断路径，MCP、动态工具和其他适配器仍可能带有不同的领域语义。[入口分流](https://github.com/openai/codex/blob/246e5bae5a370ab2ef7e379c2074ccd9f72817dc/codex-rs/core/src/stream_events_utils.rs#L470-L503) · [结果写入](https://github.com/openai/codex/blob/246e5bae5a370ab2ef7e379c2074ccd9f72817dc/codex-rs/core/src/session/turn.rs#L3078-L3105) · [中断输出](https://github.com/openai/codex/blob/246e5bae5a370ab2ef7e379c2074ccd9f72817dc/codex-rs/core/src/tools/parallel.rs#L526-L546)

## DeepSeek Harness：给当场失败结构化结果，给缺失回执补保守结论

正常的工具执行路径中，`ToolsPipeline.dispatch()` 对工具及执行包装层的失败进行归类，`complete()` 在适用时执行后处理，再完成结果。通用的 `toolErrorResult()` 同时包含供消费方显示的内容、`isError` 和可能携带错误身份的结构化字段。取消路径能够区分工具体是否已经进入。包装层或后处理出错，可能使返回给模型的结果变成错误。外部动作是否已发生，仍要看调用证据。[执行及完成](https://github.com/deepseek-ai/deepseek-harness/blob/4b399c39a6d1479cd84ca591b4d7c88e24d38a96/packages/core/tools/src/pipeline.ts#L300-L383) · [错误结果结构](https://github.com/deepseek-ai/deepseek-harness/blob/4b399c39a6d1479cd84ca591b4d7c88e24d38a96/packages/core/tools/src/pipeline.ts#L732-L739)

更值得借鉴的是**执行中断后，怎样恢复会话历史**。`ToolCallRecovery.observe()` 顺序读取三种事实：助手请求了工具、Session 写下 `tool/call`、同一步写下配对的 `tool/result`。已经配对的调用会从待补集合移除。Step 失败时，默认驱动调用 `results()` 补齐剩下的结果，然后保留原始错误并结束 Step。[恢复追踪](https://github.com/deepseek-ai/deepseek-harness/blob/4b399c39a6d1479cd84ca591b4d7c88e24d38a96/packages/core/session/src/repair.ts#L105-L149) · [驱动补写](https://github.com/deepseek-ai/deepseek-harness/blob/4b399c39a6d1479cd84ca591b4d7c88e24d38a96/packages/core/agent-loop/src/agent.ts#L355-L385)

补写有两种含义：

| 日志证据 | 补写结果 | 业务解读 |
|---|---|---|
| 只有助手发出的调用请求，没有 `tool/call` 开始记录 | `TOOL_NOT_STARTED` | 在所读日志范围内未记录开始。分支是特殊情况，父会话可能在分叉点之后继续执行。 |
| 已记录 `tool/call`，缺少配对结果 | `TOOL_OUTCOME_UNKNOWN` | 现有记录无法确认外部动作结果。对可能产生副作用的操作，优先核对外部状态，只有满足操作语义的条件再考虑重试。 |

合成结果的错误码在 Session 事件里，给模型的说明在工具消息正文里。两处信息服务于不同的消费方。测试验证了恢复同时生成两个错误码，且已经有结果的调用不被改写。恢复机制还在会话分支场景换用更谨慎的提示，因为从分叉点继承的日志只涵盖一段前缀。[合成逻辑](https://github.com/deepseek-ai/deepseek-harness/blob/4b399c39a6d1479cd84ca591b4d7c88e24d38a96/packages/core/session/src/repair.ts#L151-L197) · [不同恢复原因的消息正文](https://github.com/deepseek-ai/deepseek-harness/blob/4b399c39a6d1479cd84ca591b4d7c88e24d38a96/packages/core/session/src/repair.ts#L20-L41) · [恢复测试](https://github.com/deepseek-ai/deepseek-harness/blob/4b399c39a6d1479cd84ca591b4d7c88e24d38a96/packages/core/session/tests/repair.spec.ts#L55-L80) · [保留已有结果测试](https://github.com/deepseek-ai/deepseek-harness/blob/4b399c39a6d1479cd84ca591b4d7c88e24d38a96/packages/core/session/tests/repair.spec.ts#L179-L210)

## 这两个实现怎么对应到同一个用户问题

| 产品判断 | Codex 所读路径 | DeepSeek Harness 默认驱动 |
|---|---|---|
| 已知的工具错误可以让模型处理吗？ | 非致命错误通常转换成与调用 ID 对应的输出。致命错误在该路径向上抛出。 | 当场的工具及处理管线失败可以形成结构化工具结果。仍须向上抛出的 Step 错误会进入恢复路径。 |
| 开始了却缺少结果时能说什么？ | 所读主链可区分调度前中止和用户中断。此次定位聚焦直接执行、响应项处理与已完成结果写入，未确认等价于另一侧通用恢复码的全仓机制。 | 在所查 Step 恢复路径中，通过已提交的调用和结果事件区分未记录开始与结果未知，并给后续模型请求补上结果。 |
| 一轮结束后还能相信什么？ | 已经写入并可恢复的工具结果能为下一轮提供依据。近期回归专门验证了中断时保护已经完成的结果。 | 已配对的结果保留，缺口可用合成错误结果补齐。合成结果表达日志证据的边界。 |

**共同点**是工具输出可以携带失败，后续模型依据该输出解释或恢复。**产品取舍**在于，清晰的失败分类需要额外维护调用关联、状态和恢复逻辑，但它能在等待超时、重新打开会话或换端时，减少重复动作和错误的完成播报。以上针对本期固定默认分支源码。

## 写进 PRD：修改提醒超时后先核对，再决定是否重试

用原提醒的稳定 ID 更新同一条记录。有服务端操作 ID 或幂等能力时，每个用户意图只创建一个操作 ID，同一操作的重试沿用该 ID。记录请求是否发出、是否收到明确回执以及状态核对结果。接到成功回执或可靠读回显示同一条提醒已改到十点时，产品可以确认目标达成。只有能关联到操作回执时，才将结果归因到这次修改。

| 验收时序 | 用户看到什么，系统做什么 |
|---|---|
| 客户端参数检查就拒绝，请求未发出 | 说明时间参数不合法，保留修改入口。 |
| 服务端明确拒绝更新 | 提示具体原因。若状态已确认，说明原提醒仍为九点。 |
| 服务端改好了，但成功回执丢失 | 短暂显示「正在确认修改结果」。按原 ID 查询，核实十点后更新卡片。 |
| 请求超时，状态查询也失败 | 显示「暂时无法确认是否已改到十点」并保留状态刷新入口。无可靠幂等机制时，不自动补发写入。 |
| 从另一个设备打开，旧状态和晚到的回执先后到达 | 用状态版本或操作 ID 对齐。无法确认顺序时重新读取来源，避免用旧记录覆盖已经确认的结果。 |

评估用三个指标：**误报完成率**用最终可核对的状态回放，统计显示成功但目标未达成的比例。**未知结果解决率及耗时**统计在观察窗口内经回执或状态查询确认的比例和 P95，同时保留仍未知的分母。**重复副作用率**按用户意图关联多次执行，检查是否出现重复提醒。这些指标把网络质量和用户最终结果放在两张可对应的表里。

## 近 24 小时默认分支更新

北京时间 11 月 27 日 09:48 至 11 月 28 日 09:48。下列为默认分支精选，具体安装版本需单独核对。

- **Codex #64341｜审批被拒绝或失败的命令，重启后也能查到。** 命令结束项从仅走实时流改为在核心持久化并发出。取消或拒绝记录为 `declined`，无效答复或审批请求失败记录为 `failed`。App Server 回归检查命令结束事件先于轮结束事件，重启后分页历史仍能返回同一项。[提交与测试](https://github.com/openai/codex/commit/6bf1e3e68765e1c91e031f692e2b918dcd10365c)
- **Codex #64368｜取消审批时，及时停止并行命令，同时保住已完成输出。** 写入拒绝历史也可能阻塞，因此先发取消信号，公布拒绝后才开启关闭宽限期。回归测试人为阻塞写入，验证进行中的同批命令能停止，已完成命令的输出能进入下一次模型请求。[提交与测试](https://github.com/openai/codex/commit/005a57e890a997faa0096b2729cddc3c8e4af537)
- **Codex #64346｜关掉会话时，等待已经在发布的启动失败记录落下。** 测试用工作目录不存在的命令制造启动失败，再中断并关闭会话，验证持久历史仍保存失败项。这和本期直接相关，重新打开会话时仍能知道哪一步失败。[提交与测试](https://github.com/openai/codex/commit/c8cb4e36ed39e49e837ab918e8aeeba9388f72b8)
- **DeepSeek Harness｜窗口内默认分支无新提交。** `master` 的最新可见提交仍是 11 月 22 日 16:50 的 `0.2.3-alpha.2` 发布变更。[当前提交](https://github.com/deepseek-ai/deepseek-harness/commit/4b399c39a6d1479cd84ca591b4d7c88e24d38a96)
