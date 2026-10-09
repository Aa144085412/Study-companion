import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {createApp} from '../server.mjs';
async function fixture(t,transcriber){const dataDir=fs.mkdtempSync(path.join(os.tmpdir(),'study-v02-'));const app=createApp({dataDir,transcriber});await new Promise(r=>app.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${app.address().port}`;t.after(async()=>{await new Promise(r=>app.close(r));assert.equal(path.dirname(path.resolve(dataDir)),path.resolve(os.tmpdir()));assert.ok(path.basename(dataDir).startsWith('study-v02-'));fs.rmSync(dataDir,{recursive:true,force:true});});const call=async(p,data,method='POST')=>{const r=await fetch(url+p,data===undefined?{}:{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});return {status:r.status,...await r.json()};};return {url,call,dataDir};}
async function until(fn){for(let i=0;i<100;i++){const v=await fn();if(v)return v;await new Promise(r=>setTimeout(r,10));}throw Error('Condition not reached');}
test('stream upload deduplicates; transcription creates timestamped source; correction preserves original',async t=>{
 const {url,call}=await fixture(t,async()=>({text:'原识别',segments:[{start:500,end:2500,text:'原识别'}],model:'test'}));
 const b=await call('/api/notebooks',{title:'测试'});
 async function upload(){return (await fetch(url+'/api/upload?notebookId='+b.id+'&title=test.wav',{method:'POST',body:Buffer.from('test audio')})).json();}
 const s=await upload();const dup=await upload();assert.equal(dup.id,s.id);assert.equal(dup.duplicate,true);
 const j=await call('/api/jobs',{sourceId:s.id});assert.equal(j.status,202);
 const done=await until(async()=>{const state=await call('/api/state');return state.jobs.find(x=>x.id===j.id&&x.state==='completed');});
 let snapshot=await call('/api/state');const original=snapshot.sources.find(s=>s.id===done.resultSourceId);assert.equal(original.mediaId,s.id);assert.equal(original.segments[0].start,500);
 const corrected=await call('/api/sources/'+original.id+'/corrections',{segments:[{id:original.segments[0].id,text:'人工校对'}]});assert.equal(corrected.status,201);assert.equal(corrected.previousId,original.id);assert.equal(corrected.segments[0].start,500);
 snapshot=await call('/api/state');assert.equal(snapshot.sources.find(x=>x.id===original.id).content,'原识别');assert.equal(snapshot.sources.find(x=>x.id===original.id).replacedBy,corrected.id);
 assert.equal((await call('/api/sources/'+original.id+'/corrections',{segments:[]})).status,409);
});
test('cancel prevents ghost transcript; retry succeeds; restart marks queued tasks interrupted',async t=>{
 let attempt=0;
 const {call,dataDir}=await fixture(t,async(file,{signal})=>{attempt++;if(attempt===1){await new Promise((resolve,reject)=>{signal.addEventListener('abort',()=>reject(Error('cancelled')),{once:true});});}return {text:'成功',segments:[{start:0,end:1000,text:'成功'}]};});
 const b=await call('/api/notebooks',{title:'取消测试'});const s=await call('/api/sources',{notebookId:b.id,title:'test.wav',base64:'dGVzdA=='});const j=await call('/api/jobs',{sourceId:s.id});
 await until(async()=>{const st=await call('/api/state');return st.jobs[0].state==='running';});
 assert.equal((await call('/api/jobs/'+j.id+'/cancel',{})).state,'cancelled');
 await until(async()=>{const r=await call('/api/jobs/'+j.id+'/retry',{});return r.status===200;});
 await until(async()=>{const st=await call('/api/state');return st.jobs[0].state==='completed';});
 const st=await call('/api/state');assert.equal(st.sources.filter(s=>s.kind==='text').length,1);
 const stored=JSON.parse(fs.readFileSync(path.join(dataDir,'store.json'),'utf8'));stored.jobs.push({id:'pending',state:'queued'});fs.writeFileSync(path.join(dataDir,'store.json'),JSON.stringify(stored));
 const restored=createApp({dataDir});const after=JSON.parse(fs.readFileSync(path.join(dataDir,'store.json'),'utf8'));assert.equal(after.jobs.find(j=>j.id==='pending').state,'interrupted');restored.close();
});
test('worker errors become retryable failures without transcript; short voice shares local worker',async t=>{
 let failing=true;const {call}=await fixture(t,async()=>{if(failing)throw Error('模拟模型缺失');return {text:'这一步有什么作用',segments:[]};});
 const b=await call('/api/notebooks',{title:'失败测试'});const s=await call('/api/sources',{notebookId:b.id,title:'x.wav',base64:'dGVzdA=='});await call('/api/jobs',{sourceId:s.id});
 await until(async()=>{const st=await call('/api/state');return st.jobs[0].state==='failed';});
 assert.equal((await call('/api/state')).sources.length,1);failing=false;
 const result=await call('/api/transcribe',{base64:'dGVzdA==',mime:'audio/wav'});assert.equal(result.text,'这一步有什么作用');
});
