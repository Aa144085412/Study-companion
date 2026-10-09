import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT=path.dirname(fileURLToPath(import.meta.url));
export function asrStatus(){
  const python=path.join(ROOT,'.venv','Scripts','python.exe');
  const model=path.join(ROOT,'models','faster-whisper-small');
  const ready=fs.existsSync(python)&&['model.bin','config.json','tokenizer.json','vocabulary.txt'].every(f=>fs.existsSync(path.join(model,f)));
  return {ready,engine:'faster-whisper-small',device:'CPU int8',python,model,message:ready?'本地识别已就绪':'本地识别未安装完整，请运行 setup-asr.ps1'};
}
export function transcribeLocal(file,{signal,onProgress=()=>{}}={}){
  return new Promise((resolve,reject)=>{
    const status=asrStatus();if(!status.ready)return reject(new Error(status.message));
    if(signal?.aborted)return reject(new Error('已取消'));
    const child=spawn(status.python,[path.join(ROOT,'asr_worker.py'),file,'--model',status.model],{windowsHide:true,env:{...process.env,PYTHONIOENCODING:'utf-8',HF_HUB_OFFLINE:'1'}});
    let buffer='',result,error='',stderr='',finished=false;
    const timeout=setTimeout(()=>{error='识别超时（上限 2 小时），请拆分媒体后重试';child.kill();},2*60*60*1000);
    const abort=()=>{error='已取消';child.kill();};signal?.addEventListener('abort',abort,{once:true});
    function finish(err){if(finished)return;finished=true;clearTimeout(timeout);signal?.removeEventListener('abort',abort);if(err)reject(err);else resolve(result);}
    child.stdout.setEncoding('utf8');child.stdout.on('data',chunk=>{buffer+=chunk;let i;while((i=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,i);buffer=buffer.slice(i+1);try{const msg=JSON.parse(line);if(msg.event==='result')result=msg;else if(msg.event==='error')error=msg.error;else onProgress(msg);}catch{}}});
    child.stderr.setEncoding('utf8');child.stderr.on('data',s=>{stderr=(stderr+s).slice(-1500);});
    child.on('error',e=>finish(new Error('无法启动本地识别进程：'+e.message)));
    child.on('close',code=>finish(code===0&&result&&!error?null:new Error(error||'本地识别失败：'+stderr.slice(-400))));
  });
}
