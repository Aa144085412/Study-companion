# CONTEXT.md — 研习伴共享状态

> Codex 与 Claude Code 接手时先读本文件、TASKS.md、COLLAB.md，并检查 Git。最后对齐：2026-10-10。

## Recovery Capsule

- **Status**：v0.2.0 开发版；核心流程已实现，未完成完整产品验收。
- **Goal**：音视频 → 转写与校对 → 笔记 → AI 共读/语音提问 → 实验 skill 问答指导。
- **Active task**：T15 小红书图文 → OCR → 研习伴导入已完成；用户本人完成扫码。
- **Last verified state**：2026-10-10 三关键词各 8 篇，24 篇/131 张图片完整性验证通过，全部 OCR 与 API 导入（各笔记本 8 份）；真实界面可见，草稿和共读回答有来源引用。新增采集测试 3/3、导入测试 2/2；应用业务代码未变，18/18 回归结果沿用此前记录。8765 当前运行单实例。
- **Code baseline**：本轮基于 main/f5c71fd（独立 OCR worker）；新增 scripts/import_xhs.py、测试与操作文档。接手重新读 Git HEAD。
- **Current blocker**：采集导入链路无阻塞；应用内一键 OCR 尚未接入，共读长文预算限制仍需 T13 处理。关键词检索结果未逐篇验证实验适用性。
- **Next safe action**：T12 接入应用内图片/PDF OCR，或 T13 长文上下文；用户可先使用三个“小红书实验学习”笔记本。复用运行中的服务，避免双开共享 store。
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
