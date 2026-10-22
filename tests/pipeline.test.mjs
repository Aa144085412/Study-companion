import test from 'node:test';import assert from 'node:assert/strict';
import {noiseScore,ingestEvidence,cleanEvidence,selectVisualCandidates} from '../src/evidence_cleaner/index.mjs';
import {validateFacts,detectConflicts,deduplicate,mergeEquivalent,synthesize,reconcileClusters} from '../src/note_synthesizer/index.mjs';
import {assignLayer,auditFacts,enforceAttribution,auditEvidence,completeAudits} from '../src/attribution_auditor/index.mjs';
import {renderNote} from '../src/note_renderer/index.mjs';
import {blindPayload,blindPass,generateVerifiedQuiz,groundingPass} from '../src/quiz_engine/index.mjs';
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
 let calls=[];const initial=fact({statement:'超时一定说明服务损坏',parameters:[]});
 const result=await auditFacts([initial],[ev()],[],{progress:()=>{},call:async(stage,prompt,input)=>{
 calls.push(stage);if(stage==='source_relations')return {};if(stage==='semantic_check')return {checks:input.facts.map(f=>({fact_id:f.id,binding_supported:true,causality_supported:true,quantity_supported:true,evidence_quotes:[{evidence_id:'E1',quote:'超时设置为10秒'}],rationale:'对象、阶段及数量匹配原句'}))};if(stage==='fact_rewrite')return {facts:[fact({statement:'该演示设置超时为10秒',parameters:[]})]};
 return {audits:input.facts.map(f=>({fact_id:f.id,attribution:calls.length===1?'MODEL_INDUCTION_ERROR':'NONE',supported:calls.length!==1,generalizable:false,rationale:'原文仅说明设置',decision:calls.length===1?'REWRITE':'CONTEXT_ONLY'}))};
 }});
 assert.deepEqual(calls,['attribution_audit','fact_rewrite','attribution_audit','semantic_check','source_relations','semantic_check']);assert.equal(result.rewrites[0].original_audit.attribution,'MODEL_INDUCTION_ERROR');assert.equal(result.facts[0].layer,'CONTEXT');assert.ok(!result.facts[0].statement.includes('损坏'));
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
 assert.match(result.markdown,/单次示例数据/);assert.match(result.markdown,/疑似语音\/画面识别误差/);assert.ok(!result.markdown.includes('乱码不能直接放正文'));
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

test('central subtitles require image confirmation and verbatim region text',async()=>{
 const raw=[ev({id:'A',source_type:'ASR_TRANSCRIPT',text:'看这个位置存在不同字',raw_text:'看这个位置存在不同字'}),ev({id:'V',source_type:'UNKNOWN_VISUAL_OCR',text:'发现这个位置存在不同文字',raw_text:'发现这个位置存在不同文字',frame_path:'frame.jpg',flags:['UNKNOWN_VISUAL_ROLE']})];
 assert.equal(selectVisualCandidates(raw,1)[0].id,'V');
 const out=await cleanEvidence(raw,{title:'文字课',classifyLimit:1,call:async(stage)=>stage==='visual_classification'?{source_type:'SUBTITLE_OCR',text:raw[1].text,confidence:.99}:{domain:'通用',candidates:[]}});
 assert.equal(out.evidence[1].source_type,'SUBTITLE_OCR');assert.deepEqual(out.evidence[1].aligned_evidence_ids,['A']);assert.equal(out.evidence[1].raw_text,raw[1].raw_text);
 const bad=await cleanEvidence(raw,{title:'文字课',classifyLimit:1,call:async(stage)=>stage==='visual_classification'?{source_type:'SUBTITLE_OCR',text:'模型补写的原文不存在',confidence:.99}:{domain:'通用',candidates:[]}});assert.equal(bad.evidence[1].source_type,'UNKNOWN_VISUAL_OCR');
});
test('audit retrieves adjacent visual candidates without crossing media',()=>{
 const base=ev(),near=ev({id:'V',start_time:5,source_type:'UNKNOWN_VISUAL_OCR',flags:['UNKNOWN_VISUAL_ROLE']}),other=ev({id:'O',media_id:'other'});
 const refs=auditEvidence([fact()],[base,near,other]);assert.ok(refs.some(x=>x.id==='V'));assert.ok(!refs.some(x=>x.id==='O'));assert.ok(refs.find(x=>x.id==='V').flags.includes('UNKNOWN_VISUAL_ROLE'));
});
test('same units in different quantity roles are not conflicting and single-run prose cannot generalize',()=>{
 const p={name:'电压',value:'12',unit:'V',quantity_role:'输入',stage:'转换前',object:'电源',source_scope:'本次'};
 const a=fact({parameters:[p]}),b=fact({id:'F2',parameters:[{...p,value:'5',quantity_role:'输出',stage:'转换后'}]});assert.equal(detectConflicts([a,b]).length,0);
 assert.equal(detectConflicts([a,{...b,parameters:[{...p,value:'5'}]}]).length,1);
 const cards=validateFacts({facts:[fact({statement:'通常超时必须10秒',knowledge_type:'SINGLE_RUN_METRIC'})]},[ev()]).cards;
 assert.equal(cards[0].statement,'本次演示记录：超时设置为10秒');assert.ok(cards[0].flags.includes('PARAMETER_ROLE_UNRESOLVED'));
});
test('coverage review recovers an omitted topic with valid evidence',async()=>{
 const e=ev(),e2=ev({id:'E2',text:'输出需要单独验证',raw_text:'输出需要单独验证'});let checked=false;
 const result=await synthesize([e,e2],{progress:()=>{},call:async(stage,p,input)=>{
 if(stage==='fact_map')return {facts:[fact()]};
 if(stage==='coverage_review'){checked=true;return {facts:[fact({statement:'输出需要单独验证',entity:'输出',parameters:[],evidence_quotes:[{evidence_id:'E2',quote:e2.text}]})]};}
 return {clusters:[{title:'课程',fact_ids:input.facts.map(f=>f.id)}],conflicts:[],equivalences:[]};
 }});assert.equal(checked,true);assert.equal(result.facts.length,2);assert.equal(result.coverage[0].recovered,1);
});

