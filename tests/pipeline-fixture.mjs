export function stageResult(stage,input){
 if(stage==='glossary')return {domain:'通用课程',candidates:[]};
 if(stage==='visual_classification')return {source_type:'UNKNOWN_VISUAL_OCR',confidence:0.2,reason:'不确定'};
 if(stage==='fact_map'||stage==='fact_rewrite')return {facts:(input.evidence||[]).slice(0,6).map((e,i)=>({topic:'主题'+i,step:'步骤'+i,entity:'对象'+i,property:'目的',statement:'依据材料进行检查'+e.id,parameters:[],conditions:[],knowledge_type:'GENERAL_PRINCIPLE',evidence_quotes:[{evidence_id:e.id,quote:e.text.slice(0,16)}],flags:[]}))};
 if(stage==='coverage_review')return {facts:[]};
 if(stage==='global_reduce')return {clusters:[{title:'概念与判断',fact_ids:input.facts.map(f=>f.id)}],conflicts:[]};
 if((stage==='attribution_audit'||stage==='parameter_audit'))return {audits:input.facts.map(f=>({fact_id:f.id,attribution:'NONE',supported:true,generalizable:true,rationale:'原文支持概念',proposed_correction:'',standard_boundary:'',external_reference_ids:[],decision:'ACCEPT',certainty:'MODEL_REVIEW'}))};
 if(stage==='scope_check')return {checks:input.claims.map(c=>({fact_id:c.fact_id,generalizable:true,counterexample:'',rationale:'无缺失前提'}))};
 if(stage==='quiz_generate')return {questions:Array.from({length:5},(_,i)=>({content:'为什么需要检查'+i+'？',topic:'判断依据',dimension:'WHY',options:'ABCD'.split('').map(id=>({id,text:'选项'+id})),correct_answer:'B',explanation:'B符合事实，其他不符合',fact_ids:[input.facts[0].id]}))};
 if(stage==='blind_solver')return {answers:['B'],unique:true,sufficient_conditions:true,non_overlapping:true,pedagogical_value:true,option_judgments:'ABCD'.split('').map(id=>({id,valid:id==='B',reason:'独立检查'+id})),rationale:'仅根据题干判定'};
 throw Error('unknown stage '+stage);
}
export function stageName(payload){return /\[stage:([^\]]+)\]/.exec(payload.messages[0].content)?.[1];}
