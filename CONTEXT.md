# CONTEXT.md — 研习伴共享状态

> Codex 与 Claude Code 接手时先读本文件、TASKS.md、COLLAB.md，并检查 Git。最后对齐：2026-10-10。

## Recovery Capsule

- **Status**：v0.2.0 开发版；核心流程已实现，未完成完整产品验收。
- **Goal**：音视频 → 转写与校对 → 笔记 → AI 共读/语音提问 → 实验 skill 问答指导。
- **Active task**：T16（A–G）已完成并 push（`e19c58a`）；T17 笔记 Markdown 阅读视图（渲染）已完成（纯前端，本次本地 commit，push 需用户另行授权）；待认领 open=T12 应用内 OCR / T13 长文上下文 / T14 交付验收。
- **Last verified state**：2026-10-10 三关键词各 8 篇，24 篇/131 张图片完整性验证通过，全部 OCR 与 API 导入（各笔记本 8 份）；真实界面可见，草稿和共读回答有来源引用。新增采集测试 3/3、导入测试 2/2；应用业务代码未变，18/18 回归结果沿用此前记录。8765 当前运行单实例。T16 已核验：前端 A–G 七项活体逐一通过（含 375px 窄屏脚注换行零溢出、空笔记本 CTA、skill 描述、历史只读往返），并修掉 `app.js` `loadRevision` 缺 `async` 的确定性语法错误；`node --check` 过、全程无 store 写入、单实例 8765。T17 已核验：笔记默认「阅读」态把 markdown 渲染成排版文本（标题/加粗/列表/引用，格式符号不再裸露），阅读↔编辑往返正确；阅读态与编辑态选中一段均触发右侧共读回显；保存仍读隐藏编辑框的值（阅读态也能保存）；控制台零报错、`node --check` 过、单实例 8765。
- **Code baseline**：本轮基于 main/f5c71fd（独立 OCR worker）；新增 scripts/import_xhs.py、测试与操作文档。接手重新读 Git HEAD。
- **Current blocker**：采集导入链路无阻塞；应用内一键 OCR 尚未接入，共读长文预算限制仍需 T13 处理。关键词检索结果未逐篇验证实验适用性。
- **Next safe action**：T12 接入应用内图片/PDF OCR，或 T13 长文上下文；用户可先使用三个“小红书实验学习”笔记本。复用运行中的服务，避免双开共享 store。T16 已 push；T17 笔记阅读视图已本地 commit，push 需用户另行授权。
- **Files involved**：server.mjs、public/*、transcription.mjs、asr_worker.py、tts.mjs、tts_worker.py、skills/*、tests/*。

## 已实现及证据等级

| 范围 | 当前代码能力 | 验证依据 |
|---|---|---|
| M0 模型基础 | 内置 faster-whisper-small CPU int8 + OpenCC；本地 LLM；edge-tts 朗读 | 历史真实模型联调已记录；本轮只核对代码、配置和模型文件 |
| M1 资料与来源 | 250 MB 流式上传、哈希去重、转写队列、取消/重试、校对版本、时间戳及媒体 Range | 本轮相关自动测试通过；历史约 72 秒合成语音/视频验证，不能外推为一小时性能保证 |
| M2 笔记共读 | 笔记版本、草稿、选区问答、短历史、引用标识校验 | 自动测试及历史联调；笔记块证据映射、全文检索未完成 |
| M3 语音 | 设备选择、录音/文件提问、取消、权限提示、中文朗读和 Markdown 清洗 | 历史浏览器与模型验证；本轮未重新使用麦克风或云端服务 |
| M4 学习与交付 | 疑问状态、Markdown 导出 | 缺复述练习、备份恢复 UI、完整 20 问及工作台集成 |
| 扩展实验 skill | skills/*.md、列表、生成、问答、同名保护、朗读 | 7 个相关单测及历史联调；不是已完成自动路由或 checklist |
| OCR | 已提交独立 worker + scripts/import_xhs.py 命令行 OCR/导入 | 24 篇真实图文已识别导入；尚无应用内图片/PDF 上传 OCR 路由 |

## 当前架构、配置与约束

- 唯一开发目录：`C:\Users\a1440\Desktop\Study companion`。此前工作区 `output/研习伴/dev-stage` 是旧暂存，禁止用它覆盖本目录。
- Node 原生 HTTP 服务；零 npm 运行时依赖；元数据 JSON，媒体文件存磁盘，schema 2。
- 配置核对：LLM `http://127.0.0.1:18081/v1` / `local-qwen38-gsq`；ASR `builtin`；TTS 音色 `zh-CN-liaoning-XiaobeiNeural`。这不是服务在线证明。
- ASR 每次识别 `spawn` 独立 Python worker，并重新加载模型。历史“常驻 worker”表述有误，以当前代码为准。
- TTS 当前使用 edge-tts 云端服务与 ffmpeg；需联网且发送朗读文本。旧 Kokoro 实现已被替换，不能称当前 TTS 完全本地或描述为本地模型冷加载。
- 当前共读来源预算 1800 字符、笔记前 800 字符、选区 500 字符、历史最近 2 条每条 300 字符，输出 max_tokens=4000。18081 模型上下文更大，不代表代码会自动使用完整笔记。
- 转写重启后标 interrupted，重试从头开始；无断点续传。
- 当前删除为实际删除，非回收站；不要向用户承诺可在 UI 恢复。
- 实验 skill 由材料整理生成，不自动等于已确认规程。历史记录混用“酵母转化”和“DH5α”名称，真实材料来源与对象须重新核对，不能据此认定实验正确性。

## 工作树与协作边界

核对开始时未提交文件：`ocr_worker.py`、`tests/make_ocr_test_image.py`、`tests/fixtures/ocr-test/`。保持原样，不代另一 agent 提交。

本轮仅修改 README、CONTEXT、TASKS、COLLAB、开发进度日志并新增 AGENTS.md 接手入口；不改业务代码、数据库、模型配置或实验 skill，不 push。

同机共享工作树不需要把对方代码重新合并进来。通过任务 owner、文件范围和短 checkpoint 避免覆盖；修改前比较文件指纹，发现变化重新读。不得长期双开同一 data 目录的服务。

## 下次验证

1. `git status --short`、`git log -5 --oneline`，读取最新任务认领情况。
2. 需要真实功能验收时检查 8765、18081 服务，而不是只看配置。
3. `npm.cmd test` 和 `npm.cmd run check`；ASR 变化另跑 `tests/opencc_check.py`。
4. 真实录音、语义引用与 10 段时间定位仍需独立验收；模拟测试通过不能代替。

历史决策和更早验证保留于 `docs/开发进度.md`；任务列表以 `TASKS.md` 为准。

## 2026-10-10 T15 小红书真实链路验收

- 采集仓库：C:\Users\a1440\Desktop\MediaCrawler；独立 Edge 档案扫码，goto 已改 domcontentloaded/90s。没有改 base_config.py 里的既有用户配置。
- 关键词：大肠杆菌转化、菌种活化、PCR 实验；各 8 篇图文，共 131 张图片。JSONL、图片、Markdown、验收 JSON 均留在该仓库 data/xhs 下，不纳入 Git。
- 研习伴按关键词创建三个笔记本；仅通过 /api/sources 导入，现有用户笔记未覆盖。草稿和问答验收留在“大肠杆菌转化”的共读对话中，未自动写入正式笔记。
- 操作说明：docs/小红书图文导入.md；导入支持 OCR 缓存与来源标记去重，重复运行已验证。
- 质量边界：OCR 数字/单位需要核对原图；仅关键词检索，未筛选所有帖子的科学可靠性；共读出现 truncated 提示，只用了部分资料。

## 2026-10-10 T16 前端 UI 一致性优化（A–G）

- 起因：用户先让 UI Finish-Gate Reviewer 过一遍研习伴现有前端，出「哪里能更清晰/一致」清单，再「开始优化」。复审结论 HOLD + 7 项必修（A–G）。
- 落地范围：仅 `public/index.html`、`public/app.js`、`public/style.css`，纯前端零新依赖，后端/接口/store 零改动。
  - A 语言统一中文；B 状态标签语义互斥（四态实时切换）；C 计数徽标 0 值隐藏 + tab ARIA；D 实验 skill 下拉下方显示 description；E 选择上下文就近反馈（编辑器脚注回显 + 窄屏 flex-wrap）；F 历史版本只读态（is-historical + readOnly + 继续编辑往返）；G 空笔记本首屏 CTA（无笔记本时隐藏编辑器并显示创建入口）。
- 附带修复：`app.js` `loadRevision` 用 `await` 却非 `async`（语法错误，整个前端脚本会解析失败）→ 改 `async`。
- 验证：`node --check` 通过；浏览器活体逐一核验 A–G 各态（含 375px 窄屏脚注换行零溢出、空笔记本 CTA 内存态、skill 描述、历史只读往返），全程无 store 写入；单实例 8765（验证前停掉旧进程、由预览面板起单实例，避免双开共享 store）。
- 提交：本地 commit `e19c58a`（三前端文件），未 push；`.claude/launch.json` 临时预览改动已还原未纳入。
- 边界：E 的「就近反馈」只是编辑器脚注的选中段摘要回显，未改动右侧共读选区逻辑；G 的 CTA 复用既有 `#newBookDialog`，未新增建本逻辑。

## 2026-10-10 T17 笔记 Markdown 阅读视图（渲染）

- 起因：用户反馈共读笔记是 `<textarea>` 原始 markdown，`#`/`**`/`>`/`-` 等格式符号全部裸露、不可读；希望把 markdown「识别」成排版文本。
- 方案：笔记面板加「阅读 / 编辑」切换（默认**阅读**）。
  - 阅读：把 markdown 渲染进 `#noteRender`（零依赖手写 `renderMarkdown()`：标题 h1–h6 / `**` 加粗 / `*` 斜体 / `` ` `` 行内代码 / `-`·`*`·`+` 无序列表 / 数字有序列表 / `>` 引用块 / `---` 分隔线；先 HTML 转义再行内标记替换，无注入风险）。`[S#]` 来源引用渲染为**右上角上标徽章**（`<sup class="cite">`，小绿字）。整体采用 **Typora 主题风格**（衬线/系统字、15.5px/1.9、居中 760px 最大宽度、h1 下边框、引用块斜体浅底）。此时隐藏 textarea。
  - 编辑：回到原 textarea 原样编辑，现有 `onselect` 选中→共读链路不变。
- 落地范围：仅 `public/index.html`、`public/app.js`、`public/style.css`；纯前端零新依赖，后端/接口/store/共读链路零改动。
- 验证：`node --check` 过；浏览器活体——阅读/编辑两态显隐往返正确（阅读态渲染可见·编辑框隐藏，编辑态相反），阅读态渲染出 1 个 h1、9 个 h2、20 个 ul、1 个 blockquote、51 个 strong，无残留原始符号；阅读态选中一段→右侧「正在讨论」回显，编辑态选中→回显原 markdown；保存读隐藏编辑框值（阅读态可保存）；控制台零报错；单实例 8765。
- 边界：渲染为轻量子集（不支持表格/链接/嵌套列表/图片等）；`[S#]` 来源引用只匹配 `S`+数字 转上标徽章，避免误伤真实 `[链接](url)`。
- 后续（同一 T17，2026-10-10）：应用户要求把 `[S#]` 改成右上角上标引用 + 笔记整体采用 Typora 主题风格（见上方案）；活体核验 78 个上标引用、无残留 `[S#]`、h1 下边框/居中/引用块斜体、阅读态选中回显正常、控制台零报错。
- 后续2（同一 T17，2026-10-10）：
  - 修首屏竞态：`loadSkills()` 与 `refresh()` 并行，`loadSkills` 先完成并选中首个 skill 时 `state` 尚未赋值，`renderSkillMessages()` 读 `state.messages` 抛 "Cannot read properties of undefined (reading 'messages')"。`renderMessages`/`renderSkillMessages` 改 `(state?.messages||[])` 空值保护（纯前端，不碰后端/store）。多次刷新活体确认不再抛错。
  - 布局收紧：右栏（共读）固定窄栏（基础网格 `minmax(330px,400px)`、≤1100px `minmax(300px,380px)`）；笔记阅读/编辑**填满左栏靠左**（初版曾限宽 720px 居中，用户反馈"太窄"→已去掉限宽居中，改为占满左栏）。
- 提交：本地 commit（三前端文件），**未 push**（push 需用户授权）。
