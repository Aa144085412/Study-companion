# TASKS.md — 共享任务表（codex + claude code）

> 规则见 `COLLAB.md`。认领前先读本表：`status=doing` 且 owner≠你的条目**不要碰**。
> 状态取值：`open`（待认领）/ `doing`（进行中）/ `blocked`（等外部条件）/ `done`（已验证完成）。
> 完成定义=相关验证通过 + `CONTEXT.md` 已更新 + 已 commit。

## 待认领（open）

- **T12 · OCR 应用内集成** — open · owner: 待确认
  - OCR worker 与测试素材已由另一 agent 提交于 f5c71fd；T15 已完成小红书图文的命令行 OCR → 文本资料导入。应用内图片/PDF 上传、OCR 任务队列与校对定位仍待实现；不重复改写 worker。
- **T13 · 长文上下文与来源映射** — open · owner: —
  - 当前共读来源仅 1800 字符、笔记前 800 字符，简单关键词排序。应按模型能力设计预算、全篇分段整理和稳定笔记块来源关联，补长资料覆盖测试。
- **T14 · 交付验收与数据恢复** — open · owner: —
  - 真实材料 20 问验收、备份恢复、工作台集成尚未完成；删除当前是实际删除，恢复能力与计划书要求仍有差距。


- **T8b · 实验 skill 铺开（垂直切片之后的下一步，待用户拍板）** — `open` · owner: —
  - T8 垂直切片已收口（见 done）。铺开方向：①多个 skill + 按问题自动路由到最相关 skill；②"步骤陪跑"checklist 式跟跑（而非纯问答）；③录音/录视频入口 + 音视频→笔记→skill 一键管线打通；④skill 在 app 内可视化编辑（现靠手改 `skills/*.md`）。
- **T3 · 真实脱敏实验样例替换** — `open` · owner: —
  - 用真实脱敏的实验规程/讲义替换当前自造 DH5α 转化规程（M0 剩余项）。
- **T5 · 长任务断点续传（可选）** — `open` · owner: —
  - 现状：中断后重试从头转写。若做：记录已转写到的时间点/段落，resume 从中断处继续。文件越长越值得。

## 阻塞（blocked，等用户/外部）

- **T2 · FunASR vs faster-whisper 引擎对比** — `blocked` · owner: —
  - 需用户决定是否安装 FunASR，再用真实录音做 A/B 对比（M0 剩余项）。

## 用户自理（真实使用时顺手）

- **T4 · A06 十片段手工 UI 复核** — `open` · owner: 用户
  - 在真实使用里手工选取 10 个片段，确认回放时间戳定位准确。

## 已完成（done）

- **T26 · 修复抖音"两个源"重复 + 知识总结产出模式 + 全局「Skill 库」面板（列表 + 资源管理器打开）** — done · owner: claude code · 2026-10-10
  - 起因：用户「抖音视频学习资料为什么有两个源？不对」+「有时需求是**抖音知识总结**，写成 skill 方便调用」+「没有 skill 文件列表，像 claude code desktop 那样从列表选 open in explorer」。
  - **修重复源**：`POST /api/sources` 文本分支加规范化 hash（sha256，运行时间戳 `\b\d{8}-\d{6}\b`→`TS`，复刻 `/api/upload` 口径），同 notebook 同 kind 同 hash → `duplicate:true`+既有 id（200，不新增）；数据层清掉抖音本那条重复源（保留最早 createdAt，备份 `store.json.bak-dedup`，停 8765→改→重启）。
  - **知识总结模式（skill kind）**：`parseSkillMeta` 认 `kind:`；`generateSkillForNotebook(id, kind)` 用 `SKILL_PROMPTS[kind]`（experiment 原模板 / knowledge 新模板：什么时候用/核心要点/关键概念/知识要点/方法流程/常见误区/来源，参考专业 SKILL.md 写法，未知标"待核对"）；`POST /api/agent/skill {kind}` 按 kind 复用/重生成 + `result.skill.kind` 回传 + 类型标签；`url_pipeline.py`·`experiment_pipeline.py` 加 `--kind`；Agent dialog 加「产出类型」下拉。
  - **Skill 库面板**：后端 `GET /api/skills/list`（扫 `skills/*.md` 解析 frontmatter）+ `POST /api/skills/reveal {name}`（`[a-z0-9-]` 校验 + win32 `explorer /select`/darwin `open -R`/其他 `xdg-open`）；前端侧栏「📚 Skill 库」按钮 + `#skillsDialog`（`#skillLibrary` 卡片 +「在资源管理器中显示」）。
  - 验证：`node --check server.mjs public/app.js` 过；python `ast` 过；`npm test` **33/33**（新增 3 项：文本源去重 / kind=knowledge 独立于 experiment / skills list meta）无回归。浏览器活体（单实例 8765，预览面板）：抖音本「学习资料 1」、dialog「产出类型」下拉在位、Skill 库列 3 skill 带 meta、点「在资源管理器中显示」→ `POST /api/skills/reveal` 200。
  - 诚实边界：抖音本自身 skill `skills/multi-ai-agent-concurrency-conflict-prevention.md` 当前**不在磁盘**（会话前已 `D`、仍 track 于 HEAD），故不在 Skill 库列出，待用户决定是否恢复。用户新方向「agent 可安装自己的 agent / 自写 skill 只在 pre-queue / 使用时调度去 skill-queue」语义未定，待澄清另立项。
  - 提交：本地 commit（`server.mjs`、`public/index.html`、`public/app.js`、`public/style.css`、`scripts/url_pipeline.py`、`scripts/experiment_pipeline.py`、`tests/agent-skill.test.mjs`、`CONTEXT.md`、`TASKS.md`），**未 push**（push 需用户授权）。既有删除 `skills/multi-ai-agent-concurrency-conflict-prevention.md` 未纳入。

