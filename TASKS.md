# TASKS.md — 共享任务表（codex + claude code）

> 规则见 `COLLAB.md`。认领前先读本表：`status=doing` 且 owner≠你的条目**不要碰**。
> 状态取值：`open`（待认领）/ `doing`（进行中）/ `blocked`（等外部条件）/ `done`（已验证完成）。
> 完成定义=相关验证通过 + `CONTEXT.md` 已更新 + 已 commit。

## 待认领（open）

- **T12 · OCR 应用内集成** — open · owner: 待确认
  - OCR worker 与测试素材已由另一 agent 提交于 f5c71fd；T15 已完成小红书图文的命令行 OCR → 文本资料导入。应用内图片/PDF 上传、OCR 任务队列与校对定位仍待实现；不重复改写 worker。
- **T13 · 长文上下文与来源映射** — open · owner: —
  - 当前共读来源仅 1800 字符、笔记前 800 字符，简单关键词排序。应按模型能力设计预算、全篇分段整理和稳定笔记块来源关联，补长资料覆盖测试。
- **T14 · 交付验收与数据恢复** — open · owner: —
  - 真实材料 20 问验收、备份恢复、工作台集成尚未完成；删除当前是实际删除，恢复能力与计划书要求仍有差距。


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

- **T17 · 笔记 Markdown 阅读视图（渲染）** — done · owner: claude code · 2026-10-10
  - 起因：共读笔记是 `<textarea>` 原始 markdown，格式符号（`#`/`**`/`>`/`-`）全裸露、不可读。
  - 方案：笔记面板加「阅读 / 编辑」切换，默认**阅读**——手写零依赖 `renderMarkdown()` 把 markdown 渲染成排版文本（标题 h1–h6、`**` 加粗、`*` 斜体、`` ` `` 行内代码、无序/有序列表、`>` 引用块、`---` 分隔线）；**编辑**回到原 textarea 原样编辑，选中一段共读逻辑不变。
  - 落地：仅 `public/index.html`（`#noteRender` 容器 + `.view-toggle` 两按钮 + 脚注文案）、`public/app.js`（`noteView` 状态 + `renderNote()` + `renderMarkdown()` + 阅读态 `mouseup` 选中回显 + `saveNote`/`loadRevision`/追加到笔记后同步刷新）、`public/style.css`（`.view-toggle`、`.note-render` 排版）；纯前端零新依赖，后端/接口/store/共读链路零改动。
  - 验证：`node --check` 过；浏览器活体——阅读/编辑两态显隐往返正确，阅读态渲染 1 h1/9 h2/20 ul/1 blockquote/51 strong 且无残留原始符号，阅读态与编辑态选中均触发右侧共读回显，控制台零报错，单实例 8765。
  - `[S#]` 来源引用渲染为**右上角上标徽章**（`<sup class="cite">`）；笔记阅读态整体采用 **Typora 主题风格**（h1 下边框、居中、引用块斜体）。
  - 修首屏竞态（`state` 未赋值时 `renderSkillMessages` 读 `state.messages` 抛 "Cannot read properties of undefined"）：`renderMessages`/`renderSkillMessages` 改 `(state?.messages||[])` 空值保护。布局收紧——右栏（共读）固定窄栏（基础 `minmax(330px,400px)`、≤1100px `minmax(300px,380px)`），笔记阅读/编辑**填满左栏靠左**（初版曾限宽 720px 居中，用户反馈"太窄"→已去掉限宽居中）。
  - **修标题缩进 bug**：`endList()` 误推一整对空 `<ul></ul>`（列表开标签另在列表项分支单独 push）→ 列表永不闭合、浏览器把后续所有 `h2` 重新嵌套进未闭合 `<ul>` 并继承 `padding-left:22px`；改只推 `</ul>` 闭标签。
  - **资料来源超链接**：`renderMarkdown()` 新增 `xhsItem()` 识别 `- S# 标题（24位hex小红书id）` → 渲染为 `xiaohongshu.com/explore/<id>` 超链接（新标签打开），三本 XHS 笔记本各 8 条全部命中。
  - 验证补充：`node --check` 过；活体 9 标题零缩进 + 8 条资料来源超链接 href 正确 + 列表零嵌套 + 控制台零报错；`npm test` 18/18。
  - **整体改 #3a83f7 蓝色系**：`style.css` 50+ 绿/青绿 hex 全映射为蓝色系（`--green`→#3a83f7、`--border`/`--muted` 转蓝灰）；保留白、红色 `.danger`、暖色只读态 `is-historical`；新增 `.note-render a` 主题蓝链接规则。
  - **引用上标定位修复**：`.note-render sup.cite` 由 `vertical-align:super;line-height:0`（上标浮得过高错位）改为 `vertical-align:0.5em;line-height:1`（+10px/左边距 2px），上标紧贴正文。
  - 验证补充2：脚本核验无残留绿系 hex、#3a83f7 就位、红/暖/白保留；活体 logo/保存按钮/激活 tab/导航/引用块/资料来源链接均 `rgb(58,131,247)`、引用上标 `va=5px/lh=10px`、控制台零报错。
  - 边界：渲染为轻量子集（不支持表格/嵌套列表/图片）；`[S#]` 只匹配 `S`+数字 转上标，不误伤真实 `[链接](url)`；资料来源链接只匹配"列表项以 `S#` 开头 + 结尾 24 位 hex id"这一特定格式；保存读隐藏编辑框的值，阅读态也能保存。
  - 提交：本地 commit（仅三前端文件），**未 push**（push 需用户授权）。

