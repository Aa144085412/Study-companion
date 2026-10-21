import {stageResult,stageName} from './pipeline-fixture.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createApp} from '../server.mjs';
import {labelEvidence,batches,retrieve,terms} from '../src/distiller/evidence.mjs';
import {parseTurn} from '../src/deeptutor/engine.mjs';

test('retrieves tail evidence and adjacent timestamps using overlapping Chinese terms',()=>{
 const items=labelEvidence(Array.from({length:100},(_,i)=>({sourceId:'s',segmentId:String(i),text:i===98?'序列比对验证目标序列':'普通说明',start:i*1000,end:i*1000+900})));
 assert.ok(terms('如何做序列比对').includes('列比'));
 const found=retrieve(items,'序列比对');assert.equal(found[0].segmentId,'98');assert.ok(found.some(x=>x.segmentId==='99'));
 assert.equal(batches(items).flat().map(x=>x.text).join(''),items.map(x=>x.text).join(''));
});
test('tutor rejects fabricated reference and inappropriate evaluation',()=>{
 const value={evaluation:'initial',feedback_message:'',question:{type:'concept',content:'问题',topic:'主题',source_label:'S9'}};
 assert.throws(()=>parseTurn(JSON.stringify(value),'next',[{label:'S1'}]));
 value.question.source_label='S1';assert.throws(()=>parseTurn(JSON.stringify(value),'answer',[{label:'S1'}]));
});
async function fixture(t){
 const dataDir=fs.mkdtempSync(path.join(os.tmpdir(),'study-learning-'));let invalid=false,failBatch=0,truncateOnce=false;const batchesSeen=[];
 const modelFetch=async(url,opts)=>{
  const p=JSON.parse(opts.body),input=JSON.parse(p.messages.find(m=>m.role==='user').content),stage=stageName(p);
  if(stage==='fact_map'){
   if(truncateOnce){truncateOnce=false;return new Response(JSON.stringify({choices:[{finish_reason:'length',message:{content:'partial'}}]}));}
   if(failBatch===batchesSeen.length+1){failBatch=0;throw new DOMException('timeout','TimeoutError');}batchesSeen.push(input.evidence);
  }
  return new Response(JSON.stringify({choices:[{message:{content:JSON.stringify(stageResult(stage,input))}}]}));
 };
 const launches=[];const pipelineLauncher=(py,args)=>{launches.push({py,args});return {on(){},unref(){}};};
 let app=createApp({dataDir,modelFetch,pipelineLauncher});await new Promise(r=>app.listen(0,'127.0.0.1',r));
 const call=async(p,data,method=data===undefined?'GET':'POST')=>{const r=await fetch(`http://127.0.0.1:${app.address().port}`+p,{method,...(data===undefined?{}:{headers:{'Content-Type':'application/json'},body:JSON.stringify(data)})});return {status:r.status,body:await r.json()};};
 const nb=(await call('/api/notebooks',{title:'课'})).body;
 await call('/api/settings',{llmUrl:'http://127.0.0.1:1234/v1',model:'test',asrUrl:'http://localhost:8000/v1',asrModel:'whisper'});
 await call('/api/sources',{notebookId:nb.id,title:'课程.txt',content:'序列比对验证目标序列。'.repeat(2400)});
 t.after(async()=>{await new Promise(r=>app.close(r));assert.equal(path.dirname(dataDir),os.tmpdir());fs.rmSync(dataDir,{recursive:true,force:true});});
 return {call,nb,batchesSeen,launches,truncate:()=>{truncateOnce=true;},failAt:n=>{failBatch=n;},setInvalid:()=>{invalid=true;},restart:async()=>{await new Promise(r=>app.close(r));app=createApp({dataDir,modelFetch});await new Promise(r=>app.listen(0,'127.0.0.1',r));}};
}
test('distillation covers all source text and only returns complete draft',async t=>{
 const f=await fixture(t);const r=await f.call('/api/generate',{notebookId:f.nb.id});
 assert.equal(r.status,200,JSON.stringify(r.body));assert.ok(f.batchesSeen.length>0);assert.equal(r.body.coverage.processed,r.body.coverage.total);
 assert.equal(f.batchesSeen.flat().map(s=>s.text).join(''),'序列比对验证目标序列。'.repeat(2400));
});
test('legacy raw-source tutor generation is closed',async t=>{const f=await fixture(t);assert.equal((await f.call('/api/tutor',{notebookId:f.nb.id,action:'next',version:0})).status,410);});

test('end-of-course request retrieves last timed block despite ASR spelling errors',()=>{
 const found=retrieve(labelEvidence([{sourceId:'guide',text:'序列比对导学'},{sourceId:'audio',text:'普通片段',start:0},{sourceId:'audio',text:'点击序列笔队',start:1512000}]),'课程最后如何序列比对');
 assert.equal(found[0].start,1512000);
});

