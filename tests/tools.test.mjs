import {stageResult,stageName} from './pipeline-fixture.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {createApp} from '../server.mjs';

const SKILL_MD='---\nname: test-media-skill\nkind: knowledge\ntitle: 测试媒体知识\ndescription: 测试知识 skill\n---\n# 测试媒体知识\n\n## 概览\n测试。\n\n## 核心要点\n- 参数待核对。\n\n## 来源\n- 测试视频。\n';
const NOTE_MD='## 测试学习笔记\n\n### 1. 目的\n测试。\n\n- 参数待核对。\n';

function jsonResp(content){
  const choices=[typeof content==='string'?{message:{content}}:{message:content}];
  return new Response(JSON.stringify({choices}),{status:200,headers:{'content-type':'application/json'}});
}
// Stateful fake LLM: first `tools`-bearing call = loop turn 1 (import_to_notebook),
// second = loop turn 2 (make_skill, using notebookId from the last tool result — no kind arg,
// the server auto-classifies), third = final text. Non-tool calls: make_skill triggers a
// classify call (user prompt asks for exactly experiment|knowledge) then a skill-gen call
// (system "知识整理助手"); note-gen is "你是研习伴".
function fakeAgentModel(){
  let loopTurn=0;
  return async(url,opts)=>{
    const payload=JSON.parse(opts.body);
    const msgs=payload.messages||[];
    const sys=(msgs.find(m=>m.role==='system')?.content)||'';
    const user=(msgs.find(m=>m.role==='user')?.content)||'';
    if(payload.tools){
      loopTurn++;
      if(loopTurn===1){
        return jsonResp({content:'',tool_calls:[{id:'c1',type:'function',function:{name:'import_to_notebook',arguments:JSON.stringify({title:'测试视频标题',text:'转写正文：感受态、热激、涂板。'})}}]});
      }
      if(loopTurn===2){
        const lastTool=[...msgs].reverse().find(m=>m.role==='tool');
        const nbId=lastTool?JSON.parse(lastTool.content).notebookId:'nope';
        return jsonResp({content:'',tool_calls:[{id:'c2',type:'function',function:{name:'make_skill',arguments:JSON.stringify({notebookId:nbId})}}]});
      }
      return jsonResp('已完成：落了共读笔记并生成 skill。');
    }
    if(stageName(payload))return jsonResp(JSON.stringify(stageResult(stageName(payload),JSON.parse(user))));
    if(/只输出 experiment 或 knowledge/.test(user)) return jsonResp('knowledge');
    if(/^你是实验笔记整理助手|你是知识整理助手/.test(sys)) return jsonResp(SKILL_MD);
    if(sys.startsWith('你是研习伴')) return jsonResp(NOTE_MD);
    return jsonResp('done');
  };
}

async function fixture(t,modelFetch,pipelineLauncher){
  const dataDir=fs.mkdtempSync(path.join(os.tmpdir(),'study-tools-'));
  const skillsDir=fs.mkdtempSync(path.join(os.tmpdir(),'study-tools-md-'));
  const store={schema:2,notebooks:[],sources:[],revisions:[],messages:[],questions:[],jobs:[],agentRuns:[],
    settings:{llmUrl:'http://127.0.0.1:18081/v1',model:'test-model',asrUrl:'http://127.0.0.1:8000/v1',asrModel:'whisper-1',asrEngine:'builtin',ttsVoice:'zf_xiaobei'}};
  fs.writeFileSync(path.join(dataDir,'store.json'),JSON.stringify(store));
  const app=createApp({dataDir,skillsDir,modelFetch,transcriber:async()=>({text:'x',segments:[]}),ttsSynthesizer:async()=>{throw new Error('unused');},pipelineLauncher});
  await new Promise(r=>app.listen(0,'127.0.0.1',r));
  const url=`http://127.0.0.1:${app.address().port}`;
  t.after(async()=>{await new Promise(r=>app.close(r));fs.rmSync(dataDir,{recursive:true,force:true});fs.rmSync(skillsDir,{recursive:true,force:true});});
  const call=async(p,data,method='POST')=>{const r=await fetch(url+p,data===undefined?{}:{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});return {status:r.status,body:await r.json().catch(async()=>({raw:await r.text()}))};};
  return {url,call,skillsDir,dataDir};
}
function fakeLauncher(){
  const calls=[];
  const launcher=(py,args,opts)=>{calls.push({py,args,opts});return {on(){},unref(){}};};
  launcher.calls=calls;
  return launcher;
}