- **T16 · 前端 UI 一致性优化（UI Finish-Gate A–G）** — done · owner: claude code · 2026-10-10
  - 依据 UI Finish-Gate Reviewer 对现有前端的复审，落地 7 项「更清晰/一致」必修项；全部纯前端、零新依赖、不改后端/接口/store。
    - A 语言统一中文（品牌副标「从记录到实践」、eyebrow「用你的资料学习」、粤语音色选项标签「粤语女声」，value 不变）。
    - B 状态标签语义互斥（`#revisionLabel` 四态：尚未保存 / 有未保存的修改 / 已保存·时间戳 / 只读·历史版本，随 save/载入历史/编辑实时切换）。
    - C 计数徽标 0 值隐藏（`.tabs span:empty{display:none}`）+ 标签页 ARIA（`role=tablist`/`role=tab`、`aria-selected`、`tabindex` 0/-1 随切换）。
    - D 实验 skill 下拉下方显示 description（`#skillDesc`，无描述则隐藏）。
    - E 选择上下文就近反馈（编辑器脚注 `#noteSelEcho` 回显选中段摘要；`.note-footer` 加 `flex-wrap:wrap` 窄屏换行不溢出）。
    - F 历史版本只读态（`#noteEditor.is-historical` 样式 + `readOnly` + 「继续编辑」按钮往返）。
    - G 空笔记本首屏 CTA（无笔记本时隐藏编辑器/工具条/脚注，显示「＋ 创建第一本学习笔记本」，点开复用 `#newBookDialog`）。
  - **附带修一处确定性 bug**：`app.js` `loadRevision` 用 `await` 但未声明 `async`，属语法错误会让整个前端脚本解析失败（应用实际已挂）；改 `async function loadRevision` 后 `node --check` 通过。
  - 验证：`node --check` 通过；浏览器活体逐一核验 A–G 各态（含 375px 窄屏脚注换行零溢出、全程无 store 写入）；单实例运行 8765（验证前停掉旧进程、由预览面板起单实例）。
  - 提交：本地 commit `e19c58a`（仅 `public/index.html`、`public/app.js`、`public/style.css` 三文件，**未 push**）；`.claude/launch.json` 临时预览改动已还原未纳入。

- **T15 · 小红书图文采集 → OCR → 资料导入** — done · owner: codex · 2026-10-10
  - 修复首页 goto 等待 load 超时；搜索只取图文、每关键词最多 8 篇，并处理末页；用户本人扫码成功。
  - 三关键词各 8 篇，共 24 篇/131 张图；全部 OCR、Markdown 落盘，API 导入三个笔记本各 8 份。图像完整性验证通过。
  - 新增 scripts/import_xhs.py：按图片哈希复用 OCR/防重复导入，跳过视频和未完整下载的图片；仅调用现有 API，不改 store.json。
  - 验证：采集逻辑 3/3、导入边界 2/2；真实 UI 中可见资料，生成草稿与共读问答均返回引用。上下文截断仍存在，结果仅基于选取片段。
  - 使用说明 docs/小红书图文导入.md；验收报告在 MediaCrawler/data/xhs/import-report-2026-10-10.json。未改 base_config、OCR worker 或应用业务代码，未 push。

- **T11 · 双 agent 进度对齐** — done · owner: codex · 2026-10-10
  - 基线 main/483abf3；以实际代码与配置更新 README/CONTEXT，补充协作和接手入口，记录 OCR 未提交边界；业务文件和用户数据未修改。
  - 本轮验证：npm test 18/18、语法检查通过；8765 当时未运行。真实模型/浏览器结果沿用历史记录，不冒充本轮重测。


- **T10 · 朗读前剥离 Markdown（去星号残留）** — `done` · 用户 2026-10-09 反馈 AI 共读朗读把 `*`/`#`/反引号照读出来，提出"笔记与 markdown 分离"。
  - `public/app.js` 新增 `stripMarkdown(v)`（剥代码围栏/行内代码/图片/链接/标题/分隔线/列表符/加粗斜体/引用块 + 空白折叠为连续口语文本），`speak()` 送 `/api/tts`（`text:clean`）与浏览器本地音 fallback 前统一清洗；两处「朗读」调用点（共读/实验指导）无需改。
  - 后端/接口零改动（`/api/tts` 仍 `{text}` ≤2000 字，wire WAV）；`tests/tts.test.mjs` 不变。
  - 验证：`node --check` 过；`npm test` 18/18；活体 hook `window.fetch` 捕获 `/api/tts` 请求体——markdown 重 DH5α 回答送出 **275 字纯口语文本，无 `*`/`#`/反引号/围栏/引用括号残留**；控制台无报错。
  - **边界（如实）**：只清洗"读"路径，编辑区/导出仍是原始 markdown；剥规则为启发式正则，极端嵌套 markdown 可能有残留。
