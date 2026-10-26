import {BLOCK_FLAGS, hash, norm} from '../pipeline/common.mjs';

export const REPORT_VERSION = '1.0.0';
export const REASON_MESSAGES = Object.freeze({
  UNREVIEWED: '原事实尚未通过来源审阅',
  AUDIT_NOT_ACCEPTED: '审计缺失、重复或未接受该事实',
  UNRESOLVED_CONFLICT: '原管线仍记录未裁决冲突',
  RISK_FLAG: '原事实带有未核实或高风险标记',
  SINGLE_RUN: '单次演示数据需要人工核对其对象与适用范围',
  INVALID_FACT: '事实字段不完整，无法安全编排',
  NO_QUOTES: '没有可核对的证据原句',
  MISSING_EVIDENCE: '引用的证据不存在',
  QUOTE_MISMATCH: '引用未在原始和清洗文本中同时匹配',
  UNSUPPORTED_SOURCE: '仅有视觉推断、不明画面或仪器信息',
  LOW_QUALITY_EVIDENCE: '证据为噪声、低可信或缺少原始文字',
  INVALID_TIME_RANGE: '时间范围不完整、倒置或无效',
});

const SOURCE_TYPES = new Set(['DOCUMENT_TEXT', 'ASR_TRANSCRIPT', 'SUBTITLE_OCR', 'SLIDE_DOCUMENT_OCR']);
const RESEARCH_SECTIONS = [
  ['research_question', '研究问题'], ['methods', '方法概述'], ['results', '来源报告的结果'],
  ['limitations', '局限'], ['discussion', '讨论'], ['topics', '尚未分类的来源要点'],
];
const MEETING_SECTIONS = [['topics', '按议题整理的来源要点']];
const text = value => typeof value === 'string' && value.trim().length > 0;
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);

function uniqueRecords(records, name) {
  const result = new Map();
  for (const record of records) {
    if (!object(record) || !text(record.id) || result.has(record.id)) {
      throw Error(`${name}必须有不重复的非空id`);
    }
    result.set(record.id, record);
  }
  return result;
}

function validateArtifact(artifact) {
  if (!object(artifact) || artifact.schema_version !== '2.0' || !text(artifact.pipeline_id) || !text(artifact.title)) {
    throw Error('需要原五阶段管线的schema_version=2.0审计产物及pipeline_id、title');
  }
  for (const key of ['facts', 'evidence', 'audits', 'conflicts']) {
    if (!Array.isArray(artifact[key])) throw Error(`审计产物缺少数组${key}`);
  }
  const facts = uniqueRecords(artifact.facts, '事实'), evidence = uniqueRecords(artifact.evidence, '证据');
  const conflicts = new Set();
  for (const conflict of artifact.conflicts) {
    if (!object(conflict) || !Array.isArray(conflict.fact_ids) ||
        conflict.fact_ids.some(id => !facts.has(id))) throw Error('冲突记录引用了无效事实');
    if (conflict.status !== 'RESOLVED_CONTEXT') for (const id of conflict.fact_ids) conflicts.add(id);
  }
  return {facts, evidence, conflicts};
}

function timeRange(evidence) {
  const start = evidence.start_time ?? null, end = evidence.end_time ?? null;
  if (start === null && end === null) return {valid: true, start: null, end: null};
  if (typeof start !== 'number' || typeof end !== 'number' || !Number.isFinite(start) ||
      !Number.isFinite(end) || start < 0 || end <= start || Math.round(end * 1000) <= Math.round(start * 1000)) {
    return {valid: false, start: null, end: null};
  }
  return {valid: true, start: Math.round(start * 1000), end: Math.round(end * 1000)};
}

function inspectFact(fact, artifact, evidence, conflicts) {
  const reasons = new Set();
  if (!text(fact.statement) || !Array.isArray(fact.flags) || !Array.isArray(fact.conditions) ||
      fact.conditions.some(condition => typeof condition !== 'string') ||
      (Array.isArray(fact.flags) && fact.flags.some(flag => typeof flag !== 'string')) ||
      !['GENERAL_PRINCIPLE', 'CONDITIONAL_PRACTICE', 'SINGLE_RUN_METRIC', 'SOURCE_CLAIM'].includes(fact.knowledge_type)) {
    reasons.add('INVALID_FACT');
  }
  if (!['CORE', 'CONTEXT'].includes(fact.layer) ||
      !['MODEL_REVIEWED', 'EXTERNALLY_VERIFIED'].includes(fact.verification)) reasons.add('UNREVIEWED');
  const audits = artifact.audits.filter(a => object(a) && a.fact_id === fact.id);
  if (audits.length !== 1 || audits[0].supported !== true || audits[0].attribution !== 'NONE' ||
      !['ACCEPT', 'CONTEXT_ONLY'].includes(audits[0].decision) ||
      !['MODEL_REVIEW', 'EXTERNAL_REFERENCE'].includes(audits[0].certainty)) reasons.add('AUDIT_NOT_ACCEPTED');
  if (conflicts.has(fact.id)) reasons.add('UNRESOLVED_CONFLICT');
  if (Array.isArray(fact.flags) && fact.flags.some(flag => BLOCK_FLAGS.includes(flag))) reasons.add('RISK_FLAG');
  if (fact.knowledge_type === 'SINGLE_RUN_METRIC') reasons.add('SINGLE_RUN');
  const quotes = Array.isArray(fact.evidence_quotes) ? fact.evidence_quotes : [];
  if (!quotes.length) reasons.add('NO_QUOTES');
  for (const quote of quotes) {
    if (!object(quote) || !text(quote.quote)) { reasons.add('NO_QUOTES'); continue; }
    const source = evidence.get(quote.evidence_id);
    if (!source) { reasons.add('MISSING_EVIDENCE'); continue; }
    if (!SOURCE_TYPES.has(source.source_type)) reasons.add('UNSUPPORTED_SOURCE');
    if (!text(source.source_id) || !text(source.raw_text) || !text(source.text) || source.noise !== false ||
        !Array.isArray(source.flags) || source.flags.some(flag => BLOCK_FLAGS.includes(flag)) ||
        (source.confidence != null && (typeof source.confidence !== 'number' ||
          !Number.isFinite(source.confidence) || source.confidence < 0.8 || source.confidence > 1))) {
      reasons.add('LOW_QUALITY_EVIDENCE');
    }
    if (!norm(quote.quote) || !norm(source.raw_text).includes(norm(quote.quote)) ||
        !norm(source.text).includes(norm(quote.quote))) reasons.add('QUOTE_MISMATCH');
    if (!timeRange(source).valid) reasons.add('INVALID_TIME_RANGE');
  }
  return [...reasons];
}

