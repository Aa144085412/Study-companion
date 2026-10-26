const $ = id=>document.getElementById(id);
function confirmAction(message){ return new Promise(resolve=>{ $('confirmText').textContent=message; const d=$('confirmDialog'); d.onclose=()=>resolve(d.returnValue==='yes'); d.showModal(); }); }
let state, current=localStorage.getItem('study.current'), selection='', dirty=false, busy=false, historyView=false, noteView='read', activeResearch=null, researchBusy=false;
const node=(tag,cls,value)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(value!==undefined)e.textContent=value;return e;};
function toast(s){$('toast').textContent=s;$('toast').classList.remove('hidden');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').classList.add('hidden'),6500);}
async function api(url,data,method='POST'){const r=await fetch(url,data===undefined?{}:{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const x=await r.json();if(!r.ok)throw Error(x.error||'请求失败');return x;}
async function run(fn){try{return await fn();}catch(e){toast(e.message);}}
function needBook(){if(!current)throw Error('请先点击左侧 ＋ 创建笔记本');return current;}
const latest=()=>[...state.revisions].reverse().find(r=>r.notebookId===current&&r.kind!=='research-report');
const time=ms=>new Date(ms).toISOString().slice(11,19);
function openImage(url){window.open(url,'_blank');}
function button(label,fn,cls='secondary'){const b=node('button',cls,label);b.onclick=()=>run(fn);return b;}
async function refresh(loadNote=false){state=await api('/api/state');if(!state.notebooks.some(b=>b.id===current))current=state.notebooks[0]?.id;render(loadNote);}
function render(loadNote){
  $('books').replaceChildren(...state.notebooks.map(b=>button('▤  '+b.title,async()=>{if(dirty&&!await confirmAction('当前笔记未保存，仍要切换吗？'))return;current=b.id;activeResearch=null;$('researchStatus').textContent='';localStorage.setItem('study.current',current);dirty=false;selection='';render(true);},b.id===current?'active':'')));
  $('bookTitle').textContent=state.notebooks.find(b=>b.id===current)?.title||'建立你的第一本学习笔记';
  $('deleteBookButton').classList.toggle('hidden',!state.notebooks.length);
  const noBook=state.notebooks.length===0;
  $('emptyBook').classList.toggle('hidden',!noBook);
  $('noteToolbar').classList.toggle('hidden',noBook);
  $('noteEditor').classList.toggle('hidden',noBook);
  $('noteFooter').classList.toggle('hidden',noBook);
  if(loadNote){closeEvidencePanel();historyView=false;$('noteEditor').readOnly=false;$('noteEditor').classList.remove('is-historical');$('noteEditor').value=latest()?.content||'';selection='';selectionChanged();}
  $('revisionLabel').textContent=historyView&&$('noteEditor').readOnly?'只读 · 历史版本':historyView?'已载入历史版本 · 未保存':dirty?'有未保存的修改':latest()?'已保存 · '+new Date(latest().createdAt).toLocaleString():'尚未保存';
  $('continueEdit').classList.toggle('hidden',!(historyView&&$('noteEditor').readOnly));
  const sources=state.sources.filter(s=>s.notebookId===current&&!s.replacedBy),questions=state.questions.filter(q=>q.notebookId===current);
  $('sourceCount').textContent=sources.length||'';$('questionCount').textContent=questions.filter(q=>q.status!=='已理解').length||'';
  $('sourceList').replaceChildren();if(!sources.length)$('sourceList').append(node('div','empty','还没有资料。导入一份讲解文稿，开始建立你的学习空间。'));
  for(const s of sources){const card=node('div','source-card');card.append(node('h3','',s.title),node('p','',s.kind==='media'?'原始媒体 · 可回放':s.segments?.length?`${s.segments.length} 个带时间戳的片段`:'文本资料 · 无时间定位'));if(s.kind==='text')fetch('/api/sources/'+s.id+'/images').then(r=>r.ok?r.json():[]).then(list=>{if(list.length)card.prepend(node('p','source-card-imgs','📷 '+list.length+' 张原图 · 点击查看'));}).catch(()=>{});card.append(button(s.kind==='media'?'播放':'查看原文',()=>showSource(s)));
    if(s.kind==='media')card.append(button('转成文字',async()=>{await api('/api/jobs',{sourceId:s.id});await refresh();toast('已加入本地转写队列');}));
    else {card.append(button('校对文稿',()=>editSource(s)));if(s.previousId)card.append(button('上一版本',()=>showSource(state.sources.find(x=>x.id===s.previousId))));}
    if(s.kind==='media'&&['video/mp4','audio/webm'].includes(s.mime)){
      card.append(button('课件与字幕联合核对',async()=>{await api('/api/visual-review',{sourceId:s.id,visionEnabled:true});await refresh();toast('已开始课件正文与字幕 OCR 核对；无字幕时尝试本地视觉模型（每次最多 8 帧），原转写保留。');}));
      const review=[...(state.agentRuns||[])].reverse().find(r=>r.kind==='visual'&&r.sourceId===s.id);
      if(review)card.append(node('p','hint',review.status==='running'?'字幕核对进行中…':review.result?.summary||review.error||review.status));
    }
    if(s.segments?.length){const sel=node('select');sel.append(new Option('关联原录音 / 视频',''));sources.filter(m=>m.kind==='media').forEach(m=>sel.append(new Option(m.title,m.id)));sel.value=s.mediaId||'';sel.onchange=()=>run(async()=>{if(!sel.value)return;await api('/api/link-media',{sourceId:s.id,mediaId:sel.value});await refresh();toast('已关联，可点击字幕时间回放');});card.append(sel);}card.append(button('删除',async()=>{if(!await confirmAction('删除资料「'+s.title+'」及其相关版本？删除后将移入回收站，可在那里恢复或彻底删除。'))return;await api('/api/sources/'+s.id,'','DELETE');await refresh();toast('已移入回收站');},'danger'));$('sourceList').append(card);
  }
  $('questionList').replaceChildren();if(!questions.length)$('questionList').append(node('div','empty','把问题写在右侧，点击「记下疑问」。不急着一次弄懂。'));
  for(const q of questions){const c=node('div','question-card');c.append(node('p','',q.question));const sel=node('select');['未解决','学习中','已理解'].forEach(s=>sel.append(new Option(s,s)));sel.value=q.status;sel.onchange=()=>run(async()=>{await api('/api/questions/'+q.id,{status:sel.value},'PATCH');await refresh();});c.append(sel);$('questionList').append(c);}
  renderMessages(); renderJobs(); renderTutor(); renderResearchReportView();
  renderNote();
}
function renderMessages(){const messages=(state?.messages||[]).filter(m=>m.notebookId===current&&!m.adoptedRevisionId);if(!messages.length){$('messages').replaceChildren(node('div','chat-welcome','✧\n\n从一个「为什么」开始\n\n选中笔记中的一句话，问问它的原理、目的，或前后联系。'));return;}$('messages').replaceChildren();for(const m of messages){const c=node('article','message '+m.role);c.append(node('div','message-label',m.role==='user'?'你':m.type==='draft'?'研习伴 · 笔记草稿':'研习伴'),node('div','message-text',m.text));if(m.role==='assistant'){const actions=node('div','message-actions');actions.append(button('朗读',()=>speak(m.text)),button('停止',stopSpeak),button('追加到笔记',async()=>{if(!await confirmAction('将这段回答追加到编辑区？检查后点击保存版本。'))return;$('noteEditor').value+='\n\n'+m.text+'\n\n'+(m.citations||[]).map(e=>`来源 [${e.label}]：${e.title}${e.start!==undefined?' '+time(e.start):''}`).join('\n');dirty=true;$('revisionLabel').textContent='有未保存的修改';renderNote();}));c.append(actions);for(const ref of m.citations||[])c.append(button(`[${ref.label}] ${ref.title}${ref.start!==undefined?' · '+time(ref.start):''}`,()=>showReference(ref),'citation'));if(m.truncated)c.append(node('p','hint','本次材料超过上下文预算，仅使用部分内容；请拆分笔记本后再核对。'));}$('messages').append(c);}$('messages').scrollTop=$('messages').scrollHeight;}
function showSource(s){if(s.kind==='media')return play(s.id,0);$('sourceDialogTitle').textContent=s.title;const box=$('sourceContent');box.replaceChildren();if(s.kind==='text'){fetch('/api/sources/'+s.id+'/images').then(r=>r.ok?r.json():[]).then(list=>{if(!list.length)return;const strip=node('div','source-images');strip.append(node('div','source-images-title','来源原图 · '+list.length+' 张，点击放大'));list.forEach(im=>{const img=node('img');img.src=im.url;img.alt=s.title;img.loading='lazy';img.onclick=()=>openImage(im.url);strip.append(img);});box.prepend(strip);}).catch(()=>{});}if(s.segments?.length){for(const seg of s.segments){const e=node('div','segment');e.id='seg-'+seg.id;if(s.mediaId)e.append(button(time(seg.start),()=>{$('sourceDialog').close();play(s.mediaId,seg.start,seg.end);}));else e.append(node('small','',time(seg.start)+' — '+time(seg.end)+'\n'));e.append(node('span','',seg.text));$('sourceContent').append(e);}}else $('sourceContent').textContent=s.content;$('sourceDialog').showModal();}
function resolveReference(ref,sources){
 const source=sources.find(s=>s.id===ref.sourceId);
 const segment=source?.segments?.find(s=>s.id===ref.segmentId);
 const media=sources.find(s=>s.kind==='media'&&s.id===(ref.mediaId||source?.mediaId||(source?.kind==='media'?source.id:null)));
 const valid=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0;
 const start=valid(ref.start)?ref.start:valid(segment?.start)?segment.start:null;
 const end=valid(ref.end)&&ref.end>start?ref.end:valid(segment?.end)&&segment.end>start?segment.end:null;
 return {source,media,start,end,text:ref.text||segment?.text||'',sourceType:ref.sourceType||'UNKNOWN'};
}
// Only coalesce adjacent, bounded clips from the same media; retain every quotation.
function referenceRange(refs,sources){
 const rows=refs.map(r=>resolveReference(r,sources));
 if(!rows.length||rows.some(r=>!r.media||r.start===null||r.end===null))return null;
 if(rows.some(r=>r.media.id!==rows[0].media.id))return null;
 rows.sort((a,b)=>a.start-b.start);let end=rows[0].end;
 for(const r of rows.slice(1)){if(r.start>end+3000)return null;end=Math.max(end,r.end);}
 if(end-rows[0].start>60000)return null;
 return {mediaId:rows[0].media.id,start:rows[0].start,end};
}
function showReferences(refs,index=0,origin=document.activeElement){
 showReference(refs[index]);referenceOrigin=origin;
 if(refs.length<2)return;
 const box=$('evidenceDetails'),list=node('div','evidence-parts');
 list.append(node('h3','','本条笔记的 '+refs.length+' 条证据'),node('p','hint','同一条笔记可能由多个片段共同支持。原始证据逐条保留，未视为重复内容删除。'));
 const range=referenceRange(refs,state.sources);
 if(range)list.append(button('连续回放 '+time(range.start)+' — '+time(range.end),()=>play(range.mediaId,range.start,range.end,true)));
 refs.forEach((ref,i)=>{const r=resolveReference(ref,state.sources);list.append(button((i===index?'正在查看 · ':'')+'['+ref.label+'] '+(r.start!==null?time(r.start):'无时间定位'),()=>showReferences(refs,i,origin)),node('p','evidence-quote',r.text||'未保存原句'));});
 box.append(list);
 if(range&&index===0)play(range.mediaId,range.start,range.end,true);
}
let referenceOrigin=null;
function openEvidencePanel(){
 const area=$('mediaArea');document.querySelector('.workspace').append(area);
 document.querySelector('.workspace').classList.add('evidence-open');area.classList.remove('hidden');
}
function closeEvidencePanel(){
 $('player').pause();$('mediaArea').classList.add('hidden');document.querySelector('.workspace').classList.remove('evidence-open');
 if(referenceOrigin?.isConnected){referenceOrigin.scrollIntoView({block:'center',behavior:'smooth'});referenceOrigin.focus({preventScroll:true});}
 referenceOrigin=null;
}
function showReference(ref){
 const r=resolveReference(ref,state.sources);referenceOrigin=document.activeElement;
 $('player').pause();$('player').classList.toggle('hidden',!r.media||r.start===null);
 openEvidencePanel();$('mediaTitle').textContent='核对来源 · ['+ref.label+'] '+(ref.title||r.source?.title||'来源已缺失');
 const box=$('evidenceDetails');box.replaceChildren();
 const types={ASR_TRANSCRIPT:'语音识别原文（可能有误识）',SUBTITLE_OCR:'字幕识别原文（请对照画面）',SLIDE_DOCUMENT_OCR:'课件 / 文档识别原文',UI_OR_INSTRUMENT_OCR:'界面 / 仪器读数（需结合讲解）',VLM_VISUAL_INFERENCE:'视觉推断（不是已确认事实）',UNKNOWN:'历史引用（证据类型未记录）'};
 box.append(node('p','hint',types[r.sourceType]||types.UNKNOWN),node('blockquote','evidence-quote',r.text||'此历史引用没有保存原句，请打开完整来源核对。'));
 if(r.start!==null)box.append(node('p','',time(r.start)+(r.end!==null?' — '+time(r.end):' · 未记录结束时间')));
 const actions=node('div','evidence-actions');
 if(r.media&&r.start!==null){
  const replay=(context=false)=>play(r.media.id,Math.max(0,r.start-(context?10000:0)),r.end===null?undefined:r.end+(context?10000:0),true);
  actions.append(button('重播引用片段',()=>replay()),button('前后各多看 10 秒',()=>replay(true)));replay();
 }else box.append(node('p','hint',r.media?'没有可靠时间戳，无法定位视频。':'原视频未关联或已移除；不能仅凭识别文本确认真实性。'));
 if(r.source&&r.source.kind!=='media')actions.append(button('完整原文',()=>showSource(r.source)));
 actions.append(button('返回笔记位置',closeEvidencePanel));box.append(actions);
 $('mediaTitle').focus({preventScroll:true});
}
const RESEARCH_REASON_LABELS={UNREVIEWED:'原事实未通过来源审阅',AUDIT_NOT_ACCEPTED:'原审计缺失或未接受该事实',UNRESOLVED_CONFLICT:'原管线仍记录未裁决冲突',RISK_FLAG:'原事实带有未核实或高风险标记',SINGLE_RUN:'单次结果需要人工核对适用范围',INVALID_FACT:'事实字段不完整',NO_QUOTES:'没有可核对的证据原句',MISSING_EVIDENCE:'引用的证据不存在',QUOTE_MISMATCH:'引用未同时匹配原文和清洗文本',UNSUPPORTED_SOURCE:'仅有视觉推断或不明画面证据',LOW_QUALITY_EVIDENCE:'证据为噪声、低可信或缺少原文',INVALID_TIME_RANGE:'时间范围无效'};
function renderResearchReportView(){
 const box=$('researchReport');if(!box)return;
 const currentSources=JSON.stringify(state.sources.filter(s=>s.notebookId===current));
 if(activeResearch?.notebookId===current&&!activeResearch.isHistorical&&activeResearch.sourceSnapshot!==currentSources){activeResearch=null;$('researchStatus').textContent='资料已变化，请重新运行五阶段审计后生成报告。';}
 const result=activeResearch?.notebookId===current&&activeResearch?.template===$('researchTemplate')?.value?activeResearch:null;
 $('researchSave').disabled=!result||researchBusy||!!result?.isHistorical;$('researchExportMarkdown').disabled=!result;$('researchExportJson').disabled=!result;
 if(!result){box.replaceChildren(node('div','empty','选择模板并生成报告。报告只使用当前笔记本中最新的审计产物。'));return;}
 const {report}=result, evidence=new Map(report.evidence_index.map(e=>[e.evidenceId,e]));box.replaceChildren();
 box.append(node('h2','research-title',report.title+' · '+(report.template==='research'?'科研报告':'报告／会议材料')),
  node('p','hint',`原管线 ${report.source_pipeline_id} · 来源要点 ${report.metrics.source_items} 条 · 待核对 ${report.metrics.pending_items} 条 · 外部核验未执行；计数不是准确率。`));
 if(report.provenance.data_kind==='SYNTHETIC_DEVELOPMENT_ONLY')box.append(node('p','hint','合成开发样例：不是实际文献、真实会议或模型效果验收。'));
 for(const section of report.sections){
  const sectionBox=node('section','research-section');sectionBox.append(node('h3','',section.title));
  if(!section.items.length)sectionBox.append(node('p','empty','材料未明确提及或尚未指定栏目，请核对原资料。'));
  for(const item of section.items){
   const card=node('article','research-card');card.append(node('h4','',item.topic||item.fact_id),node('p','',item.statement));
   if(item.conditions?.length)card.append(node('p','hint','来源中的条件：'+item.conditions.join('；')));
   for(const quote of item.evidence_quotes||[]){
    const source=evidence.get(quote.evidence_id);card.append(node('blockquote','evidence-quote',quote.quote));
    if(source)card.append(button(`[${source.label}] ${source.title||source.sourceId||'原始证据'}${source.start!==null?' · '+time(source.start):' · 无时间定位'}`,()=>showReference({label:source.label,title:source.title,sourceId:source.sourceId,segmentId:source.segmentId,mediaId:source.mediaId,start:source.start,end:source.end,text:quote.quote,sourceType:source.sourceType}),'citation'));
   }
   sectionBox.append(card);
  }
  box.append(sectionBox);
 }
 const pending=node('section','research-section');pending.append(node('h3','','争议与待核对'));
 if(!report.pending.length)pending.append(node('p','hint','本次输入未触发新增隔离项；仍需人工核对原资料，不能据此判定无错误。'));
 for(const item of report.pending){
  const card=node('article','research-card pending');card.append(node('h4','',item.topic||item.fact_id),node('p','',item.proposed_statement||'未提供候选陈述'),node('p','hint',(item.reason_codes||[]).map(code=>RESEARCH_REASON_LABELS[code]||code).join('；')));
  for(const quote of item.evidence_quotes||[]){const source=evidence.get(quote.evidence_id);card.append(node('blockquote','evidence-quote',quote.quote));if(source)card.append(button(`[${source.label}] 回看来源${source.start!==null?' · '+time(source.start):''}`,()=>showReference({label:source.label,title:source.title,sourceId:source.sourceId,segmentId:source.segmentId,mediaId:source.mediaId,start:source.start,end:source.end,text:quote.quote,sourceType:source.sourceType}),'citation'));}
  pending.append(card);
 }
 box.append(pending,node('p','hint','会议决议、行动项和文献信息均待人工确认；来源陈述不等于共同决定，未核验元数据不会自动补齐。'));
}
let mediaEnd;
function play(id,start,end,preserveEvidence=false){
 const s=state.sources.find(s=>s.id===id&&s.kind==='media');if(!s)throw Error('原媒体不存在');
 if(!preserveEvidence){referenceOrigin=document.activeElement;$('mediaTitle').textContent=s.title;$('evidenceDetails').replaceChildren();}
 openEvidencePanel();const player=$('player');player.classList.remove('hidden');mediaEnd=end;
 const seek=()=>{player.currentTime=Math.min(Math.max(0,start/1000),Number.isFinite(player.duration)?player.duration:Infinity);player.play().catch(()=>toast('请点击播放器开始播放'));};
 player.onloadedmetadata=seek;player.onerror=()=>toast('原媒体无法读取，请检查本地文件是否存在或格式是否支持');
 const url='/api/media/'+encodeURIComponent(id);if(player.getAttribute('src')===url&&player.readyState>=1)seek();else player.src=url;
 player.ontimeupdate=()=>{if(mediaEnd!==undefined&&player.currentTime>=mediaEnd/1000){player.pause();mediaEnd=undefined;}};
}
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
  if(read&&!noBook){box.innerHTML=content?renderMarkdown(content):'<p class="note-empty">还没有内容。切到「编辑」写第一版，或导入资料后点「从资料整理」。</p>';
    const revision=[...(state?.revisions||[])].reverse().find(r=>r.notebookId===current&&r.kind!=='research-report'&&r.content===content);
    const groups=new Map();
    for(const cite of box.querySelectorAll('sup.cite')){
      const block=cite.closest('li,p,blockquote,h1,h2,h3,h4,h5,h6')||cite.parentElement;
      if(!groups.has(block))groups.set(block,[]);groups.get(block).push(cite);
    }
    for(const cites of groups.values()){
      const refs=[...new Set(cites.map(c=>c.textContent))].map(label=>revision?.citations?.find(r=>r.label===label));
      if(refs.some(r=>!r)){for(const cite of cites)cite.title='当前文本没有完整匹配的来源记录，请勿将该编号视为已核验';continue;}
      const range=referenceRange(refs,state.sources);
      const label='查看依据'+(range?' · '+time(range.start)+'–'+time(range.end):'')+(refs.length>1?' · '+refs.length+' 条':'');
      const b=button(label,()=>showReferences(refs),'note-citation');b.title='展开本条笔记的全部证据与视频';cites[0].replaceWith(b);for(const cite of cites.slice(1))cite.remove();
    }
  }
}
function renderMarkdown(md){
  const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const inline=t=>{let s=esc(t);s=s.replace(/`([^`]+)`/g,'<code>$1</code>');s=s.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');s=s.replace(/(^|[^*\w])\*([^*\n]+)\*(?!\*)/g,'$1<em>$2</em>');s=s.replace(/\[(S\d+)\]/g,'<sup class="cite">$1</sup>');return s;};
  const xhsItem=t=>{const m=t.match(/^S(\d+)\s+(.+?)\s*[（(]\s*([0-9a-f]{24})\s*[）)]\s*$/i);return m?{label:'S'+m[1]+' · '+m[2].trim(),href:'https://www.xiaohongshu.com/explore/'+m[3]}:null;};
  const out=[],para=[];const flush=()=>{if(para.length)out.push('<p>'+inline(para.join(' '))+'</p>');para.length=0;};
  let listType=null;const endList=()=>{if(listType){out.push('</'+listType+'>');listType=null;}};
  for(const line of md.replace(/\r\n/g,'\n').split('\n')){
    const h=line.match(/^(#{1,6})\s+(.*)$/);
    if(h){flush();endList();const l=h[1].length;out.push('<h'+l+'>'+inline(h[2])+'</h'+l+'>');continue;}
    if(/^\s*(---|\*\*\*|___)\s*$/.test(line)){flush();endList();out.push('<hr>');continue;}
    if(/^\s*>\s?/.test(line)){flush();endList();out.push('<blockquote>'+inline(line.replace(/^\s*>\s?/,''))+'</blockquote>');continue;}
    const ul=line.match(/^\s*[-*+]\s+(.*)$/),ol=line.match(/^\s*\d+[.)]\s+(.*)$/);
    if(ul||ol){flush();const want=ul?'ul':'ol';if(listType&&listType!==want)endList();if(listType!==want){out.push('<'+want+'>');listType=want;}const it=(ul||ol)[1],src=xhsItem(it);out.push('<li>'+(src?('<a href="'+src.href+'" target="_blank" rel="noopener">'+esc(src.label)+'</a>'):inline(it))+'</li>');continue;}
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
$('newBookForm').onsubmit=e=>{e.preventDefault();run(async()=>{const title=$('newBookTitle').value.trim();if(!title)return;if(dirty&&!await confirmAction('当前笔记未保存，仍要新建吗？'))return;const b=await api('/api/notebooks',{title});current=b.id;activeResearch=null;$('researchStatus').textContent='';dirty=false;localStorage.setItem('study.current',current);$('newBookDialog').close();await refresh(true);});};
$('cancelNewBook').onclick=()=>$('newBookDialog').close();
$('saveNote').onclick=()=>run(saveNote);
async function saveNote(){needBook();await api('/api/notes',{notebookId:current,content:$('noteEditor').value});dirty=false;historyView=false;await refresh();toast('已保存新版本，历史内容保留');}
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-tab]').forEach(x=>{const on=x===b;x.classList.toggle('active',on);x.setAttribute('aria-selected',on);x.tabIndex=on?0:-1;});document.querySelectorAll('.panel').forEach(x=>x.classList.toggle('hidden',x.id!==b.dataset.tab));if(b.dataset.tab==='research')renderResearchReportView();b.focus();});
$('importButton').onclick=()=>run(()=>{needBook();$('fileInput').click();});
const toBase64=blob=>new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result.split(',')[1]);r.onerror=reject;r.readAsDataURL(blob);});
function uploadMedia(file,notebookId){return new Promise((resolve,reject)=>{const xhr=new XMLHttpRequest();xhr.open('POST','/api/upload?notebookId='+encodeURIComponent(notebookId)+'&title='+encodeURIComponent(file.name));xhr.setRequestHeader('Content-Type','application/octet-stream');xhr.upload.onprogress=e=>{if(e.lengthComputable)$('uploadStatus').textContent='上传 '+file.name+' · '+Math.round(e.loaded/e.total*100)+'%';};xhr.onerror=()=>reject(Error('上传连接中断，请重试'));xhr.onload=()=>{try{const value=JSON.parse(xhr.responseText);if(xhr.status>=400)reject(Error(value.error));else resolve(value);}catch{reject(Error('上传响应异常，请重试'));}};xhr.send(file);});}
$('fileInput').onchange=()=>run(async()=>{const notebookId=needBook();let success=0;const errors=[];$('importButton').disabled=true;try{for(const f of $('fileInput').files){try{if(/\.(txt|md|srt)$/i.test(f.name)){if(f.size>500000)throw Error('文稿超过 500 KB，请拆分');await api('/api/sources',{notebookId,title:f.name,content:await f.text()});}else{if(f.size>250*1024*1024)throw Error('媒体超过 250 MB，请拆分');await uploadMedia(f,notebookId);}success++;}catch(e){errors.push(f.name+'：'+e.message);}}await refresh();$('uploadStatus').textContent='完成 '+success+' 个'+(errors.length?'；'+errors.join('；'):'');}finally{$('importButton').disabled=false;$('fileInput').value='';}});
async function ask(generate=false){needBook();if(busy)return;if(dirty)throw Error('请先保存笔记，以便回答绑定准确版本');const question=$('question').value.trim();if(!generate&&!question)throw Error('请先输入问题');busy=true;$('send').disabled=$('generate').disabled=true;const id=current;toast(generate?'正在根据资料整理草稿……':'正在结合材料思考……');try{if(generate){await api('/api/generate',{notebookId:id,background:true});for(;;){const progress=await api('/api/generate/status?notebookId='+encodeURIComponent(id));if(progress.status==='failed')throw Error(progress.error);if(progress.status==='done')break;if(progress.status==='idle')throw Error('服务已重启，请重新点击整理；已完成分批将复用');$('generate').textContent=`${({evidence_cleaner:'清洗证据',parameter_audit:'核对参数含义',coverage_review:'检查章节遗漏',fact_map:'提取事实',global_reduce:'全局统稿',attribution_audit:'归因审计',fact_rewrite:'纠错重写',scope_check:'适用范围审查',semantic_check:'核对对象、因果与数量',source_relations:'还原来源关系',rendered:'分层渲染'}[progress.stage]||'整理中')} ${progress.completed}/${progress.total}`;await new Promise(resolve=>setTimeout(resolve,2000));}}else await api('/api/chat',{notebookId:id,question,selection});if(id===current&&!generate)$('question').value='';await refresh(generate&&id===current&&!dirty);if(generate)toast(dirty?'新笔记已保存到历史版本；保留当前未保存编辑':'已整理到中间笔记区，原笔记保留在历史版本');}finally{busy=false;$('send').disabled=$('generate').disabled=false;$('generate').textContent='从资料整理';}}
$('send').onclick=()=>run(()=>ask());$('generate').onclick=()=>run(()=>ask(true));
document.querySelectorAll('[data-prompt]').forEach(b=>b.onclick=()=>{$('question').value=b.dataset.prompt;});
$('saveQuestion').onclick=()=>run(async()=>{await api('/api/questions',{notebookId:needBook(),question:$('question').value});await refresh();toast('已加入疑问清单');});
$('settingsButton').onclick=()=>{for(const [k,v]of Object.entries(state.settings))if($('settingsForm').elements[k])$('settingsForm').elements[k].value=v;checkHealth();$('settings').showModal();};
$('closeSettings').onclick=()=>$('settings').close();$('closeSource').onclick=()=>$('sourceDialog').close();
async function saveSettings(){await api('/api/settings',Object.fromEntries(new FormData($('settingsForm'))));await refresh();}
$('settingsForm').onsubmit=e=>{e.preventDefault();run(async()=>{await saveSettings();$('settings').close();toast('设置已保存');});};
$('detectModels').onclick=()=>run(async()=>{await saveSettings();const x=await api('/api/models',{});const ids=(x.data||[]).map(m=>m.id);if(!ids.length)throw Error('服务已连接，但没有加载模型');$('settingsForm').elements.model.value=ids[0];toast('检测到：'+ids.join('、')+'；已填入首个模型，请保存');});
$('closeMedia').onclick=closeEvidencePanel;
async function loadRevision(r){if(dirty&&!await confirmAction('放弃当前未保存修改？'))return;$('noteEditor').value=r.content;$('noteEditor').readOnly=true;$('noteEditor').classList.add('is-historical');historyView=true;dirty=false;selection='';selectionChanged();$('revisionLabel').textContent='只读 · 历史版本';$('continueEdit').classList.remove('hidden');$('sourceDialog').close();renderNote();}
$('historyButton').onclick=()=>{const revisions=state.revisions.filter(r=>r.notebookId===current&&r.kind!=='research-report').reverse();$('sourceDialogTitle').textContent='笔记历史版本';$('sourceContent').replaceChildren();for(const r of revisions){const c=node('div','segment');c.append(button(new Date(r.createdAt).toLocaleString()+' · 只读预览',async()=>{await loadRevision(r);}));c.append(node('p','',r.content.slice(0,150)));$('sourceContent').append(c);}if(!revisions.length)$('sourceContent').textContent='尚无保存版本';$('sourceDialog').showModal();};
$('researchTemplate').onchange=()=>{activeResearch=null;$('researchStatus').textContent='模板已更改，需重新生成。';renderResearchReportView();};
$('researchGenerate').onclick=()=>run(async()=>{
 const notebookId=needBook(),template=$('researchTemplate').value;$('researchGenerate').disabled=true;researchBusy=true;activeResearch=null;$('researchStatus').textContent='正在读取最新审计产物并编排报告…';renderResearchReportView();
 try{const result=await api('/api/research/report?notebookId='+encodeURIComponent(notebookId)+'&template='+encodeURIComponent(template));
  if(notebookId!==current)return;activeResearch={notebookId,template,...result,sourceSnapshot:JSON.stringify(state.sources.filter(s=>s.notebookId===notebookId))};$('researchStatus').textContent='报告已生成。内容来自现有审计结果；请逐条复核来源。';renderResearchReportView();
 }catch(e){$('researchStatus').textContent=e.message+' 可点击“生成／重试报告”重试。';throw e;}
 finally{researchBusy=false;$('researchGenerate').disabled=false;renderResearchReportView();}
});
$('researchSave').onclick=()=>run(async()=>{
 const result=activeResearch;if(!result||result.isHistorical)throw Error('请先生成当前报告');researchBusy=true;renderResearchReportView();
 try{const saved=await api('/api/research/report/save',{notebookId:result.notebookId,template:result.template});await refresh();$('researchStatus').textContent=saved.reused?'该审计产物与模板的报告版本已保存。':'已保存新的科研报告版本，旧版本保留。';toast(saved.reused?'相同报告版本已存在':'科研报告已保存为新版本');}
 finally{researchBusy=false;renderResearchReportView();}
});
function downloadResearch(name,content,mime){const url=URL.createObjectURL(new Blob([content],{type:mime}));const link=node('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('researchExportMarkdown').onclick=()=>run(()=>{if(!activeResearch)throw Error('请先生成报告');downloadResearch((activeResearch.report.title||'科研报告').replace(/[<>:"/\\|?*]/g,'_')+'.md',activeResearch.markdown,'text/markdown;charset=utf-8');});
$('researchExportJson').onclick=()=>run(()=>{if(!activeResearch)throw Error('请先生成报告');downloadResearch((activeResearch.report.title||'科研报告').replace(/[<>:"/\\|?*]/g,'_')+'.json',JSON.stringify(activeResearch.report,null,2),'application/json;charset=utf-8');});
$('researchHistory').onclick=()=>{const revisions=state.revisions.filter(r=>r.notebookId===current&&r.kind==='research-report').reverse();$('sourceDialogTitle').textContent='科研报告历史版本';$('sourceContent').replaceChildren();for(const r of revisions){const row=node('div','segment');row.append(button(new Date(r.createdAt).toLocaleString()+' · '+(r.template==='meeting'?'报告／会议':'科研')+' · 只读查看',()=>{activeResearch={notebookId:current,template:r.template,report:r.researchReport,markdown:r.content,isHistorical:true};$('researchTemplate').value=r.template;$('researchStatus').textContent='当前查看的是已保存的历史版本。';$('sourceDialog').close();renderResearchReportView();}));row.append(node('p','hint','管线 '+r.auditPipelineId+' · 报告 '+r.reportId));$('sourceContent').append(row);}if(!revisions.length)$('sourceContent').textContent='尚无科研报告版本';$('sourceDialog').showModal();};
$('continueEdit').onclick=()=>{if(!historyView)return;historyView=false;$('noteEditor').readOnly=false;$('noteEditor').classList.remove('is-historical');$('continueEdit').classList.add('hidden');dirty=true;$('revisionLabel').textContent='有未保存的修改';};
$('deleteBookButton').onclick=()=>run(async()=>{needBook();const b=state.notebooks.find(x=>x.id===current);if(!await confirmAction('删除笔记本「'+b.title+'」？其全部资料、笔记版本、问答与任务将移入回收站（媒体文件保留），可在那里恢复或彻底删除。'))return;await api('/api/notebooks/'+current,'','DELETE');current=null;localStorage.setItem('study.current','');dirty=false;selection='';await refresh(true);toast('已移入回收站');});
$('exportButton').onclick=()=>run(()=>{needBook();const title=state.notebooks.find(b=>b.id===current).title;const sources=state.sources.filter(s=>s.notebookId===current);const content=`# ${title}\n\n${$('noteEditor').value}\n\n## 资料清单\n${sources.map(s=>`- ${s.title}（ID: ${s.id}）`).join('\n')}\n\n## 疑问\n${state.questions.filter(q=>q.notebookId===current).map(q=>`- [${q.status}] ${q.question}`).join('\n')}\n`;const url=URL.createObjectURL(new Blob([content],{type:'text/markdown;charset=utf-8'}));const a=node('a');a.href=url;a.download=title.replace(/[<>:"/\\|?*]/g,'_')+'.md';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
let ttsAudio=null,ttsSeq=0,ttsCtrl=null;
function stopSpeak(){ttsSeq++;if(ttsCtrl){try{ttsCtrl.abort();}catch{}ttsCtrl=null;}if(ttsAudio){try{ttsAudio.pause();}catch{}if(String(ttsAudio.src).startsWith('blob:'))URL.revokeObjectURL(ttsAudio.src);ttsAudio=null;}try{speechSynthesis.cancel();}catch{}}
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
  const my=ttsSeq;
  try{
    ttsCtrl=new AbortController();
    const r=await fetch('/api/tts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:clean}),signal:ttsCtrl.signal});
    if(ttsCtrl)ttsCtrl=null;
    if(r.ok){
      const blob=await r.blob();
      if(my!==ttsSeq)return;
      const url=URL.createObjectURL(blob);
      ttsAudio=new Audio(url);
      const token=ttsSeq;
      ttsAudio.onended=()=>{if(token===ttsSeq){URL.revokeObjectURL(url);ttsAudio=null;}};
      await ttsAudio.play();
      return;
    }
  }catch(e){
    if(my===ttsSeq)throw e;
    return;
  }
  if(!('speechSynthesis'in window))throw Error('当前浏览器不支持朗读');
  const voice=speechSynthesis.getVoices().find(v=>v.localService&&/^zh/i.test(v.lang));
  if(!voice)throw Error('没有可用的本地中文语音，请在系统中安装中文语音包');
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
let pollBusy=false;setInterval(async()=>{if(pollBusy||!state?.jobs?.some(j=>['queued','running'].includes(j.state)))return;pollBusy=true;try{const next=await api('/api/state');const visualChanged=JSON.stringify((next.agentRuns||[]).filter(r=>r.kind==='visual'))!==JSON.stringify((state.agentRuns||[]).filter(r=>r.kind==='visual'));const changed=visualChanged||JSON.stringify(next.jobs.map(j=>[j.id,j.state]))!==JSON.stringify(state.jobs.map(j=>[j.id,j.state]));state=next;if(changed)render(false);else renderJobs();}catch{}finally{pollBusy=false;}},2000);
let correctionSource;
function editSource(source){correctionSource=source;$('correctionTitle').textContent='校对 · '+source.title;$('correctionFields').replaceChildren();if(source.segments?.length){for(const seg of source.segments){const label=node('label','',time(seg.start)+' — '+time(seg.end));const input=node('textarea');input.dataset.segmentId=seg.id;input.value=seg.text;label.append(input);$('correctionFields').append(label);}}else{const input=node('textarea');input.value=source.content;input.id='correctionText';$('correctionFields').append(input);}$('correctionDialog').showModal();}
$('closeCorrection').onclick=()=>$('correctionDialog').close();$('saveCorrection').onclick=()=>run(async()=>{const inputs=[...$('correctionFields').querySelectorAll('textarea')];const value=correctionSource.segments?.length?{segments:inputs.map(i=>({id:i.dataset.segmentId,text:i.value}))}:{content:inputs[0].value};await api('/api/sources/'+correctionSource.id+'/corrections',value);$('correctionDialog').close();await refresh();toast('校对版本已保存，原始识别结果保留');});
let agentBusy=false;
function setAgentBusy(b){agentBusy=b;$('agentStart').disabled=b;$('agentGoal').disabled=b;$('agentCrawl').disabled=b;$('agentUrl').disabled=b;$('agentSource').disabled=b;$('agentSkillKind').disabled=b;}
function agentLog(line){if(!line)return;const p=node('p','',line);$('agentLog').append(p);$('agentLog').scrollTop=$('agentLog').scrollHeight;}
const AGENT_SRC_LABEL={keyword:'小红书图文',wechat:'微信公众号图文',douyin:'抖音视频','xhs-video':'小红书视频'};
function syncAgentMode(){
  const isUrl=$('agentSource').value!=='keyword';
  $('agentGoal').required=!isUrl;
  $('agentUrl').required=isUrl;
  $('agentGoal').closest('label').classList.toggle('hidden',isUrl);
  $('agentCrawl').closest('label').classList.toggle('hidden',isUrl);
  $('agentUrl').closest('label').classList.toggle('hidden',!isUrl);
}
async function startAgentPipeline(){
  const source=$('agentSource').value;
  if(agentBusy)return;
  let payload;
  if(source==='keyword'){
    const goal=$('agentGoal').value.trim();
    if(!goal)throw Error('请输入实验关键词');
    payload={goal,crawl:$('agentCrawl').checked,skillKind:$('agentSkillKind').value};
  }else{
    const url=$('agentUrl').value.trim();
    if(!/^https?:\/\/.+/i.test(url))throw Error('请粘贴合法的 http(s) 链接');
    payload={source,url,goal:$('agentGoal').value.trim(),skillKind:$('agentSkillKind').value};
  }
  setAgentBusy(true);
  $('agentLog').replaceChildren();
  $('agentReport').classList.add('hidden');$('agentReport').replaceChildren();
  $('agentState').textContent='正在启动 agent 运行…';
  try{
    const endpoint=source==='keyword'?'/api/agent/pipeline':'/api/agent/media';
    const x=await api(endpoint,payload);
    agentLog('已启动 run '+x.runId+'（'+AGENT_SRC_LABEL[source]+(source==='keyword'?(x.mode==='crawl'?' · 重新采集':' · 复用已有采集'):'')+'）');
    agentLog('流程：'+(source==='keyword'?'采集[可选] → OCR → 导入 → 建本 → 笔记 → skill':(source==='wechat'?'抓图文 → 导入 → 建本 → 笔记 → skill':'下载视频 → 音轨转写 + 抽帧 → 导入 → 建本 → 笔记 → skill'))+'，完成后自动回写报告。');
    $('agentState').textContent='运行中…（每 4 秒刷新）';
    const run=await pollAgentRun(x.runId);
    renderAgentReport(run);
    $('agentState').textContent=run.status==='done'?'已完成':'失败';
    toast(run.status==='done'?'agent 运行完成':'agent 运行失败，见报告');
  }finally{setAgentBusy(false);}
}
async function pollAgentRun(runId){
  for(let i=0;i<3600;i++){ // ~2 小时上限
    const list=await api('/api/agent/runs?id='+encodeURIComponent(runId),undefined,'GET');
    const run=Array.isArray(list)?list[0]:list;
    if(run&&(run.status==='done'||run.status==='failed'))return run;
    if(run?.result?.steps)agentLog('进度：'+Object.keys(run.result.steps).filter(k=>k!=='error').join(' → '));
    await new Promise(r=>setTimeout(r,4000));
  }
  throw Error('等待 agent 运行超时，请刷新查看');
}
function renderAgentReport(run){
  const box=$('agentReport');const report=run.result||{};
  const failed=run.status==='failed';
  box.replaceChildren();box.classList.remove('hidden');
  box.append(node('div','agent-report-title '+(failed?'fail':'ok'),failed?'✕ 运行失败':'✓ 运行完成'));
  const steps=report.steps||{};
  const counts=steps.import?.counts||{};
  const note=steps.note||{};
  const skillStep=steps.skill||{};
  const skill=skillStep.skill||{};
  const gaps=skillStep.gaps||[];
  if(report.url)box.append(node('p','agent-src-url',report.url));
  if(report.summary)box.append(node('p','agent-summary',report.summary));
  if(report.error)box.append(node('p','agent-error',report.error));
  const grid=node('div','agent-steps');
  grid.append(node('div','agent-step','来源：'+(report.source?AGENT_SRC_LABEL[report.source]:(report.mode==='crawl'?'重新采集':'复用已有采集'))));
  if(report.source==='wechat'){
    grid.append(node('div','agent-step','正文图片：'+(steps.fetch?.images??'-')+' 张'));
  }else if(report.source==='douyin'||report.source==='xhs-video'){
    grid.append(node('div','agent-step','音轨转写：'+(steps.transcribe?.chars??0)+' 字'));
    grid.append(node('div','agent-step','画面关键帧：'+(steps.download?.frames??0)+' 张'));
  }else{
    grid.append(node('div','agent-step','导入：'+(counts.imported??'-')+' 篇 · 跳过 '+(counts.skipped??'-')));
  }
  grid.append(node('div','agent-step','笔记：'+(note.chars??'-')+' 字'+(note.firstLine?' · '+(note.firstLine.length>18?note.firstLine.slice(0,18)+'…':note.firstLine):'')));
  const kindLabel=skill.kind==='knowledge'?'知识总结':'实验操作';
  grid.append(node('div','agent-step','skill：'+(skill.name?kindLabel+' · '+skill.name+' · '+(skill.steps||0)+' 个编号步骤':'未生成')));
  box.append(grid);
  if(gaps.length){
    box.append(node('h4','agent-gaps-title','待核对清单 · '+gaps.length));
    const ul=node('ul','agent-gaps');
    for(const g of gaps)ul.append(node('li','',(g.where?('【'+g.where+'】'):'')+g.text));
    box.append(ul);
  }
  box.scrollTop=0;
}
$('agentForm').onsubmit=e=>{e.preventDefault();run(startAgentPipeline);};
$('agentSource').onchange=syncAgentMode;
$('agentOpen').onclick=()=>{agentLog('');$('agentReport').classList.add('hidden');$('agentReport').replaceChildren();$('agentState').textContent='';syncAgentMode();$('agentDialog').showModal();};
$('closeAgent').onclick=()=>$('agentDialog').close();
async function loadSkillsLibrary(){
  const list=$('skillLibrary');
  list.replaceChildren(node('p','hint','加载中…'));
  let items=[];
  try{items=await api('/api/skills/list',undefined,'GET');}catch{items=[];}
  list.replaceChildren();
  if(!items.length){list.append(node('p','hint','还没有 skill。用「实验 Agent」整理一个笔记本后，会在这里生成标准 SKILL.md 文件。'));return;}
  const renderCard=(s)=>{
    const active=s.status==='active';
    const card=node('div','skill-card'+(active?' is-active':''));
    const kindLabel=s.kind==='knowledge'?'知识总结':'实验操作';
    const statusLabel=active?'已激活 · skill-queue':'pre-queue · 待激活';
    card.append(node('b','',s.title||s.name));
    card.append(node('span','skill-card-meta','['+kindLabel+'] '+s.name+'.md'+(s.steps?' · '+s.steps+' 个编号步骤':'')+' · '+statusLabel));
    if(s.packagePath)card.append(node('p','hint','可移植目录包：'+s.packagePath));
    if(s.description)card.append(node('p','skill-card-desc',s.description));
    const actions=node('div','skill-card-actions');
    actions.append(button(active?'退回 pre-queue':'调度到 skill-queue（激活）',async()=>{
      const next=active?'pre':'active';
      try{await api('/api/skills/queue',{name:s.name,status:next},'POST');toast(active?('「'+s.name+'」已退回 pre-queue'):('「'+s.name+'」已调度到 skill-queue'));loadSkillsLibrary();}
      catch(e){toast('操作失败：'+e.message);}
    }));
    actions.append(button('在资源管理器中显示',async()=>{try{await api('/api/skills/reveal',{name:s.name});toast('已在资源管理器中定位 '+s.file);}catch(e){toast('打开失败：'+e.message);}}));
    card.append(actions);
    return card;
  };
  const group=(label,desc,arr)=>{
    if(!arr.length)return;
    list.append(node('h3','skill-queue-heading',label));
    list.append(node('p','skill-queue-hint',desc));
    for(const s of arr)list.append(renderCard(s));
  };
  group('skill-queue（已激活）','已调度的 skill，可被任何 agent 加载调用。',items.filter(s=>s.status==='active'));
  group('pre-queue（待激活）','自写 / 生成的 skill 默认在这里。选「调度到 skill-queue」后进入已激活队列。',items.filter(s=>s.status!=='active'));
}
$('skillsOpen').onclick=()=>{loadSkillsLibrary();$('skillsDialog').showModal();};
$('closeSkills').onclick=()=>$('skillsDialog').close();
async function loadTrash(){
  const list=$('trashList');
  list.replaceChildren(node('p','hint','加载中…'));
  let items=[];
  try{items=await api('/api/trash',undefined,'GET');}catch{items=[];}
  list.replaceChildren();
  if(!items.length){list.append(node('p','hint','回收站是空的。删除笔记本或资料后会出现在这里。'));return;}
  for(const t of [...items].reverse()){
    const card=node('div','trash-card');
    const kindLabel=t.kind==='notebook'?'笔记本':'资料';
    card.append(node('b','',t.title||'(未命名)'));
    card.append(node('span','trash-card-meta','['+kindLabel+'] 删除于 '+new Date(t.deletedAt).toLocaleString()));
    const actions=node('div','trash-card-actions');
    actions.append(button('恢复',async()=>{await api('/api/trash/'+t.id+'/restore',{});await refresh();loadTrash();toast('已恢复');}));
    actions.append(button('彻底删除',async()=>{if(!await confirmAction('彻底删除「'+(t.title||'该条目')+'」？媒体文件将被永久清除，无法撤销。'))return;await api('/api/trash/'+t.id+'/purge',{});loadTrash();toast('已彻底删除');},'danger'));
    card.append(actions);
    list.append(card);
  }
}
$('trashOpen').onclick=()=>{loadTrash();$('trashDialog').showModal();};
$('closeTrash').onclick=()=>$('trashDialog').close();
$('backupButton').onclick=()=>{$('backupStatus').textContent='';$('backupDialog').showModal();};
$('closeBackup').onclick=()=>$('backupDialog').close();
$('backupExport').onclick=()=>run(async()=>{const db=await api('/api/state',undefined,'GET');const stamp=new Date().toISOString().replace(/[:]/g,'-').slice(0,16);const url=URL.createObjectURL(new Blob([JSON.stringify(db,null,2)],{type:'application/json'}));const a=node('a');a.href=url;a.download='yanxiuban-backup-'+stamp+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('backupStatus').textContent='已导出 '+a.download;});
$('backupRestorePick').onclick=()=>$('backupFile').click();
$('backupFile').onchange=()=>run(async()=>{const f=$('backupFile').files[0];$('backupFile').value='';if(!f)return;if(!await confirmAction('将用所选备份覆盖当前全部数据？此操作无法撤销。'))return;let payload;try{payload=JSON.parse(await f.text());}catch{throw Error('备份文件不是有效的 JSON');}await api('/api/backup/restore',payload);$('backupDialog').close();await refresh(true);toast('已恢复备份');});
checkHealth();

var tutorBusy=false,quizIndex=0,quizBook=null,quizReview=false;
function renderTutor(){
 if(quizBook!==current){quizBook=current;const pending=state.notebooks.find(b=>b.id===current)?.quizSession?.questions?.filter(q=>q.verification_status==='BLIND_MODEL_AGREEMENT'&&q.pipeline_id===state.notebooks.find(b=>b.id===current)?.auditedPipeline?.id).findIndex(q=>!q.answer);quizIndex=pending>=0?pending:0;quizReview=false;}
 const notebook=state.notebooks.find(b=>b.id===current),session=notebook?.quizSession,all=(session?.questions||[]).filter(q=>q.verification_status==='BLIND_MODEL_AGREEMENT'&&q.pipeline_id===notebook?.auditedPipeline?.id),items=quizReview?all.filter(q=>q.answer&&!q.correct&&q.review_status!=='QUARANTINED'):all;
 quizIndex=Math.max(0,Math.min(quizIndex,items.length-1));
 const answered=all.filter(q=>q.answer&&q.review_status!=='QUARANTINED'),correct=answered.filter(q=>q.correct),q=items[quizIndex],box=$('tutorContent');box.replaceChildren();
 $('quizProgress').textContent=`共 ${all.length} 题 · 已答 ${answered.length} · 答对 ${correct.length} · 待复习 ${answered.length-correct.length}`+(quizReview?' · 错题回顾':'');
 $('quizNumbers').replaceChildren(...items.map((item,i)=>button(String(all.indexOf(item)+1)+(item.answer?(item.correct?' ✓':' ×'):''),()=>{quizIndex=i;renderTutor();},'secondary'+(i===quizIndex?' quiz-active':''))));
 $('tutorNext').disabled=tutorBusy||!notebook?.auditedPipeline||!notebook.auditedPipeline.metrics.core;$('tutorNext').textContent=tutorBusy?'正在生成题组…':all.length?'再生成合格题组':'生成合格题组';
 $('quizReview').textContent=quizReview?'返回全部题目':'错题回顾';
 if(!q){box.append(node('p','hint',quizReview?'目前没有错题。':notebook?.auditedPipeline?'只有通过核心层准入与独立盲测的题目会显示；可生成最多5题。':'请先在共读笔记点击从资料整理，完成五阶段审计。旧题仍保留在历史数据中，但不再作答。'));return;}
 box.append(node('h3','',`第 ${all.indexOf(q)+1} 题 · ${q.topic}`),node('p','',q.content));
 const options=node('div','quiz-options');for(const option of q.options){const b=button(option.id+'. '+option.text,()=>quizAnswer(q.id,option.id),'secondary quiz-option');b.disabled=!!q.answer||tutorBusy||q.review_status==='QUARANTINED';if(q.review_status!=='QUARANTINED'&&q.answer&&option.id===q.correct_answer)b.classList.add('quiz-correct');if(q.review_status!=='QUARANTINED'&&q.answer===option.id&&!q.correct)b.classList.add('quiz-wrong');options.append(b);}box.append(options);
 if(q.answer&&q.review_status!=='QUARANTINED'){box.append(node('p','',q.correct?'✓ 回答正确':'✗ 你的选择：'+q.answer+'；正确答案：'+q.correct_answer),node('p','',q.explanation));box.append(button('查看审计后的事实依据',async()=>{const ref=await api('/api/quiz/reference?notebookId='+encodeURIComponent(current)+'&questionId='+encodeURIComponent(q.id));showReference(ref);},'citation'));box.append(node('p','hint','已通过独立上下文盲测；模型一致性不等于外部科学认证。'));}
 if(q.review_status==='QUARANTINED')box.append(node('p','hint','本题已暂停核对，不计入答对或错题统计。原作答记录保留。'));
 else box.append(button('题目有疑问',()=>run(()=>quizReport(q.id)),'secondary'));
 if(quizIndex<items.length-1)box.append(button('下一题 →',()=>{quizIndex++;renderTutor();},'secondary'));
 $('tutorMastery').textContent='';
}
async function quizReport(questionId){
 if(tutorBusy)return;
 const reason=window.prompt('哪里有疑问？例如条件不足、答案有误、看不懂表述。提交后暂停本题，不影响其他题目。');
 if(reason===null||!reason.trim())return;
 const notebookId=needBook(),session=state.notebooks.find(b=>b.id===notebookId)?.quizSession;
 tutorBusy=true;renderTutor();try{await api('/api/quiz',{notebookId,action:'report',version:session.version,questionId,reason});await refresh();$('tutorStatus').textContent='已记录问题并暂停本题；核对后需重新生成。';}finally{tutorBusy=false;renderTutor();}
}
async function quizAnswer(questionId,answer){
 if(tutorBusy)return;const notebookId=needBook(),session=state.notebooks.find(b=>b.id===notebookId)?.quizSession;
 tutorBusy=true;renderTutor();try{await api('/api/quiz',{notebookId,action:'answer',version:session.version,questionId,answer});await refresh();$('tutorStatus').textContent='作答已保存';}finally{tutorBusy=false;renderTutor();}
}
$('tutorNext').onclick=()=>run(async()=>{
 if(tutorBusy)return;const notebookId=needBook(),session=state.notebooks.find(b=>b.id===notebookId)?.quizSession,oldCount=(session?.questions||[]).filter(q=>q.verification_status==='BLIND_MODEL_AGREEMENT'&&q.pipeline_id===state.notebooks.find(b=>b.id===notebookId)?.auditedPipeline?.id).length;
 tutorBusy=true;renderTutor();$('tutorStatus').textContent='本地模型正在生成 5 道题，请稍候…';
 try{await api('/api/quiz',{notebookId,action:'generate',version:session?.version||0});if(current===notebookId){quizReview=false;quizIndex=oldCount;}await refresh();const result=state.notebooks.find(b=>b.id===notebookId)?.quizSession?.lastGeneration;$('tutorStatus').textContent=`通过 ${result?.accepted||0} 题，拒绝 ${result?.rejected||0} 题。`+(result?.reason||'选择选项即可作答');}catch(e){$('tutorStatus').textContent=e.message;throw e;}finally{tutorBusy=false;renderTutor();}
});
$('quizReview').onclick=()=>{quizReview=!quizReview;quizIndex=0;renderTutor();};
$('tutorRefresh').onclick=()=>run(()=>refresh());

$('auditReport').onclick=()=>run(async()=>{needBook();const a=await api('/api/audit?notebookId='+encodeURIComponent(current));$('sourceDialogTitle').textContent='五阶段审计报告';const box=$('sourceContent');box.replaceChildren(node('p','',`领域：${a.domain} · 核心 ${a.metrics.core} · 情境 ${a.metrics.context} · 待核对 ${a.metrics.unresolved} · 冲突 ${a.metrics.conflicts}`),node('p','hint','独立上下文模型审阅，不等于外部标准认证。原始证据仅保存在调试数据中。'));for(const r of a.audits){const fact=a.facts.find(f=>f.id===r.fact_id);box.append(node('h3','',fact?fact.entity+' · '+fact.property:r.fact_id),node('p','',({CORE:'核心层',CONTEXT:'本课情境',UNRESOLVED:'待核对'}[fact?.layer]||'未分层')+' · '+r.attribution+' · '+r.decision+'：'+r.rationale));}box.append(button('导出完整审计 JSON',()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(a,null,2)],{type:'application/json'}));const link=node('a');link.href=url;link.download='course-audit-'+a.pipeline_id+'.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}));$('sourceDialog').showModal();});
