// Entirely synthetic. No real paper, person, API credential or recording is used.
export function makeFixture() {
  const statements = {
    F1: '本分享讨论怎样比较相同输入下的两种处理方案。',
    F2: '比较时保持输入和运行配置一致，并记录条件。',
    F3: '本轮演示结果只适用于当前输入与配置，不能直接推广。',
    F4: '讲者建议下次讨论是否扩大样本，本次未形成共同决议。',
    F5: '未核实的候选声称所有条件下都提高百分之五十。',
    F6: '未核实的画面候选声称仪器参数为12。',
    F7: '来源甲认为方案A更合适。',
    F8: '来源乙认为方案B更合适。',
  };
  const evidence = (id, source, type, content, extra = {}) => ({
    id, source_id: source, segment_id: `seg-${id}`, media_id: null, title: `合成资料${id}`,
    start_time: null, end_time: null, source_type: type, raw_text: content, text: content,
    confidence: null, flags: [], classification_method: 'synthetic_fixture',
    aligned_evidence_ids: [], frame_path: null, noise: false, ...extra,
  });
  const records = [
    evidence('E1', 'doc-1', 'DOCUMENT_TEXT', `${statements.F1}\n${statements.F2}`),
    evidence('E2', 'transcript-1', 'ASR_TRANSCRIPT', statements.F3,
      {media_id: 'synthetic-media-1', start_time: 12.375, end_time: 19.125}),
    evidence('E3', 'transcript-2', 'ASR_TRANSCRIPT', statements.F4,
      {media_id: 'synthetic-media-2', start_time: 12.375, end_time: 19.125}),
    evidence('E4', 'screen-1', 'UNKNOWN_VISUAL_OCR', '图中只有一个孤立数字12，含义不明。',
      {flags: ['UNKNOWN_VISUAL_ROLE'], media_id: 'synthetic-media-1', start_time: 20, end_time: 21}),
    evidence('E5', 'doc-conflict', 'DOCUMENT_TEXT', `${statements.F7}\n${statements.F8}`),
  ];
  const refs = {F1: 'E1', F2: 'E1', F3: 'E2', F4: 'E3', F5: 'E2', F6: 'E4', F7: 'E5', F8: 'E5'};
  const facts = Object.entries(statements).map(([id, statement]) => ({
    id, topic: {F1: '研究问题', F2: '方法', F3: '结果边界', F4: '讲者建议',
      F5: '错误泛化候选', F6: '画面参数候选', F7: '方案冲突甲', F8: '方案冲突乙'}[id],
    step: '合成演示', entity: '处理方案', property: '说明', statement,
    parameters: [], conditions: id === 'F3' ? ['当前输入与配置'] : [], knowledge_type: 'SOURCE_CLAIM',
    evidence_quotes: [{evidence_id: refs[id], quote: id === 'F5' ? statements.F3 : id === 'F6' ? records[3].text : statement}],
    flags: id === 'F5' || id === 'F6' ? ['PENDING_VERIFICATION'] : [],
    verification: id === 'F5' || id === 'F6' ? 'PENDING_VERIFICATION' : 'MODEL_REVIEWED',
    layer: id === 'F5' || id === 'F6' ? 'UNRESOLVED' : 'CONTEXT',
  }));
  return {
    schema_version: '2.0', pipeline_id: 'P_SYNTHETIC_RESEARCH_01', input_hash: 'synthetic-development-input',
    title: '合成文献分享与报告整理示例', domain: '通用研究方法', glossary: [], evidence: records, facts,
    audits: facts.map(f => ({fact_id: f.id, attribution: f.layer === 'UNRESOLVED' ? 'UNDETERMINED' : 'NONE',
      supported: f.layer !== 'UNRESOLVED', generalizable: false, rationale: '合成开发用审阅状态，并非真实模型判断',
      proposed_correction: '', standard_boundary: '', external_reference_ids: [],
      decision: f.layer === 'UNRESOLVED' ? 'PENDING_VERIFICATION' : 'CONTEXT_ONLY', certainty: 'MODEL_REVIEW'})),
    conflicts: [{id: 'C1', fact_ids: ['F7', 'F8'], reason: '合成来源对方案选择存在未裁决差异', status: 'UNRESOLVED_CONFLICT'}],
    clusters: [{title: '合成报告', fact_ids: Object.keys(statements)}], markdown: '', metrics: {},
    provenance: {fixture_type: 'SYNTHETIC_DEVELOPMENT_ONLY'},
  };
}
