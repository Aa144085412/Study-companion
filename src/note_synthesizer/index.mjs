import {hash,norm,chunkBySize,requireValue} from '../pipeline/common.mjs';
import {MAP_PROMPT,REDUCE_PROMPT,COVERAGE_PROMPT} from './prompts.mjs';
export function validateFacts(output,evidence){
 requireValue(Array.isArray(output.facts)&&output.facts.length<=12,'fact_map: facts must be an array of at most 12');
 const cards=[];const rejects=[];
 for(const candidate of output.facts){
  const f=structuredClone(candidate);
  if(Array.isArray(f?.parameters))for(const p of f.parameters)if(p&&typeof p.value==='number'&&Number.isFinite(p.value))p.value=String(p.value);
  if(!f||typeof f!=='object'){rejects.push({reason:'INVALID_FACT_SCHEMA'});continue;}
  const strings=['topic','step','entity','property','statement'];
  if(!strings.every(k=>typeof f[k]==='string'&&f[k].trim()&&f[k].length<=1600)||!['GENERAL_PRINCIPLE','CONDITIONAL_PRACTICE','SINGLE_RUN_METRIC','SOURCE_CLAIM'].includes(f.knowledge_type)||!Array.isArray(f.evidence_quotes)||!f.evidence_quotes.length||!Array.isArray(f.parameters)||!f.parameters.every(p=>['name','value','unit'].every(k=>typeof p[k]==='string'))||!Array.isArray(f.conditions)||!f.conditions.every(c=>typeof c==='string')){rejects.push({reason:'INVALID_FACT_SCHEMA',candidate:f});continue;}
  if(!f.evidence_quotes.every(q=>typeof q.quote==='string'&&q.quote.trim().length>=4&&evidence.some(e=>e.id===q.evidence_id&&e.text.includes(q.quote)))){rejects.push({statement:f.statement,candidate:f,attribution:'MODEL_INDUCTION_ERROR',reason:'UNSUPPORTED_QUOTE'});continue;}
  const flags=new Set((Array.isArray(f.flags)?f.flags:[]).filter(x=>typeof x==='string'));
  for(const q of f.evidence_quotes)for(const flag of evidence.find(e=>e.id===q.evidence_id).flags)flags.add(flag);
  if(f.knowledge_type==='SINGLE_RUN_METRIC')flags.add('SINGLE_RUN_METRIC');
  const parameters=f.parameters.map(p=>({...p,...Object.fromEntries(['quantity_role','stage','object','source_scope'].map(k=>[k,typeof p[k]==='string'&&p[k].trim()?p[k]:'UNSPECIFIED']))}));
  if(parameters.some(p=>['quantity_role','stage','object','source_scope'].some(k=>p[k]==='UNSPECIFIED')))flags.add('PARAMETER_ROLE_UNRESOLVED');
  // Single-run prose is source-bounded even when a model adds a universal quantifier.
  if(f.knowledge_type==='SINGLE_RUN_METRIC')f.statement='本次演示记录：'+f.evidence_quotes.map(q=>q.quote).join('；');
  cards.push({id:'F'+hash([f.step,f.entity,f.property,f.statement,f.evidence_quotes,parameters,f.conditions,f.knowledge_type]).slice(0,16),...Object.fromEntries(strings.map(k=>[k,f[k]])),parameters,conditions:f.conditions,knowledge_type:f.knowledge_type,evidence_quotes:f.evidence_quotes.map(q=>({evidence_id:q.evidence_id,quote:q.quote})),flags:[...flags],verification:'UNREVIEWED',layer:'UNRESOLVED'});
 }
 return {cards,rejects};
}
export function deduplicate(cards){const groups=new Map();for(const f of cards){const k=norm([f.step,f.entity,f.property,f.statement,JSON.stringify(f.parameters),f.conditions.join('|'),f.knowledge_type].join('|'));const prior=groups.get(k);if(prior){for(const q of f.evidence_quotes)if(!prior.evidence_quotes.some(p=>p.evidence_id===q.evidence_id&&p.quote===q.quote))prior.evidence_quotes.push(q);prior.flags=[...new Set([...prior.flags,...f.flags])];}else groups.set(k,structuredClone(f));}return [...groups.values()];}
export function parametersConflict(left,right){
 const scope=p=>norm([p.name,p.quantity_role||'UNSPECIFIED',p.stage||'UNSPECIFIED',p.object||'UNSPECIFIED',p.source_scope||'UNSPECIFIED'].join('|'));
 return left.some(a=>right.some(b=>scope(a)===scope(b)&&(norm(a.value)!==norm(b.value)||norm(a.unit)!==norm(b.unit))));
}
export function detectConflicts(cards){const groups=new Map(),out=[];for(const f of cards){const k=norm([f.step,f.entity,f.property,[...f.conditions].sort().join('|')].join('|'));if(!groups.has(k))groups.set(k,[]);groups.get(k).push(f);}
 for(const group of groups.values()){for(let i=0;i<group.length;i++)for(let j=i+1;j<group.length;j++){const a=group[i],b=group[j];if(parametersConflict(a.parameters,b.parameters)){out.push({id:'C'+hash([a.id,b.id]).slice(0,16),fact_ids:[a.id,b.id],reason:'同一步骤/实体/属性/条件的参数或单位不同；未自动换算或覆盖',status:'UNRESOLVED_CONFLICT'});}}}return out;}
