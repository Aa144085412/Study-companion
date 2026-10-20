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

test('POST /api/agent/media rejects invalid source (400)',async t=>{
  const {call}=await fixture(t);
  const r=await call('/api/agent/media',{source:'tumblr',url:'https://x.com/v/1'});
  assert.equal(r.status,400);
});

test('POST /api/agent/media rejects invalid URL (400)',async t=>{
  const {call}=await fixture(t);
  const r=await call('/api/agent/media',{source:'douyin',url:'not a url'});
  assert.equal(r.status,400);
});

test('POST /api/agent/media creates a run and launches url_pipeline.py with source+url+api+run-id',async t=>{
  const {call,calls}=await fixture(t);
  const url='https://www.douyin.com/video/7123456789012345678';
  const r=await call('/api/agent/media',{source:'douyin',url});
  assert.equal(r.status,202);
  assert.ok(r.body.runId);
  assert.equal(r.body.status,'running');
  assert.equal(r.body.source,'douyin');
  assert.equal(calls.length,1);
  const {py,args}=calls[0];
  assert.match(py,/python\.exe$/i);
  assert.ok(args.some(a=>/url_pipeline\.py$/.test(a)),args.join(' '));
  const iSrc=args.indexOf('--source');
  assert.equal(args[iSrc+1],'douyin');
  const iUrl=args.indexOf('--url');
  assert.equal(args[iUrl+1],url);
  const iApi=args.indexOf('--api');
  assert.ok(args[iApi+1].startsWith('http://127.0.0.1:'));
  const iRun=args.indexOf('--run-id');
  assert.equal(args[iRun+1],r.body.runId);
  // 未传 goal / cookie 时不带相应 flag
  assert.ok(!args.includes('--goal'));
  assert.ok(!args.includes('--cookie-file'));
  // run 落库（kind=pipeline，source=douyin，mode=url）
  const runs=await call('/api/agent/runs?kind=pipeline',undefined,'GET');
  const media=runs.body.find(x=>x.source==='douyin');
  assert.ok(media);
  assert.equal(media.mode,'url');
  assert.equal(media.status,'running');
});

test('POST /api/agent/media passes --goal and --cookie-file through when provided',async t=>{
  const {call,calls}=await fixture(t);
  const r=await call('/api/agent/media',{source:'wechat',url:'https://mp.weixin.qq.com/s/AbCd',goal:'酵母转化',cookieFile:'C:/cookies.txt'});
  assert.equal(r.status,202);
  const {args}=calls[0];
  const iGoal=args.indexOf('--goal');
  assert.equal(args[iGoal+1],'酵母转化');
  const iCookie=args.indexOf('--cookie-file');
  assert.equal(args[iCookie+1],'C:/cookies.txt');
});

test('POST /api/agent/media result callback flips a media run to done (shared pipeline /result)',async t=>{
  const {call}=await fixture(t);
  const r=await call('/api/agent/media',{source:'wechat',url:'https://mp.weixin.qq.com/s/AbCd'});
  const runId=r.body.runId;
  const report={source:'wechat',mode:'url',status:'done',notebook:{id:'nb1',title:'微信实验学习 · 酵母转化'},steps:{skill:{skill:{name:'yeast-liac-peg'}}}};
  const res=await call(`/api/agent/pipeline/${runId}/result`,report);
  assert.equal(res.status,200);
  assert.equal(res.body.status,'done');
  const one=await call(`/api/agent/runs?id=${runId}`,undefined,'GET');
  assert.equal(one.body[0].status,'done');
  assert.equal(one.body[0].notebookId,'nb1');
  assert.equal(one.body[0].result.steps.skill.skill.name,'yeast-liac-peg');
});

test('Bilibili course URL reaches the existing media driver',async t=>{
  const {call,calls}=await fixture(t);
  const r=await call('/api/agent/media',{source:'bilibili',url:'https://www.bilibili.com/video/BV19W4y1X79X'});
  assert.equal(r.status,202);
  assert.equal(calls[0].args[calls[0].args.indexOf('--source')+1],'bilibili');
  const tools=await call('/api/tools',undefined,'GET');
  assert.ok(JSON.stringify(tools.body).includes('bilibili'));
});
