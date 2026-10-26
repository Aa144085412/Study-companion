# TASKS.md — 共享任务表（codex + claude code）

> 规则见 `COLLAB.md`。认领前先读本表：`status=doing` 且 owner≠你的条目**不要碰**。
> 状态取值：`open`（待认领）/ `doing`（进行中）/ `blocked`（等外部条件）/ `done`（已验证完成）。
> 完成定义=相关验证通过 + `CONTEXT.md` 已更新 + 已 commit。

> 每次执行先遵守 [任务进入检查](docs/任务进入检查.md)，核对完整任务表、历史遗留和origin/main，再填写进入记录与认领。原项目架构优先；最新分工与核查见 [主项目核查与分工](docs/主项目核查与分工-2026-10-23.md)。分支done不等于main已集成，后者单独记录。

## 业务角色 B 的本期任务 · 2026-10-26

用户已确认业务角色B，GitHub登录已核验为 **cmccjiang**；执行者为本会话Codex。此处的业务B不同于下方历史执行者编号，不改变旧任务负责人。账号、范围和验收见 [工作与科研端协作](docs/工作与科研端协作.md)。

## T59 · 业务B账号、任务、分支与验收登记
- status: done · owner: cmccjiang（业务B，Codex代执行） · branch: collab/cmccjiang-research-notes
- integration: branch-only
- files: TASKS.md, CONTEXT.md, COLLAB.md, docs/工作与科研端协作.md, docs/任务进入记录/2026-10-26-T59.md
- 范围：以origin/main/65328fe为基线，登记业务B与旧执行者编号的关系、独立分支、文件边界、本期任务和验收；保留原任务、暂停及主线集成条件。
- 验收：实际GitHub登录为cmccjiang；任务进入检查、MD链接和状态一致性通过；提交并上传任务分支。
- 已验证：带T59/owner的进入检查通过；63项任务未登记引用0、重复0；本轮两份新MD的2个实际相对链接、git diff --check通过。上传和PR以GitHub回执为准。

