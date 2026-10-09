# TASKS.md — 共享任务表（codex + claude code）

> 规则见 `COLLAB.md`。认领前先读本表：`status=doing` 且 owner≠你的条目**不要碰**。
> 状态取值：`open`（待认领）/ `doing`（进行中）/ `blocked`（等外部条件）/ `done`（已验证完成）。
> 完成定义=相关验证通过 + `CONTEXT.md` 已更新 + 已 commit。

## 待认领（open）

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

- v0.1 骨架 / v0.2 M0 真实模型联调 / M1 材料与来源验收 —— 见 `docs/开发进度.md`。
- **T6 · GitHub 备份首次 push** — 项目专属 repo + 三件套 + 首次 push 到 `origin=Aa144085412/Study-companion`（`main`）。
- **T1 · 删除笔记本/来源能力** — `DELETE /api/notebooks/{id}` + `DELETE /api/sources/{id}`（版本链双向级联 + 孤儿媒体文件清理，带守卫）+ 界面删除按钮（`.danger`）+ 二次确认。回归 `tests/delete.test.mjs` 2 项，全套 8/8；浏览器实测笔记本删除全流程通过。