export function mergeEquivalent(facts,clusters,groups,conflicts){
 const alias=new Map(),removed=new Set();
 for(const group of groups||[]){
  if(!Array.isArray(group.fact_ids)||group.fact_ids.length<2||!group.fact_ids.includes(group.canonical_id)||group.fact_ids.some(id=>removed.has(id)))continue;
  const members=group.fact_ids.map(id=>facts.find(f=>f.id===id));if(members.some(f=>!f))continue;
  const canonical=members.find(f=>f.id===group.canonical_id);
  // A semantic grouping cannot erase a parameter/condition/type distinction or known conflict.
  if(members.some(f=>JSON.stringify(f.parameters)!==JSON.stringify(canonical.parameters)||JSON.stringify([...f.conditions].sort())!==JSON.stringify([...canonical.conditions].sort())||f.knowledge_type!==canonical.knowledge_type)||conflicts.some(c=>c.fact_ids.some(id=>group.fact_ids.includes(id))))continue;
  for(const f of members){if(f.id===canonical.id)continue;for(const q of f.evidence_quotes)if(!canonical.evidence_quotes.some(e=>e.evidence_id===q.evidence_id&&e.quote===q.quote))canonical.evidence_quotes.push(q);canonical.flags=[...new Set([...canonical.flags,...f.flags])];removed.add(f.id);alias.set(f.id,canonical.id);}
 }
 const assigned=new Set();const outputClusters=clusters.map(c=>({...c,fact_ids:c.fact_ids.map(id=>alias.get(id)||id).filter(id=>{if(assigned.has(id))return false;assigned.add(id);return true;})})).filter(c=>c.fact_ids.length);
 return {facts:facts.filter(f=>!removed.has(f.id)),clusters:outputClusters,merged:removed.size};
}
// Preserve every validated card even when model grouping is incomplete.
export function reconcileClusters(facts, proposed){
 const known=new Map(facts.map(f=>[f.id,f])),seen=new Set(),clusters=[],repairs=[];
 requireValue(known.size===facts.length,'reduce: duplicate fact identities');
 for(const c of Array.isArray(proposed)?proposed:[]){
  if(!c||!Array.isArray(c.fact_ids)){repairs.push({reason:'INVALID_CLUSTER'});continue;}
  const ids=[];
  for(const id of c.fact_ids){
   if(!known.has(id)){repairs.push({reason:'UNKNOWN_FACT_ID',fact_id:id});continue;}
   if(seen.has(id)){repairs.push({reason:'DUPLICATE_ASSIGNMENT',fact_id:id});continue;}
   seen.add(id);ids.push(id);
  }
  if(ids.length)clusters.push({title:typeof c.title==='string'&&c.title.trim()?c.title:'课程主题',fact_ids:ids});
 }
 const fallback=new Map();
 for(const f of facts)if(!seen.has(f.id)){
  const title=f.topic||'待整理主题';
  if(!fallback.has(title))fallback.set(title,[]);
  fallback.get(title).push(f.id);repairs.push({reason:'MISSING_ASSIGNMENT',fact_id:f.id});
 }
 for(const [title,fact_ids] of fallback)clusters.push({title,fact_ids});
 return {clusters,repairs};
}
export async function synthesize(evidence,{call,progress}){
 const allowed=evidence.filter(e=>!e.noise&&!['UNKNOWN_VISUAL_OCR','VLM_VISUAL_INFERENCE','UI_OR_INSTRUMENT_OCR'].includes(e.source_type));
 // Keep ASR for audit but prefer aligned subtitles in the extraction pass.
 const subtitles=new Set(allowed.filter(e=>e.source_type==='SUBTITLE_OCR').flatMap(e=>e.aligned_evidence_ids));
 const input=allowed.filter(e=>!subtitles.has(e.id)).map(e=>({id:e.id,text:e.text,source_type:e.source_type,start_time:e.start_time,flags:e.flags}));
 const batches=chunkBySize(input,7000),cards=[],rejects=[],coverage=[];
 for(let i=0;i<batches.length;i++){progress({stage:'fact_map',completed:i,total:batches.length});const result=await call('fact_map',MAP_PROMPT,{evidence:batches[i]});const parsed=validateFacts(result,evidence);cards.push(...parsed.cards);rejects.push(...parsed.rejects);
  progress({stage:'coverage_review',completed:i,total:batches.length});
  const supplement=await call('coverage_review',COVERAGE_PROMPT,{evidence:batches[i],existing_facts:parsed.cards,rejected_candidates:parsed.rejects});
  const recovered=validateFacts(supplement,evidence);cards.push(...recovered.cards);rejects.push(...recovered.rejects);
  coverage.push({batch:i,input_evidence_ids:batches[i].map(e=>e.id),initial:parsed.cards.length,recovered:recovered.cards.length,unresolved_rejections:recovered.rejects.length});}
 let facts=deduplicate(cards),clusters=[],reduceRepairs=[],semanticMerges=0;const conflicts=detectConflicts(facts);
 if(facts.length){progress({stage:'global_reduce',completed:0,total:1});const r=await call('global_reduce',REDUCE_PROMPT,{facts:facts.map(({evidence_quotes,...f})=>f)});
  const reconciled=reconcileClusters(facts,r.clusters);clusters=reconciled.clusters;reduceRepairs=reconciled.repairs;
  for(const c of r.conflicts||[]){if(Array.isArray(c.fact_ids)&&new Set(c.fact_ids).size>=2&&c.fact_ids.every(id=>facts.some(f=>f.id===id))&&typeof c.reason==='string')conflicts.push({id:'C'+hash(c).slice(0,16),fact_ids:c.fact_ids,reason:c.reason,status:'UNRESOLVED_CONFLICT'});}
  const merged=mergeEquivalent(facts,clusters,r.equivalences,conflicts);facts=merged.facts;clusters=merged.clusters;semanticMerges=merged.merged;
 }
 for(const c of conflicts)for(const id of c.fact_ids){const f=facts.find(f=>f.id===id);f.flags=[...new Set([...f.flags,'UNRESOLVED_CONFLICT'])];}
 return {facts,conflicts,clusters,rejects,map_batches:batches.length,extracted_cards:cards.length,semantic_merges:semanticMerges,reduce_repairs:reduceRepairs,coverage};
}
