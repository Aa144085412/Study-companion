import test from 'node:test';import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import vm from 'node:vm';
import {renderNote} from '../src/note_renderer/index.mjs';
import {screenshotSections,visibleOCR,readScreenshotSections} from '../src/note_renderer/screenshots.mjs';
import {createApp} from '../server.mjs';import {sourceFingerprint} from '../src/pipeline/index.mjs';
const ev=(id,time,body)=>({id,source_id:'s',segment_id:id,media_id:'m',title:'视频',start_time:time,end_time:time+2,frame_path:`/frames/${time}.jpg`,source_type:'UNKNOWN_VISUAL_OCR',text:body,raw_text:body});
const fact=(id,e)=>({id,entity:'Router',property:'职责',statement:'Router分发任务。',conditions:[],knowledge_type:'SOURCE_CLAIM',layer:'CONTEXT',evidence_quotes:[{evidence_id:e.id,quote:e.text}]});
test('video narrative follows screenshots in time and places OCR before reviewed explanation',()=>{
 const early=ev('E1',10,'Router\nWorker'),late=ev('E2',80,'Watchdog'),facts=[fact('F1',early),fact('F2',late),{...fact('F3',late),layer:'UNRESOLVED'}];
 const data={notebookId:'nb',title:'video',facts,clusters:[{title:'后面画面',fact_ids:['F2','F3']},{title:'前面画面',fact_ids:['F1']}],evidence:[early,late],audits:[],conflicts:[],glossary:[]};
 const out=renderNote(data);assert.equal(out.visualSections.length,2);
 assert.ok(out.markdown.indexOf('前面画面')<out.markdown.indexOf('后面画面'));
 assert.match(out.markdown,/!\[视频截图/);assert.match(out.markdown,/画面上的文字（OCR候选）.*Router · Worker/);
 assert.ok(out.markdown.indexOf('Router · Worker')<out.markdown.indexOf('Router分发任务。'));
 assert.ok(!out.visualSections.some(s=>s.factIds.includes('F3')));
 assert.match(out.markdown,/待核对内容/);
 const unrelated={...early,id:'E3',media_id:'different',frame_path:'/other.jpg',text:'unrelated'};
 assert.equal(screenshotSections({...data,evidence:[{...early,frame_path:null},{...late,frame_path:null},unrelated]}).length,0);
});
test('repeating overlays are omitted from the OCR reading guide without changing raw evidence',()=>{
 const evidence=Array.from({length:6},(_,i)=>ev('E'+i,i,'固定水印\n章节'+i));
 assert.equal(visibleOCR(evidence,evidence[0]),'章节0');assert.match(evidence[0].text,/固定水印/);
});
test('note Markdown displays only the application screenshot route and escapes captions',()=>{
 const app=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
 const render=vm.runInNewContext(app.slice(app.indexOf('function renderMarkdown('),app.indexOf('function toggleNoteView('))+';renderMarkdown');
 assert.match(render('![<img>](\/api/note-frame?notebookId=nb&evidenceId=E1)'),/<img loading="lazy"/);
 assert.doesNotMatch(render('![bad](https://external.test/pixel)'),/<img /);
 assert.doesNotMatch(render('![bad](javascript:alert(1))'),/<img /);
 assert.doesNotMatch(render('![" onerror="bad](\/api/note-frame?notebookId=nb&evidenceId=E1)'),/alt="" onerror=/);
});
test('screenshot route serves only frame evidence belonging to the current audited notebook',async t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'note-frame-'));const dir=path.join(root,'visual-review','v');fs.mkdirSync(dir,{recursive:true});
 const frame=path.join(dir,'frame.jpg');fs.writeFileSync(frame,Buffer.from([255,216,255,217]));
 const sources=[{id:'s',notebookId:'nb',kind:'text',content:'source'}];
 const artifact={pipeline_id:'P1',evidence:[{id:'E1',frame_path:frame},{id:'outside',frame_path:path.join(root,'store.json')}]};
 fs.mkdirSync(path.join(root,'pipeline-v2','P1'),{recursive:true});fs.writeFileSync(path.join(root,'pipeline-v2','P1','artifact.json'),JSON.stringify(artifact));
 fs.writeFileSync(path.join(root,'store.json'),JSON.stringify({notebooks:[{id:'nb',title:'v',auditedPipeline:{id:'P1',inputHash:sourceFingerprint(sources)}}],sources,revisions:[],messages:[],questions:[],settings:{model:'unused'}}));
 const app=createApp({dataDir:root});await new Promise(r=>app.listen(0,'127.0.0.1',r));
 t.after(async()=>{await new Promise(r=>app.close(r));fs.rmSync(root,{recursive:true,force:true});});
 const base=`http://127.0.0.1:${app.address().port}/api/note-frame?notebookId=nb&evidenceId=`;
 const good=await fetch(base+'E1');assert.equal(good.status,200);assert.match(good.headers.get('content-type'),/image\/jpeg/);assert.equal((await good.arrayBuffer()).byteLength,4);
 assert.equal((await fetch(base+'missing')).status,404);assert.equal((await fetch(base+'outside')).status,404);
});


test('screenshot reading receives the actual image and remains visual interpretation',async()=>{
 const body=ev('E1',10,'Router / Worker');const sections=[{title:'架构',framePath:'/frames/10.jpg',bodyEvidenceId:'E1',factIds:['F1']}];
 let calls=0;const out=await readScreenshotSections(sections,[body],{call:async(stage,prompt,input,image)=>{calls++;assert.equal(stage,'screenshot_reading');assert.equal(image,'/frames/10.jpg');assert.match(input.ocr_candidate,/Router/);return {reading:'先看上层Router，再看下层Worker。'};}});
 assert.equal(calls,1);assert.equal(out[0].readingStatus,'MODEL_VISUAL_INTERPRETATION');assert.deepEqual(out[0].factIds,['F1']);
});

test('failed screenshot interpretation is explicit and cannot become an audited fact',async()=>{
 const out=await readScreenshotSections([{title:'图',framePath:'missing.jpg',factIds:['F1']}],[],{call:async()=>{throw Error('offline');}});
 assert.equal(out[0].readingStatus,'UNRESOLVED');assert.match(out[0].visualReading,/未完成/);assert.equal(out[0].statement,undefined);
});
