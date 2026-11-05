import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createApp} from '../server.mjs';
import {sourceFingerprint} from '../src/pipeline/index.mjs';

function seedResearchNotebook(dataDir){
 const artifact=JSON.parse(fs.readFileSync(new URL('./fixtures/research-notes/artifact.json',import.meta.url),'utf8'));
 const notebookId='research-web-notebook',byId=new Map();
 for(const e of artifact.evidence){
  let source=byId.get(e.source_id);
  if(!source){source={id:e.source_id,notebookId,kind:'text',title:e.title,content:e.raw_text,segments:[],createdAt:'2026-10-26T00:00:00.000Z'};byId.set(source.id,source);}
  if(e.segment_id)source.segments.push({id:e.segment_id,start:Number.isFinite(e.start_time)?Math.round(e.start_time*1000):0,end:Number.isFinite(e.end_time)?Math.round(e.end_time*1000):1000,text:e.text});
  if(e.media_id&&!source.mediaId)source.mediaId=e.media_id;
  if(e.media_id&&!byId.has(e.media_id))byId.set(e.media_id,{id:e.media_id,notebookId,kind:'media',title:e.title+' · 原媒体',file:e.media_id+'.mp3',mime:'audio/mpeg',size:4,createdAt:'2026-10-26T00:00:00.000Z'});
 }
 const sources=[...byId.values()];
 const store={schema:3,notebooks:[{id:notebookId,title:'科研网页集成测试',createdAt:'2026-10-26T00:00:00.000Z',auditedPipeline:{id:artifact.pipeline_id,inputHash:sourceFingerprint(sources),createdAt:'2026-10-26T00:00:00.000Z'}}],sources,
  revisions:[{id:'learning-note-1',notebookId,content:'原有学习笔记内容',createdAt:'2026-10-26T00:00:00.000Z'}],messages:[],questions:[],jobs:[],agentRuns:[],skillsQueue:{},trash:[],
  settings:{llmUrl:'http://127.0.0.1:1234/v1',model:'test-model',asrUrl:'http://127.0.0.1:8000/v1',asrModel:'whisper-1',asrEngine:'builtin',ttsVoice:'zh-CN-XiaoxiaoNeural'}};
 fs.mkdirSync(path.join(dataDir,'pipeline-v2',artifact.pipeline_id),{recursive:true});
 fs.mkdirSync(path.join(dataDir,'media'),{recursive:true});
 fs.writeFileSync(path.join(dataDir,'pipeline-v2',artifact.pipeline_id,'artifact.json'),JSON.stringify(artifact));
 fs.writeFileSync(path.join(dataDir,'store.json'),JSON.stringify(store));
 for(const source of sources.filter(item=>item.kind==='media'))fs.writeFileSync(path.join(dataDir,'media',source.file),Buffer.from('test'));
 return {artifact,notebookId};
}

