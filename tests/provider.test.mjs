import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createApp} from '../server.mjs';
import {providerURL,createProvider,normalizeSettings} from '../src/model_provider/index.mjs';
import {makeStageCaller} from '../src/pipeline/index.mjs';

const completion = () => new Response(JSON.stringify({choices:[{message:{content:'连接成功 [S1]'}}]}));
const cloud = {llmMode:'cloud',llmUrl:'https://provider.example/v1',model:'text-model',llmApiKey:'test-llm-key'};

async function fixture(t, modelFetch = async()=>completion(), providerEnv = {}) {
  const dataDir=fs.mkdtempSync(path.join(os.tmpdir(),'study-provider-'));
  const app=createApp({dataDir,modelFetch,providerEnv});
  await new Promise(r=>app.listen(0,'127.0.0.1',r));
  const url=`http://127.0.0.1:${app.address().port}`;
  const call=async(route,data)=>{
    const r=await fetch(url+route,data===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
    return {status:r.status,...await r.json()};
  };
  t.after(async()=>{
    await new Promise(r=>app.close(r));
    const resolved=path.resolve(dataDir);
    assert.equal(path.dirname(resolved),path.resolve(os.tmpdir()));
    assert.ok(path.basename(resolved).startsWith('study-provider-'));
    fs.rmSync(resolved,{recursive:true,force:true});
  });
  return {app,call,dataDir,url};
}

async function until(check) {
  for(let i=0;i<150;i++){const result=await check();if(result)return result;await new Promise(r=>setTimeout(r,10));}
  throw Error('Expected job state not reached');
}

test('cloud HTTPS requires explicit mode and clean base URL; local boundary remains intact',()=>{
  assert.equal(providerURL('https://provider.example/openai/v1/','cloud'),'https://provider.example/openai/v1');
  assert.equal(providerURL('http://localhost:1234/v1'),'http://localhost:1234/v1');
  for(const [u,m] of [
    ['https://provider.example/v1','local'],['http://provider.example/v1','cloud'],
    ['https://user:secret@provider.example/v1','cloud'],['https://provider.example/v1?key=secret','cloud'],
    ['https://provider.example/v1#key','cloud'],['https://provider.example/v1/chat/completions','cloud'],
    ['https://127.0.0.1/v1','cloud'],['http://localhost.evil.example/v1','local']
  ]) assert.throws(()=>providerURL(u,m));
});

test('cloud text and model list use server credentials without exposing keys in state or backup',async t=>{
  const requests=[];
  const {call,dataDir}=await fixture(t,async(url,opts)=>{
    requests.push({url,opts});
    return url.endsWith('/models')?new Response(JSON.stringify({data:[{id:'text-model'}]})):completion();
  });
  assert.equal((await call('/api/settings',cloud)).status,200);
  const result=await call('/api/model/test',{});assert.equal(result.ok,true);
  assert.equal((await call('/api/models',{})).data[0].id,'text-model');
  assert.equal(requests[0].url,'https://provider.example/v1/chat/completions');
  assert.equal(requests[0].opts.headers.Authorization,'Bearer test-llm-key');
  assert.equal(requests[1].opts.headers.Authorization,'Bearer test-llm-key');
  assert.equal(requests[1].opts.method,'GET');assert.equal(requests[0].opts.redirect,'error');
  const snapshot=await call('/api/state');
  assert.equal(snapshot.settings.llmKeyConfigured,true);
  assert.equal(snapshot.settings.llmKeySource,'local');
  assert.ok(!JSON.stringify(snapshot).includes('test-llm-key'));
  assert.ok(!fs.readFileSync(path.join(dataDir,'store.json'),'utf8').includes('test-llm-key'));
  assert.ok(fs.readFileSync(path.join(dataDir,'api-secrets.json'),'utf8').includes('test-llm-key'));
  await call('/api/backup/restore',{...snapshot,settings:{...snapshot.settings,llmApiKey:'injected-backup-key'}});
  assert.ok(!JSON.stringify(await call('/api/state')).includes('injected-backup-key'));
});

test('saved key survives restart; blank preserves it; changing endpoint or explicit clear removes it',async t=>{
  const {call,dataDir}=await fixture(t);
  await call('/api/settings',cloud);
  await call('/api/settings',{model:'renamed',llmApiKey:''});
  assert.equal((await call('/api/model/test',{})).status,200);
  const restored=createApp({dataDir,modelFetch:async()=>completion(),providerEnv:{}});
  await new Promise(r=>restored.listen(0,'127.0.0.1',r));
  const state=await(await fetch(`http://127.0.0.1:${restored.address().port}/api/state`)).json();
  assert.equal(state.settings.llmKeyConfigured,true);
  await new Promise(r=>restored.close(r));
  await call('/api/settings',{llmUrl:'https://other.example/v1'});
  assert.equal((await call('/api/state')).settings.llmKeyConfigured,false);
  assert.equal((await call('/api/model/test',{})).status,400);
  await call('/api/settings',{llmApiKey:'new-key'});
  await call('/api/settings',{llmClearKey:true});
  assert.equal((await call('/api/state')).settings.llmKeyConfigured,false);
});

test('invalid settings do not replace the previous endpoint or credential',async t=>{
  const {call}=await fixture(t);await call('/api/settings',cloud);
  assert.equal((await call('/api/settings',{llmUrl:'http://remote.example/v1',llmApiKey:'bad'})).status,400);
  assert.equal((await call('/api/settings',{llmApiKey:'bad\r\nheader'})).status,400);
  const state=await call('/api/state');assert.equal(state.settings.llmUrl,cloud.llmUrl);
  assert.equal((await call('/api/model/test',{})).status,200);
});

test('environment keys override local keys and never appear in exported state',async t=>{
  let auth;
  const {call}=await fixture(t,async(url,opts)=>{auth=opts.headers.Authorization;return completion();},{STUDY_LLM_API_KEY:'test-environment-key'});
  await call('/api/settings',cloud);await call('/api/settings',{llmClearKey:true});
  assert.equal((await call('/api/model/test',{})).status,200);
  assert.equal(auth,'Bearer test-environment-key');
  const state=await call('/api/state');assert.equal(state.settings.llmKeySource,'environment');
  assert.ok(!JSON.stringify(state).includes('test-environment-key'));
});

test('HTTP errors and malformed success responses never echo provider body or credentials',async t=>{
  let mode='auth';
  const {call}=await fixture(t,async()=>mode==='auth'?new Response('secret-provider-body test-llm-key',{status:401}):mode==='json'?new Response('not json'):new Response(JSON.stringify({choices:[]})));
  await call('/api/settings',cloud);
  let r=await call('/api/model/test',{});assert.equal(r.status,502);assert.match(r.error,/401/);assert.ok(!r.error.includes('test-llm-key'));
  mode='json';r=await call('/api/model/test',{});assert.equal(r.status,502);assert.match(r.error,/JSON/);
  mode='empty';assert.equal((await call('/api/model/test',{})).status,502);
});

test('manual model configuration works without a model-list endpoint',async t=>{
  const {call}=await fixture(t,async url=>url.endsWith('/models')?new Response('',{status:404}):completion());
  await call('/api/settings',cloud);
  assert.equal((await call('/api/models',{})).status,502);
  assert.equal((await call('/api/model/test',{})).status,200);
});

test('external transcription jobs use the ASR key and convert provider seconds to linked millisecond evidence',async t=>{
  let request;
  const {call}=await fixture(t,async(url,opts)=>{
    request={url,opts};
    return new Response(JSON.stringify({text:'课程原文',segments:[{start:1.25,end:2.5,text:'课程原文'}]}));
  });
  await call('/api/settings',{...cloud,asrEngine:'external',asrMode:'cloud',asrUrl:'https://speech.example/v1',asrModel:'speech-model',asrApiKey:'test-speech-key'});
  const health=await call('/api/health');assert.equal(health.asr.engine,'compatible-api');assert.equal(health.asr.verified,false);
  const b=await call('/api/notebooks',{title:'云端识别测试'});
  const media=await call('/api/sources',{notebookId:b.id,title:'lesson.wav',base64:'dGVzdA=='});
  const job=await call('/api/jobs',{sourceId:media.id});assert.equal(job.status,202);
  const done=await until(async()=>{const s=await call('/api/state');return s.jobs.find(j=>j.id===job.id&&j.state==='completed');});
  const transcript=(await call('/api/state')).sources.find(s=>s.id===done.resultSourceId);
  assert.equal(transcript.mediaId,media.id);assert.equal(transcript.segments[0].start,1250);assert.equal(transcript.segments[0].end,2500);
  assert.equal(request.url,'https://speech.example/v1/audio/transcriptions');
  assert.equal(request.opts.headers.Authorization,'Bearer test-speech-key');
  assert.equal(request.opts.headers['Content-Type'],undefined);
  assert.equal(request.opts.body.get('response_format'),'verbose_json');
  assert.equal(request.opts.body.get('timestamp_granularities[]'),'segment');
});

test('external voice questions need no local model and no segment timestamps',async t=>{
  let auth;
  const {call}=await fixture(t,async(url,opts)=>{auth=opts.headers.Authorization;assert.equal(opts.body.get('response_format'),'json');assert.equal(opts.body.get('file').type,'audio/wav');assert.match(opts.body.get('file').name,/\.wav$/);return new Response(JSON.stringify({text:'语音问题'}));});
  await call('/api/settings',{asrEngine:'external',asrMode:'cloud',asrUrl:'https://speech.example/v1',asrApiKey:'voice-only-key'});
  const r=await call('/api/transcribe',{mime:'audio/wav',base64:'dGVzdA=='});
  assert.equal(r.text,'语音问题');assert.equal(auth,'Bearer voice-only-key');
});

test('missing timestamps fail the media job without fabricating evidence',async t=>{
  const {call}=await fixture(t,async()=>new Response(JSON.stringify({text:'没有时间戳'})));
  await call('/api/settings',{asrEngine:'external',asrMode:'cloud',asrUrl:'https://speech.example/v1',asrApiKey:'voice-key'});
  const b=await call('/api/notebooks',{title:'时间戳缺失'});
  const media=await call('/api/sources',{notebookId:b.id,title:'lesson.wav',base64:'dGVzdA=='});
  const job=await call('/api/jobs',{sourceId:media.id});
  const failed=await until(async()=>{const s=await call('/api/state');return s.jobs.find(j=>j.id===job.id&&j.state==='failed');});
  assert.match(failed.error,/时间戳/);assert.equal((await call('/api/state')).sources.length,1);
});

test('canceling an external job aborts its request without creating a ghost transcript',async t=>{
  let aborted=false;
  const {call}=await fixture(t,async(url,opts)=>new Promise((resolve,reject)=>opts.signal.addEventListener('abort',()=>{aborted=true;reject(new DOMException('cancelled','AbortError'));},{once:true})));
  await call('/api/settings',{asrEngine:'external',asrMode:'cloud',asrUrl:'https://speech.example/v1',asrApiKey:'voice-key'});
  const b=await call('/api/notebooks',{title:'取消识别'});
  const media=await call('/api/sources',{notebookId:b.id,title:'lesson.wav',base64:'dGVzdA=='});
  const job=await call('/api/jobs',{sourceId:media.id});
  await until(async()=>{const s=await call('/api/state');return s.jobs.find(j=>j.id===job.id&&j.state==='running');});
  await call('/api/jobs/'+job.id+'/cancel',{});await until(async()=>aborted);
  assert.equal((await call('/api/state')).sources.length,1);
});

test('cloud source images require explicit opt-in and the vision gateway keeps credentials on the server',async t=>{
  const sent=[];const {call,dataDir}=await fixture(t,async(url,opts)=>{sent.push(JSON.parse(opts.body));return completion();});
  await call('/api/settings',cloud);
  const images=path.join(dataDir,'images');fs.mkdirSync(images);fs.writeFileSync(path.join(images,'frame.png'),Buffer.from('fake-image'));
  const b=await call('/api/notebooks',{title:'图片选择'});
  await call('/api/sources',{notebookId:b.id,title:'原图.md',content:'图片目录：'+images+'\n\n材料原文'});
  await call('/api/chat',{notebookId:b.id,question:'材料原文是什么'});
  assert.equal(typeof sent[0].messages[1].content,'string');
  assert.equal((await call('/api/vision/chat/completions',{model:cloud.model,messages:[]})).status,400);
  await call('/api/settings',{cloudImagesEnabled:true});
  await call('/api/chat',{notebookId:b.id,question:'材料原文是什么'});
  assert.ok(Array.isArray(sent[1].messages[1].content));
  assert.equal((await call('/api/vision/chat/completions',{model:cloud.model,messages:[{role:'user',content:'核对图片'}]})).status,200);
  assert.ok(!JSON.stringify(await call('/api/state')).includes('test-llm-key'));
});

test('audited stages strip local-only cloud parameters and central image gating covers every caller',async t=>{
  const {dataDir}=await fixture(t);const requests=[];
  const provider=createProvider({dataDir,env:{STUDY_LLM_API_KEY:'stage-test-key'},fetchImpl:async(url,opts)=>{
    const payload=JSON.parse(opts.body);assert.equal(payload.chat_template_kwargs,undefined);requests.push(payload);
    return new Response(JSON.stringify({choices:[{message:{content:'{"result":"ok"}'}}]}));
  }});
  const settings=normalizeSettings(cloud);
  const caller=makeStageCaller({model:(route,payload)=>provider.request('llm',settings,route,payload),modelName:settings.model,cacheDir:path.join(dataDir,'stage-cache')});
  assert.equal((await caller('protocol','Return JSON',{source:'来源文本'})).result,'ok');
  const imagePayload={messages:[{role:'user',content:[{type:'image_url',image_url:{url:'data:image/png;base64,dGVzdA=='}}]}]};
  await assert.rejects(provider.request('llm',settings,'/chat/completions',imagePayload),/允许.*图片/);
  assert.equal(requests.length,1);
  await provider.request('llm',{...settings,cloudImagesEnabled:true},'/chat/completions',imagePayload);
  assert.equal(requests.length,2);
});

test('agent transcription tool follows the selected cloud ASR instead of requiring a local model',async t=>{
  let turn=0,audioPath;const sent=[];
  const {call,dataDir}=await fixture(t,async(url,opts)=>{
    sent.push({url,auth:opts.headers.Authorization});
    if(url.endsWith('/audio/transcriptions'))return new Response(JSON.stringify({text:'工具转写原文',segments:[{start:0,end:1,text:'工具转写原文'}]}));
    const message=++turn===1?{content:'',tool_calls:[{id:'t1',type:'function',function:{name:'transcribe',arguments:JSON.stringify({audio:audioPath})}}]}:{content:'转写完成'};
    return new Response(JSON.stringify({choices:[{message}]}));
  });
  audioPath=path.join(dataDir,'tool.wav');fs.writeFileSync(audioPath,'test audio');
  await call('/api/settings',{...cloud,asrEngine:'external',asrMode:'cloud',asrUrl:'https://speech.example/v1',asrApiKey:'tool-speech-key'});
  const result=await call('/api/tools/loop',{query:'转写给定本地文件'});
  assert.equal(result.status,'done');assert.equal(result.toolLog[0].tool,'transcribe');assert.equal(result.toolLog[0].ok,true);
  assert.equal(result.transcriptLen,'工具转写原文'.length);
  assert.deepEqual(sent.map(r=>r.auth),['Bearer test-llm-key','Bearer tool-speech-key','Bearer test-llm-key']);
});