- **T25 · 彻底删除「实验指导」功能 + 修复抖音笔记本乱码** — done · owner: claude code · 2026-10-10
  - 起因：用户「解决乱码问题，此外实验指导是一个冗余的功能，彻底删除」。截图=抖音笔记本标题/来源文件名乱码（U+FFFD）。
  - 删除「实验指导」（后端+前端+测试+遗留数据）：`server.mjs` 删 `GET /api/skills`、`POST /api/skill-ask`、`POST /api/skills/generate` + `listSkills()`/`readSkill()`（**保留** `/api/agent/skill` 及助手，它是管线产出 skill 的核心交付物）；前端删「实验指导」tab/面板 + 全部 skill 问答 JS + CSS；删 `tests/skill.test.mjs`、`tests/agent-skill.test.mjs` 去 `/api/skill-ask` 子断言；清 `db.messages` 全部 `type:'skill'` 遗留记录。
  - 修复乱码（根因=旧编码路径残留，**当前代码已验证干净**）：隔离字节级 round-trip 测试 + 真实 `url_pipeline.py` 活体探测均证当前管线产出干净中文；乱码笔记本 `e4f8c0dc` 是编码修复前残留，乱码只落 3 个显示字符串（笔记本标题+2 来源标题），正文全干净。停 8765 → 程序化修 3 个标题（复刻 `slug()`/`[:40]`）→ 原子写（同 `save()` 格式）→ 重启。
  - 验证：`node --check server.mjs public/app.js` 过；`npm test` **30/30**（删 `skill.test.mjs` 无回归，`/api/agent/skill` 5 项仍绿）；浏览器活体（预览面板单实例）：抖音本标题/来源/正文干净、「实验指导」tab 消失（tablist 仅剩 共读/学习资料/疑问清单）。
  - 诚实边界：全库另剩 **1 条**乱码消息=「酵母转化」本里用户手打的共读提问（`type=chat`，100 个 U+FFFD，字节已丢失无法复原），属用户自有数据，留待用户决定（重发/删除），不擅自处理。
  - 提交：本地 commit（`server.mjs`、`public/index.html`、`public/app.js`、`public/style.css`、`tests/agent-skill.test.mjs`、删 `tests/skill.test.mjs`、`CONTEXT.md`、`TASKS.md`），**未 push**（push 需用户授权）。

- **T24 · 多源 URL 入口：微信公众号图文 / 抖音·小红书视频 → 导入 → 笔记 → skill（含视频音轨转写 + 画面关键帧）** — done · owner: claude code · 2026-10-10
  - 起因：用户「现在的信息源只有小红书，微信公众号图文、抖音视频和小红书视频也有很多优质内容，在 github 上找能摘抄公众号图文、提取抖音/小红书视频**音频**信息的工具，方便让大模型总结；如果能理解视频**画面**并对音频做补充更好」。要点：①扩信息源到 微信图文/抖音视频/小红书视频；②用成熟开源工具（yt-dlp / 纯标准库抓取）拿素材；③视频取**音轨**转成文本供 LLM 总结，并抽**关键帧**让视觉 LLM 理解画面、对音频做补充（多模态）。
  - 方案（后端端点 + 3 个标准库/工具驱动 + 前端入口）：
    - **后端 `server.mjs`** 新增 **`POST /api/agent/media {source, url, goal?, cookieFile?}`**：校验 `source ∈ {douyin, xhs-video, wechat}`（否则 400）、`url` 为 http(s)（否则 400）；`goal`≤40 字可选、`cookieFile` 可选；建 `db.agentRuns` 记录（`kind:'pipeline'`, `mode:'url'`, `source`, `goalLabel=<源>→笔记→skill`）→ **spawn** `scripts/url_pipeline.py`（`.venv-ocr` python，`--source --url --api --run-id [--goal] [--cookie-file]`，`detached`）→ 202 `{runId, source}`。复用既有 `POST /api/agent/pipeline/:runId/result` 回调与 `GET /api/agent/runs`（无新过滤需求，`source` 随 run 落库）。
    - **`scripts/url_pipeline.py`**（新，纯标准库驱动，仿 `experiment_pipeline.py`）：按 `--source` 分派——`wechat`→`fetch_wechat.py`（系统 python）；`douyin`/`xhs-video`→`download_media.py`（`tools/.venv-dl` python）。得产物后复用服务端 API：建/找笔记本（标题 `<源标签> · <goal或推导>`，成功抓取后才建本）→ `POST /api/sources` 导入 → 视频先 `POST /api/transcribe`（wav base64）转写音轨 → `POST /api/generate`+`/api/notes` 整理笔记 → `POST /api/agent/skill` 生成 skill；报告落 `data/pipeline/<source>-<netloc>.report.json` 并回写 `/result`。**视频资料**正文=音轨转写+标题/作者/时长/原文链接，末行 `图片目录：<frames>` 供视觉 LLM；**微信资料**=Markdown 图文，末行 `图片目录：` 供视觉。
    - **`scripts/fetch_wechat.py`**（新，stdlib urllib+html.parser）：单篇 `mp.weixin.qq.com` URL → 提取 title/author/date，`#js_content` 转 Markdown（`![图N](img/NN.jpg)`），带 `Referer: https://mp.weixin.qq.com/` 下图 → `data/wechat/<slug>/article.md`（末行 `图片目录：`）。
    - **`scripts/download_media.py`**（新，yt-dlp+ffmpeg）：①yt-dlp 下载视频+info.json（必需，`bv*+ba/b`）；①b 字幕**尽力**补（zh-Hans/zh-CN/zh/en，独立 pass，失败仅 warn 不中断——**与视频下载解耦**，避免字幕 429 拖累必需的视频下载，音轨转写才是主文本源）；②ffmpeg 抽 16kHz 单声道 WAV（供 faster-whisper）；③ffmpeg 抽 N 关键帧（`fps=1/<step>`，供视觉 LLM）。`--source` 仅为标签，实际下载由 yt-dlp 完成。
    - **前端**（`index.html`/`app.js`/`style.css`）：`#agentDialog` 加 `#agentSource` 下拉（keyword/wechat/douyin/xhs-video），URL 模式显示 `#agentUrl`（隐藏 keyword 的 `#agentGoal`/`#agentCrawl`）；`startAgentPipeline()` 按 source 路由——非 keyword 走 `/api/agent/media`，keyword 走既有 `/api/agent/pipeline`；`renderAgentReport` 渲染 source-aware steps + `report.url`。
  - **活体发现并修 1 处确定性前端 bug**：`#agentGoal` 在 HTML 带静态 `required`，切到 URL 模式后该隐藏字段仍必填 → 表单提交被浏览器拦截、无法发 URL。改 `syncAgentMode()` 动态切换 `agentGoal.required`（keyword 模式）/`agentUrl.required`（URL 模式）后 URL 提交正常。
  - 验证：`node --check server.mjs public/app.js` 过；`npm test` **37/37**（新增 5 项 media：非法 source 400 / 非法 url 400 / 合法 media run→202+驱动参数 `--source/--url/--api/--run-id` 正确+run 落库(kind=pipeline,source=url-mode,running) / `--goal`+`--cookie-file` 透传 / `/result` 回调翻 done。既有 32 项无回归）。**浏览器活体（单实例 8765，预览面板）**：dialog 打开、`#agentSource` 切换 keyword↔URL 字段显隐正确（含 required 修复）、提交 → `POST /api/agent/media` 202 → run 创建 → 轮询；**完整微信图文管线活体跑通**：`fetch_wechat.py` 抓取 → 导入 424 字资料 → 建「微信实验学习 · …」笔记本 → 整理笔记 → 生成 skill（诚实判「unidentified-experiment-pending-review」+ 9 项待核对 gap，不臆造）→ 回调 run `done`，全程无失败请求。
  - 边界（如实）：①抖音/小红书视频**下载路径本轮未活体跑**（无真实抖音/小红书视频 URL；小红书需登录 cookies.txt）——已验证 yt-dlp Douyin/XHS 提取器已装于 `tools/.venv-dl`、ffmpeg 抽音轨+关键帧命令在合成视频上验证通过、完整编排经微信活体证明；②音轨转写依赖本地 faster-whisper（`/api/transcribe`），无有效语音/识别服务不可用时正文标「转写为空」不臆造；③不做反爬绕过，需登录站点用 `--cookie-file`，失败如实上报 failed；④skill 仍受 1800 字符共读预算限制（open T13），视频转写长文同样受限；⑤`data/store.json` 中两条指向已删测试笔记本的孤儿 agentRun 已清除，余下 agentRun 均指向现存笔记本。
  - 提交：本地 commit（`server.mjs`、`public/index.html`、`public/app.js`、`public/style.css`、`tests/agent-pipeline.test.mjs`、`scripts/url_pipeline.py`、`scripts/download_media.py`、`scripts/fetch_wechat.py`、`TASKS.md`、`CONTEXT.md`），**未 push**（push 需用户授权）。`.claude/launch.json` 临时预览改动已还原未纳入。

