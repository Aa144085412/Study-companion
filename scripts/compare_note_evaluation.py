"""Compare a frozen exploratory checklist with explicit post-fix reviews. No LLM grading."""
import argparse,json,hashlib
from pathlib import Path
from collections import Counter
BASE=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--review',required=True,type=Path);x=p.parse_args()
before=json.loads((BASE/'evaluation/2026-10-21/review.json').read_text(encoding='utf-8'))
after=json.loads(x.review.read_text(encoding='utf-8'))
run=BASE/'data/pipeline-v2'/after['pipeline_id']
a=json.loads((run/'artifact.json').read_text(encoding='utf-8'))
assert hashlib.sha256((run/'artifact.json').read_bytes()).hexdigest()==after['artifact_sha256']
assert {r['id'] for r in after['ratings']}=={r['id'] for r in before['benchmark']}
assert len(after['ratings'])==len(before['benchmark'])
facts={f['id']:f for f in a['facts']}
for r in after['ratings']:
 assert r['status'] in {'FULL','PARTIAL','MISSING'} and r['reason']
 assert all(fid in facts for fid in r['fact_ids'])
 if r['status']=='FULL':assert r['fact_ids']
b=Counter(r['status'] for r in before['benchmark']);c=Counter(r['status'] for r in after['ratings'])
evidence={e['id']:e for e in a['evidence']}
quotes=[q for f in a['facts'] for q in f['evidence_quotes']]
matched=sum(q['evidence_id'] in evidence and q['quote'] in evidence[q['evidence_id']]['text'] for q in quotes)
assigned=[fid for cluster in a['clusters'] for fid in cluster['fact_ids']]
assert len(assigned)==len(facts) and set(assigned)==set(facts), 'Final clusters lost or duplicated a fact'
metrics={'before':dict(b),'after':dict(c),'pipeline_id':a['pipeline_id'],'reviewer':'Codex exploratory development-set review, not human gold standard','literal_quotes':{'matched':matched,'total':len(quotes)},'facts':len(facts),'layers':dict(Counter(f['layer'] for f in a['facts']))}
assert matched==len(quotes), 'Final quote no longer matches evidence'
x.review.with_name('post-fix-metrics.json').write_text(json.dumps(metrics,ensure_ascii=False,indent=2),encoding='utf-8')
lines=['# 笔记质量修复回归','',f"修复前：`{before['pipeline_id']}`；修复后：`{a['pipeline_id']}`。",'',
'同一份30项开发清单、同一真实课程。判定由Codex根据最终笔记逐项复核，脚本仅检查证据ID并计数。清单不是盲评留出集，不是人工专家金标准；覆盖率不是准确率。','',
'| 覆盖 | 修复前 | 修复后 |','|---|---|---|',f"| 完整 | {b['FULL']}/30 | {c['FULL']}/30 |",f"| 部分 | {b['PARTIAL']}/30 | {c['PARTIAL']}/30 |",f"| 缺失 | {b['MISSING']}/30 | {c['MISSING']}/30 |",'',
'## 已实现修复','',
'- 对缺少字幕伙伴的ASR时间片优先做真实图像文字角色判断，允许中央字幕；保留原始OCR，模型选出的文字必须逐字存在于OCR候选中。未知文字不会直接升级。',
'- 审计回查同媒体相邻时间的所有非噪声模态，保留UNKNOWN/VLM风险标签。',
'- 参数新增quantity_role/stage/object/source_scope，比较同角色、同阶段、同对象、同来源的量；独立参数审计检查先前审计意见。',
'- 单次数据使用引用原句构建陈述，防止总结器新增通常/必须等泛化。',
'- 缩小单批输入，增加独立遗漏检查和引用失败后的补提取；全局去重与冲突门禁仍保留。',
'- 事实ID包含参数和条件，避免不同参数共用ID。Reduce分组漏项按原主题保留、重复分配仅保留一次、未知ID拒绝，异常写入map-reduce.json的reduce_repairs；不将降级分组冒充模型成功统稿。','',
'## 本轮补充门禁','', '- 有限JSON数字兼容为字符串参数；非法引用仍拒绝，审计漏项保持待核对。', '- 正文不再展示未证实的模型审计理由和候选修正；单次数字按结构字段显示，混合ASR/画面引用只展示可定位的画面原句。', '- 选择题在盲解后增加答案及解析的来源蕴含检查，拒绝新增机制和缺失前提；检查结果随题保存，旧版本题目失效。','', '## 逐项复核','', '| ID | 内容 | 前 | 后 | 说明 |','|---|---|---|---|---|']
labels={'FULL':'完整','PARTIAL':'部分','MISSING':'缺失'}
for old in before['benchmark']:
 r=next(r for r in after['ratings'] if r['id']==old['id']);lines.append(f"| {r['id']} | {old['target']} | {labels[old['status']]} | {labels[r['status']]} | {r['reason'].replace('|','/')} |")
lines+=['','## 验收记录','']+['- '+s for s in after['checks']]
lines+=['','## 保留边界','',
'- 视觉分类仍有预算，不代表所有画面文字都被识别。只处理现有抽帧与ASR/OCR；没有重新识别整段音视频。',
'- 模型审计仍可能错误；当前没有自动外部标准认证。不同角色的参数若模型标错，依然需要证据复核。',
'- 未知证据、未裁决冲突、单次数据不进入核心题库。旧产物与评估基线未覆盖。','']
(BASE/'docs/笔记质量修复回归.md').write_text('\n'.join(lines),encoding='utf-8')
print(json.dumps(metrics,ensure_ascii=True))