## T60 · 科研与报告笔记编排首阶段
- status: done · owner: cmccjiang（业务B，Codex代执行） · branch: collab/cmccjiang-research-notes
- integration: branch-only
- files: src/research_notes/*, scripts/research-report.mjs, tests/research-notes.test.mjs, tests/research-report-cli.test.mjs, tests/fixtures/research-notes/*, evaluation/research-notes/*, docs/工作与科研端协作.md, docs/任务进入记录/2026-10-26-T60.md, TASKS.md, CONTEXT.md
- 关联：复用T40的审计产物；为T41提供科研业务输出和开发样例，不关闭T41/T44/T56的公共质量遗留。
- 范围：只读现有PipelineArtifact；输出科研/报告模板、证据原句与来源/时间索引、明确待核对和冲突；CLI可在无模型环境演示、导出JSON与Markdown。可选人工栏目映射不新增事实、不把来源陈述升级为会议决议。
- 验收：未经审计/拒绝/冲突/不明视觉/无有效引用的事实不得进入来源要点；缺失决议、责任人、日期、文献信息保持待确认；保留来源与毫秒时间位置；无输入修改、无联网、无store写入；重复运行一致；专项与原回归通过。
- 已验证：科研专项29项；含原110项的Node总回归139/139、Python19/19、原PipelineArtifact样例契约及JS语法通过。两组JSON/MD演示可复算一致，24个证据锚点、8份本轮说明16个实际相对链接通过。仅合成开发样例，无真实模型/课程准确率。见T60进入记录与evaluation/research-notes。

## T61 · 科研端网页入口与证据回看集成
- status: done · owner: cmccjiang（业务B，Codex代执行） · branch: collab/cmccjiang-research-notes
- integration: branch-only · 提交946aaf4已推送，PR #3已更新且仍未合并
- files: server.mjs, public/index.html, public/app.js, public/style.css, tests/research-web.test.mjs, docs/工作与科研端协作.md, docs/任务进入记录/2026-10-26-T61.md, TASKS.md, CONTEXT.md
- 依赖：T60首版完成后，与C协调server.mjs/public/app.js共享文件、业务API和保存方式；需要云端时等待PR #1独立集成或明确基线。
- 验收目标：科研/报告模板选择、原证据跳转、导出/版本保存、失败重试和旧学习端回归；本期T60不将CLI说成网页入口已完成。
- 已验证：新增科研报告页和research/meeting模板；GET /api/research/report只读当前五阶段审计产物并沿用过期输入409门禁；原句按钮复用showReference定位原文/媒体；Markdown/JSON导出，POST /api/research/report/save幂等写入typed revision并保留旧版本。失败信息保留且页面生成按钮可重试；学习笔记、聊天、Skill入口过滤科研版次。Node141/141、Python19/19、npm run check、git diff --check通过。PR #1保持独立；C代码复核/PR合并仍待协作者处理。

## T62 · 科研端真实模型与材料质量验收
- status: blocked · owner: cmccjiang（业务B，Codex代执行） · branch: collab/cmccjiang-research-notes
- integration: branch-only · 提交946aaf4已推送，PR #3已更新且仍未合并
- files: scripts/evaluate-research-notes.mjs, evaluation/research-notes/real-evaluation.template.json, evaluation/research-notes/T62-真实材料验收说明.md, tests/research-evaluation.test.mjs, docs/工作与科研端协作.md, docs/任务进入记录/2026-10-26-T62.md, TASKS.md, CONTEXT.md
- 阻塞：用户尚未选定OpenAI兼容服务商/模型；PR #1仍open且未合并；没有本轮获准真实文献分享、组会/培训材料与人工标注。无需或不可把密钥贴到聊天/仓库。
- 已完成的工程部分：提供脱敏记录模板与确定性汇总器；拆分development/held_out；校验授权、非合成、服务名/版本、文献分享与组会/培训留出类型；逐例计算错误接受/拒绝、遗漏、来源定位、耗时、失败和关键错误状态。合成开发样例不能进入held_out；不输出准确率、正文或密钥。
- 验证：空模板实跑输出BLOCKED_MISSING_EXTERNAL_INPUTS且两类metrics为null；T62专项4项通过，包含development隔离、真实模式前置条件和已有输出保护。完整Node145/145、Python19/19、JS语法和git diff --check通过，详见T62进入记录。真实模型与材料效果未运行，不能标done。
- 解除条件：选定并本机配置服务及模型版本，提供有权使用的文献分享与组会/培训材料，完成人工逐例及独立复核；之后按模板运行REAL验收，关键错误修复或隔离后再更新状态。

## 历史执行者 A/B 安排（不等同业务角色）

| 工作者 | 当前阶段 | 原任务后续 | 当前状态 |
|---|---|---|---|
| A · Codex本会话 | T57任务进入检查与原进度对齐，属于T14工程交接子阶段 | T14/T13/T12各自仍open，按原优先级逐项认领 | T57工程阶段done；此前T50–T55仅分支完成 |
| B · 第二位协作者待认领 | T56承接T44语义/证据首阶段，之后T41；T58独立审阅PR #1 | 保留真实课程和材料/模型条件，不把模拟当真实质量验证 | open，尚未开工 |

## T57 · 主项目任务进入检查与遗留对齐
- status: done · owner: 工作者A/Codex · branch: codex/main-task-review
- 关联：T14工程交接子阶段；不代替T14的10片段回放、20问残项和工作台验收。
- files: scripts/check-task-entry.mjs, tests/task-entry.test.mjs, package.json, AGENTS.md, COLLAB.md, TASKS.md, CONTEXT.md, README.md, docs/任务进入检查.md, docs/主项目核查与分工-2026-10-23.md, docs/任务进入记录/2026-10-23-T57.md
- 验收：完整扫描主任务和交接引用；暂停/归属/已完成重复进入受阻；专项、原项目全回归及说明检查；独立PR更新main并同步A/B文档，分别记录上传与集成状态。
- 已验证：原项目Node110/110（含进入检查10项）、Python19/19、语法、7份说明18个实际相对链接通过；扫描59项、未登记引用0、重复0。主线与A/B集成按本轮PR回执核验，未把PR #1顺带合并。

## T58 · 云端 API 与工程分支的独立审阅和主线集成
- status: open · owner: 工作者B/待认领 · branch: codex/cloud-api-onboarding
- 范围：审阅PR #1对原框架、密钥、模型与回归的影响，按实际授权决定集成；不得把分支测试成功写成已合并。main集成后重新核对A/B分支和任务状态。
- 依赖：PR #1仍待审核；真实服务商与课程验收另行记录。

## T50 · 分支协作与阶段交接
- status: done · owner: 工作者A/Codex · branch: codex/cloud-api-onboarding
- integration: branch-only
- 证据：d88afce；已上传，PR #1待审。原主线由本轮T57同步接手规则。

## T51 · 兼容云端 API 的语言与语音配置
- status: done · owner: 工作者A/Codex · branch: codex/cloud-api-onboarding
- integration: branch-only
- 证据：7003ac3；协议模拟回归完成，main尚无该适配代码，真实服务商未验收。

## T52 · 云端使用与阶段交接说明
- status: done · owner: 工作者A/Codex · branch: codex/cloud-api-onboarding
- integration: branch-only
- 证据：2f999ee；已上传，PR #1中的使用前提不能当作未集成main的功能。

## T53 · 阶段上传与 PR
- status: done · owner: 工作者A/Codex · branch: codex/cloud-api-onboarding
- integration: branch-only
- 证据：a84fd77；已创建PR #1并核对上传，未因此自动合并main。

## T54 · A/B任务边界
- status: done · owner: 工作者A/Codex · branch: codex/cloud-api-onboarding
- integration: branch-only
- 证据：5f2e4ef；此前仅任务分支说明，本轮T57将原任务对应关系写入主项目两份进度文档。

## T55 · 统一工程验收与 PR 自动检查
- status: done · owner: 工作者A/Codex · branch: codex/cloud-api-onboarding
- integration: branch-only
- 证据：b8015e8、eed215d；该分支Node114/114、Python19/19及GitHub Node22/24通过。main目前仍使用自己的npm check/test，CI待T58审阅集成。

## T56 · B的语义、证据与跨领域质量首阶段
- status: open · owner: 工作者B/待认领 · branch: collab/content-quality
- 关联：T44优先，之后T41；先补至少6个新开发样例，跨至少两个领域，包含对象步骤、百分比语义及因果绑定的正反对照，逐例保存依据、预期理由和实际结果。
- files: src/attribution_auditor/semantic.mjs, tests/semantic.test.mjs, evaluation/worker-b/*, docs/质量验收-工作者B.md；只更新自己任务的共享说明。
- 验收：原管线与工程回归，真实课程复跑另需材料及可用模型；不改旧用户笔记，不把开发样例称为留出准确率，T45继续暂停。

## T45 · 通用学习工具产品化评估与本地家庭私测第一阶段
- status: open · owner: Codex · files: server.mjs, public/app.js, tests/quiz.test.mjs, src/release/*, scripts/check-release.mjs, evaluation/release/*, docs/产品化迭代路线.md, CONTEXT.md, TASKS.md
- hold: true · 用户2026-10-22明确暂停；不得自动认领或恢复。
- 用户确认：领域/学段通用，少量家庭本地安装私测。先建立发布验收、题目问题反馈与暂停机制；不把本轮称为完成全部产品化。

- 2026-10-22：用户要求先暂停产品化扩展，优先考虑视频溯源；举报/暂停代码雏形随当前快照保存，未完成专项验收。发布检查脚本与完整产品化方案尚未落地。

## T46 · 当前版本GitHub快照与架构不足说明
- status: done · owner: Codex
- 上传验证：2026-10-22，快照提交 bd5134010d057ea4b90ed8b9b351ce557999d9f0 已推送 origin/main；git ls-remote 确认远端与本地一致。未重启或部署应用。
- 范围：当前源码及已有工作树变更，docs/现有架构与不足-2026-10-22.md；现有测试90/90、Python19/19、语法通过。用户明确授权推送GitHub，未授权公开部署。

## T40 · 领域无关五阶段证据与审计管线
- status: done · owner: Codex · files: src/evidence_cleaner/*, src/note_synthesizer/*, src/attribution_auditor/*, src/note_renderer/*, src/quiz_engine/*, src/pipeline/*, src/schemas/*, server.mjs, public/*, scripts/*, tests/*, docs/*, CONTEXT.md, TASKS.md
- 验收：契约与跨领域回归、真实课程重跑、三层笔记/归因报告/盲测题对比；不把模型一致性称作科学认证。

## T42 · 当前笔记准确性首轮评估
- status: done · owner: Codex · files: evaluation/2026-10-21/*, scripts/evaluate_notes.py, docs/笔记准确性首轮评估.md, CONTEXT.md, TASKS.md
- 范围：冻结现有产物；逐卡核对、30项探索性覆盖清单、8帧直接视读和有限官方来源核验。非人工金标准，不修改生产笔记或提示词。
- 结果：完整7/30、部分4/30、缺失19/30；16/16引文逐字匹配，2/2题符合核心白名单。发现字幕角色误分导致证据丢失、审计浓度角色混淆、单次数据措辞泛化、结构参数漏存。报告与复算脚本已保存。

## T43 · 修复首轮评估发现的证据、参数与覆盖缺陷
- status: done · owner: Codex · files: src/evidence_cleaner/*, src/note_synthesizer/*, src/attribution_auditor/*, src/pipeline/*, src/schemas/pipeline.py, src/note_renderer/*, tests/*, public/app.js, docs/*, evaluation/2026-10-21/*, CONTEXT.md, TASKS.md
- 保留冻结基线，新增修复后对比；不按课程术语硬编码。

- 本轮验收：完整覆盖7→19/30，11项部分覆盖已转T44；118/118引文匹配。新增答案来源门禁拦截真实盲测误通过题，最终2题通过/3题拒绝，未代答。报告见docs/笔记质量修复回归.md；不代表剩余语义缺陷全部解决。

## T44 · 修复复测暴露的剩余语义与质量缺陷
- status: open · owner: 工作者B/待认领
- 接续：按T56拆分首阶段；本轮只安排负责人，未完成实际语义或整课质量验收。
- 依据：docs/笔记质量修复回归.md，11项部分覆盖。优先修复对象/步骤绑定、百分比差值与相对量、原因错误拼接、独立审计错误否决；保留领域无关实现，不按本课术语硬编码。
- 扩展题目证据门禁真实跨领域回归；同模型盲解和来源核对仍可能共同出错，不能称科学认证。

## T41 · 五阶段管线质量覆盖扩展
- status: open · owner: 工作者B/待认领
- 扩展真实跨领域课程回归；全课画面语义分类和布局提取；有证据的仪器读数语义对齐；外部标准核验；Map知识点覆盖率；不同模型验证器。T40仅完成可运行首版与现有课程验证，未达到这些完整产品目标。

## T39 · 选择题组与即时反馈
- status: done · owner: Codex · files: server.mjs, src/deeptutor/quiz.mjs, public/*, tests/quiz.test.mjs, CONTEXT.md, TASKS.md
- 验证：67/67；真实5题入库，原句引用匹配、用户未代答。

## T38 · 生成笔记保存到中央笔记区
- status: done · owner: Codex · files: server.mjs, public/app.js, public/style.css, tests/learning.test.mjs, TASKS.md, CONTEXT.md
- 验证：65/65；真实18批成稿已迁入中央区，原笔记历史保留，浏览器验收通过。

## T37 · 长课程整理超时恢复
- status: done · owner: Codex · files: server.mjs, public/app.js, tests/learning.test.mjs, TASKS.md, CONTEXT.md
- 验证：63/63测试，后台进度/跨重启缓存/截断拆批通过。真实课程已成功2/18批并继续后台运行，整课结果尚未验收。
- 完成边界：done指恢复机制；完整课程复验纳入T44后续，不能据此声称18/18批或内容质量已通过。

## T36 · 全篇蒸馏与逐题伴学
- status: done · owner: Codex · files: server.mjs, src/distiller/*, src/deeptutor/*, src/skill_builder/*, src/schemas/*, scripts/visual_review.py, public/*, tests/learning.test.mjs, CONTEXT.md, TASKS.md, docs/DeepTutor迭代计划.md。
- 验收：Node 61/61；Python契约8/8+视觉4/4；Skill官方格式校验通过。真实首题、尾部召回、379帧联合OCR、16帧本地视觉输出、SRT媒体定位均已验证。含课件正文扩展与Skill目录包；原始转写和笔记保留。

## T35 · B 站课程摄取与长音轨契约适配
- status: done · owner: Codex · 2026-10-20
- Files: src/schemas/*, src/extractors/*, scripts/url_pipeline.py, scripts/download_media.py, server.mjs, public/index.html, tests/test_course_ingestion.py, tests/agent-pipeline.test.mjs, tests/v02.test.mjs, requirements-course.txt, docs/DeepTutor迭代计划.md, CONTEXT.md, TASKS.md。
- 验收：Python 8/8、Node 53/53；独立临时数据中 33 MB MP4 上传与模拟转写关联通过。真实课程 379 片段适配通过（末尾 1545.34 秒）；在线页面本地导入提示已确认。未跑新 B站全视频下载→蒸馏→skill 全链路；DeepTutor 引擎尚未实现。

## 成熟度路线（离产品成熟还差什么，2026-10-11）

当前为 **v0.2.0 开发版**：核心闭环（音视频→转写→笔记→共读→可移植 skill）已通；tools 层覆盖 小红书/微信公众号图文 + 抖音/小红书视频；软删除回收站 + 整库 JSON 备份导出/恢复（T34）；51/51 测试 + 多轮活体验证。下列缺口按「离成熟还差什么」排优先级（每项：任务引用 / 为什么挡成熟度 / 成本·依赖）：

### P0 — 不补就不能算可交付
- ~~**数据恢复能力**~~（T14 一部分）：**已完成（T34，2026-10-11）**——删除改软删除进回收站（笔记本/来源可恢复/彻底删除，schema 3 `db.trash`）+ 整库 JSON 备份导出/覆盖式恢复。
- **完整验收**（T14 核心）：**A08 真实材料 20 问已实测（2026-10-11，17/20 完全支持 + 零编造，4 问受 T13 证据预算召回受限）**；回放 10 片段、工作台集成**未做**；OCR 数字/单位只靠文本、未逐篇核对原图 → 验收尚未 100% 完成=背书不完全。成本低-中（人工验收 + 用例沉淀）。

### P1 — 决定核心体验的能力天花板
- **长文上下文**（T13）：共读只喂 ~1800 字符、笔记前 800 字符、简单关键词排序 → 当前**最大能力上限**，直接决定笔记/skill/共读质量。成本高（分段整理 + 稳定来源映射 + 预算重设计）。
- **应用内 OCR**（T12）：OCR 只走命令行，UI 不能传图片/PDF → 信息源入口不完整。成本中（worker 已有，缺上传路由 + 任务队列 + 校对定位）。

### P2 — 健壮性 / 边界
- **转写断点续传**（T5，可选）：中断后从头转写，长文件体验差。成本中。
- **ASR 引擎对比**（T2，blocked）：faster-whisper vs FunASR 未定，等用户拍板是否装 FunASR。

### P3 — 功能扩展（非成熟度必需）
- **实验 skill 铺开**（T8b）：多 skill 自动路由、checklist 步骤跟跑、app 内可视化编辑。
- **真实脱敏实验样例**（T3）：替换当前自造 DH5α 转化规程。

### 横切 — 工程 / 交付成熟度
- **强外部依赖**：`crawl:true` 需已登录 Edge CDP 9222；小红书视频需 cookies；TTS 走 edge-tts **云端**（非本地/非私有）。短期可接受（用户自有环境），但挡住「任何人拿起来就能用」。
- **无 CI / 无 push 流程**：51 测试靠手动 `npm test`，提交需逐次授权。

**排序结论**：P0 数据恢复已关（T34），**A08 真实材料 20 问已实测（17/20 完全支持 + 零编造）**，P0 剩**回放 10 片段 + 工作台集成**（T14 核心）——「能不能交付」的分水岭；再啃 **P1 长文上下文**（决定 A08 上限，现 17/20 差 1 即由此召回受限）；其余按需。

## 待认领（open）

- **T12 · OCR 应用内集成** — open · owner: 工作者A/待认领
  - OCR worker 与测试素材已由另一 agent 提交于 f5c71fd；T15 已完成小红书图文的命令行 OCR → 文本资料导入。应用内图片/PDF 上传、OCR 任务队列与校对定位仍待实现；不重复改写 worker。
- **T13 · 长文上下文与来源映射** — open · owner: 工作者A/待认领
  - 当前共读来源仅 1800 字符、笔记前 800 字符，简单关键词排序。应按模型能力设计预算、全篇分段整理和稳定笔记块来源关联，补长资料覆盖测试。
- **T14 · 交付验收与数据恢复** — open · owner: 工作者A/待认领 · 数据恢复已由T34完成；A08历史20问见下；本轮T57仅工程交接子阶段
  - 真实材料 20 问验收已实测、工作台集成尚未完成；删除恢复能力已由 T34 补齐（软删除回收站 + 整库 JSON 备份导出/恢复）。
  - **2026-10-11 A08 真实材料 20 问验收（自行实测完成）**：对真实小红书本「酵母转化」8 篇 OCR 来源建一次性验收笔记本 → 设计 20 问覆盖 5 类（指代/连续追问/材料缺失/来源冲突/常规参数；原音频定位对本批文本图文材料 N/A 已如实标注）→ 跑 `/api/chat` → 人工逐条复核：**相关且被所引 `[S#]` 材料支持 17/20**、**关键参数编造 = 0**（缺失/冲突题一律「材料未说明/待核对」）。4 问（Q4/Q8/Q9/Q19）材料含答案但被证据预算（~1800 字符/每来源截 1200）召回受限而答「材料未说明」并拒绝编造（无错误编造），根因=T13。**未达「≥18/20 完全相关且支持」的 18 条线（17/20），零编造达标**。验收后经 T34 软删+purge 清测试本，store 回基线（7 本/0 回收站），无磁盘残留。
  - **2026-10-11 已产出第一版验收报告 `docs/验收报告.md`**（映射 A01–A15 + M0–M5：A01/A02/A03/A04/A05/A07/A08/A12/A13 已验证、A09/A10 历史活体本轮未重测、A11 设计保证、A14 部分(TTS edge-tts 云端)、**A06 回放 10 片段未做**、A15 宿主回归因暂无科研工作台宿主先跳过）。P0 剩余 = A06 回放 10 片段 + A15 宿主（后续单列）+ A08 残项（T13 提升证据预算后重测冲 ≥18/20）。


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

- **T34 · P0 数据恢复能力：软删除回收站 + 全量备份导出/恢复** — done · owner: claude code · 2026-10-11
  - 起因：成熟度路线 P0 第①项。现状删除是**实际删除且不可逆**——`DELETE /api/notebooks/:id` 与 `DELETE /api/sources/:id` 都直接 `fs.unlinkSync` 媒体 + 从 store 过滤对象，前端文案「无法撤销」，无回收站、无备份导出（误删即永久丢数据）。经 AskUserQuestion 拍板：范围=**回收站 + 备份导出**（两者都做，对齐路线图「软删除/回收站 + 备份恢复」）；粒度=**笔记本 + 来源**（两个删除入口都可撤销）。
  - **schema 3**（`server.mjs:49` 迁移块）：加 `db.trash ??= []`、`db.schema=3`（旧库启动自动补空回收站，无数据丢失）。
  - **软删除改造**：两 DELETE 端点改为 push 深拷快照（`structuredClone`）进 `db.trash`、从 live 数组过滤、**去掉媒体 `fs.unlinkSync`**（保留磁盘媒体供恢复）；返回 `{ok:true,trash:true}`。笔记本条目 `{id,kind:'notebook',title,deletedAt,data:{notebook,sources,revisions,messages,questions,jobs}}`；来源条目 `{id,kind:'source',title,notebookId,deletedAt,data:{chain（校对闭包：previousId/replacedBy 相连的全部来源）,jobs}}`。
  - **回收站 API**：`GET /api/trash`（列表）；`POST /api/trash/:id/restore`（无则 404；冲突校验：notebook id 已存在 / source 所属 notebook 已不在 → 409；无冲突则各数组 concat 回 live、trash 移除该 entry）；`POST /api/trash/:id/purge`（彻底删除：遍历 data 里 `kind==='media'` 来源 `fs.unlinkSync`、trash 移除）。路由 `p.split('/').slice(3)` 取 `[id,action]`。
  - **备份导出/恢复**：导出复用 `GET /api/state`（整库 `db`）前端 Blob 下载 `yanxiuban-backup-<stamp>.json`；恢复新增 `POST /api/backup/restore`（校验 `notebooks`/`sources` 为数组否则 400，**整体替换** `db` 后补迁移 `db.trash??=[]`/`db.schema=3`/`jobs`/`agentRuns`/`skillsQueue`）。恢复=覆盖式（前端二次确认）。
  - **前端**（`public/*`）：侧栏 `#trashOpen`「🗑 回收站 · 可恢复删除」+ `.side-bottom` `#backupButton`「⇩ 备份 / 恢复」；`#trashDialog`（卡片：标题/[kind]/删除时间 + 恢复/彻底删除按钮）+ `#backupDialog`（导出 Blob 下载 / file input 选 JSON 恢复）；现有删除确认文案改「将移入回收站，可在那里恢复或彻底删除」。
  - 验证：`node --check server.mjs public/app.js` 过；`npm test` **51/51**（`tests/delete.test.mjs` 改写为软删除语义断言 + `tests/trash.test.mjs` 新增 7 项：来源 restore 回灌+清空 / purge 删媒体+清空 / 笔记本 restore 全量回来 / 备份 restore 回灌快照 / restore·purge 未知 id→404 / 所属 notebook 已不在的来源 restore→409 / 备份 restore 非法 payload→400）。活体单实例 8765：软删来源→进回收站+媒体仍在→restore 回来；软删笔记本→trash kind:notebook→restore 回来；备份 dump→改 store→restore→state 与 dump 一致。浏览器活体：侧栏两按钮渲染、回收站/备份 dialog 正确。
  - 诚实边界：①恢复=删除时刻快照回灌，期间同名 notebook 被新建→409 拒绝不覆盖；②软删保留磁盘媒体→回收站占空间直到 purge；③备份恢复是覆盖式不合并，跨版本恢复依赖 schema 迁移块；④`agentRuns` 行为不变（本就孤儿化，purge 也不清）。
  - 清理：活体测试副产物用 purge 清干净，store 回基线（7 笔记本、0 trash、schema 3）；单实例 8765 未双开、不手改 store.json。
  - 提交：待用户确认后本地 commit（`server.mjs`、`public/index.html`、`public/app.js`、`public/style.css`、`tests/delete.test.mjs`、`tests/trash.test.mjs`、`CONTEXT.md`、`TASKS.md`），**未 push**（push 需用户授权）。工作树既有未提交 `.gitignore`/`skills/cell-transfection.md`（新）/既有删除 `skills/multi-ai-agent-concurrency-conflict-prevention.md` 均**非本任务产物，不纳入**本次提交（除非用户另行要求）。

- **T33 · 小红书图文抓取 tools 化（`fetch_xhs_notes` 工具 + `POST /api/agent/fetch-xhs` 端点）** — done · owner: claude code · 2026-10-11
  - 起因：承接 T32（微信公众号图文 tools 化）。上一轮审计结论：现有 6 个 tools 里**小红书图文完全没有 tools 层工具**（`download_media` 的 source 枚举只有 `douyin|xhs-video`，是视频；唯一能抓小红书图文的是**非 tools** 的 `POST /api/agent/pipeline`，强依赖用户 Edge CDP 9222 + 已登录小红书）。用户「做成 tools」——把小红书图文抓取+OCR+落笔记封装成 tools 层工具 `fetch_xhs_notes`，结构对齐 `fetch_wechat_articles`。经 AskUserQuestion 确认抓取策略=**默认复用 + 可选 crawl**（`crawl` 默认 false，复用 `~/Desktop/MediaCrawler/data/xhs` 已爬取数据；`crawl:true` 才启动 MediaCrawler，需已开 Edge CDP 9222 且已登录小红书，免扫码）。
  - **`fetch_xhs_notes` 工具（`server.mjs` `TOOLS`）**：`{query, crawl?, limit?}`（`query` 必填非空 ≤120 字；`crawl` 布尔默认 false；`limit` 0=全部 或 clamp 1..100）。`run`：① `crawlerRoot=path.join(os.homedir(),'Desktop','MediaCrawler')`；② **crawl 段（仅 `crawl:true`）** `spawn(crawlerRoot/.venv-mc/Scripts/python.exe, ['main.py','--type','search','--keywords',query], {cwd:crawlerRoot, stdio:['ignore','pipe','pipe'], env:{...process.env,PLAYWRIGHT_BROWSERS_PATH:crawlerRoot/.pw-browsers}})`（900s 超时）；③ **import 段（恒做）** `spawn(ROOT/.venv-ocr/Scripts/python.exe, ['scripts/import_xhs.py','--app-root',ROOT,'--crawler-root',crawlerRoot,'--api',toolEnv.localBase,'--keywords',query,'--limit',String(limit)], {cwd:ROOT, stdio:['ignore','pipe','pipe']})`（1800s 超时）解析 stdout JSON-lines 末条 `complete` 事件 `{imported,skipped,failed}`；④ 校验 `complete` 存在 && `icode===0` && `failed===0` && `(imported+skipped)>0`（**幂等**：重复运行 imported=0/skipped=N 属成功，不因 imported=0 判失败）；⑤ 建/找「小红书实验学习 · <query>」笔记本 → `generateNote()` 落 1 版共读笔记 revision → `save()`。返回 `{crawlerRoot,crawlRan,crawlOk,notebookId,notebookTitle,sourceCount:imported+skipped,imported,skipped,revisionId}`。端口经模块级 `toolEnv.localBase`（`import os` + `app.listen` 回调里回填 `http://127.0.0.1:<port>`）。
  - **spawn 模式（Windows 关键）**：MediaCrawler 与 import_xhs 均为 `spawn(pyPath,[args数组],{cwd,stdio:['ignore','pipe','pipe'],env:{...process.env}})`——无 shell、无 cmd 引号，CreateProcessW 直传 CJK args（沿用既有 `download_media`/`fetch_wechat` 的 Python 子进程模式）。
  - **端点/驱动**：`runToolsLoop({source,url,goal,query,max,limit})` 加 `limit` 入参 + prompt 三分支（`source==='xhs-image'`→「从小红书按关键词整理图文」（`fetch_xhs_notes`）/ `source==='wechat'`→「从微信公众号…」（`fetch_wechat_articles`）/ 仅 query 无 source→通用文案让 agent 自选两者）+ 新增 `fetchedXhsNotebookId` 跟踪并纳入返回 `notebookId` 兜底链；`POST /api/tools/loop` 读 `limit`；新增 **`POST /api/agent/fetch-xhs {query,crawl?,limit?}`**（校验 query 非空/≤120 → 建 `agentRuns` run（`kind:'tools'`,`source:'xhs-image'`）→ spawn `.venv-ocr python scripts/tools_pipeline.py --source xhs-image --query [--limit N] [--crawl]`（`pipelineLauncher` detached）→ 202 `{runId,source:'xhs-image',query,crawl,limit}`）。
  - **驱动 `scripts/tools_pipeline.py`**：加 `ap.add_argument('--limit',type=int,default=0)` + `--crawl`（`store_true`）；`--source xhs-image` 分支转发 `loop_payload['query']/['source']='xhs-image'`，`limit>0` 加 `loop_payload['limit']`、crawl 加 `loop_payload['crawl']=True`；report 加 `'limit'/'crawl'` 字段。
  - 验证：`node --check server.mjs` 过；python `ast` 过 `tools_pipeline.py`；`npm test` **44/44**（tools 测试更新：`GET /api/tools` 断言 **7 工具**含 `fetch_xhs_notes` / `POST /api/agent/fetch-xhs` 合法 query→202+kind=tools run+驱动 `--source xhs-image --query <q>`（query 带空格仍单个 argv 元素）且**无** `--crawl/--limit` / `crawl:true`+`limit:5`→argv 含 `--crawl` 与 `--limit 5` / 缺·空 query 400 不 spawn）无回归。`GET /api/tools` 实列 7 工具。**活体单实例 8765 + 18081 `local-qwen38-gsq`**：`POST /api/agent/fetch-xhs {query:'酵母转化', crawl:false, limit:2}` → 202 → 驱动 → LLM 自主调 `fetch_xhs_notes`（复用本地已抓数据：`imported:0,skipped:2`，幂等未重复导入）→ `make_skill`（自动判 knowledge）→ 落「小红书实验学习 · 酵母转化」notebook（共读笔记 1 版 revision）+ skill `yeast-two-hybrid-protein-interaction.md` → run **done**（toolLog 两步 ok、notebookId/revisionId/skill 齐全）。**活体发现并修 1 处后端逻辑缺陷**：初版成功判定误用 `imported===0` 判失败，导致幂等复跑（imported=0/skipped=N）误报 504 → 改判 `failed===0 && (imported+skipped)>0`。
  - 诚实边界：①`crawl:true` 需用户已开远程调试(9222)且已登录小红书的 Edge（MediaCrawler 免扫码），本轮只活体验证 `crawl:false`（复用），crawl 半程仅验证参数构造（不替用户启浏览器/撞风控）；②`limit` 语义=导入篇数上限（0=全部），`import_xhs.py` `--limit 0`=全部；③小红书图文依赖 `.venv-ocr` + `ocr_worker.py` OCR，`import_xhs.py` 子进程回调 8765 建本/导来源（单实例、不双开、不手改 store.json）；④skill 受 1800 字符共读预算限制（open T13）。
  - 清理：活体验证副产物全清——9 个 `data/_*.txt` 探测文件、`data/media-inbox/tools-xhs-image.report.json` 驱动报告、测试生成的 skill `skills/yeast-two-hybrid-protein-interaction.md`；并按 id 从 `store.json` 移除本次活体产生的 1 条共读笔记 revision（`5432f1de`，「小红书实验学习 · 酵母转化」回到 7 版基线），store 保持干净；单实例 8765 未双开。
  - 提交：本地 commit（`server.mjs`、`scripts/tools_pipeline.py`、`tests/tools.test.mjs`、`CONTEXT.md`、`TASKS.md`），**未 push**（push 需用户授权）。工作树另有既有未提交 `.gitignore`/`skills/cell-transfection.md`（新）/既有删除 `skills/multi-ai-agent-concurrency-conflict-prevention.md`，**均非本任务产物，不纳入**本次提交（除非用户另行要求）。

- **T32 · 细胞转染共读笔记补齐 + 微信公众号图文抓取 tools 化（`fetch_wechat_articles`）** — done · owner: claude code · 2026-10-10
  - 起因：用户「细胞转染的共读笔记呢？能不能梳理好啊」+「把从微信公众号拉取图文也打包成 tools 来方便 agent 进行调用」，并确认「微信公众号图文的 tools 参考已有的 tools」。两件：①T31 的「细胞转染」notebook 当时只跑了 `/api/generate`（喂 skill）没落共读笔记 → 补齐；②把 T31 用的 wechat-article-downloader 批量抓取**封装成 tools 层工具**，让研习伴 agent 经 LLM 函数调用自主调用（同 `download_media` spawn 模式）。
  - **①共读笔记补齐**：「细胞转染」notebook（`219a2ab3`）原 0 版 revision → `POST /api/generate` + `POST /api/notes` 落 1 版（`ad314a36`，2553 字）：目的/原理/步骤/明确参数/注意事项/待核对，缺失参数如实「材料未说明/待核对」，带 S1/S2 引用。
  - **②`fetch_wechat_articles` 工具（`server.mjs` `TOOLS`）**：`{query, max?}` → `spawn(process.execPath, [tsxCli,'scripts/main.ts','--search',query,'--max',N,'-o',outDir], {cwd:toolDir})`（`shell:false`+args 数组，CreateProcessW 传 CJK，无 cmd 引号/无 DEP0190）。`outDir` 固定 `data/wechat-fetch/fetch-<ts36>`（不接受调用方 outDir，防路径注入）。工具内部：读完 outDir 的 `.md` → 建/找「微信公众号 · <query[:20]>」notebook → **每篇整篇各为独立 text source**（sha256 去重）→ `generateNote()` 落 1 版共读笔记 revision → `save()`。返回 `{outDir,count,notebookId,notebookTitle,sourceCount,revisionId,articles:[{title,file}]}`。600s 超时。
  - **spawn 方式选型（Windows 关键）**：`spawn('npx',[…],{shell:false})` ENOENT（npx 是 .cmd shim）；`cmd /d /s /c "<单串>"` 嵌套引号+cwd 带空格 → outDir 被拼串 ENOENT；`shell:true` 能跑但发 DEP0190 警告。**最终=本地 `npm install tsx --no-save` 到工具目录，直接 `node <node_modules/tsx/dist/cli.mjs>`**（真实可执行文件，args 数组，CJK 安全）。活体确认：2 篇 CJK 图文+本地图落盘、带空格 outDir 无 ENOENT。
  - **端点/驱动**：`runToolsLoop({source,url,goal,query,max})` 加 query/max 分支（system prompt 增「微信公众号关键词→fetch_wechat_articles→make_skill」路径；loop 内跟踪 `fetch_wechat_articles` 返回的 notebookId）；`POST /api/tools/loop` 加 `query`/`max`；新增 **`POST /api/agent/fetch-wechat {query,max?}`**（校验 query 非空/≤120 → 建 `agentRuns` run（`kind:'tools'`,`source:'wechat'`）→ spawn `tools_pipeline.py --source wechat --query --max` → 202）；`scripts/tools_pipeline.py` 加 `--query`/`--max` 转发 loop_payload。
  - 验证：`node --check server.mjs` 过；python `ast` 过；`npm test` **41/41**（tools 测试更新：`GET /api/tools` 列 6 工具含 fetch_wechat_articles / `POST /api/agent/fetch-wechat` 合法 query→202+kind=tools run+驱动 `--source wechat --query --max` 正确（query 带空格仍为单个 argv 元素）/ 缺 query 400 且不 spawn）无回归。`GET /api/tools` 实列 6 工具。**活体单实例 8765 + 18081 `local-qwen38-gsq`**：`POST /api/agent/fetch-wechat` → 202 → 驱动 → LLM 自主调 `fetch_wechat_articles`（真实 Chrome 搜狗抓取 2 篇）→ `make_skill`（自动判 knowledge）→ 落「微信公众号 · …」notebook（2 独立 source + 1 共读笔记）+ skill → run **done**（toolLog 两步 ok、CJK 标题/来源/正文正确）。
  - 诚实边界：①Git Bash 手敲 CJK 经 `curl -d` 按 GBK 传（T21 已知）→ 用真实 UTF-8 客户端（浏览器/Node fetch/其他 agent）不受影响，`run.goal/query` 顶层字段在 curl 通道会显示乱码但**工具实际拿到的 query（LLM tool_call）正确**；②搜狗 type=2 单页仅 10 篇无翻页（`max`>10 也只取当前页）；批量仍可能验证码（需时人工介入）；第三方项目 archived。
  - 清理：活体验证副产物（2 个「微信公众号 · …」测试 notebook + 对应 skill 文件 + report）经 API 删除，store 保持干净；AppData/Temp scratch 全清；TOOL Chrome 按 cmdline 匹配 `wechat-article-downloader` 清（不碰用户 Chrome）；`tools/wechat-article-downloader/node_modules`（含 tsx）属 gitignored 第三方目录。
  - 提交：本地 commit（`server.mjs`、`scripts/tools_pipeline.py`、`tests/tools.test.mjs`、`CONTEXT.md`、`TASKS.md`），**未 push**（push 需用户授权）。既有删除 `skills/multi-ai-agent-concurrency-conflict-prevention.md` 未纳入。

- **T31 · 批量自动抓取微信公众号文章（真实浏览器搜狗关键词搜索）+ 细胞转染操作步骤 skill** — done · owner: claude code · 2026-10-10
  - 起因：用户「我要的是批量自动抓取，你让我一篇篇发我很累，你去github上找类似的方法」。范围经用户两次澄清定稿：①「为什么提取了四篇只有一篇来源？4 篇太少，至少 15 没有也要 10 篇」→ **整篇导入、每篇一个独立来源**（不合并）；②「电转只是转染的一个方法」+「我只要转染步骤，电转染也是转染」→ 交付物是**细胞转染操作步骤** skill（电转作为其中一种方法），不是只讲电转。
  - 抓取工具：GitHub `ar-gen-tin/wechat-article-downloader`（Chrome CDP + 搜狗 `weixin?type=2` 关键词搜索 + 微信图文→Markdown+本地图片）。本机无 Bun → 用 **tsx**（`npx -y tsx scripts/main.ts`）跑，依赖仅 `turndown`+`turndown-plugin-gfm`。批量链路：`--search "<kw>" --max N -o <dir>` → 真实 Chrome 过搜狗反爬（两轮均无验证码）→ 跟随搜狗 link 到 `mp.weixin.qq.com` 下载正文+图片。
  - **批量活体**：搜狗 type=2 单页仅 10 篇、**无翻页**（`searchAccountArticles` 只读当前 DOM），故分两轮关键词扩量去重：`"细胞电转染 实验步骤"`(10) + `"电穿孔 细胞转染"`(10) → 去重后 **18 篇**不同转染文章（根目录早期 7 + `a/`10 + `b/`10，按标题+作者+正文 sha256 去重）。诚实边界：搜狗上**没有 15 篇专门讲电转染 protocol**；18 篇是**转染**文章（电转是其一小节），电转 protocol 细节集中在 1 篇（Neon 微电转 troubleshooting）。
  - 沉淀研习伴：建「**细胞转染**」notebook（id `219a2ab3-65dd-4b22-862b-0c1e4199962e`），**18 篇整篇各为独立 source**（非合并）→ `POST /api/generate` 整理共读笔记 → `POST /api/agent/skill {kind:'experiment',force:true}` → 生成**转染操作步骤** skill `skills/cell-transfection.md`（「细胞转染操作」7 步：选方式→评估细胞状态→备核酸/转染材料→形成复合物/导入体系→加细胞→恢复→检测表达/沉默；覆盖脂质体/磷酸钙/**电转**/病毒法，全部参数「待核对」不臆造）。
  - **关键发现（来源导入顺序决定 skill 框架）**：`generateSkillForNotebook` 取**导入顺序靠前的 ~2400 字** source 片段 + 最新笔记前 1600 字喂 LLM；若把 troubleshooting 文章排最前，skill 被带偏成「转染效率/活性优化」。改为 **protocol 优先排序**（前 2 篇为完整步骤文，troubleshooting 降到 #9）→ 产出干净的转染 SOP。
  - 数据清洗：2 篇微信富文本 `<table>` 未转 Markdown（原始 HTML 342K/540K 字符）→ 导入时剥离 HTML 标签/script/style/实体/URL，正文压到 1.1K–12K 字符（全部 < `/api/sources` 200K 上限）。
  - 清理：删 2 个临时 notebook（`90ff9de8` 旧电转、`c4e1d304` 误框架）+ 2 个旧 skill 文件 + 临时导入脚本 `_tmp_import_ep2.py` + 临时 `kill_tool_chrome.ps1`；TOOL Chrome 全部按 cmdline 匹配 `wechat-article-downloader` 清（不碰用户自己的 Chrome）。
  - 诚实边界：搜狗反爬（真实浏览器宽松，仍可能验证码，需时 `--wait` 手动介入）；`killChrome` 在 Windows 残留子进程（需按 cmdline 匹配 `wechat-article-downloader` 用 PowerShell 清）；第三方项目 archived；搜狗 link 有时效 token。
  - 文件：`skills/cell-transfection.md`（新交付物）、`.gitignore`（忽略 `tools/wechat-article-downloader/` 第三方目录）、`data/wechat-electroporation/`（18+ 篇抓取产物，gitignored）。