- **T23 · 实验 Agent 层级修正（移出并列 tab → 侧栏 dialog）+ 去除实验指导冗余「从当前笔记生成 skill」按钮** — done · owner: claude code · 2026-10-10
  - 起因：用户反馈「实验agent 不应该和另外三个并列，**层级错误**」——T22 把实验 Agent 做成工作区第 5 个并列 tab，但它其实是**跨笔记本的编排入口**（给关键词自动建本+导入+skill），不应与某个笔记本内的四个视图 tab 同级；另「实验agent 就能完成 skill 的闭环，实验指导中的『从当前笔记生成 skill』**冗余了**」——T20 的生成按钮与 Agent 管线末端的 skill 产出重复。目标：把实验 Agent 降到侧栏触发的 dialog（与设置/新建笔记本等 dialog 同层级），并删掉「实验指导」里冗余的 genSkill 按钮。
  - 方案（纯前端，零后端改动、零新依赖）：
    - `public/index.html`：① tablist 删掉第 5 个 `data-tab="agentRun"` 按钮（恢复为 4 tab：共读/学习资料/疑问清单/实验指导）；② 侧栏 `nav-label` 行后加 `<button id="agentOpen" class="agent-open">⚙ 实验 Agent · 一键整理</button>`；③ 原 `#agentRun` panel 移除，改在 dialog 区放 `<dialog id="agentDialog">`（内含原 `#agentForm`：goal/crawl 输入 + `#agentStart` + `#agentState` + `#agentLog` + `#agentReport`），与设置/新建本等 dialog 同级；④ `#skillGuide` panel 删掉 `#genSkill` 按钮（保留 skill 下拉 + 问答区）。
    - `public/app.js`：删除 `$('genSkill').onclick` 整块（原「从当前笔记生成 skill」handler）；新增 `$('agentOpen').onclick`（清 log/报告/状态 → `showModal()`）与 `$('closeAgent').onclick`（`close()`）；「去实验指导问答 →」handler 开头加 `$('agentDialog').close()`（先关 dialog 再切 tab，避免 dialog 遮罩盖住切出的「实验指导」）。管线/轮询/报告渲染逻辑不变。
    - `public/style.css`：新增 `.agent-open`（侧栏满宽触发按钮样式）。
  - 活体（单实例 8765，预览面板）：① 恢复 4 tab（`notes/sources/questions/skillGuide`，无 agent tab）；② 侧栏「⚙ 实验 Agent · 一键整理」存在；③ 「实验指导」panel 无「从当前笔记生成 skill」按钮；④ 点侧栏按钮 → dialog 打开（goal 输入 + ☐重新采集默认关 + ▶开始跑）；⑤ `goal:"酵母转化"`（reuse）→ ~20s `status:done`，报告在**打开的 dialog 内**渲染（✓ 运行完成 + 4 格 steps + 待核对清单 4 条 `【步骤 N · …】` 无 `[object]` 前缀）；⑥ 点「去实验指导问答 →」→ **dialog 关闭**（`dialogOpen:false`）+ 切到「实验指导」tab（`activeTab:skillGuide`）+ `skillSelect` 自动选中 `yeast-liac-peg-transformation`；⑦ 全程控制台零报错。
  - 验证：`node --check public/app.js` 过；`node --test --test-concurrency=1 tests/*.test.mjs` **32/32**（纯前端改动，零后端/接口/store 改动，无回归）；`grep genSkill` 确认 app.js/index.html 零残留。
  - 边界（如实）：`POST /api/skills/generate` 后端端点**保留**（仅移除前端入口按钮），仍可经 API/管线使用；实验 Agent 现为跨笔记本编排入口，产出落到 `小红书实验学习 · <goal>` 笔记本；skill 由 Agent 管线统一产出后，「实验指导」tab 只负责「选 skill + 问答指导」，职责更单一。
  - 提交：本地 commit（`public/index.html`、`public/app.js`、`public/style.css`、`TASKS.md`、`CONTEXT.md`），**未 push**（push 需用户授权）。

