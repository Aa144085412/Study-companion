import test from 'node:test';
import assert from 'node:assert/strict';
import {reviewFrames,frameReviewDocument} from '../src/note_renderer/review-frames.mjs';

const item={media_id:'m',source_id:'s',segment_id:'one',start_time:8,end_time:10};
const evidence=[
 {...item,id:'speech',source_type:'ASR_TRANSCRIPT',text:'节约了20%'},
 {...item,id:'subtitle',source_type:'SUBTITLE_OCR',text:'节约了28%',frame_path:'example.jpg'},
 {...item,id:'body',source_type:'UNKNOWN_VISUAL_OCR',text:'研究原型',frame_path:'example.jpg'}
];
const artifact={pipeline_id:'p',evidence,visual_sections:[{framePath:'example.jpg'}]};
const lines=['## 阅读摘要','来源：样例','## 按视频画面组织的主题正文'];
test('review queue finds scope outside extracted facts and compares only aligned percentages',()=>{
 assert.deepEqual(reviewFrames(evidence)[0].reasons,['适用范围','数字识别分歧']);
 assert.deepEqual(reviewFrames([{...evidence[0],media_id:'other'},...evidence.slice(1)])[0].reasons,['适用范围']);
 const images=[];
 assert.equal(frameReviewDocument(artifact,null,lines,images).status,'needs_review');
 assert.equal(images[0].time,9);
});
test('review requires matching artifact, current frames and captions before publication',()=>{
 const review={pipelineId:'p',summary:'说明',sections:[{frameId:'body',title:'范围',reading:'逐图记录'}]};
 assert.equal(frameReviewDocument(artifact,review,lines,[]).status,'reviewed');
 for (const patch of [{pipelineId:'stale'},{sections:[]},{sections:[{...review.sections[0],reading:''}]},{sections:[{...review.sections[0],frameId:'subtitle'}]}]){
  assert.throws(()=>frameReviewDocument(artifact,{...review,...patch},lines,[]));
 }
});
