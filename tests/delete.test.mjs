import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {createApp} from '../server.mjs';
async function fixture(t){const dataDir=fs.mkdtempSync(path.join(os.tmpdir(),'study-delete-'));const app=createApp({dataDir,transcriber:async()=>({text:'x',segments:[]})});await new Promise(r=>app.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${app.address().port}`;t.after(async()=>{await new Promise(r=>app.close(r));assert.ok(path.basename(dataDir).startsWith('study-delete-'));fs.rmSync(dataDir,{recursive:true,force:true});});const call=async(p,data,method='POST')=>{const r=await fetch(url+p,data===undefined?{}:{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});return {status:r.status,...await r.json()};};const state=async()=>(await call('/api/state'));const trash=async()=>(await (await fetch(url+'/api/trash')).json());return {url,call,state,trash,dataDir};}

test('source delete soft-deletes proofread chain to trash and keeps media file',async t=>{
 const {url,call,state,trash,dataDir}=await fixture(t);
 const b=await call('/api/notebooks',{title:'删'});
 const m=await (await fetch(url+'/api/upload?notebookId='+b.id+'&title=test.wav',{method:'POST',body:Buffer.from('test audio')})).json();
 const txt=await call('/api/sources',{notebookId:b.id,title:'note.txt',content:'hello world'});
 const proof=await call('/api/sources/'+txt.id+'/corrections',{content:'fixed world'});
 assert.equal(proof.previousId,txt.id);
 let s=await state();assert.equal(s.sources.length,3);assert.equal(s.sources.find(x=>x.id===txt.id).replacedBy,proof.id);
 assert.equal((await call('/api/sources/'+proof.id,'','DELETE')).status,200);
 s=await state();
 assert.equal(s.sources.find(x=>x.id===proof.id),undefined);
 assert.equal(s.sources.find(x=>x.id===txt.id),undefined);
 assert.ok(s.sources.find(x=>x.id===m.id));
 const mediaFile=path.join(dataDir,'media',m.file);assert.ok(fs.existsSync(mediaFile));
 const tr=await trash();const entry=tr.find(x=>x.id===proof.id);
 assert.ok(entry);assert.equal(entry.kind,'source');
 assert.ok(entry.data.chain.some(c=>c.id===proof.id));assert.ok(entry.data.chain.some(c=>c.id===txt.id));
});

test('notebook delete soft-deletes to trash and keeps media file',async t=>{
 const {url,call,state,trash,dataDir}=await fixture(t);
 const b=await call('/api/notebooks',{title:'删本'});
 const m=await (await fetch(url+'/api/upload?notebookId='+b.id+'&title=test.wav',{method:'POST',body:Buffer.from('test audio')})).json();
 const txt=await call('/api/sources',{notebookId:b.id,title:'note.txt',content:'hello'});
 await call('/api/notes',{notebookId:b.id,content:'my note'});
 await call('/api/questions',{notebookId:b.id,question:'why?'});
 let s=await state();assert.equal(s.notebooks.length,1);assert.equal(s.sources.length,2);assert.equal(s.revisions.length,1);assert.equal(s.questions.length,1);
 const mediaFile=path.join(dataDir,'media',m.file);assert.ok(fs.existsSync(mediaFile));
 assert.equal((await call('/api/notebooks/'+b.id,'','DELETE')).status,200);
 s=await state();assert.equal(s.notebooks.length,0);assert.equal(s.sources.length,0);assert.equal(s.revisions.length,0);assert.equal(s.questions.length,0);
 assert.ok(fs.existsSync(mediaFile));
 const tr=await trash();const entry=tr.find(x=>x.id===b.id);
 assert.ok(entry);assert.equal(entry.kind,'notebook');
 assert.ok(entry.data.sources.some(c=>c.id===m.id));assert.equal(entry.data.revisions.length,1);
});
