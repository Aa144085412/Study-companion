function displayStatement(f,evidence){
 if(f.knowledge_type!=='SINGLE_RUN_METRIC')return {heading:f.entity+' · '+f.property,text:f.statement};
 const refs=f.evidence_quotes.map(q=>evidence.find(e=>e.id===q.evidence_id)).filter(Boolean);
 const asrOnly=refs.length>0&&refs.every(e=>e.source_type==='ASR_TRANSCRIPT');
 if(asrOnly)return {heading:'本次记录',text:'该条记录仅引用语音转写，请回看原片确认具体内容。'};
 if(f.parameters.length)return {heading:f.entity+' · '+f.property,text:'本次记录：'+f.parameters.map(p=>p.name+' '+p.value+(p.unit?' '+p.unit:'')).join('；')+'。'};
 const visualQuotes=f.evidence_quotes.filter(q=>evidence.some(e=>e.id===q.evidence_id&&['SUBTITLE_OCR','SLIDE_DOCUMENT_OCR'].includes(e.source_type)));
 if(refs.some(e=>e.source_type==='ASR_TRANSCRIPT')&&visualQuotes.length)return {heading:'本次画面记录',text:visualQuotes.map(q=>q.quote).join('；')};
 return {heading:f.entity+' · '+f.property,text:f.statement};
}
export function renderNote({title,facts,clusters,audits,conflicts,evidence,glossary}){
 const labels=new Map(evidence.map((e,i)=>[e.id,'S'+(i+1)]));
 const citations=evidence.map(e=>({label:labels.get(e.id),sourceId:e.source_id,segmentId:e.segment_id,mediaId:e.media_id,title:e.title,...(e.start_time===null?{}:{start:Math.round(e.start_time*1000),end:Math.round(e.end_time*1000)}),text:e.text,sourceType:e.source_type,evidenceId:e.id}));
 const quote=f=>[...new Set(f.evidence_quotes.map(q=>'['+labels.get(q.evidence_id)+']'))].join('');
 const lines=['# '+title,'','> 结构化学习笔记。核心层经过来源核对与独立模型审阅，尚不代表外部权威标准认证；不替代原课程及适用规范。'];
 for(const [layer,heading] of [['CORE','核心原理与标准规范'],['CONTEXT','本课实操与特定条件 / 单次演示数据'],['UNRESOLVED','争议/待核对与审计提示']]){
  lines.push('','## '+heading);let count=0;
  for(const cluster of clusters){const group=cluster.fact_ids.map(id=>facts.find(f=>f.id===id)).filter(f=>f?.layer===layer);if(!group.length)continue;lines.push('','### '+cluster.title);
   for(const f of group){count++;const a=audits.find(a=>a.fact_id===f.id);
    if(layer==='UNRESOLVED'){
     const label={ASR_OCR_DISTORTION:'疑似语音/画面识别误差',MODEL_INDUCTION_ERROR:'归纳错误未完全修复',SOURCE_TEACHING_DEVIATION:'主讲人表述的适用边界待核对',UNDETERMINED:'归因未定',NONE:'仍有未核实问题'}[a?.attribution]||'待核对';
     lines.push('- **'+f.topic+'**：['+label+'] 该内容尚未完成核实，请回看引用片段。模型提出的理由和候选修正在审计详情中保留，不能视作已确认的纠错结论。 '+quote(f));
    }else{
     const display=displayStatement(f,evidence);
     lines.push('- '+(f.knowledge_type==='SINGLE_RUN_METRIC'?'[单次示例数据，仅作趋势理解，无需背诵] ':layer==='CONTEXT'?'[视频中的本课做法，非通用规范] ':'')+'**'+display.heading+'**：'+display.text+' '+quote(f));
     if(f.conditions.length)lines.push('  - 前提：'+f.conditions.join('；'));
    }
   }
  }
  if(!count)lines.push(layer==='CORE'?'尚无满足核心层准入条件的知识点；出题保持关闭。':'本次无此类条目。');
  if(layer==='UNRESOLVED')for(const c of conflicts)lines.push('- [未裁决冲突 '+c.id+'] '+c.reason+' '+c.fact_ids.map(id=>facts.find(f=>f.id===id)).filter(Boolean).map(quote).join(' '));
 }
 if(glossary.length)lines.push('','> 已生成 '+glossary.length+' 条术语修正候选，保存在审计报告中；未自动替换原句。');
 return {markdown:lines.join('\n'),citations};
}