test('GET /api/tools lists the agent tools with parameters',async t=>{
  const {call}=await fixture(t,fakeAgentModel(),fakeLauncher());
  const r=await call('/api/tools',undefined,'GET');
  assert.equal(r.status,200);
  const names=r.body.map(x=>x.name);
  for(const n of ['download_media','transcribe','import_to_notebook','make_skill','summarize','fetch_wechat_articles','fetch_xhs_notes']) assert.ok(names.includes(n),`missing ${n}`);
  const im=r.body.find(x=>x.name==='import_to_notebook');
  assert.ok(im.parameters.properties.title);
  assert.ok(im.parameters.required.includes('title'));
});

test('POST /api/agent/tools builds a kind=tools run and spawns the driver',async t=>{
  const launcher=fakeLauncher();
  const {call}=await fixture(t,fakeAgentModel(),launcher);
  const r=await call('/api/agent/tools',{source:'douyin',url:'https://v.douyin.com/abc/'});
  assert.equal(r.status,202);
  assert.equal(typeof r.body.runId,'string');
  assert.equal(r.body.status,'running');
  // run recorded as kind=tools
  const run=await call('/api/agent/runs?id='+r.body.runId,undefined,'GET');
  assert.equal(run.status,200);
  assert.equal(run.body.length,1);
  assert.equal(run.body[0].kind,'tools');
  assert.equal(run.body[0].status,'running');
  // driver spawned with the right script + args
  assert.equal(launcher.calls.length,1);
  const c=launcher.calls[0];
  assert.match(c.py,/tools_pipeline\.py|\.venv-ocr/);
  assert.ok(c.py.endsWith('python.exe'));
  const a=c.args;
  assert.ok(a.some(x=>x.endsWith('tools_pipeline.py')));
  assert.ok(a.includes('--run-id')&&a.includes(r.body.runId));
  assert.ok(a.includes('--source')&&a.includes('douyin'));
  assert.ok(a.includes('--url')&&a.includes('https://v.douyin.com/abc/'));
  // no kind arg is forwarded to the driver (server auto-classifies the material)
  assert.ok(!a.includes('--kind'));
});

test('POST /api/agent/tools rejects invalid url/source (400)',async t=>{
  const launcher=fakeLauncher();
  const {call}=await fixture(t,fakeAgentModel(),launcher);
  assert.equal((await call('/api/agent/tools',{source:'douyin',url:'not-a-url'})).status,400);
  assert.equal((await call('/api/agent/tools',{source:'nope',url:'https://x.com/1'})).status,400);
  assert.equal((await call('/api/agent/tools',{})).status,400);
  // nothing spawned on validation failure
  assert.equal(launcher.calls.length,0);
});

test('POST /api/tools/loop runs import_to_notebook then make_skill, lands a notebook and a skill file',async t=>{
  const launcher=fakeLauncher();
  const {call,skillsDir}=await fixture(t,fakeAgentModel(),launcher);
  const r=await call('/api/tools/loop',{source:'douyin',url:'https://v.douyin.com/abc/'});
  assert.equal(r.status,200);
  assert.equal(r.body.status,'done');
  // toolLog shows both tools ok
  const tools=r.body.toolLog.map(l=>l.tool);
  assert.ok(tools.includes('import_to_notebook'));
  assert.ok(tools.includes('make_skill'));
  for(const l of r.body.toolLog) assert.equal(l.ok,true);
  // a notebook landed with a text source and a generated note
  assert.ok(r.body.notebookId);
  const st=await call('/api/state',undefined,'GET');
  const nb=st.body.notebooks.find(b=>b.id===r.body.notebookId);
  assert.ok(nb);
  assert.match(nb.title,/视频学习 · 测试视频标题/);
  const src=st.body.sources.find(s=>s.notebookId===nb.id&&s.kind==='text');
  assert.ok(src);
  assert.ok(st.body.revisions.some(rv=>rv.notebookId===nb.id&&/核心原理与标准规范/.test(rv.content)));
  // a skill file was written
  assert.equal(r.body.skill.name,'test-media-skill');
  assert.equal(r.body.skill.kind,'knowledge');
  assert.equal(r.body.skill.portable,true);
  assert.ok(fs.existsSync(r.body.skill.path));
  assert.equal(r.body.skill.path,path.join(skillsDir,'test-media-skill.md'));
});

test('POST /api/tools/loop requires url or source (400)',async t=>{
  const {call}=await fixture(t,fakeAgentModel(),fakeLauncher());
  assert.equal((await call('/api/tools/loop',{})).status,400);
});

