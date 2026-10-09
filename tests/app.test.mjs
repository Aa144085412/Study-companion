import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createApp,parseSrt,localURL} from '../server.mjs';

test('SRT preserves millisecond offsets and rejects reversed ranges',()=>{
 const rows=parseSrt('1\r\n00:00:01,250 --> 00:00:03,000\r\n实验目的\r\n\r\n2\r\n00:00:05,000 --> 00:00:04,000\r\n错误');
 assert.equal(rows.length,1);assert.equal(rows[0].start,1250);assert.equal(rows[0].end,3000);
});
test('local-only provider rejects cloud and credentials',()=>{
 assert.equal(localURL('http://127.0.0.1:1234/v1/'),'http://127.0.0.1:1234/v1');
 for(const u of ['https://example.com/v1','http://127.0.0.1.example.com/v1','http://user@localhost/v1'])assert.throws(()=>localURL(u));
});
test('end-to-end persistence, citations, isolation, media range, errors',async t=>{
 const dataDir=fs.mkdtempSync(path.join(os.tmpdir(),'study-test-'));
 let lastPayload;
 const app=createApp({dataDir,modelFetch:async(url,opts)=>{lastPayload=JSON.parse(opts.body);return new Response(JSON.stringify({choices:[{message:{content:'依据材料 [S1]。无效引用 [S99]。'}}]}),{status:200});}});
 await new Promise(resolve=>app.listen(0,'127.0.0.1',resolve));
 const root=`http://127.0.0.1:${app.address().port}`;
 async function call(p,data,method='POST'){const r=await fetch(root+p,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});return {status:r.status,body:await r.json()};}
 t.after(async()=>{await new Promise(resolve=>app.close(resolve));const resolved=path.resolve(dataDir);assert.equal(path.dirname(resolved),path.resolve(os.tmpdir()));assert.ok(path.basename(resolved).startsWith('study-test-'));fs.rmSync(resolved,{recursive:true,force:true});});
 const b=(await call('/api/notebooks',{title:'实验学习'})).body;
 const b2=(await call('/api/notebooks',{title:'其他实验'})).body;
 const source=(await call('/api/sources',{notebookId:b.id,title:'讲解.srt',content:'1\n00:00:01,000 --> 00:00:02,000\n原始说明'})).body;
 const media=(await call('/api/sources',{notebookId:b.id,title:'录音.mp3',base64:Buffer.from('0123456789').toString('base64')})).body;
 const other=(await call('/api/sources',{notebookId:b2.id,title:'其他.mp3',base64:'YWJj'})).body;
 assert.equal((await call('/api/link-media',{sourceId:source.id,mediaId:other.id})).status,400);
 assert.equal((await call('/api/link-media',{sourceId:source.id,mediaId:media.id})).status,200);
 await call('/api/notes',{notebookId:b.id,content:'实验目的'});await call('/api/notes',{notebookId:b.id,content:'实验目的与原理'});
 assert.equal((await call('/api/chat',{notebookId:b.id,question:'目的是什么'})).status,400);
 await call('/api/settings',{llmUrl:'http://localhost:1234/v1',model:'test',asrUrl:'http://localhost:8000/v1',asrModel:'whisper'});
 assert.equal((await call('/api/chat',{notebookId:b.id,selection:'不属于笔记',question:'为什么'})).status,400);
 const answer=(await call('/api/chat',{notebookId:b.id,selection:'实验目的',question:'为什么'})).body;
 assert.equal(answer.citations.length,1);assert.equal(answer.citations[0].start,1000);assert.equal(answer.citations[0].mediaId,media.id);
 assert.match(answer.text,/引用无效/);assert.ok(lastPayload.messages[1].content.includes('实验目的'));
 const q=(await call('/api/questions',{notebookId:b.id,question:'为什么'})).body;
 assert.equal((await call('/api/questions/'+q.id,{status:'已理解'},'PATCH')).body.status,'已理解');
 const r=await fetch(root+'/api/media/'+media.id,{headers:{Range:'bytes=2-5'}});assert.equal(r.status,206);assert.equal(await r.text(),'2345');
 assert.equal((await fetch(root+'/api/media/'+media.id,{headers:{Range:'bytes=100-'}})).status,416);
 const hostile=await fetch(root+'/api/notebooks',{method:'POST',headers:{Origin:'http://evil.example','Content-Type':'application/json'},body:'{"title":"bad"}'});assert.equal(hostile.status,403);
 const saved=JSON.parse(fs.readFileSync(path.join(dataDir,'store.json'),'utf8'));assert.equal(saved.revisions.length,2);assert.equal(saved.messages.length,2);
 const restored=createApp({dataDir});await new Promise(resolve=>restored.listen(0,'127.0.0.1',resolve));
 const snapshot=await(await fetch(`http://127.0.0.1:${restored.address().port}/api/state`)).json();assert.equal(snapshot.questions[0].status,'已理解');await new Promise(resolve=>restored.close(resolve));
});