test('parameter-only approval cannot cancel a detected induction error',async()=>{
 const parameters=[{name:'超时',value:'10',unit:'s',quantity_role:'等待阈值',stage:'请求',object:'客户端',source_scope:'本次'}];let rewritten=false;
 const result=await auditFacts([fact({parameters})],[ev()],[],{progress:()=>{},call:async(stage,p,input)=>{
 if(stage==='source_relations')return {};if(stage==='semantic_check')return {checks:input.facts.map(f=>({fact_id:f.id,binding_supported:true,causality_supported:true,quantity_supported:true,evidence_quotes:[{evidence_id:'E1',quote:'超时设置为10秒'}],rationale:'对象、阶段及数量匹配原句'}))};
 if(stage==='fact_rewrite'){rewritten=true;return {facts:[fact({parameters})]};}
 return {audits:input.facts.map(f=>({fact_id:f.id,attribution:stage==='attribution_audit'&&!rewritten?'MODEL_INDUCTION_ERROR':'NONE',supported:stage==='parameter_audit'||rewritten,generalizable:false,rationale:'核对对象和原句',decision:stage==='attribution_audit'&&!rewritten?'REWRITE':'CONTEXT_ONLY'}))};
 }});assert.ok(rewritten);assert.equal(result.rewrites.length,1);assert.equal(result.facts[0].layer,'CONTEXT');
});

test('reduce repairs omitted, duplicate and unknown ids without losing validated facts',()=>{
 const cards=[fact(),fact({id:'F2',topic:'第二主题'}),fact({id:'F3'})];
 const result=reconcileClusters(cards,[{title:'一',fact_ids:['F1','F1','invented']},null]);
 assert.deepEqual(result.clusters.flatMap(c=>c.fact_ids).sort(),['F1','F2','F3']);
 assert.equal(result.repairs.filter(r=>r.reason==='MISSING_ASSIGNMENT').length,2);
 assert.equal(result.repairs.filter(r=>r.reason==='DUPLICATE_ASSIGNMENT').length,1);
 assert.equal(reconcileClusters(cards,null).clusters.flatMap(c=>c.fact_ids).length,3);
});
test('different parameter semantics produce distinct fact identities',()=>{
 const a=fact(),b=fact({parameters:[{name:'timeout',value:'20',unit:'s'}]});
 const parsed=validateFacts({facts:[a,b]},[ev()]);
 assert.equal(new Set(parsed.cards.map(f=>f.id)).size,2);
 assert.equal(deduplicate(parsed.cards).length,2);
});

test('finite JSON numeric values normalize without losing cited facts or accepting booleans',()=>{
 const input=fact({parameters:[{name:'timeout',value:10,unit:'s'}]});
 const parsed=validateFacts({facts:[input]},[ev()]);
 assert.equal(parsed.cards.length,1);assert.equal(parsed.cards[0].parameters[0].value,'10');
 assert.equal(input.parameters[0].value,10);
 for(const value of [true,null,{},Infinity])assert.equal(validateFacts({facts:[fact({parameters:[{name:'timeout',value,unit:'s'}]})]},[ev()]).cards.length,0);
});

