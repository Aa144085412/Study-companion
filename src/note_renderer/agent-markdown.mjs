import {frameReviewDocument} from './review-frames.mjs';
import {visibleOCR} from './screenshots.mjs';
// A portable reference document: no new claims or dependence on local images/API.
const oneLine=value=>String(value??'').replace(/[\r\n]+/g,' ').trim();
const cell=value=>oneLine(value).replaceAll('|','\\|');
const clock=value=>{const s=Math.floor(value);return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');};
export function renderAgentMarkdown(artifact,{sourceUrl='',review=null}={}){
 const {facts=[],evidence=[],visual_sections:scenes=[],clusters=[],audits=[]}=artifact;
 const accepted=facts.filter(f=>f.layer!=='UNRESOLVED'),pending=facts.filter(f=>f.layer==='UNRESOLVED');
 const labels=new Map(evidence.map((e,i)=>[e.id,'S'+(i+1)])),byEvidence=new Map(evidence.map(e=>[e.id,e]));
 const ids=new Map(accepted.map((f,i)=>[f.id,'K'+String(i+1).padStart(2,'0')]));
 const used=new Set(),images=[];
 const cite=f=>[...new Set(f.evidence_quotes.map(q=>{if(!byEvidence.has(q.evidence_id))throw Error('Agent Markdown引用缺少证据');used.add(q.evidence_id);return '[^'+labels.get(q.evidence_id)+']';}))].join('');
 const source=/^https?:\/\//i.test(sourceUrl)?sourceUrl:'';
 const lines=['---','format: study-reference/multimodal-agent-v1','title: '+JSON.stringify(artifact.title),'source_url: '+JSON.stringify(source||null),'language: zh-CN','evidence_scope: source_reviewed_not_external_certification','---','',
 '# '+oneLine(artifact.title),'',
 '## 阅读摘要','本笔记与images目录共同构成图文参考资料。先读本节和概念索引，再逐章读取G编号图片并结合对应K编号条目理解。S编号脚注在本文件内定义。画面解读与来源结论分别标注，未核实内容单列。',
 '', '来源：'+(source?'[原视频]('+source+')':'原材料未记录外部URL，以下保留对应视频时间。'),
 '范围：仅总结原材料陈述及其适用边界；来源核对不等于证明它在其他场景也成立。'];
 const groups=scenes.length?scenes.map(s=>({title:s.title,ids:s.factIds,time:s.time,reading:s.visualReading,status:s.readingStatus,framePath:s.framePath,bodyId:s.bodyEvidenceId,frameId:s.frameEvidenceId})):clusters.map(c=>({title:c.title,ids:c.fact_ids}));
 const summarySeen=new Set();
 for(const g of groups){const f=g.ids.map(id=>accepted.find(f=>f.id===id)).find(f=>f&&!summarySeen.has(f.id)&&f.knowledge_type!=='SINGLE_RUN_METRIC');if(!f)continue;summarySeen.add(f.id);lines.push('- **'+oneLine(g.title)+'**：'+oneLine(f.statement)+(f.conditions.length?'（前提：'+f.conditions.map(oneLine).join('；')+'）':'')+'（'+ids.get(f.id)+'）');}
 lines.push('','## 概念与职责索引','| 对象／概念 | 本笔记覆盖的属性与正文编号 |','| --- | --- |');
 const entities=new Map();for(const f of accepted){if(!entities.has(f.entity))entities.set(f.entity,[]);entities.get(f.entity).push(f);}
 for(const [entity,rows] of entities)lines.push('| '+cell(entity)+' | '+rows.map(f=>cell(f.property)+' '+ids.get(f.id)).join('；')+' |');
 lines.push('','## 按视频画面组织的主题正文','每章必须联合读取原图、图示描述和K编号知识条目；原图中的布局、箭头、分组及对比应参与理解。图示描述属于视觉模型解读；K条目是已通过来源审阅的陈述。类型含义：概念=来源内概念，情境=本视频语境，单次数据=示例或测试数据；均非外部权威认证。未列额外条件不代表无条件通用。');
 const shown=new Set();
 function writeFact(f){
  if(shown.has(f.id))return;shown.add(f.id);
  lines.push('','#### '+ids.get(f.id)+' · '+oneLine(f.entity)+' — '+oneLine(f.property),
   oneLine(f.statement)+' '+cite(f),
   '- 类型：'+(f.knowledge_type==='SINGLE_RUN_METRIC'?'单次数据，不能作为性能保证。':f.layer==='CORE'?'概念。':'情境。'));
  if(f.conditions.length)lines.push('- 前提：'+f.conditions.map(oneLine).join('；'));

 }
 for(const g of groups){const rows=g.ids.map(id=>accepted.find(f=>f.id===id)).filter(f=>f&&!shown.has(f.id));if(!rows.length)continue;
  lines.push('','### '+oneLine(g.title)+(Number.isFinite(g.time)?' · '+clock(g.time):''));
  if(g.framePath){
   const imageId='G'+String(images.length+1).padStart(2,'0'),relativePath='images/'+imageId+'.jpg';
   images.push({id:imageId,relativePath,sourcePath:g.framePath,time:g.time,factIds:rows.map(f=>ids.get(f.id))});
   lines.push('','!['+imageId+' · '+oneLine(g.title)+']('+relativePath+')',
    '', '**'+imageId+' 图文对应**：本图对应 '+rows.map(f=>ids.get(f.id)).join('、')+'。先观察图中对象、连线方向、区域分组与文字，再阅读下文；图片与文字不一致时保留问题并回查来源。');
  }
  const ocr=visibleOCR(evidence,byEvidence.get(g.bodyId));
  if(ocr)lines.push('','同帧画面文字（OCR候选）：'+oneLine(ocr));
  if(g.reading)lines.push('','图示结构（'+(g.status==='MODEL_VISUAL_INTERPRETATION'?'视觉模型解读，非已确认事实':'未完成核对')+'）：'+oneLine(g.reading));
  for(const f of rows)writeFact(f);
 }
 const rest=accepted.filter(f=>!shown.has(f.id));if(rest.length){lines.push('','### 其他来源陈述');for(const f of rest)writeFact(f);}
 lines.push('','## 不确定性与使用边界','- 仅覆盖原材料已说明的内容；材料未说明的实现状态、运行条件或操作参数均不补猜。','- 图示文字、语音及字幕可能识别错误；未核对的候选不能覆盖已审阅条目。','- 下面只列出未确认的候选与审核意见；不将它们纳入上面的知识摘要或概念索引。');
 for(const [i,f] of pending.entries()){
  const audit=audits.find(a=>a.fact_id===f.id);
  lines.push('','### U'+String(i+1).padStart(2,'0')+' · '+oneLine(f.topic),'- 状态：待核对，不作为已确认事实。','- 候选陈述：'+oneLine(f.statement));
  if(audit?.rationale)lines.push('- 模型审核意见（尚未人工确认）：'+oneLine(audit.rationale));
  lines.push('- 核对位置：'+cite(f));
 }
 lines.push('','## 来源索引','以下时间为原视频时间；编号只用于定位证据，不是额外独立来源。');
 for(const e of evidence.filter(e=>used.has(e.id)))lines.push('[^'+labels.get(e.id)+']: '+(Number.isFinite(e.start_time)?clock(e.start_time)+'–'+clock(e.end_time??e.start_time):'无视频时间')+' · '+e.source_type+'。');
 const edition=frameReviewDocument(artifact,review,lines,images);
 return {reviewStatus:edition.status,markdown:edition.markdown.join('\n')+'\n',images,imageCount:images.length,factCount:accepted.length,pendingCount:pending.length,referenceCount:used.size,format:'study-reference/multimodal-agent-v1'};
}
