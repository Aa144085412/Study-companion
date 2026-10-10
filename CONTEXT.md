# CONTEXT.md — 研习伴共享状态

> Codex 与 Claude Code 接手时先读本文件、TASKS.md、COLLAB.md，并检查 Git。最后对齐：2026-10-10。

## Recovery Capsule

- **Status**：v0.2.0 开发版；核心流程已实现，未完成完整产品验收。
- **Goal**：音视频 → 转写与校对 → 笔记 → AI 共读/语音提问 → 可移植实验 skill（由 Agent 管线产出，可被任何 agent 加载；「实验指导」问答 tab 已于 T25 彻底移除）。
- **Active task**：T16（A–G）已完成并 push（`e19c58a`）；T17 笔记 Markdown 阅读视图（渲染）已完成（纯前端，本地 commit，push 需用户另行授权）；T18 共读 LLM 视觉接入来源原图已完成（仅 `server.mjs`，本地 commit，push 需用户另行授权）；T19 小红书「酵母转化」采集→导入→共读笔记 + 双杂交/转化误标修复 已完成（2026-10-10，纯数据、无代码改动，无需 commit）；**T20 资料→skill 端到端 agent 切片 已完成（2026-10-10，本地 commit，push 需用户另行授权）**；**T21 打通前半段 goal→采集→导入→笔记→skill 端到端管线 已完成（2026-10-10，本地 commit，push 需用户另行授权）**；**T22 前端「实验 Agent」tab 已完成（2026-10-10，纯前端本地 commit，push 需用户另行授权）**；**T23 实验 Agent 层级修正（移出并列 tab→侧栏 dialog）+ 去除实验指导冗余「从当前笔记生成 skill」按钮 已完成（2026-10-10，纯前端本地 commit，push 需用户另行授权）**；**T24 多源 URL 入口（微信图文/抖音·小红书视频→导入→笔记→skill，含视频音轨转写+画面关键帧）已完成（2026-10-10，本地 commit，push 需用户另行授权）**；**T25 彻底删除「实验指导」功能 + 修复抖音笔记本乱码 已完成（2026-10-10，本地 commit，push 需用户另行授权）**；**T26 修复抖音重复源 + 知识总结产出模式（skill kind）+ 全局「Skill 库」面板（列表+资源管理器打开）已完成（2026-10-10，本地 commit，push 需用户另行授权）**；待认领 open=T12 应用内 OCR / T13 长文上下文 / T14 交付验收 / T8b skill 铺开。**方向（2026-10-10）：把研习伴从"工具"升级为"agent"——T20 落地"资料→skill"（产出可移植 SKILL.md + gap 清单 + agentRun 报告）；T21 补齐前半段：`scripts/experiment_pipeline.py` 驱动 + `POST /api/agent/pipeline`（spawn 驱动，异步）+ `/result` 回写 + `/agent/runs` 过滤，使 agent 给一行关键词即可自动跑 采集[可选]→OCR→导入→建本→聚焦笔记→skill→gap→结构化报告（默认 reuse 不启浏览器，`crawl:true` 才启 MediaCrawler 需 9222 已登录 Edge）；T22 把这条管线接到 UI——工作区第 5 个「实验 Agent」tab（T23 后降为侧栏 dialog）；**T24 把信息源从"小红书关键词"扩到"任意 URL"**：`POST /api/agent/media {source: wechat|douyin|xhs-video, url}` 驱动 `scripts/url_pipeline.py`（wechat→`fetch_wechat.py` 纯标准库抓图文；douyin/xhs-video→`download_media.py` 用 yt-dlp+ffmpeg 下视频+抽 16kHz 音轨+抽关键帧）→ 音轨经 faster-whisper 转写 + 关键帧供视觉 LLM → 建本→导入→整理笔记→skill。抖音真实 URL 活体验收已完成（移动接口直连，见 Last verified state）；下一个自然切片=小红书视频真实 URL 活体验收（需小红书登录 cookies）/ crawl 活体验收（需用户 Edge/CDP）/ open=T13 长文上下文。**
- **Last verified state**：2026-10-10 三关键词各 8 篇，24 篇/131 张图片完整性验证通过，全部 OCR 与 API 导入（各笔记本 8 份）；真实界面可见，草稿和共读回答有来源引用。新增采集测试 3/3、导入测试 2/2；应用业务代码未变，18/18 回归结果沿用此前记录。8765 当前运行单实例。T16 已核验：前端 A–G 七项活体逐一通过（含 375px 窄屏脚注换行零溢出、空笔记本 CTA、skill 描述、历史只读往返），并修掉 `app.js` `loadRevision` 缺 `async` 的确定性语法错误；`node --check` 过、全程无 store 写入、单实例 8765。T17 已核验：笔记默认「阅读」态把 markdown 渲染成排版文本（标题/加粗/列表/引用，格式符号不再裸露），阅读↔编辑往返正确；阅读态与编辑态选中一段均触发右侧共读回显；保存仍读隐藏编辑框的值（阅读态也能保存）；控制台零报错、`node --check` 过、单实例 8765。T19 已核验：笔记本「小红书实验学习 · 酵母转化」8 条来源全保留；两版本 head 行核对——新版 `aec8d9be`=`## 酵母转化实验学习笔记`（正文=转化目的/LiAc-PEG 原理/分步参数/待核对+末尾"相关但不同技术"列双杂交·单杂交），旧版 `80e666b9`=`…酵母双杂交检测蛋白互作`（保留为只读历史）；`/api/chat` 自定义问题经词元排序使 evidence 偏向纯转化来源；单实例 8765 未双开。**T20 已核验**：单实例 8765 对「酵母转化」笔记本 `POST /api/agent/skill` → 201 `status:done`/`reused:false`，产出 `skills/yeast-liac-peg-transformation.md`（frontmatter + **12 步**纯转化 SKILL.md，非双杂交），`portable:true`/`format:"Agent Skills (SKILL.md)"`，**gapCount:4**（确定性提取待核对）；二次 run `reused:true` 同 path 无 `-2`；`GET /api/skills` 列出该 skill；`/api/skill-ask` 加载后问"加入质粒后下一步"→ 定位步骤 5 给 30℃ 孵育→42℃ 热激 + 安全；`GET /api/agent/runs?notebookId=` 列出两条 run（reused false→true）；`node --test tests/*.test.mjs` 24/24 无回归；单实例 8765 未双开。**T21 已核验**：`node --check` 过、`node --test tests/*.test.mjs` **32/32**（新增 pipeline 8 项：空/超长 goal 400、合法 goal→202 且驱动参数携带 `--goal/--api/--run-id`、`crawl/force` 透传 `--crawl/--force-skill`、`/result` done→run 翻 done+存 notebook+result、`/result` failed→记 error、未知 runId 404、`?kind`·`?id` 过滤）无回归；活体单实例 8765：`POST /api/agent/pipeline {"goal":"PCR 实验"}`（UTF-8 body）→ 202 → reuse 复用 8 篇（OCR 缓存命中 `skipped:8/failed:0`）→ 2642 字笔记 → 复用 skill `pcr-qpcr-colony-pcr`（5 步/8 gap）→ `status:done`、报告齐全；失败路径 `goal:"yeast transformation"`（无数据）→ run `status:failed` + `error` 如实。CJK 排障：早期 goal 变 `PCR ʵ验` 系 **Git Bash 把手敲 CJK 按 GBK 传 `curl -d`**（raw `ca b5 d1 e9`）所致，非代码缺陷；`curl -d @utf8.json` 后原样到达（`body()` 本就 UTF-8）。crawl 活体未做（需 9222 已登录 Edge，会撞风控/占用户环境），仅验证参数构造。**T22 已核验**：`node --check public/app.js` 过；`node --test --test-concurrency=1 tests/*.test.mjs` **32/32**（纯前端改动，零后端/接口/store 改动，无回归）。浏览器活体（单实例 8765，预览面板）：「实验 Agent」tab 正常渲染（goal 输入 + ☑重新采集默认关 + ▶开始跑）；`goal:"酵母转化"`（reuse，不启浏览器）提交 → 202 runId → 轮询 ~20s → `status:done`，报告渲染 `✓ 运行完成` + summary（采集[reuse]→导入 0 篇/跳过 8→整理笔记→生成 skill `yeast-liac-peg-transformation` 12 步 4 项待核对）+ 4 格 steps + 待核对清单 4 条（`【步骤 1 · Carrier DNA 预处理】参数：95℃…`/`【步骤 5 · 加入质粒】…`/`【步骤 11 · 涂板筛选】…`，`g.where` 前缀正确）；点「去实验指导问答 →」→ 切「实验指导」tab + `skillSelect` 自动选中 `yeast-liac-peg-transformation` + description 显示；控制台零报错。**活体发现并修 1 处确定性前端 bug**：gap 列表项误写 `node('li','',prefix)+g.text`（`element+string` 隐式 `String(element)` 把 `[object HTMLLIElement]` 拼到每条 gap 文本前）→ 改 `node('li','',prefix+g.text)`（`+g.text` 移入 `node()` 内），修后 gap 干净渲染。**T24 已核验**：`node --check server.mjs public/app.js` 过；`npm test` **37/37**（新增 5 项 media：非法 source 400 / 非法 url 400 / 合法 media run→202 + 驱动参数 `--source/--url/--api/--run-id` 正确 + run 落库(kind=pipeline, mode=url, source, running) / `--goal`+`--cookie-file` 透传 / `/result` 回调翻 done；既有 32 项无回归）。浏览器活体（单实例 8765，预览面板）：`#agentSource` 下拉切 keyword↔URL 字段显隐正确（**发现并修** `#agentGoal` 静态 `required` 阻断 URL 模式提交 → `syncAgentMode()` 动态切 required）；提交 → `POST /api/agent/media` 202 → run 创建 → 轮询；**完整微信图文管线活体跑通**（fetch_wechat 抓取→导入 424 字→建「微信实验学习 · …」本→整理笔记→生成 skill 诚实判「unidentified-experiment-pending-review」+ 9 项待核对 gap 不臆造→回调 run done），无失败请求。**抖音视频真实 URL 活体验收已完成**（2026-10-10）：用户真实分享链接 `v.douyin.com/AIQHoOS3qQw/` → 桌面 UA 解析短链得 `aweme_id=7694592823139503403` → `download_media.py` 改走**移动接口 `aweme/v1/aweme/detail` + CDN 直链**（绕过 yt-dlp 网页接口被 X-Bogus 反爬 403；导出 cookies 缺 `msToken` 致网页接口 "Fresh cookies needed"）→ 13.6MB/5:46 mp4 → faster-whisper 转写 2268 字 → 来源 2715 字 → 笔记 3227 字（rev 12）→ 生成可移植 skill `multi-ai-agent-concurrency-conflict-prevention`（6 步，`/api/skills` 已列、落盘），浏览器确认笔记渲染 + 共读指出转写歧义。小红书视频下载路径仍待活体（需小红书登录 cookies）。yt-dlp 现作为抖音/小红书回退路径保留于 `tools/.venv-dl`。
- **Code baseline**：本轮基于 main/f5c71fd（独立 OCR worker）；新增 scripts/import_xhs.py、测试与操作文档。接手重新读 Git HEAD。
- **Current blocker**：采集导入链路无阻塞；应用内一键 OCR 尚未接入，共读长文预算限制仍需 T13 处理。关键词检索结果未逐篇验证实验适用性。
- **Next safe action**：agent 方向已按"先做一条端到端切片"原则落地 T20（资料→skill 后半段）+ T21（前半段 goal→…→skill 管线）+ T22（前端「实验 Agent」tab 一键触发 + 报告 + 跳实验指导），前后两段 + UI 入口已串成"一行关键词→…→可移植 skill→问答指导"的完整闭环；**T24 再把信息源从"小红书关键词"扩到"任意 URL"**（微信图文/抖音·小红书视频，视频取音轨转写 + 画面关键帧）。下一切片候选（按价值/依赖排）：①小红书视频**真实 URL 活体验收**（需小红书登录 cookies.txt；抖音已于 2026-10-10 活体验收，`download_media.py` 走移动接口直连绕过 X-Bogus）；②crawl 活体验收（需用户 9222 已登录小红书的 Edge/CDP，会撞风控/占用户环境，另行安排）；③open=T13 长文上下文（也限制 T19 笔记与 T20/T21/T22/T24 skill 的材料预算）/ T12 应用内 OCR 可并行。复用运行中的服务（8765 单实例），避免双开共享 store。T16 已 push；T17/T18/T20/T21/T22/T23/T24 已本地 commit，push 需用户另行授权（10+ 本地 commit 未 push）。
- **Files involved**：server.mjs、public/*、transcription.mjs、asr_worker.py、tts.mjs、tts_worker.py、scripts/experiment_pipeline.py、scripts/url_pipeline.py、scripts/download_media.py、scripts/fetch_wechat.py、scripts/import_xhs.py、skills/*、tests/*。

## 已实现及证据等级

| 范围 | 当前代码能力 | 验证依据 |
|---|---|---|
| M0 模型基础 | 内置 faster-whisper-small CPU int8 + OpenCC；本地 LLM；edge-tts 朗读 | 历史真实模型联调已记录；本轮只核对代码、配置和模型文件 |
| M1 资料与来源 | 250 MB 流式上传、哈希去重、转写队列、取消/重试、校对版本、时间戳及媒体 Range | 本轮相关自动测试通过；历史约 72 秒合成语音/视频验证，不能外推为一小时性能保证 |
| M2 笔记共读 | 笔记版本、草稿、选区问答、短历史、引用标识校验 | 自动测试及历史联调；笔记块证据映射、全文检索未完成 |
| M3 语音 | 设备选择、录音/文件提问、取消、权限提示、中文朗读和 Markdown 清洗 | 历史浏览器与模型验证；本轮未重新使用麦克风或云端服务 |
| M4 学习与交付 | 疑问状态、Markdown 导出 | 缺复述练习、备份恢复 UI、完整 20 问及工作台集成 |
| 扩展实验 skill | skills/*.md、列表、生成、问答、同名保护、朗读 | 7 个相关单测及历史联调；不是已完成自动路由或 checklist |
| OCR | 已提交独立 worker + scripts/import_xhs.py 命令行 OCR/导入 | 24 篇真实图文已识别导入；尚无应用内图片/PDF 上传 OCR 路由 |

## 当前架构、配置与约束

- 唯一开发目录：`C:\Users\a1440\Desktop\Study companion`。此前工作区 `output/研习伴/dev-stage` 是旧暂存，禁止用它覆盖本目录。
- Node 原生 HTTP 服务；零 npm 运行时依赖；元数据 JSON，媒体文件存磁盘，schema 2。
- 配置核对：LLM `http://127.0.0.1:18081/v1` / `local-qwen38-gsq`；ASR `builtin`；TTS 音色 `zh-CN-liaoning-XiaobeiNeural`。这不是服务在线证明。
- ASR 每次识别 `spawn` 独立 Python worker，并重新加载模型。历史“常驻 worker”表述有误，以当前代码为准。
- TTS 当前使用 edge-tts 云端服务与 ffmpeg；需联网且发送朗读文本。旧 Kokoro 实现已被替换，不能称当前 TTS 完全本地或描述为本地模型冷加载。
- 当前共读来源预算 1800 字符、笔记前 800 字符、选区 500 字符、历史最近 2 条每条 300 字符，输出 max_tokens=4000。18081 模型上下文更大，不代表代码会自动使用完整笔记。
- 共读 `/api/chat` 额外把 top 来源**原图**（最多 4 张，OpenAI 视觉 base64 `image_url`）随材料发给 18081 VLM；仅 XHS 导入来源（`content` 含 `图片目录：` 行）贡献图，纯文本来源回退纯文本；`/api/generate`·`/api/skill-ask` 不送图。依赖本地 VLM 理解图像（已活体核验，能发现 OCR 与原图的单位差异）。
- 转写重启后标 interrupted，重试从头开始；无断点续传。
- 当前删除为实际删除，非回收站；不要向用户承诺可在 UI 恢复。
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
