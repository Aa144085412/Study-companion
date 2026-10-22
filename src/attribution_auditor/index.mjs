import {reviewSemantics} from './semantic.mjs';
import {chunkBySize,requireValue,BLOCK_FLAGS,norm} from '../pipeline/common.mjs';
import {validateFacts} from '../note_synthesizer/index.mjs';import {AUDIT_PROMPT,REWRITE_PROMPT,SCOPE_PROMPT,PARAMETER_PROMPT} from './prompts.mjs';
export function validateAudits(result,facts){
 requireValue(Array.isArray(result.audits),'audit results missing');
 const ids=result.audits.map(a=>a.fact_id);requireValue(ids.length===facts.length&&new Set(ids).size===facts.length&&ids.every(id=>facts.some(f=>f.id===id)),'auditor must cover each fact exactly once');
 return result.audits.map(a=>{requireValue(['NONE','ASR_OCR_DISTORTION','MODEL_INDUCTION_ERROR','SOURCE_TEACHING_DEVIATION','UNDETERMINED'].includes(a.attribution)&&typeof a.supported==='boolean'&&typeof a.generalizable==='boolean'&&typeof a.rationale==='string'&&a.rationale.trim()&&['ACCEPT','CONTEXT_ONLY','REWRITE','PENDING_VERIFICATION'].includes(a.decision),'invalid attribution decision');return {fact_id:a.fact_id,attribution:a.attribution,supported:a.supported,generalizable:a.generalizable,rationale:a.rationale,proposed_correction:typeof a.proposed_correction==='string'?a.proposed_correction:'',standard_boundary:typeof a.standard_boundary==='string'?a.standard_boundary:'',external_reference_ids:[],decision:a.decision,certainty:a.attribution==='NONE'?'MODEL_REVIEW':'SOURCE_CHECK_REQUIRED'};});
}
// Incomplete model output must retain the fact as unresolved, never certify it.
export function completeAudits(result,facts){
 return facts.map(f=>{
  const entries=Array.isArray(result?.audits)?result.audits.filter(a=>a?.fact_id===f.id):[];
  if(entries.length===1){try{return validateAudits({audits:entries},[f])[0];}catch{}}
  return {fact_id:f.id,attribution:'UNDETERMINED',supported:false,generalizable:false,rationale:'审计输出缺失、重复或格式无效，未完成核对；保留原始证据供复核。',proposed_correction:'',standard_boundary:'',external_reference_ids:[],decision:'PENDING_VERIFICATION',certainty:'SOURCE_CHECK_REQUIRED'};
 });
}
export function enforceAttribution(a,f,evidence){
 if(a.attribution==='SOURCE_TEACHING_DEVIATION'){
  const quoted=evidence.filter(e=>f.evidence_quotes.some(q=>q.evidence_id===e.id));
  const corroborated=quoted.some(e=>e.aligned_evidence_ids.some(id=>{const other=evidence.find(x=>x.id===id);return other&&new Set([e.source_type,other.source_type]).has('ASR_TRANSCRIPT')&&new Set([e.source_type,other.source_type]).has('SUBTITLE_OCR')&&norm(e.raw_text)===norm(other.raw_text);}));
  if(!corroborated){a.attribution='UNDETERMINED';a.rationale='无法证明语音与字幕一致，不归咎主讲人。'+a.rationale;}
  a.decision='PENDING_VERIFICATION';a.certainty='SOURCE_CHECK_REQUIRED';
 }
 return a;
}
export function assignLayer(f,a){
 const pending=!a.supported||a.attribution!=='NONE'||a.decision==='PENDING_VERIFICATION'||a.decision==='REWRITE'||f.flags.some(flag=>BLOCK_FLAGS.filter(x=>x!=='SINGLE_RUN_METRIC').includes(flag));
 if(pending){f.layer='UNRESOLVED';f.verification='PENDING_VERIFICATION';f.flags=[...new Set([...f.flags,'PENDING_VERIFICATION'])];}
 else if(a.generalizable&&a.decision==='ACCEPT'&&f.knowledge_type==='GENERAL_PRINCIPLE'&&!f.flags.includes('SINGLE_RUN_METRIC')){f.layer='CORE';f.verification='MODEL_REVIEWED';}
 else{f.layer='CONTEXT';f.verification='MODEL_REVIEWED';}
 return f;
}
export async function auditFacts(facts,evidence,conflicts,{call,progress}){
 const audits=[],rewrites=[];
 function refsFor(cards){return auditEvidence(cards,evidence);}
 const groups=chunkBySize(facts,10000);
 for(let i=0;i<groups.length;i++){const batch=groups[i];progress({stage:'attribution_audit',completed:i,total:groups.length});
  const r=await call('attribution_audit',AUDIT_PROMPT,{facts:batch,evidence:refsFor(batch),conflicts:conflicts.filter(c=>c.fact_ids.some(id=>batch.some(f=>f.id===id)))});
  audits.push(...completeAudits(r,batch));
 }
 const numeric=facts.filter(f=>f.parameters.length);
 for(const batch of chunkBySize(numeric,6500)){
  progress({stage:'parameter_audit',completed:0,total:1});
  const check=await call('parameter_audit',PARAMETER_PROMPT,{facts:batch,evidence:refsFor(batch),prior_audits:audits.filter(a=>batch.some(f=>f.id===a.fact_id))});
  for(const a of completeAudits(check,batch)){const index=audits.findIndex(old=>old.fact_id===a.fact_id);const previous=audits[index];if(previous.attribution==='MODEL_INDUCTION_ERROR'||previous.decision==='REWRITE')continue;audits[index]=a;}
 }
 for(const f of facts){const a=enforceAttribution(audits.find(a=>a.fact_id===f.id),f,evidence);assignLayer(f,a);
  if(a.attribution==='MODEL_INDUCTION_ERROR'||a.decision==='REWRITE'){
   progress({stage:'fact_rewrite',completed:0,total:1});const output=await call('fact_rewrite',REWRITE_PROMPT,{fact:f,audit:a,evidence:refsFor([f])});const parsed=validateFacts(output,evidence);
   if(parsed.cards.length===1){const revised={...parsed.cards[0],id:f.id};
    const check=await call('attribution_audit',AUDIT_PROMPT,{facts:[revised],evidence:refsFor([revised]),conflicts:conflicts.filter(c=>c.fact_ids.includes(f.id))});
    const final=enforceAttribution(completeAudits(check,[revised])[0],revised,evidence);rewrites.push({before:structuredClone(f),after:structuredClone(revised),original_audit:a,recheck:final});
    // Original unresolved conflicts remain unresolved even after rewriting one statement.
    if(f.flags.includes('UNRESOLVED_CONFLICT'))revised.flags.push('UNRESOLVED_CONFLICT');
    Object.assign(f,assignLayer(revised,final));audits[audits.indexOf(a)]=final;
   }
  }
 }
 const core=facts.filter(f=>f.layer==='CORE'),scope_checks=[];
 if(core.length){
  progress({stage:'scope_check',completed:0,total:1});
  const response=await call('scope_check',SCOPE_PROMPT,{claims:core.map(f=>({fact_id:f.id,topic:f.topic,entity:f.entity,step:f.step,statement:f.statement,conditions:f.conditions,parameters:f.parameters}))});
  requireValue(Array.isArray(response.checks)&&response.checks.length===core.length&&new Set(response.checks.map(c=>c.fact_id)).size===core.length,'scope checker must cover all core candidates');
  for(const c of response.checks){const f=core.find(f=>f.id===c.fact_id);requireValue(f&&typeof c.generalizable==='boolean'&&typeof c.counterexample==='string'&&typeof c.rationale==='string','invalid scope decision');scope_checks.push(c);
   if(!c.generalizable||c.counterexample.trim()){const a=audits.find(a=>a.fact_id===f.id);a.decision='PENDING_VERIFICATION';a.generalizable=false;a.rationale='[初审接受已被独立适用范围审查否决] '+c.rationale+(c.counterexample?' 反例/缺失前提：'+c.counterexample:'');f.flags.push('PENDING_VERIFICATION');assignLayer(f,a);}
  }
 }
 const semantic_checks=await reviewSemantics(facts.filter(f=>f.layer!=='UNRESOLVED'),evidence,{call,progress,refsFor});
 for(const c of semantic_checks){if(c.passed)continue;const f=facts.find(f=>f.id===c.fact_id),a=audits.find(a=>a.fact_id===c.fact_id);
  a.supported=false;a.generalizable=false;a.decision='PENDING_VERIFICATION';a.attribution=c.attribution;a.rationale='[独立语义复核未通过] '+c.rationale;a.certainty='SOURCE_CHECK_REQUIRED';assignLayer(f,a);
 }
 return {facts,audits,rewrites,scope_checks,semantic_checks};
}

export function auditEvidence(cards,evidence){
 const ids=new Set(cards.flatMap(f=>f.evidence_quotes.map(q=>q.evidence_id)));
 const seeds=evidence.filter(e=>ids.has(e.id));
 for(const e of seeds)for(const id of e.aligned_evidence_ids)ids.add(id);
 for(const e of evidence)if(!e.noise&&seeds.some(s=>s.media_id&&s.media_id===e.media_id&&s.start_time!==null&&e.start_time!==null&&Math.abs(s.start_time-e.start_time)<=10))ids.add(e.id);
 return evidence.filter(e=>ids.has(e.id)&&!e.noise).map(e=>({id:e.id,source_id:e.source_id,media_id:e.media_id,start_time:e.start_time,end_time:e.end_time,source_type:e.source_type,text:e.text,raw_text:e.raw_text,flags:e.flags,aligned_evidence_ids:e.aligned_evidence_ids}));
}
