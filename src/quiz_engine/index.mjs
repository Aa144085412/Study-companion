import {randomUUID} from 'node:crypto';import {quizEligible,requireValue} from '../pipeline/common.mjs';import {GENERATOR_PROMPT,BLIND_PROMPT,GROUNDING_PROMPT} from './prompts.mjs';
export function blindPayload(domain,q){return {domain,content:q.content,options:q.options.map(o=>({id:o.id,text:o.text}))};}
export function blindPass(q,b){return b&&b.pedagogical_value===true&&b.unique===true&&b.sufficient_conditions===true&&b.non_overlapping===true&&Array.isArray(b.answers)&&b.answers.length===1&&b.answers[0]===q.correct_answer&&typeof b.rationale==='string'&&b.rationale.trim()&&Array.isArray(b.option_judgments)&&b.option_judgments.length===4&&new Set(b.option_judgments.map(o=>o.id)).size===4&&b.option_judgments.every(o=>'ABCD'.includes(o.id)&&o.id.length===1&&typeof o.valid==='boolean'&&typeof o.reason==='string'&&o.reason.trim()&&o.valid===(o.id===q.correct_answer));}
export function validateCandidate(q,core){return q&&typeof q.content==='string'&&q.content.trim()&&q.content.length<=1600&&typeof q.topic==='string'&&q.topic.trim()&&['WHY','JUDGMENT','CONTROL_LOGIC','TROUBLESHOOTING'].includes(q.dimension)&&Array.isArray(q.options)&&q.options.length===4&&q.options.every((o,i)=>o.id==='ABCD'[i]&&typeof o.text==='string'&&o.text.trim())&&new Set(q.options.map(o=>o.text.trim())).size===4&&'ABCD'.includes(q.correct_answer)&&q.correct_answer.length===1&&typeof q.explanation==='string'&&q.explanation.trim()&&Array.isArray(q.fact_ids)&&q.fact_ids.length&&q.fact_ids.every(id=>core.some(f=>f.id===id));}
export function groundingPass(q,g,core){
 return g?.supported===true&&g.conditions_preserved===true&&g.answer_text===q.options.find(o=>o.id===q.correct_answer)?.text&&Array.isArray(g.unsupported_claims)&&g.unsupported_claims.length===0&&typeof g.rationale==='string'&&g.rationale.trim()&&Array.isArray(g.supports)&&g.supports.length>0&&g.supports.every(s=>typeof s.quote==='string'&&s.quote.trim().length>=4&&q.fact_ids.includes(s.fact_id)&&core.some(f=>f.id===s.fact_id&&f.statement.includes(s.quote)));
}
export async function generateVerifiedQuiz(artifact,{call,previous=[],progress=()=>{}}){
 requireValue(artifact.schema_version==='2.0','请先生成经过审计的三层笔记');const core=artifact.facts.filter(quizEligible);
 if(!core.length)return {questions:[],rejections:[],reason:'没有通过准入的核心知识点，未从原始资料出题。'};
 const candidates=await call('quiz_generate',GENERATOR_PROMPT,{domain:artifact.domain,facts:core.map(({evidence_quotes,...f})=>f),previous_questions:previous.map(q=>q.content).slice(-30)});
 requireValue(Array.isArray(candidates.questions)&&candidates.questions.length<=5,'题组输出必须是至多5题的数组');
 const questions=[],rejections=[];
 for(const q of candidates.questions){if(!validateCandidate(q,core)||previous.some(p=>p.content===q.content)||questions.some(p=>p.content===q.content)){rejections.push({content:q?.content||'',reason:'INVALID_OR_DUPLICATE_CANDIDATE'});continue;}
  progress({stage:'blind_solver',completed:questions.length+rejections.length,total:candidates.questions.length});
  const blind=await call('blind_solver',BLIND_PROMPT,blindPayload(artifact.domain,q));
  if(!blindPass(q,blind)){rejections.push({content:q.content,reason:'BLIND_SOLVER_REJECTED',blind});continue;}
  const grounding=await call('answer_grounding',GROUNDING_PROMPT,{content:q.content,answer_text:q.options.find(o=>o.id===q.correct_answer).text,explanation:q.explanation,facts:core.filter(f=>q.fact_ids.includes(f.id)).map(f=>({id:f.id,statement:f.statement,conditions:f.conditions}))});
  if(!groundingPass(q,grounding,core)){rejections.push({content:q.content,reason:'ANSWER_NOT_GROUNDED',grounding});continue;}
  const {pedagogical_value,...verification}=blind;
  questions.push({id:randomUUID(),content:q.content,topic:q.topic,dimension:q.dimension,options:q.options,correct_answer:q.correct_answer,explanation:q.explanation,fact_ids:q.fact_ids,blind_verification:verification,answer_grounding:grounding,verification_status:'BLIND_MODEL_AGREEMENT',pipeline_id:artifact.pipeline_id});
 }
 return {questions,rejections,reason:questions.length?'':'候选题未通过独立盲测，未进入题库。'};
}