- **T22 · 前端「实验 Agent」tab（一键触发前半段管线 + 报告 + 跳转实验指导）** — done · owner: claude code · 2026-10-10
  - 起因：承接 T21（前半段管线已有 `POST /api/agent/pipeline` 后端 + python 驱动，但只能直接调 API）。用户「可以」批准加前端 agent 触发入口；用户选择**独立「实验 Agent」tab**（工作区第 5 个 tab）。目标：给一行关键词 → 前端一键启动 T21 管线 → 轮询进度 → 渲染结构化报告（5 步 + 待核对清单）→ 一键「去实验指导问答」跳到 T20 的「实验指导」tab 并自动选中新 skill，实现「任何 agent 可调用指导实验」的完整闭环在 UI 内可操作。
  - 方案（纯前端，零后端改动、零新依赖）：
    - `public/index.html`：tablist 加第 5 个 `<button data-tab="agentRun">实验 Agent</button>`；`#skillGuide` panel 之后加 `#agentRun` panel——`#agentForm`（`#agentGoal` 必填输入 `maxlength=80` + `#agentCrawl` checkbox 默认关=复用已有采集不启浏览器）+ `#agentState` 状态 + `#agentLog` 进度 + `#agentReport` 报告容器（默认 hidden）。
    - `public/app.js`：`startAgentPipeline()`（校验 goal→`POST /api/agent/pipeline {goal,crawl}` 拿 `runId`→`pollAgentRun()`）；`pollAgentRun()` 每 4s `GET /api/agent/runs?id=` 直到 `status` 为 done/failed（~2h 上限）；`renderAgentReport(run)` 渲染 ✓/✕ 标题 + summary + 4 格 steps（模式/导入/笔记/skill）+「待核对清单·N」（`g.where`→`【步骤 N · …】` 前缀）+「去实验指导问答 →」按钮（点 `data-tab="skillGuide"` tab→`await loadSkills()`→设 `skillSelect.value=skill.name`→`renderSkillMessages()`）。复用 `api()`/`run()`/`node()`/`button()`/`loadSkills()`/`renderSkillMessages()`。
    - `public/style.css`：`.agent-form`/`.agent-check`/`.agent-actions`/`.agent-log`（`:not(:empty)` 才显示）/`.agent-report`/`.agent-report-title.ok/.fail`/`.agent-summary`/`.agent-error`/`.agent-steps`（auto-fill grid）/`.agent-step`/`.agent-gaps-title`/`.agent-gaps li`；新增 `button.primary`（实心主色，报告 CTA 用）。
  - **活体发现并修 1 处确定性前端 bug**：`renderAgentReport` 里 gap 列表项误写成 `node('li','',prefix)+g.text`——`element+string` 触发隐式 `String(element)`，把每个 `<li>` 文本前拼上字面 `[object HTMLLIElement]`（浏览器活体首跑即暴露：报告 gap 全部带 `[object HTMLLIElement]` 前缀、`querySelectorAll` 也异常）。改为 `node('li','',prefix+g.text)`（`+g.text` 移入 `node()` 内）后 gap 干净渲染为 `【步骤 N · …】文本`。
  - 落地文件：`public/index.html`（第 5 tab + `#agentRun` panel）、`public/app.js`（`startAgentPipeline`/`pollAgentRun`/`renderAgentReport` + 表单提交绑定 + gap 拼接修复）、`public/style.css`（agent 表单/日志/报告样式 + `button.primary`）。
  - 验证：`node --check public/app.js` 过；`node --test --test-concurrency=1 tests/*.test.mjs` **32/32**（纯前端改动，零后端/接口/store 改动，无回归）。**浏览器活体（单实例 8765，预览面板）**：①「实验 Agent」tab 正常渲染（goal 输入 + ☐重新采集默认关 + ▶开始跑 + 空日志/隐藏报告）；②`goal:"酵母转化"`（reuse 模式，不启浏览器）提交 → 202 runId → 轮询 → ~20s 后 `status:done`，报告渲染 `✓ 运行完成` + summary（采集[reuse]→导入 0 篇/跳过 8→整理笔记→生成 skill yeast-liac-peg-transformation 12 步 4 项待核对）+ 4 格 steps + 待核对清单 4 条（`【步骤 1 · Carrier DNA 预处理】参数：95℃…`/`【步骤 5 · 加入质粒】…`/`【步骤 11 · 涂板筛选】…` 等，`g.where` 前缀正确、无 `[object]` 残留）；③点「去实验指导问答 →」→ 切到「实验指导」tab + `skillSelect` 自动选中 `yeast-liac-peg-transformation` + description 显示「用 LiAc/PEG 法将质粒导入 Y187/Y2H 酵母感受态细胞…」；④全程控制台零报错。
  - 边界（如实）：`crawl:true` 需用户已开 9222 且已登录小红书的 Edge（`CDP_CONNECT_EXISTING` 免扫码），本 tab 默认关=复用已有采集，不替用户启浏览器/撞风控；报告 gap 为 T20 确定性关键词提取（非 LLM 判断）；笔记/skill 受 1800 字符共读预算限制（open T13），非全文覆盖；轮询上限 ~2h，超时提示刷新。
  - 提交：本地 commit（`public/index.html`、`public/app.js`、`public/style.css`），**未 push**（push 需用户授权）。

- **T21 · 打通前半段：goal→采集→导入→笔记→skill 端到端管线（agent 可一键触发）** — done · owner: claude code · 2026-10-10
  - 起因：承接 T20（资料→skill 后半段）与用户方向「我不仅能从网上整理出大量可靠的实验来学习，也可以在我要做什么实验的时候就可以通过**任何 agent** 来调用来指导我」。前半段目标=给一行实验关键词（如「酵母转化」），agent 一条命令自动跑完 **采集(可选)→OCR→导入→建笔记本→整理聚焦笔记→生成 skill→检查待核对 gap→结构化报告**。
  - 方案：新增 `scripts/experiment_pipeline.py`（纯标准库驱动，`--goal` 必填；默认 **reuse** 复用 `MediaCrawler/data/xhs` 已有该关键词图文、不启浏览器，`--crawl` 才真正启动 MediaCrawler；`--force-skill`/`--run-id`/`--api`/`--app-root`/`--crawler-root`/`--out`/`--crawl-timeout`）。复用 `import_xhs.py` 作为子进程（不重写采集/OCR/导入）；import 后定位笔记本（标题 `小红书实验学习 · <goal>`）→ `POST /api/generate` 整理聚焦笔记 → `POST /api/notes` 持久化 → `POST /api/agent/skill`（T20）生成/复用 skill；每步 `emit` JSON-lines 进度、报告写 `data/pipeline/<slug>.report.json`，若 `--run-id` 则回写 `POST /api/agent/pipeline/<runId>/result`。
  - 后端（`server.mjs`）：新增 **`POST /api/agent/pipeline {goal, crawl?, force?}`**——校验 goal（非空/≤80 字）→ 建 `db.agentRuns` 记录（`kind:'pipeline'`, `status:'running'`）→ **`spawn` 该 python 驱动**（`detached`+`stdio:'ignore'`，`--api` 指向本实例端口，`--run-id` 关联）→ 立即返回 202 `{runId}`；新增 **`POST /api/agent/pipeline/:runId/result`**——驱动完成后回写报告（`status:done/failed`、`notebookId/Title`、`error`、`completedAt`）；**`GET /api/agent/runs`** 扩展为可按 `?id`/`?notebookId`/`?kind` 过滤。`createApp` 新增 `pipelineLauncher=spawn` 注入缝（测试用 fake launcher，不真起进程）。
  - 落地文件：`scripts/experiment_pipeline.py`（新）、`server.mjs`（`/api/agent/pipeline` + `/result` 回调 + `/agent/runs` 过滤 + `pipelineLauncher` 注入）、`tests/agent-pipeline.test.mjs`（8 项）。
  - 验证：`node --check` 过；`node --test tests/*.test.mjs` **32/32**（新增 pipeline 8 项 + 既有 24，无回归）。pipeline 8 项=空 goal 400 / 超长 goal 400 / 合法 goal→202+驱动参数正确携带 `--goal/--api/--run-id`+run 落库(kind=pipeline,running) / `crawl:true,force:true`→参数含 `--crawl --force-skill` 且 mode=crawl / `/result` done→run 翻 done+存 notebook+result / `/result` failed→run 记 error / 未知 runId 404 / `?kind`·`?id` 过滤。**活体**（单实例 8765）：`POST /api/agent/pipeline {"goal":"PCR 实验"}`（经 UTF-8 body）→ 202 → 驱动 reuse 模式复用已有 8 篇图文（OCR 缓存命中，`skipped:8/failed:0`）→ 整理 2642 字笔记 → 复用 skill `pcr-qpcr-colony-pcr`（5 步，8 项待核对）→ 回写 `status:done`，`GET /api/agent/runs?id=` 完整报告齐全（goal/counts/note/skill/notebook/summary）。失败路径活体：`goal:"yeast transformation"`（无该关键词数据）→ run 落 `status:failed`，`error` 含 `import exited 1: … "yeast transformation": 0 …`。
  - **排障记录（CJK）**：早期 `POST /api/agent/pipeline {"goal":"PCR 实验"}` 曾失败，goal 被存成 `PCR ʵ验`（`实` U+5B9E→`ʵ` U+02B5）。定位=**测试通道产物非代码缺陷**：Git Bash 把命令行里手敲的 CJK 按 OEM(GBK) 编码传给 `curl -d`（raw 字节 `ca b5 d1 e9`=GBK「实验」），Node 按 UTF-8 解码这些 GBK 字节才产生 mojibake。改用 `curl -d @utf8.json`（文件为 UTF-8，`实`=`e5 ae 9e`）即 goal 原样到达、全链 done。`server.mjs` 的 `body()` 本就是 UTF-8 正确解码；真实 UTF-8 客户端（浏览器/其他 agent）不受影响。
  - 边界（如实）：`crawl:true` 需用户已开远程调试(9222)且已登录小红书的 Edge（`CDP_CONNECT_EXISTING`，免扫码），本轮未实际启浏览器（会撞风控/占用户环境），仅验证参数构造与 reuse 半程；skill 由材料整理生成≠已确认规程；受 1800 字符共读预算限制（open T13），聚焦笔记非全文覆盖；报告 gap 为确定性关键词提取。
  - 提交：本地 commit（`scripts/experiment_pipeline.py`、`server.mjs`、`tests/agent-pipeline.test.mjs`、`skills/pcr-qpcr-colony-pcr.md`），**未 push**（push 需用户授权）。