- **T9 · 朗读引擎换 edge-tts（弃 Kokoro 中文）** — `done` · 用户 2026-10-09 反馈 Kokoro 中文难听，拍板改用 edge-tts（云端）。
  - `tts_worker.py` 重写：edge-tts 出裸 Opus 帧 → **ffmpeg** 解码 24kHz 16-bit mono WAV（wire 格式不变）；voice 白名单 + 旧 Kokoro 名自动映射，默认 `zh-CN-XiaoxiaoNeural`。
  - 依赖：`.venv-tts` 加 `edge-tts`；**新增 ffmpeg 硬依赖**（PATH）；`setup-tts.ps1` 改（校验 ffmpeg、清理旧 models/kokoro）。
  - 前端：设置音色下拉 8 Kokoro → **11 edge-tts 中文音色**；`speak()` 引擎无关未改。`server.mjs` 启动时旧 `ttsVoice` 非 `zh-*` 自动归一。
  - 验证：`npm test` 18/18；活体 `/api/health` tts=edge-tts/云端、`/api/tts` 回有效 WAV、下拉 11 项、旧音色已迁移、无控制台报错。
  - **边界**：需联网、文本经微软服务（非离线/非私有）；失败回退浏览器本地音。
- **T8 · 实验 skill 实操指导（垂直切片）** — `done` · 用户 2026-10-09 拍板：skill 载体=**SKILL.md 文件**、指导=**问答式**、范围=**先做垂直切片**。
  - `skills/dh5a-gfp-transformation.md`：由现有「酵母转化」笔记整理的 1 个真实 skill（frontmatter `name/title/description` + 6 步骤，每步 操作/参数/注意/检查点，参数缺失如实标"待核对"，含安全段）。
  - 后端：`createApp` 新增 `skillsDir` 注入缝；`listSkills()`/`readSkill(name)`（手写 frontmatter 解析，零依赖，`[a-z0-9-]` 路径校验）；`GET /api/skills`（列 `skills/*.md`）；`POST /api/skill-ask`（问答式，LLM 只依据 skill 全文定位当前步骤→给操作/参数/易错安全/下一步，存 `db.messages` 新 `type:'skill'` + `skill` 字段，无 notebookId 故不污染共读列表）；`POST /api/skills/generate`（笔记/材料→LLM→写 skill，**同名文件自动加后缀不覆盖**）。
  - 前端：新 tab「实验指导」（`data-tab="skillGuide"`）：skill 下拉 + 问答输入 + 回答渲染（含「朗读」复用 Kokoro `speak()`）+「从当前笔记生成 skill」。
  - 验证：`tests/skill.test.mjs` 7 项（列目录/空目录/问答存消息/空问题400·不存在404/generate 落文件·需材料400/同名不覆盖）；`npm test` 18/18。活体：选 DH5α skill 问「我准备加质粒，下一步？」→ 回答准确定位**第 2 步**（加质粒+冰浴）+参数(5μL/50ng·μL⁻¹/30min)+安全+预告第 3 步热激；「朗读」触发 `POST /api/tts` 200 `audio/wav`；回归共读/生成/转写/删除不受影响、skill 消息不泄漏进共读列表。详见 `docs/开发进度.md`。
- v0.1 骨架 / v0.2 M0 真实模型联调 / M1 材料与来源验收 —— 见 `docs/开发进度.md`。
- **T6 · GitHub 备份首次 push** — 项目专属 repo + 三件套 + 首次 push 到 `origin=Aa144085412/Study-companion`（`main`）。
- **T1 · 删除笔记本/来源能力** — `DELETE /api/notebooks/{id}` + `DELETE /api/sources/{id}`（版本链双向级联 + 孤儿媒体文件清理，带守卫）+ 界面删除按钮（`.danger`）+ 二次确认。回归 `tests/delete.test.mjs` 2 项；浏览器实测笔记本删除全流程通过。
- **T7 · 自然中文朗读（Kokoro-ONNX，纯 CPU 不占显存）** — `POST /api/tts`（≤2000 字，回 `audio/wav`）+ 前端 `speak()`/`stopSpeak()`（走 `/api/tts`、失败回退浏览器本地音）+ 设置 8 中文音色（`db.settings.ttsVoice`）+ `setup-tts.ps1`（`.venv-tts`：kokoro-onnx+soundfile，下载模型/音色，自检写 flag）。活体中修 `ttsStatus()` 漏返 `python` 致 `spawn(undefined)`。`npm test` 11/11；浏览器实测 speak→200→blob 播放、stopSpeak、音色下拉、无控制台报错。详见 `docs/开发进度.md`。
