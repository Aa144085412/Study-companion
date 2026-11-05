import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {reviewFrames} from '../src/note_renderer/review-frames.mjs';
import {renderAgentMarkdown} from '../src/note_renderer/agent-markdown.mjs';

const [mode,artifactFile,draftFile]=process.argv.slice(2);
if (!['init','apply'].includes(mode) || !artifactFile || !draftFile) {
  throw Error('用法：node scripts/review-video.mjs init|apply <artifact.json> <复读草稿.json>');
}
const artifact=JSON.parse(fs.readFileSync(artifactFile,'utf8'));
const target=path.join(path.dirname(artifactFile),'frame-review.json');
if (path.resolve(target)===path.resolve(draftFile)) throw Error('草稿必须与已核对记录分开');
if (mode==='init') {
  const checkpoints=reviewFrames(artifact.evidence);
  const byPath=new Map();
  for(const scene of artifact.visual_sections || []) byPath.set(scene.framePath,{frameId:scene.frameEvidenceId,title:scene.title,reading:'',original:scene.framePath,time:scene.time});
  for(const {frame,reasons,time} of checkpoints) {
    const scene=byPath.get(frame.frame_path);
    byPath.set(frame.frame_path,{...scene,frameId:frame.id,title:scene?.title||reasons.join('、'),reading:'',original:frame.frame_path,time});
  }
  if (!byPath.size) throw Error('无视频原帧可复读');
  const sections=[...byPath.values()].sort((a,b)=>a.time-b.time);
  fs.writeFileSync(draftFile,JSON.stringify({pipelineId:artifact.pipeline_id,summary:'',sections},null,2),{flag:'wx'});
} else {
  const draft=JSON.parse(fs.readFileSync(draftFile,'utf8').replace(/^\uFEFF/,''));
  const review={pipelineId:draft.pipelineId,summary:draft.summary,sections:draft.sections.map(({title,reading,frameId})=>({title,reading,frameId}))};
  renderAgentMarkdown(artifact,{review});
  const temp=target+'.'+randomUUID()+'.tmp';
  try { fs.writeFileSync(temp,JSON.stringify(review,null,2));fs.renameSync(temp,target); }
  finally {fs.rmSync(temp,{force:true});}
}