- **T20 · 资料→skill 端到端 agent 切片（每个实验产出可移植 SKILL.md）** — done · owner: claude code · 2026-10-10
  - 起因：用户「资料→skill 端到端 agent 切片开始搭，每个实验最终都要生成一个 skill……我不仅可以从网上整理出大量可靠实验来学，也可以在我要做某实验时通过**任何 agent** 调用来指导我」。要点：skill 必须是**可移植的标准 Agent Skills 格式**（YAML frontmatter `name/title/description` + 步骤），任何 agent 都能加载，不只是研习伴自己的 `/api/skill-ask`。
  - 方案：把 T8 垂直切片里的「笔记/材料→LLM→SKILL.md」抽成共享助手 `generateSkillForNotebook(notebookId)`（取最新笔记 + `evidence()` 材料→喂 LLM 按模板生成→写 `skills/<slug>.md`），`/api/skills/generate` 复用同一助手（行为不变）。新增 **agent 编排端点 `POST /api/agent/skill`**：计划→（auto 幂等复用 / force 重生成）→验证→**确定性提取「待核对」gap 清单**→结构化报告，并把每次 run 落盘到 `db.agentRuns`（新顶层键，schema 向后兼容，`??=[]` 初始化）。新增 **`GET /api/agent/runs`**（可按 `notebookId` 过滤，倒序）。
  - 幂等/命名：`lastDoneAgentSkill(notebookId)` 按 agentRuns 历史找该笔记本最近一次 done 的 skill 复用；force 模式先删旧文件再重生成（不产生 `-2` 副本）。文件名用 LLM 给的 ASCII slug，与 frontmatter `name:` 一致（`/api/skill-ask` 按 name 加载）。
  - gap 提取（`extractGaps`）：确定性扫 skill 正文，凡含「待核对/材料未说明/未说明」的 `操作/参数/注意/检查点` 行归入所属步骤/小节，输出 `[{where,text}]`——不靠 LLM 判断，可复核。
  - 落地文件：`server.mjs`（`db.agentRuns` 初始化 + 3 助手 `lastDoneAgentSkill`/`generateSkillForNotebook`/`extractGaps` + `/api/skills/generate` 重构复用助手 + `POST /api/agent/skill` + `GET /api/agent/runs`）；`tests/agent-skill.test.mjs`（5 项：生成→portable+gap 提取+run 落盘+`/api/skill-ask` 可加载 / 二次 run 复用不产 `-2` / force 重生成不产 `-2` / 未知 notebook 404 / 无 run 时 `GET /api/agent/runs` 回 `[]`）。
  - 验证：`node --check` 过；`node --test tests/*.test.mjs` **24/24**（agent-skill 5 + 既有 19，无回归）。**活体**（单实例 8765）：对「小红书实验学习 · 酵母转化」笔记本 `POST /api/agent/skill` → 201，`status:done`、`reused:false`，产出 `skills/yeast-liac-peg-transformation.md`（frontmatter `name/title/description` + **12 步**，每步 操作/参数/注意/检查点 + 安全段，纯酵母转化主题非双杂交）；`portable:true`、`format:"Agent Skills (SKILL.md)"`；**gapCount:4**（Carrier DNA 预处理时长/变性、质粒浓度、涂板量）；summary 明示「任何 agent 可加载 yeast-liac-peg-transformation.md 指导该实验」。二次 run `reused:true`、同 path、无 `-2`；`GET /api/skills` 列出该 skill；`/api/skill-ask` 加载该 skill 问「加入质粒后下一步」→ 准确定位步骤 5、给 30℃ 孵育 30min→42℃ 热激 15min + 安全提醒；`GET /api/agent/runs?notebookId=` 列出两条 run（reused false→true）。
  - 边界（如实）：gap 提取为确定性关键词匹配（「待核对」等词触发），不覆盖未用这些词的缺口；`/api/skill-ask` 的步骤定位是 LLM 软判断（靠 skill 全文 + 问题）；skill 由材料整理生成≠已确认规程（受 1800 字符共读预算限制，open T13）；本次仅资料→skill 后半段，前端「实验指导」tab 尚未加 agent 触发入口（现直接调 API），采集/import→笔记 的前半段管线未打通（需用户已登录 Edge/CDP，另立项）。
  - 提交：本地 commit（`server.mjs`、`tests/agent-skill.test.mjs`），**未 push**（push 需用户授权）。生成的 `skills/yeast-liac-peg-transformation.md` 为 git 管理产物。

