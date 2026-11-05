"""多源 URL → 导入资料 → 整理笔记 → 生成 skill 驱动（微信图文 / 抖音·小红书视频）。

使用 requirements-course.txt 中的协议依赖。按 --source 调：
  - wechat     → scripts/fetch_wechat.py   （系统 python，stdlib）
  - douyin / xhs-video / bilibili → scripts/download_media.py（tools/.venv-dl python，yt-dlp+ffmpeg）
得到产物后，复用服务端 /api/upload、/api/jobs、/api/sources、/api/generate、/api/agent/skill
完成 导入 → 整理笔记 → 生成 skill。进度 JSON-lines 打到 stdout，报告落盘并可选回写 agentRun。

用法：
  url_pipeline.py --source wechat --url "https://mp.weixin.qq.com/s/XX"
  url_pipeline.py --source douyin --url "https://www.douyin.com/video/XX" [--cookie-file F]
  url_pipeline.py --source xhs-video --url "https://www.xiaohongshu.com/explore/XX" [--cookie-file F]
        [--goal 关键词] [--api http://127.0.0.1:8765] [--app-root PATH]
        [--run-id ID] [--force-skill] [--out report.json]

说明：
- 任何一步失败都 emit error 并以非零退出，报告如实写 failed。
- 视频：音轨经服务端 faster-whisper 转写成文本，按转写时间片段执行画面OCR/必要视觉复核，再进入五阶段审计；未完成不能仅凭ASR交付。
- 不做反爬绕过：小红书视频若需登录，用 --cookie-file 提供 cookies.txt，失败如实上报。
"""
import argparse
import json
import os
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from src.extractors.course import transcribe, from_source
from scripts.video_sop import review_video, generate_audited_note
from urllib.parse import urlparse
from urllib.request import Request, urlopen

SOURCE_LABEL = {'douyin': '抖音实验学习', 'xhs-video': '小红书视频实验学习', 'wechat': '微信实验学习', 'bilibili': 'B站课程学习'}
MEDIA_SOURCES = {'douyin', 'xhs-video', 'bilibili'}


def emit(**value):
    print(json.dumps(value, ensure_ascii=False), flush=True)


def now():
    return datetime.now(timezone.utc).isoformat()


def api(base, path, payload=None, timeout=300):
    body = None if payload is None else json.dumps(payload, ensure_ascii=False).encode('utf-8')
    req = Request(base + path, data=body, headers={'Content-Type': 'application/json'})
    with urlopen(req, timeout=timeout) as response:
        return json.load(response)


def slug(s):
    return re.sub(r'[^\w-]+', '_', s) or 'x'


def run_script(cmd, cwd, log_dir, tag, timeout):
    """跑一个 emit JSON-lines 的子脚本，落日志，返回最后一条 complete 事件。"""
    log = log_dir / f'{tag}.log'
    emit(event='spawn', tag=tag, cmd=' '.join(cmd))
    with open(log, 'w', encoding='utf-8') as lf:
        lf.write('CMD: ' + ' '.join(cmd) + '\nCWD: ' + str(cwd) + '\n\n--- stdout ---\n')
        proc = subprocess.run(cmd, cwd=str(cwd), stdout=subprocess.PIPE,
                              stderr=subprocess.STDOUT, text=True, encoding='utf-8',
                              errors='replace', timeout=timeout)
        out = proc.stdout or ''
        lf.write(out)
        lf.write('\n--- exit ' + str(proc.returncode) + ' ---\n')
    events = [json.loads(line) for line in out.splitlines() if line.strip().startswith('{')]
    complete = next((e for e in reversed(events) if e.get('event') in ('complete', 'failed')), None)
    if complete is None:
        raise RuntimeError(f'{tag} 无 complete/failed 事件（退出 {proc.returncode}）: {out[-300:]}')
    if complete.get('event') == 'failed' or not complete.get('ok', False):
        detail = complete.get('detail') or complete.get('log') or f'退出 {proc.returncode}'
        raise RuntimeError(f'{tag} 失败: {str(detail)[:500]}')
    return complete


def find_or_create_notebook(api_base, title):
    state = api(api_base, '/api/state')
    for b in state.get('notebooks', []):
        if b.get('title') == title:
            sources = [s for s in state.get('sources', []) if s.get('notebookId') == b['id']]
            return {'id': b['id'], 'title': b['title'], 'sources': len(sources), 'created': False}
    nb = api(api_base, '/api/notebooks', {'title': title})
    return {'id': nb['id'], 'title': title, 'sources': 0, 'created': True}


