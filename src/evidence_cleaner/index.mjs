import fs from 'node:fs';import path from 'node:path';
import {hash,norm} from '../pipeline/common.mjs';
import {GLOSSARY_PROMPT,CLASSIFY_PROMPT} from './prompts.mjs';
export function noiseScore(text){
 const chars=[...text.replace(/\s/g,'')];if(chars.length<6)return 0;
 const counts=new Map();for(const c of chars)counts.set(c,(counts.get(c)||0)+1);
 const entropy=-[...counts.values()].reduce((s,n)=>s+n/chars.length*Math.log2(n/chars.length),0);
 const grams=chars.slice(0,-2).map((_,i)=>chars.slice(i,i+3).join(''));
 const repetition=grams.length?1-new Set(grams).size/grams.length:0;
 return Math.max(entropy<1?1:0,chars.length<=160&&repetition>0.65?repetition:0,/(.)\1{4,}/u.test(text)?0.9:0);
}
function item(base,type,raw,confidence=null,frame=null){
 const flags=[];if(type==='VLM_VISUAL_INFERENCE')flags.push('VISUAL_INFERENCE');if(type==='UNKNOWN_VISUAL_OCR')flags.push('UNKNOWN_VISUAL_ROLE');
 return {...base,id:'E'+hash([base.source_id,base.segment_id,base.start_time,type,raw]).slice(0,16),source_type:type,raw_text:raw,text:raw,confidence,flags,classification_method:'extraction_metadata',aligned_evidence_ids:[],frame_path:frame,noise:false};
}
export function ingestEvidence(sources,{dataDir,notebookId}={}){
 const out=[],covered=new Set();
 const root=dataDir&&path.join(dataDir,'visual-review');
 if(root&&fs.existsSync(root))for(const dir of fs.readdirSync(root,{withFileTypes:true}).filter(x=>x.isDirectory())){
  try{const folder=path.join(root,dir.name),cfg=JSON.parse(fs.readFileSync(path.join(folder,'input.json'),'utf8'));
   if(cfg.notebookId!==notebookId||covered.has(cfg.mediaId)||!sources.some(s=>s.id===cfg.mediaId))continue;
   const source=sources.find(s=>s.kind==='text'&&s.mediaId===cfg.mediaId&&s.segments?.some(x=>cfg.segments.some(y=>x.id===y.id)));if(!source)continue;
   const rows=new Map();for(const line of fs.readFileSync(path.join(folder,'evidence.jsonl'),'utf8').split('\n').filter(Boolean)){try{const e=JSON.parse(line);rows.set(e.segment_id,e);}catch{}}
   if(!rows.size)continue;covered.add(cfg.mediaId);
   for(const seg of source.segments){const e=rows.get(seg.id),base={source_id:source.id,segment_id:seg.id,media_id:cfg.mediaId,title:source.title,start_time:seg.start/1000,end_time:seg.end/1000};
    if(seg.text.trim())out.push(item(base,'ASR_TRANSCRIPT',seg.text));if(!e)continue;
    const frame=e.frame_path&&path.resolve(e.frame_path);const allowed=frame&&frame.startsWith(path.resolve(folder)+path.sep)&&fs.existsSync(frame)?frame:null;
    if(e.subtitle_text)out.push(item(base,'SUBTITLE_OCR',e.subtitle_text,e.ocr_confidence,allowed));
    if(e.slide_text)out.push(item(base,'UNKNOWN_VISUAL_OCR',e.slide_text,e.slide_confidence,allowed));
    if(e.visual_description)out.push(item(base,'VLM_VISUAL_INFERENCE',e.visual_description,null,allowed));
   }
  }catch{/* unavailable structured export falls back to imported text, never guessed frame paths */}
 }
 for(const s of sources.filter(s=>s.kind==='text'&&!s.replacedBy&&!covered.has(s.mediaId))){
  const segments=s.segments?.length?s.segments:Array.from({length:Math.ceil((s.content||'').length/1800)},(_,i)=>({text:s.content.slice(i*1800,(i+1)*1800)}));
  for(const [segmentIndex,seg] of segments.entries()){if(!seg.text?.trim())continue;const base={source_id:s.id,segment_id:seg.id||`text-${segmentIndex}`,media_id:s.mediaId||null,title:s.title,start_time:seg.start===undefined?null:seg.start/1000,end_time:seg.end===undefined?null:seg.end/1000};
   // Legacy mixed exports are parsed by explicit record prefixes, not by domain terms.
   const markers=[['原 ASR：','ASR_TRANSCRIPT'],['画面字幕 OCR 候选：','SUBTITLE_OCR'],['课件/画面正文 OCR 候选：','UNKNOWN_VISUAL_OCR'],['本地视觉模型推断：','VLM_VISUAL_INFERENCE'],['视觉模型推断：','VLM_VISUAL_INFERENCE']];
   if(markers.some(([prefix])=>seg.text.includes(prefix))){for(const line of seg.text.split('\n')){const m=markers.find(([prefix])=>line.startsWith(prefix));if(m&&line.slice(m[0].length).trim())out.push(item(base,m[1],line.slice(m[0].length)));}}
   else out.push(item(base,s.mediaId?'ASR_TRANSCRIPT':'DOCUMENT_TEXT',seg.text));
  }
 }
 return out;
}
export async function cleanEvidence(raw,{title,call,classifyLimit=12}){
 const evidence=structuredClone(raw),frequency=new Map();
 for(const e of evidence.filter(e=>['UNKNOWN_VISUAL_OCR','UI_OR_INSTRUMENT_OCR'].includes(e.source_type)))for(const line of new Set(e.text.split('\n').map(norm).filter(Boolean)))frequency.set(line,(frequency.get(line)||0)+1);
 const visualCount=evidence.filter(e=>e.source_type==='UNKNOWN_VISUAL_OCR').length;
 for(const e of evidence){
  const lines=e.text.split('\n').map(line=>e.source_type.endsWith('_OCR')?line.replace(/([^\d\s])\1{4,}/gu,''):line).filter(line=>noiseScore(line)<0.8);e.text=lines.join('\n');
  if(!e.text.trim()){e.noise=true;e.flags.push('NOISE');}
  if(e.confidence!==null&&e.confidence<0.8)e.flags.push('LOW_CONFIDENCE');
  if(e.source_type==='UNKNOWN_VISUAL_OCR'&&e.text.split('\n').some(line=>(frequency.get(norm(line))||0)>Math.max(8,visualCount*0.65)))e.flags.push('PERSISTENT_OVERLAY_CANDIDATE');
 }
 // Classify only actual images; budget exhaustion remains UNKNOWN, never assumed to be slides.
 const chosen=selectVisualCandidates(evidence,classifyLimit);
 for(const e of chosen){try{const v=await call('visual_classification',CLASSIFY_PROMPT,{evidence_id:e.id,body:e.text},e.frame_path);
  if(['SUBTITLE_OCR','SLIDE_DOCUMENT_OCR','UI_OR_INSTRUMENT_OCR'].includes(v.source_type)&&typeof v.confidence==='number'&&v.confidence>=0.85&&typeof v.text==='string'&&v.text.trim().length>=4&&e.text.includes(v.text.trim())){
   e.source_type=v.source_type;e.text=v.text.trim();e.classification_method='VLM_IMAGE_REGION_CLASSIFICATION';e.flags=e.flags.filter(x=>x!=='UNKNOWN_VISUAL_ROLE');if(v.source_type==='UI_OR_INSTRUMENT_OCR')e.flags.push('HIGH_RISK_ISOLATED_NUMBER');
  }
 }catch{e.flags.push('CLASSIFICATION_UNAVAILABLE');}}
 for(const e of evidence.filter(e=>e.source_type==='UI_OR_INSTRUMENT_OCR')){
  const speech=evidence.filter(a=>a.source_type==='ASR_TRANSCRIPT'&&a.media_id===e.media_id&&a.start_time===e.start_time);
  const nums=e.text.match(/\d+(?:[.,]\d+)?/g)||[];
  e.aligned_evidence_ids=speech.filter(a=>nums.length&&nums.every(n=>a.text.includes(n))).map(a=>a.id);
  // Matching numbers alone is not semantic alignment; risk stays for auditor review.
 }
 const asr=new Map(evidence.filter(e=>e.source_type==='ASR_TRANSCRIPT').map(e=>[[e.media_id,e.start_time].join('|'),e]));
 for(const sub of evidence.filter(e=>e.source_type==='SUBTITLE_OCR')){const a=asr.get([sub.media_id,sub.start_time].join('|'));if(a){sub.aligned_evidence_ids=[a.id];a.aligned_evidence_ids.push(sub.id);}}
 const usable=evidence.filter(e=>!e.noise),freq=new Map();for(const e of usable)for(const token of e.text.match(/[A-Za-z][A-Za-z0-9_-]{2,}|[\u4e00-\u9fff]{2,6}/g)||[])freq.set(token,(freq.get(token)||0)+1);
 const sampled=[];for(let i=0;i<Math.min(32,usable.length);i++){const e=usable[Math.floor(i*usable.length/Math.min(32,usable.length))];sampled.push({id:e.id,text:e.text.slice(0,240)});}
 const g=await call('glossary',GLOSSARY_PROMPT,{title,full_scan_items:usable.length,terms:[...freq].sort((a,b)=>b[1]-a[1]).slice(0,100),samples:sampled});
 const glossary=(Array.isArray(g.candidates)?g.candidates:[]).slice(0,8).filter(c=>typeof c.observed==='string'&&typeof c.proposed==='string'&&typeof c.reason==='string'&&Array.isArray(c.evidence_ids)&&c.evidence_ids.length&&c.evidence_ids.every(id=>usable.some(e=>e.id===id&&e.raw_text.includes(c.observed)))).map(c=>({observed:c.observed,proposed:c.proposed,reason:c.reason,evidence_ids:c.evidence_ids,status:'CANDIDATE_ONLY'}));
 return {evidence,domain:typeof g.domain==='string'?g.domain:'未知',glossary};
}

// Prioritize readable OCR where speech has no subtitle partner; do not promote it without image review.
export function selectVisualCandidates(evidence,limit){
 const candidates=evidence.filter(e=>!e.noise&&e.frame_path&&e.source_type==='UNKNOWN_VISUAL_OCR'&&norm(e.text).length>=8);
 const priority=candidates.filter(e=>!evidence.some(s=>s.media_id===e.media_id&&s.start_time===e.start_time&&s.source_type==='SUBTITLE_OCR'&&!s.noise)&&evidence.some(s=>s.media_id===e.media_id&&s.start_time===e.start_time&&s.source_type==='ASR_TRANSCRIPT'));
 const chosen=[];const pick=(items,n)=>{for(let i=0;i<Math.min(n,items.length);i++){const e=items[Math.floor(i*items.length/Math.min(n,items.length))];if(!chosen.includes(e))chosen.push(e);}};
 pick(priority,limit);pick(candidates.filter(e=>!chosen.includes(e)),limit-chosen.length);return chosen;
}
