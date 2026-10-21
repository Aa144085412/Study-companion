"""Recompute descriptive counts. Does not pretend to automate semantic expert grading."""
import json, hashlib
from pathlib import Path
from collections import Counter

BASE=Path(__file__).resolve().parents[1]
review=json.loads((BASE/'evaluation/2026-10-21/review.json').read_text(encoding='utf-8'))
folder=BASE/'data/pipeline-v2'/review['pipeline_id']
a=json.loads((folder/'artifact.json').read_text(encoding='utf-8'))
assert hashlib.sha256((folder/'artifact.json').read_bytes()).hexdigest()==review['artifact_sha256'], 'Baseline changed; re-review required'
questions=json.loads((folder/'verified-quiz.json').read_text(encoding='utf-8'))
counts=Counter(x['status'] for x in review['benchmark'])
facts={f['id']:f for f in a['facts']};evidence={e['id']:e for e in a['evidence']}
for b in review['benchmark']:
 assert b['evidence'] and all(e['id'] in evidence for e in b['evidence'])
 assert all(f in facts for f in b['fact_ids'])
assert {x['fact_id'] for x in review['fact_reviews']}==set(facts)
quotes=[q for f in a['facts'] for q in f['evidence_quotes']]
matched=sum(q['evidence_id'] in evidence and q['quote'] in evidence[q['evidence_id']]['text'] for q in quotes)
black={'SINGLE_RUN_METRIC','UNRESOLVED_CONFLICT','PENDING_VERIFICATION','VISUAL_INFERENCE','HIGH_RISK_ISOLATED_NUMBER','UNKNOWN_VISUAL_ROLE','NOISE','LOW_CONFIDENCE','EXTRACTION_DISAGREEMENT'}
quiz_ok=sum(all(fid in facts and facts[fid]['layer']=='CORE' and facts[fid]['knowledge_type']=='GENERAL_PRINCIPLE' and not(black & set(facts[fid]['flags'])) for fid in q['fact_ids']) for q in questions)
metrics=dict(checklist_items=len(review['benchmark']),coverage=dict(counts),full_coverage=counts['FULL']/len(review['benchmark']),recognizable_coverage=(counts['FULL']+counts['PARTIAL'])/len(review['benchmark']),fact_cards=len(facts),literal_quotes_matched=matched,literal_quotes_total=len(quotes),quiz_whitelist_pass=quiz_ok,quiz_total=len(questions),reviewed_frames=len(review['visual_frames']))
(BASE/'evaluation/2026-10-21/metrics.json').write_text(json.dumps(metrics,ensure_ascii=False,indent=2),encoding='utf-8')
lines=['# 笔记准确性首轮评估','', '日期：2026-10-21；冻结版本：`8610803`；产物：`'+a['pipeline_id']+'`。','',
'## 结论','',
'当前版本已具备限制错误进入核心题库的工程门禁，但还不能作为完整课程笔记验收通过。本轮主要问题是遗漏、可用视觉证据被排除、单次标签与概括措辞冲突，以及审计解释自身的概念混淆。不能把下面的覆盖率叫作整个系统的准确率。','',
'## 方法与限制','',
'这是Codex基于证据的首轮诊断，不是人工专家金标准。我读取了整课可用字幕时间线、12张事实的引文与相邻证据、最终审计记录，并直接视读8张已保存原片帧；未逐段听原始音频。30项清单是在查看笔记后构建，存在选择偏差，只能用于探索性诊断；尚未完成预先冻结的留出集、双人标注、跨课程抽样或重复运行稳定性测试。','',
'本次没有修改提示词、生产笔记、题库或用户答题记录。脚本验证引用ID、哈希和计数，语义判断保存在review.json供人工复核。所有知识点均按“本课表达”评估，不能据此直接执行实验。','',
'## 计数结果','', '| 项目 | 结果 | 含义 |','|---|---|---|',
f"| 探索性内容覆盖 | 完整{counts['FULL']}/30；部分{counts['PARTIAL']}/30；缺失{counts['MISSING']}/30 | 严格覆盖{metrics['full_coverage']:.1%}；含部分提及{metrics['recognizable_coverage']:.1%}，不是准确率 |",
f"| 引文逐字匹配 | {matched}/{len(quotes)} | 仅证明字符串来自保存证据，不证明归纳正确 |",
f"| 核心白名单 | {quiz_ok}/{len(questions)}题符合 | 未见从待核对或单次数据出题 |",
'| 正文肯定陈述的来源忠实性 | 8张核心/情境卡中7张未发现明显新增泛化，1张存在泛化 | 纳入邻近证据后的卡片级描述；不是逐原子断言的统计准确率 |',
'| 两张核心卡 | 本轮未发现明确事实错误，官方资料可支持其概念 | n=2太小，不能推出零错误率或系统可靠性 |',
'| 审计降级3项 | 3项均有不宜无条件泛化的理由；其中1项解释混淆浓度层级 | 正确降级不代表解释全对 |',
'| 其余指标 | 参数准确率、审计召回率/误拦率、归因准确率暂不报百分比 | 尚无充分独立真值集合，不能制造精确数字 |','',
'## 可复现缺陷','',
'### P1：清晰字幕被未知画面类别封锁','',
'25:30与25:34的画面中央明确写有“发现这个位置存在两种不同的碱基”“也就是说这个质粒可能不纯”。对应 E3cb2bf49a7f23e99、Ea4b7416376b67b97 被标为UNKNOWN_VISUAL_OCR，Map排除；审计只收到错误ASR“剪辑”“质力可能不存”。因此这里不仅是保守审计，也是证据检索/分类失效。正确修复方向是按区域/文字功能分类，按同一时间邻域回查所有候选模态，确认后再引用；不能直接把所有UNKNOWN升级为可信。','',
'定位：src/evidence_cleaner/index.mjs:29、:45；src/note_synthesizer/index.mjs:34；src/attribution_auditor/index.mjs 的refsFor仅扩展已对齐ID。','',
'### P1：审计解释混淆复溶液浓度与PCR终浓度','',
'04:46–05:05说的是引物交付/加水后的溶液；审计引入PCR反应体系的终浓度来反驳。两者不能直接比较。干粉存在已配溶液例外、指定浓度不应推广，足以支持保留场景边界；不需要引入不同层级的参数来论证。NEB官方明确将其建议标为Final concentration。建议参数Schema增加quantity_role、对象、阶段和来源，不仅记录value/unit。见[NEB PCR优化指南](https://www.neb.com/ja-jp/tools-and-resources/usage-guidelines/guidelines-for-pcr-optimization-with-taq-dna-polymerase)。','',
'### P1：课程主干内容遗漏','',
'下表19项完全缺失。特别是模板类型与cDNA来源、纯化路径选择依据、载体对照、视频明确省略的步骤以及后续测序验证。这些不能靠多出几道题补救。每批最多6卡的上限、引用失败直接丢弃、UNKNOWN过滤都可能贡献遗漏；仅凭本轮不能量化各自因果贡献。应先按章节做覆盖清单与缺项回查，再决定摘要预算。','',
'### P2：单次标签与句内概括矛盾','',
'07:13–07:18原片表达本次等待估计。卡F392560ca955251bb写“琼脂糖凝胶通常需要二三十分钟凝固”，新增“通常”。即使外层标为单次示例数据，初学者仍可能读成通则。建议改为“本次演示中，讲者预计等待约二三十分钟”，并附上前一句说明对象的证据。','',
'### P2：参数结构遗漏与字幕污染','',
'F9471885eb2130f10正文同时比较厂家声称与个人习惯，但parameters只存10 s/kb而未存另一值，冲突检测无法完整利用结构数据。05:57帧的SUBTITLE_OCR同时混入PCR仪按钮和RampRate数字；当前两条核心句没使用这些数字，但类型分离并未真正完成。建议按文本区域分离，而不是把整条OCR记录当作一种证据。','',
'## 外部概念核验（仅本轮人工可复核的查阅，不回写生产认证）','',
'- 引物Tm用于退火温度选择有官方依据；不能解释为忽略反应体系。[NEB PCR优化指南](https://www.neb.com/ja-jp/tools-and-resources/usage-guidelines/guidelines-for-pcr-optimization-with-taq-dna-polymerase)。',
'- UV可能损伤DNA、对照与间隔泳道有教学依据。[Addgene限制性克隆指南](https://blog.addgene.org/plasmids-101-restriction-cloning)。',
'- KOD One当前官方页面按片段范围给出不同延伸条件。因此笔记的5/10对照仅能当视频观点，不应替代厂家现行说明；未用当前页面追溯判定旧视频当年的说明错误。[TOYOBO产品页](https://lifescience.toyobo.co.jp/detail/detail.php?product_detail_id=241)。',
'- NEB colony-PCR页面本次打开未返回正文，不作为已核验来源。','',
'## 30项探索性覆盖清单','', '| ID | 时间/秒 | 应保留的课内内容 | 判定 |','|---|---|---|---|']
labels={'FULL':'完整','PARTIAL':'部分/仅待核对','MISSING':'缺失'}
for b in review['benchmark']:lines.append(f"| {b['id']} | {b['start']}–{b['end']} | {b['target']} | {labels[b['status']]} |")
lines+=['','## 12张事实逐项评语','']
for r in review['fact_reviews']:lines += [f"- `{r['fact_id']}` [{r['layer']}] {r['statement']}",f"  - {r['status']}：{r['review_note']}"]
lines+=['','## 下一轮验收顺序','',
'1. 由领域熟悉者复核本清单与判定，尤其浓度角色和适用条件；冻结为开发集。另选未看过的课程片段建立独立留出集。',
'2. 优先修复同时间视觉证据召回、参数语义角色、章节覆盖缺口，再评估改动前后；本轮不边修边改基线。',
'3. 两版用同一材料匿名评分；分别报告来源忠实性、学科正确性、覆盖和审计误判。增加另一领域真实课程并重复运行后，再谈产品级准确率。','',
'复算：`.venv-ocr\\Scripts\\python.exe scripts/evaluate_notes.py`。此命令校验冻结产物并重新计算已标注清单，不调用模型，不制造人工评分。','']
(BASE/'docs/笔记准确性首轮评估.md').write_text('\n'.join(lines),encoding='utf-8')
print(json.dumps(metrics,ensure_ascii=True,indent=2))