def generate_note(api_base, notebook_id, require_visual=False):
    return generate_audited_note(api_base, notebook_id, api, require_visual=require_visual)



def run_skill(api_base, notebook_id, force, kind='experiment'):
    payload = {'notebookId': notebook_id, 'auditedOnly': kind == 'knowledge'}
    if force:
        payload['mode'] = 'force'
    if kind and kind != 'experiment':
        payload['kind'] = kind
    run = api(api_base, '/api/agent/skill', payload, timeout=300)
    r = run.get('result') or {}
    sk = r.get('skill') or {}
    if run.get('status') != 'done' or not sk.get('path') or not sk.get('packagePath'):
        raise RuntimeError('审计知识包未成功保存，不能报告成功')
    return {'skill': sk, 'reused': r.get('reused', False),
            'gapCount': r.get('gapCount', 0), 'gaps': r.get('gaps', [])}



def main():
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--source', required=True, choices=['douyin', 'xhs-video', 'wechat', 'bilibili'])
    ap.add_argument('--url', required=True)
    ap.add_argument('--goal', default='', help='笔记本关键词（默认由标题/域名推导）')
    ap.add_argument('--kind', default='experiment', choices=['experiment', 'knowledge'], help='skill 产出类型：实验操作 / 知识总结')
    ap.add_argument('--api', default='http://127.0.0.1:8765')
    ap.add_argument('--app-root', type=Path, default=Path(__file__).resolve().parents[1])
    ap.add_argument('--cookie-file', type=Path, default=None)
    ap.add_argument('--run-id', default='')
    ap.add_argument('--force-skill', action='store_true')
    ap.add_argument('--out', default='')
    ap.add_argument('--frames', type=int, default=8)
    ap.add_argument('--resume-media', type=Path, help='复用本流程下载结果JSON，校验来源URL及本地文件')
    args = ap.parse_args()

    app_root = args.app_root
    sys_py = sys.executable
    dl_py = app_root / 'tools' / '.venv-dl' / 'Scripts' / 'python.exe'
    log_dir = app_root / 'data' / 'pipeline'
    log_dir.mkdir(parents=True, exist_ok=True)
    report = {'source': args.source, 'url': args.url, 'mode': 'url',
              'startedAt': now(), 'steps': {}, 'status': 'running'}
    emit(event='url-pipeline-start', source=args.source, url=args.url)

    title0 = args.goal
    try:
        if args.source == 'wechat':
            # 1) 抓图文 → markdown + 图
            ev = run_script([sys_py, str(app_root / 'scripts' / 'fetch_wechat.py'),
                             '--url', args.url, '--app-root', str(app_root)],
                            app_root, log_dir, 'wechat-fetch', timeout=600)
            report['steps']['fetch'] = {'title': ev.get('title'), 'author': ev.get('author'),
                                        'images': len(ev.get('images', [])), 'markdown': ev.get('markdown')}
            md_path = Path(ev['markdown'])
            title0 = title0 or (ev.get('title') or urlparse(args.url).netloc)
            emit(event='fetch-done', title=ev.get('title'), images=len(ev.get('images', [])))
            content = md_path.read_text(encoding='utf-8')
            src_title = slug(title0)[:40] + '（微信图文）.md'

        else:
            # 1) 下载视频 → 视频+音轨+帧+info
            cmd = [str(dl_py), str(app_root / 'scripts' / 'download_media.py'),
                   '--url', args.url, '--source', args.source,
                   '--app-root', str(app_root), '--frames', str(args.frames)]
            if args.cookie_file:
                cmd += ['--cookie-file', str(args.cookie_file)]
            if args.resume_media:
                res = json.loads(args.resume_media.read_text(encoding='utf-8'))
                if res.get('url') != args.url or res.get('source') != args.source:
                    raise ValueError('复用下载结果与当前来源URL不匹配')
                if not all(Path(res.get(k) or '').is_file() for k in ('audio', 'video')):
                    raise ValueError('复用下载结果缺少音轨或视频')
            else:
                ev = run_script(cmd, app_root, log_dir, 'media-download', timeout=1500)
                res = ev.get('result') or {}
            (log_dir / 'download-result.json').write_text(json.dumps(res, ensure_ascii=False), encoding='utf-8')
            report['steps']['download'] = {'title': res.get('title'), 'duration': res.get('duration'),
                                           'frames': len(res.get('frames', [])), 'dir': res.get('dir'),
                                           'audio': res.get('audio')}
            title0 = title0 or (res.get('title') or urlparse(args.url).netloc)
            emit(event='download-done', title=res.get('title'), frames=len(res.get('frames', [])))
            frames_dir = Path(res['dir']) / 'frames' if res.get('frames') else None
            if not res.get('audio') or not res.get('video'):
                raise RuntimeError('下载缺少音轨或视频，不能生成课程笔记')
            nb = find_or_create_notebook(args.api, SOURCE_LABEL[args.source] + ' · ' + str(title0)[:40])
            report['notebook'] = nb
            transcript_source = transcribe(args.api, nb['id'], res['video'], api)
            document = from_source(transcript_source, title0, args.url)
            document_path = Path(res['dir']) / 'raw-document.json'
            document_path.write_text(document.model_dump_json(indent=2), encoding='utf-8')
            report['rawDocument'] = str(document_path)
            transcript = transcript_source['content']
            report['steps']['transcribe'] = {'chars': len(transcript or ''), 'ok': bool(transcript)}
            emit(event='transcribe-done', chars=len(transcript or ''))
            if not res.get('video'):
                raise RuntimeError('下载未产出视频，不能跳过画面核对')
            report['steps']['visual'] = review_video(args.api, nb['id'], res['video'], transcript_source, api)
            emit(event='visual-done', frames=report['steps']['visual']['frames'])

        # 2) 建/找笔记本
        nb_title = SOURCE_LABEL[args.source] + ' · ' + str(title0)[:40]
        nb = find_or_create_notebook(args.api, nb_title)
        report['notebook'] = nb
        emit(event='notebook', title=nb['title'], created=nb['created'])

        # Video ASR and timestamped visual sources are imported by their persistent jobs.
        # Do not duplicate them into a plain Markdown ASR source.
        if args.source == 'wechat':
            src = api(args.api, '/api/sources', {'notebookId': nb['id'], 'title': src_title, 'content': content})
            report['steps']['import'] = {'sourceId': src.get('id'), 'chars': len(content)}
        else:
            report['steps']['import'] = {'sourceId': transcript_source['id'], 'visualSourceIds': report['steps']['visual']['sourceIds']}
        emit(event='import-done', sourceId=report['steps']['import']['sourceId'])

        # 4) 整理笔记
        report['steps']['note'] = generate_note(args.api, nb['id'], require_visual=args.source in MEDIA_SOURCES)
        emit(event='note-done', revisionId=report['steps']['note'].get('revisionId') if report['steps']['note'] else None)

        # 5) 生成 skill
        report['steps']['skill'] = run_skill(args.api, nb['id'], args.force_skill, args.kind)
        sk = report['steps']['skill']['skill']
        report['status'] = 'done'
        report['summary'] = (
            f'已就「{title0}」从 {SOURCE_LABEL[args.source]} 跑完：'
            f'{"转写+时间对齐OCR/视觉核对+归因审计" if args.source in MEDIA_SOURCES else "抓图文"} → 导入 → 整理笔记 → '
            f'生成 skill「{sk.get("name")}」（{sk.get("steps", 0)} 步，'
            f'{report["steps"]["skill"]["gapCount"]} 项待核对）。skill 为标准 Agent Skills 格式，任何 agent 可加载学习（待核对项不视为已验证事实）。'
        )
    except Exception as exc:
        report['status'] = 'failed'
        report['error'] = str(exc)
        emit(event='error', error=str(exc))

    report['finishedAt'] = now()
    out_path = Path(args.out) if args.out else log_dir / f'{args.source}-{slug(urlparse(args.url).netloc)}.report.json'
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    emit(event='url-pipeline-report', path=str(out_path), status=report['status'])

    if args.run_id:
        try:
            api(args.api, f'/api/agent/pipeline/{args.run_id}/result', report, timeout=30)
            emit(event='run-updated', runId=args.run_id)
        except Exception as exc:
            emit(event='run-update-failed', runId=args.run_id, error=str(exc))

    return 0 if report['status'] == 'done' else 1


if __name__ == '__main__':
    sys.exit(main())
