import fs from 'node:fs';import path from 'node:path';
import {reviewSemantics} from '../src/attribution_auditor/semantic.mjs';
import {auditEvidence} from '../src/attribution_auditor/index.mjs';
import {makeStageCaller} from '../src/pipeline/index.mjs';
const dir='evaluation/2026-10-22';fs.mkdirSync(dir,{recursive:true});
const artifact=JSON.parse(fs.readFileSync('data/pipeline-v2/Pe5aacc8ee24291a69111/artifact.json','utf8'));
const ids=['F0f9e4b5251ea6ce9','Ffa53678401bc882f','F0b4c77f9767d18fa'];
const cases=ids.map(id=>({fact:artifact.facts.find(f=>f.id===id),expected:false,kind:'observed_course_error'}));
const examples=[
 ['等待下载20分钟，然后安装5分钟。','安装时长为20分钟。','安装','时长',false],
 ['等待下载20分钟，然后安装5分钟。','安装时长为5分钟。','安装','时长',true],
 ['合格率从20%变为30%，增加10个百分点。','合格率相对提升10%。','合格率','相对提升',false],
 ['合格率从20%变为30%，增加10个百分点。','合格率增加10个百分点。','合格率','百分点差',true],
 ['本次省略预热。因为空间不足，后来把桌子移到窗边。','因为空间不足，本次省略预热。','预热','省略原因',false],
 ['本次省略预热。因为空间不足，后来把桌子移到窗边。','因为空间不足，桌子被移到窗边。','桌子','移动原因',true]];
const evidence=[...artifact.evidence];
examples.forEach(([text,statement,entity,property,expected],i)=>{const id='TEST'+i,eid='EV'+i;evidence.push({id:eid,text,raw_text:text,source_type:'SUBTITLE_OCR',source_id:id,media_id:id,start_time:0,end_time:10,aligned_evidence_ids:[],flags:[],noise:false});cases.push({kind:'synthetic_cross_domain',expected,fact:{id,topic:'对照',step:entity,entity,property,statement,parameters:[],conditions:[],evidence_quotes:[{evidence_id:eid,quote:text}]}});});
const settings=JSON.parse(fs.readFileSync('data/store.json','utf8')).settings;
const base=new URL(settings.llmUrl);if(base.protocol!=='http:'||!['localhost','127.0.0.1','[::1]'].includes(base.hostname))throw Error('Local endpoint required');
const call=makeStageCaller({modelName:settings.model,cacheDir:'data/semantic-eval-cache',model:async(route,body)=>{const res=await fetch(base.href.replace(/\/$/,'')+route,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(240000)});if(!res.ok)throw Error('Local model HTTP '+res.status);return res.json();}});
const results=[];
for(const c of cases){console.log('Reviewing',c.fact.id);const [decision]=await reviewSemantics([c.fact],evidence,{call,refsFor:cards=>auditEvidence(cards,evidence)});results.push({...c,decision,matched:decision.passed===c.expected});fs.writeFileSync(path.join(dir,'semantic-regression.json'),JSON.stringify({scope:'3 observed failures and 6 synthetic development cases; not held-out gold standard',results},null,2));}
console.log(JSON.stringify({total:results.length,matched:results.filter(r=>r.matched).length,failed:results.filter(r=>!r.matched).map(r=>r.fact.id)}));