- **T30 · tools 层 agent 自动判断 skill 类型（移除「产出类型」调用方接口）** — done · owner: claude code · 2026-10-10
  - 起因：用户「agent 调用 tools 的时候能否区分实验笔记还是内容总结来生成不同的 skill？」。原 `kind` 由调用方传入 `/api/agent/tools`、经 prompt **软引导** LLM 传给 `make_skill`（不可靠：漏传回退 `knowledge`），且 agent 不按材料内容判断。经确认选 **B（agent 自动判断）+ 取消 tools 层「产出类型」接口**，范围**只改 tools 层**（`/api/agent/skill`·`pipeline`·`media` 保持调用方可指定 `kind`/`skillKind`）。
  - **后端 `server.mjs`（tools 层）**：新增 `classifyNotebookKind(notebookId)`（取笔记本最新笔记 + `evidence`，LLM `temperature:0` 判断「可操作可复现实验/操作流程 → experiment」vs「概念/原理/知识点 → knowledge」，解析失败默认 knowledge）；`make_skill` 工具**去 `kind` 参数**，`run` 内先自动分类再 `generateSkillForNotebook(nbId, 分类结果)`；`runToolsLoop({source,url,goal})` 去 kind、prompt 改「make_skill 自动判断」；端点 `POST /api/tools/loop`·`POST /api/agent/tools` **移除 kind 入参**、tools run 不再记录 `skillKind`、不传 `--kind`。
  - **驱动 `scripts/tools_pipeline.py`**：去 `--kind`（不传 kind、report 不含入参 kind）。
  - 验证：`node --check server.mjs` 过；`python -m py_compile` 过；`npm test` **39/39**（tools 测试更新：fake LLM 识别分类调用、`make_skill` 不传 kind 由服务端自动分类→knowledge skill、端点不传 `--kind`）无回归。`GET /api/tools` 确认 `make_skill.parameters` 仅 `notebookId`、description 含「自动判断」。**活体单实例 8765 + 18081 `local-qwen38-gsq`**：`POST /api/agent/tools {source:'douyin',url:'v.douyin.com/r0MlUzPQgUE/'}`（**不传 kind**）→ 循环 `download_media`→`transcribe`→`import_to_notebook`→`make_skill` 全 ok → **make_skill 自动分类为 `knowledge`** → 落共读笔记 + skill（`skill.kind:'knowledge'`）→ run done；`/api/agent/runs` 确认 run `kind:'tools'` 且**无 `skillKind` 字段**。
  - 诚实边界：自动分类是 LLM 判断有误分可能（实验↔知识边界模糊时）；本次活体只验证 knowledge 分支（JEV），experiment 分支待真实实验视频 URL。`/api/agent/skill`·`pipeline`·`media` 仍调用方可指定 kind（与 tools 层自动判断并存，属不同入口）。活体验证副产物（重复 JEV 笔记本 `03416340` + 重复 skill `jev-gev-llm-speed-comparison.md` + report）已清理；T29 保留的 JEV 笔记本 `af2a0171` + `skills/jev-model-fast-decision.md` 不变。
  - 提交：本地 commit（`server.mjs`、`scripts/tools_pipeline.py`、`tests/tools.test.mjs`、`CONTEXT.md`、`TASKS.md`），**未 push**（push 需用户授权）。既有删除 `skills/multi-ai-agent-concurrency-conflict-prevention.md` 未纳入。

