import test from 'node:test';import assert from 'node:assert/strict';
import {noiseScore,ingestEvidence,cleanEvidence} from '../src/evidence_cleaner/index.mjs';
import {validateFacts,detectConflicts,deduplicate,mergeEquivalent} from '../src/note_synthesizer/index.mjs';
import {assignLayer,auditFacts,enforceAttribution} from '../src/attribution_auditor/index.mjs';
import {renderNote} from '../src/note_renderer/index.mjs';
import {blindPayload,blindPass,generateVerifiedQuiz} from '../src/quiz_engine/index.mjs';
import {quizEligible} from '../src/pipeline/common.mjs';
const fact=(extra={})=>({id:'F1',topic:'设置',step:'启动',entity:'服务',property:'超时',statement:'该演示超时为10秒',parameters:[{name:'timeout',value:'10',unit:'s'}],conditions:['本机'],knowledge_type:'CONDITIONAL_PRACTICE',evidence_quotes:[{evidence_id:'E1',quote:'超时设置为10秒'}],flags:[],verification:'UNREVIEWED',layer:'UNRESOLVED',...extra});
const ev=(extra={})=>({id:'E1',source_id:'s',segment_id:'seg',media_id:'m',title:'软件课程',start_time:0,end_time:2,source_type:'SUBTITLE_OCR',raw_text:'超时设置为10秒',text:'超时设置为10秒',confidence:.95,flags:[],classification_method:'metadata',aligned_evidence_ids:[],frame_path:null,noise:false,...extra});
test('noise and modality provenance are domain-independent; no automatic glossary replacement',async()=>{
 assert.ok(noiseScore('大大大大大大大大')>.8);assert.equal(noiseScore('timeout=10 seconds'),0);
 const raw=[ev({id:'Easr',source_type:'ASR_TRANSCRIPT',text:'缓存穿头',raw_text:'缓存穿头'}),ev({id:'Ev',source_type:'VLM_VISUAL_INFERENCE',text:'可能是缓存面板',raw_text:'可能是缓存面板',flags:['VISUAL_INFERENCE']})];
 const result=await cleanEvidence(raw,{title:'计算机课程',call:async()=>({domain:'计算机',candidates:[{observed:'缓存穿头',proposed:'缓存穿透',evidence_ids:['Easr'],reason:'同音候选'}]})});
 assert.equal(result.evidence[0].raw_text,'缓存穿头');assert.equal(result.evidence[0].text,'缓存穿头');assert.equal(result.glossary[0].status,'CANDIDATE_ONLY');assert.ok(result.evidence[1].flags.includes('VISUAL_INFERENCE'));
});
test('stable evidence ids distinguish repeated document blocks',()=>{const items=ingestEvidence([{id:'s',kind:'text',title:'重复示例',content:'x'.repeat(3600)}]);assert.equal(items.length,2);assert.notEqual(items[0].id,items[1].id);});
test('cross-batch conflicts retain both values and different conditions do not collide',()=>{
 const a=fact(),b=fact({id:'F2',parameters:[{name:'timeout',value:'20',unit:'s'}]});assert.equal(detectConflicts([a,b]).length,1);
 assert.equal(detectConflicts([a,{...b,conditions:['远程']}]).length,0);
 const phys=fact({id:'P1',entity:'长度',step:'测量',property:'读数',parameters:[{name:'length',value:'10',unit:'m'}]});
 assert.equal(detectConflicts([phys,{...phys,id:'P2',parameters:[{name:'length',value:'10',unit:'cm'}]}]).length,1);
 assert.equal(deduplicate([a,{...a,id:'F3',evidence_quotes:[{evidence_id:'E2',quote:'另一个引用'}]}]).length,1);
});
test('unsupported map quotation cannot become a fact; risks survive extraction',()=>{
 assert.equal(validateFacts({facts:[fact({evidence_quotes:[{evidence_id:'E1',quote:'原文没有这个说法'}]})]},[ev()]).cards.length,0);
 const parsed=validateFacts({facts:[fact()]},[ev({flags:['HIGH_RISK_ISOLATED_NUMBER']})]);assert.ok(parsed.cards[0].flags.includes('HIGH_RISK_ISOLATED_NUMBER'));
});
test('knowledge layers and quiz blacklist fail closed even when auditor says accept',()=>{
 const audit={supported:true,generalizable:true,decision:'ACCEPT',attribution:'NONE'};
 for(const flag of ['SINGLE_RUN_METRIC','UNRESOLVED_CONFLICT','PENDING_VERIFICATION','VISUAL_INFERENCE','HIGH_RISK_ISOLATED_NUMBER']){const f=assignLayer(fact({knowledge_type:'GENERAL_PRINCIPLE',flags:[flag]}),audit);assert.equal(quizEligible(f),false);}
 assert.equal(assignLayer(fact({knowledge_type:'SINGLE_RUN_METRIC',flags:['SINGLE_RUN_METRIC']}),audit).layer,'CONTEXT');
 const good=assignLayer(fact({knowledge_type:'GENERAL_PRINCIPLE',parameters:[]}),audit);assert.equal(quizEligible(good),true);
});
test('model induction error rewrites against original evidence and is re-audited',async()=>{
 let calls=[];const initial=fact({statement:'超时一定说明服务损坏'});
 const result=await auditFacts([initial],[ev()],[],{progress:()=>{},call:async(stage,prompt,input)=>{
 calls.push(stage);if(stage==='fact_rewrite')return {facts:[fact({statement:'该演示设置超时为10秒'})]};
 return {audits:input.facts.map(f=>({fact_id:f.id,attribution:calls.length===1?'MODEL_INDUCTION_ERROR':'NONE',supported:calls.length!==1,generalizable:false,rationale:'原文仅说明设置',decision:calls.length===1?'REWRITE':'CONTEXT_ONLY'}))};
 }});
 assert.deepEqual(calls,['attribution_audit','fact_rewrite','attribution_audit']);assert.equal(result.rewrites[0].original_audit.attribution,'MODEL_INDUCTION_ERROR');assert.equal(result.facts[0].layer,'CONTEXT');assert.ok(!result.facts[0].statement.includes('损坏'));
});
test('blind solver sees neither key, explanation, facts nor transcripts and rejects ambiguity',async()=>{
 const q={content:'为什么要验证输入？',topic:'验证',dimension:'WHY',options:'ABCD'.split('').map(id=>({id,text:'选项'+id})),correct_answer:'B',explanation:'私有参考解析',fact_ids:['F1']};
 assert.deepEqual(Object.keys(blindPayload('软件',q)).sort(),['content','domain','options']);
 let seen;const artifact={schema_version:'2.0',pipeline_id:'P1',domain:'软件',facts:[fact({knowledge_type:'GENERAL_PRINCIPLE',layer:'CORE',verification:'MODEL_REVIEWED'})]};
 const result=await generateVerifiedQuiz(artifact,{call:async(stage,p,input)=>{if(stage==='quiz_generate')return {questions:[q]};seen=input;return {answers:['A','B'],unique:false,sufficient_conditions:false,non_overlapping:false,pedagogical_value:true};}});
 assert.equal(result.questions.length,0);assert.equal(result.rejections.length,1);assert.ok(!JSON.stringify(seen).includes('私有参考解析'));
 let called=false;const empty=await generateVerifiedQuiz({...artifact,facts:[fact({flags:['PENDING_VERIFICATION']})]},{call:async()=>{called=true;}});assert.equal(called,false);assert.equal(empty.questions.length,0);
});
test('renderer separates single demonstration values and unresolved conflict from core',()=>{
 const facts=[fact({knowledge_type:'SINGLE_RUN_METRIC',flags:['SINGLE_RUN_METRIC'],layer:'CONTEXT'}),fact({id:'F2',statement:'乱码不能直接放正文',layer:'UNRESOLVED'})];
 const result=renderNote({title:'物理课',facts,clusters:[{title:'测量',fact_ids:['F1','F2']}],audits:[{fact_id:'F2',attribution:'ASR_OCR_DISTORTION',rationale:'单位存在识别冲突'}],conflicts:[],evidence:[ev()],glossary:[]});
 assert.match(result.markdown,/单次示例数据/);assert.match(result.markdown,/单位存在识别冲突/);assert.ok(!result.markdown.includes('乱码不能直接放正文'));
});

