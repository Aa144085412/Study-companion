import test from 'node:test';import assert from 'node:assert/strict';
import {semanticDecision,reviewSemantics,annotationCausalityRisk} from '../src/attribution_auditor/semantic.mjs';
import {auditFacts,auditEvidence} from '../src/attribution_auditor/index.mjs';
const e={id:'E1',text:'等待下载20分钟，然后安装5分钟。',raw_text:'等待下载20分钟，然后安装5分钟。',source_id:'s',media_id:'m',start_time:10,end_time:15,aligned_evidence_ids:[],flags:[],source_type:'SUBTITLE_OCR'};
const f={id:'F1',statement:'安装20分钟',entity:'安装',property:'时长',step:'安装',topic:'软件',parameters:[],conditions:[],evidence_quotes:[{evidence_id:'E1',quote:e.text}],flags:[],knowledge_type:'CONDITIONAL_PRACTICE'};
const good={fact_id:'F1',binding_supported:true,causality_supported:true,quantity_supported:true,evidence_quotes:f.evidence_quotes,rationale:'完整支持'};
test('semantic gate fails closed on omitted duplicate unsupported and fabricated checks',()=>{
 for(const checks of [[],[good,good],[{...good,binding_supported:null}],[{...good,quantity_supported:false}],[{...good,evidence_quotes:[{evidence_id:'E1',quote:'不存在'}]}]])assert.equal(semanticDecision(checks,f,[e]).passed,false);
 assert.equal(semanticDecision([good],f,[e]).passed,true);
});
test('semantic reviewer receives source chronology but no previous verdict',async()=>{
 await reviewSemantics([{...f,layer:'CORE',verification:'MODEL_REVIEWED'}],[e],{refsFor:cards=>auditEvidence(cards,[e]),call:async(stage,p,input)=>{
 if(stage==='source_relations'){assert.equal(input.facts,undefined);return {};}
 assert.equal(input.facts[0].layer,undefined);assert.equal(input.facts[0].verification,undefined);assert.equal(input.evidence[0].start_time,10);assert.equal(input.evidence[0].media_id,'m');return {checks:[good]};}});
});
test('a previously accepted contextual claim is quarantined on semantic mismatch',async()=>{
 const result=await auditFacts([structuredClone(f)],[e],[],{progress:()=>{},call:async(stage)=>stage==='semantic_check'?{checks:[{...good,binding_supported:false,rationale:'20分钟属于下载而非安装'}]}:{audits:[{fact_id:'F1',supported:true,generalizable:false,attribution:'NONE',rationale:'原句存在',decision:'CONTEXT_ONLY'}]}});
 assert.equal(result.facts[0].layer,'UNRESOLVED');assert.equal(result.audits[0].attribution,'MODEL_INDUCTION_ERROR');assert.equal(result.semantic_checks[0].passed,false);
});

test('persistent annotation plus changing subtitle cannot certify a causal claim',()=>{
 const rows=['因为空间较小','容纳不了桌子','我们把桌子搬走'].map((t,i)=>({...e,id:'X'+i,text:'注：本次跳过检查 '+t,start_time:10+i}));
 const claim={...f,property:'省略原因',statement:'因为空间小而跳过检查',evidence_quotes:[{evidence_id:'X1',quote:rows[1].text}]};
 assert.equal(annotationCausalityRisk(claim,rows).length,1);
 assert.equal(annotationCausalityRisk({...claim,property:'操作',statement:'本次跳过检查'},rows).length,0);
 assert.equal(annotationCausalityRisk(claim,rows.map((r,i)=>({...r,media_id:String(i)}))).length,0);
 assert.equal(annotationCausalityRisk(claim,rows.slice(0,2)).length,0);
});