- **T29 · tools 层：把「下载→转写→共读笔记→skill」流程打包成可被 agent 调用的工具** — done · owner: claude code · 2026-10-10
  - 起因：用户「为什么这套流程没有在研习伴中进行，也没有创建共读笔记？把这套流程打包成 tools，为研习伴添加 tools，方便研习伴 agent 调用」。经确认形态=**只做 LLM 函数调用循环**（agent 自主选工具串联），首批工具 `download_media`/`transcribe`/`summarize`/`make_skill`，末端**落共读笔记**；**不加前端入口**、**不做 function-calling 兜底**（不支持则 run 如实 failed）。
  - **后端 `server.mjs`（createApp 内）**：新增 `TOOLS` 注册表（每项 `{name,description,parameters(JSON Schema),run(args)}`）+ `callTool(name,args,log)` 分发 + `runToolsLoop({source,url,goal,kind})`（OpenAI 函数调用循环，`tools:TOOL_FUNCS`/`tool_choice:'auto'`，上限 8 轮，工具**同步 await** 不受 `model()` 120s 限制，记录 `toolLog`）。工具：`download_media`（spawn `tools/.venv-dl` python 跑 `download_media.py --frames 0`，取 `complete` 事件 result 的 audio/title/duration/uploader）、`transcribe`（`transcriber(file)`）、`import_to_notebook`（建/找笔记本「视频学习 · <title>」+ 文本 source 去重导入 + `generateNote()` 整理笔记并持久化 revision）、`make_skill`（复用 `generateSkillForNotebook` 写 `skills/*.md`）、`summarize`（纯文本 LLM 摘要）。新增端点：`GET /api/tools`（列表）、`POST /api/tools/loop`（同步循环）、`POST /api/agent/tools {source?,url?,goal?,kind?,cookieFile?}`（校验 url/source → 建 `agentRuns` run（`kind:'tools'`）→ spawn `scripts/tools_pipeline.py` detached → 202）。新增 `generateNote(notebookId)`（复刻 `/api/generate` 整理逻辑）。**修 1 处缺陷**：`/api/agent/pipeline/:runId/result` 回调原只认 `kind==='pipeline'`，导致 `kind:'tools'` run 回写 404 不翻态 → 放宽为 `['pipeline','tools'].includes(kind)`。
  - **驱动 `scripts/tools_pipeline.py`（新，纯标准库）**：调 `POST /api/tools/loop {source,url,goal,kind}` → 组装报告（toolLog/transcriptLen/notebook{ id,title}/skill/summary）→ 回写 `POST /api/agent/pipeline/<runId>/result`（done/failed 如实），报告落 `data/media-inbox/tools-<netloc>.report.json`。
  - **前端**：无改动（按用户选择仅 API）。
  - 验证：`node --check server.mjs` 过；python `ast` 过；`npm test` **39/39**（新增 5 项 tools：`GET /api/tools` 列 5 工具 / `POST /api/agent/tools` 建 `kind='tools'` run + spawn 参数正确 + 202 / 非法 url·source 400 且不 spawn / `POST /api/tools/loop` 用 fake LLM 跑 `import_to_notebook`→`make_skill` 落笔记本+来源+笔记+skill 文件 / loop 缺 url·source 400）无回归。**活体单实例 8765（18081 `local-qwen38-gsq` 在线，确认其支持 OpenAI function-calling）**：`POST /api/agent/tools {source:'douyin',url:'v.douyin.com/r0MlUzPQgUE/',kind:'knowledge'}` → 202 → 驱动 → `/api/tools/loop` → **LLM 自主按序调用 `download_media`→`transcribe`→`import_to_notebook`→`make_skill`（全 ok，notebookId 前传）** → 落成共读笔记「视频学习 · jev模型…（交叉科学）」（文本来源 640 字 + 生成笔记 2122 字）+ 可移植知识 skill `skills/jev-model-fast-decision.md`（gapCount 7 待核对）→ 回写 `/result` → **run 翻 `done`**（含 transcriptLen 632/notebook/skill/toolLog）。
  - 诚实边界：`make_skill` 复用既有 LLM 生成，受 1800 字符共读预算限制（open T13）；`download_media`/`transcribe` 为真实子进程/真实 ASR，单测里以 fake LLM 走 `import_to_notebook`→`make_skill` 分支覆盖（不 mock 下载/转写本身）；本轮未做前端入口与兜底（按用户决定）。活体产生的大型媒体文件（`data/media-inbox/20261010-195705/` mp4+wav+frames）与驱动报告已清理；共读笔记 + 自动生成的 skill 保留（正是「共读笔记」诉求的产物，用户可再决定取舍）。
  - 提交：本地 commit（`server.mjs`、`scripts/tools_pipeline.py`、`tests/tools.test.mjs`、`CONTEXT.md`、`TASKS.md`），**未 push**（push 需用户授权）。既有删除 `skills/multi-ai-agent-concurrency-conflict-prevention.md` 未纳入。