- **T19 · 小红书「酵母转化」采集→导入→共读笔记（+ 双杂交/转化 误标修复）** — done · owner: claude code · 2026-10-10
  - 起因：用户「从小红书上找酵母转化笔记整理攻读笔记」。用 MediaCrawler（`CDP_CONNECT_EXISTING=True` 连用户已登录小红书的 Edge，免扫码）采集关键词「酵母转化」8 篇 → OCR → 导入新笔记本「小红书实验学习 · 酵母转化」（8 条文字资料，`content` 头带 `图片目录：` 供 T18 图片能力用）。
  - **发现并修复的口径错误**：XHS 关键词搜索偏模糊，8 篇实为混合——4 篇真·转化（#2 步骤原理 / #3 Y1H 转化操作 / #6 醋酸锂原理 / #8 感受态制备与转化）、2 篇双杂交蛋白互作检测（#1/#7）、1 篇单杂交（#5）、1 篇涂板 tips（#4）。首版 `/api/generate` 固定提示词 + 1800 字符预算导致笔记主体被最长的**双杂交**来源(#1)主导，笔记标题/正文写的是「酵母双杂交检测蛋白互作」，与笔记本主题「酵母转化」不符。用户指出「酵母转化和酵母双杂交不是一个东西」——确认为真·口径错误。
  - 修复（数据层，零代码改动）：用 `/api/chat` 传入聚焦「酵母转化」的自定义问题（该端点按问题词元给 evidence 排序 → 偏向 4 篇纯转化来源、压低双杂交/单杂交），并在问题里要求「双杂交/单杂交只在末尾『相关但不同技术』小节一句话点明区别、不作正文主体；涂板仅作转化后计数步骤」。重新生成 3131 字笔记（标题「酵母转化实验学习笔记」，正文=目的/LiAc-PEG 原理/感受态/Carrier DNA 预处理/分步参数/涂板计数/注意事项/8 项待核对 + 末尾「相关但不同技术」列双杂交·单杂交），`POST /api/notes` 存为新版本 `aec8d9be`（旧双杂交版 `80e666b9` 保留为只读历史版本）。8 条来源**全部保留**（用户要求「沾边的要暴露」，无任何一篇属完全不相关故未删）。
  - 验证：`store.json` 两版本 head 行核对（新=`## 酵母转化实验学习笔记`、旧=`…酵母双杂交…`）；新笔记全文逐节确认为转化主题；单实例 8765 未双开。
  - 诚实边界：受 1800 字符共读预算限制（open T13），新笔记正文主要引用 S1(双杂交，仅用于"相关"小节)+S2(转化步骤)，#6/#8 等其余转化来源未完全并入正文；如需覆盖全部 8 篇需 T13 分段上下文。
  - 提交：无 Study companion 代码改动（数据在 gitignored `data/store.json`），本任务无需 commit。MediaCrawler `config/base_config.py` 的 `CDP_CONNECT_EXISTING=True` 属另一仓库，未在其提交。

- **T18 · 共读 LLM 视觉接入来源原图 + 学习资料 UI 展示原图** — done · owner: claude code · 2026-10-10
  - 起因：用户反馈「笔记来源不能更好地提取图片…不利于大模型对获取内容的准确理解」，并确认本地接入 Claude Code 的 Qwen（18081，`local-qwen38-gsq`）具备图片识别能力。原 `/api/chat` 只发纯文本（OCR 转录），LLM 看不到原图里的图表/流程图/培养皿等视觉信息。
  - 方案：`/api/chat` 把本轮选中来源的**原图**以 OpenAI 视觉格式（`content:[{type:'text'},{type:'image_url':{url:'data:<mime>;base64,…'}}]`）随材料一起发给本地 VLM。图片来源=来源 `content` 头部嵌入的 `图片目录：<绝对路径>`（XHS 导入来源才有）；按「关键词排序后的 top 来源」顺序取图，跨来源去重、总量上限 `MAX_CHAT_IMAGES=4`。纯文本来源（.txt/.srt 等无 `图片目录`）贡献 0 图 → 自动回退纯文本（行为不变）。
  - 落地（后端·LLM 视觉）：`server.mjs` 新增 `sourceImageDir()`（解析 `图片目录：` 行）、`sourceImageList()`（列目录图片）、`collectChatImages()`（top 来源去重取图、上限截断）；`/api/chat` 组装 `material`（有图=文本+图数组、无图=纯字符串），prompt 追加「附 N 张来源原图…与原图冲突以原图为准」；reply 新增 `images` 计数（store 兼容）。仅 `/api/chat` 送图（`generate`/`skill-ask` 不送，`images:0`）。
  - 落地（后端·图片展示 API）：新增 `GET /api/sources/:id/images`（返回 `[{name,url}]`）与 `GET /api/sources/:id/image?file=<basename>`（按 mime 流式出图）。**路径穿越防护**：`file` 只允许 `[0-9A-Za-z._-]` 且 `path.relative` 不得越出来源图片目录（`../store.json`→400）；仅 `kind:'text'` 资料、资料不存在→404、文件不存在→404、无 `图片目录`→空列表。
  - 落地（前端）：`app.js` `showSource()` 对文字资料在详情对话框顶部异步拉 `/images` 渲染 `来源原图 · N 张` 缩略图条（点缩略图新标签开原图 `openImage`）；来源卡片顶部加 `📷 N 张原图 · 点击查看` 徽标。`style.css` 加 `.source-images`/`.source-card-imgs`。
  - **零 store schema 升级、零新依赖**。图片来源=来源 `content` 头部 `图片目录：<绝对路径>`（XHS 导入来源才有），目录在 app 之外（`MediaCrawler/data/xhs/media`），故必须经服务端路由取图，前端无法直接 URL 引用。
  - 验证（LLM 视觉）：`node --check` 过；`npm test` 18/18（修一处正则 `m` 标志误写成属性 `.m` 导致 `Cannot read … exec` 的确定性缺陷）；**活体端到端**——重启单实例 8765，对「大肠杆菌转化」笔记本问「流程图离心步骤/参数」→ 响应 `images:4`，LLM 读图给出两步离心 3000g/4°C/10min、CaCl₂ 体积、-80°C，并**主动发现 OCR 文本写 `3000 r/min` 而原图标 `3000 g` 的单位不一致**、提示以原图为准（正是 OCR 单靠文本无法发现的差异）；浏览器 UI 同问渲染正常、控制台零报错。
  - 验证（图片展示）：新增 `tests/source-images.test.mjs`（list 顺序/`url`、serve 正确 content-type 且字节一致、`../store.json` 与 `..%2f..%2f` 均 400、缺文件 404、无 `图片目录` 空列表、坏 id 404）→ `npm test` 19/19；**浏览器活体**——「大肠杆菌转化」学习资料 8 张卡片全部显示 `📷 N 张原图 · 点击查看`（5/3/6/2/9/4/6/5），点开第一条详情对话框顶部渲染 `来源原图 · 5 张` 缩略图条、5 图全部加载（naturalWidth 1080）、OCR 正文仍在下方、截图确认流程图原图可见、控制台零报错。
  - 边界（如实）：图序↔来源序映射是近似的（第 1 张属 S1 所在来源，prompt 已声明）；仅取 top 来源前 4 张送 LLM（UI 展示则显示该来源全部原图）；某来源图片目录缺失/被删则静默跳过；依赖本地 VLM 真的理解图像（已活体核验，非假设）；`max_tokens=4000` 不变，图片计入输入 token（18081 上下文 220000 足够）。图片经服务端路由从 app 外目录读取，已做 basename 白名单 + 目录越界防护。
  - 提交：本地 commit（`server.mjs`、`public/app.js`、`public/style.css`、`tests/source-images.test.mjs`），**未 push**（push 需用户授权）。

