export function renderNote({title,facts,clusters,audits,conflicts,evidence,glossary}){
 const labels=new Map(evidence.map((e,i)=>[e.id,'S'+(i+1)]));
 const citations=evidence.map(e=>({label:labels.get(e.id),sourceId:e.source_id,segmentId:e.segment_id,mediaId:e.media_id,title:e.title,...(e.start_time===null?{}:{start:Math.round(e.start_time*1000),end:Math.round(e.end_time*1000)}),text:e.text,evidenceId:e.id}));
 const quote=f=>[...new Set(f.evidence_quotes.map(q=>'['+labels.get(q.evidence_id)+']'))].join('');
 const lines=['# '+title,'','> 结构化学习笔记。核心层经过来源核对与独立模型审阅，尚不代表外部权威标准认证；不替代原课程及适用规范。'];
 for(const [layer,heading] of [['CORE','核心原理与标准规范'],['CONTEXT','本课实操与特定条件 / 单次演示数据'],['UNRESOLVED','争议/待核对与审计提示']]){
  lines.push('','## '+heading);let count=0;
  for(const cluster of clusters){const group=cluster.fact_ids.map(id=>facts.find(f=>f.id===id)).filter(f=>f?.layer===layer);if(!group.length)continue;lines.push('','### '+cluster.title);
   for(const f of group){count++;const a=audits.find(a=>a.fact_id===f.id);
    if(layer==='UNRESOLVED'){const label={ASR_OCR_DISTORTION:'疑似语音/画面识别误差',MODEL_INDUCTION_ERROR:'归纳错误未完全修复',SOURCE_TEACHING_DEVIATION:'主讲人表述的适用边界待核对',UNDETERMINED:'归因未定',NONE:'材料存在未解决风险'}[a?.attribution]||'待核对';lines.push('- **'+f.topic+'**：['+label+'] '+(a?.rationale||'请回看原片确认。')+' '+quote(f));if(a?.attribution==='SOURCE_TEACHING_DEVIATION')lines.push('  - [视频主讲人经验/本例特定操作，待核对适用范围] '+f.statement);if(a?.proposed_correction)lines.push('  - 候选修正（未确认）：'+a.proposed_correction);}
    else{lines.push('- '+(f.knowledge_type==='SINGLE_RUN_METRIC'?'[单次示例数据，仅作趋势理解，无需背诵] ':layer==='CONTEXT'?'[视频中的本课做法，非通用规范] ':'')+'**'+f.entity+' · '+f.property+'**：'+f.statement+' '+quote(f));if(f.conditions.length)lines.push('  - 前提：'+f.conditions.join('；'));}
    if(a?.standard_boundary&&layer==='UNRESOLVED')lines.push('  - 适用边界仍需核对，模型建议保留在审计报告中，不作为标准规范引用。');
   }
  }
  if(!count)lines.push(layer==='CORE'?'尚无满足核心层准入条件的知识点；出题保持关闭。':'本次无此类条目。');
  if(layer==='UNRESOLVED')for(const c of conflicts)lines.push('- [未裁决冲突 '+c.id+'] '+c.reason+' '+c.fact_ids.map(id=>facts.find(f=>f.id===id)).filter(Boolean).map(quote).join(' '));
 }
 if(glossary.length)lines.push('','> 已生成 '+glossary.length+' 条术语修正候选，保存在审计报告中；未自动替换原句。');
 return {markdown:lines.join('\n'),citations};
}