- **T28 · 实验操作 / 知识总结 skill 模板对齐专业 SKILL.md 规范（参考 GitHub 高 star / 官方源）** — done · owner: claude code · 2026-10-10
  - 起因：用户「写实验操作 skill 和知识总结 skill 是否专业，是否参考了 github 上的成熟 high index 项目？」。先如实说明：原模板基于本地样例 + 训练知识（当时 WebSearch 不可用）；随后实际拉取权威源核实并对齐。
  - 参考源：`anthropics/skills`（官方 spec → agentskills.io/specification；`skills/skill-creator/SKILL.md` 官方写作指南）+ `obra/superpowers`（~297k star，"agentic skills framework"；`writing-skills/SKILL.md`："Writing skills IS TDD applied to process documentation"）。
  - 诊断（原模板 ~70% 对齐）：①`description` 被当摘要写，而它是**主触发机制**（做什么 + 何时用，要"pushy"）；②缺 `## 概览`（Overview 核心原则）；③缺 `## 何时不要用`（when NOT to use）；④知识模板把「什么时候用」放进**正文**（违反"何时用只写进 description，不进正文"）。
  - 落地（仅 `server.mjs` 的 `SKILL_PROMPTS.experiment`/`.knowledge`）：description 指令改触发式（做什么 + 何时调用 + 具体触发场景/关键词，≤120 字，宁可主动）；两者新增 `## 概览`（1-2 句核心）+ `## 何时不要用`（避免误用，无则"暂未发现"）；知识模板**删正文 `## 什么时候用`**，改在 description 指令注明「何时用只写进 description」；两模板补 `<500 行`（progressive disclosure）；保留 `kind:` / 步骤同构 / 待核对不臆造 / 祈使句。
  - 验证：`node --check server.mjs public/app.js` 过；`npm test` **34/34** 无回归（模板是 prompt 字符串，现有 mock 测试与其解耦，仍绿）。
  - 诚实边界：模板输出形状需真实模型跑一次生成才能端到端确认（需 18081 本地服务 + 会写共享 store.json，未在本次活体跑，避免污染）；已落盘 skill 文件不变，下次 `force` 重新生成才应用新模板。
  - 提交：本地 commit（`server.mjs`、`CONTEXT.md`、`TASKS.md`），**未 push**（push 需用户授权）。既有删除 `skills/multi-ai-agent-concurrency-conflict-prevention.md` 未纳入。

- **T27 · skill 分级：pre-queue → skill-queue（自写 skill 默认 pre，可调度到 skill-queue）** — done · owner: claude code · 2026-10-10
  - 起因：用户「自己写的 skill 只在 pre-queue，我使用时可以选择调度去 skill-queue 来使用」。语义=自写/生成 skill 默认进 pre-queue（待激活），用户可「调度」到 skill-queue（已激活、可被任何 agent 调用）。
  - 方案（存储留 `store.json`，`SKILL.md` 文件保持可移植干净）：`db.skillsQueue`（`name→'pre'|'active'`，缺省 `pre`）；`GET /api/skills/list` 加 `status`（以磁盘文件名 stem 为 key，与 reveal 一致）；新增 `POST /api/skills/queue {name,status}`（`[a-z0-9-]` + 文件存在 + status∈{pre,active}，否则 400/404）；前端 Skill 库面板分「skill-queue（已激活）/ pre-queue（待激活）」两组，每卡状态徽标 + 「调度到 skill-queue（激活）」/「退回 pre-queue」+「在资源管理器中显示」，切换后重载。
  - 验证：`node --check server.mjs public/app.js` 过；`npm test` **34/34**（新增 1 项 tiering：默认 pre→active→pre + 非法 status 400 + 不存在 404）无回归。浏览器活体（重启单实例 8765 预览面板）：list 全默认 pre、queue promote/demote/400/404 正确、UI 两组分组 + 点「调度」把 dh5a 移入 skill-queue 组 + 蓝左边框样式；收尾恢复演示 skill 回 pre。
  - 边界（如实）：只做 skill 分级 + 激活状态；「skill-queue 被 agent 实际加载调用」运行时行为属后续「安装自己的 agent」方向（用户已选先做分级）。抖音本自身 skill 仍不在磁盘（既有删除，未恢复/未提交）。
  - 提交：本地 commit（`server.mjs`、`public/index.html`、`public/app.js`、`public/style.css`、`tests/agent-skill.test.mjs`、`CONTEXT.md`、`TASKS.md`），**未 push**（push 需用户授权）。

- **T26 · 修复抖音"两个源"重复 + 知识总结产出模式 + 全局「Skill 库」面板（列表 + 资源管理器打开）** — done · owner: claude code · 2026-10-10
  - 起因：用户「抖音视频学习资料为什么有两个源？不对」+「有时需求是**抖音知识总结**，写成 skill 方便调用」+「没有 skill 文件列表，像 claude code desktop 那样从列表选 open in explorer」。
  - **修重复源**：`POST /api/sources` 文本分支加规范化 hash（sha256，运行时间戳 `\b\d{8}-\d{6}\b`→`TS`，复刻 `/api/upload` 口径），同 notebook 同 kind 同 hash → `duplicate:true`+既有 id（200，不新增）；数据层清掉抖音本那条重复源（保留最早 createdAt，备份 `store.json.bak-dedup`，停 8765→改→重启）。
  - **知识总结模式（skill kind）**：`parseSkillMeta` 认 `kind:`；`generateSkillForNotebook(id, kind)` 用 `SKILL_PROMPTS[kind]`（experiment 原模板 / knowledge 新模板：什么时候用/核心要点/关键概念/知识要点/方法流程/常见误区/来源，参考专业 SKILL.md 写法，未知标"待核对"）；`POST /api/agent/skill {kind}` 按 kind 复用/重生成 + `result.skill.kind` 回传 + 类型标签；`url_pipeline.py`·`experiment_pipeline.py` 加 `--kind`；Agent dialog 加「产出类型」下拉。
  - **Skill 库面板**：后端 `GET /api/skills/list`（扫 `skills/*.md` 解析 frontmatter）+ `POST /api/skills/reveal {name}`（`[a-z0-9-]` 校验 + win32 `explorer /select`/darwin `open -R`/其他 `xdg-open`）；前端侧栏「📚 Skill 库」按钮 + `#skillsDialog`（`#skillLibrary` 卡片 +「在资源管理器中显示」）。
  - 验证：`node --check server.mjs public/app.js` 过；python `ast` 过；`npm test` **33/33**（新增 3 项：文本源去重 / kind=knowledge 独立于 experiment / skills list meta）无回归。浏览器活体（单实例 8765，预览面板）：抖音本「学习资料 1」、dialog「产出类型」下拉在位、Skill 库列 3 skill 带 meta、点「在资源管理器中显示」→ `POST /api/skills/reveal` 200。
  - 诚实边界：抖音本自身 skill `skills/multi-ai-agent-concurrency-conflict-prevention.md` 当前**不在磁盘**（会话前已 `D`、仍 track 于 HEAD），故不在 Skill 库列出，待用户决定是否恢复。用户新方向「agent 可安装自己的 agent / 自写 skill 只在 pre-queue / 使用时调度去 skill-queue」语义未定，待澄清另立项。
  - 提交：本地 commit（`server.mjs`、`public/index.html`、`public/app.js`、`public/style.css`、`scripts/url_pipeline.py`、`scripts/experiment_pipeline.py`、`tests/agent-skill.test.mjs`、`CONTEXT.md`、`TASKS.md`），**未 push**（push 需用户授权）。既有删除 `skills/multi-ai-agent-concurrency-conflict-prevention.md` 未纳入。