- **T17 · 笔记 Markdown 阅读视图（渲染）** — done · owner: claude code · 2026-10-10
  - 起因：共读笔记是 `<textarea>` 原始 markdown，格式符号（`#`/`**`/`>`/`-`）全裸露、不可读。
  - 方案：笔记面板加「阅读 / 编辑」切换，默认**阅读**——手写零依赖 `renderMarkdown()` 把 markdown 渲染成排版文本（标题 h1–h6、`**` 加粗、`*` 斜体、`` ` `` 行内代码、无序/有序列表、`>` 引用块、`---` 分隔线）；**编辑**回到原 textarea 原样编辑，选中一段共读逻辑不变。
  - 落地：仅 `public/index.html`（`#noteRender` 容器 + `.view-toggle` 两按钮 + 脚注文案）、`public/app.js`（`noteView` 状态 + `renderNote()` + `renderMarkdown()` + 阅读态 `mouseup` 选中回显 + `saveNote`/`loadRevision`/追加到笔记后同步刷新）、`public/style.css`（`.view-toggle`、`.note-render` 排版）；纯前端零新依赖，后端/接口/store/共读链路零改动。
  - 验证：`node --check` 过；浏览器活体——阅读/编辑两态显隐往返正确，阅读态渲染 1 h1/9 h2/20 ul/1 blockquote/51 strong 且无残留原始符号，阅读态与编辑态选中均触发右侧共读回显，控制台零报错，单实例 8765。
  - `[S#]` 来源引用渲染为**右上角上标徽章**（`<sup class="cite">`）；笔记阅读态整体采用 **Typora 主题风格**（h1 下边框、居中、引用块斜体）。
  - 修首屏竞态（`state` 未赋值时 `renderSkillMessages` 读 `state.messages` 抛 "Cannot read properties of undefined"）：`renderMessages`/`renderSkillMessages` 改 `(state?.messages||[])` 空值保护。布局收紧——右栏（共读）固定窄栏（基础 `minmax(330px,400px)`、≤1100px `minmax(300px,380px)`），笔记阅读/编辑**填满左栏靠左**（初版曾限宽 720px 居中，用户反馈"太窄"→已去掉限宽居中）。
  - **修标题缩进 bug**：`endList()` 误推一整对空 `<ul></ul>`（列表开标签另在列表项分支单独 push）→ 列表永不闭合、浏览器把后续所有 `h2` 重新嵌套进未闭合 `<ul>` 并继承 `padding-left:22px`；改只推 `</ul>` 闭标签。
  - **资料来源超链接**：`renderMarkdown()` 新增 `xhsItem()` 识别 `- S# 标题（24位hex小红书id）` → 渲染为 `xiaohongshu.com/explore/<id>` 超链接（新标签打开），三本 XHS 笔记本各 8 条全部命中。
  - 验证补充：`node --check` 过；活体 9 标题零缩进 + 8 条资料来源超链接 href 正确 + 列表零嵌套 + 控制台零报错；`npm test` 18/18。
  - **整体改 #3a83f7 蓝色系**：`style.css` 50+ 绿/青绿 hex 全映射为蓝色系（`--green`→#3a83f7、`--border`/`--muted` 转蓝灰）；保留白、红色 `.danger`、暖色只读态 `is-historical`；新增 `.note-render a` 主题蓝链接规则。
  - **引用上标定位修复**：`.note-render sup.cite` 由 `vertical-align:super;line-height:0`（上标浮得过高错位）改为 `vertical-align:0.5em;line-height:1`（+10px/左边距 2px），上标紧贴正文。
  - 验证补充2：脚本核验无残留绿系 hex、#3a83f7 就位、红/暖/白保留；活体 logo/保存按钮/激活 tab/导航/引用块/资料来源链接均 `rgb(58,131,247)`、引用上标 `va=5px/lh=10px`、控制台零报错。
  - 边界：渲染为轻量子集（不支持表格/嵌套列表/图片）；`[S#]` 只匹配 `S`+数字 转上标，不误伤真实 `[链接](url)`；资料来源链接只匹配"列表项以 `S#` 开头 + 结尾 24 位 hex id"这一特定格式；保存读隐藏编辑框的值，阅读态也能保存。
  - 提交：本地 commit（仅三前端文件），**未 push**（push 需用户授权）。

- **T16 · 前端 UI 一致性优化（UI Finish-Gate A–G）** — done · owner: claude code · 2026-10-10
  - 依据 UI Finish-Gate Reviewer 对现有前端的复审，落地 7 项「更清晰/一致」必修项；全部纯前端、零新依赖、不改后端/接口/store。
    - A 语言统一中文（品牌副标「从记录到实践」、eyebrow「用你的资料学习」、粤语音色选项标签「粤语女声」，value 不变）。
    - B 状态标签语义互斥（`#revisionLabel` 四态：尚未保存 / 有未保存的修改 / 已保存·时间戳 / 只读·历史版本，随 save/载入历史/编辑实时切换）。
    - C 计数徽标 0 值隐藏（`.tabs span:empty{display:none}`）+ 标签页 ARIA（`role=tablist`/`role=tab`、`aria-selected`、`tabindex` 0/-1 随切换）。
    - D 实验 skill 下拉下方显示 description（`#skillDesc`，无描述则隐藏）。
    - E 选择上下文就近反馈（编辑器脚注 `#noteSelEcho` 回显选中段摘要；`.note-footer` 加 `flex-wrap:wrap` 窄屏换行不溢出）。
    - F 历史版本只读态（`#noteEditor.is-historical` 样式 + `readOnly` + 「继续编辑」按钮往返）。
    - G 空笔记本首屏 CTA（无笔记本时隐藏编辑器/工具条/脚注，显示「＋ 创建第一本学习笔记本」，点开复用 `#newBookDialog`）。
  - **附带修一处确定性 bug**：`app.js` `loadRevision` 用 `await` 但未声明 `async`，属语法错误会让整个前端脚本解析失败（应用实际已挂）；改 `async function loadRevision` 后 `node --check` 通过。
  - 验证：`node --check` 通过；浏览器活体逐一核验 A–G 各态（含 375px 窄屏脚注换行零溢出、全程无 store 写入）；单实例运行 8765（验证前停掉旧进程、由预览面板起单实例）。
  - 提交：本地 commit `e19c58a`（仅 `public/index.html`、`public/app.js`、`public/style.css` 三文件，**未 push**）；`.claude/launch.json` 临时预览改动已还原未纳入。