test('POST /api/agent/fetch-wechat builds a kind=tools run and spawns the driver',async t=>{
  const launcher=fakeLauncher();
  const {call}=await fixture(t,fakeAgentModel(),launcher);
  const r=await call('/api/agent/fetch-wechat',{query:'细胞电转染 实验步骤',max:5});
  assert.equal(r.status,202);
  assert.equal(typeof r.body.runId,'string');
  assert.equal(r.body.status,'running');
  assert.equal(r.body.source,'wechat');
  // run recorded as kind=tools, source=wechat
  const run=await call('/api/agent/runs?id='+r.body.runId,undefined,'GET');
  assert.equal(run.status,200);
  assert.equal(run.body.length,1);
  assert.equal(run.body[0].kind,'tools');
  assert.equal(run.body[0].status,'running');
  assert.equal(run.body[0].source,'wechat');
  // driver spawned with the right script + args
  assert.equal(launcher.calls.length,1);
  const c=launcher.calls[0];
  assert.ok(c.py.endsWith('python.exe'));
  const a=c.args;
  assert.ok(a.some(x=>x.endsWith('tools_pipeline.py')));
  assert.ok(a.includes('--run-id')&&a.includes(r.body.runId));
  assert.ok(a.includes('--source')&&a.includes('wechat'));
  // query stays a single argv element even with internal space
  assert.ok(a.includes('--query')&&a.includes('细胞电转染 实验步骤'));
  assert.ok(a.includes('--max')&&a.includes('5'));
});

test('POST /api/agent/fetch-wechat rejects missing/blank query (400, no spawn)',async t=>{
  const launcher=fakeLauncher();
  const {call}=await fixture(t,fakeAgentModel(),launcher);
  assert.equal((await call('/api/agent/fetch-wechat',{})).status,400);
  assert.equal((await call('/api/agent/fetch-wechat',{query:'   '})).status,400);
  assert.equal(launcher.calls.length,0);
});

test('POST /api/agent/fetch-xhs builds a kind=tools run and spawns the driver (default no crawl/limit)',async t=>{
  const launcher=fakeLauncher();
  const {call}=await fixture(t,fakeAgentModel(),launcher);
  const r=await call('/api/agent/fetch-xhs',{query:'细胞电转染 实验步骤'});
  assert.equal(r.status,202);
  assert.equal(typeof r.body.runId,'string');
  assert.equal(r.body.status,'running');
  assert.equal(r.body.source,'xhs-image');
  assert.equal(r.body.crawl,false);
  // run recorded as kind=tools, source=xhs-image
  const run=await call('/api/agent/runs?id='+r.body.runId,undefined,'GET');
  assert.equal(run.status,200);
  assert.equal(run.body.length,1);
  assert.equal(run.body[0].kind,'tools');
  assert.equal(run.body[0].status,'running');
  assert.equal(run.body[0].source,'xhs-image');
  // driver spawned with the right script + args
  assert.equal(launcher.calls.length,1);
  const c=launcher.calls[0];
  assert.ok(c.py.endsWith('python.exe'));
  const a=c.args;
  assert.ok(a.some(x=>x.endsWith('tools_pipeline.py')));
  assert.ok(a.includes('--run-id')&&a.includes(r.body.runId));
  assert.ok(a.includes('--source')&&a.includes('xhs-image'));
  // query stays a single argv element even with internal space
  assert.ok(a.includes('--query')&&a.includes('细胞电转染 实验步骤'));
  // no crawl / limit flags by default
  assert.ok(!a.includes('--crawl'));
  assert.ok(!a.includes('--limit'));
});

test('POST /api/agent/fetch-xhs forwards crawl and limit to the driver',async t=>{
  const launcher=fakeLauncher();
  const {call}=await fixture(t,fakeAgentModel(),launcher);
  const r=await call('/api/agent/fetch-xhs',{query:'菌种活化',crawl:true,limit:5});
  assert.equal(r.status,202);
  assert.equal(r.body.crawl,true);
  assert.equal(r.body.limit,5);
  const a=launcher.calls[0].args;
  assert.ok(a.includes('--source')&&a.includes('xhs-image'));
  assert.ok(a.includes('--crawl'));
  assert.ok(a.includes('--limit')&&a.includes('5'));
});

test('POST /api/agent/fetch-xhs rejects missing/blank query (400, no spawn)',async t=>{
  const launcher=fakeLauncher();
  const {call}=await fixture(t,fakeAgentModel(),launcher);
  assert.equal((await call('/api/agent/fetch-xhs',{})).status,400);
  assert.equal((await call('/api/agent/fetch-xhs',{query:'   '})).status,400);
  assert.equal(launcher.calls.length,0);
});
