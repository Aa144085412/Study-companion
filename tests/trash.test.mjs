import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {createApp} from '../server.mjs';
async function fixture(t){const dataDir=fs.mkdtempSync(path.join(os.tmpdir(),'study-trash-'));const app=createApp({dataDir,transcriber:async()=>({text:'x',segments:[]})});await new Promise(r=>app.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${app.address().port}`;t.after(async()=>{await new Promise(r=>app.close(r));assert.ok(path.basename(dataDir).startsWith('study-trash-'));fs.rmSync(dataDir,{recursive:true,force:true});});const call=async(p,data,method='POST')=>{const r=await fetch(url+p,data===undefined?{}:{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});return {status:r.status,...await r.json()};};const state=async()=>(await call('/api/state'));const trash=async()=>(await (await fetch(url+'/api/trash')).json());return {url,call,state,trash,dataDir};}

test('source restore puts chain back and empties trash',async t=>{
 const {call,state,trash}=await fixture(t);
 const b=await call('/api/notebooks',{title:'T'});
 const txt=await call('/api/sources',{notebookId:b.id,title:'note.txt',content:'hello world'});
 const proof=await call('/api/sources/'+txt.id+'/corrections',{content:'fixed world'});
 const del=await call('/api/sources/'+proof.id,'','DELETE');assert.equal(del.status,200);assert.equal(del.trash,true);
 let s=await state();assert.equal(s.sources.find(x=>x.id===proof.id),undefined);
 assert.equal((await call('/api/trash/'+proof.id+'/restore',{})).status,200);
 s=await state();assert.ok(s.sources.find(x=>x.id===proof.id));assert.ok(s.sources.find(x=>x.id===txt.id));
 assert.equal((await trash()).length,0);
});

test('purge removes media file and empties trash',async t=>{
 const {url,call,trash,dataDir}=await fixture(t);
 const b=await call('/api/notebooks',{title:'T'});
 const m=await (await fetch(url+'/api/upload?notebookId='+b.id+'&title=test.wav',{method:'POST',body:Buffer.from('test audio')})).json();
 const mediaFile=path.join(dataDir,'media',m.file);assert.ok(fs.existsSync(mediaFile));
 assert.equal((await call('/api/sources/'+m.id,'','DELETE')).status,200);
 assert.ok(fs.existsSync(mediaFile));
 const tr=await trash();const id=tr.find(x=>x.id===m.id).id;
 assert.equal((await call('/api/trash/'+id+'/purge',{})).status,200);
 assert.equal(fs.existsSync(mediaFile),false);
 assert.equal((await trash()).length,0);
});

test('notebook restore brings notebook+sources+revisions back',async t=>{
 const {call,state,trash}=await fixture(t);
 const b=await call('/api/notebooks',{title:'NB'});
 const txt=await call('/api/sources',{notebookId:b.id,title:'note.txt',content:'hello'});
 await call('/api/notes',{notebookId:b.id,content:'my note'});
 assert.equal((await call('/api/notebooks/'+b.id,'','DELETE')).status,200);
 let s=await state();assert.equal(s.notebooks.length,0);assert.equal(s.sources.length,0);
 assert.equal((await call('/api/trash/'+b.id+'/restore',{})).status,200);
 s=await state();assert.ok(s.notebooks.find(x=>x.id===b.id));assert.ok(s.sources.find(x=>x.id===txt.id));assert.equal(s.revisions.length,1);
 assert.equal((await trash()).length,0);
});

test('backup restore round-trips the store snapshot',async t=>{
 const {call,state}=await fixture(t);
 const dump=await state();
 const before=dump.notebooks.map(x=>x.id).join(',');
 await call('/api/notebooks',{title:'after-backup'});
 let s=await state();assert.notEqual(s.notebooks.map(x=>x.id).join(','),before);
 assert.equal((await call('/api/backup/restore',dump)).status,200);
 s=await state();assert.equal(s.notebooks.map(x=>x.id).join(','),before);
});

test('restore/purge unknown id → 404',async t=>{
 const {call}=await fixture(t);
 assert.equal((await call('/api/trash/nope/restore',{})).status,404);
 assert.equal((await call('/api/trash/nope/purge',{})).status,404);
});

test('restore source whose notebook is gone → 409',async t=>{
 const {call}=await fixture(t);
 const b=await call('/api/notebooks',{title:'NB'});
 const txt=await call('/api/sources',{notebookId:b.id,title:'note.txt',content:'hello'});
 await call('/api/sources/'+txt.id,'','DELETE');
 await call('/api/notebooks/'+b.id,'','DELETE');
 assert.equal((await call('/api/trash/'+txt.id+'/restore',{})).status,409);
});

test('backup restore rejects invalid payload → 400',async t=>{
 const {call}=await fixture(t);
 assert.equal((await call('/api/backup/restore',{foo:1})).status,400);
});
