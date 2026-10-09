# CONTEXT.md — 研习伴（Study Companion）

> 两个 agent（codex + claude code）共享的短期项目状态。
> 开工前先读本文件 + `TASKS.md` + `git log`；每次 checkpoint 后更新本文件。
> 优先级：代码 > 测试/运行时 > 配置 > git diff > 本文件 > TASKS.md > git history > 对话记忆。

## Recovery Capsule

- **Status**: NORMAL
- **Goal**: 个人学习应用——本地 Node.js（127.0.0.1:8765，零 npm 依赖）+ 本地 ASR（faster-whisper）+ 本地 LLM（NInfer 18081），把音视频/文稿转文字并与模型共读、引用定位原媒体。
- **Active task**: 无进行中任务（M0/M1 主体已收口，等待用户决策）。
- **Last verified state**: M1 核心验收通过（A02/A03/A05/A06/A12）；长音频/视频转写已活体验证；M1 测试数据已清理；store 现 2 个笔记本（使用指南 + 酵母转化 M0 样例）。服务器现役 pid 见 `data/server.pid`。
- **Last meaningful success**: M1 验收全项通过（2026-10-09）。
- **Current blocker**: 无硬性阻塞。待用户决策：①是否装 FunASR 做引擎对比 ②是否补「删除笔记本/来源」功能 ③真实实验样例替换。
- **Next safe action**: 见 `TASKS.md` 中 status=open 且 owner 已认领的条目；无认领时先问用户优先级。
- **Files involved**: `server.mjs`（API/队列/引用）、`public/app.js`（前端）、`asr_worker.py`（ASR 出口，OpenCC t2s）、`tests/`、`docs/开发进度.md`。

## Current / Last Verified State

- 转写链路：`/api/upload`（250MB 流式）→ job 队列（queued/running/completed/failed/cancelled/interrupted）→ `asr_worker.py`（faster-whisper-small CPU int8，OpenCC 繁→简）→ 带时间戳段落来源。
- 实测速度：71.9s 音频 ≈10.7s（约 9× 实时）；mp4 视频经 PyAV 抽音轨端到端通过。
- 数据卫生：`data/store.json` 不含 M1 测试数据；`data/`、`models/`、`backups/` 不进 git（见 `.gitignore`）。
- 已知限制：任务中断后重试**从头转写**（无断点续传）；无删除笔记本/来源能力（API 与 UI 均无）。

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
- 项目专属 git repo + 三件套（本文件/TASKS/COLLAB）+ GitHub 备份（进行中）。

## Tried / Failed

- 试图经 shell heredoc 写含中文文件 → GBK 转码损坏。改用 Write 工具写 UTF-8。
- Windows 默认录音设备被远程桌面虚拟麦抢占 → 改在应用内加麦克风下拉选择，不改系统默认设备。

## Validation / Tests

- Node 测试：`npm test`（tests/app.test.mjs + tests/v02.test.mjs），此前 6/6 通过。
- OpenCC 回归：`tests/opencc_check.py`。
- 重启/停止：`tests/restart_server.ps1` / `tests/stop_server.ps1`。

## Next Steps

见 `TASKS.md`。
