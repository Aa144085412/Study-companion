import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const SCHEMA='research-quality-run/1.0';
const CATEGORIES=new Set(['literature_share','group_meeting','training','conference_presentation']);
const DECISIONS=new Set(['ACCEPT','PENDING']);
const ACTUAL_DECISIONS=new Set([...DECISIONS,'OMITTED','FAILED']);
const HASH=/^[a-f0-9]{64}$/i;
const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const requiredText=value=>typeof value==='string'&&value.trim().length>0;

function validateLocation(value,name){
 if(value===null)return;
 if(!object(value)||!requiredText(value.source_id))throw Error(`${name}需为null或包含source_id的对象`);
 if(value.segment_id!==undefined&&value.segment_id!==null&&!requiredText(value.segment_id))throw Error(`${name}.segment_id格式无效`);
 if(value.page!==undefined&&value.page!==null&&(!Number.isInteger(value.page)||value.page<1))throw Error(`${name}.page必须为正整数或null`);
 for(const field of ['start_ms','end_ms'])if(value[field]!==undefined&&value[field]!==null&&(!Number.isInteger(value[field])||value[field]<0))throw Error(`${name}.${field}必须为非负毫秒整数或null`);
 if(value.start_ms!=null&&value.end_ms!=null&&value.end_ms<=value.start_ms)throw Error(`${name}时间范围倒置`);
}

function validateCases(cases,materials){
 if(!Array.isArray(cases))throw Error('cases必须是数组');
 const seen=new Set();
 for(const row of cases){
  if(!object(row)||!requiredText(row.id)||seen.has(row.id))throw Error('case必须有不重复的id');seen.add(row.id);
  if(!materials.has(row.material_id))throw Error(`case ${row.id}引用了未登记材料`);
  if(!DECISIONS.has(row.expected_decision)||!ACTUAL_DECISIONS.has(row.actual_decision))throw Error(`case ${row.id}的预期/实际决定无效`);
  if(!Number.isInteger(row.elapsed_ms)||row.elapsed_ms<0)throw Error(`case ${row.id}缺少elapsed_ms`);
  if(!Object.hasOwn(row,'expected_location')||!Object.hasOwn(row,'actual_location'))throw Error(`case ${row.id}必须显式记录expected_location与actual_location（无定位时填null）`);
  if(row.failure!==null&&row.failure!==undefined&&typeof row.failure!=='string')throw Error(`case ${row.id}.failure必须为字符串或null`);
  if(typeof row.critical_error!=='boolean')throw Error(`case ${row.id}.critical_error必须为布尔值`);
  if(row.critical_error&&!['fixed','isolated','unresolved'].includes(row.critical_resolution))throw Error(`case ${row.id}的关键错误需要记录fixed/isolated/unresolved处置`);
  if(!requiredText(row.reviewer_id))throw Error(`case ${row.id}缺少人工复核人`);
  validateLocation(row.expected_location??null,`case ${row.id}.expected_location`);
  validateLocation(row.actual_location??null,`case ${row.id}.actual_location`);
 }
}

function locationMatches(expected,actual,tolerance){
 if(expected===null)return null;
 if(actual===null||expected.source_id!==actual.source_id)return false;
 for(const key of ['segment_id','page'])if(expected[key]!=null&&expected[key]!==actual[key])return false;
 for(const key of ['start_ms','end_ms'])if(expected[key]!=null&&(actual[key]==null||Math.abs(expected[key]-actual[key])>tolerance))return false;
 return true;
}

function summarize(cases,materials,tolerance){
 const result={cases:cases.length,false_accepts:0,false_rejections:0,omissions:0,source_location_mismatches:0,location_unavailable_cases:0,failures:0,critical_errors:0,unresolved_critical_errors:0,mean_elapsed_ms:0};
 let elapsed=0,located=0;
 for(const row of cases){
  const material=materials.get(row.material_id);
  if(row.expected_decision==='PENDING'&&row.actual_decision==='ACCEPT')result.false_accepts++;
  if(row.expected_decision==='ACCEPT'&&row.actual_decision==='PENDING')result.false_rejections++;
  if(row.actual_decision==='OMITTED')result.omissions++;
  if(row.actual_decision==='FAILED'||Boolean(row.failure))result.failures++;
  if(row.expected_location!=null){located++;if(!locationMatches(row.expected_location,row.actual_location??null,tolerance))result.source_location_mismatches++;}else result.location_unavailable_cases++;
  if(row.critical_error){result.critical_errors++;if(row.critical_resolution==='unresolved')result.unresolved_critical_errors++;}
  if(material)elapsed+=row.elapsed_ms;
 }
 result.located_cases=located;result.mean_elapsed_ms=cases.length?Math.round((elapsed/cases.length)*100)/100:null;
 return result;
}