test('semantic Reduce merges paraphrases but cannot erase conditions or conflicts',()=>{
 const a=fact(),b=fact({id:'F2',statement:'该步骤的等待阈值是十秒'}),clusters=[{title:'启动',fact_ids:['F1','F2']}],groups=[{fact_ids:['F1','F2'],canonical_id:'F1'}];
 assert.equal(mergeEquivalent([a,b],clusters,groups,[]).facts.length,1);
 assert.equal(mergeEquivalent([a,{...b,conditions:['远程']}],clusters,groups,[]).facts.length,2);
 assert.equal(mergeEquivalent([a,b],clusters,groups,[{fact_ids:['F1','F2']}]).facts.length,2);
});
test('source blame requires matching speech and subtitle evidence',()=>{
 const f=fact(),a={attribution:'SOURCE_TEACHING_DEVIATION',decision:'ACCEPT',rationale:'模型认为有偏差'};
 assert.equal(enforceAttribution({...a},f,[ev()]).attribution,'UNDETERMINED');
 const e=ev({aligned_evidence_ids:['A']}),speech=ev({id:'A',source_type:'ASR_TRANSCRIPT'});
 const result=enforceAttribution({...a},f,[e,speech]);assert.equal(result.attribution,'SOURCE_TEACHING_DEVIATION');assert.equal(result.decision,'PENDING_VERIFICATION');
});

test('independent counterexample review blocks a previously accepted core claim',async()=>{
 const result=await auditFacts([fact({knowledge_type:'GENERAL_PRINCIPLE'})],[ev()],[],{progress:()=>{},call:async(stage,p,input)=>stage==='scope_check'?{checks:input.claims.map(f=>({fact_id:f.fact_id,generalizable:false,counterexample:'网络延迟也会造成超时',rationale:'未排除其他原因'}))}:{audits:input.facts.map(f=>({fact_id:f.id,attribution:'NONE',supported:true,generalizable:true,rationale:'有原文支持',decision:'ACCEPT'}))}});
 assert.equal(result.facts[0].layer,'UNRESOLVED');assert.equal(quizEligible(result.facts[0]),false);assert.equal(result.scope_checks.length,1);
});
