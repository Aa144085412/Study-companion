"""研习伴 agent 工具循环驱动：调服务端 /api/tools/loop（LLM 函数调用编排
download_media → transcribe → import_to_notebook → make_skill），拿回结果，
组装报告并回写 agentRun。

纯标准库。服务端负责真正的工具执行与 store 写入（在同一进程内同步完成），
本驱动只做：发起 loop → 组装 report → 回写 /api/agent/pipeline/<runId>/result。

用法：
  tools_pipeline.py --api http://127.0.0.1:8765 --run-id ID
                    [--source douyin] [--url "https://..."] [--goal 关键词]
                    [--cookie-file F] [--out report.json]

说明：
- 任何一步失败都 emit error 并以非零退出，报告如实写 failed（不做兜底）。
- 报告含 toolLog（各工具步 ok/error）、transcriptLen、notebook（共读笔记 id/标题）、skill。
"""
import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse
import re
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError


def emit(**value):
    print(json.dumps(value, ensure_ascii=False), flush=True)


def now():
    return datetime.now(timezone.utc).isoformat()


def slug(s):
    return re.sub(r'[^\w-]+', '_', s) or 'x'


def api(base, path, payload=None, timeout=1800):
    body = None if payload is None else json.dumps(payload, ensure_ascii=False).encode('utf-8')
    req = Request(base + path, data=body, headers={'Content-Type': 'application/json'})
    with urlopen(req, timeout=timeout) as response:
        return json.load(response)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--api', required=True)
    ap.add_argument('--run-id', default='')
    ap.add_argument('--source', default='')
    ap.add_argument('--url', default='')
    ap.add_argument('--goal', default='')
    ap.add_argument('--cookie-file', default='')
    ap.add_argument('--out', default='')
    args = ap.parse_args()

    started = now()
    loop_payload = {}
    if args.source:
        loop_payload['source'] = args.source
    if args.url:
        loop_payload['url'] = args.url
    if args.goal:
        loop_payload['goal'] = args.goal

    report = {
        'source': args.source, 'url': args.url, 'goal': args.goal,
        'mode': 'tools', 'startedAt': started, 'status': 'running',
    }

    out_path = None
    try:
        emit(event='loop-start', source=args.source, url=args.url)
        result = api(args.api, '/api/tools/loop', loop_payload, timeout=1800)
        emit(event='loop-done', status=result.get('status'))
        report['finalText'] = result.get('finalText', '')
        report['toolLog'] = result.get('toolLog', [])
        report['transcriptLen'] = result.get('transcriptLen', 0)
        report['notebookTitle'] = result.get('notebookTitle')
        if result.get('notebookId'):
            report['notebook'] = {'id': result['notebookId'], 'title': result.get('notebookTitle')}
        report['skill'] = result.get('skill')
        report['status'] = 'done'
        tool_names = ' → '.join([t.get('tool') for t in report.get('toolLog', [])]) or '（无）'
        report['summary'] = (
            'agent 工具循环完成：%s。共读笔记%s，skill「%s」。%s。'
            % (
                tool_names,
                ('「%s」' % result.get('notebookTitle')) if result.get('notebookTitle') else '未落',
                (report.get('skill') or {}).get('name', '未生成'),
                report.get('finalText', '')[:200],
            )
        )
    except (HTTPError, URLError, json.JSONDecodeError, OSError, ValueError) as exc:
        report['status'] = 'failed'
        report['error'] = str(exc)
        emit(event='error', error=str(exc))

    report['finishedAt'] = now()
    if args.out:
        out_path = Path(args.out)
    else:
        ident = slug(urlparse(args.url).netloc) if args.url else slug(args.source or 'run')
        out_path = Path('data') / 'media-inbox' / f'tools-{ident}.report.json'
        out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    emit(event='tools-report', path=str(out_path), status=report['status'])

    if args.run_id:
        try:
            api(args.api, f'/api/agent/pipeline/{args.run_id}/result', report, timeout=30)
            emit(event='run-updated', runId=args.run_id)
        except Exception as exc:
            emit(event='run-update-failed', runId=args.run_id, error=str(exc))

    return 0 if report['status'] == 'done' else 1


if __name__ == '__main__':
    raise SystemExit(main())
