# TASKS.md — 共享任务表（codex + claude code）

> 规则见 `COLLAB.md`。认领前先读本表：`status=doing` 且 owner≠你的条目**不要碰**。
> 状态取值：`open`（待认领）/ `doing`（进行中）/ `blocked`（等外部条件）/ `done`（已验证完成）。
> 完成定义=相关验证通过 + `CONTEXT.md` 已更新 + 已 commit。

## 待认领（open）

- **T8b · 实验 skill 铺开（垂直切片之后的下一步，待用户拍板）** — `open` · owner: —
  - T8 垂直切片已收口（见 done）。铺开方向：①多个 skill + 按问题自动路由到最相关 skill；②"步骤陪跑"checklist 式跟跑（而非纯问答）；③录音/录视频入口 + 音视频→笔记→skill 一键管线打通；④skill 在 app 内可视化编辑（现靠手改 `skills/*.md`）。
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

- **T8 · 实验 skill 实操指导（垂直切片）** — `done` · 用户 2026-10-09 拍板：skill 载体=**SKILL.md 文件**、指导=**问答式**、范围=**先做垂直切片**。
  - `skills/dh5a-gfp-transformation.md`：由现有「酵母转化」笔记整理的 1 个真实 skill（frontmatter `name/title/description` + 6 步骤，每步 操作/参数/注意/检查点，参数缺失如实标"待核对"，含安全段）。
  - 后端：`createApp` 新增 `skillsDir` 注入缝；`listSkills()`/`readSkill(name)`（手写 frontmatter 解析，零依赖，`[a-z0-9-]` 路径校验）；`GET /api/skills`（列 `skills/*.md`）；`POST /api/skill-ask`（问答式，LLM 只依据 skill 全文定位当前步骤→给操作/参数/易错安全/下一步，存 `db.messages` 新 `type:'skill'` + `skill` 字段，无 notebookId 故不污染共读列表）；`POST /api/skills/generate`（笔记/材料→LLM→写 skill，**同名文件自动加后缀不覆盖**）。
  - 前端：新 tab「实验指导」（`data-tab="skillGuide"`）：skill 下拉 + 问答输入 + 回答渲染（含「朗读」复用 Kokoro `speak()`）+「从当前笔记生成 skill」。
  - 验证：`tests/skill.test.mjs` 7 项（列目录/空目录/问答存消息/空问题400·不存在404/generate 落文件·需材料400/同名不覆盖）；`npm test` 18/18。活体：选 DH5α skill 问「我准备加质粒，下一步？」→ 回答准确定位**第 2 步**（加质粒+冰浴）+参数(5μL/50ng·μL⁻¹/30min)+安全+预告第 3 步热激；「朗读」触发 `POST /api/tts` 200 `audio/wav`；回归共读/生成/转写/删除不受影响、skill 消息不泄漏进共读列表。详见 `docs/开发进度.md`。
- v0.1 骨架 / v0.2 M0 真实模型联调 / M1 材料与来源验收 —— 见 `docs/开发进度.md`。
- **T6 · GitHub 备份首次 push** — 项目专属 repo + 三件套 + 首次 push 到 `origin=Aa144085412/Study-companion`（`main`）。
- **T1 · 删除笔记本/来源能力** — `DELETE /api/notebooks/{id}` + `DELETE /api/sources/{id}`（版本链双向级联 + 孤儿媒体文件清理，带守卫）+ 界面删除按钮（`.danger`）+ 二次确认。回归 `tests/delete.test.mjs` 2 项；浏览器实测笔记本删除全流程通过。
- **T7 · 自然中文朗读（Kokoro-ONNX，纯 CPU 不占显存）** — `POST /api/tts`（≤2000 字，回 `audio/wav`）+ 前端 `speak()`/`stopSpeak()`（走 `/api/tts`、失败回退浏览器本地音）+ 设置 8 中文音色（`db.settings.ttsVoice`）+ `setup-tts.ps1`（`.venv-tts`：kokoro-onnx+soundfile，下载模型/音色，自检写 flag）。活体中修 `ttsStatus()` 漏返 `python` 致 `spawn(undefined)`。`npm test` 11/11；浏览器实测 speak→200→blob 播放、stopSpeak、音色下拉、无控制台报错。详见 `docs/开发进度.md`。
