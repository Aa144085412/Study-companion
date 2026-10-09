import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {createApp} from '../server.mjs';

const SKILL_MD='---\nname: dh5a-test\ntitle: 测试 DH5α 转化\ndescription: 化学感受态转化\n---\n# 测试 DH5α 转化\n\n## 目标\n导入 pGFP。\n\n## 步骤\n### 1. 冰浴\n- 操作：冰上放置。\n- 参数：10 分钟。\n### 2. 热激\n- 操作：42°C 热激。\n- 参数：45 秒。\n';
const GEN_SKILL='---\nname: generated-exp\ntitle: 生成的实验\ndescription: 自动整理\n---\n# 生成的实验\n\n## 目标\n测试。\n\n## 步骤\n### 1. 一步\n- 操作：做。\n### 2. 二步\n- 操作：做。\n\n## 安全\n无。\n';
function modelFetchReturning(content){
  return async()=>new Response(JSON.stringify({choices:[{message:{content}}]}),{status:200,headers:{'content-type':'application/json'}});
}
async function fixture(t,modelFetch){
  const dataDir=fs.mkdtempSync(path.join(os.tmpdir(),'study-skill-'));
  const skillsDir=fs.mkdtempSync(path.join(os.tmpdir(),'study-skill-md-'));
  const store={schema:2,notebooks:[{id:'nb1',title:'酵母转化学习',createdAt:new Date().toISOString()}],sources:[{id:'src1',notebookId:'nb1',title:'规程.txt',kind:'text',content:'感受态细胞冰上放置 10 分钟，加质粒冰浴 30 分钟，42°C 热激 45 秒，加 900 μL 无抗 LB 复苏，涂布含氨苄青霉素平板。',createdAt:new Date().toISOString()}],revisions:[],messages:[],questions:[],jobs:[],settings:{llmUrl:'http://127.0.0.1:18081/v1',model:'test-model',asrUrl:'http://127.0.0.1:8000/v1',asrModel:'whisper-1',asrEngine:'builtin',ttsVoice:'zf_xiaobei'}};
  fs.writeFileSync(path.join(dataDir,'store.json'),JSON.stringify(store));
  const app=createApp({dataDir,skillsDir,modelFetch,transcriber:async()=>({text:'x',segments:[]}),ttsSynthesizer:async()=>{throw new Error('unused');}});
  await new Promise(r=>app.listen(0,'127.0.0.1',r));
  const url=`http://127.0.0.1:${app.address().port}`;
  t.after(async()=>{await new Promise(r=>app.close(r));fs.rmSync(dataDir,{recursive:true,force:true});fs.rmSync(skillsDir,{recursive:true,force:true});});
  const call=async(p,data,method='POST')=>{const r=await fetch(url+p,data===undefined?{}:{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});return {status:r.status,body:await r.json().catch(async()=>({raw:await r.text()}))};};
  return {url,call,skillsDir};
}

test('GET /api/skills lists skill files with meta',async t=>{
  const {call,skillsDir}=await fixture(t,modelFetchReturning('x'));
  fs.writeFileSync(path.join(skillsDir,'dh5a-test.md'),SKILL_MD,'utf8');
  const r=await call('/api/skills',undefined,'GET');
  assert.equal(r.status,200);
  assert.equal(r.body.length,1);
  assert.equal(r.body[0].name,'dh5a-test');
  assert.equal(r.body[0].title,'测试 DH5α 转化');
  assert.equal(r.body[0].steps,2);
});

test('GET /api/skills returns [] when no skills',async t=>{
  const {call}=await fixture(t,modelFetchReturning('x'));
  const r=await call('/api/skills',undefined,'GET');
  assert.equal(r.status,200);
  assert.deepEqual(r.body,[]);
});

test('POST /api/skill-ask returns guidance and stores skill messages',async t=>{
  const {call,skillsDir}=await fixture(t,modelFetchReturning('看起来你在第 1 步。下一步：加入质粒后冰浴 30 分钟，注意动作轻柔。'));
  fs.writeFileSync(path.join(skillsDir,'dh5a-test.md'),SKILL_MD,'utf8');
  const r=await call('/api/skill-ask',{skill:'dh5a-test',question:'我现在加感受态细胞，下一步做什么？'});
  assert.equal(r.status,200);
  assert.equal(r.body.role,'assistant');
  assert.equal(r.body.type,'skill');
  assert.equal(r.body.skill,'dh5a-test');
  assert.match(r.body.text,/冰浴 30 分钟/);
  const st=await call('/api/state',undefined,'GET');
  const skillMsgs=st.body.messages.filter(m=>m.type==='skill'&&m.skill==='dh5a-test');
  assert.equal(skillMsgs.length,2);
  assert.equal(skillMsgs[0].role,'user');
  assert.equal(skillMsgs[1].role,'assistant');
});

test('POST /api/skill-ask rejects empty question (400) and unknown skill (404)',async t=>{
  const {call,skillsDir}=await fixture(t,modelFetchReturning('unused'));
  fs.writeFileSync(path.join(skillsDir,'dh5a-test.md'),SKILL_MD,'utf8');
  assert.equal((await call('/api/skill-ask',{skill:'dh5a-test',question:'   '})).status,400);
  assert.equal((await call('/api/skill-ask',{skill:'nope',question:'hello'})).status,404);
});

test('POST /api/skills/generate writes a skill file and lists it',async t=>{
  const {call,skillsDir}=await fixture(t,modelFetchReturning(GEN_SKILL));
  const r=await call('/api/skills/generate',{notebookId:'nb1'});
  assert.equal(r.status,201);
  assert.equal(r.body.name,'generated-exp');
  assert.ok(r.body.steps>=2);
  assert.ok(fs.existsSync(path.join(skillsDir,'generated-exp.md')));
  const list=await call('/api/skills',undefined,'GET');
  assert.ok(list.body.some(s=>s.name==='generated-exp'));
});

test('POST /api/skills/generate requires model + material (400/400)',async t=>{
  // no material: fresh notebook with no text source / no note
  const {call}=await fixture(t,modelFetchReturning(GEN_SKILL));
  // create an empty notebook via API
  const nb=await call('/api/notebooks',{title:'空本'});
  assert.equal(nb.status,201);
  const r=await call('/api/skills/generate',{notebookId:nb.body.id});
  assert.equal(r.status,400);
});

test('POST /api/skills/generate never overwrites an existing same-name skill',async t=>{
  const {call,skillsDir}=await fixture(t,modelFetchReturning(GEN_SKILL));
  const original='# 原始版本，勿动\n';
  fs.writeFileSync(path.join(skillsDir,'generated-exp.md'),original,'utf8');
  const r=await call('/api/skills/generate',{notebookId:'nb1'});
  assert.equal(r.status,201);
  assert.equal(r.body.name,'generated-exp-2');
  assert.equal(fs.readFileSync(path.join(skillsDir,'generated-exp.md'),'utf8'),original);
  assert.ok(fs.existsSync(path.join(skillsDir,'generated-exp-2.md')));
  const list=await call('/api/skills',undefined,'GET');
  const names=list.body.map(s=>s.name);
  assert.ok(names.includes('generated-exp'));
  assert.ok(names.includes('generated-exp-2'));
});
