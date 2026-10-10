"""资料→skill 前半段 pipeline 驱动：goal → [crawl] → import(OCR) → note → skill → report。

纯标准库（无新依赖）。复用 scripts/import_xhs.py（OCR 缓存 + 导入 + 建笔记本）作为子进程，
不重写采集/导入逻辑。进度以 JSON-lines 打到 stdout，最终报告以 JSON 写文件并可选回写服务端。

用法：
  experiment_pipeline.py --goal "酵母转化" [--crawl] [--force-skill]
        [--api http://127.0.0.1:8765] [--app-root PATH] [--crawler-root PATH]
        [--run-id ID] [--out report.json] [--crawl-timeout 900] [--skip-crawl]

说明：
- 默认 **复用已有采集**（不启动浏览器）：只处理 crawler-root/data/xhs 里已存在的该关键词图文。
- --crawl 才真正启动 MediaCrawler（需用户已开启远程调试(9222)且已登录小红书的 Edge，免扫码）。
- 每一步都会把状态 emit 成 JSON 行；任何一步失败会 emit error 并以非零退出，报告里如实写 failed 步。
"""
import argparse
import json
import os
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen


def emit(**value):
    print(json.dumps(value, ensure_ascii=False), flush=True)


def now():
    return datetime.now(timezone.utc).isoformat()


def api(base, path, payload=None, timeout=90):
    body = None if payload is None else json.dumps(payload, ensure_ascii=False).encode('utf-8')
    req = Request(base + path, data=body, headers={'Content-Type': 'application/json'})
    with urlopen(req, timeout=timeout) as response:
        return json.load(response)


def safe_name(goal):
    return goal.strip()


def slug(goal):
    return re.sub(r'[^\w-]+', '_', goal)


def run_crawl(crawler_root, mc_python, goal, log_dir, timeout):
    """启动 MediaCrawler 采集该关键词。返回 (ok, detail)。不静默绕过风控——失败如实上报。"""
    env = dict(os.environ)
    env['PLAYWRIGHT_BROWSERS_PATH'] = str(crawler_root / '.pw-browsers')
    log = log_dir / f'crawl-{slug(goal)}.log'
    cmd = [str(mc_python), 'main.py', '--type', 'search', '--keywords', goal]
    emit(event='crawl-start', cmd=' '.join(cmd), note='需要 9222 上已登录小红书的 Edge')
    try:
        with open(log, 'w', encoding='utf-8') as lf:
            lf.write('CMD: ' + ' '.join(cmd) + '\nCWD: ' + str(crawler_root) + '\n\n--- stdout ---\n')
            proc = subprocess.run(
                cmd, cwd=str(crawler_root), env=env,
                stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                text=True, encoding='utf-8', errors='replace', timeout=timeout,
            )
            lf.write(proc.stdout or '')
            lf.write('\n--- exit ' + str(proc.returncode) + ' ---\n')
        if proc.returncode == 0:
            return True, f'crawl ok (log: {log})'
        tail = (proc.stdout or '')[-600:]
        return False, f'crawl exited {proc.returncode}: {tail}'
    except subprocess.TimeoutExpired:
        return False, f'crawl timeout after {timeout}s (log: {log})'
    except Exception as exc:
        return False, f'crawl failed: {exc}'


def run_import(app_root, ocr_python, api_base, crawler_root, goal, log_dir):
    """复用 import_xhs.py：OCR(缓存) + 导入 + 建笔记本。返回 (counts, log)。"""
    log = log_dir / f'import-{slug(goal)}.log'
    cmd = [
        str(ocr_python), str(app_root / 'scripts' / 'import_xhs.py'),
        '--app-root', str(app_root), '--crawler-root', str(crawler_root),
        '--api', api_base, '--keywords', goal,
    ]
    emit(event='import-start', cmd=' '.join(cmd))
    with open(log, 'w', encoding='utf-8') as lf:
        lf.write('CMD: ' + ' '.join(cmd) + '\n\n--- stdout ---\n')
        proc = subprocess.run(
            cmd, cwd=str(app_root),
            stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
            text=True, encoding='utf-8', errors='replace', timeout=1800,
        )
        out = proc.stdout or ''
        lf.write(out)
        lf.write('\n--- exit ' + str(proc.returncode) + ' ---\n')
    # import_xhs.py 每行 emit 一个 JSON 事件；解析最后一条 complete
    events = [json.loads(line) for line in out.splitlines() if line.strip().startswith('{')]
    complete = next((e for e in reversed(events) if e.get('event') == 'complete'), None)
    if proc.returncode != 0:
        tail = out[-600:]
        raise RuntimeError(f'import exited {proc.returncode}: {tail}')
    if complete is None:
        raise RuntimeError('import produced no complete event: ' + out[-300:])
    return complete, log


def find_notebook(api_base, goal):
    state = api(api_base, '/api/state')
    title = '小红书实验学习 · ' + goal
    for b in state.get('notebooks', []):
        if b.get('title') == title:
            sources = [s for s in state.get('sources', []) if s.get('notebookId') == b['id']]
            return {'id': b['id'], 'title': b['title'], 'sources': len(sources)}
    return None


def generate_note(api_base, notebook_id):
    """用 /api/generate 从资料整理聚焦笔记，再用 /api/notes 持久化为当前版本。"""
    draft = api(api_base, '/api/generate', {'notebookId': notebook_id})
    text = (draft.get('text') or '').strip()
    if not text:
        return None
    rev = api(api_base, '/api/notes', {'notebookId': notebook_id, 'content': text})
    return {'revisionId': rev.get('id'), 'chars': len(text), 'firstLine': text.splitlines()[0].strip()[:120]}


