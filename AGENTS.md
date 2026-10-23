# 研习伴共享开发入口

每位执行者使用独立副本或Git工作树；同一目录仅可轮流接手。每次新任务、恢复任务或更换执行者，先执行 docs/任务进入检查.md：核对工作区和远端main，读取最新CONTEXT.md、完整TASKS.md及COLLAB.md，查找未完成、暂停和历史完成项中的遗留；运行 npm.cmd run task:check，把核查和认领写入Markdown后再开始实现。以代码、Git和本轮可重复验证为准，不以旧聊天或旧Recovery Capsule推断完成度。

框架优先沿用原始main的Node原生服务、Python/Pydantic契约及五阶段学习管线。A/B分工以TASKS.md和docs/主项目核查与分工-2026-10-23.md为准；认领时写明准确owner、原任务、阶段、分支、涉及文件与验收。不覆盖另一执行者文件，不从旧dev-stage覆盖。只提交本任务已验证文件，上传按用户现有授权执行；区分分支完成与main集成。不得同时启动多个共享data/store.json的服务进程。

当前状态和后续任务不在本文件重复维护，统一见 CONTEXT.md / TASKS.md。
