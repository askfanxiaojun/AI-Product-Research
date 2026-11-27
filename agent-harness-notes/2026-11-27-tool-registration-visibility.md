# 第 03 期｜接入了十个工具，这一步该给模型看几个？

2026-11-27 · 阅读约 8 分钟

用户对手机助手说「帮我找明下午半小时空档」。助手已经接入多个日历账号，工具箱有十几种日历操作。这一步需要知道授权日历的空闲时间。若把创建、编辑、取消邀请等操作都放进候选集，模型必须花精力区分一批当前用不到的动作。等用户真正说「就用三点，创建一条个人提醒」，候选工具才应该跟着变。

**工具注册回答“系统具备什么能力”。场景暴露回答“模型这一步能通过什么方式找到它”。执行时，业务端还要判断“此刻这个调用是否有效”。** 三个问题在源码里对应不同的判断位置，排查漏调用和误调用时也要分别看。

## Codex：构建工具计划，再决定每项工具从哪里被发现

`build_tool_router()` 先把内置工具、MCP 提供的工具、扩展和动态工具装入注册表，再运行 `finalize_tool_router()`。前两类注册函数所查路径在插入前就用 `ToolPolicy` 检查名称。这会影响后续既能直接看到什么，也能间接发现什么。只在最后删掉模型请求中的函数声明，无法替代这一步过滤。[入口](https://github.com/openai/codex/blob/ad0ab3d832ffe22e70321e7d219275aa25070b7f/codex-rs/core/src/tools/spec_plan.rs#L121-L187) · [注册过滤](https://github.com/openai/codex/blob/ad0ab3d832ffe22e70321e7d219275aa25070b7f/codex-rs/core/src/tools/registry.rs#L548-L638)

暴露计划进一步区分**直接声明、延迟发现、通过 Code Mode 间接调用**。例如 `build_model_visible_specs()` 取直接暴露的条目，`CodeModeOnly` 下部分嵌套工具会从直接列表隐藏。`finalize_tool_router()` 只有在模型支持搜索工具、策略允许搜索、且存在带搜索信息的延迟工具时，才建立这一按需发现入口。搜索处理器可返回工具定义信息。常规请求的 `build_prompt()` 使用 `model_visible_specs()`，开启增量工具路径时，顶层列表只保留仍需顶层声明的托管网页搜索。判断一次请求能看到什么，还要看当轮走的是哪条请求路径。[计划与搜索条件](https://github.com/openai/codex/blob/ad0ab3d832ffe22e70321e7d219275aa25070b7f/codex-rs/core/src/tools/spec_plan.rs#L368-L420) · [直接列表](https://github.com/openai/codex/blob/ad0ab3d832ffe22e70321e7d219275aa25070b7f/codex-rs/core/src/tools/spec_plan.rs#L627-L659) · [工具搜索结果](https://github.com/openai/codex/blob/ad0ab3d832ffe22e70321e7d219275aa25070b7f/codex-rs/core/src/tools/handlers/tool_search.rs#L243-L285) · [请求组装](https://github.com/openai/codex/blob/ad0ab3d832ffe22e70321e7d219275aa25070b7f/codex-rs/core/src/session/turn.rs#L2052-L2081)

源码中的回归测试同时检查注册项、模型可见项和 Code Mode 的工具映射。将允许列表设为空时，测试要求三者都为空。只保留指定工具时，会检查未允许的扩展、动态和托管工具是否消失。由此可见，**延迟发现是改变到达工具的方式，策略排除才会将工具从该计划的候选来源里去掉。** [回归测试](https://github.com/openai/codex/blob/ad0ab3d832ffe22e70321e7d219275aa25070b7f/codex-rs/core/src/tools/spec_plan_tests.rs#L499-L577)

## DeepSeek Harness：为每个步骤计算同一份获准工具集合

插件用 `ctx.tools.register(definition, { when })` 登记工具。登记与插件作用域绑定，能由返回的 disposer 注销。更具体的 Agent 作用域可以覆盖全局同名工具。默认驱动的 `preStep()` 捕获当前模型选择，然后在组装提示词前调用 `resolve({ agent, modelSelection, signal })`。注册时的 `when` 可以异步判断。返回 false 时，工具仍处于登记状态，但此次步骤不会获准。如果条件抛错，框架会报告工具启用检查失败，避免把故障悄悄降级成正常不可用。[注册与条件解析](https://github.com/deepseek-ai/deepseek-harness/blob/4b399c39a6d1479cd84ca591b4d7c88e24d38a96/packages/core/tools/src/index.ts#L121-L152) · [步骤入口](https://github.com/deepseek-ai/deepseek-harness/blob/4b399c39a6d1479cd84ca591b4d7c88e24d38a96/packages/core/agent-loop/src/agent.ts#L286-L301) · [作用域与条件判定](https://github.com/deepseek-ai/deepseek-harness/blob/4b399c39a6d1479cd84ca591b4d7c88e24d38a96/packages/core/tools/src/index.ts#L239-L296)

解析得到的 `ResolvedToolSet` 同时参与工具描述装配和调用执行。提示词侧由选定执行器根据获准定义生成描述，调用侧在查找执行目标时使用这份集合。一次 Step 内的重试复用选择。执行前仍会检查原登记是否还生效。若原工具被注销，即使已经注册了同名的新工具，旧集合也不能调用新工具。实际测试分别覆盖了切模型后对历史工具名的调用、异步条件运行途中注销和同名替换。[装配入口](https://github.com/deepseek-ai/deepseek-harness/blob/4b399c39a6d1479cd84ca591b4d7c88e24d38a96/packages/core/tools/src/index.ts#L110-L117) · [执行入口](https://github.com/deepseek-ai/deepseek-harness/blob/4b399c39a6d1479cd84ca591b4d7c88e24d38a96/packages/core/agent-loop/src/agent.ts#L574-L587) · [调用查找](https://github.com/deepseek-ai/deepseek-harness/blob/4b399c39a6d1479cd84ca591b4d7c88e24d38a96/packages/core/tools/src/pipeline.ts#L71-L110) · [切换模型测试](https://github.com/deepseek-ai/deepseek-harness/blob/4b399c39a6d1479cd84ca591b4d7c88e24d38a96/packages/core/agent-loop/tests/tool-updates.spec.ts#L122-L152) · [注销与替换测试](https://github.com/deepseek-ai/deepseek-harness/blob/4b399c39a6d1479cd84ca591b4d7c88e24d38a96/packages/core/tools/tests/activation.spec.ts#L118-L142)

## 同一产品问题，两套机制关注什么

| 问题 | Codex 所读路径 | DeepSeek Harness 默认驱动 |
|---|---|---|
| 怎么控制模型先看到哪些工具？ | 先形成注册表和暴露计划，再构造直接可见的规格。符合条件的工具可以通过搜索发现或经 Code Mode 访问。 | 按 Agent 作用域和步骤条件解析工具，再由选定执行器根据获准定义生成描述。 |
| 当前条件不满足会怎样？ | 允许列表过滤发生在工具进入所查注册路径时。延迟暴露则保留间接发现的可能。 | `when` 为 false 的工具不会出现在该步的有效集合。模型从历史记得工具名，也不能靠旧名称调通。 |
| 哪些配置会改变观测结果？ | 模型是否支持搜索工具、工具模式、策略和增量工具路径都会改变请求。 | 生效的插件和 Agent 作用域、步骤模型选择、执行器都会影响工具集合或展示方式。框架还支持保留 `deferLoading` 标记，实际延迟加载由适配器和模型链路决定。 |

两边都有把工具描述和执行能力分开的机制，本期对照的是各自最清晰的一条实现路径。Codex 适合用来理解大工具目录里的直接曝光与间接发现。DeepSeek Harness 适合用来理解按步骤选择工具，以及同一份选择如何约束后续执行。以上结论取自当前默认分支的固定提交。[Codex 暴露判定](https://github.com/openai/codex/blob/ad0ab3d832ffe22e70321e7d219275aa25070b7f/codex-rs/core/src/tools/router.rs#L207-L239) · [DeepSeek Harness 延迟声明边界](https://github.com/deepseek-ai/deepseek-harness/blob/4b399c39a6d1479cd84ca591b4d7c88e24d38a96/packages/core/tools/README.md#known-limitations-and-deferred-work)

## 写进 PRD：日历查询只装配当前阶段所需工具

把一次「找可用时间」拆成两段。**查询阶段**默认装配只读的 `get_free_busy`，按已授权账号和日期查询。助手返回可用时间后，这次查询即完成。**创建阶段**由用户明确表达创建意图触发，再装配对应写入工具。服务端发回创建成功的业务回执后，才显示已创建。若多个账号只有部分可读，可以返回可验证的部分结果，同时标明「已检查个人日历，工作日历暂不可用」，避免把未查询时段标成空闲。

| 验收用例 | 预期 |
|---|---|
| 只说「找个空档」，旧会话里出现过创建工具 | 请求中只有当前场景所需能力，旧工具名称也无法触发写入。 |
| 装配完成后、查询发出前撤销某日历账号授权 | 被撤销账号的查询会在业务端拒绝。若其余账号可查，结果明确表示覆盖范围。 |
| 列出空档后，用户要求创建个人提醒 | 下一阶段装配适当写入工具。只有收到成功回执才显示创建完成。 |
| 工具条件检查超时或报错 | 界面明确说明该来源未能查询，保留可用结果。 |

评估可以同时看**选错工具率、应该可用的工具缺失率、请求中工具定义的 token 数、任务成功率**。例如减少 schema 体积后，若创建阶段的工具缺失率上升，就要检查场景识别和装配边界。授权错误调用则单独统计被挡住的次数与成功执行的次数，以区分模型选择质量和执行层约束。

## 近 24 小时默认分支更新

北京时间 11 月 26 日 09:07 至 11 月 27 日 09:07。以下是默认分支提交精选，已安装版本的行为需按版本核对。

- **Codex #64052｜工具发现尊重每个执行环境的插件设置。** 在执行器能力发现 V2 中，同一个插件装在多个环境时，单环境禁用只影响对应安装，会话级排除则跨环境生效。变更还保留显式排除关联的连接器映射，供 Apps 工具搜索使用。回归检查覆盖禁用范围和连接器抑制。这与本期直接相关，工具可发现范围跟执行环境有关。[提交与测试](https://github.com/openai/codex/commit/963d4f57179b579bc24d5270019e857a80a7f0de)
- **Codex #64221｜MCP 正在启动时，终端仍能显示正确任务状态。** 启动连接曾可能提前显示 Working，重载也可能暂时盖掉尚未确认的 Done。修改后用用户任务、目标、阻塞和已有结果判定状态，回归覆盖启动期与重载期。对集成界面而言，连接准备状态和用户任务状态可以各自有明确来源。[提交与测试](https://github.com/openai/codex/commit/c587ff1f0b2bfc083deb2224319c2a1e3fd55612)
- **Codex #64193｜隐藏的推理摘要不再切断终端中的工具调用分组。** 快照测试确认，一次已结束和一次进行中的命令仍可出现在同一个两条调用的分组中。这次调整发生在终端展示层，帮助用户读懂实际执行进度。[提交与快照](https://github.com/openai/codex/commit/f22991559734f2d7e0c1306a741fcfe9e08565f4)
- **DeepSeek Harness｜该窗口内无默认分支新提交。** `master` 仍指向 11 月 22 日 16:50 合入的 `0.2.3-alpha.2` 发布变更。[当前提交](https://github.com/deepseek-ai/deepseek-harness/commit/4b399c39a6d1479cd84ca591b4d7c88e24d38a96)