test('missing or duplicate audits remain unresolved and cannot enter quiz bank',()=>{
 const good={fact_id:'F1',attribution:'NONE',supported:true,generalizable:true,rationale:'supported',decision:'ACCEPT'};
 const cards=[fact({parameters:[],knowledge_type:'GENERAL_PRINCIPLE'}),fact({id:'F2'})];
 const output=completeAudits({audits:[good]},cards);
 assert.equal(output[0].decision,'ACCEPT');assert.equal(output[1].decision,'PENDING_VERIFICATION');
 assert.equal(quizEligible(assignLayer(cards[1],output[1])),false);
 assert.equal(completeAudits({audits:[good,good]},cards)[0].supported,false);
 assert.equal(completeAudits({},cards).length,2);
});

test('renderer does not promote audit speculation or raw ASR noise into notes',()=>{
 const a=fact({layer:'UNRESOLVED'}),b=fact({id:'F2',layer:'CONTEXT',knowledge_type:'SINGLE_RUN_METRIC',statement:'Snapdragon纸律乱码'});
 const output=renderNote({title:'课程',facts:[a,b],clusters:[{title:'主题',fact_ids:['F1','F2']}],audits:[{fact_id:'F1',attribution:'NONE',rationale:'虚构的学科标准',proposed_correction:'未经证实的纠正'}],conflicts:[],evidence:[ev({source_type:'ASR_TRANSCRIPT'})],glossary:[]});
 assert.ok(!output.markdown.includes('虚构的学科标准'));assert.ok(!output.markdown.includes('未经证实的纠正'));assert.ok(!output.markdown.includes('Snapdragon'));
 assert.match(output.markdown,/仅引用语音转写/);
});

test('mixed single-run evidence renders visual quote without importing ASR entity errors',()=>{
 const f=fact({layer:'CONTEXT',parameters:[],knowledge_type:'SINGLE_RUN_METRIC',entity:'wrong-ASR-name',statement:'wrong-ASR-name and action',evidence_quotes:[{evidence_id:'E1',quote:'wrong-ASR-name'},{evidence_id:'E2',quote:'点击序列比对'}]});
 const result=renderNote({title:'课程',facts:[f],clusters:[{title:'分析',fact_ids:[f.id]}],audits:[],conflicts:[],evidence:[ev({source_type:'ASR_TRANSCRIPT'}),ev({id:'E2'})],glossary:[]});
 assert.ok(!result.markdown.includes('wrong-ASR-name'));assert.match(result.markdown,/点击序列比对/);
});

test('answer grounding rejects invented mechanism even when blind solver agrees',()=>{
 const core=[fact({statement:'校验输入可以发现格式错误'})],q={correct_answer:'A',options:[{id:'A',text:'校验会自动修复硬件'}],fact_ids:['F1']};
 const result={answer_text:q.options[0].text,supported:false,conditions_preserved:true,unsupported_claims:['自动修复没有依据'],supports:[{fact_id:'F1',quote:core[0].statement}],rationale:'发现不等于修复'};
 assert.equal(groundingPass(q,result,core),false);
 assert.equal(groundingPass(q,{...result,supported:true,unsupported_claims:[],supports:[{fact_id:'F1',quote:'虚构的引用原句'}]},core),false);
 assert.ok(groundingPass(q,{...result,supported:true,unsupported_claims:[]},core));
});

test('quiz pipeline refuses a blind-approved answer when its mechanism lacks source support',async()=>{
 const q={content:'为什么需要校验？',topic:'校验',dimension:'WHY',options:'ABCD'.split('').map(id=>({id,text:'选项'+id})),correct_answer:'B',explanation:'添加了未支持的机制',fact_ids:['F1']};
 const core=fact({knowledge_type:'GENERAL_PRINCIPLE',layer:'CORE',verification:'MODEL_REVIEWED',parameters:[]});
 const calls=[];
 const result=await generateVerifiedQuiz({schema_version:'2.0',pipeline_id:'P1',domain:'软件',facts:[core]},{call:async(stage)=>{
  calls.push(stage);if(stage==='quiz_generate')return {questions:[q]};
  if(stage==='blind_solver')return {answers:['B'],unique:true,sufficient_conditions:true,non_overlapping:true,pedagogical_value:true,option_judgments:'ABCD'.split('').map(id=>({id,valid:id==='B',reason:'独立判断'})),rationale:'盲解同意'};
  return {supported:false,unsupported_claims:['没有事实支持机制']};
 }});
 assert.deepEqual(calls,['quiz_generate','blind_solver','answer_grounding']);assert.equal(result.questions.length,0);assert.equal(result.rejections[0].reason,'ANSWER_NOT_GROUNDED');
});
