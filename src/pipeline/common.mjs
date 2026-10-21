import {createHash} from 'node:crypto';
export const hash=x=>createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
export const norm=x=>String(x??'').normalize('NFKC').replace(/\s+/g,'').toLowerCase();
export const requireValue=(yes,message)=>{if(!yes)throw Error(message);};
export function parseJSON(raw){return JSON.parse(raw.replace(/<think>[\s\S]*?<\/think>/g,'').replace(/^```(?:json)?\s*|\s*```$/g,'').trim());}
export function chunkBySize(items,budget=11000){const out=[];let part=[],size=0;for(const item of items){const n=JSON.stringify(item).length;if(part.length&&size+n>budget){out.push(part);part=[];size=0;}part.push(item);size+=n;}if(part.length)out.push(part);return out;}
export const BLOCK_FLAGS=['SINGLE_RUN_METRIC','UNRESOLVED_CONFLICT','PENDING_VERIFICATION','VISUAL_INFERENCE','HIGH_RISK_ISOLATED_NUMBER','UNKNOWN_VISUAL_ROLE','NOISE','LOW_CONFIDENCE','EXTRACTION_DISAGREEMENT'];
export function quizEligible(f){return f.layer==='CORE'&&f.knowledge_type==='GENERAL_PRINCIPLE'&&['MODEL_REVIEWED','EXTERNALLY_VERIFIED'].includes(f.verification)&&!f.flags.some(x=>BLOCK_FLAGS.includes(x));}
