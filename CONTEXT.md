# CONTEXT.md — 研习伴（Study Companion）

> 两个 agent（codex + claude code）共享的短期项目状态。
> 开工前先读本文件 + `TASKS.md` + `git log`；每次 checkpoint 后更新本文件。
> 优先级：代码 > 测试/运行时 > 配置 > git diff > 本文件 > TASKS.md > git history > 对话记忆。

## Recovery Capsule

- **Status**: NORMAL
- **Goal**: 个人学习 + 实操应用——本地 Node.js（127.0.0.1:8765，零 npm 依赖）+ 本地 ASR（faster-whisper）+ 云端 TTS（edge-tts 中文音色，需联网；朗读前剥 markdown 去星号）+ 本地 LLM（NInfer 18081），把音视频/文稿转文字并与模型共读、引用定位原媒体、自然中文朗读；**新增实验 skill 实操指导**（把实验笔记沉淀为 `skills/*.md`，实操时问答式让 agent 定位当前步骤给指导）。
- **Active task**: 无进行中任务（T8 实验 skill 垂直切片已收口）。
- **Last verified state**: **实验 skill 实操指导（垂直切片）已上线并活体验证**——`skills/dh5a-gfp-transformation.md`（由「酵母转化」笔记整理，6 步骤）；`GET /api/skills`、`POST /api/skill-ask`（问答式，存 `type:'skill'`）、`POST /api/skills/generate`（笔记→skill，同名自动加后缀不覆盖）；前端「实验指导」tab（skill 下拉+问答+朗读+从笔记生成）。活体：选 DH5α skill 问「准备加质粒，下一步？」→ 回答准确定位**第 2 步**（加质粒+冰浴）+参数(5μL/50ng·μL⁻¹/30min)+安全+预告第 3 步热激；「朗读」走 **edge-tts（云端中文音色，需联网；worker 经 ffmpeg 转 24kHz WAV，11 音色，旧 Kokoro 值启动时自动迁移为 `zh-CN-XiaoxiaoNeural`）** 触发 `POST /api/tts` 200 `audio/wav`（浏览器实测有效 RIFF）；回归共读/生成/转写/删除不受影响、skill 消息不泄漏进共读列表。**朗读前统一剥离 markdown**（`public/app.js` 新增 `stripMarkdown`，`speak()` 送 TTS 前清洗）——AI 共读朗读不再读星号残留，活体捕获 `/api/tts` 请求体确认 markdown 重回答送出 275 字纯口语文本、无任何 `*`/`#`/反引号/列表符残留。`npm test` 18/18（含 7 项 skill）。此前自然中文朗读已由 Kokoro 换 **edge-tts**（Kokoro 中文弃用）、M1 核心验收、删除能力均已收口。项目专属 git repo 备份 `origin=github.com/Aa144085412/Study-companion`（`main`）。服务器经 preview/start.ps1 启动，勿双开共享 `data/store`。
- **Last meaningful success**: **朗读前统一剥离 markdown**（`public/app.js` 新增 `stripMarkdown`，`speak()` 送 TTS 前清洗，去 `*`/`#`/反引号/列表符/标题/引用块）——AI 共读朗读不再读星号残留，活体捕获 `/api/tts` 请求体确认 markdown 重回答送出 275 字纯口语文本无符号残留（2026-10-09）；此前朗读引擎由 Kokoro 换 **edge-tts**（云端中文音色，需联网）、实验 skill 实操指导（垂直切片）均活体验证。
- **Current blocker**: 无硬性阻塞。待用户决策：①**T8b 铺开**（多 skill 自动路由 / 步骤陪跑 checklist / 录视频入口 / app 内 skill 编辑）②是否装 FunASR 做引擎对比 ③真实实验样例替换（自造规程 → 真实脱敏材料）。
- **Next safe action**: 见 `TASKS.md`；铺开范围待用户拍板。
- **Files involved**: `server.mjs`（API/队列/引用/TTS/skill 端点）、`public/app.js`+`public/index.html`+`public/style.css`（前端 speak/设置/实验指导 tab）、`skills/`（SKILL.md）、`asr_worker.py`、`tts.mjs`+`tts_worker.py`+`setup-tts.ps1`、`tests/skill.test.mjs`、`docs/开发进度.md`。

