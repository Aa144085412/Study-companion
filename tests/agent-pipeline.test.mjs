import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {createApp} from '../server.mjs';

// 注入 fake launcher：不真正 spawn python 驱动，只记录传入的 (py, args)。
// 返回的 fake child 具备 on()/unref()，满足端点的使用方式。
async function fixture(t){
  const dataDir=fs.mkdtempSync(path.join(os.tmpdir(),'study-pipe-'));
  const skillsDir=fs.mkdtempSync(path.join(os.tmpdir(),'study-pipe-md-'));
  const store={schema:2,
    notebooks:[{id:'nb1',title:'小红书实验学习 · PCR 实验',createdAt:new Date().toISOString()}],
    sources:[{id:'src1',notebookId:'nb1',title:'p.txt',kind:'text',content:'PCR 95°C 30s。',createdAt:new Date().toISOString()}],
    revisions:[],messages:[],questions:[],jobs:[],agentRuns:[],
    settings:{llmUrl:'http://127.0.0.1:18081/v1',model:'test-model',asrUrl:'http://127.0.0.1:8000/v1',asrModel:'whisper-1',asrEngine:'builtin',ttsVoice:'zf_xiaobei'}};
  fs.writeFileSync(path.join(dataDir,'store.json'),JSON.stringify(store));
  const calls=[];
  const launcher=(py,args)=>{calls.push({py,args});return {on(){},unref(){}};};
  const app=createApp({dataDir,skillsDir,modelFetch:async()=>new Response('{}'),transcriber:async()=>({text:'x',segments:[]}),ttsSynthesizer:async()=>{throw new Error('unused');},pipelineLauncher:launcher});
  await new Promise(r=>app.listen(0,'127.0.0.1',r));
  const url=`http://127.0.0.1:${app.address().port}`;
  t.after(async()=>{await new Promise(r=>app.close(r));fs.rmSync(dataDir,{recursive:true,force:true});fs.rmSync(skillsDir,{recursive:true,force:true});});
  const call=async(p,data,method='POST')=>{const r=await fetch(url+p,data===undefined?{}:{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});return {status:r.status,body:await r.json().catch(async()=>({raw:await r.text()}))};};
  return {url,call,calls};
}

test('POST /api/agent/pipeline rejects empty goal (400)',async t=>{
  const {call}=await fixture(t);
  const r=await call('/api/agent/pipeline',{goal:'   '});
  assert.equal(r.status,400);
});

test('POST /api/agent/pipeline rejects overly long goal (400)',async t=>{
  const {call}=await fixture(t);
  const r=await call('/api/agent/pipeline',{goal:'x'.repeat(81)});
  assert.equal(r.status,400);
});

test('POST /api/agent/pipeline creates a pipeline run and launches the driver with correct args',async t=>{
  const {call,calls}=await fixture(t);
  const r=await call('/api/agent/pipeline',{goal:'PCR 实验'});
  assert.equal(r.status,202);
  assert.ok(r.body.runId);
  assert.equal(r.body.status,'running');
  assert.equal(r.body.mode,'reuse');
  assert.equal(r.body.goal,'PCR 实验');
  // launcher 恰好被调用一次，args 携带 goal/api/run-id
  assert.equal(calls.length,1);
  const {args}=calls[0];
  const iGoal=args.indexOf('--goal');
  assert.equal(args[iGoal+1],'PCR 实验');
  const iApi=args.indexOf('--api');
  assert.ok(args[iApi+1].startsWith('http://127.0.0.1:'));
  const iRun=args.indexOf('--run-id');
  assert.equal(args[iRun+1],r.body.runId);
  // 未开启 crawl / force 时不带相应 flag
  assert.ok(!args.includes('--crawl'));
  assert.ok(!args.includes('--force-skill'));
  // run 已落库（kind=pipeline，status=running，goal 正确）
  const runs=await call('/api/agent/runs?kind=pipeline',undefined,'GET');
  assert.equal(runs.status,200);
  assert.equal(runs.body.length,1);
  assert.equal(runs.body[0].kind,'pipeline');
  assert.equal(runs.body[0].status,'running');
  assert.equal(runs.body[0].goal,'PCR 实验');
});

test('POST /api/agent/pipeline passes --crawl and --force-skill through when requested',async t=>{
  const {call,calls}=await fixture(t);
  const r=await call('/api/agent/pipeline',{goal:'酵母转化',crawl:true,force:true});
  assert.equal(r.status,202);
  assert.equal(r.body.mode,'crawl');
  const {args}=calls[0];
  assert.ok(args.includes('--crawl'));
  assert.ok(args.includes('--force-skill'));
});

test('POST /api/agent/pipeline/:runId/result flips a running run to done and stores notebook+result',async t=>{
  const {call}=await fixture(t);
  const r=await call('/api/agent/pipeline',{goal:'PCR 实验'});
  const runId=r.body.runId;
  const report={goal:'PCR 实验',mode:'reuse',status:'done',notebook:{id:'nb1',title:'小红书实验学习 · PCR 实验',sources:8},steps:{skill:{skill:{name:'pcr-qpcr-colony-pcr'}}}};
  const res=await call(`/api/agent/pipeline/${runId}/result`,report);
  assert.equal(res.status,200);
  assert.equal(res.body.ok,true);
  assert.equal(res.body.status,'done');
  const one=await call(`/api/agent/runs?id=${runId}`,undefined,'GET');
  assert.equal(one.body.length,1);
  assert.equal(one.body[0].status,'done');
  assert.equal(one.body[0].notebookId,'nb1');
  assert.equal(one.body[0].notebookTitle,'小红书实验学习 · PCR 实验');
  assert.equal(one.body[0].result.steps.skill.skill.name,'pcr-qpcr-colony-pcr');
});

test('POST /api/agent/pipeline/:runId/result records a failed run when report.status is not done',async t=>{
  const {call}=await fixture(t);
  const r=await call('/api/agent/pipeline',{goal:'nope'});
  const runId=r.body.runId;
  const res=await call(`/api/agent/pipeline/${runId}/result`,{goal:'nope',status:'failed',error:'import exited 1: no notes'});
  assert.equal(res.status,200);
  assert.equal(res.body.status,'failed');
  const one=await call(`/api/agent/runs?id=${runId}`,undefined,'GET');
  assert.equal(one.body[0].status,'failed');
  assert.match(one.body[0].error,/import exited 1/);
});

test('POST /api/agent/pipeline/:runId/result unknown runId → 404',async t=>{
  const {call}=await fixture(t);
  const res=await call('/api/agent/pipeline/00000000-0000-0000-0000-000000000000/result',{status:'done'});
  assert.equal(res.status,404);
});

test('GET /api/agent/runs filters by kind and id (pipeline vs skill runs)',async t=>{
  const {call}=await fixture(t);
  await call('/api/agent/pipeline',{goal:'PCR 实验'});
  // 再造一条 pipeline run，便于断言 kind 过滤数量
  await call('/api/agent/pipeline',{goal:'酵母转化'});
  const byKind=await call('/api/agent/runs?kind=pipeline',undefined,'GET');
  assert.equal(byKind.body.length,2);
  assert.ok(byKind.body.every(x=>x.kind==='pipeline'));
  const first=byKind.body[0];
  const byId=await call(`/api/agent/runs?id=${first.id}`,undefined,'GET');
  assert.equal(byId.body.length,1);
  assert.equal(byId.body[0].id,first.id);
});
