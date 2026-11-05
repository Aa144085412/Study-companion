import {screenshotSections,visibleOCR,frameURL} from './screenshots.mjs';
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
export function renderNote({title,facts,clusters,audits,conflicts,evidence,glossary,notebookId,visualSections:preparedSections}){
 const labels=new Map(evidence.map((e,i)=>[e.id,'S'+(i+1)]));
 const citations=evidence.map(e=>({label:labels.get(e.id),sourceId:e.source_id,segmentId:e.segment_id,mediaId:e.media_id,title:e.title,...(e.start_time===null?{}:{start:Math.round(e.start_time*1000),end:Math.round(e.end_time*1000)}),text:e.text,sourceType:e.source_type,evidenceId:e.id}));
 const quote=f=>[...new Set(f.evidence_quotes.map(q=>'['+labels.get(q.evidence_id)+']'))].join('');
 const visualSections=preparedSections||(notebookId?screenshotSections({facts,clusters,evidence}):[]);
 if(visualSections.length){
  const lines=['# '+title,'','> 按视频画面展开：先看截图和画面文字，再结合讲解理解。正文仅使用已审阅的来源陈述；OCR候选与未核实内容保持区分。'];
  const shown=new Set();
  for(const scene of visualSections){
   const seconds=Math.floor(scene.time),stamp=Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');
   lines.push('','## '+stamp+' · '+scene.title,'','![视频截图 '+stamp+']('+frameURL(notebookId,scene.frameEvidenceId)+')');
   const body=evidence.find(e=>e.id===scene.bodyEvidenceId),ocr=visibleOCR(evidence,body);
   if(ocr)lines.push('','**画面上的文字（OCR候选）**：'+ocr+' ['+labels.get(body.id)+']');
   if(scene.visualReading)lines.push('','**读图顺序（视觉模型解读）**：'+scene.visualReading);
   lines.push('','**结合这组画面理解**');
   for(const id of scene.factIds){const f=facts.find(f=>f.id===id);if(!f||shown.has(id))continue;shown.add(id);
    const display=displayStatement(f,evidence);
    lines.push('',(display.text.includes(f.entity)?'':f.entity+'：')+display.text+(f.conditions.length?'（适用前提：'+f.conditions.join('；')+'）':'')+' '+quote(f));
   }
  }
  const remaining=facts.filter(f=>f.layer!=='UNRESOLVED'&&!shown.has(f.id));
  if(remaining.length){lines.push('','## 其他讲解补充');for(const f of remaining)lines.push('',displayStatement(f,evidence).text+' '+quote(f));}
  const pending=facts.filter(f=>f.layer==='UNRESOLVED');
  if(pending.length){lines.push('','## 待核对内容','以下未进入上面的已审阅讲解；识别冲突和模型审计意见不是已确认事实。');for(const f of pending)lines.push('- '+f.topic+'：需回看原片核对。'+quote(f));}
  if(conflicts.length)lines.push('','> 存在 '+conflicts.length+' 组未裁决冲突，详情保留在审计中。');
  lines.push('','> 审阅范围：本视频的来源陈述，非外部权威认证。画面仅为时间抽样；图示不能凭文字相邻推断因果，未知OCR不会自动升级为已确认知识。');
  return {markdown:lines.join('\n'),citations,visualSections};
 }
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