export function evaluateResearchRun(run){
 if(!object(run)||run.schema_version!==SCHEMA)throw Error(`输入必须使用${SCHEMA}格式`);
 if(!['NOT_RUN','DEVELOPMENT_ONLY','REAL'].includes(run.state))throw Error('state只支持NOT_RUN、DEVELOPMENT_ONLY或REAL');
 const model=object(run.model)?run.model:{};
 if(Object.keys(model).some(key=>/(api.?key|token|secret|authorization|password)/i.test(key)))throw Error('model字段不能存放API密钥、令牌或密码');
 const modelReady=['provider','name','version'].every(key=>requiredText(model[key]));
 const materialsInput=Array.isArray(run.materials)?run.materials:[];
 const materials=new Map();
 for(const item of materialsInput){
  if(!object(item)||!requiredText(item.id)||materials.has(item.id))throw Error('materials必须包含不重复的id');
  if(!CATEGORIES.has(item.category)||!['development','held_out'].includes(item.split))throw Error(`材料${item.id}的category或split无效`);
  materials.set(item.id,item);
 }
 const cases=run.cases??[];
 if(run.state==='NOT_RUN'){
  return {schema_version:'research-quality-summary/1.0',run_id:requiredText(run.run_id)?run.run_id:'UNSET',state:'BLOCKED_MISSING_EXTERNAL_INPUTS',model_configured:modelReady,materials:materials.size,cases:Array.isArray(cases)?cases.length:null,development_metrics:null,held_out_metrics:null,quality_claim:'NOT_ASSERTED',blockers:['尚未提供已配置服务的提供商、模型名与版本。','尚未登记获准使用的真实文献分享及组会/培训材料。','尚无逐例人工标注和独立复核记录。']};
 }
 if(!Number.isInteger(run.location_tolerance_ms)||run.location_tolerance_ms<0)throw Error('location_tolerance_ms必须为非负整数');
 if(run.state==='DEVELOPMENT_ONLY'){
  for(const item of materials.values())if(item.split!=='development'||item.synthetic!==true||item.authorization!=='synthetic')throw Error('DEVELOPMENT_ONLY只接受标明synthetic的development材料');
  validateCases(cases,materials);
  return {schema_version:'research-quality-summary/1.0',run_id:run.run_id||'UNSET',state:'DEVELOPMENT_ONLY',model_configured:modelReady,materials:materials.size,cases:cases.length,development_metrics:materials.size?summarize(cases,materials,run.location_tolerance_ms):null,held_out_metrics:null,quality_claim:'NOT_ASSERTED',blockers:materials.size&&cases.length?[]:['没有合成开发材料及逐例记录；本结果不代表真实材料或模型质量。']};
 }
 if(!modelReady)throw Error('REAL运行必须记录实际服务提供商、模型名称与版本；不得填密钥');
 if(!materials.size||![...materials.values()].every(m=>m.authorization==='authorized'&&m.synthetic===false&&HASH.test(m.input_sha256||'')))throw Error('REAL运行的材料必须已获准、非合成，并只记录SHA-256摘要，不上传原文');
 if(![...materials.values()].some(m=>m.split==='development'))throw Error('REAL运行需单独登记development材料');
 const heldout=new Set([...materials.values()].filter(m=>m.split==='held_out').map(m=>m.category));
 if(!heldout.has('literature_share')||!['group_meeting','training'].some(category=>heldout.has(category)))throw Error('held_out必须同时覆盖文献分享与组会或培训材料');
 if(!Array.isArray(cases)||!cases.length)throw Error('REAL运行需要逐例人工复核记录');
 validateCases(cases,materials);
 const developmentCases=cases.filter(row=>materials.get(row.material_id).split==='development');
 const heldoutCases=cases.filter(row=>materials.get(row.material_id).split==='held_out');
 if(!developmentCases.length)throw Error('REAL运行需要单独的development逐例记录');
 if(!heldoutCases.length)throw Error('没有held_out逐例记录');
 const review=object(run.review)?run.review:{};
 if(typeof review.completed!=='boolean'||typeof review.independent!=='boolean'||typeof review.critical_errors_resolved!=='boolean')throw Error('review必须显式记录人工复核完成、独立复核和关键错误处置状态');
 const developmentMetrics=developmentCases.length?summarize(developmentCases,materials,run.location_tolerance_ms):null;
 const heldOutMetrics=summarize(heldoutCases,materials,run.location_tolerance_ms);
 const reviewRequired=!review.completed||!review.independent||!review.critical_errors_resolved||heldOutMetrics.unresolved_critical_errors>0;
 return {schema_version:'research-quality-summary/1.0',run_id:run.run_id||'UNSET',state:reviewRequired?'HUMAN_REVIEW_REQUIRED':'REVIEW_RECORDED',model:{provider:model.provider,name:model.name,version:model.version},materials:[...materials.values()].map(({id,category,split})=>({id,category,split})),development_metrics:developmentMetrics,held_out_metrics:heldOutMetrics,manual_review:{completed:review.completed,independent:review.independent,critical_errors_resolved:review.critical_errors_resolved},quality_claim:'NOT_ASSERTED',blockers:reviewRequired?['汇总工具只计算人工标注的错误与定位计数；须由团队核对每项错误并修复或隔离关键错误，不能仅凭该摘要宣称质量通过。']:[]};
}

function parseArgs(argv){
 let input='',out='';
 for(let i=0;i<argv.length;i++){
  const arg=argv[i];if(arg==='--input'&&!input)input=argv[++i]||'';else if(arg==='--out'&&!out)out=argv[++i]||'';else throw Error(`未知或重复参数：${arg}`);
 }
 if(!input)throw Error('用法：node scripts/evaluate-research-notes.mjs --input <record.json> [--out <summary.json>]');
 return {input:path.resolve(input),out:out?path.resolve(out):''};
}

async function main(){
 try{
  const args=parseArgs(process.argv.slice(2)),run=JSON.parse(fs.readFileSync(args.input,'utf8')),summary=evaluateResearchRun(run),content=JSON.stringify(summary,null,2)+'\n';
  if(args.out){if(fs.existsSync(args.out))throw Error('输出文件已存在，拒绝覆盖');fs.mkdirSync(path.dirname(args.out),{recursive:true});fs.writeFileSync(args.out,content,{flag:'wx'});}
  else process.stdout.write(content);
 }catch(error){process.stderr.write(`验收记录无效：${error.message}\n`);process.exitCode=1;}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await main();
