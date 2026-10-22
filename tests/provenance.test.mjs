import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {renderNote} from '../src/note_renderer/index.mjs';
const code=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
const resolve=vm.runInNewContext(code.slice(code.indexOf('function resolveReference('),code.indexOf('let referenceOrigin='))+';resolveReference');
const sources=[{id:'s',mediaId:'old',segments:[{id:'seg',start:0,end:2000,text:'original'}]},{id:'m',kind:'media'},{id:'old',kind:'media'}];
test('citation media and saved quote take precedence over mutable source association',()=>{
 const r=resolve({sourceId:'s',segmentId:'seg',mediaId:'m',start:0,end:1500,text:'saved'},sources);
 assert.equal(r.media.id,'m');assert.equal(r.start,0);assert.equal(r.end,1500);assert.equal(r.text,'saved');
});
test('legacy citation falls back to segment without inventing timestamps',()=>{
 const r=resolve({sourceId:'s',segmentId:'seg'},sources);assert.equal(r.start,0);assert.equal(r.text,'original');
 assert.equal(resolve({sourceId:'missing',text:'snapshot'},sources).start,null);
 assert.equal(resolve({sourceId:'missing',mediaId:'gone'},sources).media,undefined);
 assert.equal(resolve({sourceId:'missing',start:NaN,end:-1},sources).end,null);
});
test('missing historical media does not silently substitute current media',()=>{
 assert.equal(resolve({sourceId:'s',mediaId:'deleted',start:0},sources).media,undefined);
});
test('renderer preserves evidence type and millisecond timestamps for source inspection',()=>{
 const note=renderNote({title:'course',facts:[],clusters:[],audits:[],conflicts:[],glossary:[],evidence:[{id:'E1',source_id:'s',media_id:'m',start_time:1.25,end_time:2.5,text:'maybe',source_type:'VLM_VISUAL_INFERENCE'}]});
 assert.equal(note.citations[0].sourceType,'VLM_VISUAL_INFERENCE');assert.equal(note.citations[0].start,1250);
});

const range=vm.runInNewContext(code.slice(code.indexOf('function resolveReference('),code.indexOf('let referenceOrigin='))+';referenceRange');
test('adjacent clips on one medium form a sorted playback range',()=>{
 const r=range([{sourceId:'s',start:4000,end:6000},{sourceId:'s',start:0,end:2000}],sources);
 assert.equal(r.start,0);assert.equal(r.end,6000);assert.equal(r.mediaId,'old');
});
test('different media, distant clips and missing end times must not become one playback span',()=>{
 assert.equal(range([{mediaId:'m',start:0,end:2000},{mediaId:'old',start:2000,end:4000}],sources),null);
 assert.equal(range([{mediaId:'m',start:0,end:2000},{mediaId:'m',start:9000,end:10000}],sources),null);
 assert.equal(range([{mediaId:'m',start:0}],sources),null);
 assert.equal(range([{mediaId:'m',start:0,end:90000}],sources),null);
});
