import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {evaluateResearchRun} from '../scripts/evaluate-research-notes.mjs';

const template=JSON.parse(fs.readFileSync(new URL('../evaluation/research-notes/real-evaluation.template.json',import.meta.url),'utf8'));

test('empty T62 template reports missing real inputs and withholds metrics',()=>{
 const result=evaluateResearchRun(template);
 assert.equal(result.state,'BLOCKED_MISSING_EXTERNAL_INPUTS');assert.equal(result.held_out_metrics,null);
 assert.equal(result.development_metrics,null);assert.equal(result.quality_claim,'NOT_ASSERTED');
 assert.equal(Object.hasOwn(result,'accuracy'),false);assert.equal(result.blockers.length,3);
});

test('synthetic development cases stay in the development summary',()=>{
 const run={...template,state:'DEVELOPMENT_ONLY',location_tolerance_ms:3000,materials:[{id:'synthetic-fixture',category:'literature_share',split:'development',authorization:'synthetic',synthetic:true}],cases:[
  {id:'structural-case',material_id:'synthetic-fixture',expected_decision:'ACCEPT',actual_decision:'OMITTED',expected_location:{source_id:'fixture-source',page:2},actual_location:null,elapsed_ms:250,failure:null,critical_error:false,reviewer_id:'fixture-only'}
 ]};
 const result=evaluateResearchRun(run);
 assert.equal(result.state,'DEVELOPMENT_ONLY');assert.equal(result.development_metrics.omissions,1);
 assert.equal(result.development_metrics.source_location_mismatches,1);assert.equal(result.held_out_metrics,null);
 assert.equal(result.quality_claim,'NOT_ASSERTED');
 assert.throws(()=>evaluateResearchRun({...run,materials:[{...run.materials[0],split:'held_out'}]}),/只接受标明synthetic/);
});

test('real mode requires an identified model and refuses synthetic materials',()=>{
 const synthetic={id:'synthetic',category:'literature_share',split:'held_out',authorization:'synthetic',synthetic:true};
 assert.throws(()=>evaluateResearchRun({...template,state:'REAL',location_tolerance_ms:3000,materials:[synthetic],cases:[],review:{}}),/服务提供商/);
 assert.throws(()=>evaluateResearchRun({...template,state:'REAL',location_tolerance_ms:3000,model:{provider:'chosen',name:'model',version:'1'},materials:[synthetic],cases:[],review:{}}),/已获准、非合成/);
});

test('summary output refuses to overwrite a previous evaluation file',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'research-eval-test-')),out=path.join(dir,'summary.json');
 try{fs.writeFileSync(out,'preserve');const input=path.join(dir,'record.json');fs.writeFileSync(input,JSON.stringify(template));
  const {spawnSync}=await import('node:child_process');const result=spawnSync(process.execPath,['scripts/evaluate-research-notes.mjs','--input',input,'--out',out],{encoding:'utf8'});
  assert.equal(result.status,1);assert.match(result.stderr,/拒绝覆盖/);assert.equal(fs.readFileSync(out,'utf8'),'preserve');
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