function sectionAssignments(outline, definitions, facts) {
  if (!object(outline)) throw Error('栏目映射必须是对象：栏目id对应事实id数组');
  const allowed = new Set(definitions.map(([id]) => id)), assigned = new Map();
  for (const [section, ids] of Object.entries(outline)) {
    if (!allowed.has(section) || !Array.isArray(ids)) throw Error(`不支持的栏目映射：${section}`);
    for (const id of ids) {
      if (!facts.has(id) || assigned.has(id)) throw Error(`栏目引用不存在或重复分配的事实：${id}`);
      assigned.set(id, section);
    }
  }
  return assigned;
}

/** A read-only business projection. It never extracts facts or certifies meeting decisions. */
export function buildResearchReport(artifact, {template = 'research', outline = {}} = {}) {
  if (!['research', 'meeting'].includes(template)) throw Error('模板只支持research或meeting');
  const {facts, evidence, conflicts} = validateArtifact(artifact);
  const definitions = template === 'research' ? RESEARCH_SECTIONS : MEETING_SECTIONS;
  const assignments = sectionAssignments(outline, definitions, facts);
  const referenced = new Set();
  for (const fact of facts.values()) for (const quote of Array.isArray(fact.evidence_quotes) ? fact.evidence_quotes : []) {
    if (object(quote) && evidence.has(quote.evidence_id)) referenced.add(quote.evidence_id);
  }
  const evidenceIndex = [...evidence.values()].filter(e => referenced.has(e.id)).map((e, i) => {
    const time = timeRange(e);
    return {
      label: `S${i + 1}`, evidenceId: e.id, sourceId: e.source_id ?? null,
      segmentId: e.segment_id ?? null, mediaId: e.media_id ?? null,
      title: typeof e.title === 'string' ? e.title : '', sourceType: e.source_type ?? null,
      text: typeof e.text === 'string' ? e.text : '', rawText: typeof e.raw_text === 'string' ? e.raw_text : '',
      start: time.start, end: time.end, timeValid: time.valid,
      page: Number.isInteger(e.page) && e.page > 0 ? e.page : null,
      playbackAvailable: time.valid && time.start !== null && text(e.media_id),
    };
  });
  const labels = new Map(evidenceIndex.map(e => [e.evidenceId, e.label]));
  const sections = definitions.map(([id, title]) => ({id, title, items: []})), pending = [];
  for (const fact of facts.values()) {
    const reasons = inspectFact(fact, artifact, evidence, conflicts);
    const quotes = (Array.isArray(fact.evidence_quotes) ? fact.evidence_quotes : [])
      .filter(q => object(q) && text(q.quote) && evidence.has(q.evidence_id))
      .map(q => ({evidence_id: q.evidence_id, label: labels.get(q.evidence_id), quote: q.quote}));
    if (reasons.length) {
      pending.push({fact_id: fact.id, topic: typeof fact.topic === 'string' ? fact.topic : '',
        proposed_statement: typeof fact.statement === 'string' ? fact.statement : '',
        reason_codes: reasons, evidence_quotes: quotes});
      continue;
    }
    const section = sections.find(s => s.id === (assignments.get(fact.id) || 'topics'));
    section.items.push({fact_id: fact.id, topic: typeof fact.topic === 'string' ? fact.topic : '',
      statement: fact.statement, conditions: [...fact.conditions], source_layer: fact.layer,
      verification: fact.verification, status: 'SOURCE_STATEMENT_NOT_MEETING_DECISION', evidence_quotes: quotes});
  }
  const report = {
    schema_version: 'research-report/1.0', template, title: artifact.title,
    source_pipeline_id: artifact.pipeline_id, source_input_hash: artifact.input_hash ?? null,
    provenance: {generator_version: REPORT_VERSION, content: 'INHERITED_AUDITED_FACTS',
      data_kind: artifact.provenance?.fixture_type === 'SYNTHETIC_DEVELOPMENT_ONLY' ? 'SYNTHETIC_DEVELOPMENT_ONLY' : 'UNSPECIFIED',
      classification: Object.keys(outline).length ? 'EXPLICIT_OUTLINE_NOT_SEMANTIC_VALIDATION' : 'UNCLASSIFIED',
      external_verification: 'NOT_PERFORMED', decisions_and_actions: 'HUMAN_CONFIRMATION_REQUIRED'},
    sections, decisions: [], action_items: [],
    bibliography: {title: null, authors: [], year: null, doi: null, status: 'NOT_VERIFIED'},
    pending, evidence_index: evidenceIndex,
    metrics: {input_facts: facts.size, source_items: sections.reduce((n, s) => n + s.items.length, 0),
      pending_items: pending.length, referenced_evidence: evidenceIndex.length},
  };
  return {...report, report_id: `R${hash(report).slice(0, 20)}`};
}
