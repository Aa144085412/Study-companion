import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {createApp} from '../server.mjs';import {parseQuiz} from '../src/deeptutor/quiz.mjs';
const questions=()=>Array.from({length:5},(_,i)=>({content:'问题'+i,topic:'概念'+i,options:'ABCD'.split('').map(id=>({id,text:'选项'+id})),correct_answer:'B',explanation:'来源支持B',source_label:'S1',source_quote:'明确材料事实'}));
test('quiz rejects invented evidence, duplicate options and invalid answer keys',()=>{
 const refs=[{label:'S1',text:'明确材料事实'}];assert.equal(parseQuiz(JSON.stringify({questions:questions()}),refs).length,5);
 for(const mutate of [q=>q.source_quote='不存在的内容',q=>q.correct_answer='E',q=>q.options[1].text=q.options[0].text]){const q=questions();mutate(q[0]);assert.throws(()=>parseQuiz(JSON.stringify({questions:q}),refs));}
});
test('five questions persist, answers grade without model calls and version prevents duplicate submissions',async t=>{
 const dataDir=fs.mkdtempSync(path.join(os.tmpdir(),'study-quiz-'));let calls=0;
 const modelFetch=async()=>{calls++;if(calls===1)return new Response(JSON.stringify({choices:[{message:{content:'{}'}}]}));return new Response(JSON.stringify({choices:[{message:{content:JSON.stringify({questions:questions()})}}]}));};
 let app=createApp({dataDir,modelFetch});await new Promise(r=>app.listen(0,'127.0.0.1',r));
 const api=async(p,data)=>{const r=await fetch('http://127.0.0.1:'+app.address().port+p,data?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}:{});return {status:r.status,body:await r.json()};};
 t.after(async()=>{await new Promise(r=>app.close(r));fs.rmSync(dataDir,{recursive:true,force:true});});
 const nb=(await api('/api/notebooks',{title:'课'})).body;await api('/api/settings',{llmUrl:'http://127.0.0.1:1234/v1',model:'test',asrUrl:'http://127.0.0.1:8000/v1',asrModel:'whisper'});await api('/api/sources',{notebookId:nb.id,title:'课.txt',content:'明确材料事实'});
 let r=await api('/api/quiz',{notebookId:nb.id,action:'generate',version:0});assert.equal(r.status,200);assert.equal(r.body.questions.length,5);const id=r.body.questions[0].id;
 r=await api('/api/quiz',{notebookId:nb.id,action:'answer',version:1,questionId:id,answer:'A'});assert.equal(r.status,200);assert.equal(r.body.questions[0].correct,false);assert.equal(calls,2);
 assert.equal((await api('/api/quiz',{notebookId:nb.id,action:'answer',version:1,questionId:id,answer:'B'})).status,409);
 assert.equal((await api('/api/quiz',{notebookId:nb.id,action:'answer',version:2,questionId:id,answer:'B'})).status,409);
 await new Promise(r=>app.close(r));app=createApp({dataDir,modelFetch});await new Promise(r=>app.listen(0,'127.0.0.1',r));
 const state=(await api('/api/state')).body;assert.equal(state.notebooks[0].quizSession.questions[0].answer,'A');assert.equal(state.notebooks[0].quizSession.questions.length,5);
});