test('video review requires linked transcript and launches with original segments',async t=>{
 const f=await fixture(t),notebookId=f.nb.id;
 const media=(await f.call('/api/sources',{notebookId,title:'local.mp4',base64:'dGVzdA=='})).body;
 assert.equal((await f.call('/api/visual-review',{sourceId:media.id})).status,400);
 const tr=(await f.call('/api/sources',{notebookId,title:'transcript.srt',content:'1\n00:00:01,000 --> 00:00:02,000\n原转写'})).body;
 await f.call('/api/link-media',{sourceId:tr.id,mediaId:media.id});
 const r=await f.call('/api/visual-review',{sourceId:media.id,visionEnabled:true});assert.equal(r.status,202);
 const callback=await f.call('/api/agent/pipeline/'+r.body.id+'/result',{status:'done',summary:'核对完成'});assert.equal(callback.status,200);
 assert.equal(f.launches.length,1);const cfg=JSON.parse(fs.readFileSync(f.launches[0].args[2],'utf8'));
 assert.equal(cfg.segments[0].start,1000);assert.equal(cfg.mediaId,media.id);assert.equal(cfg.visionEnabled,true);
 assert.equal((await f.call('/api/agent/runs?id='+r.body.id)).body[0].status,'done');
});


test('failed batch retains cache across restart and background retry reports completion',async t=>{
 const f=await fixture(t);f.failAt(2);
 const first=await f.call('/api/generate',{notebookId:f.nb.id});
 assert.equal(first.status,504);assert.match(first.body.error,/240 秒/);assert.equal(f.batchesSeen.length,1);
 assert.equal((await f.call('/api/state')).body.messages.length,0);
 await f.restart();
 const retry=await f.call('/api/generate',{notebookId:f.nb.id,background:true});assert.equal(retry.status,202);
 let progress;
 for(let i=0;i<1000;i++){progress=(await f.call('/api/generate/status?notebookId='+f.nb.id)).body;if(progress.status!=='running')break;await new Promise(r=>setTimeout(r,5));}
 assert.equal(progress.status,'done');assert.equal(progress.completed,progress.total);
 assert.equal(f.batchesSeen.filter(b=>b[0].id===f.batchesSeen[0][0].id).length,1,'first successful Map batch must not be called again');
 const state=(await f.call('/api/state')).body;assert.equal(state.messages.length,0);assert.equal(state.revisions.length,1);assert.equal(state.revisions[0].coverage.batches,f.batchesSeen.length);
});

test('truncated model output retries without losing input text',async t=>{
 const f=await fixture(t);f.truncate();const r=await f.call('/api/generate',{notebookId:f.nb.id});assert.equal(r.status,200,JSON.stringify(r.body));
 assert.equal(f.batchesSeen.flat().map(s=>s.text).join(''),'序列比对验证目标序列。'.repeat(2400));
 assert.ok(!r.body.text.includes('partial'));
});

test('generated notes become central revisions and preserve previous notes',async t=>{
 const f=await fixture(t);await f.call('/api/notes',{notebookId:f.nb.id,content:'我的原笔记'});
 const r=await f.call('/api/generate',{notebookId:f.nb.id});assert.equal(r.status,200,JSON.stringify(r.body));
 const state=(await f.call('/api/state')).body;assert.equal(state.revisions.length,2);assert.equal(state.revisions[0].content,'我的原笔记');
 assert.equal(state.revisions[1].id,r.body.noteRevisionId);assert.equal(state.revisions[1].content,r.body.text);assert.ok(state.revisions[1].citations.length);assert.equal(state.messages.length,0);
});
test('existing chat draft adoption is idempotent and preserves history',async t=>{
 const f=await fixture(t);const state=(await f.call('/api/state')).body;
 state.messages.push({id:'old-draft',notebookId:f.nb.id,type:'draft',text:'已生成笔记',citations:[{label:'S1',sourceId:'s'}]});
 await f.call('/api/backup/restore',state);
 const a=await f.call('/api/notes/adopt-draft',{notebookId:f.nb.id,messageId:'old-draft'});assert.equal(a.status,201);
 const b=await f.call('/api/notes/adopt-draft',{notebookId:f.nb.id,messageId:'old-draft'});assert.equal(b.body.id,a.body.id);
 const saved=(await f.call('/api/state')).body;assert.equal(saved.revisions.length,1);assert.equal(saved.messages[0].adoptedRevisionId,a.body.id);assert.equal(saved.revisions[0].content,'已生成笔记');
});
