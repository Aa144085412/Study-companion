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
  if(truncateOnce){truncateOnce=false;return new Response(JSON.stringify({choices:[{finish_reason:'length',message:{content:'partial'}}]}));}
  const p=JSON.parse(opts.body),input=JSON.parse(p.messages.find(m=>m.role==='user').content);
  let content;
  if(input.action){content=invalid?'not json':JSON.stringify({evaluation:input.action==='next'?'initial':'partial',feedback_message:'再想想验证的对象。',question:{type:'concept',content:'为什么需要序列比对？',topic:'序列比对',source_label:input.sources[0].label}});}
  else {if(failBatch===batchesSeen.length+1){failBatch=0;throw new DOMException('timeout','TimeoutError');}batchesSeen.push(input.sources);content='材料总结 '+input.sources.map(s=>`[${s.label}]`).join(' ');}
  return new Response(JSON.stringify({choices:[{message:{content}}]}));
 };
 const launches=[];const pipelineLauncher=(py,args)=>{launches.push({py,args});return {on(){},unref(){}};};
 let app=createApp({dataDir,modelFetch,pipelineLauncher});await new Promise(r=>app.listen(0,'127.0.0.1',r));
 const call=async(p,data,method=data===undefined?'GET':'POST')=>{const r=await fetch(`http://127.0.0.1:${app.address().port}`+p,{method,...(data===undefined?{}:{headers:{'Content-Type':'application/json'},body:JSON.stringify(data)})});return {status:r.status,body:await r.json()};};
 const nb=(await call('/api/notebooks',{title:'课'})).body;
 await call('/api/settings',{llmUrl:'http://127.0.0.1:1234/v1',model:'test',asrUrl:'http://localhost:8000/v1',asrModel:'whisper'});
 await call('/api/sources',{notebookId:nb.id,title:'课程.txt',content:'序列比对验证目标序列。'.repeat(1200)});
 t.after(async()=>{await new Promise(r=>app.close(r));assert.equal(path.dirname(dataDir),os.tmpdir());fs.rmSync(dataDir,{recursive:true,force:true});});
 return {call,nb,batchesSeen,launches,truncate:()=>{truncateOnce=true;},failAt:n=>{failBatch=n;},setInvalid:()=>{invalid=true;},restart:async()=>{await new Promise(r=>app.close(r));app=createApp({dataDir,modelFetch});await new Promise(r=>app.listen(0,'127.0.0.1',r));}};
}
test('distillation covers all source text and only returns complete draft',async t=>{
 const f=await fixture(t);const r=await f.call('/api/generate',{notebookId:f.nb.id});
 assert.equal(r.status,200);assert.ok(f.batchesSeen.length>1);assert.equal(r.body.coverage.processed,r.body.coverage.total);
 assert.equal(f.batchesSeen.flat().map(s=>s.text).join(''),'序列比对验证目标序列。'.repeat(1200));
});
test('one question at a time, version conflicts, retries, persistence and trash restore',async t=>{
 const f=await fixture(t),id=f.nb.id;
 let r=await f.call('/api/tutor',{notebookId:id,action:'next',version:0});assert.equal(r.status,200);const q=r.body.turns[0];
 assert.equal((await f.call('/api/tutor',{notebookId:id,action:'next',version:1})).status,409);
 assert.equal((await f.call('/api/tutor',{notebookId:id,action:'answer',version:0,questionId:q.id,answer:'测试'})).status,409);
 r=await f.call('/api/tutor',{notebookId:id,action:'answer',version:1,questionId:q.id,answer:'验证片段'});assert.equal(r.status,200);assert.equal(r.body.turns.length,1);assert.equal(r.body.mastery[0].status,'partial');
 await f.restart();r=await f.call('/api/tutor?notebookId='+id);assert.equal(r.body.version,2);
 await f.call('/api/notebooks/'+id,{},'DELETE');assert.equal((await f.call('/api/tutor?notebookId='+id)).status,404);
 await f.call('/api/trash/'+id+'/restore',{});assert.equal((await f.call('/api/tutor?notebookId='+id)).body.version,2);
 f.setInvalid();r=await f.call('/api/tutor',{notebookId:id,action:'next',version:2});assert.equal(r.status,502);
 assert.equal((await f.call('/api/tutor?notebookId='+id)).body.version,2);
});

test('replacement archives unanswered question without grading the learner',async t=>{
 const f=await fixture(t),id=f.nb.id;
 const first=(await f.call('/api/tutor',{notebookId:id,action:'next',version:0})).body;
 const r=await f.call('/api/tutor',{notebookId:id,action:'next',version:1,replaceUnanswered:true});
 assert.equal(r.status,200);assert.equal(r.body.turns.length,1);assert.equal(r.body.superseded[0].id,first.turns[0].id);assert.equal(r.body.mastery.length,0);
});

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
 for(let i=0;i<100;i++){progress=(await f.call('/api/generate/status?notebookId='+f.nb.id)).body;if(progress.status!=='running')break;await new Promise(r=>setTimeout(r,5));}
 assert.equal(progress.status,'done');assert.equal(progress.completed,progress.total);
 assert.equal(f.batchesSeen.length,progress.total,'first successful batch must not be called again');
 const state=(await f.call('/api/state')).body;assert.equal(state.messages.length,1);assert.equal(state.messages[0].coverage.batches,progress.total);
});

test('truncated model output splits batch without losing text',async t=>{
 const f=await fixture(t);f.truncate();const r=await f.call('/api/generate',{notebookId:f.nb.id});assert.equal(r.status,200);
 assert.equal(f.batchesSeen.flat().map(s=>s.text).join(''),'序列比对验证目标序列。'.repeat(1200));
 assert.ok(!r.body.text.includes('partial'));
});
