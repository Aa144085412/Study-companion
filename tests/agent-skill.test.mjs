import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {createApp} from '../server.mjs';

const GEN_SKILL='---\nname: acetic-lithium-transform\ntitle: 醋酸锂转化酵母\ndescription: LiAc/PEG 转化\n---\n# 醋酸锂转化酵母\n\n## 目标\n导入质粒。\n\n## 步骤\n### 1. 感受态\n- 操作：冰上融化感受态。\n- 参数：温度待核对。\n### 2. 热激\n- 操作：42°C 热激。\n- 参数：15 分钟。\n\n## 安全\n无。\n';

function modelFetchReturning(content){
  return async()=>new Response(JSON.stringify({choices:[{message:{content}}]}),{status:200,headers:{'content-type':'application/json'}});
}
async function fixture(t,modelFetch){
  const dataDir=fs.mkdtempSync(path.join(os.tmpdir(),'study-agent-'));
  const skillsDir=fs.mkdtempSync(path.join(os.tmpdir(),'study-agent-md-'));
  const store={schema:2,
    notebooks:[{id:'nb1',title:'小红书实验学习 · 酵母转化',createdAt:new Date().toISOString()}],
    sources:[{id:'src1',notebookId:'nb1',title:'转化步骤.txt',kind:'text',content:'醋酸锂 PEG 转化，感受态冰上融化，42°C 热激 15 分钟，涂板计数。',createdAt:new Date().toISOString()}],
    revisions:[{id:'rev1',notebookId:'nb1',content:'## 酵母转化实验学习笔记\n\n### 1. 实验目的\n导入质粒。',createdAt:new Date().toISOString()}],
    messages:[],questions:[],jobs:[],agentRuns:[],
    settings:{llmUrl:'http://127.0.0.1:18081/v1',model:'test-model',asrUrl:'http://127.0.0.1:8000/v1',asrModel:'whisper-1',asrEngine:'builtin',ttsVoice:'zf_xiaobei'}};
  fs.writeFileSync(path.join(dataDir,'store.json'),JSON.stringify(store));
  const app=createApp({dataDir,skillsDir,modelFetch,transcriber:async()=>({text:'x',segments:[]}),ttsSynthesizer:async()=>{throw new Error('unused');}});
  await new Promise(r=>app.listen(0,'127.0.0.1',r));
  const url=`http://127.0.0.1:${app.address().port}`;
  t.after(async()=>{await new Promise(r=>app.close(r));fs.rmSync(dataDir,{recursive:true,force:true});fs.rmSync(skillsDir,{recursive:true,force:true});});
  const call=async(p,data,method='POST')=>{const r=await fetch(url+p,data===undefined?{}:{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});return {status:r.status,body:await r.json().catch(async()=>({raw:await r.text()}))};};
  return {url,call,skillsDir,dataDir};
}

test('POST /api/agent/skill generates a portable skill, extracts gaps, and records a run',async t=>{
  const {call,skillsDir}=await fixture(t,modelFetchReturning(GEN_SKILL));
  const r=await call('/api/agent/skill',{notebookId:'nb1'});
  assert.equal(r.status,201);
  assert.equal(r.body.status,'done');
  assert.equal(r.body.result.reused,false);
  assert.equal(r.body.result.skill.name,'acetic-lithium-transform');
  assert.equal(r.body.result.skill.portable,true);
  assert.ok(r.body.result.skill.steps>=2);
  assert.ok(fs.existsSync(r.body.result.skill.path));
  assert.equal(r.body.result.skill.path,path.join(skillsDir,'acetic-lithium-transform.md'));
  // gap extraction (deterministic): the mock skill has one 待核对
  assert.equal(r.body.result.gapCount,1);
  assert.match(r.body.result.gaps[0].text,/待核对/);
  assert.match(r.body.result.summary,/任何 agent/);
  // run recorded
  const runs=await call('/api/agent/runs?notebookId=nb1',undefined,'GET');
  assert.equal(runs.status,200);
  assert.equal(runs.body.length,1);
  assert.equal(runs.body[0].status,'done');
});

test('POST /api/agent/skill is idempotent: a second run reuses the same skill (no -2 duplicate)',async t=>{
  const {call,skillsDir}=await fixture(t,modelFetchReturning(GEN_SKILL));
  const first=await call('/api/agent/skill',{notebookId:'nb1'});
  assert.equal(first.body.result.reused,false);
  const second=await call('/api/agent/skill',{notebookId:'nb1'});
  assert.equal(second.status,201);
  assert.equal(second.body.result.reused,true);
  assert.equal(second.body.result.skill.name,'acetic-lithium-transform');
  assert.equal(second.body.result.skill.path,first.body.result.skill.path);
  // no -2 duplicate file created
  assert.ok(!fs.existsSync(path.join(skillsDir,'acetic-lithium-transform-2.md')));
  const runs=await call('/api/agent/runs?notebookId=nb1',undefined,'GET');
  assert.equal(runs.body.length,2);
});

