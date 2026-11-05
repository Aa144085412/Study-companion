/** Signals for a second look at the original frame. These never promote OCR to a fact. */
export function reviewFrames(evidence) {
  const segments = new Map();
  for (const item of evidence) {
    if (!item.media_id || !item.segment_id) continue;
    const key = JSON.stringify([item.media_id, item.source_id, item.segment_id]);
    if (!segments.has(key)) segments.set(key, []);
    segments.get(key).push(item);
  }
  const result = [];
  for (const items of segments.values()) {
    const frame = items.find(e => e.frame_path && ['SLIDE_DOCUMENT_OCR', 'UNKNOWN_VISUAL_OCR', 'UI_OR_INSTRUMENT_OCR'].includes(e.source_type))
      || items.find(e => e.frame_path);
    if (!frame || !Number.isFinite(frame.start_time)) continue;
    const speech = items.find(e => e.source_type === 'ASR_TRANSCRIPT')?.text || '';
    const subtitle = items.find(e => e.source_type === 'SUBTITLE_OCR')?.text || '';
    const picture = frame.text || '';
    const reasons = [];
    if (/研究原型|尚未实现|未.{0,4}落地|仅供演示|not implemented|research prototype/i.test([picture,speech,subtitle].join(' '))) reasons.push('适用范围');
    // Two labelled series with readings on one chart deserve separate units and denominators.
    const measures = picture.match(/(?:单次|单批|人均|每[条批人次项]|平均|最大|最小|总计|总体|峰值)(?:耗时|时延|时间|成本|数量|用量|延迟)|吞吐量|响应时间|准确率|召回率|throughput|latency|precision|recall/gi) || [];
    if (new Set(measures.map(m=>m.toLowerCase())).size >= 2 && /\d/.test(picture)) reasons.push('指标口径');
    const percentages = text => [...text.matchAll(/\d+(?:\.\d+)?\s*[%％]/g)].map(m => parseFloat(m[0]));
    const spoken = percentages(speech), printed = percentages(subtitle);
    if (spoken.length && printed.length && spoken.some(n => !printed.includes(n))) reasons.push('数字识别分歧');
    if (reasons.length) result.push({frame, reasons, time:(frame.start_time + (frame.end_time ?? frame.start_time))/2});
  }
  return result;
}

export function frameReviewDocument(artifact, review, lines, images) {
  const checkpoints = reviewFrames(artifact.evidence || []);
  if (!review && !checkpoints.length && !artifact.visual_sections?.length) return {status:'automatic', markdown:lines};
  const candidates = new Map(artifact.evidence.map(e => [e.id, e]));
  const seen = new Set();
  const headings = [];
  function figure(id, title, text) {
    const frame = candidates.get(id);
    if (!frame?.frame_path || !Number.isFinite(frame.start_time)) throw Error('复读记录引用无效原帧 '+id);
    seen.add(id);
    const time = (frame.start_time + (frame.end_time ?? frame.start_time))/2;
    let image = images.find(x => x.sourcePath === frame.frame_path);
    if (!image) {
      const label = 'G'+String(images.length+1).padStart(2,'0');
      image = {id:label,relativePath:'images/'+label+'.jpg',sourcePath:frame.frame_path,time,factIds:[]};
      images.push(image);
    }
    const stamp = Math.floor(time/60)+':'+String(Math.floor(time)%60).padStart(2,'0');
    headings.push('### '+title+' · '+stamp,'','!['+image.id+' · '+title+']('+image.relativePath+')','',text,'');
    if (review && image.factIds.length) headings.push('关联条目：'+image.factIds.join('、'),'');
  }
  const start = lines.indexOf('## 阅读摘要');
  if (review) {
    if (review.pipelineId !== artifact.pipeline_id || !review.summary?.trim() || !review.sections?.length) throw Error('复读记录缺少摘要或审计版本不符');
    for (const section of review.sections) {
      if (!section.title?.trim() || !section.reading?.trim() || seen.has(section.frameId)) throw Error('复读章节缺少读图说明或重复引用');
      figure(section.frameId,section.title,section.reading);
    }
    const coveredPaths = new Set([...seen].map(id=>candidates.get(id).frame_path));
    if ((artifact.visual_sections || []).some(scene => !coveredPaths.has(scene.framePath))) throw Error('复读未覆盖章节原帧');
    if (checkpoints.some(c => !seen.has(c.frame.id))) throw Error('复读未覆盖全部关键帧');
    const source = lines.find(line=>line.startsWith('来源：'));
    const sourceIndex = lines.indexOf('## 来源索引');
    const cards = lines.flatMap((line,i) => {
      if (line.startsWith('#### K')) return [line, lines[i+1], ...(lines[i+3]?.startsWith('- 前提')?[lines[i+3]]:[]), ''];
      if (line.startsWith('### U')) {
        const location = lines.slice(i+1,i+7).find(row=>row.startsWith('- 核对位置'));
        return [line.replace('### U','#### U'), '自动审计记录为待核对。'+(location||''),''];
      }
      return [];
    });
    return {status:'reviewed',markdown:[...lines.slice(0,start),'## 阅读摘要',review.summary,'',source,'','请打开每节的原图，并结合下方说明读取图中的对象、连线、数字和限定语。','',...headings,
      '## 审计明细','K 编号保留原审计条目，U 编号供追溯提取时的疑点。正文注明了本次逐图复核的读数与口径。','',
      '<details>','<summary>展开条目和时间引用</summary>','',...cards,'</details>','',...lines.slice(sourceIndex)]};
  }
  for (const {frame,reasons} of checkpoints) figure(frame.id,reasons.join('、'),'请对照原图读取限定语、数值和单位。此处仅标记需要复读的画面。');
  return {status:'needs_review',markdown:[...lines.slice(0,start),'## 待逐图复读的草稿','请逐章读图；检测到的限定、指标和识别分歧会额外列在这里。','',...headings,...lines.slice(start)]};
}
