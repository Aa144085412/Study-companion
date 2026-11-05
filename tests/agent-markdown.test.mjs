import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {renderAgentMarkdown} from '../src/note_renderer/agent-markdown.mjs';import {createApp} from '../server.mjs';import {sourceFingerprint} from '../src/pipeline/index.mjs';
import {writeAgentBundle} from '../src/note_renderer/agent-bundle.mjs';
const fact=(extra={})=>({id:'F1',topic:'架构',entity:'Router',property:'职责',statement:'Router把任务交给Worker。',conditions:['已收到任务'],knowledge_type:'SOURCE_CLAIM',layer:'CONTEXT',evidence_quotes:[{evidence_id:'E1',quote:'派发任务'}],...extra});
const artifact=()=>({title:'视频笔记',pipeline_id:'P1',facts:[fact(),fact({id:'F2',entity:'比例',statement:'不可靠数字为38%。',layer:'UNRESOLVED'})],evidence:[{id:'E1',source_type:'SUBTITLE_OCR',text:'派发任务',start_time:12,end_time:15,frame_path:'C:/private/image.jpg'}],audits:[],clusters:[{title:'架构',fact_ids:['F1','F2']}],visual_sections:[{title:'架构',time:13,factIds:['F1'],framePath:'C:/private/image.jpg',visualReading:'Router连向Worker。',readingStatus:'MODEL_VISUAL_INTERPRETATION'}]});
test('Agent Markdown contains self-contained text, complete references and no local image/API dependency',()=>{
 const out=renderAgentMarkdown(artifact(),{sourceUrl:'https://v.douyin.com/test/'});
 assert.match(out.markdown,/format: study-reference\/multimodal-agent-v1/);assert.match(out.markdown,/## 阅读摘要/);assert.match(out.markdown,/概念与职责索引/);
 assert.match(out.markdown,/Router把任务交给Worker/);assert.match(out.markdown,/前提：已收到任务/);
 assert.match(out.markdown,/视觉模型解读，非已确认事实/);assert.match(out.markdown,/\[\^S1\]: 0:12–0:15/);
 assert.doesNotMatch(out.markdown,/C:\/private|\/api\//);assert.match(out.markdown,/!\[G01.*\]\(images\/G01.jpg\)/);assert.match(out.markdown,/本图对应 K01/);assert.equal(out.imageCount,1);assert.equal(out.factCount,1);assert.equal(out.referenceCount,1);
 const main=out.markdown.split('## 不确定性与使用边界')[0];assert.doesNotMatch(main,/38%/);
 assert.match(out.markdown,/状态：待核对/);assert.equal((out.markdown.match(/#### K01/g)||[]).length,1);
});
test('Agent export does not silently accept a missing evidence reference',()=>{
 const a=artifact();a.evidence=[];assert.throws(()=>renderAgentMarkdown(a),/缺少证据/);
});
test('multimodal bundle copies original images and keeps private paths out of portable files',t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'reference-bundle-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const imageRoot=path.join(root,'visual-review');fs.mkdirSync(imageRoot);const source=path.join(imageRoot,'one.jpg');fs.writeFileSync(source,'original image bytes');
 const a=artifact();a.visual_sections[0].framePath=source;
 const directory=path.join(root,'bundle');const out=writeAgentBundle(a,{directory,imageRoot});
 assert.equal(out.manifest.images.length,1);assert.equal(fs.readFileSync(path.join(directory,'images','G01.jpg'),'utf8'),'original image bytes');
 assert.match(fs.readFileSync(path.join(directory,'note.md'),'utf8'),/images\/G01.jpg/);
 assert.doesNotMatch(fs.readFileSync(path.join(directory,'manifest.json'),'utf8'),/sourcePath|visual-review/);
 a.visual_sections[0].framePath=path.join(root,'private.jpg');fs.writeFileSync(a.visual_sections[0].framePath,'private');
 assert.throws(()=>writeAgentBundle(a,{directory:path.join(root,'bad'),imageRoot}),/不属于/);
});
test('non-video text keeps a usable Agent reference without invented video time or link',()=>{
 const a=artifact();a.visual_sections=[];a.evidence[0].start_time=null;a.evidence[0].end_time=null;
 const out=renderAgentMarkdown(a);assert.match(out.markdown,/无视频时间/);assert.doesNotMatch(out.markdown,/source_url: "http/);
});
test('Agent Markdown API exports current saved audit and rejects edited/expired notes',async t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'agent-md-'));const sources=[{id:'s',notebookId:'nb',kind:'text',content:'原材料'}];
 const a=artifact();fs.mkdirSync(path.join(root,'pipeline-v2','P1'),{recursive:true});fs.writeFileSync(path.join(root,'pipeline-v2','P1','artifact.json'),JSON.stringify(a));
 fs.writeFileSync(path.join(root,'store.json'),JSON.stringify({notebooks:[{id:'nb',title:'主题',auditedPipeline:{id:'P1',inputHash:sourceFingerprint(sources)}}],sources,revisions:[{id:'r',notebookId:'nb',auditPipelineId:'P1',content:'已保存'}],messages:[],questions:[],settings:{model:'unused'}}));
 const app=createApp({dataDir:root});await new Promise(r=>app.listen(0,'127.0.0.1',r));t.after(async()=>{await new Promise(r=>app.close(r));fs.rmSync(root,{recursive:true,force:true});});
 const base=`http://127.0.0.1:${app.address().port}`;
 const good=await fetch(base+'/api/notes/agent-markdown?notebookId=nb');assert.equal(good.status,200);assert.match((await good.json()).filename,/Agent参考\.md$/);
 await fetch(base+'/api/notes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({notebookId:'nb',content:'人工编辑稿'})});
 assert.equal((await fetch(base+'/api/notes/agent-markdown?notebookId=nb')).status,409);
});