- **T25 · 彻底删除「实验指导」功能 + 修复抖音笔记本乱码** — done · owner: claude code · 2026-10-10
  - 起因：用户「解决乱码问题，此外实验指导是一个冗余的功能，彻底删除」。截图=抖音笔记本标题/来源文件名乱码（U+FFFD）。
  - 删除「实验指导」（后端+前端+测试+遗留数据）：`server.mjs` 删 `GET /api/skills`、`POST /api/skill-ask`、`POST /api/skills/generate` + `listSkills()`/`readSkill()`（**保留** `/api/agent/skill` 及助手，它是管线产出 skill 的核心交付物）；前端删「实验指导」tab/面板 + 全部 skill 问答 JS + CSS；删 `tests/skill.test.mjs`、`tests/agent-skill.test.mjs` 去 `/api/skill-ask` 子断言；清 `db.messages` 全部 `type:'skill'` 遗留记录。
  - 修复乱码（根因=旧编码路径残留，**当前代码已验证干净**）：隔离字节级 round-trip 测试 + 真实 `url_pipeline.py` 活体探测均证当前管线产出干净中文；乱码笔记本 `e4f8c0dc` 是编码修复前残留，乱码只落 3 个显示字符串（笔记本标题+2 来源标题），正文全干净。停 8765 → 程序化修 3 个标题（复刻 `slug()`/`[:40]`）→ 原子写（同 `save()` 格式）→ 重启。
  - 验证：`node --check server.mjs public/app.js` 过；`npm test` **30/30**（删 `skill.test.mjs` 无回归，`/api/agent/skill` 5 项仍绿）；浏览器活体（预览面板单实例）：抖音本标题/来源/正文干净、「实验指导」tab 消失（tablist 仅剩 共读/学习资料/疑问清单）。
  - 诚实边界：全库另剩 **1 条**乱码消息=「酵母转化」本里用户手打的共读提问（`type=chat`，100 个 U+FFFD，字节已丢失无法复原），属用户自有数据，留待用户决定（重发/删除），不擅自处理。
  - 提交：本地 commit（`server.mjs`、`public/index.html`、`public/app.js`、`public/style.css`、`tests/agent-skill.test.mjs`、删 `tests/skill.test.mjs`、`CONTEXT.md`、`TASKS.md`），**未 push**（push 需用户授权）。

- **T24 · 多源 URL 入口：微信公众号图文 / 抖音·小红书视频 → 导入 → 笔记 → skill（含视频音轨转写 + 画面关键帧）** — done · owner: claude code · 2026-10-10
  - 起因：用户「现在的信息源只有小红书，微信公众号图文、抖音视频和小红书视频也有很多优质内容，在 github 上找能摘抄公众号图文、提取抖音/小红书视频**音频**信息的工具，方便让大模型总结；如果能理解视频**画面**并对音频做补充更好」。要点：①扩信息源到 微信图文/抖音视频/小红书视频；②用成熟开源工具（yt-dlp / 纯标准库抓取）拿素材；③视频取**音轨**转成文本供 LLM 总结，并抽**关键帧**让视觉 LLM 理解画面、对音频做补充（多模态）。
  - 方案（后端端点 + 3 个标准库/工具驱动 + 前端入口）：
    - **后端 `server.mjs`** 新增 **`POST /api/agent/media {source, url, goal?, cookieFile?}`**：校验 `source ∈ {douyin, xhs-video, wechat}`（否则 400）、`url` 为 http(s)（否则 400）；`goal`≤40 字可选、`cookieFile` 可选；建 `db.agentRuns` 记录（`kind:'pipeline'`, `mode:'url'`, `source`, `goalLabel=<源>→笔记→skill`）→ **spawn** `scripts/url_pipeline.py`（`.venv-ocr` python，`--source --url --api --run-id [--goal] [--cookie-file]`，`detached`）→ 202 `{runId, source}`。复用既有 `POST /api/agent/pipeline/:runId/result` 回调与 `GET /api/agent/runs`（无新过滤需求，`source` 随 run 落库）。
    - **`scripts/url_pipeline.py`**（新，纯标准库驱动，仿 `experiment_pipeline.py`）：按 `--source` 分派——`wechat`→`fetch_wechat.py`（系统 python）；`douyin`/`xhs-video`→`download_media.py`（`tools/.venv-dl` python）。得产物后复用服务端 API：建/找笔记本（标题 `<源标签> · <goal或推导>`，成功抓取后才建本）→ `POST /api/sources` 导入 → 视频先 `POST /api/transcribe`（wav base64）转写音轨 → `POST /api/generate`+`/api/notes` 整理笔记 → `POST /api/agent/skill` 生成 skill；报告落 `data/pipeline/<source>-<netloc>.report.json` 并回写 `/result`。**视频资料**正文=音轨转写+标题/作者/时长/原文链接，末行 `图片目录：<frames>` 供视觉 LLM；**微信资料**=Markdown 图文，末行 `图片目录：` 供视觉。
    - **`scripts/fetch_wechat.py`**（新，stdlib urllib+html.parser）：单篇 `mp.weixin.qq.com` URL → 提取 title/author/date，`#js_content` 转 Markdown（`![图N](img/NN.jpg)`），带 `Referer: https://mp.weixin.qq.com/` 下图 → `data/wechat/<slug>/article.md`（末行 `图片目录：`）。
    - **`scripts/download_media.py`**（新，yt-dlp+ffmpeg）：①yt-dlp 下载视频+info.json（必需，`bv*+ba/b`）；①b 字幕**尽力**补（zh-Hans/zh-CN/zh/en，独立 pass，失败仅 warn 不中断——**与视频下载解耦**，避免字幕 429 拖累必需的视频下载，音轨转写才是主文本源）；②ffmpeg 抽 16kHz 单声道 WAV（供 faster-whisper）；③ffmpeg 抽 N 关键帧（`fps=1/<step>`，供视觉 LLM）。`--source` 仅为标签，实际下载由 yt-dlp 完成。
    - **前端**（`index.html`/`app.js`/`style.css`）：`#agentDialog` 加 `#agentSource` 下拉（keyword/wechat/douyin/xhs-video），URL 模式显示 `#agentUrl`（隐藏 keyword 的 `#agentGoal`/`#agentCrawl`）；`startAgentPipeline()` 按 source 路由——非 keyword 走 `/api/agent/media`，keyword 走既有 `/api/agent/pipeline`；`renderAgentReport` 渲染 source-aware steps + `report.url`。
  - **活体发现并修 1 处确定性前端 bug**：`#agentGoal` 在 HTML 带静态 `required`，切到 URL 模式后该隐藏字段仍必填 → 表单提交被浏览器拦截、无法发 URL。改 `syncAgentMode()` 动态切换 `agentGoal.required`（keyword 模式）/`agentUrl.required`（URL 模式）后 URL 提交正常。
  - 验证：`node --check server.mjs public/app.js` 过；`npm test` **37/37**（新增 5 项 media：非法 source 400 / 非法 url 400 / 合法 media run→202+驱动参数 `--source/--url/--api/--run-id` 正确+run 落库(kind=pipeline,source=url-mode,running) / `--goal`+`--cookie-file` 透传 / `/result` 回调翻 done。既有 32 项无回归）。**浏览器活体（单实例 8765，预览面板）**：dialog 打开、`#agentSource` 切换 keyword↔URL 字段显隐正确（含 required 修复）、提交 → `POST /api/agent/media` 202 → run 创建 → 轮询；**完整微信图文管线活体跑通**：`fetch_wechat.py` 抓取 → 导入 424 字资料 → 建「微信实验学习 · …」笔记本 → 整理笔记 → 生成 skill（诚实判「unidentified-experiment-pending-review」+ 9 项待核对 gap，不臆造）→ 回调 run `done`，全程无失败请求。
  - 边界（如实）：①抖音/小红书视频**下载路径本轮未活体跑**（无真实抖音/小红书视频 URL；小红书需登录 cookies.txt）——已验证 yt-dlp Douyin/XHS 提取器已装于 `tools/.venv-dl`、ffmpeg 抽音轨+关键帧命令在合成视频上验证通过、完整编排经微信活体证明；②音轨转写依赖本地 faster-whisper（`/api/transcribe`），无有效语音/识别服务不可用时正文标「转写为空」不臆造；③不做反爬绕过，需登录站点用 `--cookie-file`，失败如实上报 failed；④skill 仍受 1800 字符共读预算限制（open T13），视频转写长文同样受限；⑤`data/store.json` 中两条指向已删测试笔记本的孤儿 agentRun 已清除，余下 agentRun 均指向现存笔记本。
  - 提交：本地 commit（`server.mjs`、`public/index.html`、`public/app.js`、`public/style.css`、`tests/agent-pipeline.test.mjs`、`scripts/url_pipeline.py`、`scripts/download_media.py`、`scripts/fetch_wechat.py`、`TASKS.md`、`CONTEXT.md`），**未 push**（push 需用户授权）。`.claude/launch.json` 临时预览改动已还原未纳入。

- **T23 · 实验 Agent 层级修正（移出并列 tab → 侧栏 dialog）+ 去除实验指导冗余「从当前笔记生成 skill」按钮** — done · owner: claude code · 2026-10-10
  - 起因：用户反馈「实验agent 不应该和另外三个并列，**层级错误**」——T22 把实验 Agent 做成工作区第 5 个并列 tab，但它其实是**跨笔记本的编排入口**（给关键词自动建本+导入+skill），不应与某个笔记本内的四个视图 tab 同级；另「实验agent 就能完成 skill 的闭环，实验指导中的『从当前笔记生成 skill』**冗余了**」——T20 的生成按钮与 Agent 管线末端的 skill 产出重复。目标：把实验 Agent 降到侧栏触发的 dialog（与设置/新建笔记本等 dialog 同层级），并删掉「实验指导」里冗余的 genSkill 按钮。
  - 方案（纯前端，零后端改动、零新依赖）：
    - `public/index.html`：① tablist 删掉第 5 个 `data-tab="agentRun"` 按钮（恢复为 4 tab：共读/学习资料/疑问清单/实验指导）；② 侧栏 `nav-label` 行后加 `<button id="agentOpen" class="agent-open">⚙ 实验 Agent · 一键整理</button>`；③ 原 `#agentRun` panel 移除，改在 dialog 区放 `<dialog id="agentDialog">`（内含原 `#agentForm`：goal/crawl 输入 + `#agentStart` + `#agentState` + `#agentLog` + `#agentReport`），与设置/新建本等 dialog 同级；④ `#skillGuide` panel 删掉 `#genSkill` 按钮（保留 skill 下拉 + 问答区）。
    - `public/app.js`：删除 `$('genSkill').onclick` 整块（原「从当前笔记生成 skill」handler）；新增 `$('agentOpen').onclick`（清 log/报告/状态 → `showModal()`）与 `$('closeAgent').onclick`（`close()`）；「去实验指导问答 →」handler 开头加 `$('agentDialog').close()`（先关 dialog 再切 tab，避免 dialog 遮罩盖住切出的「实验指导」）。管线/轮询/报告渲染逻辑不变。
    - `public/style.css`：新增 `.agent-open`（侧栏满宽触发按钮样式）。
  - 活体（单实例 8765，预览面板）：① 恢复 4 tab（`notes/sources/questions/skillGuide`，无 agent tab）；② 侧栏「⚙ 实验 Agent · 一键整理」存在；③ 「实验指导」panel 无「从当前笔记生成 skill」按钮；④ 点侧栏按钮 → dialog 打开（goal 输入 + ☐重新采集默认关 + ▶开始跑）；⑤ `goal:"酵母转化"`（reuse）→ ~20s `status:done`，报告在**打开的 dialog 内**渲染（✓ 运行完成 + 4 格 steps + 待核对清单 4 条 `【步骤 N · …】` 无 `[object]` 前缀）；⑥ 点「去实验指导问答 →」→ **dialog 关闭**（`dialogOpen:false`）+ 切到「实验指导」tab（`activeTab:skillGuide`）+ `skillSelect` 自动选中 `yeast-liac-peg-transformation`；⑦ 全程控制台零报错。
  - 验证：`node --check public/app.js` 过；`node --test --test-concurrency=1 tests/*.test.mjs` **32/32**（纯前端改动，零后端/接口/store 改动，无回归）；`grep genSkill` 确认 app.js/index.html 零残留。
  - 边界（如实）：`POST /api/skills/generate` 后端端点**保留**（仅移除前端入口按钮），仍可经 API/管线使用；实验 Agent 现为跨笔记本编排入口，产出落到 `小红书实验学习 · <goal>` 笔记本；skill 由 Agent 管线统一产出后，「实验指导」tab 只负责「选 skill + 问答指导」，职责更单一。
  - 提交：本地 commit（`public/index.html`、`public/app.js`、`public/style.css`、`TASKS.md`、`CONTEXT.md`），**未 push**（push 需用户授权）。