test('research web endpoint renders both templates, links source evidence, and saves idempotent typed versions',async t=>{
 const dataDir=fs.mkdtempSync(path.join(os.tmpdir(),'study-research-web-'));
 const {notebookId}=seedResearchNotebook(dataDir);let chatPayload;
 const app=createApp({dataDir,modelFetch:async(_url,options)=>{chatPayload=JSON.parse(options.body);return new Response(JSON.stringify({choices:[{message:{content:'根据现有学习笔记回答。'}}]}),{status:200});}});
 await new Promise(resolve=>app.listen(0,'127.0.0.1',resolve));
 const root=`http://127.0.0.1:${app.address().port}`;
 async function call(url,data){const response=await fetch(root+url,data===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});return {status:response.status,body:await response.json()};}
 t.after(async()=>{await new Promise(resolve=>app.close(resolve));const resolved=path.resolve(dataDir);assert.equal(path.dirname(resolved),path.resolve(os.tmpdir()));assert.ok(path.basename(resolved).startsWith('study-research-web-'));fs.rmSync(resolved,{recursive:true,force:true});});

 const page=await (await fetch(root+'/')).text(),script=await (await fetch(root+'/app.js')).text();
 assert.match(page,/data-tab="research"/);assert.match(page,/id="researchTemplate"/);
 assert.match(script,/\/api\/research\/report\/save/);assert.match(script,/showReference\(/);

 const research=await call(`/api/research/report?notebookId=${notebookId}&template=research`);
 assert.equal(research.status,200);assert.equal(research.body.report.template,'research');
 assert.equal(research.body.report.metrics.source_items,4);assert.equal(research.body.report.metrics.pending_items,4);
 assert.match(research.body.markdown,/科研报告整理/);
 const cited=research.body.report.evidence_index.find(e=>e.mediaId);
 assert.ok(cited);assert.equal(cited.start,12375);assert.equal(cited.end,19125);assert.equal(cited.playbackAvailable,true);

 const meeting=await call(`/api/research/report?notebookId=${notebookId}&template=meeting`);
 assert.equal(meeting.status,200);assert.equal(meeting.body.report.template,'meeting');
 assert.deepEqual(meeting.body.report.sections.map(section=>section.id),['topics']);
 assert.equal((await call(`/api/research/report?notebookId=${notebookId}&template=invalid`)).status,400);
 assert.equal((await call('/api/research/report?notebookId=missing&template=research')).status,404);

 const saved=await call('/api/research/report/save',{notebookId,template:'research'});
 assert.equal(saved.status,201);assert.equal(saved.body.reused,false);
 assert.equal(saved.body.revision.kind,'research-report');assert.equal(saved.body.revision.auditPipelineId,research.body.report.source_pipeline_id);
 const duplicate=await call('/api/research/report/save',{notebookId,template:'research'});
 assert.equal(duplicate.status,200);assert.equal(duplicate.body.reused,true);assert.equal(duplicate.body.revision.id,saved.body.revision.id);
 const meetingSaved=await call('/api/research/report/save',{notebookId,template:'meeting'});
 assert.equal(meetingSaved.status,201);assert.notEqual(meetingSaved.body.revision.reportId,saved.body.revision.reportId);
 const state=(await call('/api/state')).body;
 assert.equal(state.revisions.length,3);assert.equal(state.revisions[0].content,'原有学习笔记内容');
 assert.equal(state.revisions.filter(r=>r.kind==='research-report').length,2);

 await call('/api/chat',{notebookId,question:'请结合我的笔记说明'});
 assert.ok(chatPayload.messages[1].content.includes('原有学习笔记内容'));
 assert.ok(!chatPayload.messages[1].content.includes('科研报告整理'));

 await call('/api/sources',{notebookId,title:'后来新增.txt',content:'新增资料使旧审计结果失效'});
 const stale=await call(`/api/research/report?notebookId=${notebookId}&template=research`);
 assert.equal(stale.status,409);assert.match(stale.body.error,/资料已更新/);
});

test('research report endpoint requires a current five-stage audited artifact',async t=>{
 const dataDir=fs.mkdtempSync(path.join(os.tmpdir(),'study-research-no-audit-'));
 const app=createApp({dataDir});await new Promise(resolve=>app.listen(0,'127.0.0.1',resolve));
 const root=`http://127.0.0.1:${app.address().port}`;
 t.after(async()=>{await new Promise(resolve=>app.close(resolve));const resolved=path.resolve(dataDir);assert.equal(path.dirname(resolved),path.resolve(os.tmpdir()));assert.ok(path.basename(resolved).startsWith('study-research-no-audit-'));fs.rmSync(resolved,{recursive:true,force:true});});
 const bookResponse=await fetch(root+'/api/notebooks',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:'没有审计结果'})});
 const book=await bookResponse.json();
 const reportResponse=await fetch(root+`/api/research/report?notebookId=${book.id}&template=research`);
 assert.equal(reportResponse.status,409);assert.match((await reportResponse.json()).error,/五阶段审计/);
});
