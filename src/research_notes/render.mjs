import {REASON_MESSAGES} from './index.mjs';

// All source content is text, including titles and quotes. Only our own anchors are HTML.
const inline = value => String(value ?? '').replace(/[\r\n\u2028\u2029]+/g, ' ')
  .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/[\\`*_{}\[\]()#+.!|~-]/g, '\\$&');
const links = quotes => [...new Set(quotes.map(q => q.label))]
  .map(label => `[${label}](#source-${label.toLowerCase()})`).join(' ');
const stamp = ms => `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}.${String(ms % 1000).padStart(3, '0')}`;

export function renderResearchReport(report) {
  const m = report.metrics;
  const lines = [`# ${inline(report.title)} · ${report.template === 'research' ? '科研报告整理' : '报告／会议材料整理'}`, '',
    '> 本文只编排原管线来源审阅结果，未重新执行语义审查或外部科学核验。栏目位置由操作者指定；来源陈述不等于会议共同决议。', '',
    '## 主题与整理范围', '',
    `来源管线：${inline(report.source_pipeline_id)}。来源要点 ${m.source_items} 条，待核对 ${m.pending_items} 条；这些计数不是准确率。`,
  ];
  if (report.provenance.data_kind === 'SYNTHETIC_DEVELOPMENT_ONLY') lines.push('', '> 合成开发样例：不是实际文献、真实会议或模型效果验收。');
  for (const section of report.sections) {
    lines.push('', `## ${section.title}`, '');
    if (!section.items.length) lines.push('材料未明确提及或尚未指定栏目，请核对原资料。');
    for (const item of section.items) {
      lines.push(`- **${inline(item.topic || item.fact_id)}**：${inline(item.statement)} ${links(item.evidence_quotes)}`);
      if (item.conditions.length) lines.push(`  - 来源中的条件：${item.conditions.map(inline).join('；')}`);
      for (const quote of item.evidence_quotes) lines.push(`  - 证据原句「${inline(quote.quote)}」 ${links([quote])}`);
    }
  }
  lines.push('', '## 明确结论／会议共同决议', '',
    '尚未确认。首阶段不将来源观点、研究结果或建议自动升级为会议共同决议。', '',
    '## 行动项', '', '尚未确认。任务、责任人、截止日期均留待人工核对；不从参会名单或“下次讨论”推断。', '',
    '## 文献信息', '', '标题、作者、年份、DOI尚未核验；本报告标题不作为文献元数据。', '',
    '## 争议与待核对', '');
  if (!report.pending.length) lines.push('本次输入未触发新增隔离项；仍需人工核对原资料，不能据此判定无错误。');
  for (const item of report.pending) {
    lines.push(`- **${inline(item.topic || item.fact_id)}**（${inline(item.fact_id)}）：${item.reason_codes.map(code => REASON_MESSAGES[code]).join('；')}。 ${links(item.evidence_quotes)}`);
  }
  lines.push('', '## 证据索引', '');
  if (!report.evidence_index.length) lines.push('没有可用证据索引。');
  for (const evidence of report.evidence_index) {
    lines.push(`<a id="source-${evidence.label.toLowerCase()}"></a>`, '',
      `### ${evidence.label} · ${inline(evidence.title || evidence.sourceId || '未命名资料')}`, '',
      `来源 ${inline(evidence.sourceId)} · 段落 ${inline(evidence.segmentId || '未提供')} · 媒体 ${inline(evidence.mediaId || '无')} · 类型 ${inline(evidence.sourceType)}`);
    if (!evidence.timeValid) lines.push('时间范围无效，须回到原资料定位。');
    else if (evidence.start !== null) lines.push(`时间 ${stamp(evidence.start)} → ${stamp(evidence.end)}（${evidence.start}–${evidence.end} 毫秒）${evidence.playbackAvailable ? '' : '；缺少媒体ID，不能直接回放'}。`);
    else lines.push('原资料未提供媒体时间戳，保留文档/段落定位。');
    if (evidence.page !== null) lines.push(`页码：${evidence.page}。`);
    lines.push('', '**原始文字（可能包含识别错误，不作为已确认结论）**', '');
    for (const line of evidence.rawText.split(/\r?\n/)) lines.push(`> ${inline(line)}`);
    if (evidence.text !== evidence.rawText) {
      lines.push('', '**管线清洗文字**', '');
      for (const line of evidence.text.split(/\r?\n/)) lines.push(`> ${inline(line)}`);
    }
    lines.push('');
  }
  return lines.join('\n').trimEnd() + '\n';
}
