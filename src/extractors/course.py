"""Adapt the existing persistent ASR queue; never silently skip long audio."""
import json
import time
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from src.schemas import RawMultimodalDocument, TimelineSegment

def from_source(source, title, source_url=None):
    return RawMultimodalDocument(
        source_url=source_url, media_type='video', title=title,
        raw_text=source.get('content') or '',
        segments=[TimelineSegment(start_time=s['start']/1000,
                                  end_time=s['end']/1000, asr_text=s['text'])
                  for s in source.get('segments', [])])

def upload(api_base, notebook_id, audio):
    file = Path(audio)
    size = file.stat().st_size
    if not 0 < size <= 250*1024*1024:
        raise ValueError('音轨必须为 1 字节至 250 MB；请拆分超限媒体后重试')
    url = api_base + '/api/upload?' + urlencode({'notebookId':notebook_id, 'title':file.name})
    with file.open('rb') as stream:
        request = Request(url, data=stream, method='POST', headers={
            'Content-Type':'application/octet-stream', 'Content-Length':str(size)})
        with urlopen(request, timeout=180) as response:
            return json.load(response)

def transcribe(api_base, notebook_id, audio, api, *, uploader=upload,
               timeout=7500, poll_seconds=2, clock=time.monotonic, sleep=time.sleep):
    media = uploader(api_base, notebook_id, audio)
    state = api(api_base, '/api/state')
    existing = next((s for s in reversed(state.get('sources', []))
                     if s.get('notebookId') == notebook_id and s.get('mediaId') == media['id']
                     and s.get('content', '').strip() and not s.get('replacedBy')), None)
    if existing:
        return existing
    job = api(api_base, '/api/jobs', {'sourceId':media['id']})
    deadline = clock() + timeout
    while clock() < deadline:
        state = api(api_base, '/api/state')
        current = next((j for j in state.get('jobs', []) if j['id'] == job['id']), None)
        if current is None:
            raise RuntimeError('转写任务不存在')
        if current['state'] == 'completed':
            result = next((s for s in state.get('sources', [])
                           if s['id'] == current.get('resultSourceId')
                           and s.get('notebookId') == notebook_id), None)
            if not result or not result.get('content', '').strip():
                raise RuntimeError('转写任务完成但缺少有效文字')
            return result
        if current['state'] in ('failed', 'cancelled', 'interrupted'):
            raise RuntimeError('转写未完成：' + (current.get('error') or current['state']))
        sleep(poll_seconds)
    raise TimeoutError('等待转写超时；任务仍保留在学习资料中，请检查任务状态后重试')
