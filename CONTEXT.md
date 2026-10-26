# 当前执行状态 · 2026-10-26 业务B接手

- 用户已确认负责工作与科研端（业务B）；本机Git Credential Manager实际登录核验为cmccjiang。Codex在本会话代执行，不将旧“工作者A/Codex”或“工作者B/待认领”自动映射为产品职责。
- 基线origin/main/65328fed7cbbe99642ace180704d64e7079464c5；新建collab/cmccjiang-research-notes，包含最新三人协作约定。从main接续，不合入未经独立审阅的PR #1，不覆盖collab/content-quality。
- 本期：T59登记和T60只读科研/报告编排首阶段均已验证完成，仅在独立任务分支；T61网页集成、T62真实模型/材料验收保持open。详细边界见 [工作与科研端协作](docs/工作与科研端协作.md)。
- 进入核查：完整59项任务无未登记引用/重复，旧T56/T44/T41/T58尚未认领、T45继续hold。原Node/Python/Pydantic与五阶段管线优先，不更改共享服务、界面、存储格式或用户数据。
- T59登记阶段已验证：真实登录cmccjiang；带owner进入检查通过，63项任务引用/重复均0；新MD的2个实际相对链接和git diff --check通过。成果在任务分支，尚未进入main。
- T59已上传：29be1932b35f299a464d7ada00f06cc96693b4b9，远端分支已逐字核对。T60新增src/research_notes、CLI和合成样例；从既有审计事实编排、匹配原始/清洗证据，隔离未审计/冲突/风险；决议、行动项和文献信息待人工确认，不作新的语义或科学认证。
- T60实际验证：Windows/Node26.7.0/Python3.13.3；Node139/139（原110+科研29）、Python19/19、Pydantic原输入契约、原check及新增JS语法通过。两组JSON/MD重复生成一致、24个证据锚点、8份本轮说明16个本地链接通过。原server/public/五阶段与公共Schema无差异，无真实学习库或模型服务改动。
- Next safe action：T60独立PR审阅后集成；T61先与C协调公共网页/业务接口/保存契约，再认领实现；T62需要有权使用的材料、可用模型和人工复核。云端PR #1仍另行待审，不顺带合入。实际上传/PR回执在 [T60记录](docs/任务进入记录/2026-10-26-T60.md) 补齐。

---

# 历史状态 · 2026-10-23 主项目任务核查