- **T15 · 小红书图文采集 → OCR → 资料导入** — done · owner: codex · 2026-10-10
  - 修复首页 goto 等待 load 超时；搜索只取图文、每关键词最多 8 篇，并处理末页；用户本人扫码成功。
  - 三关键词各 8 篇，共 24 篇/131 张图；全部 OCR、Markdown 落盘，API 导入三个笔记本各 8 份。图像完整性验证通过。
  - 新增 scripts/import_xhs.py：按图片哈希复用 OCR/防重复导入，跳过视频和未完整下载的图片；仅调用现有 API，不改 store.json。
  - 验证：采集逻辑 3/3、导入边界 2/2；真实 UI 中可见资料，生成草稿与共读问答均返回引用。上下文截断仍存在，结果仅基于选取片段。
  - 使用说明 docs/小红书图文导入.md；验收报告在 MediaCrawler/data/xhs/import-report-2026-10-10.json。未改 base_config、OCR worker 或应用业务代码，未 push。

- **T11 · 双 agent 进度对齐** — done · owner: codex · 2026-10-10
  - 基线 main/483abf3；以实际代码与配置更新 README/CONTEXT，补充协作和接手入口，记录 OCR 未提交边界；业务文件和用户数据未修改。
  - 本轮验证：npm test 18/18、语法检查通过；8765 当时未运行。真实模型/浏览器结果沿用历史记录，不冒充本轮重测。


- **T10 · 朗读前剥离 Markdown（去星号残留）** — `done` · 用户 2026-10-09 反馈 AI 共读朗读把 `*`/`#`/反引号照读出来，提出"笔记与 markdown 分离"。
  - `public/app.js` 新增 `stripMarkdown(v)`（剥代码围栏/行内代码/图片/链接/标题/分隔线/列表符/加粗斜体/引用块 + 空白折叠为连续口语文本），`speak()` 送 `/api/tts`（`text:clean`）与浏览器本地音 fallback 前统一清洗；两处「朗读」调用点（共读/实验指导）无需改。
  - 后端/接口零改动（`/api/tts` 仍 `{text}` ≤2000 字，wire WAV）；`tests/tts.test.mjs` 不变。
  - 验证：`node --check` 过；`npm test` 18/18；活体 hook `window.fetch` 捕获 `/api/tts` 请求体——markdown 重 DH5α 回答送出 **275 字纯口语文本，无 `*`/`#`/反引号/围栏/引用括号残留**；控制台无报错。
  - **边界（如实）**：只清洗"读"路径，编辑区/导出仍是原始 markdown；剥规则为启发式正则，极端嵌套 markdown 可能有残留。
- **T9 · 朗读引擎换 edge-tts（弃 Kokoro 中文）** — `done` · 用户 2026-10-09 反馈 Kokoro 中文难听，拍板改用 edge-tts（云端）。
  - `tts_worker.py` 重写：edge-tts 出裸 Opus 帧 → **ffmpeg** 解码 24kHz 16-bit mono WAV（wire 格式不变）；voice 白名单 + 旧 Kokoro 名自动映射，默认 `zh-CN-XiaoxiaoNeural`。
  - 依赖：`.venv-tts` 加 `edge-tts`；**新增 ffmpeg 硬依赖**（PATH）；`setup-tts.ps1` 改（校验 ffmpeg、清理旧 models/kokoro）。
  - 前端：设置音色下拉 8 Kokoro → **11 edge-tts 中文音色**；`speak()` 引擎无关未改。`server.mjs` 启动时旧 `ttsVoice` 非 `zh-*` 自动归一。
  - 验证：`npm test` 18/18；活体 `/api/health` tts=edge-tts/云端、`/api/tts` 回有效 WAV、下拉 11 项、旧音色已迁移、无控制台报错。
  - **边界**：需联网、文本经微软服务（非离线/非私有）；失败回退浏览器本地音。
- **T8 · 实验 skill 实操指导（垂直切片）** — `done` · 用户 2026-10-09 拍板：skill 载体=**SKILL.md 文件**、指导=**问答式**、范围=**先做垂直切片**。
  - `skills/dh5a-gfp-transformation.md`：由现有「酵母转化」笔记整理的 1 个真实 skill（frontmatter `name/title/description` + 6 步骤，每步 操作/参数/注意/检查点，参数缺失如实标"待核对"，含安全段）。
  - 后端：`createApp` 新增 `skillsDir` 注入缝；`listSkills()`/`readSkill(name)`（手写 frontmatter 解析，零依赖，`[a-z0-9-]` 路径校验）；`GET /api/skills`（列 `skills/*.md`）；`POST /api/skill-ask`（问答式，LLM 只依据 skill 全文定位当前步骤→给操作/参数/易错安全/下一步，存 `db.messages` 新 `type:'skill'` + `skill` 字段，无 notebookId 故不污染共读列表）；`POST /api/skills/generate`（笔记/材料→LLM→写 skill，**同名文件自动加后缀不覆盖**）。
  - 前端：新 tab「实验指导」（`data-tab="skillGuide"`）：skill 下拉 + 问答输入 + 回答渲染（含「朗读」复用 Kokoro `speak()`）+「从当前笔记生成 skill」。
  - 验证：`tests/skill.test.mjs` 7 项（列目录/空目录/问答存消息/空问题400·不存在404/generate 落文件·需材料400/同名不覆盖）；`npm test` 18/18。活体：选 DH5α skill 问「我准备加质粒，下一步？」→ 回答准确定位**第 2 步**（加质粒+冰浴）+参数(5μL/50ng·μL⁻¹/30min)+安全+预告第 3 步热激；「朗读」触发 `POST /api/tts` 200 `audio/wav`；回归共读/生成/转写/删除不受影响、skill 消息不泄漏进共读列表。详见 `docs/开发进度.md`。
- v0.1 骨架 / v0.2 M0 真实模型联调 / M1 材料与来源验收 —— 见 `docs/开发进度.md`。
- **T6 · GitHub 备份首次 push** — 项目专属 repo + 三件套 + 首次 push 到 `origin=Aa144085412/Study-companion`（`main`）。
- **T1 · 删除笔记本/来源能力** — `DELETE /api/notebooks/{id}` + `DELETE /api/sources/{id}`（版本链双向级联 + 孤儿媒体文件清理，带守卫）+ 界面删除按钮（`.danger`）+ 二次确认。回归 `tests/delete.test.mjs` 2 项；浏览器实测笔记本删除全流程通过。
- **T7 · 自然中文朗读（Kokoro-ONNX，纯 CPU 不占显存）** — `POST /api/tts`（≤2000 字，回 `audio/wav`）+ 前端 `speak()`/`stopSpeak()`（走 `/api/tts`、失败回退浏览器本地音）+ 设置 8 中文音色（`db.settings.ttsVoice`）+ `setup-tts.ps1`（`.venv-tts`：kokoro-onnx+soundfile，下载模型/音色，自检写 flag）。活体中修 `ttsStatus()` 漏返 `python` 致 `spawn(undefined)`。`npm test` 11/11；浏览器实测 speak→200→blob 播放、stopSpeak、音色下拉、无控制台报错。详见 `docs/开发进度.md`。
