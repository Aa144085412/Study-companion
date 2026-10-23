# 研习伴 · Study Companion

从记录到理解，从理解到实践。

当前版本为 **v0.2.0 开发版**，仍是本机单用户研发原型。音视频与文稿可整理为带出处的学习笔记，支持共读、选择题练习和可移植 skill；引用可追溯不等于内容准确，尚未完成全部产品交付验收。

## 新执行者从这里开始

每次执行前按主项目 [任务进入检查](docs/任务进入检查.md) 核对完整进度和历史遗留，写Markdown进入记录后认领再实现。最新A/B与原任务的关系以 [主项目核查与分工](docs/主项目核查与分工-2026-10-23.md)、TASKS.md和CONTEXT.md顶部为准，原五阶段架构优先；PR #1功能尚未集成main。

每位执行者使用独立 clone 或 Git 工作树，每项任务从最新 main 创建分支，通过 PR 审核后合并。先读 [CONTEXT.md](CONTEXT.md) 顶部最新状态、[TASKS.md](TASKS.md) 与 [COLLAB.md](COLLAB.md)，再查看当前分支、工作区和近期提交。

两位工作者的具体安排见 [双人分工与验收](docs/双人分工与验收.md)：A（本会话 Codex）继续接入与工程验证，B（第二位协作者，待认领）负责内容语义和证据质量；分支存在不等于双方都已完成任务。

同步命令、任务认领和阶段反馈格式见 [协作与阶段交付](docs/协作与阶段交付.md)。本次工作分支为 `codex/cloud-api-onboarding`；截至 2026-10-23，三个阶段已依次上传并核对远端提交，已创建 [PR #1](https://github.com/Aa144085412/Study-companion/pull/1)，等待审核。详情见 [阶段交付记录](docs/阶段交付-2026-10-23.md)。

## 没有本地模型：先走云端 API

需要 Node.js 22+、Python 3.10+ 和服务商提供的 API 基础地址、模型 ID、密钥。程序仍在本机运行，浏览器访问本机页面，模型请求由服务端发往你明确选择的 API。

在 Windows PowerShell 进入项目目录后执行：

```powershell
.\setup-course.ps1
node server.mjs
```

setup-course.ps1 只安装 Pydantic 数据格式校验依赖，不下载本地 AI 模型。打开 http://127.0.0.1:8765，进入“模型与语音设置”，选择云端 HTTPS API，填写地址、模型和密钥，点击“保存并测试文本生成”。从 TXT / Markdown / SRT 小材料开始验证。

完整字段、语音识别、图片和工具能力边界见 [云端 API 接入](docs/云端API接入.md)。聊天网站网址不能代替 API 基础地址；服务商未选定前不预设真实模型或可用密钥。

## 当前功能与前提

| 功能 | 当前行为与前提 |
|---|---|
| 文稿导入 | TXT、Markdown、SRT；保留来源与字幕时间戳 |
| 音视频导入 | 本地 MP3/WAV/M4A/MP4/WebM/OGG，最大 250 MB；去重、任务状态、取消与重试 |
| 语音识别 | 内置 faster-whisper，或显式配置本地/云端兼容 API；外部识别每文件最多 25 MB |
| 视频溯源 | 外部媒体转写须返回分段时间戳；SRT 可与原视频关联；引用可查看依据和回放 |
| 笔记与审查 | 分层笔记、历史版本、证据归因与审查；运行时需 Pydantic；模型审查不等于独立事实认证 |
| 共读与速练 | 依据资料问答、合格单选题、答后解析与错题回顾；仍需实际课程验收质量 |
| 图片与课件 | 云端图片须单独勾选且模型支持；本机 OCR/抽帧工具仍需另行准备 |
| 实验 Agent / skill | 模型支持工具调用时编排现有采集、转写与整理工具；外部抓取依赖各自环境和登录态 |
| 语音提问与朗读 | 提问按当前识别方式处理；朗读仍用 edge-tts 云端，失败回退浏览器本地音 |
| 数据管理 | 软删除回收站、恢复、笔记导出、整库笔记备份与覆盖式恢复 |

## 本地模型与独立语音环境

需要本地识别时运行 setup-asr.ps1，准备 .venv 与 models/faster-whisper-small；内置模式使用 CPU int8。本地语言模型使用你自行启动的兼容 HTTP 服务，默认占位地址不代表服务在线。

朗读另需 setup-tts.ps1、edge-tts 与 ffmpeg，文字经微软服务合成。课件 OCR/抽帧仍需 RapidOCR、Pillow、ffmpeg 等；setup-course.ps1 仅提供审计数据格式校验，不安装这些组件。项目不能称为完全离线，也不能把某台旧开发机的配置当作所有人的配置。

## 配置与数据位置

Node 原生 HTTP 服务，无第三方 npm 运行时依赖。应用只监听本机，保留现有本机访问和同源限制。元数据在 data/store.json，媒体在 data/media，skill 文件在 skills。

语言与语音 API 密钥独立保存在 data/api-secrets.json，或由 STUDY_LLM_API_KEY / STUDY_ASR_API_KEY 环境变量提供。状态接口和笔记备份不返回密钥；本机密钥文件是明文配置，需要保护本机数据目录。data、环境和模型被 Git 忽略，代码提交不能代替用户数据备份。

关闭网页不会停止服务。不要启动多个进程共享同一个 data/store.json。维护前确认没有正在进行的用户任务，不擅自重启已有服务。

## 验证与已知限制

```powershell
npm.cmd run verify
```

首次执行前先运行 setup-course.ps1。统一入口会检查 Python/Pydantic 环境、39 个 JavaScript 文件语法、当前说明链接、Node 顺序回归和 Python 回归；任一步失败会返回非零退出码，修复后重新运行完整入口。单独定位问题仍可使用 npm.cmd run check 或 npm.cmd test。

2026-10-23 本机完整验收：Node 114/114（API 专项 14/14）、Python 19/19、语法与说明链接通过，运行环境为 Node v26.7.0、Python 3.13。[GitHub 工程检查](https://github.com/Aa144085412/Study-companion/actions/runs/39886713593) 已验证实现提交 b8015e8 在 Windows/Node22/Python3.13 和 Windows/Node24/Python3.13 两组均通过，最新提交的检查见 PR #1。此前浏览器设置页模拟验证通过；云端响应为协议模拟，未选服务商、无真实密钥，未完成真实云端课程验收。

完整课程准确性、跨领域质量、外部采集可用性、家庭交付和多人在线服务仍有待办，以 TASKS.md 为准。[2026-10-22 架构快照](docs/现有架构与不足-2026-10-22.md) 和 [开发进度](docs/开发进度.md) 保留历史依据；涉及新模式以上述当前实现与本轮验证为准。
