export function terms(text){
 const out=new Set((text.toLowerCase().match(/[a-z0-9]+/g)||[]));
 for(const run of text.match(/[\u4e00-\u9fff]+/g)||[])for(let i=0;i<run.length-1;i++)out.add(run.slice(i,i+2));
 return [...out];
}
export function labelEvidence(items){return items.map((e,i)=>({...e,label:`S${i+1}`}));}
export function batches(items,budget=5000){
 const result=[];let part=[],size=0;
 for(const e of items){
   // Include JSON metadata in budget; never drop remaining text.
   for(let offset=0;offset<e.text.length;offset+=1200){
     const chunk={...e,text:e.text.slice(offset,offset+1200)};
     const n=JSON.stringify(chunk).length;
     if(size+n>budget&&part.length){result.push(part);part=[];size=0;}
     part.push(chunk);size+=n;
   }
 }
 if(part.length)result.push(part);return result;
}
export function retrieve(items,query,budget=5000){
 const ts=terms(query),score=e=>ts.reduce((n,t)=>n+(e.text.toLowerCase().includes(t)?1:0),0);
 const tail=/(最后|结尾|末尾)/.test(query)?Math.max(-1,...items.filter(e=>Number.isFinite(e.start)).map(e=>e.start)):-1;
 const ranked=items.map((e,i)=>({e,i,score:score(e)+(tail>=0&&e.start===tail?ts.length+1:0)})).sort((a,b)=>b.score-a.score||a.i-b.i);
 const selected=[],seen=new Set();let size=0;
 const add=i=>{const e=items[i];if(!e||seen.has(i))return;const n=JSON.stringify(e).length;if(size+n>budget)return;seen.add(i);size+=n;selected.push(e);};
 for(const hit of ranked){add(hit.i);if(hit.score>0){if(items[hit.i-1]?.sourceId===hit.e.sourceId)add(hit.i-1);if(items[hit.i+1]?.sourceId===hit.e.sourceId)add(hit.i+1);}}
 return selected;
}
export function validateCitations(content,refs){
 const valid=new Set(refs.map(r=>r.label));
 return content.replace(/\[(S\d+)\]/g,(all,label)=>valid.has(label)?all:'[引用无效，待核对]');
}