def run_skill(api_base, notebook_id, force):
    payload = {'notebookId': notebook_id}
    if force:
        payload['mode'] = 'force'
    run = api(api_base, '/api/agent/skill', payload)
    r = run.get('result') or {}
    sk = r.get('skill') or {}
    return {
        'skill': sk,
        'reused': r.get('reused', False),
        'gapCount': r.get('gapCount', 0),
        'gaps': r.get('gaps', []),
    }


def main():
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--goal', required=True, help='实验关键词（= 小红书搜索词 / 笔记本后缀）')
    ap.add_argument('--api', default='http://127.0.0.1:8765')
    ap.add_argument('--app-root', type=Path, default=Path(__file__).resolve().parents[1])
    ap.add_argument('--crawler-root', type=Path, default=Path.home() / 'Desktop' / 'MediaCrawler')
    ap.add_argument('--crawl', action='store_true', help='真正启动 MediaCrawler 采集（默认复用已有数据）')
    ap.add_argument('--force-skill', action='store_true', help='强制重新生成 skill（不幂等复用）')
    ap.add_argument('--run-id', default='', help='若设置，完成后回写该 agentRun')
    ap.add_argument('--out', default='', help='报告 JSON 落盘路径（默认 data/pipeline/<goal>.json）')
    ap.add_argument('--crawl-timeout', type=int, default=900)
    args = ap.parse_args()
    goal = safe_name(args.goal)
    if not goal:
        emit(event='error', error='goal 为空'); return 2
    ocr_python = args.app_root / '.venv-ocr' / 'Scripts' / 'python.exe'
    mc_python = args.crawler_root / '.venv-mc' / 'Scripts' / 'python.exe'
    log_dir = args.app_root / 'data' / 'pipeline'
    log_dir.mkdir(parents=True, exist_ok=True)

    report = {
        'goal': goal,
        'mode': 'crawl' if args.crawl else 'reuse',
        'startedAt': now(),
        'steps': {},
        'status': 'running',
    }
    emit(event='pipeline-start', goal=goal, mode=report['mode'])

    try:
        # 1) 采集（可选）
        if args.crawl:
            ok, detail = run_crawl(args.crawler_root, mc_python, goal, log_dir, args.crawl_timeout)
            report['steps']['crawl'] = {'ran': True, 'ok': ok, 'detail': detail}
            emit(event='crawl-done', ok=ok, detail=detail)
            if not ok:
                raise RuntimeError('crawl 未成功，停止后续步骤：' + detail)

        # 2) 导入（OCR 缓存 + 建笔记本）
        counts, import_log = run_import(args.app_root, ocr_python, args.api, args.crawler_root, goal, log_dir)
        report['steps']['import'] = {'counts': counts, 'log': str(import_log)}
        counts.pop('event', None)
        emit(event='import-done', **counts)

        # 3) 定位笔记本
        nb = find_notebook(args.api, goal)
        if not nb:
            raise RuntimeError(f'未找到笔记本「{("小红书实验学习 · " + goal)}」；请确认该关键词已有图文并导入成功')
        report['notebook'] = nb
        emit(event='notebook', **nb)
        if nb['sources'] == 0:
            raise RuntimeError('笔记本存在但没有文字资料（图片未下载完整或导入失败），无法生成笔记/skill')

        # 4) 整理笔记（/api/generate → /api/notes 持久化）
        report['steps']['note'] = generate_note(args.api, nb['id'])
        emit(event='note-done', revisionId=report['steps']['note'].get('revisionId') if report['steps']['note'] else None)

        # 5) 生成 skill（T20）
        report['steps']['skill'] = run_skill(args.api, nb['id'], args.force_skill)
        emit(event='skill-done', name=report['steps']['skill']['skill'].get('name'),
             steps=report['steps']['skill']['skill'].get('steps'), gapCount=report['steps']['skill']['gapCount'])

        sk = report['steps']['skill']['skill']
        report['status'] = 'done'
        report['summary'] = (
            f'已就「{goal}」跑完 前半段：采集[{report["mode"]}] → 导入 {counts.get("imported", 0)} 篇'
            f'（跳过 {counts.get("skipped", 0)}）→ 整理笔记 → 生成 skill「{sk.get("name")}」'
            f'（{sk.get("steps", 0)} 步，{report["steps"]["skill"]["gapCount"]} 项待核对）。'
            f'skill 为标准 Agent Skills 格式，任何 agent 可加载 {os.path.basename(sk.get("path", ""))} 指导该实验。'
        )
    except Exception as exc:
        report['status'] = 'failed'
        report['error'] = str(exc)
        emit(event='error', error=str(exc))

    report['finishedAt'] = now()
    out_path = Path(args.out) if args.out else log_dir / f'{slug(goal)}.report.json'
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    emit(event='pipeline-report', path=str(out_path), status=report['status'])

    # 回写服务端 agentRun（若指定）
    if args.run_id:
        try:
            api(args.api, f'/api/agent/pipeline/{args.run_id}/result', report, timeout=30)
            emit(event='run-updated', runId=args.run_id)
        except Exception as exc:
            emit(event='run-update-failed', runId=args.run_id, error=str(exc))

    return 0 if report['status'] == 'done' else 1


if __name__ == '__main__':
    sys.exit(main())
