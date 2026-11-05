"""Mandatory video evidence and audited-note gates shared by URL ingestion."""
import time
from src.extractors.course import upload


def wait_for(read, terminal, *, timeout=14400, poll_seconds=2,
             clock=time.monotonic, sleep=time.sleep):
    deadline = clock() + timeout
    while clock() < deadline:
        value = read()
        if terminal(value):
            return value
        sleep(poll_seconds)
    raise TimeoutError('等待处理超时；已有任务和证据保留，请检查进度后重试')


def review_video(base, notebook_id, video, transcript, api, *, uploader=upload,
                 waiter=wait_for):
    if not transcript.get('segments'):
        raise RuntimeError('转写缺少时间片段，不能跳过画面核对')
    media = uploader(base, notebook_id, video)
    api(base, '/api/link-media', {'sourceId': transcript['id'], 'mediaId': media['id']})
    run = api(base, '/api/visual-review', {'sourceId': media['id'], 'visionEnabled': True})

    def read():
        runs = api(base, '/api/agent/runs?id=' + run['id'])
        current = next((r for r in runs if r['id'] == run['id']), None)
        if not current:
            raise RuntimeError('画面核对任务不存在')
        return current

    result = waiter(read, lambda r: r['status'] != 'running')
    if result['status'] != 'done':
        raise RuntimeError('画面核对失败：' + result.get('error', result['status']))
    report = result.get('result') or {}
    if (report.get('frames') != len(transcript['segments']) or not report.get('sourceIds')
            or not (report.get('subtitleFrames', 0) + report.get('slideTextFrames', 0)
                    + report.get('visionFrames', 0))):
        raise RuntimeError('画面核对缺少完整抽样记录或可用视觉证据，禁止仅按ASR交付')
    return {**report, 'runId': run['id'], 'mediaId': media['id']}


def generate_audited_note(base, notebook_id, api, *, waiter=wait_for, require_visual=False):
    api(base, '/api/generate', {'notebookId': notebook_id, 'background': True}, timeout=30)
    progress = waiter(lambda: api(base, '/api/generate/status?notebookId=' + notebook_id),
                      lambda p: p.get('status') in ('done', 'failed'))
    if progress['status'] != 'done':
        raise RuntimeError('审计笔记生成失败：' + progress.get('error', '未知错误'))
    artifact = api(base, '/api/audit?notebookId=' + notebook_id)
    visual_count = sum(e.get('source_type') in ('SUBTITLE_OCR', 'SLIDE_DOCUMENT_OCR', 'UNKNOWN_VISUAL_OCR', 'UI_OR_INSTRUMENT_OCR', 'VLM_VISUAL_INFERENCE') for e in artifact.get('evidence', []))
    if require_visual and not visual_count:
        raise RuntimeError('审计产物未包含画面证据，禁止仅按ASR交付')
    state = api(base, '/api/state')
    revision = next((r for r in reversed(state.get('revisions', []))
                     if r.get('notebookId') == notebook_id
                     and r.get('auditPipelineId') == artifact.get('pipeline_id')), None)
    if not revision or not revision.get('content', '').strip() or not artifact.get('facts'):
        raise RuntimeError('缺少已保存的审计笔记或有效事实，不能报告成功')
    return {'revisionId': revision['id'], 'auditPipelineId': artifact['pipeline_id'],
            'visualEvidence': visual_count, 'chars': len(revision['content']), 'metrics': artifact.get('metrics', {}),
            'firstLine': revision['content'].splitlines()[0][:120]}
