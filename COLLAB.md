# COLLAB.md — 双 agent（codex + claude code）协作手册

每位工作者使用独立副本或Git工作树，同一目录仅可明确轮流接手。进度以代码、验证、文件系统和Git为准；主项目原框架优先，不根据分支说明或旧聊天另建一套业务实现。A/B职责见 [主项目核查与分工](docs/主项目核查与分工-2026-10-23.md)。

## 真相源优先级（冲突时以此为准）

代码 > 测试/运行时行为 > 配置 > git diff > `CONTEXT.md` > `TASKS.md` > git history > 对话记忆。

## 开工前（每个 agent，每次接手）

必须按 [任务进入检查](docs/任务进入检查.md) 的顺序执行：工作区归属与fetch → 主线差异与原框架 → CONTEXT顶部和完整TASKS → 未完成/暂停/历史遗留 → MD进入记录与认领 → 实现。旧Recovery Capsule只作历史背景。

codex/cloud-api-onboarding 与 collab/content-quality 另具备 `npm.cmd run verify`，统一验收先执行主项目task:check，再做语法、说明、Node与Python回归。该入口随PR #1单独审阅，未集成main前不要在原主线假定它存在。

先运行 `npm.cmd run task:check`，认领后再带 `--task` 和准确 `--owner` 核对；T45的hold不能被open状态覆盖。任务表可能在末尾追加条目，不只读顶部。需要在线验证时先只读检查已有服务，不假设服务或模型已启动。

## 收尾 / 交接（做完一个可验证单元）

1. 跑相关验证：`npm test`、`tests/opencc_check.py`、或活体 curl。以「验证过的状态」为准。
2. 更新 `CONTEXT.md`：Last verified state、Next safe action、Completed Work（若新增）。
3. 更新 `TASKS.md`：该条 `status` → `done`（或 `blocked`+原因）。
4. **只提交已验证改动**：`git add <具体文件>`（别 `-A`），commit message 写「为什么」。
5. 若涉及服务器：停→确认 8765 端口关→启动，勿长期双开共享 `data/store` 的进程。
6. 需要留档时更新 `docs/开发进度.md`。

## 防冲突（关键）

- **owner 原则**：`TASKS.md` 里 `status=doing` 的条目，owner 不是你的就别碰相关文件。
- 提交前 `git status` 看有没有对方的未提交改动；有就先读对方改了什么，必要时等对方 commit。
- 一次 commit 一个可验证单元，粒度小，别把多件不相关的事混进一个 commit。
- 大改动或方向变更：先写进 `CONTEXT.md` 的 Important Decisions，再动手。

## GitHub 同步节奏

- `main` = 已验证的共享真相；只有验证过的东西进 main。
- **push 需授权**：`push` 到 GitHub 属影响外部共享状态的动作，除非用户明确授权，先问再推。
- 拉取：每次接手先fetch核对远端与当前分支；工作区干净后同步对应分支和origin/main。PR分支已完成但未合入main时单独记集成待办，不把它当主线已经具备的能力。阶段上传授权在任务范围内持续有效，主线集成与部署按相应授权执行。

## 不要做

- 不重复已成功/已验证的操作；不重写已解决的工作。
- 不假设工具跑成功——以实际返回为准。
- 不擅自 `git push`、不动家目录（`C:/Users/a1440`）大仓库、不动 `data/store.json` 之外的个人数据。
- 破坏性操作（删除文件/分支、force push、重置）先问用户。

## 2026-10-10 补充：共享目录接手规则

- 项目入口为 AGENTS.md → CONTEXT.md / TASKS.md / 本文件。历史聊天仅用于解释背景。
- 任务认领写明 owner、状态、涉及文件和验收命令；另一 agent 的未提交文件先确认归属，不能自动当成废弃文件。
- 修改文档前也应检查文件哈希或最新 diff，变化后重读，避免旧进度覆盖新进度。
- 区分“代码存在”“模拟测试通过”“历史真实验证”“当前在线验证”；模型/环境文件存在不代表服务在线或功能完整。
- 接手前 read-only 检查运行状态；禁止为了对齐进度擅自重启正在运行的用户服务。
- 当前 ASR 本地离线，TTS 为 edge-tts 云端；不再复述旧 Kokoro 或全离线结论。
- 不从旧 dev-stage 暂存覆盖共享项目。只提交本任务明确修改的文件，不夹带 OCR 等他人工作，不自动 push。
