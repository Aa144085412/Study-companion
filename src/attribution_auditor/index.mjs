import {chunkBySize,requireValue,BLOCK_FLAGS,norm} from '../pipeline/common.mjs';
import {validateFacts} from '../note_synthesizer/index.mjs';import {AUDIT_PROMPT,REWRITE_PROMPT,SCOPE_PROMPT} from './prompts.mjs';
export function validateAudits(result,facts){
 requireValue(Array.isArray(result.audits),'audit results missing');
 const ids=result.audits.map(a=>a.fact_id);requireValue(ids.length===facts.length&&new Set(ids).size===facts.length&&ids.every(id=>facts.some(f=>f.id===id)),'auditor must cover each fact exactly once');
 return result.audits.map(a=>{requireValue(['NONE','ASR_OCR_DISTORTION','MODEL_INDUCTION_ERROR','SOURCE_TEACHING_DEVIATION','UNDETERMINED'].includes(a.attribution)&&typeof a.supported==='boolean'&&typeof a.generalizable==='boolean'&&typeof a.rationale==='string'&&a.rationale.trim()&&['ACCEPT','CONTEXT_ONLY','REWRITE','PENDING_VERIFICATION'].includes(a.decision),'invalid attribution decision');return {fact_id:a.fact_id,attribution:a.attribution,supported:a.supported,generalizable:a.generalizable,rationale:a.rationale,proposed_correction:typeof a.proposed_correction==='string'?a.proposed_correction:'',standard_boundary:typeof a.standard_boundary==='string'?a.standard_boundary:'',external_reference_ids:[],decision:a.decision,certainty:a.attribution==='NONE'?'MODEL_REVIEW':'SOURCE_CHECK_REQUIRED'};});
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
 function refsFor(cards){const ids=new Set(cards.flatMap(f=>f.evidence_quotes.map(q=>q.evidence_id)));for(const e of evidence)if(ids.has(e.id))for(const id of e.aligned_evidence_ids)ids.add(id);return evidence.filter(e=>ids.has(e.id)).map(e=>({id:e.id,source_type:e.source_type,text:e.raw_text,flags:e.flags,aligned_evidence_ids:e.aligned_evidence_ids}));}
 const groups=chunkBySize(facts,10000);
 for(let i=0;i<groups.length;i++){const batch=groups[i];progress({stage:'attribution_audit',completed:i,total:groups.length});
  const r=await call('attribution_audit',AUDIT_PROMPT,{facts:batch,evidence:refsFor(batch),conflicts:conflicts.filter(c=>c.fact_ids.some(id=>batch.some(f=>f.id===id)))});
  audits.push(...validateAudits(r,batch));
 }
 for(const f of facts){const a=enforceAttribution(audits.find(a=>a.fact_id===f.id),f,evidence);assignLayer(f,a);
  if(a.attribution==='MODEL_INDUCTION_ERROR'||a.decision==='REWRITE'){
   progress({stage:'fact_rewrite',completed:0,total:1});const output=await call('fact_rewrite',REWRITE_PROMPT,{fact:f,audit:a,evidence:refsFor([f])});const parsed=validateFacts(output,evidence);
   if(parsed.cards.length===1){const revised={...parsed.cards[0],id:f.id};
    const check=await call('attribution_audit',AUDIT_PROMPT,{facts:[revised],evidence:refsFor([revised]),conflicts:conflicts.filter(c=>c.fact_ids.includes(f.id))});
    const final=enforceAttribution(validateAudits(check,[revised])[0],revised,evidence);rewrites.push({before:structuredClone(f),after:structuredClone(revised),original_audit:a,recheck:final});
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
 return {facts,audits,rewrites,scope_checks};
}
