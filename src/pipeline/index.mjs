import fs from 'node:fs';import path from 'node:path';import {hash,parseJSON} from './common.mjs';
import {ingestEvidence,cleanEvidence} from '../evidence_cleaner/index.mjs';import {synthesize} from '../note_synthesizer/index.mjs';import {auditFacts} from '../attribution_auditor/index.mjs';import {renderNote} from '../note_renderer/index.mjs';
export const PIPELINE_VERSION='2.2.0';
export function sourceFingerprint(sources){return hash(sources.filter(s=>s.kind==='text'&&!s.replacedBy).map(s=>({id:s.id,content:s.content,segments:s.segments,mediaId:s.mediaId})));}
export function makeStageCaller({model,modelName,cacheDir,provenance={},onCall=()=>{}}){
 fs.mkdirSync(cacheDir,{recursive:true});
 let lastFile=null;const caller=async(stage,prompt,input,framePath=null)=>{
  const image=framePath?fs.readFileSync(framePath):null,key=hash({version:PIPELINE_VERSION,stage,prompt,input,modelName,provenance,image:image?hash(image):null}),file=path.join(cacheDir,key+'.json');
  lastFile=file;if(fs.existsSync(file)){const cached=JSON.parse(fs.readFileSync(file,'utf8'));if(!cached.__invalid){onCall({stage,cached:true});return cached;}}
  const text=JSON.stringify(input),content=image?[{type:'text',text},{type:'image_url',image_url:{url:'data:image/jpeg;base64,'+image.toString('base64')}}]:text;
  let last;
  for(let attempt=0;attempt<2;attempt++){try{
   const result=await model('/chat/completions',{model:modelName,temperature:0,max_tokens:5000,chat_template_kwargs:{enable_thinking:false},messages:[{role:'system',content:prompt},{role:'user',content},...(attempt?[{role:'user',content:'上次输出无有效JSON或被截断。缩短内容，只输出要求的JSON对象，不加解释。'}]:[])]},undefined,240000);
   if(result.choices?.[0]?.finish_reason==='length')throw Error(stage+': model output truncated');
   const parsed=parseJSON(result.choices?.[0]?.message?.content||'');fs.writeFileSync(file+'.tmp',JSON.stringify(parsed));fs.renameSync(file+'.tmp',file);onCall({stage,cached:false});return parsed;
  }catch(e){last=e;if(e.status===504||e.status===502)throw e;}}
  throw last;
 };caller.invalidateLast=()=>{if(lastFile)fs.writeFileSync(lastFile,JSON.stringify({__invalid:true}));};return caller;
}
export async function runPipeline({sources,title,notebookId,dataDir,call,progress=()=>{},classifyLimit=12}){
 const input_hash=sourceFingerprint(sources),pipeline_id='P'+hash([PIPELINE_VERSION,input_hash]).slice(0,20),runDir=path.join(dataDir,'pipeline-v2',pipeline_id);fs.mkdirSync(runDir,{recursive:true});
 const write=(name,value)=>fs.writeFileSync(path.join(runDir,name),JSON.stringify(value,null,2));
 progress({stage:'evidence_cleaner',completed:0,total:1});const raw=ingestEvidence(sources,{dataDir,notebookId});if(!raw.length)throw Error('请先导入文字或完成转写');
 const clean=await cleanEvidence(raw,{title,call,classifyLimit});write('evidence.json',clean);
 const mapped=await synthesize(clean.evidence,{call,progress});write('map-reduce.json',mapped);
 const reviewed=await auditFacts(mapped.facts,clean.evidence,mapped.conflicts,{call,progress});write('audit.json',reviewed);
 const rendered=renderNote({title,facts:reviewed.facts,clusters:mapped.clusters,audits:reviewed.audits,conflicts:mapped.conflicts,evidence:clean.evidence,glossary:clean.glossary});
 const artifact={schema_version:'2.0',pipeline_id,input_hash,title,domain:clean.domain,glossary:clean.glossary,evidence:clean.evidence,facts:reviewed.facts,conflicts:mapped.conflicts,audits:reviewed.audits,clusters:mapped.clusters,markdown:rendered.markdown,metrics:{raw_evidence:raw.length,noise:clean.evidence.filter(e=>e.noise).length,unknown_visual:clean.evidence.filter(e=>e.source_type==='UNKNOWN_VISUAL_OCR').length,map_batches:mapped.map_batches,extracted_cards:mapped.extracted_cards,semantic_merges:mapped.semantic_merges,coverage_recovered:mapped.coverage.reduce((n,b)=>n+b.recovered,0),facts:reviewed.facts.length,semantic_checked:reviewed.semantic_checks.length,semantic_blocked:reviewed.semantic_checks.filter(c=>!c.passed).length,core:reviewed.facts.filter(f=>f.layer==='CORE').length,context:reviewed.facts.filter(f=>f.layer==='CONTEXT').length,unresolved:reviewed.facts.filter(f=>f.layer==='UNRESOLVED').length,conflicts:mapped.conflicts.length,rejected_map_cards:mapped.rejects.length,rewrites:reviewed.rewrites.length,scope_downgrades:reviewed.scope_checks.filter(c=>!c.generalizable||c.counterexample.trim()).length},provenance:{quiz_verification:'blind_plus_grounding_v1',pipeline_version:PIPELINE_VERSION,independence:'separate_context_same_configured_model',scientific_verification:'MODEL_REVIEW_NOT_EXTERNAL_CERTIFICATION'}};
 artifact.pipeline_id='P'+hash(artifact).slice(0,20);
 const finalDir=path.join(dataDir,'pipeline-v2',artifact.pipeline_id);fs.mkdirSync(finalDir,{recursive:true});
 for(const file of ['evidence.json','map-reduce.json','audit.json'])fs.copyFileSync(path.join(runDir,file),path.join(finalDir,file));
 fs.writeFileSync(path.join(finalDir,'artifact.json'),JSON.stringify(artifact,null,2));fs.writeFileSync(path.join(finalDir,'notes.md'),artifact.markdown);progress({stage:'rendered',completed:1,total:1});
 return {artifact,citations:rendered.citations,runDir:finalDir};
}
