# CONTEXT.md — 研习伴共享状态

> Codex 与 Claude Code 接手时先读本文件、TASKS.md、COLLAB.md，并检查 Git。最后对齐：2026-10-10。

## Recovery Capsule

- **Status**：v0.2.0 开发版；核心流程已实现，未完成完整产品验收。
- **Goal**：音视频 → 转写与校对 → 笔记 → AI 共读/语音提问 → 实验 skill 问答指导。
- **Active task**：本轮 T11 双 agent 进度对齐完成。发现 OCR 未提交开发文件，owner 尚未确认，后续不要覆盖、删除或代为提交。
- **Last verified state**：2026-10-10 本地 `npm.cmd test` 18/18 通过，`npm.cmd run check` 通过；真实 HTTP 访问 8765 被拒绝，服务当时未运行。本轮没有启动/重启生产服务，没有重新执行真实 LLM、ASR、TTS 或浏览器验收。
- **Code baseline**：核对起点 main / `483abf3`（朗读前剥离 Markdown）；其后本次仅文档对齐。接手时重新读取 HEAD，不把此基线当作永远最新。
- **Current blocker**：没有阻碍继续开发的确定故障；真实材料、OCR 在研归属和扩展优先级待确认。服务未运行不等于代码损坏。
- **Next safe action**：先确认 OCR 文件是否仍由另一 agent 开发；选择 TASKS.md 中未被认领的任务。优先处理真实材料验收、长文上下文和稳定来源关联；不要重复安装已就绪的 ASR 或重新实现已有 skill/TTS。
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
| OCR | 独立 ocr_worker.py 和测试素材 | 未提交、owner 未确认、无应用导入接口；不能标为已集成 |

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