- **T22 · 前端「实验 Agent」tab（一键触发前半段管线 + 报告 + 跳转实验指导）** — done · owner: claude code · 2026-10-10
  - 起因：承接 T21（前半段管线已有 `POST /api/agent/pipeline` 后端 + python 驱动，但只能直接调 API）。用户「可以」批准加前端 agent 触发入口；用户选择**独立「实验 Agent」tab**（工作区第 5 个 tab）。目标：给一行关键词 → 前端一键启动 T21 管线 → 轮询进度 → 渲染结构化报告（5 步 + 待核对清单）→ 一键「去实验指导问答」跳到 T20 的「实验指导」tab 并自动选中新 skill，实现「任何 agent 可调用指导实验」的完整闭环在 UI 内可操作。
  - 方案（纯前端，零后端改动、零新依赖）：
    - `public/index.html`：tablist 加第 5 个 `<button data-tab="agentRun">实验 Agent</button>`；`#skillGuide` panel 之后加 `#agentRun` panel——`#agentForm`（`#agentGoal` 必填输入 `maxlength=80` + `#agentCrawl` checkbox 默认关=复用已有采集不启浏览器）+ `#agentState` 状态 + `#agentLog` 进度 + `#agentReport` 报告容器（默认 hidden）。
    - `public/app.js`：`startAgentPipeline()`（校验 goal→`POST /api/agent/pipeline {goal,crawl}` 拿 `runId`→`pollAgentRun()`）；`pollAgentRun()` 每 4s `GET /api/agent/runs?id=` 直到 `status` 为 done/failed（~2h 上限）；`renderAgentReport(run)` 渲染 ✓/✕ 标题 + summary + 4 格 steps（模式/导入/笔记/skill）+「待核对清单·N」（`g.where`→`【步骤 N · …】` 前缀）+「去实验指导问答 →」按钮（点 `data-tab="skillGuide"` tab→`await loadSkills()`→设 `skillSelect.value=skill.name`→`renderSkillMessages()`）。复用 `api()`/`run()`/`node()`/`button()`/`loadSkills()`/`renderSkillMessages()`。
    - `public/style.css`：`.agent-form`/`.agent-check`/`.agent-actions`/`.agent-log`（`:not(:empty)` 才显示）/`.agent-report`/`.agent-report-title.ok/.fail`/`.agent-summary`/`.agent-error`/`.agent-steps`（auto-fill grid）/`.agent-step`/`.agent-gaps-title`/`.agent-gaps li`；新增 `button.primary`（实心主色，报告 CTA 用）。
  - **活体发现并修 1 处确定性前端 bug**：`renderAgentReport` 里 gap 列表项误写成 `node('li','',prefix)+g.text`——`element+string` 触发隐式 `String(element)`，把每个 `<li>` 文本前拼上字面 `[object HTMLLIElement]`（浏览器活体首跑即暴露：报告 gap 全部带 `[object HTMLLIElement]` 前缀、`querySelectorAll` 也异常）。改为 `node('li','',prefix+g.text)`（`+g.text` 移入 `node()` 内）后 gap 干净渲染为 `【步骤 N · …】文本`。
  - 落地文件：`public/index.html`（第 5 tab + `#agentRun` panel）、`public/app.js`（`startAgentPipeline`/`pollAgentRun`/`renderAgentReport` + 表单提交绑定 + gap 拼接修复）、`public/style.css`（agent 表单/日志/报告样式 + `button.primary`）。
  - 验证：`node --check public/app.js` 过；`node --test --test-concurrency=1 tests/*.test.mjs` **32/32**（纯前端改动，零后端/接口/store 改动，无回归）。**浏览器活体（单实例 8765，预览面板）**：①「实验 Agent」tab 正常渲染（goal 输入 + ☐重新采集默认关 + ▶开始跑 + 空日志/隐藏报告）；②`goal:"酵母转化"`（reuse 模式，不启浏览器）提交 → 202 runId → 轮询 → ~20s 后 `status:done`，报告渲染 `✓ 运行完成` + summary（采集[reuse]→导入 0 篇/跳过 8→整理笔记→生成 skill yeast-liac-peg-transformation 12 步 4 项待核对）+ 4 格 steps + 待核对清单 4 条（`【步骤 1 · Carrier DNA 预处理】参数：95℃…`/`【步骤 5 · 加入质粒】…`/`【步骤 11 · 涂板筛选】…` 等，`g.where` 前缀正确、无 `[object]` 残留）；③点「去实验指导问答 →」→ 切到「实验指导」tab + `skillSelect` 自动选中 `yeast-liac-peg-transformation` + description 显示「用 LiAc/PEG 法将质粒导入 Y187/Y2H 酵母感受态细胞…」；④全程控制台零报错。
  - 边界（如实）：`crawl:true` 需用户已开 9222 且已登录小红书的 Edge（`CDP_CONNECT_EXISTING` 免扫码），本 tab 默认关=复用已有采集，不替用户启浏览器/撞风控；报告 gap 为 T20 确定性关键词提取（非 LLM 判断）；笔记/skill 受 1800 字符共读预算限制（open T13），非全文覆盖；轮询上限 ~2h，超时提示刷新。
  - 提交：本地 commit（`public/index.html`、`public/app.js`、`public/style.css`），**未 push**（push 需用户授权）。

- **T21 · 打通前半段：goal→采集→导入→笔记→skill 端到端管线（agent 可一键触发）** — done · owner: claude code · 2026-10-10
  - 起因：承接 T20（资料→skill 后半段）与用户方向「我不仅能从网上整理出大量可靠的实验来学习，也可以在我要做什么实验的时候就可以通过**任何 agent** 来调用来指导我」。前半段目标=给一行实验关键词（如「酵母转化」），agent 一条命令自动跑完 **采集(可选)→OCR→导入→建笔记本→整理聚焦笔记→生成 skill→检查待核对 gap→结构化报告**。
  - 方案：新增 `scripts/experiment_pipeline.py`（纯标准库驱动，`--goal` 必填；默认 **reuse** 复用 `MediaCrawler/data/xhs` 已有该关键词图文、不启浏览器，`--crawl` 才真正启动 MediaCrawler；`--force-skill`/`--run-id`/`--api`/`--app-root`/`--crawler-root`/`--out`/`--crawl-timeout`）。复用 `import_xhs.py` 作为子进程（不重写采集/OCR/导入）；import 后定位笔记本（标题 `小红书实验学习 · <goal>`）→ `POST /api/generate` 整理聚焦笔记 → `POST /api/notes` 持久化 → `POST /api/agent/skill`（T20）生成/复用 skill；每步 `emit` JSON-lines 进度、报告写 `data/pipeline/<slug>.report.json`，若 `--run-id` 则回写 `POST /api/agent/pipeline/<runId>/result`。
  - 后端（`server.mjs`）：新增 **`POST /api/agent/pipeline {goal, crawl?, force?}`**——校验 goal（非空/≤80 字）→ 建 `db.agentRuns` 记录（`kind:'pipeline'`, `status:'running'`）→ **`spawn` 该 python 驱动**（`detached`+`stdio:'ignore'`，`--api` 指向本实例端口，`--run-id` 关联）→ 立即返回 202 `{runId}`；新增 **`POST /api/agent/pipeline/:runId/result`**——驱动完成后回写报告（`status:done/failed`、`notebookId/Title`、`error`、`completedAt`）；**`GET /api/agent/runs`** 扩展为可按 `?id`/`?notebookId`/`?kind` 过滤。`createApp` 新增 `pipelineLauncher=spawn` 注入缝（测试用 fake launcher，不真起进程）。
  - 落地文件：`scripts/experiment_pipeline.py`（新）、`server.mjs`（`/api/agent/pipeline` + `/result` 回调 + `/agent/runs` 过滤 + `pipelineLauncher` 注入）、`tests/agent-pipeline.test.mjs`（8 项）。
  - 验证：`node --check` 过；`node --test tests/*.test.mjs` **32/32**（新增 pipeline 8 项 + 既有 24，无回归）。pipeline 8 项=空 goal 400 / 超长 goal 400 / 合法 goal→202+驱动参数正确携带 `--goal/--api/--run-id`+run 落库(kind=pipeline,running) / `crawl:true,force:true`→参数含 `--crawl --force-skill` 且 mode=crawl / `/result` done→run 翻 done+存 notebook+result / `/result` failed→run 记 error / 未知 runId 404 / `?kind`·`?id` 过滤。**活体**（单实例 8765）：`POST /api/agent/pipeline {"goal":"PCR 实验"}`（经 UTF-8 body）→ 202 → 驱动 reuse 模式复用已有 8 篇图文（OCR 缓存命中，`skipped:8/failed:0`）→ 整理 2642 字笔记 → 复用 skill `pcr-qpcr-colony-pcr`（5 步，8 项待核对）→ 回写 `status:done`，`GET /api/agent/runs?id=` 完整报告齐全（goal/counts/note/skill/notebook/summary）。失败路径活体：`goal:"yeast transformation"`（无该关键词数据）→ run 落 `status:failed`，`error` 含 `import exited 1: … "yeast transformation": 0 …`。
  - **排障记录（CJK）**：早期 `POST /api/agent/pipeline {"goal":"PCR 实验"}` 曾失败，goal 被存成 `PCR ʵ验`（`实` U+5B9E→`ʵ` U+02B5）。定位=**测试通道产物非代码缺陷**：Git Bash 把命令行里手敲的 CJK 按 OEM(GBK) 编码传给 `curl -d`（raw 字节 `ca b5 d1 e9`=GBK「实验」），Node 按 UTF-8 解码这些 GBK 字节才产生 mojibake。改用 `curl -d @utf8.json`（文件为 UTF-8，`实`=`e5 ae 9e`）即 goal 原样到达、全链 done。`server.mjs` 的 `body()` 本就是 UTF-8 正确解码；真实 UTF-8 客户端（浏览器/其他 agent）不受影响。
  - 边界（如实）：`crawl:true` 需用户已开远程调试(9222)且已登录小红书的 Edge（`CDP_CONNECT_EXISTING`，免扫码），本轮未实际启浏览器（会撞风控/占用户环境），仅验证参数构造与 reuse 半程；skill 由材料整理生成≠已确认规程；受 1800 字符共读预算限制（open T13），聚焦笔记非全文覆盖；报告 gap 为确定性关键词提取。
  - 提交：本地 commit（`scripts/experiment_pipeline.py`、`server.mjs`、`tests/agent-pipeline.test.mjs`、`skills/pcr-qpcr-colony-pcr.md`），**未 push**（push 需用户授权）。

