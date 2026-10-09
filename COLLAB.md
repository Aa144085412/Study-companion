# COLLAB.md — 双 agent（codex + claude code）协作手册

同一台机器、同一个文件夹、同一个 git repo。两人各自的对话上下文会独立压缩/重启，
所以**进度只认文件系统和 git**，不认对话记忆。守这份手册即可自动衔接。

## 真相源优先级（冲突时以此为准）

代码 > 测试/运行时行为 > 配置 > git diff > `CONTEXT.md` > `TASKS.md` > git history > 对话记忆。

## 开工前（每个 agent，每次接手）

1. 读 `CONTEXT.md` 的 Recovery Capsule（Status / Active task / Last verified state / Current blocker / Next safe action）。
2. 读 `TASKS.md`，找 `status=open` 且 owner=你的（或无 owner 可认领）的条目。
3. `git log --oneline -15` + `git status`：看对方做到哪、有没有未提交改动。
4. 认领：在 `TASKS.md` 把该条 `owner` 改成自己、`status` 改 `doing`。
5. 需要时验证运行时（如 `curl 127.0.0.1:8765/api/state`），别假设服务在跑。

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
- 拉取：接手前 `git pull`（若对方已 push）；本地两 agent 同机同树，通常无需频繁 pull，push 仅作备份/跨机。

## 不要做

- 不重复已成功/已验证的操作；不重写已解决的工作。
- 不假设工具跑成功——以实际返回为准。
- 不擅自 `git push`、不动家目录（`C:/Users/a1440`）大仓库、不动 `data/store.json` 之外的个人数据。
- 破坏性操作（删除文件/分支、force push、重置）先问用户。