- 基线：origin/main/e401ebc6a9cfadb1eb361764d75af40e2ebafbb2。主项目两份进度文件原先没有A/B安排；此前T50–T55在PR #1分支完成，尚未集成main，不能用分支状态替代主线事实。
- A=本会话Codex，执行T57（原T14工程交接子阶段）：完成每次执行前的任务检查与遗留核查设施；后续T14/T13/T12分别保持open、按优先级认领。B=第二位协作者待认领，经T56优先接续T44语义/证据质量和T41扩展，T58独立审阅PR #1；尚未启动B执行。
- 每次执行先读 [任务进入检查](docs/任务进入检查.md)，fetch并核对origin/main，读取完整TASKS与最新CONTEXT，检查未完成/暂停及历史done条目里的遗留；写本轮MD进入记录、认领后再实现。原五阶段Node/Python框架优先，不另建业务框架。
- 本轮完整核查：原任务表50个定义、交接文件未登记引用0；T47–T49在文件末尾，保留已有条目。T45虽open但用户已暂停，新增hold:true；T37恢复机制done与整课未验收分开记录，T44/T41/T14等实际待办不关闭。
- T57工程阶段已完成：原项目Node110/110（含进入检查专项10项）、Python19/19、语法与7份说明18个实际相对链接通过；完整任务扫描59项、未登记引用0、重复0。环境Windows/Node26.7.0/Python3.13.3；模型为测试模拟，未重跑真实课程。范围为进度文档、检查脚本和测试，未改业务管线、用户数据或模型服务。
- A/B旧分支共同起点eed215d；本轮主线对齐使用独立 [PR #2](https://github.com/Aa144085412/Study-companion/pull/2)（codex/main-task-review → main），再同步A/B。PR #1的API/CI保持独立审阅，未授权范围不顺带合并或部署。
- 核查台账与本轮记录：[主项目核查与分工](docs/主项目核查与分工-2026-10-23.md)、[T57进入记录](docs/任务进入记录/2026-10-23-T57.md)。原历史验证保留在下方，不表示本轮重测。

---

## 2026-10-22 T49 语义门禁首轮
- 2.2.0保留审计时间/媒体；核心与情境候选含重写产物须通过两轮语义审查，另用不看候选的来源关系阅读。固定注释/变化字幕混排因果主张强制待核对。
- 真实本地模型3个已知错误+6个开发正反例最终9/9预期一致；不是留出准确率。B24模型仍误放行，靠通用混排风险门禁拦截。首两轮失败记录保留。
- 100/100 Node顺序回归通过，语法通过。并发临时文件锁EPERM曾出现，未专门修复。既有笔记/答题/冻结基线未改。
- 报告docs/语义准确性修复-2026-10-22.md；下一步T44整课复跑、过度拒绝与知识恢复。本轮本地提交，不自动push。

## 2026-10-22 T48 引用入口聚合
- 修复用户反馈同一句多个溯源按钮：按笔记条目/段落合并入口，展开保留全部原句和单独播放；仅相邻同媒体片段连续回放。
- 语法与专项6项测试通过，真实课程S15/S18聚合与播放验证通过。未改历史笔记数据，未push。

## 2026-10-22 T47 笔记溯源首轮交互修复（Codex）
- 用户要求按优先级解决，首轮完成引用时间、证据与视频同屏、片段重播/前后10秒、完整原文、返回笔记位置。
- 引用自身mediaId优先，保留历史媒体绑定；新生成引用保存sourceType，旧引用类型缺失明确标历史，不改store。
- npm run check、94/94 Node通过；真实课程S198/S201视频640×360、定位/前后文/返回及布局已浏览器验证。未重跑模型，旧笔记语义缺陷仍在。
- 8765原先未运行，已启动单实例供体验。迭代顺序与边界见docs/按优先级迭代.md，下一优先T44语义错误及真实复测。当前修改本地提交，未自动推送。

# CONTEXT.md — 研习伴共享状态

> Codex 与 Claude Code 接手时先读本文件、TASKS.md、COLLAB.md，并检查 Git。最后对齐：2026-10-11。

## 2026-10-22 当前版本快照（Codex）
- 用户要求先备份现有源码至GitHub，并如实记录框架和不足；授权推送，不部署、不重启服务。说明见docs/现有架构与不足-2026-10-22.md，README增加入口。
- 现有测试90/90、Python19/19、语法检查通过；不代表题目举报雏形专项验收或内容正确性认证。
- T45按用户要求暂停扩展，题目举报/暂停雏形保留；优先方向转为笔记与视频快速核实。产品仍为本地单用户研发原型。
- 本次按用户保存现有版本的要求包括此前工作树已有的.gitignore变更、cell-transfection新增及旧协作skill删除；不上传data、模型、cookie或环境。

## 2026-10-21 T43 首轮质量修复与复测（Codex）
- 代码首批本地提交df05fe7；修复中央字幕角色识别、相邻证据审计、参数语义/独立复核、单次数据泛化、覆盖补提取、有限JSON数字格式误拒绝、事实ID参数冲突、Reduce遗漏与审计漏项。漏审保持待核对，禁止出题。
- 实际笔记Pe5aacc8ee24291a69111：88卡（7核心/66情境/15待核对），7批Map、27卡补提取、3候选引文拒绝、2次重写、9项适用范围降级。118/118引用逐字匹配，所有事实恰好分组一次。冻结基线P9dc798f979bffc37d78b保持不变。
- 同一30项探索性清单：完整7→19，部分4→11，缺失19→0。这是开发清单覆盖率，非准确率、非人工专家金标准；11项部分覆盖含实质错误，不宣称全部修复。
- 正文不直接显示未核实的模型审计推测；单次数字用结构参数，混合ASR/画面记录避免错误ASR实体污染；完整原始证据与审计仍保留。
- 真实盲解曾接受一题无来源支持的新增机制。新增answer_grounding核对正确选项/解析对来源的蕴含关系，错误题真实重放被拒绝；结果见evaluation/2026-10-21/answer-grounding-regression.json。旧题验证版本已失效；最终新题组2道通过、3道拒绝，未代答；2/2引用当前CORE事实，Pydantic再次验证通过。
- 完整Node89项、最新相关测试24项、Python19项、语法检查通过。docs/笔记质量修复回归.md及post-fix-review/metrics可复算。尚无独立专家/不同模型或外部权威认证。
- 剩余T44：B13等待对象混接，B22百分点与相对增幅混淆，B24省略原因归因错误；B07/B14等过度降级与审计错误；部分正文英语字段、主观/个人操作措辞仍需改善。不可针对课程词语硬编码。
- 单实例8765，不手改store，不push；他人.gitignore与skill变更不纳入提交。

## 2026-10-21 T42 笔记准确性首轮评估（Codex）
- 冻结8610803/P9dc798f979bffc37d78b，不改生产代码/笔记。12卡逐项核对、整课字幕时间线阅读、8原帧视读、NEB/Addgene/TOYOBO有限官方核验。非人工金标准、未听全片音频、非留出盲评。
- 探索性30项清单：7完整/4部分/19缺失；16/16引文逐字匹配仅是字符串来源验证；2/2题符合核心白名单。不能称为23.3%准确率，这是本清单的完整覆盖率。
- 优先缺陷：尾段中央字幕被UNKNOWN排除，审计只见错ASR；审计将引物溶液浓度与反应终浓度混淆；单次标签下仍使用通常泛化；5/10对照卡parameters只存10。T41修复前应保留冻结评估基线。
- docs/笔记准确性首轮评估.md；evaluation/2026-10-21/review.json与metrics.json；scripts/evaluate_notes.py复算核验哈希/引用ID/计数，通过。评分由本轮Codex审阅记录，不是脚本自动科学判定。

## 2026-10-21 T40 五阶段管线首版（Codex）
- 已接入 typed evidence → AtomicFact Map/全局Reduce → 三源归因与重写复审/独立反例审查 → 三层笔记 → 核心白名单与独立盲解。无学科硬编码替换；术语候选不自动更改原文。Pydantic在真实API保存前执行。
- 真实课程结果 P9dc798f979bffc37d78b：1102条证据、17条全噪声、362条未知画面；3批提取，12张事实（2核心/6情境/4待核对），6张候选引文/格式不合格，1次重写后仍待核对，3项独立反例降级；冲突/语义合并均0，不能据此宣称无冲突或消除所有重复。
- 从2个核心知识点生成2道选择题，2道独立盲解通过、0拒绝，未代答；旧5题留历史但隐藏。真实浏览器验证中央三层笔记、审计弹窗、两题导航、0已答。审计结果内容哈希隔离版本；材料改变阻止旧题生成/作答。
- 验证：Node 77/77、Python 18/18、语法检查通过；报告见 docs/五阶段管线对比验证报告.md（含笔记/归因/题目与答案）。完整真实产物在 data/pipeline-v2/P9dc798f979bffc37d78b。
- 已知边界：最多6帧视觉语义分类；仪器证据当前保守排除；Map每批最多6张卡，非穷尽课程。独立上下文仍共用同一模型，尚无外部权威标准核验。不能把首版工程门禁称为全部产品质量目标完成。下一步 T41。
- 单实例8765已加载新代码，本地视频导入保留，未push；他人.gitignore/旧skill删除/cell-transfection.md未纳入。

## 2026-10-20 T39 选择题速练（Codex）
- 用户要求全部选择题、可快速连续练习。前端逐题伴学改为每组5道四选一题，题号导航、点击即时判分、答后解析/来源、错题回顾、继续生成；quizSession存笔记本，旧learningSession保留。
- /api/quiz generate/answer：模型只负责生成，服务端按题目答案判分；版本冲突与重复作答保护。每题验证四个唯一选项、答案键、source_quote原句及source_label；失败自动修正一次。题组优先使用联合证据中的字幕/画面文字，排除交错原ASR噪声；错题主题用于后续变式。
- 选项循环换位，答案键与解析中的字母同步；引用原句匹配不等同于题目语义准确性的独立验证，题目质量仍需迭代。当前是单选题，不是多选。
- 67/67 Node测试与语法通过，覆盖坏格式修正、引用校验、判分不调用模型、重复提交和重启恢复。真实课程5题已生成、未代答；旧开卷题记录未删。

## 2026-10-20 T38 中央笔记保存修复（Codex）
- 根因：/api/generate 仅写 messages(type=draft)，前端 refresh() 不加载新笔记。改为生成成功写 revisions，保留旧版本和 citations/coverage，不新增长聊天草稿；前端完成后加载中央笔记，保留用户期间未保存的编辑。
- 新增 /api/notes/adopt-draft，幂等迁移既有草稿，并标记 adoptedRevisionId 隐藏右侧重复显示，原始消息仍保留。中央引用支持点击定位。
- 用户课程已完成18/18批、74/74证据，16595字符成稿迁为 revision c08009f1-e694-4ea8-9be7-d10c64b17759；两个笔记版本均保留，右侧未迁移草稿0。浏览器已确认中央正文正确。Node 65/65通过。

## 2026-10-20 T37 整理超时修复（Codex）
- 用户点击从资料整理遇到笼统连接/超时提示；实际 /v1/models 可达且模型 loaded。旧代码每批120秒截止，重试没有缓存；真实复测还发现输出截断。
- 改为前端后台请求+每2秒进度轮询；同步API保持兼容。每本锁防重复。完成批次按来源/提示词/模型/版本哈希缓存到 data/note-cache，失败/重启后重试复用。资料改变时拒绝保存旧草稿。
- 整理单批240秒，要求精炼要点；输出截断时递归拆批，仍保留完整输入覆盖。错误区分连接失败、超时、输出截断，不转云端。
- 验证：Node 63/63与语法检查通过。真实课程已完成2/18批、缓存落盘、浏览器显示进度，后台继续处理；尚未验收整课生成完成。新增测试验证模拟超时后跨重启复用以及截断拆批不丢原文。后续可读 /api/generate/status?notebookId=8caf38af-66f0-4154-b018-358391fd36b3，勿重启正在执行的服务。

## 2026-10-20 T36 最新实现与交接（Codex）
- 用户最新要求：课件/PPT正文 + 语音ASR + 字幕联合改进笔记；没有字幕时用本地视觉接口。保留JiJiDown本地导入。
- 全篇分批蒸馏/Skill生成已替代前缀截断；普通问答按中文重叠词检索+字幕邻段+结尾时间偏好，引用仍携带 sourceId/segmentId/offset。全篇覆盖不等于事实核验通过。
- 逐题伴学已接UI/API；开放式概念/参数/排错题，一次一题，评估与答题历史存 notebook.learningSession，复用回收站/备份，不是外部DeepTutor项目接入。
- scripts/visual_review.py：按ASR片段中点抽帧，分离上部画面正文与下部字幕OCR候选，文本变化去重保留参数变化，缺失字幕/低文字画面可用本地VLM（每次最多8帧，新实现均匀分配整课）。区域分类为启发式，不保证为PPT/字幕语义分割；模型描述为推断。
- 真实课程视频已导入，mediaId=4b1fd9f3-c998-4f65-9ee5-4db7bf90f7d9；原转写保留并关联视频。联合证据 sourceId=eaa57487-827d-4be1-b637-c50a9d312fc3；379抽样帧/365有画面正文/341有字幕候选/16有视觉补充/29无字幕及视觉补充；257是文字变化次数，不是PPT页数。视频路径见 data/visual-review 配置（用户原文件未改）。
- 报告与 raw-multimodal-document.json 在 data/visual-review/<mediaId>-c5fe385c-2981-4bfd-baee-fb57beda8ad9/。重跑复用缓存，联合资料分卷导入，保留原ASR。
- 修复真实发现：导学问题被当作事实首题→转写优先/提示词限制；短字幕元数据挤占上下文→合并连续片段；序列比对被ASR错写→尾部时间召回+OCR佐证；视觉回调404→支持visual类型并补测试；强制生成失败先删旧skill→生成成功前保留旧文件。
- Skill目录包：src/skill_builder 独立提示词与编译器，兼容原 .md 库，SKILL.md 指向完整生成稿/来源JSON/保存笔记。未把自动草稿当验证后的SOP。
- 验证：Node 61/61，Python8+4，quick_validate通过；真实LLM首题已生成，未代用户作答、未记虚假掌握度。原来的.gitignore/旧skill删除/cell-transfection.md改动未纳入。
- 后续：用户用真实PPT课再验收版面/公式识别；改进画面区域识别、跨批次全局去重、模型评分标定与多选题型。当前为离线导入视频处理，不是浏览器在线直播采集。

## 2026-10-20 T35 最新增量（Codex）
- 用户将 BV19W4y1X79X 课程学习作为开发验收，提供 DeepTutor 全链路目标规范；明确保留唧唧Down下载后本地视频导入。
- 已补 B站 UI/API/下载器枚举；视频 URL 管线改持久化上传/任务队列，消除 >32 MB 音轨静默跳过，输出经 Pydantic 校验的 raw-document.json（秒）；保留本地导入与 250 MB 上限。
- Python 8/8，Node 53/53，语法通过；真实已有转写 379 片段转换通过。当前服务已在空闲检查后单实例重启，页面已验证。未重新下载整段视频或重跑模型蒸馏；新 MP4 回归使用模拟转写，非新增 ASR 品质验证。
- 下一步：docs/DeepTutor迭代计划.md。全篇证据召回、视觉时间对齐和真实 DeepTutor 测评仍待实现；本轮仅定义其协议，不能宣称全链路重构完成。
- 原有 .gitignore 修改、删除旧 skill、新增 cell-transfection.md 保留，不纳入本次提交；未 push。

## Recovery Capsule（历史；当前状态见顶部）

- **Status**：v0.2.0 开发版；核心流程已实现，未完成完整产品验收。
- **Goal**：音视频 → 转写与校对 → 笔记 → AI 共读/语音提问 → 可移植实验 skill（由 Agent 管线产出，可被任何 agent 加载；「实验指导」问答 tab 已于 T25 彻底移除）。
- **Active task**：T16（A–G）已完成并 push（`e19c58a`）；T17 笔记 Markdown 阅读视图（渲染）已完成（纯前端，本地 commit，push 需用户另行授权）；T18 共读 LLM 视觉接入来源原图已完成（仅 `server.mjs`，本地 commit，push 需用户另行授权）；T19 小红书「酵母转化」采集→导入→共读笔记 + 双杂交/转化误标修复 已完成（2026-10-10，纯数据、无代码改动，无需 commit）；**T20 资料→skill 端到端 agent 切片 已完成（2026-10-10，本地 commit，push 需用户另行授权）**；**T21 打通前半段 goal→采集→导入→笔记→skill 端到端管线 已完成（2026-10-10，本地 commit，push 需用户另行授权）**；**T22 前端「实验 Agent」tab 已完成（2026-10-10，纯前端本地 commit，push 需用户另行授权）**；**T23 实验 Agent 层级修正（移出并列 tab→侧栏 dialog）+ 去除实验指导冗余「从当前笔记生成 skill」按钮 已完成（2026-10-10，纯前端本地 commit，push 需用户另行授权）**；**T24 多源 URL 入口（微信图文/抖音·小红书视频→导入→笔记→skill，含视频音轨转写+画面关键帧）已完成（2026-10-10，本地 commit，push 需用户另行授权）**；**T25 彻底删除「实验指导」功能 + 修复抖音笔记本乱码 已完成（2026-10-10，本地 commit，push 需用户另行授权）**；**T26 修复抖音重复源 + 知识总结产出模式（skill kind）+ 全局「Skill 库」面板（列表+资源管理器打开）已完成（2026-10-10，本地 commit，push 需用户另行授权）**；**T27 skill 分级 pre-queue→skill-queue 已完成（2026-10-10，本地 commit，push 需用户另行授权）**；**T28 实验操作 / 知识总结 skill 模板对齐专业 SKILL.md 规范（参考 GitHub 官方 + 高 star 源）已完成（2026-10-10，本地 commit，push 需用户另行授权）**；**T29 tools 层（把 下载→转写→共读笔记→skill 打包成可被 agent 调用的 LLM 函数调用工具，末端落共读笔记）已完成（2026-10-10，本地 commit，push 需用户另行授权）**；**T30 tools 层 agent 自动判断 skill 类型（移除 /api/agent/tools 与 /api/tools/loop 的 kind 入参，make_skill 转写后由 LLM 自动分类实验/知识再产对应 skill，取消「产出类型」调用方接口）已完成（2026-10-10，本地 commit，push 需用户另行授权）**；**T31 批量自动抓取微信公众号文章（真实浏览器搜狗关键词搜索）+ 细胞转染操作步骤 skill 已完成（2026-10-10，本地 commit 待确认，push 需用户另行授权）**：两轮搜狗关键词抓取去重 18 篇转染文章 → 整篇各为独立 source（18）入「细胞转染」notebook（`219a2ab3`）→ 生成转染操作步骤 skill `skills/cell-transfection.md`（电转作为其中一种方法，全参数待核对）；**T32 细胞转染共读笔记补齐 + 微信公众号图文抓取 tools 化（`fetch_wechat_articles` 工具 + `POST /api/agent/fetch-wechat` 端点）已完成（2026-10-10，本地 commit 待确认，push 需用户另行授权）**：补齐「细胞转染」notebook 共读笔记（1 版 revision）；新增 tools 层 `fetch_wechat_articles`（`spawn node <本地 tsx>` 跑 wechat-article-downloader 真实 Chrome 搜狗批量抓取 → 每篇整篇独立 source → 落共读笔记），agent 经 LLM 函数调用可自主抓取微信公众号图文；**T33 小红书图文抓取 tools 化（`fetch_xhs_notes` 工具 + `POST /api/agent/fetch-xhs` 端点）已完成（2026-10-11，本地 commit 待确认，push 需用户另行授权）**：把审计发现的唯一 tools 覆盖缺口「小红书图文」封装成 tools 层工具（默认复用 `~/Desktop/MediaCrawler/data/xhs` 已爬数据，`crawl:true` 才启动 MediaCrawler 需 9222 已登录 Edge；`import_xhs.py` 子进程 OCR+导入 → 建/找「小红书实验学习 · <query>」本 → 落共读笔记 revision），agent 经 LLM 函数调用可自主抓取小红书图文并 make_skill；**T34 P0 数据恢复能力（软删除回收站 + 全量备份导出/恢复）已完成（2026-10-11，本地 commit 待确认，push 需用户另行授权）**：schema 3 加 `db.trash`；`DELETE /api/notebooks/:id` 与 `DELETE /api/sources/:id` 改软删除（深拷快照进回收站、不 unlink 媒体）；新增 `GET /api/trash`、`POST /api/trash/:id/restore`、`POST /api/trash/:id/purge`（purge 才删媒体）、`POST /api/backup/restore`（覆盖式整库恢复）；前端侧栏「🗑 回收站」+「⇩ 备份 / 恢复」两 dialog（导出复用 `GET /api/state`）；待认领 open=T12 应用内 OCR / T13 长文上下文 / T14 交付验收 / T8b skill 铺开。**方向（2026-10-10）：把研习伴从"工具"升级为"agent"——T20 落地"资料→skill"（产出可移植 SKILL.md + gap 清单 + agentRun 报告）；T21 补齐前半段：`scripts/experiment_pipeline.py` 驱动 + `POST /api/agent/pipeline`（spawn 驱动，异步）+ `/result` 回写 + `/agent/runs` 过滤，使 agent 给一行关键词即可自动跑 采集[可选]→OCR→导入→建本→聚焦笔记→skill→gap→结构化报告（默认 reuse 不启浏览器，`crawl:true` 才启 MediaCrawler 需 9222 已登录 Edge）；T22 把这条管线接到 UI——工作区第 5 个「实验 Agent」tab（T23 后降为侧栏 dialog）；**T24 把信息源从"小红书关键词"扩到"任意 URL"**：`POST /api/agent/media {source: wechat|douyin|xhs-video, url}` 驱动 `scripts/url_pipeline.py`（wechat→`fetch_wechat.py` 纯标准库抓图文；douyin/xhs-video→`download_media.py` 用 yt-dlp+ffmpeg 下视频+抽 16kHz 音轨+抽关键帧）→ 音轨经 faster-whisper 转写 + 关键帧供视觉 LLM → 建本→导入→整理笔记→skill。抖音真实 URL 活体验收已完成（移动接口直连，见 Last verified state）；下一个自然切片=小红书视频真实 URL 活体验收（需小红书登录 cookies）/ crawl 活体验收（需用户 Edge/CDP）/ open=T13 长文上下文。**
- **Last verified state**：2026-10-10 三关键词各 8 篇，24 篇/131 张图片完整性验证通过，全部 OCR 与 API 导入（各笔记本 8 份）；真实界面可见，草稿和共读回答有来源引用。新增采集测试 3/3、导入测试 2/2；应用业务代码未变，18/18 回归结果沿用此前记录。8765 当前运行单实例。T16 已核验：前端 A–G 七项活体逐一通过（含 375px 窄屏脚注换行零溢出、空笔记本 CTA、skill 描述、历史只读往返），并修掉 `app.js` `loadRevision` 缺 `async` 的确定性语法错误；`node --check` 过、全程无 store 写入、单实例 8765。T17 已核验：笔记默认「阅读」态把 markdown 渲染成排版文本（标题/加粗/列表/引用，格式符号不再裸露），阅读↔编辑往返正确；阅读态与编辑态选中一段均触发右侧共读回显；保存仍读隐藏编辑框的值（阅读态也能保存）；控制台零报错、`node --check` 过、单实例 8765。T19 已核验：笔记本「小红书实验学习 · 酵母转化」8 条来源全保留；两版本 head 行核对——新版 `aec8d9be`=`## 酵母转化实验学习笔记`（正文=转化目的/LiAc-PEG 原理/分步参数/待核对+末尾"相关但不同技术"列双杂交·单杂交），旧版 `80e666b9`=`…酵母双杂交检测蛋白互作`（保留为只读历史）；`/api/chat` 自定义问题经词元排序使 evidence 偏向纯转化来源；单实例 8765 未双开。**T20 已核验**：单实例 8765 对「酵母转化」笔记本 `POST /api/agent/skill` → 201 `status:done`/`reused:false`，产出 `skills/yeast-liac-peg-transformation.md`（frontmatter + **12 步**纯转化 SKILL.md，非双杂交），`portable:true`/`format:"Agent Skills (SKILL.md)"`，**gapCount:4**（确定性提取待核对）；二次 run `reused:true` 同 path 无 `-2`；`GET /api/skills` 列出该 skill；`/api/skill-ask` 加载后问"加入质粒后下一步"→ 定位步骤 5 给 30℃ 孵育→42℃ 热激 + 安全；`GET /api/agent/runs?notebookId=` 列出两条 run（reused false→true）；`node --test tests/*.test.mjs` 24/24 无回归；单实例 8765 未双开。**T21 已核验**：`node --check` 过、`node --test tests/*.test.mjs` **32/32**（新增 pipeline 8 项：空/超长 goal 400、合法 goal→202 且驱动参数携带 `--goal/--api/--run-id`、`crawl/force` 透传 `--crawl/--force-skill`、`/result` done→run 翻 done+存 notebook+result、`/result` failed→记 error、未知 runId 404、`?kind`·`?id` 过滤）无回归；活体单实例 8765：`POST /api/agent/pipeline {"goal":"PCR 实验"}`（UTF-8 body）→ 202 → reuse 复用 8 篇（OCR 缓存命中 `skipped:8/failed:0`）→ 2642 字笔记 → 复用 skill `pcr-qpcr-colony-pcr`（5 步/8 gap）→ `status:done`、报告齐全；失败路径 `goal:"yeast transformation"`（无数据）→ run `status:failed` + `error` 如实。CJK 排障：早期 goal 变 `PCR ʵ验` 系 **Git Bash 把手敲 CJK 按 GBK 传 `curl -d`**（raw `ca b5 d1 e9`）所致，非代码缺陷；`curl -d @utf8.json` 后原样到达（`body()` 本就 UTF-8）。crawl 活体未做（需 9222 已登录 Edge，会撞风控/占用户环境），仅验证参数构造。**T22 已核验**：`node --check public/app.js` 过；`node --test --test-concurrency=1 tests/*.test.mjs` **32/32**（纯前端改动，零后端/接口/store 改动，无回归）。浏览器活体（单实例 8765，预览面板）：「实验 Agent」tab 正常渲染（goal 输入 + ☑重新采集默认关 + ▶开始跑）；`goal:"酵母转化"`（reuse，不启浏览器）提交 → 202 runId → 轮询 ~20s → `status:done`，报告渲染 `✓ 运行完成` + summary（采集[reuse]→导入 0 篇/跳过 8→整理笔记→生成 skill `yeast-liac-peg-transformation` 12 步 4 项待核对）+ 4 格 steps + 待核对清单 4 条（`【步骤 1 · Carrier DNA 预处理】参数：95℃…`/`【步骤 5 · 加入质粒】…`/`【步骤 11 · 涂板筛选】…`，`g.where` 前缀正确）；点「去实验指导问答 →」→ 切「实验指导」tab + `skillSelect` 自动选中 `yeast-liac-peg-transformation` + description 显示；控制台零报错。**活体发现并修 1 处确定性前端 bug**：gap 列表项误写 `node('li','',prefix)+g.text`（`element+string` 隐式 `String(element)` 把 `[object HTMLLIElement]` 拼到每条 gap 文本前）→ 改 `node('li','',prefix+g.text)`（`+g.text` 移入 `node()` 内），修后 gap 干净渲染。**T24 已核验**：`node --check server.mjs public/app.js` 过；`npm test` **37/37**（新增 5 项 media：非法 source 400 / 非法 url 400 / 合法 media run→202 + 驱动参数 `--source/--url/--api/--run-id` 正确 + run 落库(kind=pipeline, mode=url, source, running) / `--goal`+`--cookie-file` 透传 / `/result` 回调翻 done；既有 32 项无回归）。浏览器活体（单实例 8765，预览面板）：`#agentSource` 下拉切 keyword↔URL 字段显隐正确（**发现并修** `#agentGoal` 静态 `required` 阻断 URL 模式提交 → `syncAgentMode()` 动态切 required）；提交 → `POST /api/agent/media` 202 → run 创建 → 轮询；**完整微信图文管线活体跑通**（fetch_wechat 抓取→导入 424 字→建「微信实验学习 · …」本→整理笔记→生成 skill 诚实判「unidentified-experiment-pending-review」+ 9 项待核对 gap 不臆造→回调 run done），无失败请求。**抖音视频真实 URL 活体验收已完成**（2026-10-10）：用户真实分享链接 `v.douyin.com/AIQHoOS3qQw/` → 桌面 UA 解析短链得 `aweme_id=7694592823139503403` → `download_media.py` 改走**移动接口 `aweme/v1/aweme/detail` + CDN 直链**（绕过 yt-dlp 网页接口被 X-Bogus 反爬 403；导出 cookies 缺 `msToken` 致网页接口 "Fresh cookies needed"）→ 13.6MB/5:46 mp4 → faster-whisper 转写 2268 字 → 来源 2715 字 → 笔记 3227 字（rev 12）→ 生成可移植 skill `multi-ai-agent-concurrency-conflict-prevention`（6 步，`/api/skills` 已列、落盘），浏览器确认笔记渲染 + 共读指出转写歧义。小红书视频下载路径仍待活体（需小红书登录 cookies）。yt-dlp 现作为抖音/小红书回退路径保留于 `tools/.venv-dl`。**T31 已核验**（2026-10-10）：GitHub 找 `ar-gen-tin/wechat-article-downloader`（Chrome CDP + 搜狗 `type=2` 关键词搜索 + 微信图文→Markdown+本地图；本机无 Bun 用 `npx tsx scripts/main.ts` 跑）；两轮搜狗关键词 `"细胞电转染 实验步骤"`(10) + `"电穿孔 细胞转染"`(10) **无验证码过反爬** → 去重 **18 篇**不同转染文章落 `data/wechat-electroporation/`（根目录早期 7 + `a/`10 + `b/`10）；建「**细胞转染**」notebook（id `219a2ab3-65dd-4b22-862b-0c1e4199962e`）→ **18 篇整篇各为独立 source**（2 篇富文本 `<table>` 原始 HTML 342K/540K 字符经剥离 HTML 标签压到 1.1K–12K 字符）→ `POST /api/generate` → `POST /api/agent/skill {kind:'experiment',force:true}` → 生成转染操作步骤 skill `skills/cell-transfection.md`（`title: 细胞转染操作`、kind:experiment，**7 步**：选转染方式→评估细胞状态→备核酸/转染材料→形成复合物/导入体系→加细胞→恢复→检测表达/沉默，覆盖脂质体/磷酸钙/**电转**/病毒法，全参数待核对）；**关键发现**=`generateSkillForNotebook` 取导入顺序靠前的 ~2400 字 source 片段喂 LLM，troubleshooting 排最前会把 skill 带偏成「效率/活性优化」→ 改 protocol 优先排序（troubleshooting 降到 #9）产出干净 SOP；`.gitignore` 加 `tools/wechat-article-downloader/`（第三方代码不提交）；删 2 临时 notebook（`90ff9de8`/`c4e1d304`）+ 2 旧 skill + 临时脚本；单实例 8765 未双开。诚实边界：搜狗 type=2 单页仅 10 篇无翻页（15+ 需翻页未实现）、批量仍可能验证码（需时 `--wait`）、`killChrome` Windows 残留子进程（按 cmdline 匹配 `wechat-article-downloader` 清 TOOL Chrome）、第三方项目 archived。**T32 已核验**（2026-10-10）：`node --check server.mjs` 过、`npm test` **41/41**（tools 测试更新：`GET /api/tools` 列 6 工具含 `fetch_wechat_articles` / `POST /api/agent/fetch-wechat` 合法 query→202+kind=tools run+驱动 `--source wechat --query --max` 正确 / 缺 query 400 不 spawn）；`GET /api/tools` 实列 6 工具；单实例 8765 + 18081 `local-qwen38-gsq`：`POST /api/agent/fetch-wechat {query,max}` → 202 → 驱动 → LLM 自主调 `fetch_wechat_articles`（真实 Chrome 搜狗抓取 2 篇）→ `make_skill`（自动判 knowledge）→ 落「微信公众号 · …」notebook（每篇整篇独立 source + 1 共读笔记 revision）+ skill → run **done**（toolLog 两步 ok、CJK 标题/来源/正文正确）；spawn 方式=`spawn(process.execPath,[node_modules/tsx/dist/cli.mjs,…],{cwd:toolDir,shell:false})`（args 数组 CJK 活体确认落 CJK .md、带空格 outDir 无 ENOENT、无 DEP0190）。**T33 已核验**（2026-10-11）：`node --check server.mjs` 过、python `ast` 过 `tools_pipeline.py`、`npm test` **44/44**（tools 测试更新：`GET /api/tools` 列 **7 工具**含 `fetch_xhs_notes` / `POST /api/agent/fetch-xhs` 合法 query→202+kind=tools run+驱动 `--source xhs-image --query <q>`（带空格仍单个 argv 元素）且无 `--crawl/--limit` / `crawl:true`+`limit:5`→argv 含 `--crawl`+`--limit 5` / 缺·空 query 400 不 spawn）无回归。`GET /api/tools` 实列 7 工具。**活体单实例 8765 + 18081 `local-qwen38-gsq`**：`POST /api/agent/fetch-xhs {query:'酵母转化',crawl:false,limit:2}` → 202 → 驱动 → LLM 自主调 `fetch_xhs_notes`（复用本地已抓数据，`imported:0/skipped:2` 幂等未重复导入）→ `make_skill`（自动判 knowledge）→ 落「小红书实验学习 · 酵母转化」notebook（共读笔记 1 版 revision）+ skill `yeast-two-hybrid-protein-interaction.md` → run **done**（toolLog 两步 ok）。**活体发现并修 1 处后端逻辑缺陷**：初版成功判定误用 `imported===0` 判失败，致幂等复跑误报 504 → 改判 `failed===0 && (imported+skipped)>0`（重复运行 imported=0/skipped=N 属成功）。清理：9 个 `data/_*.txt` 探测文件 + `data/media-inbox/tools-xhs-image.report.json` + 测试 skill `skills/yeast-two-hybrid-protein-interaction.md` 已删，并按 id 从 `store.json` 移除本次活体产生的 1 条 revision（`5432f1de`），「小红书实验学习 · 酵母转化」回到 7 版基线；单实例 8765 未双开。**T34 已核验**（2026-10-11）：`node --check server.mjs public/app.js` 过；`npm test` **51/51**（重写 `tests/delete.test.mjs` 断言软删除语义：删来源清 proofread chain 但**保留媒体文件**并进回收站 / 删笔记本清各 live 数组但保留媒体并进 notebook 条目（含 sources+revisions）；新增 `tests/trash.test.mjs` 7 项：来源 restore 回灌 chain+清空回收站 / purge 删媒体+清空 / 笔记本 restore 全量回来 / 备份 restore 回灌 store 快照 / restore·purge 未知 id→404 / 所属笔记本已不在的来源 restore→409 / 备份 restore 非法 payload→400）。活体单实例 8765：软删来源→进回收站+媒体仍在→restore 回来；软删笔记本→trash kind:notebook（sources 数正确）→restore 回来；备份 dump→改 store→restore→state 与 dump 一致；store 清理回基线（7 笔记本、0 trash、schema 3）。浏览器活体（预览面板）：侧栏「🗑 回收站」+「⇩ 备份/恢复」按钮渲染、回收站 dialog 空态文案正确/卡片含恢复·彻底删除按钮且 confirm 文案正确、备份 dialog 含导出·选择恢复+file input。
- **Code baseline**：本轮基于 main/f5c71fd（独立 OCR worker）；新增 scripts/import_xhs.py、测试与操作文档。接手重新读 Git HEAD。
- **Current blocker**：采集导入链路无阻塞；应用内一键 OCR 尚未接入，共读长文预算限制仍需 T13 处理。关键词检索结果未逐篇验证实验适用性。
- **Next safe action**：agent 方向已按"先做一条端到端切片"原则落地 T20（资料→skill 后半段）+ T21（前半段 goal→…→skill 管线）+ T22（前端「实验 Agent」tab 一键触发 + 报告 + 跳实验指导），前后两段 + UI 入口已串成"一行关键词→…→可移植 skill→问答指导"的完整闭环；**T24 再把信息源从"小红书关键词"扩到"任意 URL"**（微信图文/抖音·小红书视频，视频取音轨转写 + 画面关键帧）。下一切片候选（按价值/依赖排）：①小红书视频**真实 URL 活体验收**（需小红书登录 cookies.txt；抖音已于 2026-10-10 活体验收，`download_media.py` 走移动接口直连绕过 X-Bogus）；②crawl 活体验收（需用户 9222 已登录小红书的 Edge/CDP，会撞风控/占用户环境，另行安排）；③open=T13 长文上下文（也限制 T19 笔记与 T20/T21/T22/T24 skill 的材料预算）/ T12 应用内 OCR 可并行。复用运行中的服务（8765 单实例），避免双开共享 store。T16 已 push；T17/T18/T20/T21/T22/T23/T24 已本地 commit，push 需用户另行授权（10+ 本地 commit 未 push）。**T33 后**：tools 层现覆盖 微信公众号图文（T32 `fetch_wechat_articles`）+ 小红书图文（T33 `fetch_xhs_notes`）两类批量图文抓取，小红书图文缺口已补齐；下一切片候选不变（小红书视频真实 URL 活体验收需登录 cookies / crawl 活体验收需 9222 已登录 Edge / open T13 长文上下文）。**T34 后**：成熟度路线 P0 第①项「数据恢复能力」（软删除回收站 + 全量备份导出/恢复）已落地，产品「误删不可逆」安全底线缺口已补齐；T16/T17/T18/T20–T34 均已本地 commit 未 push（push 需用户授权）。
**P0 完整验收（T14 核心，2026-10-11）**：已产出**第一版验收报告 `docs/验收报告.md`**（映射 A01–A15 + M0–M5：A01/A02/A03/A04/A05/A07/**A08**/A12/A13 已验证（A13 备份恢复由 T34 补齐；**A08 本轮实测**＝对真实小红书本「酵母转化」8 篇 OCR 来源建一次性验收本→设计 20 问覆盖指代/连续追问/材料缺失/来源冲突/常规参数（原音频定位对本批文本图文 N/A，如实标注）→跑 `/api/chat`→人工逐条复核，**相关且被所引材料支持 17/20、关键参数零编造**，4 问(Q4/Q8/Q9/Q19)受 T13 证据预算(~1800 字符)召回受限而答「材料未说明」并拒绝编造））、A09/A10 历史活体本轮未重测、A11 设计保证、A14 部分(TTS edge-tts 云端)、**A06 回放 10 片段未做**、A15 宿主回归因暂无科研工作台宿主先跳过）。P0 剩余 = **A06 回放 + A15 宿主**（A08 已实测；唯一残项＝T13 提升证据预算后重测冲 ≥18/20，现 17/20 差 1）；OCR 数字/单位逐篇核对原图也未纳入本轮。P1（T13 长文上下文 / T12 应用内 OCR）仍 open。**A08 验收后经 T34 软删+purge 清除测试本，store 回基线（7 本/0 trash），无磁盘残留。**
- **Files involved**：server.mjs、public/*、transcription.mjs、asr_worker.py、tts.mjs、tts_worker.py、scripts/experiment_pipeline.py、scripts/url_pipeline.py、scripts/download_media.py、scripts/fetch_wechat.py、scripts/import_xhs.py、scripts/tools_pipeline.py、skills/*、tests/*；T29/T30 tools 层另涉 `scripts/tools_pipeline.py`；T31 另涉 `tools/wechat-article-downloader/`（GitHub 第三方，gitignored，含本地装 tsx 的 node_modules）、`data/wechat-electroporation/`（抓取产物，gitignored）、`skills/cell-transfection.md`（新交付物）；T32 另涉 `data/wechat-fetch/`（fetch_wechat_articles 抓取产物，gitignored 数据）、tests/tools.test.mjs（fetch_wechat 测试）；T33 另涉 `scripts/import_xhs.py`（小红书图文 OCR+导入，复用不重写）、`~/Desktop/MediaCrawler`（爬虫数据/`.venv-mc`）、`tools_pipeline.py` 的 `--source xhs-image` 分支；T34 另涉 server.mjs 的 schema 3 迁移块/两 DELETE 软删除/`GET /api/trash`·`/api/trash/:id/restore`·`/api/trash/:id/purge`·`/api/backup/restore`、public/index.html·app.js·style.css 的回收站+备份 dialog、tests/delete.test.mjs（改写）、tests/trash.test.mjs（新增）。

## 已实现及证据等级

| 范围 | 当前代码能力 | 验证依据 |
|---|---|---|
| M0 模型基础 | 内置 faster-whisper-small CPU int8 + OpenCC；本地 LLM；edge-tts 朗读 | 历史真实模型联调已记录；本轮只核对代码、配置和模型文件 |
| M1 资料与来源 | 250 MB 流式上传、哈希去重、转写队列、取消/重试、校对版本、时间戳及媒体 Range | 本轮相关自动测试通过；历史约 72 秒合成语音/视频验证，不能外推为一小时性能保证 |
| M2 笔记共读 | 笔记版本、草稿、选区问答、短历史、引用标识校验 | 自动测试及历史联调；笔记块证据映射、全文检索未完成 |
| M3 语音 | 设备选择、录音/文件提问、取消、权限提示、中文朗读和 Markdown 清洗 | 历史浏览器与模型验证；本轮未重新使用麦克风或云端服务 |
| M4 学习与交付 | 疑问状态、Markdown 导出、回收站（软删/恢复/彻底删除）、整库 JSON 备份导出+覆盖式恢复 | 完整 20 问已实测（A08，17/20 完全支持+零编造）；缺复述练习及工作台集成（备份恢复/回收站 UI 已于 T34 补齐） |
| 扩展实验 skill | skills/*.md、列表、生成、问答、同名保护、朗读 | 7 个相关单测及历史联调；不是已完成自动路由或 checklist |
| OCR | 已提交独立 worker + scripts/import_xhs.py 命令行 OCR/导入 | 24 篇真实图文已识别导入；尚无应用内图片/PDF 上传 OCR 路由 |

## 当前架构、配置与约束

- 唯一开发目录：`C:\Users\a1440\Desktop\Study companion`。此前工作区 `output/研习伴/dev-stage` 是旧暂存，禁止用它覆盖本目录。
- Node 原生 HTTP 服务；零 npm 运行时依赖；元数据 JSON，媒体文件存磁盘，schema 3（含 `db.trash` 回收站）。
- 配置核对：LLM `http://127.0.0.1:18081/v1` / `local-qwen38-gsq`；ASR `builtin`；TTS 音色 `zh-CN-liaoning-XiaobeiNeural`。这不是服务在线证明。
- ASR 每次识别 `spawn` 独立 Python worker，并重新加载模型。历史“常驻 worker”表述有误，以当前代码为准。
- TTS 当前使用 edge-tts 云端服务与 ffmpeg；需联网且发送朗读文本。旧 Kokoro 实现已被替换，不能称当前 TTS 完全本地或描述为本地模型冷加载。
- 当前共读来源预算 1800 字符、笔记前 800 字符、选区 500 字符、历史最近 2 条每条 300 字符，输出 max_tokens=4000。18081 模型上下文更大，不代表代码会自动使用完整笔记。
- 共读 `/api/chat` 额外把 top 来源**原图**（最多 4 张，OpenAI 视觉 base64 `image_url`）随材料发给 18081 VLM；仅 XHS 导入来源（`content` 含 `图片目录：` 行）贡献图，纯文本来源回退纯文本；`/api/generate`·`/api/skill-ask` 不送图。依赖本地 VLM 理解图像（已活体核验，能发现 OCR 与原图的单位差异）。
- 转写重启后标 interrupted，重试从头开始；无断点续传。
- 删除为**软删除**（T34，2026-10-11）：删除笔记本/来源 → 进回收站 `db.trash`（快照存 `data/`），可「恢复」或「彻底删除」（purge 才 `unlink` 媒体文件）；另有整库 JSON **备份导出**（复用 `GET /api/state`）与**覆盖式恢复**（`POST /api/backup/restore`）。UI：侧栏「🗑 回收站」+「⇩ 备份 / 恢复」两个 dialog。
- 实验 skill 由材料整理生成，不自动等于已确认规程。历史记录混用“酵母转化”和“DH5α”名称，真实材料来源与对象须重新核对，不能据此认定实验正确性。

## 工作树与协作边界

核对开始时未提交文件：`ocr_worker.py`、`tests/make_ocr_test_image.py`、`tests/fixtures/ocr-test/`。保持原样，不代另一 agent 提交。

本轮仅修改 README、CONTEXT、TASKS、COLLAB、开发进度日志并新增 AGENTS.md 接手入口；不改业务代码、数据库、模型配置或实验 skill，不 push。

同机共享工作树不需要把对方代码重新合并进来。通过任务 owner、文件范围和短 checkpoint 避免覆盖；修改前比较文件指纹，发现变化重新读。不得长期双开同一 data 目录的服务。

**敏感文件**：`cookies.txt`（抖音登录态，含真实登录 cookie）已加入 `.gitignore`（`cookies*.txt`），**绝不提交或外传**；提交前用 `git check-ignore cookies.txt` 复核。

## 下次验证

1. `git status --short`、`git log -5 --oneline`，读取最新任务认领情况。
2. 需要真实功能验收时检查 8765、18081 服务，而不是只看配置。
3. `npm.cmd test` 和 `npm.cmd run check`；ASR 变化另跑 `tests/opencc_check.py`。
4. 真实录音、语义引用与 10 段时间定位仍需独立验收；模拟测试通过不能代替。

历史决策和更早验证保留于 `docs/开发进度.md`；任务列表以 `TASKS.md` 为准。

## 2026-10-10 T15 小红书真实链路验收

- 采集仓库：C:\Users\a1440\Desktop\MediaCrawler；独立 Edge 档案扫码，goto 已改 domcontentloaded/90s。没有改 base_config.py 里的既有用户配置。
- 关键词：大肠杆菌转化、菌种活化、PCR 实验；各 8 篇图文，共 131 张图片。JSONL、图片、Markdown、验收 JSON 均留在该仓库 data/xhs 下，不纳入 Git。
- 研习伴按关键词创建三个笔记本；仅通过 /api/sources 导入，现有用户笔记未覆盖。草稿和问答验收留在“大肠杆菌转化”的共读对话中，未自动写入正式笔记。
- 操作说明：docs/小红书图文导入.md；导入支持 OCR 缓存与来源标记去重，重复运行已验证。
- 质量边界：OCR 数字/单位需要核对原图；仅关键词检索，未筛选所有帖子的科学可靠性；共读出现 truncated 提示，只用了部分资料。

## 2026-10-10 T16 前端 UI 一致性优化（A–G）

- 起因：用户先让 UI Finish-Gate Reviewer 过一遍研习伴现有前端，出「哪里能更清晰/一致」清单，再「开始优化」。复审结论 HOLD + 7 项必修（A–G）。
- 落地范围：仅 `public/index.html`、`public/app.js`、`public/style.css`，纯前端零新依赖，后端/接口/store 零改动。
  - A 语言统一中文；B 状态标签语义互斥（四态实时切换）；C 计数徽标 0 值隐藏 + tab ARIA；D 实验 skill 下拉下方显示 description；E 选择上下文就近反馈（编辑器脚注回显 + 窄屏 flex-wrap）；F 历史版本只读态（is-historical + readOnly + 继续编辑往返）；G 空笔记本首屏 CTA（无笔记本时隐藏编辑器并显示创建入口）。
- 附带修复：`app.js` `loadRevision` 用 `await` 却非 `async`（语法错误，整个前端脚本会解析失败）→ 改 `async`。
- 验证：`node --check` 通过；浏览器活体逐一核验 A–G 各态（含 375px 窄屏脚注换行零溢出、空笔记本 CTA 内存态、skill 描述、历史只读往返），全程无 store 写入；单实例 8765（验证前停掉旧进程、由预览面板起单实例，避免双开共享 store）。
- 提交：本地 commit `e19c58a`（三前端文件），未 push；`.claude/launch.json` 临时预览改动已还原未纳入。
- 边界：E 的「就近反馈」只是编辑器脚注的选中段摘要回显，未改动右侧共读选区逻辑；G 的 CTA 复用既有 `#newBookDialog`，未新增建本逻辑。

## 2026-10-10 T17 笔记 Markdown 阅读视图（渲染）

- 起因：用户反馈共读笔记是 `<textarea>` 原始 markdown，`#`/`**`/`>`/`-` 等格式符号全部裸露、不可读；希望把 markdown「识别」成排版文本。
- 方案：笔记面板加「阅读 / 编辑」切换（默认**阅读**）。
  - 阅读：把 markdown 渲染进 `#noteRender`（零依赖手写 `renderMarkdown()`：标题 h1–h6 / `**` 加粗 / `*` 斜体 / `` ` `` 行内代码 / `-`·`*`·`+` 无序列表 / 数字有序列表 / `>` 引用块 / `---` 分隔线；先 HTML 转义再行内标记替换，无注入风险）。`[S#]` 来源引用渲染为**右上角上标徽章**（`<sup class="cite">`，小绿字）。整体采用 **Typora 主题风格**（衬线/系统字、15.5px/1.9、居中 760px 最大宽度、h1 下边框、引用块斜体浅底）。此时隐藏 textarea。
  - 编辑：回到原 textarea 原样编辑，现有 `onselect` 选中→共读链路不变。
- 落地范围：仅 `public/index.html`、`public/app.js`、`public/style.css`；纯前端零新依赖，后端/接口/store/共读链路零改动。
- 验证：`node --check` 过；浏览器活体——阅读/编辑两态显隐往返正确（阅读态渲染可见·编辑框隐藏，编辑态相反），阅读态渲染出 1 个 h1、9 个 h2、20 个 ul、1 个 blockquote、51 个 strong，无残留原始符号；阅读态选中一段→右侧「正在讨论」回显，编辑态选中→回显原 markdown；保存读隐藏编辑框值（阅读态可保存）；控制台零报错；单实例 8765。
- 边界：渲染为轻量子集（不支持表格/链接/嵌套列表/图片等）；`[S#]` 来源引用只匹配 `S`+数字 转上标徽章，避免误伤真实 `[链接](url)`。
- 后续（同一 T17，2026-10-10）：应用户要求把 `[S#]` 改成右上角上标引用 + 笔记整体采用 Typora 主题风格（见上方案）；活体核验 78 个上标引用、无残留 `[S#]`、h1 下边框/居中/引用块斜体、阅读态选中回显正常、控制台零报错。
- 后续2（同一 T17，2026-10-10）：
  - 修首屏竞态：`loadSkills()` 与 `refresh()` 并行，`loadSkills` 先完成并选中首个 skill 时 `state` 尚未赋值，`renderSkillMessages()` 读 `state.messages` 抛 "Cannot read properties of undefined (reading 'messages')"。`renderMessages`/`renderSkillMessages` 改 `(state?.messages||[])` 空值保护（纯前端，不碰后端/store）。多次刷新活体确认不再抛错。
  - 布局收紧：右栏（共读）固定窄栏（基础网格 `minmax(330px,400px)`、≤1100px `minmax(300px,380px)`）；笔记阅读/编辑**填满左栏靠左**（初版曾限宽 720px 居中，用户反馈"太窄"→已去掉限宽居中，改为占满左栏）。
- 后续3（同一 T17，2026-10-10）：用户反馈"相同级别标题缩进错误 + 资料来源应有网站超链接"。
  - **修标题缩进 bug**：`renderMarkdown()` 的 `endList()` 误写为 `out.push('<'+listType+'></'+listType+'>')`（推一整对空 `<ul></ul>`），而列表开标签 `<ul>` 另在列表项分支单独 push，导致列表永不闭合、浏览器 HTML 解析器把后续所有 `h2`（二～九）重新嵌套进未闭合的 `<ul>` 内并继承其 `padding-left:22px` → 同级标题错位缩进。改为 `out.push('</'+listType+'>')`（只推闭标签）。活体核验：9 个 `h2` 全部 `pl=0/ml=0`、`parent=DIV.note-render`，`nestedUl=0`。
  - **资料来源超链接**：笔记「资料来源」行形如 `- S# 标题（<24位hex小红书笔记id>）`。`renderMarkdown()` 新增 `xhsItem()` 识别该模式 → 列表项渲染为 `<a href="https://www.xiaohongshu.com/explore/<id>" target="_blank" rel="noopener">S# · 标题</a>`（标签走 `esc()`，id 为纯 hex，无注入）。三个 XHS 笔记本各 8 条全部命中；正文普通列表项不误伤。
  - 验证：`node --check` 过；浏览器活体——资料来源 8 条均为蓝色下划线超链接（href 正确）、正文有序/无序列表零嵌套、9 标题零缩进、控制台零报错；`npm test` 18/18。
- 后续4（同一 T17，2026-10-10）：用户要求「整体改成 #3a83f7 蓝色系风格」+「引用位置偏移严重」。
  - **蓝色主题**：`style.css` 中 50+ 绿/青绿 hex 全部映射为 #3a83f7 蓝色系（`--green` 变量保留名但值改 `#3a83f7`，`--border`/`--muted` 同步转蓝灰）；**保留** `#fff`、红色 `.danger`（`#a54838`/`#fae2dc`/`#e3b3aa`）、暖色只读态 `is-historical`（`#f3efe6`/`#6b6657`）。新增 `.note-render a{color:#3a83f7;...}`（资料来源等链接由浏览器默认蓝 #0000ee 改为主题蓝）。
  - **引用上标定位**：`.note-render sup.cite` 由 `vertical-align:super;line-height:0`（上标浮得过高、行盒塌缩错位）改为 `vertical-align:0.5em;line-height:1`（+字号 9→10px、左边距 2px），上标紧贴正文、不再悬浮偏移。
  - 验证：脚本精确替换 67 个 hex，核验无残留绿系 hex、`#3a83f7` 就位、红/暖/白保留；活体——logo/保存按钮/激活 tab/导航高亮/引用块/资料来源链接均为 `rgb(58,131,247)`、引用上标 `va=5px/lh=10px`、控制台零报错。
- 提交：本地 commit（三前端文件），**未 push**（push 需用户授权）。

## 2026-10-10 T18 共读 LLM 视觉接入来源原图 + 学习资料 UI 展示原图

- 起因：用户反馈来源图片没被利用、不利于大模型准确理解内容；并确认本地 18081 Qwen（`local-qwen38-gsq`）具备图片识别能力。原 `/api/chat` 仅发 OCR 纯文本；后续用户又问「8 个来源的学习资料为何不显示图片」→ 补 UI 展示。
- 方案/落地（后端·LLM 视觉）：`server.mjs` 把本轮 top 来源原图（解析各来源 `content` 头部 `图片目录：<绝对路径>`，目录在 app 外 `MediaCrawler/data/xhs/media`）以 OpenAI 视觉 base64 随材料发给 `/api/chat`；去重、上限 `MAX_CHAT_IMAGES=4`；reply 加 `images` 计数（store 向后兼容）。仅 chat 送图。
- 方案/落地（后端·展示 API + 前端）：新增 `GET /api/sources/:id/images`（`[{name,url}]`）与 `GET /api/sources/:id/image?file=`（按 mime 流式出图，basename 白名单 + 目录越界防护，`../`→400）。`app.js` `showSource()` 详情对话框顶部渲染 `来源原图 · N 张` 缩略图条（点图新标签开原图），来源卡片加 `📷 N 张原图 · 点击查看`；`style.css` 加 `.source-images`/`.source-card-imgs`。零 schema、零新依赖。
- 验证：`node --check` 过；新增 `tests/source-images.test.mjs` → `npm test` 19/19；活体（LLM 视觉）——「大肠杆菌转化」问流程图离心步骤 → `images:4`，LLM 读图给出 3000g/4°C/10min×2 + CaCl₂ + -80°C，**主动发现 OCR `3000 r/min` 与原图 `3000 g` 单位不一致**（OCR 单靠文本无法发现）；活体（UI 展示）——8 张来源卡片全部显示 `📷 N 张原图`（5/3/6/2/9/4/6/5），详情对话框渲染 5 张缩略图全部加载、截图确认流程图原图可见、控制台零报错。
- 边界：图序↔来源序为近似映射（prompt 已声明）；仅 top 来源前 4 张送 LLM（UI 显示该来源全部图）；目录缺失/删除静默跳过；依赖本地 VLM 真理解图像（已活体核验）。图片经服务端从 app 外目录读取，已做 basename 白名单 + 越界防护。
- 提交：本地 commit（`server.mjs`、`public/app.js`、`public/style.css`、`tests/source-images.test.mjs`），**未 push**（push 需用户授权）。

## 2026-10-10 T21 打通前半段：goal→采集→导入→笔记→skill 端到端管线

- 起因：承接 T20，把"资料→skill"往前补齐成"一行关键词→可移植 skill"。用户方向：整理可靠实验来学 + 做实验时通过**任何 agent** 调用指导。
- 驱动 `scripts/experiment_pipeline.py`（纯标准库）：`--goal` 必填；默认 **reuse**（复用 `MediaCrawler/data/xhs` 已有该关键词图文，不启浏览器），`--crawl` 才启 MediaCrawler（需 9222 已登录 Edge）；复用 `import_xhs.py` 子进程做 OCR/导入/建本；定位笔记本（`小红书实验学习 · <goal>`）→ `/api/generate` 整理聚焦笔记 → `/api/notes` 持久化 → `/api/agent/skill`（T20）；JSON-lines 进度 + 报告 `data/pipeline/<slug>.report.json` + 可选 `--run-id` 回写。
- 后端 `server.mjs`：`POST /api/agent/pipeline`（校验 goal 非空/≤80 → 建 `agentRuns` run(kind=pipeline,running) → `spawn` 驱动 detached → 202）；`POST /api/agent/pipeline/:runId/result`（驱动回写报告→run done/failed + notebook/error/completedAt）；`GET /api/agent/runs` 支持 `?id`/`?notebookId`/`?kind` 过滤；`createApp` 加 `pipelineLauncher=spawn` 注入缝（测试 fake）。
- 验证：`node --check` 过；`npm test` **32/32**（新增 pipeline 8 项）。活体单实例 8765：`{"goal":"PCR 实验"}`（UTF-8）→ 202 → reuse 8 篇（OCR 缓存命中 `skipped:8/failed:0`）→ 2642 字笔记 → 复用 skill `pcr-qpcr-colony-pcr`（5 步/8 gap）→ `done`，报告齐全；失败路径 `{"goal":"yeast transformation"}`（无数据）→ `failed` + `error` 如实。
- CJK 排障：早期 goal 变 `PCR ʵ验`（`实`→`ʵ` U+02B5）= **Git Bash 把手敲 CJK 按 GBK 传 `curl -d`**（raw `ca b5 d1 e9`）非代码缺陷；`curl -d @utf8.json`（`实`=`e5 ae 9e`）后原样到达；`body()` 本就 UTF-8。
- 边界：crawl 活体未做（需用户 Edge/CDP，会撞风控/占用户环境），仅验证参数构造；skill≠已确认规程；受 1800 字符共读预算限制（open T13）。
- 提交：本地 commit（`scripts/experiment_pipeline.py`、`server.mjs`、`tests/agent-pipeline.test.mjs`、`skills/pcr-qpcr-colony-pcr.md`），**未 push**（push 需用户授权）。

## 2026-10-10 T22 前端「实验 Agent」tab

- 起因：承接 T21（前半段管线已有后端 + 驱动，但只能直接调 API）。用户「可以」批准加前端 agent 触发入口；用户选**独立「实验 Agent」tab**（工作区第 5 个 tab）。目标：关键词输入 → 一键启动 T21 管线 → 轮询进度 → 渲染报告 → 「去实验指导问答」跳「实验指导」tab 自动选中新 skill。
- 落地（纯前端，零后端/接口/store 改动、零新依赖）：
  - `public/index.html`：tablist 加第 5 个 `data-tab="agentRun"` 按钮；`#agentRun` panel（`#agentForm`：`#agentGoal` 必填 `maxlength=80` + `#agentCrawl` checkbox 默认关=复用已有采集 + `#agentState`/`#agentLog`/`#agentReport`）。
  - `public/app.js`：`startAgentPipeline()`（校验 goal→`POST /api/agent/pipeline {goal,crawl}`→`pollAgentRun()`）；`pollAgentRun()` 每 4s `GET /api/agent/runs?id=` 直到 done/failed（~2h 上限）；`renderAgentReport(run)` 渲染 ✓/✕ + summary + 4 格 steps + 待核对清单（`g.where`→`【步骤 N · …】`）+「去实验指导问答 →」按钮（点 skillGuide tab→`loadSkills()`→设 `skillSelect.value`→`renderSkillMessages()`）。复用 `api`/`run`/`node`/`button`/`loadSkills`/`renderSkillMessages`。
  - `public/style.css`：`.agent-form`/`.agent-check`/`.agent-actions`/`.agent-log`（`:not(:empty)` 才显示）/`.agent-report`/`.agent-report-title.ok/.fail`/`.agent-summary`/`.agent-error`/`.agent-steps`/`.agent-step`/`.agent-gaps-title`/`.agent-gaps li` + 新增 `button.primary`。
- 活体发现并修 1 处确定性 bug：gap 列表项误写 `node('li','',prefix)+g.text`——`element+string` 触发隐式 `String(element)`，每条 gap 前拼上字面 `[object HTMLLIElement]`（浏览器活体首跑即暴露）；改 `node('li','',prefix+g.text)`（`+g.text` 移入 `node()` 内）后干净渲染。
- 验证：`node --check public/app.js` 过；`node --test --test-concurrency=1 tests/*.test.mjs` **32/32**（零后端改动，无回归）。浏览器活体（单实例 8765）：tab 渲染 → `goal:"酵母转化"`(reuse) → ~20s `done`，报告齐全（summary + steps + 待核对清单 4 条 `【步骤 N · …】` 前缀正确）→「去实验指导问答 →」切 tab + 自动选中 `yeast-liac-peg-transformation` + description 显示 → 控制台零报错。
- 边界：`crawl:true` 需用户 9222 已登录 Edge（默认关=复用，不替用户启浏览器）；gap 为 T20 确定性关键词提取；笔记/skill 受 1800 字符共读预算限制（open T13）；轮询上限 ~2h。
- 提交：本地 commit（`public/index.html`、`public/app.js`、`public/style.css`），**未 push**（push 需用户授权）。

## 2026-10-10 T23 实验 Agent 层级修正 + 去除实验指导冗余生成按钮

- 起因：用户反馈「实验agent 不应该和另外三个并列，**层级错误**」——T22 把实验 Agent 做成工作区第 5 个并列 tab，但它实为**跨笔记本编排入口**（给关键词自动建本+导入+skill），不应与某笔记本内的四个视图 tab 同级；另「实验agent 就能完成 skill 的闭环，实验指导中的『从当前笔记生成 skill』**冗余了**」——T20 生成按钮与 Agent 管线末端 skill 产出重复。
- 落地（纯前端，零后端/接口/store 改动、零新依赖）：
  - `public/index.html`：① 删第 5 个 `data-tab="agentRun"` tab（恢复 4 tab：共读/学习资料/疑问清单/实验指导）；② 侧栏 `nav-label` 后加 `<button id="agentOpen" class="agent-open">⚙ 实验 Agent · 一键整理</button>`；③ 原 `#agentRun` panel 改在 dialog 区为 `<dialog id="agentDialog">`（内含原 `#agentForm`：goal/crawl + `#agentStart`/`#agentState`/`#agentLog`/`#agentReport`），与设置/新建本等 dialog 同级；④ `#skillGuide` panel 删 `#genSkill` 按钮（保留 skill 下拉 + 问答）。
  - `public/app.js`：删 `$('genSkill').onclick` 整块；新增 `$('agentOpen').onclick`（清 log/报告/状态 → `showModal()`）与 `$('closeAgent').onclick`（`close()`）；「去实验指导问答 →」handler 开头加 `$('agentDialog').close()`（先关 dialog 再切 tab，避免遮罩盖住切出的「实验指导」）。管线/轮询/报告逻辑不变。
  - `public/style.css`：新增 `.agent-open`（侧栏满宽触发按钮）。
- 验证：`node --check public/app.js` 过；`node --test --test-concurrency=1 tests/*.test.mjs` **32/32**（纯前端改动，零回归）；`grep genSkill` app.js/index.html 零残留。浏览器活体（单实例 8765）：① 恢复 4 tab（无 agent tab）；② 侧栏「⚙ 实验 Agent · 一键整理」存在；③ 「实验指导」无「从当前笔记生成 skill」按钮；④ 点侧栏按钮 → dialog 打开；⑤ `goal:"酵母转化"`(reuse) → ~20s `done`，报告在**打开的 dialog 内**渲染（✓ + steps + 待核对 4 条无 `[object]`）；⑥ 点「去实验指导问答 →」→ **dialog 关闭** + 切「实验指导」tab（`activeTab:skillGuide`）+ `skillSelect` 自动选中 `yeast-liac-peg-transformation`；⑦ 控制台零报错。
- 边界：`POST /api/skills/generate` 后端端点**保留**（仅移除前端按钮），仍可经 API/管线用；实验 Agent 现=跨笔记本编排入口（产出落 `小红书实验学习 · <goal>` 本）；「实验指导」tab 职责更单一=选 skill + 问答指导。
- 提交：本地 commit（`public/index.html`、`public/app.js`、`public/style.css`、`TASKS.md`、`CONTEXT.md`），**未 push**（push 需用户授权）。

## 2026-10-10 T24 多源 URL 入口（微信图文 / 抖音·小红书视频 → 笔记 → skill）

- 起因：用户「现在的信息源只有小红书，微信公众号图文、抖音视频和小红书视频也有很多优质内容，在 github 上找能摘抄公众号图文、提取抖音/小红书视频**音频**信息的工具，方便让大模型总结；如果能理解视频**画面**并对音频做补充更好」。要点：扩信息源到 微信图文/抖音视频/小红书视频；用成熟开源工具（yt-dlp / 纯标准库抓取）拿素材；视频取**音轨**转文本供 LLM 总结 + 抽**关键帧**让视觉 LLM 理解画面（多模态）。
- 后端 `server.mjs` 新增 **`POST /api/agent/media {source, url, goal?, cookieFile?}`**：`source ∈ {douyin, xhs-video, wechat}`（否则 400）、`url` 为 http(s)（否则 400）；建 `db.agentRuns` run（`kind:'pipeline'`, `mode:'url'`, `source`, `goalLabel`）→ spawn `scripts/url_pipeline.py`（`.venv-ocr` python，`--source --url --api --run-id [--goal] [--cookie-file]`，detached）→ 202 `{runId, source}`；复用既有 `/api/agent/pipeline/:runId/result` 回调与 `/api/agent/runs`。
- 驱动 `scripts/url_pipeline.py`（新，纯标准库，仿 experiment_pipeline）：`wechat`→`fetch_wechat.py`（系统 python）；`douyin`/`xhs-video`→`download_media.py`（`tools/.venv-dl` python）。成功抓取后才建/找笔记本（标题 `<源标签> · <goal或推导>`）→ `POST /api/sources` 导入（视频=音轨转写+元数据+末行 `图片目录：<frames>`；微信=Markdown+末行 `图片目录：`）→ 视频先 `POST /api/transcribe`（wav base64）→ `/api/generate`+`/api/notes` 整理笔记 → `/api/agent/skill` 生成 skill；报告 `data/pipeline/<source>-<netloc>.report.json` + 回写 `/result`。
- `scripts/fetch_wechat.py`（新，stdlib urllib+html.parser）：单篇 `mp.weixin.qq.com` → title/author/date + `#js_content` 转 Markdown + 带 `Referer` 下图 → `data/wechat/<slug>/article.md`（末行 `图片目录：`）。
- `scripts/download_media.py`（新，yt-dlp+ffmpeg）：①yt-dlp 下载视频+info.json（必需）；①b 字幕**尽力**补（独立 pass，失败仅 warn 不中断——**与视频下载解耦**，避免字幕 429 拖累必需下载，音轨转写才是主文本源）；②ffmpeg 抽 16kHz 单声道 WAV（faster-whisper）；③ffmpeg 抽 N 关键帧（视觉 LLM）。`--source` 仅标签，下载由 yt-dlp 完成。
- 前端（`index.html`/`app.js`/`style.css`）：`#agentDialog` 加 `#agentSource` 下拉（keyword/wechat/douyin/xhs-video）+ `#agentUrl`；`startAgentPipeline()` 按 source 路由（非 keyword→`/api/agent/media`，keyword→`/api/agent/pipeline`）；`renderAgentReport` 渲染 source-aware steps + `report.url`。
- 活体发现并修 1 处确定性前端 bug：`#agentGoal` 静态 `required` 阻断 URL 模式提交（隐藏但必填字段）→ `syncAgentMode()` 动态切 `agentGoal`/`agentUrl` 的 `required`。
- 验证：`node --check server.mjs public/app.js` 过；`npm test` **37/37**（新增 5 项 media，既有 32 项无回归）。浏览器活体（单实例 8765，预览面板）：`#agentSource` 切 keyword↔URL 字段显隐正确（含 required 修复）；提交 → `POST /api/agent/media` 202 → run 创建 → 轮询；**完整微信图文管线活体跑通**（fetch→导入 424 字→建「微信实验学习 · …」本→整理笔记→生成 skill 诚实判「unidentified-experiment-pending-review」+ 9 项待核对 gap 不臆造→回调 done），无失败请求。
- 边界（如实）：抖音/小红书视频**下载路径本轮未活体**（无真实视频 URL/小红书需登录）——yt-dlp Douyin/XHS 提取器已装、ffmpeg 抽音轨+关键帧命令在合成视频上验证、完整编排经微信活体证明；音轨转写依赖本地 faster-whisper（无语音/服务不可用则标"转写为空"不臆造）；不做反爬绕过（需登录用 `--cookie-file`）；skill 仍受 1800 字符共读预算限制（open T13）。
- 数据清理：`data/store.json` 两条指向已删测试笔记本（`0cadafe7`）的孤儿 agentRun 已原子清除（先确认 8765 无监听、`save()` 仅请求驱动，无并发写风险）；余下 agentRun 均指向现存笔记本。
- 提交：本地 commit（`server.mjs`、`public/index.html`、`public/app.js`、`public/style.css`、`tests/agent-pipeline.test.mjs`、`scripts/url_pipeline.py`、`scripts/download_media.py`、`scripts/fetch_wechat.py`、`TASKS.md`、`CONTEXT.md`），**未 push**（push 需用户授权）。`.claude/launch.json` 临时预览改动已还原未纳入。

## 2026-10-10 T25 彻底删除「实验指导」功能 + 修复抖音笔记本乱码

- 起因：用户「解决乱码问题，此外实验指导是一个冗余的功能，彻底删除」。截图为抖音笔记本标题/来源文件名乱码（`◆◇□`/U+FFFD）。
- **删除「实验指导」（后端+前端+测试+遗留数据）**：
  - `server.mjs`：删 `GET /api/skills`、`POST /api/skill-ask`、`POST /api/skills/generate` 三端点 + `listSkills()`/`readSkill()`；**保留** `/api/agent/skill`（管线产出 skill 的核心交付物）及其助手 `parseSkillMeta`/`lastDoneAgentSkill`/`generateSkillForNotebook`/`extractGaps`；`/api/agent/skill` 结果 note 去掉对 `/api/skill-ask` 的引用。
  - `public/index.html`：删「实验指导」tab + `#skillGuide` 面板；`public/app.js`：删 `loadSkills`/`renderSkillMessages`/`sendSkill`/`skillList`/`skillBusy` + 全部 `#skill*` 绑定 + `render()` 里的 `renderSkillMessages()` + agent 报告「去实验指导问答 →」按钮 + 初始化 `run(loadSkills)`；`public/style.css`：删 `.skill-pick`/`.skill-messages`/`.skill-composer`/`.skill-desc`。
  - `tests/skill.test.mjs` 整文件删除（只测已删端点）；`tests/agent-skill.test.mjs` 去掉 `/api/skill-ask` 子断言（保留 `/api/agent/skill` 断言）。
  - 遗留数据：清掉 `db.messages` 全部 `type:'skill'` 记录（4 条，功能已删、无 UI 渲染，属死数据）。
- **修复抖音乱码（根因=旧编码路径残留，当前代码已验证干净）**：
  - 根因定位：隔离测试（Node `body()` + Python urllib `api()` 字节级 round-trip）+ 用真实 `url_pipeline.py` 活体探测（`.venv-ocr`）均证明**当前管线产出干净中文**；乱码笔记本 `e4f8c0dc` 是编码修复前旧数据残留。乱码只落在 3 个**显示用字符串**（笔记本标题 + 2 个来源标题），正文（转写/笔记/消息）全干净。
  - 修法：停 8765 → 程序化读 `store.json`、把笔记本标题改为 `抖音实验学习 · 几十个AI Agent同时协调执行任务，怎么防冲突？ #AIagent #Age`、2 个来源标题改为 `几十个AI_Agent同时协调执行任务_怎么防冲突_AIagent_Agent开（视频转写）.md`（复刻 `url_pipeline.py` 的 `slug()`/`[:40]`）→ 原子写（`JSON.stringify(db,null,2)`+tmp+rename，与 `save()` 同格式）→ 重启。
  - 活体验证（预览面板单实例 8765）：抖音笔记本标题（侧栏+头部）干净、2 来源标题干净、笔记正文干净；「实验指导」tab 已消失（tablist 仅剩 共读笔记/学习资料/疑问清单）；`/api/state` 经服务端回读确认 `ufffd=0`。
- **诚实边界（残余乱码，待用户决定）**：全库另剩 **1 条**乱码消息 = 笔记本「小红书实验学习 · 酵母转化」（`2603259c`）里一条**用户手打**的共读提问（`type=chat`，100 个 U+FFFD，2026-10-10 05:04，早于抖音 run）。U+FFFD=字节已丢失，无法自动复原；属用户自有数据，不擅自删除，留待用户决定（重发或删除）。
- 验证：`node --check server.mjs public/app.js` 过；`npm test` **30/30**（删 `skill.test.mjs` 后无回归；`/api/agent/skill` 5 项仍绿）；浏览器活体见上。8765 收尾为单实例；诊断临时文件（`_*.mjs/.py/.json/.jsonl/.txt`、`data/_enc_test/`、`store.json.bak-*`）已全部清理。
- 提交：本地 commit（`server.mjs`、`public/index.html`、`public/app.js`、`public/style.css`、`tests/agent-skill.test.mjs`、删 `tests/skill.test.mjs`、`CONTEXT.md`、`TASKS.md`），**未 push**（push 需用户授权）。工作树另有 1 处**非本任务**的既有删除 `skills/multi-ai-agent-concurrency-conflict-prevention.md`（会话开始前已 `D`，未纳入本次提交，留待核对）。

## 2026-10-10 T26 修复抖音"两个源"重复 + 知识总结产出模式 + 全局「Skill 库」面板

- 起因：用户「为什么抖音视频中的学习资料有两个源？这是不对的」+「我有的时候需求不是实验学习，而是**抖音知识总结**，然后写成 skill 方便调用」+「没有 skill 的文件列表，像 claude code desktop 那样从列表选 open in explorer 更方便」。
- **修抖音重复源（后端去重 + 数据清理）**：`POST /api/sources` 文本分支加规范化 hash（sha256，把运行时间戳 `\b\d{8}-\d{6}\b` 替成 `TS`，复刻 `/api/upload` 的去重口径），同 notebook 同 kind 同 hash 命中已有源则返回 `duplicate:true`+既有 id（200，不新增）。数据层一次性清掉抖音本里那条重复源（保留最早 createdAt），原子写并备份 `data/store.json.bak-dedup`（停 8765 → 改 → 重启）。
- **知识总结产出模式（skill kind）**：`parseSkillMeta` 认 `kind:` 行（默认 `experiment`）；`generateSkillForNotebook(notebookId, kind)` 用 `SKILL_PROMPTS[kind]`——`experiment`（原模板）/ `knowledge`（新模板：frontmatter `kind: knowledge`，正文=什么时候用/核心要点（先看这里）/关键概念/知识要点（分主题）/方法·流程/常见误区/来源，未知标"待核对"，参考专业 SKILL.md 写法）；`POST /api/agent/skill {kind}` 按 kind 复用/重生成（`prior.kind===kind` 才复用），`result.skill.kind` 回传，summary/note 带类型标签（知识总结/实验操作）；`scripts/url_pipeline.py`·`experiment_pipeline.py` 加 `--kind {experiment,knowledge}`（knowledge 时 payload 带 `kind`）；前端 Agent dialog 加「产出类型」下拉（experiment 默认 / knowledge），报告 skill 步显示类型。
- **全局「Skill 库」面板（列表 + 资源管理器打开）**：后端 `GET /api/skills/list`（扫 `skills/*.md` 解析 frontmatter，返回 `[{name,title,description,kind,steps,file,path}]` 按 name 排序）+ `POST /api/skills/reveal {name}`（`[a-z0-9-]` 校验 + 文件存在，spawn 资源管理器：win32 `explorer /select,<path>` / darwin `open -R` / 其他 `xdg-open`）；前端侧栏「📚 Skill 库」按钮 + `<dialog id="skillsDialog">`（`#skillLibrary` 卡片列表，每卡标题/类型/file/steps/desc + 「在资源管理器中显示」→ reveal）。
- 验证：`node --check server.mjs public/app.js` 过；python `ast` 过；`npm test` **33/33**（新增 3 项：文本源去重 / kind=knowledge 生成且独立于 experiment / skills list meta）无回归。浏览器活体（预览面板单实例 8765）：抖音本「学习资料 **1**」（去重生效）、Agent dialog「产出类型」下拉在位、Skill 库面板列 3 个 skill（`dh5a-gfp-transformation`/`pcr-qpcr-colony-pcr`/`yeast-liac-peg-transformation`，均 `[实验操作]`）带 meta，点「在资源管理器中显示」→ `POST /api/skills/reveal` **200**。
- 诚实边界：抖音本自身的 skill `skills/multi-ai-agent-concurrency-conflict-prevention.md` 当前**不在磁盘**（会话开始前已 `D`、仍 track 于 HEAD、git status `D`），故不在 Skill 库列出——属用户既有数据，待用户决定是否恢复，不擅自 restore/commit。用户新增方向「研习伴 agent 可安装自己的 agent / 自己写的 skill 只在 pre-queue / 使用时调度去 skill-queue」语义未定，待澄清后另立项。
- 提交：本地 commit（`server.mjs`、`public/index.html`、`public/app.js`、`public/style.css`、`scripts/url_pipeline.py`、`scripts/experiment_pipeline.py`、`tests/agent-skill.test.mjs`、`CONTEXT.md`、`TASKS.md`），**未 push**（push 需用户授权）。工作树另有 1 处既有删除 `skills/multi-ai-agent-concurrency-conflict-prevention.md`，**未纳入**本次提交。

## 2026-10-10 T27 skill 分级：pre-queue → skill-queue

- 起因：用户「自己写的 skill 只在 pre-queue，我使用时可以选择调度去 skill-queue 来使用」。确认语义=自写/生成 skill 默认进 **pre-queue**（待激活），用户可把它「调度」到 **skill-queue**（已激活、可被任何 agent 调用）。
- 方案（存储留 `store.json`，保持 `SKILL.md` 文件可移植、干净）：`db.skillsQueue`（`name→'pre'|'active'`，缺省即 `pre`）；`GET /api/skills/list` 每项加 `status`（以磁盘文件名 stem 为 key，与 `reveal` 口径一致）；新增 `POST /api/skills/queue {name,status}`（`[a-z0-9-]` 校验 + 文件存在 + `status∈{pre,active}`，否则 400 / 404）；前端 Skill 库面板分两组「skill-queue（已激活）/ pre-queue（待激活）」，每卡显示状态徽标 + 「调度到 skill-queue（激活）」/「退回 pre-queue」+「在资源管理器中显示」，切换后重载。
- 验证：`node --check server.mjs public/app.js` 过；`npm test` **34/34**（新增 1 项 tiering：默认 pre→active→pre + 非法 status 400 + 不存在 404）无回归。浏览器活体（重启单实例 8765 预览面板）：`/api/skills/list` 全默认 `pre`；`POST /api/skills/queue` promote→list 反映 `active`、非法 `400`、缺 `404`；UI 两组分组正确、点「调度」按钮把 dh5a 从 pre 移入 skill-queue 组、状态徽标「已激活 · skill-queue」+ 蓝左边框样式；收尾把演示的 2 个 skill 恢复回 `pre`（自写 skill 默认态）。
- 边界（如实）：本切片只做 skill 分级 + 激活状态；「skill-queue 被 agent 实际加载调用」的运行时行为属后续「安装自己的 agent」方向（用户已选先做分级），未在本次实现。抖音本自身 skill `skills/multi-ai-agent-concurrency-conflict-prevention.md` 仍不在磁盘（既有删除，未恢复/未提交）。
- 提交：本地 commit（`server.mjs`、`public/index.html`、`public/app.js`、`public/style.css`、`tests/agent-skill.test.mjs`、`CONTEXT.md`、`TASKS.md`），**未 push**（push 需用户授权）。

## 2026-10-10 T28 实验操作 / 知识总结 skill 模板对齐专业 SKILL.md 规范（参考 GitHub 高 star / 官方源）

- 起因：用户「写实验操作 skill 和知识总结 skill 是否专业，是否参考了 github 上的成熟 high index 项目？」。先如实说明：原模板基于本地样例 + 训练知识（当时 WebSearch 不可用）；随后实际拉取权威源核实并对齐。
- 参考源（高 star / 官方）：`anthropics/skills`（官方 spec → agentskills.io/specification；`skills/skill-creator/SKILL.md` 官方写作指南）+ `obra/superpowers`（~297k star，"agentic skills framework"；`writing-skills/SKILL.md`："Writing skills IS TDD applied to process documentation"）。
- 诊断（原模板 ~70% 对齐）：①`description` 被当摘要写，而它是**主触发机制**（做什么 + 何时用，要"pushy"）；②缺 `## 概览`（Overview 核心原则）；③缺 `## 何时不要用`（when NOT to use）；④知识模板把「什么时候用」放进**正文**（违反"何时用只写进 description，不进正文"）。
- 落地（仅 `server.mjs` 的 `SKILL_PROMPTS.experiment`/`.knowledge`）：description 指令改触发式（做什么 + 何时调用 + 具体触发场景/关键词，≤120 字，宁可主动）；两者新增 `## 概览`（1-2 句核心）+ `## 何时不要用`（避免误用，无则"暂未发现"）；知识模板**删正文 `## 什么时候用`**，改在 description 指令注明「何时用只写进 description」；两模板补 `<500 行`（progressive disclosure）；保留 `kind:` / 步骤同构 / 待核对不臆造 / 祈使句。
- 验证：`node --check server.mjs public/app.js` 过；`npm test` **34/34** 无回归（模板是 prompt 字符串，现有 mock 测试与其解耦，仍绿）。
- 诚实边界：模板输出形状需真实模型跑一次生成才能端到端确认（需 18081 本地服务 + 会写共享 `data/store.json`，未在本次活体跑，避免污染共享 store）；已落盘 skill 文件不变，下次 `force` 重新生成才应用新模板。
- 提交：本地 commit（`server.mjs`、`CONTEXT.md`、`TASKS.md`），**未 push**（push 需用户授权）。既有删除 `skills/multi-ai-agent-concurrency-conflict-prevention.md` 未纳入。

## 2026-10-10 T29 tools 层：把「下载→转写→共读笔记→skill」打包成可被 agent 调用的工具

- 起因：用户「为什么这套流程没有在研习伴中进行，也没有创建共读笔记？把这套流程打包成 tools，为研习伴添加 tools，方便研习伴 agent 调用」。经 AskUserQuestion 确认形态=**只做 LLM 函数调用循环**（agent 自主选工具、串联执行），首批工具 `download_media`/`transcribe`/`summarize`/`make_skill`，末端**落共读笔记**；**不加前端入口**、**不做 function-calling 兜底**（18081 若不支持 `tools` 参数则 run 如实 `failed`）。
- 方案（后端 `server.mjs` createApp 内 + 纯标准库驱动）：
  - `TOOLS` 注册表（每项 `{name,description,parameters(JSON Schema),run(args)}`）+ `callTool(name,args,log)` 分发 + `runToolsLoop({source,url,goal,kind})`（OpenAI 函数调用循环：`model('/chat/completions',{messages,tools:TOOL_FUNCS,tool_choice:'auto'})`，上限 **8 轮**；工具**同步 `await`** 执行，不受 `model()` 的 120s 超时限制；每步入 `toolLog` `{step,tool,args,ok,error?,brief}`）。
  - 工具：`download_media`（`spawn` `tools/.venv-dl` python 跑 `download_media.py --url --source --frames 0 [--cookie-file]`，取 `complete` 事件 result 的 audio/title/duration/uploader/dir，300s 超时）；`transcribe`（`transcriber(file)` → text/segments/duration）；`import_to_notebook`（建/找笔记本「视频学习 · <title 截断40>」+ 文本 source sha256 去重导入 + `generateNote()` 整理聚焦笔记并持久化 revision → `save()`）；`make_skill`（复用 `generateSkillForNotebook` 写 `skills/*.md` + `extractGaps`）；`summarize`（纯文本 LLM 摘要）。
  - 端点：`GET /api/tools`（列表 `[{name,description,parameters}]`）；`POST /api/tools/loop`（服务端**同步**跑循环，回 `{status,finalText,toolLog,notebookId,notebookTitle,transcriptLen,skill}`）；`POST /api/agent/tools {source?,url?,goal?,kind?,cookieFile?}`（校验 url/source → 建 `agentRuns` run（`kind:'tools'`）→ spawn `scripts/tools_pipeline.py`（`.venv-ocr` python）detached → 202）。
  - 驱动 `scripts/tools_pipeline.py`（纯标准库）：调 `/api/tools/loop` → 组装报告（toolLog/transcriptLen/notebook{id,title}/skill/summary）→ 回写 `POST /api/agent/pipeline/<runId>/result`（done/failed 如实），报告落 `data/media-inbox/tools-<netloc>.report.json`。
  - 新增 `generateNote(notebookId)`（复刻 `/api/generate` 整理逻辑，供 `import_to_notebook` 落笔记）。
  - **活体发现并修 1 处后端缺陷**：`/api/agent/pipeline/:runId/result` 回调原只匹配 `r.kind==='pipeline'`，导致 `kind:'tools'` 的 run 回写 404、run 卡 `running` 不翻态 → 放宽为 `['pipeline','tools'].includes(r.kind)`。
- 验证：`node --check server.mjs` 过；python `ast` 过；`npm test` **39/39**（新增 5 项 tools，既有无回归）。**活体单实例 8765 + 18081 `local-qwen38-gsq`（确认支持 OpenAI function-calling）**：`POST /api/agent/tools {source:'douyin',url:'v.douyin.com/r0MlUzPQgUE/',kind:'knowledge'}` → 202 → 驱动 → `/api/tools/loop` → **LLM 自主按序调用 `download_media`→`transcribe`→`import_to_notebook`→`make_skill`（全 ok，import 返回的 notebookId 前传给 make_skill）** → 落成共读笔记「视频学习 · jev模型…（交叉科学）」（文本来源 640 字 + 生成笔记 2122 字）+ 可移植知识 skill `skills/jev-model-fast-decision.md`（frontmatter + 概览/何时不要用/核心要点/关键概念/知识要点/方法流程/常见误区/来源，gapCount 7 待核对）→ 回写 `/result` → **run 翻 `done`**（transcriptLen 632、notebook、skill、toolLog 齐全）。`GET /api/tools` 列出 5 工具。
- 诚实边界：`make_skill` 复用既有 LLM 生成，受 1800 字符共读预算限制（open T13）；`download_media`/`transcribe` 是真实子进程/真实 faster-whisper，单测以 fake LLM 走 `import_to_notebook`→`make_skill` 分支覆盖（不 mock 下载/转写本身）；本轮按用户决定**不加前端入口**、**不做兜底**。活体大型媒体文件（`data/media-inbox/20261010-195705/` mp4+wav+frames）与驱动报告已清理；共读笔记 + 自动生成的 skill 保留（正是「共读笔记」诉求的产物）。
- 提交：本地 commit（`server.mjs`、`scripts/tools_pipeline.py`、`tests/tools.test.mjs`、`CONTEXT.md`、`TASKS.md`），**未 push**（push 需用户授权）。既有删除 `skills/multi-ai-agent-concurrency-conflict-prevention.md` 未纳入。

## 2026-10-10 T30 tools 层 agent 自动判断 skill 类型（移除「产出类型」调用方接口）

- 起因：用户「agent 调用 tools 的时候能否区分实验笔记还是内容总结来生成不同的 skill？」。原实现里 `kind` 由调用方传入 `/api/agent/tools`，经 prompt **软引导** LLM 传给 `make_skill`（不可靠：LLM 漏传 `kind` 即回退默认 `knowledge`），且 agent 不根据材料内容判断。经 AskUserQuestion 确认：**选 B（agent 自动判断）+ 取消 tools 层「产出类型」接口（冗余）**，且范围**只改 tools 层**（`/api/agent/skill`·`pipeline`·`media` 保持调用方可指定 `kind`/`skillKind` 不变）。
- 方案（仅 `server.mjs` tools 层 + `scripts/tools_pipeline.py`）：
  - 新增 `classifyNotebookKind(notebookId)`：取笔记本最新笔记 + `evidence`（预算 1800 字符），用 LLM（`temperature:0`、`max_tokens:20`）判断「可操作、可复现的实验/操作流程（有明确步骤与参数）→ `experiment`」还是「概念、原理、知识点讲解 → `knowledge`」，严格解析输出词，解析失败默认 `knowledge`。
  - `make_skill` 工具**去掉 `kind` 参数**：`run` 内先 `await classifyNotebookKind(nbId)` 再 `generateSkillForNotebook(nbId, 自动分类结果)`；description 改为「会自动判断该材料应生成实验操作还是知识总结 skill」。kind 由 agent 自主判定，不再是调用方接口。
  - `runToolsLoop({source,url,goal})` 去掉 `kind` 入参；system/user prompt 不再写死「知识/实验 skill」，改为「最后 make_skill 生成 skill（它会自行判断该材料应生成实验操作 skill 还是知识总结 skill）」。
  - 端点 `POST /api/tools/loop` 与 `POST /api/agent/tools` **移除 `kind` 入参**；tools run **不再记录 `skillKind`** 字段、不向驱动传 `--kind`；`goalLabel` 固定为「媒体→转写→共读笔记→skill（agent 自动判断类型）」。
  - 驱动 `scripts/tools_pipeline.py` 去掉 `--kind`：不向 `/api/tools/loop` 传 kind，report 不再含入参 kind（`skill.kind` 由服务端分类后回传）。
- 验证：`node --check server.mjs` 过；`python -m py_compile scripts/tools_pipeline.py` 过；`npm test` **39/39**（tools 测试更新：fake LLM 识别分类调用（user prompt「只输出 experiment 或 knowledge」→回 `knowledge`），`make_skill` 不传 kind、由服务端自动分类→knowledge skill；`/api/agent/tools`·`/api/tools/loop` 不传 kind、断言无 `--kind`；既有无回归）。`GET /api/tools` 确认 `make_skill.parameters` 仅 `notebookId`、description 含「自动判断」。**活体单实例 8765 + 18081 `local-qwen38-gsq`**：`POST /api/agent/tools {source:'douyin',url:'v.douyin.com/r0MlUzPQgUE/'}`（**不传 kind**）→ 202 → 驱动 → 循环 `download_media`→`transcribe`→`import_to_notebook`→`make_skill` 全 ok → **`make_skill` 自动分类为 `knowledge`**（JEV 口播科普判为知识总结）→ 落共读笔记 + skill（`skill.kind:'knowledge'`）→ 回写 `/result` → run 翻 `done`；`GET /api/agent/runs` 确认 run `kind:'tools'` 且**无 `skillKind` 字段**。
- 诚实边界：自动分类是 LLM 判断，存在误分可能（实验↔知识边界模糊时）；本次活体只验证了 knowledge 分支（JEV），experiment 分支未用真实实验视频活体验证（需实验类 URL）。`/api/agent/skill`·`pipeline`·`media` 仍是调用方可指定 `kind`（与 tools 层自动判断并存，属不同入口）。活体验证副产物（重复 JEV 笔记本 `03416340` + 重复 skill `jev-gev-llm-speed-comparison.md` + report）已清理，T29 保留的 JEV 笔记本 `af2a0171` + `skills/jev-model-fast-decision.md` 不变。
- 提交：本地 commit（`server.mjs`、`scripts/tools_pipeline.py`、`tests/tools.test.mjs`、`CONTEXT.md`、`TASKS.md`），**未 push**（push 需用户授权）。既有删除 `skills/multi-ai-agent-concurrency-conflict-prevention.md` 未纳入。

## 2026-10-10 T31 批量自动抓取微信公众号文章（真实浏览器搜狗关键词搜索）+ 细胞转染操作步骤 skill

- 起因：用户「我要的是批量自动抓取，你让我一篇篇发我很累，你去github上找类似的方法」。范围经用户**两次澄清**定稿：①「为什么提取了四篇只有一篇来源？4 篇太少，至少 15 没有也要 10 篇」→ **整篇导入、每篇一个独立来源**（不合并）；②「电转只是转染的一个方法」+「我只要转染步骤，电转染也是转染」→ 交付物是**细胞转染操作步骤** skill（电转作为其中一种方法），不是只讲电转。要**真实浏览器模拟人工检索**（非 requests+验证码）。
- 抓取工具：GitHub `ar-gen-tin/wechat-article-downloader`（Chrome CDP 手搓 WebSocket + 搜狗 `weixin?type=2` 关键词搜索 + 微信图文→Markdown+本地图片；依赖仅 `turndown`+`turndown-plugin-gfm`）。本机无 Bun → 用 **`npx -y tsx scripts/main.ts`**（Node 24 原生 TS，解决项目 `import "./cdp.js"`→`cdp.ts` 映射）。`git clone --depth 1` 到 `tools/wechat-article-downloader/`（**gitignored 第三方代码**）。
- 批量链路：`--search "<关键词>" --max N -o <dir>` → 真实 Chrome（`--user-data-dir=%APPDATA%\wechat-article-downloader\chrome-profile`）打开搜狗 `type=2`（**真实渲染+JS，无验证码过反爬**）→ 提取文章 URL → 跟随搜狗 link 到 `mp.weixin.qq.com` → 正文 Markdown + 图片本地化落盘。
- **批量活体（扩量去重）**：搜狗 type=2 单页仅 10 篇、**无翻页**（`searchAccountArticles` 只读当前 DOM），故分两轮关键词去重：`"细胞电转染 实验步骤"`(10) + `"电穿孔 细胞转染"`(10) → 去重后 **18 篇**不同转染文章（根目录早期 7 + `a/`10 + `b/`10，按标题+作者+正文 sha256 去重）。诚实边界：搜狗上**没有 15 篇专门讲电转染 protocol**；18 篇是**转染**文章（电转是其一小节），电转 protocol 细节集中在 1 篇（Neon 微电转 troubleshooting）。
- 沉淀研习伴：建「**细胞转染**」notebook（id `219a2ab3-65dd-4b22-862b-0c1e4199962e`）→ **18 篇整篇各为独立 source**（非合并）→ `POST /api/generate` 整理共读笔记 → `POST /api/agent/skill {kind:'experiment',force:true}` → 生成**转染操作步骤** skill `skills/cell-transfection.md`（frontmatter `title: 细胞转染操作`、kind:experiment，**7 步**：选转染方式→评估细胞状态→备核酸/转染材料→形成复合物/导入体系→加细胞→恢复→检测表达/沉默；覆盖脂质体/磷酸钙/**电转**/病毒法，全部参数「待核对」不臆造）。
- **关键发现（来源导入顺序决定 skill 框架）**：`generateSkillForNotebook` 取**导入顺序靠前的 ~2400 字** source 片段 + 最新笔记前 1600 字喂 LLM（`server.mjs` budget=2400）；若把 troubleshooting 文章排最前，skill 被带偏成「转染效率/活性优化」（曾产出 `cell-transfection-efficiency-viability-optimization`）。改为 **protocol 优先排序**（前 2 篇为完整步骤文，troubleshooting 降到 #9）→ 产出干净的转染 SOP。
- 数据清洗：2 篇微信富文本 `<table>` 未转 Markdown（原始 HTML 342K/540K 字符）→ 导入时剥离 HTML 标签/script/style/实体/URL，正文压到 1.1K–12K 字符（全部 < `/api/sources` 200K 上限）。
- 清理：删 2 个临时 notebook（`90ff9de8` 旧电转本、`c4e1d304` 误框架本）+ 2 个旧 skill 文件（`cell-electroporation-transfection.md`/`cell-transfection-efficiency-viability-optimization.md`）+ 临时导入脚本 `_tmp_import_ep2.py` + 临时 `kill_tool_chrome.ps1`；TOOL Chrome 全部按 cmdline 匹配 `wechat-article-downloader` 清（不碰用户自己的 Chrome）。
- 验证：`skills/cell-transfection.md` 已落盘并 Read 确认（frontmatter kind:experiment、title「细胞转染操作」、7 步、全参数待核对）；notebook `219a2ab3` 存在且 **18 sources**；7 个 notebook 其余 6 个用户旧数据未动；TOOL Chrome=0；`git status`=`M .gitignore` / `M CONTEXT.md` / `M TASKS.md` / 既有 `D skills/multi-ai-agent-concurrency-conflict-prevention.md` / `?? skills/cell-transfection.md`；单实例 8765 未双开。
- 诚实边界：搜狗 type=2 单页仅 10 篇（15+ 需翻页，项目未实现翻页）；批量仍可能触发验证码（真实浏览器宽松，需时 `--wait` 手动介入）；`killChrome` 在 Windows 残留子进程（按 cmdline 匹配 `wechat-article-downloader` 用 PowerShell 清）；第三方项目 archived；搜狗 link 有时效 token。
- 提交：本轮产物 `skills/cell-transfection.md`（新）+ `.gitignore`（加 `tools/wechat-article-downloader/`）+ `CONTEXT.md`/`TASKS.md` 待用户确认后 commit，**未 push**（push 需用户授权）。第三方工具目录 gitignored 不提交；既有删除 `skills/multi-ai-agent-concurrency-conflict-prevention.md` 仍未纳入。

## 2026-10-10 T32 细胞转染共读笔记补齐 + 微信公众号图文抓取 tools 化（`fetch_wechat_articles`）

- 起因：用户「细胞转染的共读笔记呢？能不能梳理好啊」+「把从微信公众号拉取图文也打包成 tools 来方便 agent 进行调用」，并确认「微信公众号图文的 tools 参考已有的 tools」。两件：①T31 的「细胞转染」notebook 只跑了 `/api/generate`（喂 skill）没落共读笔记 → 补齐；②把 T31 的 wechat-article-downloader 批量抓取**封装成 tools 层工具**，让研习伴 agent 经 LLM 函数调用自主调用（同 `download_media` spawn 模式）。
- **①共读笔记补齐**：「细胞转染」notebook（`219a2ab3`）原 0 版 revision → `POST /api/generate` + `POST /api/notes` 落 1 版（`ad314a36`，2553 字）：目的/原理/步骤/明确参数/注意事项/待核对，缺失参数如实「材料未说明/待核对」，带 S1/S2 引用。
- **②`fetch_wechat_articles` 工具（`server.mjs` `TOOLS`）**：`{query, max?}` → `spawn(process.execPath, [tsxCli,'scripts/main.ts','--search',query,'--max',N,'-o',outDir], {cwd:toolDir,shell:false})`。`outDir` 固定 `data/wechat-fetch/fetch-<ts36>`（不接受调用方 outDir，防路径注入）。工具内部：读 outDir 的 `.md` → 建/找「微信公众号 · <query[:20]>」notebook → **每篇整篇各为独立 text source**（sha256 去重）→ `generateNote()` 落 1 版共读笔记 revision → `save()`。返回 `{outDir,count,notebookId,notebookTitle,sourceCount,revisionId,articles}`。600s 超时。
- **spawn 方式选型（Windows 关键）**：`spawn('npx',[…],{shell:false})` ENOENT（npx 是 .cmd shim）；`cmd /d /s /c "<单串>"` 嵌套引号 + cwd 带空格 → outDir 被拼串 ENOENT；`shell:true` 能跑但发 DEP0190 警告。**最终=本地 `npm install tsx --no-save` 到工具目录，直接 `node <node_modules/tsx/dist/cli.mjs>`**（真实可执行文件、args 数组、CreateProcessW 传 CJK）。活体确认 2 篇 CJK 图文+本地图落盘、带空格 outDir 无 ENOENT。
- **端点/驱动**：`runToolsLoop({source,url,goal,query,max})` 加 query/max 分支（system prompt 增「微信公众号关键词→fetch_wechat_articles→make_skill」路径；loop 内跟踪 `fetch_wechat_articles` 返回的 notebookId）；`POST /api/tools/loop` 加 `query`/`max`；新增 **`POST /api/agent/fetch-wechat {query,max?}`**（校验 query 非空/≤120 → 建 `agentRuns` run（`kind:'tools'`,`source:'wechat'`）→ spawn `tools_pipeline.py --source wechat --query --max` → 202）；`scripts/tools_pipeline.py` 加 `--query`/`--max` 转发 loop_payload。
- 验证：`node --check server.mjs` 过、python `ast` 过、`npm test` **41/41**（tools 测试更新：`GET /api/tools` 列 6 工具含 `fetch_wechat_articles` / `POST /api/agent/fetch-wechat` 合法 query→202+kind=tools run+驱动 `--source wechat --query --max` 正确（query 带空格仍单个 argv 元素）/ 缺 query 400 不 spawn）无回归。`GET /api/tools` 实列 6 工具。**活体单实例 8765 + 18081 `local-qwen38-gsq`**：`POST /api/agent/fetch-wechat` → 202 → 驱动 → LLM 自主调 `fetch_wechat_articles`（真实 Chrome 搜狗抓取 2 篇）→ `make_skill`（自动判 knowledge）→ 落「微信公众号 · …」notebook（2 独立 source + 1 共读笔记）+ skill → run **done**（toolLog 两步 ok、CJK 标题/来源/正文正确）。
- 诚实边界：①Git Bash 手敲 CJK 经 `curl -d` 按 GBK 传（T21 已知）→ 真实 UTF-8 客户端（浏览器/Node fetch/其他 agent）不受影响，`run.goal/query` 顶层字段在 curl 通道显示乱码但**工具实际拿到的 query（LLM tool_call）正确**；②搜狗 type=2 单页仅 10 篇无翻页（`max`>10 也只取当前页）；批量仍可能验证码（需时人工介入）；第三方项目 archived。
- 清理：活体验证副产物（2 个「微信公众号 · …」测试 notebook + 对应 skill 文件 + report）经 API 删除，store 保持干净；AppData/Temp scratch 全清；TOOL Chrome 按 cmdline 匹配 `wechat-article-downloader` 清（不碰用户 Chrome）；`tools/wechat-article-downloader/node_modules`（含 tsx）属 gitignored 第三方目录。
- 提交：本地 commit（`server.mjs`、`scripts/tools_pipeline.py`、`tests/tools.test.mjs`、`CONTEXT.md`、`TASKS.md`），**未 push**（push 需用户授权）。既有删除 `skills/multi-ai-agent-concurrency-conflict-prevention.md` 未纳入。

## 2026-10-11 T33 小红书图文抓取 tools 化（`fetch_xhs_notes` 工具 + `POST /api/agent/fetch-xhs` 端点）

- 起因：承接 T32（微信公众号图文 tools 化）。上一轮审计结论：现有 6 个 tools 里**小红书图文完全没有 tools 层工具**（`download_media` 的 source 枚举只有 `douyin|xhs-video`，是视频；唯一能抓小红书图文的是**非 tools** 的 `POST /api/agent/pipeline`，强依赖用户 Edge CDP 9222 + 已登录小红书）。用户「做成 tools」——把小红书图文抓取+OCR+落笔记封装成 tools 层工具 `fetch_xhs_notes`，结构对齐 `fetch_wechat_articles`。经 AskUserQuestion 确认抓取策略=**默认复用 + 可选 crawl**（`crawl` 默认 false，复用 `~/Desktop/MediaCrawler/data/xhs` 已爬取数据；`crawl:true` 才启动 MediaCrawler，需已开 Edge CDP 9222 且已登录小红书，免扫码）。
- **`fetch_xhs_notes` 工具（`server.mjs` `TOOLS`）**：`{query, crawl?, limit?}`（`query` 必填非空 ≤120 字；`crawl` 布尔默认 false；`limit` 0=全部 或 clamp 1..100）。`run`：① `crawlerRoot=path.join(os.homedir(),'Desktop','MediaCrawler')`；② **crawl 段（仅 `crawl:true`）** `spawn(crawlerRoot/.venv-mc/Scripts/python.exe, ['main.py','--type','search','--keywords',query], {cwd:crawlerRoot, stdio:['ignore','pipe','pipe'], env:{...process.env,PLAYWRIGHT_BROWSERS_PATH:crawlerRoot/.pw-browsers}})`（900s 超时，mc_python 缺失 fail 500）；③ **import 段（恒做）** `spawn(ROOT/.venv-ocr/Scripts/python.exe, ['scripts/import_xhs.py','--app-root',ROOT,'--crawler-root',crawlerRoot,'--api',toolEnv.localBase,'--keywords',query,'--limit',String(limit)], {cwd:ROOT, stdio:['ignore','pipe','pipe']})`（1800s 超时）解析 stdout JSON-lines 末条 `complete` 事件 `{imported,skipped,failed}`（ocr python 缺失 fail 500）；④ 校验 `complete` 存在 && `icode===0` && `failed===0` && `(imported+skipped)>0`（**幂等**：重复运行 imported=0/skipped=N 属成功，不因 imported=0 判失败，否则 fail 504）；⑤ 建/找「小红书实验学习 · <query>」笔记本（找不到 fail 500）→ `generateNote()` 落 1 版共读笔记 revision → `save()`。返回 `{crawlerRoot,crawlRan,crawlOk,notebookId,notebookTitle,sourceCount:imported+skipped,imported,skipped,revisionId}`。`crawlerRoot`/端口经模块级 `toolEnv.localBase`（顶部 `import os` + `app.listen` 回调回填 `http://127.0.0.1:<port>`，工具闭包引用）。
- **spawn 模式（Windows 关键）**：MediaCrawler 与 import_xhs 均 `spawn(pyPath,[args数组],{cwd,stdio:['ignore','pipe','pipe'],env:{...process.env}})`——无 shell、无 cmd 引号，CreateProcessW 直传 CJK args（沿用 `download_media`/`fetch_wechat` 的 Python 子进程模式）。
- **端点/驱动**：`runToolsLoop({source,url,goal,query,max,limit})` 加 `limit` 入参 + prompt 三分支（`source==='xhs-image'`→「从小红书按关键词整理图文」（`fetch_xhs_notes`）/ `source==='wechat'`→「从微信公众号…」（`fetch_wechat_articles`）/ 仅 query 无 source→通用文案让 agent 自选两者）+ 新增 `fetchedXhsNotebookId` 跟踪并纳入返回 `notebookId` 兜底链；`POST /api/tools/loop` 读 `limit`；新增 **`POST /api/agent/fetch-xhs {query,crawl?,limit?}`**（校验 query 非空/≤120 → 建 `agentRuns` run（`kind:'tools'`,`source:'xhs-image'`）→ spawn `.venv-ocr python scripts/tools_pipeline.py --source xhs-image --query [--limit N] [--crawl]`（`pipelineLauncher` detached）→ 202）。驱动 `scripts/tools_pipeline.py` 加 `--limit`(int,0) + `--crawl`(store_true)，`--source xhs-image` 分支转发 `loop_payload`（query/source/limit/crawl），report 加 `limit/crawl` 字段。
- 验证：`node --check server.mjs` 过；python `ast` 过 `tools_pipeline.py`；`npm test` **44/44**（tools 测试更新：`GET /api/tools` 断言 **7 工具**含 `fetch_xhs_notes` / `POST /api/agent/fetch-xhs` 合法 query→202+kind=tools run+驱动 `--source xhs-image --query <q>`（带空格仍单个 argv 元素）且无 `--crawl/--limit` / `crawl:true`+`limit:5`→argv 含 `--crawl` 与 `--limit 5` / 缺·空 query 400 不 spawn）无回归。`GET /api/tools` 实列 7 工具。**活体单实例 8765 + 18081 `local-qwen38-gsq`**：`POST /api/agent/fetch-xhs {query:'酵母转化',crawl:false,limit:2}` → 202 → 驱动 → LLM 自主调 `fetch_xhs_notes`（复用本地已抓数据 `imported:0/skipped:2`，幂等未重复导入）→ `make_skill`（自动判 knowledge）→ 落「小红书实验学习 · 酵母转化」notebook（共读笔记 1 版 revision）+ skill `yeast-two-hybrid-protein-interaction.md` → run **done**（toolLog 两步 ok、notebookId/revisionId/skill 齐全）。**活体发现并修 1 处后端逻辑缺陷**：初版成功判定误用 `imported===0` 判失败，致幂等复跑（imported=0/skipped=N）误报 504 → 改判 `failed===0 && (imported+skipped)>0`。
- 诚实边界：①`crawl:true` 需用户已开远程调试(9222)且已登录小红书的 Edge（MediaCrawler 免扫码），本轮只活体验证 `crawl:false`（复用），crawl 半程仅验证参数构造（不替用户启浏览器/撞风控）；②`limit` 语义=导入篇数上限（0=全部），`import_xhs.py --limit 0`=全部；③小红书图文依赖 `.venv-ocr` + `ocr_worker.py` OCR，`import_xhs.py` 子进程回调 8765 建本/导来源（单实例、不双开、不手改 store.json）；④skill 受 1800 字符共读预算限制（open T13）。
- 清理：活体验证副产物全清——9 个 `data/_*.txt` 探测文件、`data/media-inbox/tools-xhs-image.report.json` 驱动报告、测试生成的 skill `skills/yeast-two-hybrid-protein-interaction.md`；并按 id 从 `store.json` 移除本次活体产生的 1 条共读笔记 revision（`5432f1de`，「小红书实验学习 · 酵母转化」回到 7 版基线），store 保持干净；单实例 8765 未双开。
- 提交：本地 commit（`server.mjs`、`scripts/tools_pipeline.py`、`tests/tools.test.mjs`、`CONTEXT.md`、`TASKS.md`），**未 push**（push 需用户授权）。工作树另有既有未提交 `.gitignore`/`skills/cell-transfection.md`（新）/既有删除 `skills/multi-ai-agent-concurrency-conflict-prevention.md`，**均非本任务产物，不纳入**本次提交（除非用户另行要求）。

## 2026-10-11 T34 P0 数据恢复能力：软删除回收站 + 全量备份导出/恢复

- 起因：成熟度路线 P0 第①项。现状删除是**实际删除且不可逆**——`DELETE /api/notebooks/:id` 与 `DELETE /api/sources/:id` 都直接 `fs.unlinkSync` 媒体 + 从 store 过滤对象，前端文案「无法撤销」，无回收站、无备份导出。这是产品**安全底线缺口**（误删一本笔记本=资料/笔记/消息/媒体全丢）。经 AskUserQuestion 拍板：范围=**回收站 + 备份导出**（两者都做，对齐路线图「软删除/回收站 + 备份恢复」）；粒度=**笔记本 + 来源**（两个删除入口都可撤销）。
- **schema 3**（`server.mjs:49` 迁移块）：加 `db.trash ??= []`、`db.schema=3`。旧库启动自动补空回收站，无数据丢失。
- **回收站条目结构**（`db.trash[]`）：笔记本 `{id,kind:'notebook',title,deletedAt,data:{notebook,sources[],revisions[],messages[],questions[],jobs[]}}`；来源 `{id,kind:'source',title,notebookId,deletedAt,data:{chain[],jobs[]}}`（`chain`=经 previousId/replacedBy 相连的全部来源，即校对闭包）。各数组=删除时刻命中的全量对象（与旧过滤谓词一致），`structuredClone` 深拷。
- **软删除改造**（`server.mjs`）：两 DELETE 端点改为 push 深拷快照进 `db.trash`、从 live 数组过滤、**去掉媒体 `fs.unlinkSync`**（保留磁盘媒体供恢复）；返回 `{ok:true,trash:true}`。来源 DELETE 保留 404 guard + `del` 闭包计算。
- **回收站 API**：`GET /api/trash`（列表）；`POST /api/trash/:id/restore`（找 entry 无则 404；冲突校验：notebook id 已存在/source 所属 notebook 已不在→409；无冲突则 `data` 各数组 concat 回 live、trash 移除该 entry、`save()`）；`POST /api/trash/:id/purge`（彻底删除：遍历 data 里 `kind==='media'` 来源按旧条件 `fs.unlinkSync`、trash 移除、`save()`）。路由 `p.split('/').slice(3)` 取 `[id,action]`。
- **备份导出/恢复**：导出复用 `GET /api/state`（整库 `db`），前端 Blob 下载 `yanxiuban-backup-<stamp>.json`；恢复新增 `POST /api/backup/restore`（`body()` 解析整库 JSON，校验 `notebooks`/`sources` 为数组否则 400，**整体替换** `db` 后补迁移 `db.trash??=[]`/`db.schema=3`/`jobs`/`agentRuns`/`skillsQueue`，`save()`）。恢复=覆盖式（前端 `confirmAction` 二次确认「将覆盖当前数据」）。
- **前端**（`public/*`）：侧栏 `#trashOpen`「🗑 回收站 · 可恢复删除」（`.agent-open`）+ `.side-bottom` `#backupButton`「⇩ 备份 / 恢复」；`#trashDialog`（列表卡片：标题/[kind]/删除时间 + 恢复/彻底删除按钮，彻底删除走 `confirmAction` 强调「不可恢复」）+ `#backupDialog`（导出 Blob 下载 / `<input type=file>` 选 JSON 恢复）。现有删除确认文案改「将移入回收站，可在那里恢复或彻底删除」。
- 验证：`node --check server.mjs public/app.js` 过；`npm test` **51/51**（`tests/delete.test.mjs` 改写为软删除语义断言：删来源清 proofread chain 但**保留媒体**并进回收站 / 删笔记本清各 live 数组但保留媒体并进 notebook 条目含 sources+revisions；`tests/trash.test.mjs` 新增 7 项：来源 restore 回灌 chain+清空 / purge 删媒体+清空 / 笔记本 restore 全量回来 / 备份 restore 回灌 store 快照 / restore·purge 未知 id→404 / 所属笔记本已不在的来源 restore→409 / 备份 restore 非法 payload→400）。活体单实例 8765：软删来源→进回收站+媒体仍在→restore 回来；软删笔记本→trash kind:notebook（sources 数正确）→restore 回来；备份 dump→改 store→restore→state 与 dump 一致。浏览器活体（预览面板）：侧栏两按钮渲染、回收站 dialog 空态文案正确/卡片含恢复·彻底删除且 confirm 文案正确、备份 dialog 含导出·选择恢复+file input。
- 诚实边界：①恢复=删除时刻快照回灌，期间若同名 notebook 被新建→409 拒绝不覆盖；②软删保留磁盘媒体→回收站占空间直到 purge（purge 才释放），属可撤销的代价；③备份恢复是覆盖式不合并，跨版本恢复依赖 schema 迁移块补 `db.trash`/`db.schema=3`；④`agentRuns` 行为不变（本就孤儿化，属审计日志非笔记本内容，purge 也不清）。
- 清理：活体测试副产物用 purge 清干净，store 回基线（7 笔记本、0 trash、schema 3）；单实例 8765 未双开、不手改 store.json。
- 提交：待用户确认后本地 commit（`server.mjs`、`public/index.html`、`public/app.js`、`public/style.css`、`tests/delete.test.mjs`、`tests/trash.test.mjs`、`CONTEXT.md`、`TASKS.md`），**未 push**（push 需用户授权）。工作树既有未提交 `.gitignore`/`skills/cell-transfection.md`（新）/既有删除 `skills/multi-ai-agent-concurrency-conflict-prevention.md` 均**非本任务产物，不纳入**本次提交（除非用户另行要求）。

## 2026-10-11 A08 真实材料 20 问验收（T14 P0 核心项，自行实测完成）

- 起因：A08 是 P0 里唯一「人工复核、机器测试无法替代」项，此前一直未做（报告标「未做」）。本轮用户要求「自己完成测试」，故对真实材料实跑 20 问并人工复核。
- 方法：对真实小红书本「小红书实验学习 · 酵母转化」（notebook `2603259c`，8 篇 OCR 来源：双杂交 BD/AD / 真·转化 LiAc-PEG / 单杂交 Y1H / 涂板点板 / 转化原理 / 双杂交经验 / 感受态制备）建**一次性验收笔记本**（`bc0a2198`，8 篇原文 verbatim 导入）→ 设计 **20 问**覆盖五类（指代/连续追问/材料缺失/来源冲突/常规参数；**原音频定位对本批文本图文材料 N/A**，无音频，如实标注不硬凑）→ 逐问跑 `POST /api/chat`（记录 text/citations/images/truncated）→ **人工逐条复核**「相关？被所引 `[S#]` 材料支持？关键参数是否编造？」。
- 指代问用 `/api/chat` 选区：发现 `/api/chat` 的 selection 校验要求选区必须是**笔记本已保存笔记（最新 revision）**的子串（`server.mjs:627`），且 `/api/generate` 只产 draft 不建 revision → 先 `POST /api/generate` 再 `POST /api/notes` 存为笔记，再取笔记原句做 selection 才通过。
- **结果（人工复核）**：
  - **相关且被所引材料支持 = 17/20**：Q1/Q2(指代)、Q3/Q5/Q6(追问)、Q7/Q10(冲突)、Q11/Q12/Q13(缺失)、Q14–Q18(常规)。
  - **关键参数编造 = 0**：所有缺失/冲突题一律「材料未说明/待核对」，无一处虚构浓度/体积/温度/时间。
  - **召回受限 4 问（无编造）**：Q4(LiAc 作用)、Q8(42℃热激)、Q9(离心转速)、Q19(菌株 Y187/Y2H)——材料其实含答案，但 `/api/chat` 证据预算（`server.mjs:631` ~1800 字符、每来源截 1200）只召回到单杂交来源(S5)，答「材料未说明」并拒绝编造。根因＝**T13 长文上下文/证据预算**（与 A04/A05 同源）。Q8/Q9 属「前提型」，模型正确推翻了「不同来源不一致」的假前提。
- **判定**：**零编造达标**；「≥18/20 完全相关且支持」为 **17/20**（差 1，根因 T13）。A08 未 100% 达线，如实不标「全部通过」。
- 清理：测试本 `bc0a2198`（含 8 来源 + 42 条问答消息 + 1 笔记）经 T34 软删→`POST /api/trash/:id/purge` 彻底删除，media-0 无磁盘残留；store 回基线（**7 笔记本 / 0 trash / schema 3**）。临时脚本与 JSON 已清（测试数据清零）。
- 诚实边界：①本批无音频，「原音频定位」维度 N/A，留待真实录音材料补测；②17/20 的 1 缺口是召回预算问题而非 LLM 编造，T13 提升证据预算后重测有望冲 ≥18/20；③全程单实例 8765、不双开、不手改 store.json（经 API 改）。