test('POST /api/agent/skill force mode regenerates (reused=false) and reuses the same slug',async t=>{
  const {call,skillsDir}=await fixture(t,modelFetchReturning(GEN_SKILL));
  await call('/api/agent/skill',{notebookId:'nb1'});
  const force=await call('/api/agent/skill',{notebookId:'nb1',mode:'force'});
  assert.equal(force.status,201);
  assert.equal(force.body.result.reused,false);
  assert.equal(force.body.result.skill.name,'acetic-lithium-transform');
  assert.ok(fs.existsSync(path.join(skillsDir,'acetic-lithium-transform.md')));
  assert.ok(!fs.existsSync(path.join(skillsDir,'acetic-lithium-transform-2.md')));
});

test('POST /api/agent/skill rejects unknown notebook (404)',async t=>{
  const {call}=await fixture(t,modelFetchReturning(GEN_SKILL));
  const r=await call('/api/agent/skill',{notebookId:'nope'});
  assert.equal(r.status,404);
});

test('GET /api/agent/runs returns [] when no runs',async t=>{
  const {call}=await fixture(t,modelFetchReturning(GEN_SKILL));
  const r=await call('/api/agent/runs',undefined,'GET');
  assert.equal(r.status,200);
  assert.deepEqual(r.body,[]);
});

test('POST /api/sources deduplicates identical text content within a notebook',async t=>{
  const {call}=await fixture(t,modelFetchReturning(GEN_SKILL));
  const payload={notebookId:'nb1',title:'a.txt',content:'醋酸锂 PEG 转化，感受态冰上融化。'};
  const first=await call('/api/sources',payload);
  assert.equal(first.status,201);
  assert.equal(typeof first.body.hash,'string');
  const second=await call('/api/sources',payload);
  assert.equal(second.status,200);
  assert.equal(second.body.duplicate,true);
  assert.equal(second.body.id,first.body.id);
  // fixture starts with 1 source; only one new one should be added, not two
  const st=await call('/api/state',undefined,'GET');
  assert.equal(st.body.sources.length,2);
});

test('POST /api/agent/skill supports kind=knowledge and keeps it separate from experiment',async t=>{
  const GEN_KNOWLEDGE='---\nname: ai-agent-conflict\nkind: knowledge\ntitle: 多 Agent 防冲突要点\ndescription: 视频核心知识总结\n---\n# 多 Agent 防冲突要点\n\n## 核心要点\n- 参数待核对。\n\n## 来源\n- 抖音视频。\n';
  const {call,skillsDir}=await fixture(t,modelFetchReturning(GEN_KNOWLEDGE));
  const k=await call('/api/agent/skill',{notebookId:'nb1',kind:'knowledge'});
  assert.equal(k.status,201);
  assert.equal(k.body.result.skill.kind,'knowledge');
  assert.equal(k.body.result.skill.name,'ai-agent-conflict');
  assert.ok(fs.existsSync(path.join(skillsDir,'ai-agent-conflict.md')));
  const list=await call('/api/skills/list',undefined,'GET');
  assert.equal(list.status,200);
  const entry=list.body.find(s=>s.name==='ai-agent-conflict');
  assert.ok(entry);
  assert.equal(entry.kind,'knowledge');
});

test('GET /api/skills/list reflects generated skills with parsed meta',async t=>{
  const {call,skillsDir}=await fixture(t,modelFetchReturning(GEN_SKILL));
  const r=await call('/api/agent/skill',{notebookId:'nb1'});
  assert.equal(r.status,201);
  const list=await call('/api/skills/list',undefined,'GET');
  assert.equal(list.status,200);
  const entry=list.body.find(s=>s.name==='acetic-lithium-transform');
  assert.ok(entry);
  assert.equal(entry.title,'醋酸锂转化酵母');
  assert.equal(entry.kind,'experiment');
  assert.ok(fs.existsSync(entry.path));
});

test('skill tiering: new skill defaults to pre; POST /api/skills/queue toggles active/pre',async t=>{
  const {call}=await fixture(t,modelFetchReturning(GEN_SKILL));
  await call('/api/agent/skill',{notebookId:'nb1'});
  let list=await call('/api/skills/list',undefined,'GET');
  let entry=list.body.find(s=>s.name==='acetic-lithium-transform');
  assert.ok(entry);
  assert.equal(entry.status,'pre'); // self-generated skills start in pre-queue
  const up=await call('/api/skills/queue',{name:'acetic-lithium-transform',status:'active'});
  assert.equal(up.status,200);
  assert.equal(up.body.status,'active');
  list=await call('/api/skills/list',undefined,'GET');
  assert.equal(list.body.find(s=>s.name==='acetic-lithium-transform').status,'active');
  const down=await call('/api/skills/queue',{name:'acetic-lithium-transform',status:'pre'});
  assert.equal(down.status,200);
  assert.equal(down.body.status,'pre');
  assert.equal((await call('/api/skills/queue',{name:'acetic-lithium-transform',status:'nope'})).status,400);
  assert.equal((await call('/api/skills/queue',{name:'does-not-exist',status:'active'})).status,404);
});
