import {SEMANTIC_PROMPT,CONTEXT_SEMANTIC_PROMPT,SOURCE_RELATION_PROMPT} from './prompts.mjs';
import {chunkBySize} from '../pipeline/common.mjs';
export function semanticDecision(checks,fact,evidence){
 const matches=Array.isArray(checks)?checks.filter(c=>c?.fact_id===fact.id):[];
 const c=matches.length===1?matches[0]:null;
 const axes=['binding_supported','causality_supported','quantity_supported'];
 const valid=c&&axes.every(k=>[true,false,null].includes(c[k]))&&typeof c.rationale==='string'&&c.rationale.trim()&&Array.isArray(c.evidence_quotes)&&c.evidence_quotes.length>0&&c.evidence_quotes.every(q=>typeof q.quote==='string'&&q.quote.trim()&&evidence.some(e=>e.id===q.evidence_id&&e.text.includes(q.quote)));
 const passed=Boolean(valid&&axes.every(k=>c[k]===true));
 return {fact_id:fact.id,passed,attribution:valid&&axes.some(k=>c[k]===false)?'MODEL_INDUCTION_ERROR':'UNDETERMINED',rationale:valid?c.rationale:'语义复核缺失、重复、格式或引用无效，需核对原片。',check:c};
}
// OCR may concatenate a persistent annotation with changing speech subtitles.
// This is a layout ambiguity guard, not a factual correction or domain vocabulary rule.
export function annotationCausalityRisk(fact,evidence){
 if(!/原因|因为|由于|导致|因而|because|caus|reason|result from/i.test([fact.property,fact.statement,...(fact.conditions||[])].join(' ')))return [];
 const cited=new Set(fact.evidence_quotes.map(q=>q.evidence_id)),risks=[];
 for(const e of evidence){
  if(!cited.has(e.id)||e.source_type!=='SUBTITLE_OCR'||!e.media_id||!Number.isFinite(e.start_time))continue;
  const match=e.text.match(/^((?:注(?:意)?|备注|提示|说明|note|remark|annotation)\s*[:：]\S+)\s+(.+)$/i);
  if(!match)continue;
  const prefix=match[1],neighbors=evidence.filter(n=>n.source_type==='SUBTITLE_OCR'&&n.media_id===e.media_id&&Number.isFinite(n.start_time)&&Math.abs(n.start_time-e.start_time)<=15&&n.text.startsWith(prefix+' '));
  if(new Set(neighbors.map(n=>n.text.slice(prefix.length).trim())).size>=3)risks.push({evidence_id:e.id,persistent_annotation:prefix,reason:'持续画面注释与变化字幕被合并，不能据此确认因果关系，需回看原帧分区。'});
 }
 return risks;
}
export async function reviewSemantics(facts,evidence,{call,refsFor,progress=()=>{}}){
 const decisions=[];
 for(const batch of chunkBySize(facts,6500)){
  progress({stage:'semantic_check',completed:decisions.length,total:facts.length});
  // No prior audit, layer or certification label is sent to this reviewer.
  const claims=batch.map(({id,topic,step,entity,property,statement,parameters,conditions,evidence_quotes})=>({id,topic,step,entity,property,statement,parameters,conditions,evidence_quotes}));
  const refs=refsFor(batch),input={facts:claims,evidence:refs};
  const first=await call('semantic_check',SEMANTIC_PROMPT,input);
  const source_reading=await call('source_relations',SOURCE_RELATION_PROMPT,{evidence:refs});
  const second=await call('semantic_check',CONTEXT_SEMANTIC_PROMPT+'\nsource_reading是只看原文的另一上下文分析，仅作反证线索，不可代替原句；如其中因果与候选不一致，必须回查原证据，无法确认则null。',{...input,source_reading});
  decisions.push(...batch.map(f=>{
   const passes=[semanticDecision(first?.checks,f,refs),semanticDecision(second?.checks,f,refs)];
   const layout_risks=annotationCausalityRisk(f,evidence);
   if(layout_risks.length)passes.push({fact_id:f.id,passed:false,attribution:'UNDETERMINED',rationale:layout_risks[0].reason,layout_risks});
   const rejected=passes.find(p=>!p.passed);
   return {...(rejected||passes[0]),passed:passes.every(p=>p.passed),reviews:passes};
  }));
 }
 return decisions;
}
