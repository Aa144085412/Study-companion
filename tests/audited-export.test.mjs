import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createApp} from '../server.mjs';
import {sourceFingerprint} from '../src/pipeline/index.mjs';

test('video knowledge export preserves the audited note and never regenerates claims from ASR',async t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'audited-export-'));
 const sources=[{id:'s',notebookId:'n',kind:'text',content:'原始识别错误文字'}];
 const artifact={pipeline_id:'Pabc',evidence:[{source_id:'s',segment_id:'seg',media_id:'v',start_time:1.25,end_time:2,source_type:'SUBTITLE_OCR',text:'Router'}]};
 fs.mkdirSync(path.join(root,'pipeline-v2','Pabc'),{recursive:true});
 fs.writeFileSync(path.join(root,'pipeline-v2','Pabc','artifact.json'),JSON.stringify(artifact));
 fs.writeFileSync(path.join(root,'store.json'),JSON.stringify({notebooks:[{id:'n',title:'知识视频',auditedPipeline:{id:'Pabc',inputHash:sourceFingerprint(sources)}}],sources,revisions:[{id:'r',notebookId:'n',auditPipelineId:'Pabc',content:'审计正文\n待核对：某项结论'}],messages:[],questions:[],settings:{model:'unused'}}));
 let modelCalls=0;const app=createApp({dataDir:root,skillsDir:path.join(root,'skills'),modelFetch:async()=>{modelCalls++;throw Error('must not call');}});
 await new Promise(r=>app.listen(0,'127.0.0.1',r));
 t.after(async()=>{await new Promise(r=>app.close(r));fs.rmSync(root,{recursive:true,force:true});});
 const post=async(data)=>{const r=await fetch(`http://127.0.0.1:${app.address().port}/api/agent/skill`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});return {status:r.status,body:await r.json()};};
 const result=await post({notebookId:'n',kind:'knowledge',auditedOnly:true});
 assert.equal(result.status,201);assert.equal(modelCalls,0);
 const file=result.body.result.skill.path;
 assert.ok(fs.readFileSync(file,'utf8').includes('审计正文\n待核对：某项结论'));
 assert.ok(!fs.readFileSync(file,'utf8').includes('原始识别错误文字'));
 assert.equal(result.body.result.skill.reviewStatus,'automatic');
 const entry=fs.readFileSync(result.body.result.skill.packagePath,'utf8');
 assert.match(entry,/视频知识复习/);assert.doesNotMatch(entry,/每次只推进一个步骤/);
 const refs=JSON.parse(fs.readFileSync(path.join(path.dirname(result.body.result.skill.packagePath),'references','sources.json'),'utf8'));
 assert.equal(refs[0].start,1250);assert.equal(refs[0].sourceId,'s');
 // Source changes invalidate the audit even when a previous skill exists.
 const state=await fetch(`http://127.0.0.1:${app.address().port}/api/sources`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({notebookId:'n',title:'new.txt',content:'新证据'})});
 assert.equal(state.status,201);
 const stale=await post({notebookId:'n',auditedOnly:true});assert.equal(stale.status,409);
});
