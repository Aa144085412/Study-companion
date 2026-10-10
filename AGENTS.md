# 研习伴共享开发入口

此目录由 Codex 与 Claude Code 共用。每次接手先读 CONTEXT.md、TASKS.md、COLLAB.md，并检查 git status 与最近提交。以磁盘上的当前代码、配置和可重复验证为准，不以旧聊天推断完成度。

认领任务时写明 owner 和涉及文件；不覆盖另一 agent 正在编辑或尚未确认归属的未提交文件。唯一开发目录是本目录，不从旧 dev-stage 覆盖。只提交本任务已验证文件，不自动 push。不得同时启动多个共享 data/store.json 的服务进程。

当前状态和后续任务不在本文件重复维护，统一见 CONTEXT.md / TASKS.md。
