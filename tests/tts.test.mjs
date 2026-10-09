import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {createApp} from '../server.mjs';import {ttsStatus} from '../tts.mjs';

async function fixture(t,ttsSynthesizer){
  const dataDir=fs.mkdtempSync(path.join(os.tmpdir(),'study-tts-'));
  const app=createApp({dataDir,transcriber:async()=>({text:'x',segments:[]}),ttsSynthesizer});
  await new Promise(r=>app.listen(0,'127.0.0.1',r));
  const url=`http://127.0.0.1:${app.address().port}`;
  t.after(async()=>{await new Promise(r=>app.close(r));fs.rmSync(dataDir,{recursive:true,force:true});});
  const call=async(p,data,method='POST')=>{const r=await fetch(url+p,data===undefined?{}:{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const ct=r.headers.get('content-type')||'';const body=ct.includes('application/json')?await r.json():new Uint8Array(await r.arrayBuffer());return {status:r.status,contentType:ct,body};};
  return {url,call,dataDir};
}

test('POST /api/tts returns wav audio',async t=>{
  const fake=new Uint8Array([0x52,0x49,0x46,0x46,36,0,0,0,0x57,0x41,0x56,0x45]);
  const {call}=await fixture(t,async(text,{voice}={})=>{assert.ok(typeof text==='string'&&text.length>0);return {bytes:fake,sampleRate:24000,mime:'audio/wav',voice:voice||'zf_xiaobei'};});
  const r=await call('/api/tts',{text:'你好，世界'});
  assert.equal(r.status,200);
  assert.match(r.contentType,/audio\/wav/);
  assert.ok(r.body.byteLength>0);
});

test('POST /api/tts rejects empty and overlong text',async t=>{
  const {call}=await fixture(t,async()=>{throw new Error('不应被调用');});
  assert.equal((await call('/api/tts',{text:'   '})).status,400);
  assert.equal((await call('/api/tts',{text:'x'.repeat(2001)})).status,413);
});

test('ttsStatus returns a ready/message/engine shape',async()=>{
  const s=ttsStatus();
  assert.equal(typeof s.ready,'boolean');
  assert.equal(typeof s.message,'string');
  assert.ok(typeof s.engine==='string'&&s.engine.length>0);
});
