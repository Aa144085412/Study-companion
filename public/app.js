const $ = id=>document.getElementById(id);
function confirmAction(message){ return new Promise(resolve=>{ $('confirmText').textContent=message; const d=$('confirmDialog'); d.onclose=()=>resolve(d.returnValue==='yes'); d.showModal(); }); }
let state, current=localStorage.getItem('study.current'), selection='', dirty=false, busy=false, historyView=false, noteView='read';
const node=(tag,cls,value)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(value!==undefined)e.textContent=value;return e;};
function toast(s){$('toast').textContent=s;$('toast').classList.remove('hidden');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').classList.add('hidden'),6500);}
async function api(url,data,method='POST'){const r=await fetch(url,data===undefined?{}:{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const x=await r.json();if(!r.ok)throw Error(x.error||'请求失败');return x;}
async function run(fn){try{return await fn();}catch(e){toast(e.message);}}
function needBook(){if(!current)throw Error('请先点击左侧 ＋ 创建笔记本');return current;}
const latest=()=>[...state.revisions].reverse().find(r=>r.notebookId===current);
const time=ms=>new Date(ms).toISOString().slice(11,19);
function button(label,fn,cls='secondary'){const b=node('button',cls,label);b.onclick=()=>run(fn);return b;}
async function refresh(loadNote=false){state=await api('/api/state');if(!state.notebooks.some(b=>b.id===current))current=state.notebooks[0]?.id;render(loadNote);}
function render(loadNote){
  $('books').replaceChildren(...state.notebooks.map(b=>button('▤  '+b.title,async()=>{if(dirty&&!await confirmAction('当前笔记未保存，仍要切换吗？'))return;current=b.id;localStorage.setItem('study.current',current);dirty=false;selection='';render(true);},b.id===current?'active':'')));
  $('bookTitle').textContent=state.notebooks.find(b=>b.id===current)?.title||'建立你的第一本学习笔记';
  $('deleteBookButton').classList.toggle('hidden',!state.notebooks.length);
  const noBook=state.notebooks.length===0;
  $('emptyBook').classList.toggle('hidden',!noBook);
  $('noteToolbar').classList.toggle('hidden',noBook);
  $('noteEditor').classList.toggle('hidden',noBook);
  $('noteFooter').classList.toggle('hidden',noBook);
  if(loadNote){historyView=false;$('noteEditor').readOnly=false;$('noteEditor').classList.remove('is-historical');$('noteEditor').value=latest()?.content||'';selection='';selectionChanged();}
  $('revisionLabel').textContent=historyView&&$('noteEditor').readOnly?'只读 · 历史版本':historyView?'已载入历史版本 · 未保存':dirty?'有未保存的修改':latest()?'已保存 · '+new Date(latest().createdAt).toLocaleString():'尚未保存';
  $('continueEdit').classList.toggle('hidden',!(historyView&&$('noteEditor').readOnly));
  const sources=state.sources.filter(s=>s.notebookId===current&&!s.replacedBy),questions=state.questions.filter(q=>q.notebookId===current);
  $('sourceCount').textContent=sources.length||'';$('questionCount').textContent=questions.filter(q=>q.status!=='已理解').length||'';
  $('sourceList').replaceChildren();if(!sources.length)$('sourceList').append(node('div','empty','还没有资料。导入一份讲解文稿，开始建立你的学习空间。'));
  for(const s of sources){const card=node('div','source-card');card.append(node('h3','',s.title),node('p','',s.kind==='media'?'原始媒体 · 可回放':s.segments?.length?`${s.segments.length} 个带时间戳的片段`:'文本资料 · 无时间定位'));card.append(button(s.kind==='media'?'播放':'查看原文',()=>showSource(s)));
    if(s.kind==='media')card.append(button('转成文字',async()=>{await api('/api/jobs',{sourceId:s.id});await refresh();toast('已加入本地转写队列');}));
    else {card.append(button('校对文稿',()=>editSource(s)));if(s.previousId)card.append(button('上一版本',()=>showSource(state.sources.find(x=>x.id===s.previousId))));}
    if(s.segments?.length){const sel=node('select');sel.append(new Option('关联原录音 / 视频',''));sources.filter(m=>m.kind==='media').forEach(m=>sel.append(new Option(m.title,m.id)));sel.value=s.mediaId||'';sel.onchange=()=>run(async()=>{if(!sel.value)return;await api('/api/link-media',{sourceId:s.id,mediaId:sel.value});await refresh();toast('已关联，可点击字幕时间回放');});card.append(sel);}card.append(button('删除',async()=>{if(!await confirmAction('删除资料「'+s.title+'」及其相关版本？此操作无法撤销。'))return;await api('/api/sources/'+s.id,'','DELETE');await refresh();toast('已删除资料');},'danger'));$('sourceList').append(card);
  }
  $('questionList').replaceChildren();if(!questions.length)$('questionList').append(node('div','empty','把问题写在右侧，点击「记下疑问」。不急着一次弄懂。'));
  for(const q of questions){const c=node('div','question-card');c.append(node('p','',q.question));const sel=node('select');['未解决','学习中','已理解'].forEach(s=>sel.append(new Option(s,s)));sel.value=q.status;sel.onchange=()=>run(async()=>{await api('/api/questions/'+q.id,{status:sel.value},'PATCH');await refresh();});c.append(sel);$('questionList').append(c);}
  renderMessages(); renderJobs(); renderSkillMessages();
  renderNote();
}
function renderMessages(){const messages=state.messages.filter(m=>m.notebookId===current);if(!messages.length){$('messages').replaceChildren(node('div','chat-welcome','✧\n\n从一个「为什么」开始\n\n选中笔记中的一句话，问问它的原理、目的，或前后联系。'));return;}$('messages').replaceChildren();for(const m of messages){const c=node('article','message '+m.role);c.append(node('div','message-label',m.role==='user'?'你':m.type==='draft'?'研习伴 · 笔记草稿':'研习伴'),node('div','message-text',m.text));if(m.role==='assistant'){const actions=node('div','message-actions');actions.append(button('朗读',()=>speak(m.text)),button('停止',stopSpeak),button('追加到笔记',async()=>{if(!await confirmAction('将这段回答追加到编辑区？检查后点击保存版本。'))return;$('noteEditor').value+='\n\n'+m.text+'\n\n'+(m.citations||[]).map(e=>`来源 [${e.label}]：${e.title}${e.start!==undefined?' '+time(e.start):''}`).join('\n');dirty=true;$('revisionLabel').textContent='有未保存的修改';renderNote();}));c.append(actions);for(const ref of m.citations||[])c.append(button(`[${ref.label}] ${ref.title}${ref.start!==undefined?' · '+time(ref.start):''}`,()=>showReference(ref),'citation'));if(m.truncated)c.append(node('p','hint','本次材料超过上下文预算，仅使用部分内容；请拆分笔记本后再核对。'));}$('messages').append(c);}$('messages').scrollTop=$('messages').scrollHeight;}
function showSource(s){if(s.kind==='media')return play(s.id,0);$('sourceDialogTitle').textContent=s.title;$('sourceContent').replaceChildren();if(s.segments?.length){for(const seg of s.segments){const e=node('div','segment');e.id='seg-'+seg.id;if(s.mediaId)e.append(button(time(seg.start),()=>{$('sourceDialog').close();play(s.mediaId,seg.start,seg.end);}));else e.append(node('small','',time(seg.start)+' — '+time(seg.end)+'\n'));e.append(node('span','',seg.text));$('sourceContent').append(e);}}else $('sourceContent').textContent=s.content;$('sourceDialog').showModal();}
function showReference(ref){const s=state.sources.find(s=>s.id===ref.sourceId);if(!s)throw Error('来源缺失');if(s.mediaId&&ref.start!==undefined)return play(s.mediaId,ref.start,ref.end);showSource(s);if(ref.segmentId)document.getElementById('seg-'+ref.segmentId)?.scrollIntoView({block:'center'});}
let mediaEnd;function play(id,start,end){const s=state.sources.find(s=>s.id===id);if(!s)throw Error('原媒体不存在');$('mediaTitle').textContent=s.title;$('mediaArea').classList.remove('hidden');const player=$('player');mediaEnd=end;player.src='/api/media/'+id;player.onloadedmetadata=()=>{player.currentTime=start/1000;player.play().catch(()=>toast('请点击播放器开始播放'));};player.ontimeupdate=()=>{if(mediaEnd!==undefined&&player.currentTime>=mediaEnd/1000){player.pause();mediaEnd=undefined;}};}
function selectionChanged(){$('selectionBox').textContent=selection?'正在讨论：'+selection:'整篇笔记 · 也可选中一段文字';$('noteSelEcho').textContent=selection?'正在讨论：「'+(selection.length>24?selection.slice(0,24)+'…':selection)+'」':'选中一段即可共读';}
$('noteEditor').onselect=()=>{const e=$('noteEditor');selection=e.value.slice(e.selectionStart,e.selectionEnd).trim();selectionChanged();};
$('noteEditor').oninput=()=>{dirty=true;if(!historyView)$('revisionLabel').textContent='有未保存的修改';};
function renderNote(){
  const noBook=state.notebooks.length===0;
  const content=$('noteEditor').value;
  const box=$('noteRender'),editor=$('noteEditor');
  const read=noteView==='read';
  $('readViewBtn').classList.toggle('active',read);
  $('editViewBtn').classList.toggle('active',!read);
  box.classList.toggle('hidden',!read||noBook);
  editor.classList.toggle('hidden',read||noBook);
  if(read&&!noBook)box.innerHTML=content?renderMarkdown(content):'<p class="note-empty">还没有内容。切到「编辑」写第一版，或导入资料后点「从资料整理」。</p>';
}
function renderMarkdown(md){
  const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const inline=t=>{let s=esc(t);s=s.replace(/`([^`]+)`/g,'<code>$1</code>');s=s.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');s=s.replace(/(^|[^*\w])\*([^*\n]+)\*(?!\*)/g,'$1<em>$2</em>');return s;};
  const out=[],para=[];const flush=()=>{if(para.length)out.push('<p>'+inline(para.join(' '))+'</p>');para.length=0;};
  let listType=null;const endList=()=>{if(listType){out.push('<'+listType+'></'+listType+'>');listType=null;}};
  for(const line of md.replace(/\r\n/g,'\n').split('\n')){
    const h=line.match(/^(#{1,6})\s+(.*)$/);
    if(h){flush();endList();const l=h[1].length;out.push('<h'+l+'>'+inline(h[2])+'</h'+l+'>');continue;}
    if(/^\s*(---|\*\*\*|___)\s*$/.test(line)){flush();endList();out.push('<hr>');continue;}
    if(/^\s*>\s?/.test(line)){flush();endList();out.push('<blockquote>'+inline(line.replace(/^\s*>\s?/,''))+'</blockquote>');continue;}
    const ul=line.match(/^\s*[-*+]\s+(.*)$/),ol=line.match(/^\s*\d+[.)]\s+(.*)$/);
    if(ul||ol){flush();const want=ul?'ul':'ol';if(listType&&listType!==want)endList();if(listType!==want){out.push('<'+want+'>');listType=want;}out.push('<li>'+inline((ul||ol)[1])+'</li>');continue;}
    if(!line.trim()){flush();endList();continue;}
    para.push(line);
  }
  flush();endList();
  return out.join('\n');
}
function toggleNoteView(v){
  noteView=v;
  if(v==='edit'&&!historyView)$('noteEditor').focus();
  renderNote();
}
$('readViewBtn').onclick=()=>toggleNoteView('read');
$('editViewBtn').onclick=()=>toggleNoteView('edit');
$('noteRender').addEventListener('mouseup',()=>{const sel=window.getSelection();if(sel&&sel.type==='Range'){const t=sel.toString().trim();if(t){selection=t;selectionChanged();}}});
$('noteRender').addEventListener('keyup',()=>$('noteRender').dispatchEvent(new MouseEvent('mouseup',{bubbles:true})));
$('newBook').onclick=()=>{ $('newBookTitle').value=''; $('newBookDialog').showModal(); };
$('createFirstBook').onclick=()=>{ $('newBookTitle').value=''; $('newBookDialog').showModal(); };
$('newBookForm').onsubmit=e=>{e.preventDefault();run(async()=>{const title=$('newBookTitle').value.trim();if(!title)return;if(dirty&&!await confirmAction('当前笔记未保存，仍要新建吗？'))return;const b=await api('/api/notebooks',{title});current=b.id;dirty=false;localStorage.setItem('study.current',current);$('newBookDialog').close();await refresh(true);});};
$('cancelNewBook').onclick=()=>$('newBookDialog').close();
$('saveNote').onclick=()=>run(saveNote);
async function saveNote(){needBook();await api('/api/notes',{notebookId:current,content:$('noteEditor').value});dirty=false;historyView=false;await refresh();toast('已保存新版本，历史内容保留');}
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-tab]').forEach(x=>{const on=x===b;x.classList.toggle('active',on);x.setAttribute('aria-selected',on);x.tabIndex=on?0:-1;});document.querySelectorAll('.panel').forEach(x=>x.classList.toggle('hidden',x.id!==b.dataset.tab));b.focus();});
$('importButton').onclick=()=>run(()=>{needBook();$('fileInput').click();});
const toBase64=blob=>new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result.split(',')[1]);r.onerror=reject;r.readAsDataURL(blob);});
function uploadMedia(file,notebookId){return new Promise((resolve,reject)=>{const xhr=new XMLHttpRequest();xhr.open('POST','/api/upload?notebookId='+encodeURIComponent(notebookId)+'&title='+encodeURIComponent(file.name));xhr.setRequestHeader('Content-Type','application/octet-stream');xhr.upload.onprogress=e=>{if(e.lengthComputable)$('uploadStatus').textContent='上传 '+file.name+' · '+Math.round(e.loaded/e.total*100)+'%';};xhr.onerror=()=>reject(Error('上传连接中断，请重试'));xhr.onload=()=>{try{const value=JSON.parse(xhr.responseText);if(xhr.status>=400)reject(Error(value.error));else resolve(value);}catch{reject(Error('上传响应异常，请重试'));}};xhr.send(file);});}
$('fileInput').onchange=()=>run(async()=>{const notebookId=needBook();let success=0;const errors=[];$('importButton').disabled=true;try{for(const f of $('fileInput').files){try{if(/\.(txt|md|srt)$/i.test(f.name)){if(f.size>500000)throw Error('文稿超过 500 KB，请拆分');await api('/api/sources',{notebookId,title:f.name,content:await f.text()});}else{if(f.size>250*1024*1024)throw Error('媒体超过 250 MB，请拆分');await uploadMedia(f,notebookId);}success++;}catch(e){errors.push(f.name+'：'+e.message);}}await refresh();$('uploadStatus').textContent='完成 '+success+' 个'+(errors.length?'；'+errors.join('；'):'');}finally{$('importButton').disabled=false;$('fileInput').value='';}});
async function ask(generate=false){needBook();if(busy)return;if(dirty)throw Error('请先保存笔记，以便回答绑定准确版本');const question=$('question').value.trim();if(!generate&&!question)throw Error('请先输入问题');busy=true;$('send').disabled=$('generate').disabled=true;const id=current;toast(generate?'正在根据资料整理草稿……':'正在结合材料思考……');try{await api(generate?'/api/generate':'/api/chat',{notebookId:id,question,selection});if(id===current&&!generate)$('question').value='';await refresh();}finally{busy=false;$('send').disabled=$('generate').disabled=false;}}
$('send').onclick=()=>run(()=>ask());$('generate').onclick=()=>run(()=>ask(true));
document.querySelectorAll('[data-prompt]').forEach(b=>b.onclick=()=>{$('question').value=b.dataset.prompt;});
$('saveQuestion').onclick=()=>run(async()=>{await api('/api/questions',{notebookId:needBook(),question:$('question').value});await refresh();toast('已加入疑问清单');});
$('settingsButton').onclick=()=>{for(const [k,v]of Object.entries(state.settings))if($('settingsForm').elements[k])$('settingsForm').elements[k].value=v;checkHealth();$('settings').showModal();};
$('closeSettings').onclick=()=>$('settings').close();$('closeSource').onclick=()=>$('sourceDialog').close();
async function saveSettings(){await api('/api/settings',Object.fromEntries(new FormData($('settingsForm'))));await refresh();}
$('settingsForm').onsubmit=e=>{e.preventDefault();run(async()=>{await saveSettings();$('settings').close();toast('设置已保存');});};
$('detectModels').onclick=()=>run(async()=>{await saveSettings();const x=await api('/api/models',{});const ids=(x.data||[]).map(m=>m.id);if(!ids.length)throw Error('服务已连接，但没有加载模型');$('settingsForm').elements.model.value=ids[0];toast('检测到：'+ids.join('、')+'；已填入首个模型，请保存');});
$('closeMedia').onclick=()=>{$('player').pause();$('mediaArea').classList.add('hidden');};
async function loadRevision(r){if(dirty&&!await confirmAction('放弃当前未保存修改？'))return;$('noteEditor').value=r.content;$('noteEditor').readOnly=true;$('noteEditor').classList.add('is-historical');historyView=true;dirty=false;selection='';selectionChanged();$('revisionLabel').textContent='只读 · 历史版本';$('continueEdit').classList.remove('hidden');$('sourceDialog').close();renderNote();}
$('historyButton').onclick=()=>{const revisions=state.revisions.filter(r=>r.notebookId===current).reverse();$('sourceDialogTitle').textContent='笔记历史版本';$('sourceContent').replaceChildren();for(const r of revisions){const c=node('div','segment');c.append(button(new Date(r.createdAt).toLocaleString()+' · 只读预览',async()=>{await loadRevision(r);}));c.append(node('p','',r.content.slice(0,150)));$('sourceContent').append(c);}if(!revisions.length)$('sourceContent').textContent='尚无保存版本';$('sourceDialog').showModal();};
$('continueEdit').onclick=()=>{if(!historyView)return;historyView=false;$('noteEditor').readOnly=false;$('noteEditor').classList.remove('is-historical');$('continueEdit').classList.add('hidden');dirty=true;$('revisionLabel').textContent='有未保存的修改';};
$('deleteBookButton').onclick=()=>run(async()=>{needBook();const b=state.notebooks.find(x=>x.id===current);if(!await confirmAction('删除笔记本「'+b.title+'」？其全部资料、笔记版本、问答、任务与媒体文件都会删除，无法撤销。'))return;await api('/api/notebooks/'+current,'','DELETE');current=null;localStorage.setItem('study.current','');dirty=false;selection='';await refresh(true);toast('已删除笔记本');});
$('exportButton').onclick=()=>run(()=>{needBook();const title=state.notebooks.find(b=>b.id===current).title;const sources=state.sources.filter(s=>s.notebookId===current);const content=`# ${title}\n\n${$('noteEditor').value}\n\n## 资料清单\n${sources.map(s=>`- ${s.title}（ID: ${s.id}）`).join('\n')}\n\n## 疑问\n${state.questions.filter(q=>q.notebookId===current).map(q=>`- [${q.status}] ${q.question}`).join('\n')}\n`;const url=URL.createObjectURL(new Blob([content],{type:'text/markdown;charset=utf-8'}));const a=node('a');a.href=url;a.download=title.replace(/[<>:"/\\|?*]/g,'_')+'.md';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
let ttsAudio=null;
function stopSpeak(){if(ttsAudio){ttsAudio.pause();if(String(ttsAudio.src).startsWith('blob:'))URL.revokeObjectURL(ttsAudio.src);ttsAudio=null;}try{speechSynthesis.cancel();}catch{}}
function stripMarkdown(v){
  let s=String(v??'');
  s=s.replace(/```[a-zA-Z0-9_+-]*\r?\n?/g,'').replace(/```/g,'');
  s=s.replace(/`([^`]*)`/g,'$1');
  s=s.replace(/!\[[^\]]*\]\([^)]*\)/g,'');
  s=s.replace(/\[([^\]]*)\]\([^)]*\)/g,'$1');
  s=s.replace(/^[\t ]*#{1,6}\s*/gm,'');
  s=s.replace(/^[ \t]*(?:-{3,}|\*{3,}|_{3,})[ \t]*$/gm,'');
  s=s.replace(/^[ \t]*[-*+][ \t]/gm,'');
  s=s.replace(/^[ \t]*\d+[.)][ \t]/gm,'');
  s=s.replace(/\*\*|__/g,'');
  s=s.replace(/(^|[^*])\*(?!\s)([^*\n]*[^\s*])?\*([^*])/g,'$1');
  s=s.replace(/_([^_\n]+)_/g,'$1');
  s=s.replace(/^[ \t]*>+[ \t]?/gm,'');
  s=s.replace(/\r?\n{3,}/g,'\n\n');
  return s.replace(/\s+/g,' ').trim();
}
async function speak(value){
  const clean=stripMarkdown(value);
  stopSpeak();
  try{
    const r=await fetch('/api/tts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:clean})});
    if(r.ok){const blob=await r.blob();const url=URL.createObjectURL(blob);ttsAudio=new Audio(url);ttsAudio.onended=()=>{URL.revokeObjectURL(url);ttsAudio=null;};await ttsAudio.play();return;}
  }catch{}
  if(!('speechSynthesis'in window))throw Error('当前浏览器不支持朗读');
  const voice=speechSynthesis.getVoices().find(v=>v.localService&&/^zh/i.test(v.lang));
  if(!voice)throw Error('没有可用的本地中文语音，请在系统中安装中文语音包');
  speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(clean);u.voice=voice;u.lang=voice.lang;speechSynthesis.speak(u);
}
let recorder,stream,chunks=[],holding=false,recordTimer,recordMs=0,recordBusy=false,recordCancelled=false,voiceController,serviceHealth;
async function checkHealth(){try{serviceHealth=await api('/api/health');$('serviceStatus').textContent=serviceHealth.asr.message+' · '+serviceHealth.asr.device;$('voiceHint').textContent=serviceHealth.asr.ready?'本地识别已就绪 · 录音后可编辑文字':'本地识别未就绪，查看模型与语音设置';}catch{$('voiceHint').textContent='服务暂时不可用，请刷新或重启';}}
function showMicHelp(error){let message='无法开始录音。';if(error?.name==='NotAllowedError'||error?.name==='SecurityError')message='麦克风被浏览器或系统阻止。请在当前浏览器的网站权限中将麦克风改为允许，然后刷新。内置浏览器无法找到入口时，可在 Edge / Chrome 打开相同地址并重新授权。网页无法自行撤销永久拒绝。';else if(error?.name==='NotFoundError')message='未找到麦克风，请连接设备后重试。';else if(error?.name==='NotReadableError')message='麦克风不可用，可能正被其他应用独占。';else if(error)message=error.message;$('micHelpText').textContent=message;$('micHelp').showModal();}
async function populateMicDevices(){const sel=$('micSelect');if(!sel)return;let devices=[];try{devices=await navigator.mediaDevices.enumerateDevices();}catch{devices=[];}const prev=sel.value;sel.replaceChildren();const def=node('option','','默认录音设备');def.value='';sel.append(def);let n=0;for(const d of devices.filter(d=>d.kind==='audioinput')){n++;const o=node('option','',d.label||('麦克风 '+n));o.value=d.deviceId;sel.append(o);}if(prev&&[...sel.options].some(o=>o.value===prev))sel.value=prev;}
$('micRefresh').onclick=()=>run(async()=>{try{const t=await navigator.mediaDevices.getUserMedia({audio:true});t.getTracks().forEach(x=>x.stop());await populateMicDevices();toast('已刷新麦克风列表，请重新选择');}catch(e){showMicHelp(e);}});
run(()=>populateMicDevices());
async function recognize(blob){recordBusy=true;voiceController=new AbortController();$('record').disabled=true;$('recordState').textContent='本地识别中…';$('cancelRecording').classList.remove('hidden');const before=$('question').value;const notebook=current;
try{const response=await fetch('/api/transcribe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({base64:await toBase64(blob),mime:blob.type}),signal:voiceController.signal});const x=await response.json();if(!response.ok)throw Error(x.error);if(notebook!==current||$('question').value!==before){pendingVoice=x.text;$('voiceResult').value=x.text;$('voiceResultDialog').showModal();}else $('question').value=x.text;toast('识别完成，检查后发送');}catch(e){if(e.name!=='AbortError')throw e;toast('已取消识别');}finally{recordBusy=false;$('record').disabled=false;$('recordState').textContent='识别后可编辑';$('cancelRecording').classList.add('hidden');}}
async function startRecord(){if(recordBusy||holding)return;needBook();if(state.settings.asrEngine!=='external'&&!serviceHealth?.asr.ready){showMicHelp(Error('本地识别模型尚未就绪，请先完成安装，或在设置中配置外部本地识别接口。'));return;}holding=true;recordCancelled=false;
try{if(!navigator.mediaDevices||!window.MediaRecorder)throw Error('当前浏览器不支持录音，请使用本机 Chrome 或 Edge');const sel=$('micSelect');let constraints={audio:true};if(sel&&sel.value){try{constraints={audio:{deviceId:{exact:sel.value}}};}catch{}}stream=await navigator.mediaDevices.getUserMedia(constraints);if(!holding){stream.getTracks().forEach(t=>t.stop());return;}chunks=[];recorder=new MediaRecorder(stream);recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};recorder.onstop=()=>{stream.getTracks().forEach(t=>t.stop());clearInterval(recordTimer);$('cancelRecording').classList.add('hidden');if(recordCancelled){$('recordState').textContent='录音已取消';return;}run(async()=>{const blob=new Blob(chunks,{type:recorder.mimeType});const secs=Math.max(1,Math.round(recordMs/1000));if(recordMs<400)throw Error('录音太短（'+secs+' 秒），请按住按钮说完后松开');if(blob.size<1000)throw Error('录音 '+secs+' 秒但没有收到有效声音（仅 '+blob.size+' 字节）。请检查系统默认录音设备、麦克风电平或独占占用，也可改用「导入录音提问」');await recognize(blob);});};recorder.start();recordMs=Date.now();$('record').classList.add('recording');$('cancelRecording').classList.remove('hidden');$('recordState').textContent='正在录音…';recordTimer=setInterval(()=>{$('recordState').textContent='正在录音 '+(Math.round((Date.now()-recordMs)/1000))+'s，松开结束';},500);setTimeout(()=>{if(holding)stopRecord();},60000);}catch(e){holding=false;stream?.getTracks().forEach(t=>t.stop());showMicHelp(e);}}
function stopRecord(){holding=false;clearInterval(recordTimer);$('record').classList.remove('recording');if(recorder?.state==='recording')recorder.stop();}
$('record').onpointerdown=e=>{e.preventDefault();$('record').setPointerCapture(e.pointerId);run(startRecord);};$('record').onpointerup=stopRecord;$('record').onpointercancel=()=>{recordCancelled=true;stopRecord();};
$('record').onkeydown=e=>{if(e.code==='Space'&&!e.repeat){e.preventDefault();run(startRecord);}};$('record').onkeyup=e=>{if(e.code==='Space'){e.preventDefault();stopRecord();}};
window.addEventListener('blur',()=>{recordCancelled=true;stopRecord();});
$('cancelRecording').onclick=()=>{recordCancelled=true;holding=false;voiceController?.abort();stopRecord();};
$('micHelpButton').onclick=()=>showMicHelp(Error('如果曾选择“永久不允许”，请从浏览器的网站权限中恢复麦克风。也可在 Edge / Chrome 打开 http://127.0.0.1:8765 并允许录音。也可以使用“导入录音提问”，无需麦克风权限。'));
$('closeMicHelp').onclick=()=>$('micHelp').close();$('checkService').onclick=()=>run(checkHealth);
$('voiceFileButton').onclick=()=>run(()=>{needBook();if(recordBusy)throw Error('请等待当前识别完成');$('voiceFile').click();});
$('voiceFile').onchange=()=>run(async()=>{const f=$('voiceFile').files[0];if(!f)return;try{if(f.size>32*1024*1024)throw Error('提问录音限 32 MB，长录音请到学习资料导入');await recognize(f);}finally{$('voiceFile').value='';}});
let pendingVoice='';$('useVoiceResult').onclick=()=>{ $('question').value=$('voiceResult').value;$('voiceResultDialog').close();};$('closeVoiceResult').onclick=()=>$('voiceResultDialog').close();
window.onbeforeunload=e=>{if(dirty){e.preventDefault();e.returnValue='';}};
run(()=>refresh(true));

function renderJobs(){const jobs=(state.jobs||[]).filter(j=>j.notebookId===current).slice().reverse();$('jobList').replaceChildren();for(const j of jobs){const c=node('div','job-card');const title=state.sources.find(s=>s.id===j.sourceId)?.title||'媒体';const states={queued:'排队中',running:'识别中',completed:'完成',failed:'失败',cancelled:'已取消',interrupted:'已中断'};c.append(node('b','',title),node('p','',states[j.state]+' · '+(j.phase||'')+(j.state==='running'?' '+j.progress+'%':'')));if(j.error)c.append(node('p','hint',j.error));if(['queued','running'].includes(j.state))c.append(button('取消任务',async()=>{await api('/api/jobs/'+j.id+'/cancel',{});await refresh();}));if(['failed','cancelled','interrupted'].includes(j.state))c.append(button('重试',async()=>{await api('/api/jobs/'+j.id+'/retry',{});await refresh();}));if(j.resultSourceId)c.append(button('查看转写',()=>showSource(state.sources.find(s=>s.id===j.resultSourceId))));$('jobList').append(c);}}
let pollBusy=false;setInterval(async()=>{if(pollBusy||!state?.jobs?.some(j=>['queued','running'].includes(j.state)))return;pollBusy=true;try{const next=await api('/api/state');const changed=JSON.stringify(next.jobs.map(j=>[j.id,j.state]))!==JSON.stringify(state.jobs.map(j=>[j.id,j.state]));state=next;if(changed)render(false);else renderJobs();}catch{}finally{pollBusy=false;}},2000);
let correctionSource;
function editSource(source){correctionSource=source;$('correctionTitle').textContent='校对 · '+source.title;$('correctionFields').replaceChildren();if(source.segments?.length){for(const seg of source.segments){const label=node('label','',time(seg.start)+' — '+time(seg.end));const input=node('textarea');input.dataset.segmentId=seg.id;input.value=seg.text;label.append(input);$('correctionFields').append(label);}}else{const input=node('textarea');input.value=source.content;input.id='correctionText';$('correctionFields').append(input);}$('correctionDialog').showModal();}
$('closeCorrection').onclick=()=>$('correctionDialog').close();$('saveCorrection').onclick=()=>run(async()=>{const inputs=[...$('correctionFields').querySelectorAll('textarea')];const value=correctionSource.segments?.length?{segments:inputs.map(i=>({id:i.dataset.segmentId,text:i.value}))}:{content:inputs[0].value};await api('/api/sources/'+correctionSource.id+'/corrections',value);$('correctionDialog').close();await refresh();toast('校对版本已保存，原始识别结果保留');});
let skillList=[];
async function loadSkills(){
  let list=[];
  try{list=await api('/api/skills',undefined,'GET');}catch{list=[];}
  skillList=list;
  const sel=$('skillSelect');
  const prev=sel.value;
  sel.replaceChildren();
  if(!list.length){sel.append(new Option('（还没有 skill，先点「从当前笔记生成」）',''));$('skillState').textContent='';renderSkillMessages();return;}
  for(const s of list)sel.append(new Option(s.title+' · '+(s.steps||0)+' 步',s.name));
  sel.value=(prev&&list.some(s=>s.name===prev))?prev:(list[0]?.name||'');
  renderSkillMessages();
}
function renderSkillMessages(){
  const sel=$('skillSelect'),skill=sel.value,box=$('skillMessages');
  const descEl=$('skillDesc'),d=skill?((skillList.find(s=>s.name===skill)||{}).description||''):'';
  descEl.textContent=d;descEl.classList.toggle('hidden',!d);
  if(!skill){box.replaceChildren(node('div','chat-welcome','选一个实验 skill 开始。\n例如问：「我现在加感受态细胞，下一步做什么？」'));return;}
  const msgs=state.messages.filter(m=>m.type==='skill'&&m.skill===skill);
  box.replaceChildren();
  if(!msgs.length){box.append(node('div','chat-welcome','已选择实验 skill。\n问我你做到哪一步，我告诉你下一步与注意事项。'));return;}
  for(const m of msgs){
    const c=node('article','message '+m.role);
    c.append(node('div','message-label',m.role==='user'?'你':'实验助手'));
    c.append(node('div','message-text',m.text));
    if(m.role==='assistant'){const a=node('div','message-actions');a.append(button('朗读',()=>speak(m.text)),button('停止',stopSpeak));c.append(a);}
    box.append(c);
  }
  box.scrollTop=box.scrollHeight;
}
let skillBusy=false;
async function sendSkill(){
  const skill=$('skillSelect').value;
  if(!skill)throw Error('请先选择一个实验 skill');
  const question=$('skillQuestion').value.trim();
  if(!question)throw Error('请输入问题');
  if(skillBusy)return;
  skillBusy=true;$('skillSend').disabled=true;$('skillState').textContent='正在结合 skill 思考……';
  try{await api('/api/skill-ask',{skill,question});$('skillQuestion').value='';await refresh();}
  finally{skillBusy=false;$('skillSend').disabled=false;$('skillState').textContent='';}
}
$('skillSend').onclick=()=>run(sendSkill);
$('skillQuestion').onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();run(sendSkill);}};
$('skillSelect').onchange=()=>run(renderSkillMessages);
$('genSkill').onclick=()=>run(async()=>{
  needBook();
  if(!state.revisions.some(r=>r.notebookId===current)&&!state.sources.some(s=>s.notebookId===current&&s.kind==='text'))throw Error('请先保存笔记或导入文字资料，再生成 skill');
  $('skillState').textContent='正在根据笔记整理 skill……';
  const x=await api('/api/skills/generate',{notebookId:current});
  $('skillState').textContent='';
  await loadSkills();
  $('skillSelect').value=x.name;
  renderSkillMessages();
  toast('已生成 skill「'+x.title+'」，可继续微调 skills/'+x.name+'.md');
});
checkHealth();
run(()=>loadSkills());
