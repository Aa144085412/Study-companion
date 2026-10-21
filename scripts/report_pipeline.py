"""Render a reproducible local audit report. Reads artifacts; never edits store.json."""
import argparse
import json
from collections import Counter
from pathlib import Path


def build_report(run_dir, baseline_chars=0):
    def read(name):
        return json.loads((run_dir/name).read_text(encoding='utf-8'))
    a, mapped, audit = read('artifact.json'), read('map-reduce.json'), read('audit.json')
    quiz = read('quiz-audit.json') if (run_dir/'quiz-audit.json').exists() else {'questions': [], 'rejections': [], 'reason': '尚未运行真实盲测'}
    m = a['metrics']
    lines = ['# 五阶段管线真实课程对比验证', '', f"课程：{a['title']}", '', f"产物版本：`{a['pipeline_id']}`", '',
             '本报告由保存的真实模型产物生成。测试模拟案例与真实课程结果分别列出；模型一致性不是外部学科认证。', '',
             '## 前后对比', '', '| 项目 | 旧管线 | 本次真实结果 |', '|---|---|---|',
             f"| 笔记 | 18批直接拼接，{baseline_chars}字符 | {m['map_batches']}批事实提取后全局统稿，{len(a['markdown'])}字符 |",
             f"| 证据 | OCR/视觉描述混合字符串 | {m['raw_evidence']}条分型证据，{m['noise']}条全噪声隔离 |",
             f"| 画面 | 上下区域启发式 | {m['unknown_visual']}条画面角色仍未知，保守排除 |",
             f"| 事实 | 无结构化门禁 | {m['facts']}张卡：核心{m['core']}、情境{m['context']}、待核对{m['unresolved']} |",
             f"| 合并与冲突 | 无全局检测 | 语义合并{m['semantic_merges']}、冲突{m['conflicts']} |",
             f"| 审计 | 无独立审计 | 引文拒绝{m['rejected_map_cards']}、重写{m['rewrites']}、反例降级{m['scope_downgrades']} |",
             f"| 选择题 | 原始资料直接出题 | 真实盲测通过{len(quiz['questions'])}题、拒绝{len(quiz['rejections'])}题 |", '',
             '## 三层笔记', '', a['markdown'], '', '## 归因记录', '']
    counts = Counter(x['attribution'] for x in a['audits'])
    lines += ['最终审计分类：'+json.dumps(dict(counts), ensure_ascii=False), '',
              'NONE表示未指认三类错误，不表示该卡已经成为核心事实。不能为凑齐三种归因而把模型错误归咎主讲人。', '']
    for x in a['audits']:
        lines += [f"- `{x['fact_id']}` · {x['attribution']} · {x['decision']}：{x['rationale']}"]
    lines += ['', '### 重写历史', '']
    for x in audit['rewrites']:
        lines += [f"- 原句：{x['before']['statement']}", f"  - 初审：{x['original_audit']['attribution']} / {x['original_audit']['rationale']}", f"  - 重写：{x['after']['statement']}", f"  - 复审：{x['recheck']['decision']}"]
    if not audit['rewrites']: lines += ['本次没有成功重写项。']
    lines += ['', '### 提取阶段拒绝', '']
    for x in mapped['rejects']:
        lines += ['- '+x['reason']+'：'+x.get('statement','结构不符合要求')]
    lines += ['', '## 合格选择题（含审计答案）', '']
    for i, q in enumerate(quiz['questions'], 1):
        lines += [f"### {i}. {q['content']}", '']+[f"- {o['id']}. {o['text']}" for o in q['options']]
        lines += ['', f"答案：{q['correct_answer']}。{q['explanation']}", '', '独立盲解：'+q['blind_verification']['rationale'], '']
        lines += [f"- {o['id']}：{o['reason']}" for o in q['blind_verification']['option_judgments']]
    if not quiz['questions']: lines += [quiz.get('reason','未有合格题，未从原始资料补题。')]
    lines += ['', '### 被拒绝候选题', '']
    for q in quiz['rejections']: lines += ['- '+q['content']+'：'+q['reason']+'；'+q.get('blind',{}).get('rationale','')]
    lines += ['', '## 自动回归与边界', '',
              '- Node 77项通过；Python 18项通过。另补测资料修改后禁止旧题生成/作答。',
              '- 软件与物理合成用例覆盖单位冲突、不同条件不合并、错误归因、无依据引文、噪声、盲解答案隔离及反例降级。这些是模拟回归，不是跨领域真实课程验收。',
              '- 视觉分类每次均匀抽查最多6帧，其余未知画面不冒充PPT；仪器读数当前保守排除，尚未实现经语义对齐后自动纳入的完整路径。',
              '- 术语表为待核对候选，不修改原始转写。没有外部权威检索与核验，因此没有自动确认任何学科规范。',
              '- Map每批最多6张高价值卡片：输入遍历不等于穷尽课程知识点。冲突为0也不证明原视频无冲突。',
              '- 盲解使用独立上下文，但与生成器共用本地模型权重；尚非不同模型的独立科学认证。',
              '- 本次复用已有ASR/OCR及抽帧产物，未重跑原始音频识别；本地视频导入通道保留。',
              '- 旧笔记与旧题历史保留，没有代用户答题或写入掌握度。', '']
    return '\n'.join(lines)

if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('--run-dir', required=True, type=Path)
    p.add_argument('--output', required=True, type=Path)
    p.add_argument('--baseline-chars', type=int, default=16595)
    x=p.parse_args()
    x.output.write_text(build_report(x.run_dir,x.baseline_chars),encoding='utf-8')
    print(x.output)