- **T20 · 资料→skill 端到端 agent 切片（每个实验产出可移植 SKILL.md）** — done · owner: claude code · 2026-10-10
  - 起因：用户「资料→skill 端到端 agent 切片开始搭，每个实验最终都要生成一个 skill……我不仅可以从网上整理出大量可靠实验来学，也可以在我要做某实验时通过**任何 agent** 调用来指导我」。要点：skill 必须是**可移植的标准 Agent Skills 格式**（YAML frontmatter `name/title/description` + 步骤），任何 agent 都能加载，不只是研习伴自己的 `/api/skill-ask`。
  - 方案：把 T8 垂直切片里的「笔记/材料→LLM→SKILL.md」抽成共享助手 `generateSkillForNotebook(notebookId)`（取最新笔记 + `evidence()` 材料→喂 LLM 按模板生成→写 `skills/<slug>.md`），`/api/skills/generate` 复用同一助手（行为不变）。新增 **agent 编排端点 `POST /api/agent/skill`**：计划→（auto 幂等复用 / force 重生成）→验证→**确定性提取「待核对」gap 清单**→结构化报告，并把每次 run 落盘到 `db.agentRuns`（新顶层键，schema 向后兼容，`??=[]` 初始化）。新增 **`GET /api/agent/runs`**（可按 `notebookId` 过滤，倒序）。
  - 幂等/命名：`lastDoneAgentSkill(notebookId)` 按 agentRuns 历史找该笔记本最近一次 done 的 skill 复用；force 模式先删旧文件再重生成（不产生 `-2` 副本）。文件名用 LLM 给的 ASCII slug，与 frontmatter `name:` 一致（`/api/skill-ask` 按 name 加载）。
  - gap 提取（`extractGaps`）：确定性扫 skill 正文，凡含「待核对/材料未说明/未说明」的 `操作/参数/注意/检查点` 行归入所属步骤/小节，输出 `[{where,text}]`——不靠 LLM 判断，可复核。
  - 落地文件：`server.mjs`（`db.agentRuns` 初始化 + 3 助手 `lastDoneAgentSkill`/`generateSkillForNotebook`/`extractGaps` + `/api/skills/generate` 重构复用助手 + `POST /api/agent/skill` + `GET /api/agent/runs`）；`tests/agent-skill.test.mjs`（5 项：生成→portable+gap 提取+run 落盘+`/api/skill-ask` 可加载 / 二次 run 复用不产 `-2` / force 重生成不产 `-2` / 未知 notebook 404 / 无 run 时 `GET /api/agent/runs` 回 `[]`）。
  - 验证：`node --check` 过；`node --test tests/*.test.mjs` **24/24**（agent-skill 5 + 既有 19，无回归）。**活体**（单实例 8765）：对「小红书实验学习 · 酵母转化」笔记本 `POST /api/agent/skill` → 201，`status:done`、`reused:false`，产出 `skills/yeast-liac-peg-transformation.md`（frontmatter `name/title/description` + **12 步**，每步 操作/参数/注意/检查点 + 安全段，纯酵母转化主题非双杂交）；`portable:true`、`format:"Agent Skills (SKILL.md)"`；**gapCount:4**（Carrier DNA 预处理时长/变性、质粒浓度、涂板量）；summary 明示「任何 agent 可加载 yeast-liac-peg-transformation.md 指导该实验」。二次 run `reused:true`、同 path、无 `-2`；`GET /api/skills` 列出该 skill；`/api/skill-ask` 加载该 skill 问「加入质粒后下一步」→ 准确定位步骤 5、给 30℃ 孵育 30min→42℃ 热激 15min + 安全提醒；`GET /api/agent/runs?notebookId=` 列出两条 run（reused false→true）。
  - 边界（如实）：gap 提取为确定性关键词匹配（「待核对」等词触发），不覆盖未用这些词的缺口；`/api/skill-ask` 的步骤定位是 LLM 软判断（靠 skill 全文 + 问题）；skill 由材料整理生成≠已确认规程（受 1800 字符共读预算限制，open T13）；本次仅资料→skill 后半段，前端「实验指导」tab 尚未加 agent 触发入口（现直接调 API），采集/import→笔记 的前半段管线未打通（需用户已登录 Edge/CDP，另立项）。
  - 提交：本地 commit（`server.mjs`、`tests/agent-skill.test.mjs`），**未 push**（push 需用户授权）。生成的 `skills/yeast-liac-peg-transformation.md` 为 git 管理产物。

- **T19 · 小红书「酵母转化」采集→导入→共读笔记（+ 双杂交/转化 误标修复）** — done · owner: claude code · 2026-10-10
  - 起因：用户「从小红书上找酵母转化笔记整理攻读笔记」。用 MediaCrawler（`CDP_CONNECT_EXISTING=True` 连用户已登录小红书的 Edge，免扫码）采集关键词「酵母转化」8 篇 → OCR → 导入新笔记本「小红书实验学习 · 酵母转化」（8 条文字资料，`content` 头带 `图片目录：` 供 T18 图片能力用）。
  - **发现并修复的口径错误**：XHS 关键词搜索偏模糊，8 篇实为混合——4 篇真·转化（#2 步骤原理 / #3 Y1H 转化操作 / #6 醋酸锂原理 / #8 感受态制备与转化）、2 篇双杂交蛋白互作检测（#1/#7）、1 篇单杂交（#5）、1 篇涂板 tips（#4）。首版 `/api/generate` 固定提示词 + 1800 字符预算导致笔记主体被最长的**双杂交**来源(#1)主导，笔记标题/正文写的是「酵母双杂交检测蛋白互作」，与笔记本主题「酵母转化」不符。用户指出「酵母转化和酵母双杂交不是一个东西」——确认为真·口径错误。
  - 修复（数据层，零代码改动）：用 `/api/chat` 传入聚焦「酵母转化」的自定义问题（该端点按问题词元给 evidence 排序 → 偏向 4 篇纯转化来源、压低双杂交/单杂交），并在问题里要求「双杂交/单杂交只在末尾『相关但不同技术』小节一句话点明区别、不作正文主体；涂板仅作转化后计数步骤」。重新生成 3131 字笔记（标题「酵母转化实验学习笔记」，正文=目的/LiAc-PEG 原理/感受态/Carrier DNA 预处理/分步参数/涂板计数/注意事项/8 项待核对 + 末尾「相关但不同技术」列双杂交·单杂交），`POST /api/notes` 存为新版本 `aec8d9be`（旧双杂交版 `80e666b9` 保留为只读历史版本）。8 条来源**全部保留**（用户要求「沾边的要暴露」，无任何一篇属完全不相关故未删）。
  - 验证：`store.json` 两版本 head 行核对（新=`## 酵母转化实验学习笔记`、旧=`…酵母双杂交…`）；新笔记全文逐节确认为转化主题；单实例 8765 未双开。
  - 诚实边界：受 1800 字符共读预算限制（open T13），新笔记正文主要引用 S1(双杂交，仅用于"相关"小节)+S2(转化步骤)，#6/#8 等其余转化来源未完全并入正文；如需覆盖全部 8 篇需 T13 分段上下文。
  - 提交：无 Study companion 代码改动（数据在 gitignored `data/store.json`），本任务无需 commit。MediaCrawler `config/base_config.py` 的 `CDP_CONNECT_EXISTING=True` 属另一仓库，未在其提交。

- **T18 · 共读 LLM 视觉接入来源原图 + 学习资料 UI 展示原图** — done · owner: claude code · 2026-10-10
  - 起因：用户反馈「笔记来源不能更好地提取图片…不利于大模型对获取内容的准确理解」，并确认本地接入 Claude Code 的 Qwen（18081，`local-qwen38-gsq`）具备图片识别能力。原 `/api/chat` 只发纯文本（OCR 转录），LLM 看不到原图里的图表/流程图/培养皿等视觉信息。
  - 方案：`/api/chat` 把本轮选中来源的**原图**以 OpenAI 视觉格式（`content:[{type:'text'},{type:'image_url':{url:'data:<mime>;base64,…'}}]`）随材料一起发给本地 VLM。图片来源=来源 `content` 头部嵌入的 `图片目录：<绝对路径>`（XHS 导入来源才有）；按「关键词排序后的 top 来源」顺序取图，跨来源去重、总量上限 `MAX_CHAT_IMAGES=4`。纯文本来源（.txt/.srt 等无 `图片目录`）贡献 0 图 → 自动回退纯文本（行为不变）。
  - 落地（后端·LLM 视觉）：`server.mjs` 新增 `sourceImageDir()`（解析 `图片目录：` 行）、`sourceImageList()`（列目录图片）、`collectChatImages()`（top 来源去重取图、上限截断）；`/api/chat` 组装 `material`（有图=文本+图数组、无图=纯字符串），prompt 追加「附 N 张来源原图…与原图冲突以原图为准」；reply 新增 `images` 计数（store 兼容）。仅 `/api/chat` 送图（`generate`/`skill-ask` 不送，`images:0`）。
  - 落地（后端·图片展示 API）：新增 `GET /api/sources/:id/images`（返回 `[{name,url}]`）与 `GET /api/sources/:id/image?file=<basename>`（按 mime 流式出图）。**路径穿越防护**：`file` 只允许 `[0-9A-Za-z._-]` 且 `path.relative` 不得越出来源图片目录（`../store.json`→400）；仅 `kind:'text'` 资料、资料不存在→404、文件不存在→404、无 `图片目录`→空列表。
  - 落地（前端）：`app.js` `showSource()` 对文字资料在详情对话框顶部异步拉 `/images` 渲染 `来源原图 · N 张` 缩略图条（点缩略图新标签开原图 `openImage`）；来源卡片顶部加 `📷 N 张原图 · 点击查看` 徽标。`style.css` 加 `.source-images`/`.source-card-imgs`。
  - **零 store schema 升级、零新依赖**。图片来源=来源 `content` 头部 `图片目录：<绝对路径>`（XHS 导入来源才有），目录在 app 之外（`MediaCrawler/data/xhs/media`），故必须经服务端路由取图，前端无法直接 URL 引用。
  - 验证（LLM 视觉）：`node --check` 过；`npm test` 18/18（修一处正则 `m` 标志误写成属性 `.m` 导致 `Cannot read … exec` 的确定性缺陷）；**活体端到端**——重启单实例 8765，对「大肠杆菌转化」笔记本问「流程图离心步骤/参数」→ 响应 `images:4`，LLM 读图给出两步离心 3000g/4°C/10min、CaCl₂ 体积、-80°C，并**主动发现 OCR 文本写 `3000 r/min` 而原图标 `3000 g` 的单位不一致**、提示以原图为准（正是 OCR 单靠文本无法发现的差异）；浏览器 UI 同问渲染正常、控制台零报错。
  - 验证（图片展示）：新增 `tests/source-images.test.mjs`（list 顺序/`url`、serve 正确 content-type 且字节一致、`../store.json` 与 `..%2f..%2f` 均 400、缺文件 404、无 `图片目录` 空列表、坏 id 404）→ `npm test` 19/19；**浏览器活体**——「大肠杆菌转化」学习资料 8 张卡片全部显示 `📷 N 张原图 · 点击查看`（5/3/6/2/9/4/6/5），点开第一条详情对话框顶部渲染 `来源原图 · 5 张` 缩略图条、5 图全部加载（naturalWidth 1080）、OCR 正文仍在下方、截图确认流程图原图可见、控制台零报错。
  - 边界（如实）：图序↔来源序映射是近似的（第 1 张属 S1 所在来源，prompt 已声明）；仅取 top 来源前 4 张送 LLM（UI 展示则显示该来源全部原图）；某来源图片目录缺失/被删则静默跳过；依赖本地 VLM 真的理解图像（已活体核验，非假设）；`max_tokens=4000` 不变，图片计入输入 token（18081 上下文 220000 足够）。图片经服务端路由从 app 外目录读取，已做 basename 白名单 + 目录越界防护。
  - 提交：本地 commit（`server.mjs`、`public/app.js`、`public/style.css`、`tests/source-images.test.mjs`），**未 push**（push 需用户授权）。

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

## T47 · 笔记与视频证据同屏核对
- status: done · owner: Codex · files: public/app.js, public/index.html, public/style.css, src/note_renderer/index.mjs, tests/provenance.test.mjs, docs/按优先级迭代.md, CONTEXT.md, TASKS.md
- 优先打通引用原文、视频片段、前后文回放和返回笔记；保留历史来源边界，不把可溯源等同于内容正确。

- T47验收：语法通过、Node94/94；实际课程S198/S201同屏视频与原句、前后文与返回通过。历史类型缺失如实提示；语义准确性未重新评估。后续顺序见docs/按优先级迭代.md。

## T48 · 同条笔记引用入口聚合
- status: done · owner: Codex · files: public/app.js, tests/provenance.test.mjs
- 每个笔记条目/段落一个查看依据入口，内部保留全部证据；同媒体间隔不超过3秒、总长不超过60秒且时间完整才提供连续播放。不同媒体、远距离或缺结束时间不自动拼接。
- 验证：语法通过，来源专项6/6；浏览器实际S15/S18显示一个入口、两条原句、11–16秒连续回放。旧Markdown及引用数据未改写。

## T49 · 对象、因果与数量的语义门禁首轮
- status: done · owner: Codex
- 2.2.0新增语义双轮核对与只读原材料关系还原、注释混排风险门禁。100/100 Node顺序测试、9例定向模型开发回归符合预期；其中B24模型仍漏检，由保守混排规则拦截。详见docs/语义准确性修复-2026-10-22.md。T44整课复跑与误拒绝修复仍open；未覆盖旧笔记。
