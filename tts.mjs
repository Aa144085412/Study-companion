import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT=path.dirname(fileURLToPath(import.meta.url));
export function ttsStatus(){
  const python=path.join(ROOT,'.venv-tts','Scripts','python.exe');
  const flag=path.join(ROOT,'.venv-tts','tts-ready.flag');
  const env=fs.existsSync(python),ready=env&&fs.existsSync(flag);
  return {ready,engine:'edge-tts (云端)',device:'cloud',python,message:ready?'朗读已就绪（edge-tts 云端音色，需联网）':env?'已创建朗读环境但未就绪，请运行 setup-tts.ps1':'本地朗读未安装，请运行 setup-tts.ps1'};
}
export function synthesize(text,{signal,onProgress=()=>{},voice='',timeoutMs=120000}={}){
  return new Promise((resolve,reject)=>{
    const status=ttsStatus();if(!status.ready)return reject(new Error(status.message));
    if(signal?.aborted)return reject(new Error('已取消'));
    const base=path.join(os.tmpdir(),'study-tts-'+randomUUID());
    const textFile=base+'.txt',wavFile=base+'.wav';
    fs.writeFileSync(textFile,text,'utf8');
    const args=[path.join(ROOT,'tts_worker.py'),textFile,'--out',wavFile];
    if(voice)args.push('--voice',voice);
    const child=spawn(status.python,args,{windowsHide:true,env:{...process.env,PYTHONIOENCODING:'utf-8'}});
    let buffer='',result,error='',stderr='',finished=false;
    const timeout=setTimeout(()=>{error='朗读超时，请缩短文字后重试';child.kill();},timeoutMs);
    const abort=()=>{error='已取消';child.kill();};signal?.addEventListener('abort',abort,{once:true});
    function finish(err){if(finished)return;finished=true;clearTimeout(timeout);signal?.removeEventListener('abort',abort);try{fs.rmSync(base+'.txt',{force:true});fs.rmSync(base+'.wav',{force:true});}catch{}if(err)reject(err);else resolve(result);}
    child.stdout.setEncoding('utf8');child.stdout.on('data',chunk=>{buffer+=chunk;let i;while((i=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,i);buffer=buffer.slice(i+1);try{const msg=JSON.parse(line);if(msg.event==='result')result=msg;else if(msg.event==='error')error=msg.error;else onProgress(msg);}catch{}}});
    child.stderr.setEncoding('utf8');child.stderr.on('data',s=>{stderr=(stderr+s).slice(-1500);});
    child.on('error',e=>finish(new Error('无法启动本地朗读进程：'+e.message)));
    child.on('close',code=>{
      if(code!==0||!result||error)return finish(new Error(error||'本地朗读失败：'+stderr.slice(-400)));
      try{
        const bytes=fs.readFileSync(result.file);
        if(!bytes.length)return finish(new Error('本地朗读未生成音频'));
        result={bytes,sampleRate:result.sampleRate||24000,mime:'audio/wav',voice:result.voice||voice};
        finish(null);
      }catch(e){finish(new Error('读取朗读音频失败：'+e.message));}
    });
  });
}