## Current / Last Verified State

- 转写链路：`/api/upload`（250MB 流式）→ job 队列（queued/running/completed/failed/cancelled/interrupted）→ `asr_worker.py`（faster-whisper-small CPU int8，OpenCC 繁→简）→ 带时间戳段落来源。
- 实测速度：71.9s 音频 ≈10.7s（约 9× 实时）；mp4 视频经 PyAV 抽音轨端到端通过。
- 数据卫生：`data/store.json` 不含 M1 测试数据；`data/`、`models/`、`backups/` 不进 git（见 `.gitignore`）。
- 已知限制：任务中断后重试**从头转写**（无断点续传）。TTS 为一次性进程（每次朗读含 ~1–2s 模型加载）、固定预置音色（非本人声音克隆）、`/api/tts` 上限 2000 字。

## Success Criteria

- 改动以「验证过的状态」为准：跑过相关测试/活体验证后才算完成。
- 每次交接：`CONTEXT.md` 的 Last verified state / Next safe action 已更新 + `TASKS.md` status 已更新 + 已验证改动已 commit。

## Important Decisions

- store.json（用户学习数据）**不入 git**，两 agent 共享同一本地副本。
- 本目录建**项目专属独立 repo**（脱离家目录大仓库），`main` 为共享真相分支。
- ASR 繁简统一在 `asr_worker.py` 单点出口用 OpenCC `t2s`，不改其他层。
- 勿长期双开共享 `data/store` 的服务器进程；重启=停→确认端口关→启动。

## Completed Work

- v0.1 骨架、v0.2 M0 真实模型联调、M1 材料/来源验收（详见 `docs/开发进度.md`）。
- 麦克风设备选择、转写繁→简归一化、长音视频转写验证。
- 删除笔记本/来源能力（API 双向级联 + 孤儿媒体清理 + 界面删除按钮 + 二次确认；`tests/delete.test.mjs`）。
- 自然中文朗读：**现用 edge-tts（云端中文音色，需联网）**——`/api/tts`（wire 格式 WAV）+ 前端 speak/stopSpeak（引擎无关，失败回退浏览器本地音）+ 11 音色设置 + `setup-tts.ps1`（含 ffmpeg 校验）+ 旧 Kokoro 音色启动时自动迁移 + **朗读前剥离 markdown（`public/app.js` `stripMarkdown`，去 `*`/`#`/反引号/列表符/标题/引用块，AI 共读朗读不再读星号残留）**；`tests/tts.test.mjs` 3 项。（早期曾为 Kokoro-ONNX 纯 CPU，中文质量差弃用。）
- **实验 skill 实操指导（垂直切片）**：`skills/dh5a-gfp-transformation.md` + `GET /api/skills` + `POST /api/skill-ask`（问答式）+ `POST /api/skills/generate`（笔记→skill，同名不覆盖）+ 前端「实验指导」tab；`tests/skill.test.mjs` 7 项。
- 项目专属 git repo + 三件套（本文件/TASKS/COLLAB）+ GitHub 备份（已完成，origin `Aa144085412/Study-companion`）。

## Tried / Failed

- 试图经 shell heredoc 写含中文文件 → GBK 转码损坏。改用 Write 工具写 UTF-8。
- Windows 默认录音设备被远程桌面虚拟麦抢占 → 改在应用内加麦克风下拉选择，不改系统默认设备。

## Validation / Tests

- Node 测试：`npm test`（app/v02/delete/tts/skill 等），现 18/18 通过（含 3 项 TTS、7 项 skill）。
- OpenCC 回归：`tests/opencc_check.py`。
- 重启/停止：`tests/restart_server.ps1` / `tests/stop_server.ps1`。

## Next Steps

见 `TASKS.md`。
