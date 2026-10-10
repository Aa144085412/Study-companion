"""多源 URL → 导入资料 → 整理笔记 → 生成 skill 驱动（微信图文 / 抖音·小红书视频）。

纯标准库。按 --source 调：
  - wechat     → scripts/fetch_wechat.py   （系统 python，stdlib）
  - douyin / xhs-video → scripts/download_media.py（tools/.venv-dl python，yt-dlp+ffmpeg）
得到产物后，复用服务端 /api/sources、/api/transcribe、/api/generate、/api/agent/skill
完成 导入 → 整理笔记 → 生成 skill。进度 JSON-lines 打到 stdout，报告落盘并可选回写 agentRun。

用法：
  url_pipeline.py --source wechat --url "https://mp.weixin.qq.com/s/XX"
  url_pipeline.py --source douyin --url "https://www.douyin.com/video/XX" [--cookie-file F]
  url_pipeline.py --source xhs-video --url "https://www.xiaohongshu.com/explore/XX" [--cookie-file F]
        [--goal 关键词] [--api http://127.0.0.1:8765] [--app-root PATH]
        [--run-id ID] [--force-skill] [--out report.json]

说明：
- 任何一步失败都 emit error 并以非零退出，报告如实写 failed。
- 视频：音轨经服务端 faster-whisper 转写成文本，画面抽关键帧供视觉 LLM；二者合成一条资料。
- 不做反爬绕过：小红书视频若需登录，用 --cookie-file 提供 cookies.txt，失败如实上报。
"""
import argparse
import base64
import json
import os
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse
from urllib.request import Request, urlopen

SOURCE_LABEL = {'douyin': '抖音实验学习', 'xhs-video': '小红书视频实验学习', 'wechat': '微信实验学习'}
MEDIA_SOURCES = {'douyin', 'xhs-video'}


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


def generate_note(api_base, notebook_id):
    draft = api(api_base, '/api/generate', {'notebookId': notebook_id}, timeout=180)
    text = (draft.get('text') or '').strip()
    if not text:
        return None
    rev = api(api_base, '/api/notes', {'notebookId': notebook_id, 'content': text}, timeout=60)
    return {'revisionId': rev.get('id'), 'chars': len(text),
            'firstLine': text.splitlines()[0].strip()[:120]}


def run_skill(api_base, notebook_id, force):
    payload = {'notebookId': notebook_id}
    if force:
        payload['mode'] = 'force'
    run = api(api_base, '/api/agent/skill', payload, timeout=300)
    r = run.get('result') or {}
    sk = r.get('skill') or {}
    return {'skill': sk, 'reused': r.get('reused', False),
            'gapCount': r.get('gapCount', 0), 'gaps': r.get('gaps', [])}


def transcribe_api(api_base, wav_path):
    b = Path(wav_path).read_bytes()
    if not b:
        return None
    if len(b) > 32 * 1024 * 1024:
        return None
    return api(api_base, '/api/transcribe',
               {'base64': base64.b64encode(b).decode('ascii'), 'mime': 'audio/wav'},
               timeout=600).get('text', '').strip() or None


def main():
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--source', required=True, choices=['douyin', 'xhs-video', 'wechat'])
    ap.add_argument('--url', required=True)
    ap.add_argument('--goal', default='', help='笔记本关键词（默认由标题/域名推导）')
    ap.add_argument('--api', default='http://127.0.0.1:8765')
    ap.add_argument('--app-root', type=Path, default=Path(__file__).resolve().parents[1])
    ap.add_argument('--cookie-file', type=Path, default=None)
    ap.add_argument('--run-id', default='')
    ap.add_argument('--force-skill', action='store_true')
    ap.add_argument('--out', default='')
    ap.add_argument('--frames', type=int, default=8)
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
            ev = run_script(cmd, app_root, log_dir, 'media-download', timeout=1500)
            res = ev.get('result') or {}
            report['steps']['download'] = {'title': res.get('title'), 'duration': res.get('duration'),
                                           'frames': len(res.get('frames', [])), 'dir': res.get('dir'),
                                           'audio': res.get('audio')}
            title0 = title0 or (res.get('title') or urlparse(args.url).netloc)
            emit(event='download-done', title=res.get('title'), frames=len(res.get('frames', [])))
            frames_dir = Path(res['dir']) / 'frames' if res.get('frames') else None
            transcript = transcribe_api(args.api, res.get('audio')) if res.get('audio') else None
            report['steps']['transcribe'] = {'chars': len(transcript or ''), 'ok': bool(transcript)}
            emit(event='transcribe-done', chars=len(transcript or ''))
            dur = res.get('duration')
            content = (
                f'<!-- media {res.get("sid")} url:{args.url} -->\n\n'
                f'来源：{SOURCE_LABEL[args.source]} 视频\n'
                f'标题：{res.get("title") or ""}\n'
                f'作者：{res.get("uploader") or "未知"}\n'
                f'时长：{dur if dur is not None else "未知"} 秒\n'
                f'原文链接：{res.get("webpage_url") or args.url}\n\n'
                f'## {res.get("title") or "视频转写"}\n\n'
                f'{transcript or "（音轨转写为空：可能无有效语音，或需检查识别服务）"}\n\n'
                f'说明：以上为视频音轨的机器转写（faster-whisper），仅供学习核对；数字与实验参数需对照视频画面与正式规程确认。\n\n'
                + (f'图片目录：{frames_dir}\n' if frames_dir else '')
            )
            src_title = slug(title0)[:40] + '（视频转写）.md'

        # 2) 建/找笔记本
        nb_title = SOURCE_LABEL[args.source] + ' · ' + str(title0)[:40]
        nb = find_or_create_notebook(args.api, nb_title)
        report['notebook'] = nb
        emit(event='notebook', title=nb['title'], created=nb['created'])

        # 3) 导入资料（文本源；末行 图片目录 供视觉）
        src = api(args.api, '/api/sources', {'notebookId': nb['id'], 'title': src_title, 'content': content})
        report['steps']['import'] = {'sourceId': src.get('id'), 'chars': len(content)}
        emit(event='import-done', sourceId=src.get('id'))

        # 4) 整理笔记
        report['steps']['note'] = generate_note(args.api, nb['id'])
        emit(event='note-done', revisionId=report['steps']['note'].get('revisionId') if report['steps']['note'] else None)

        # 5) 生成 skill
        report['steps']['skill'] = run_skill(args.api, nb['id'], args.force_skill)
        sk = report['steps']['skill']['skill']
        report['status'] = 'done'
        report['summary'] = (
            f'已就「{title0}」从 {SOURCE_LABEL[args.source]} 跑完：'
            f'{"转写+抽帧" if args.source in MEDIA_SOURCES else "抓图文"} → 导入 → 整理笔记 → '
            f'生成 skill「{sk.get("name")}」（{sk.get("steps", 0)} 步，'
            f'{report["steps"]["skill"]["gapCount"]} 项待核对）。skill 为标准 Agent Skills 格式，任何 agent 可加载指导该实验。'
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
