"""Local MediaCrawler image notes -> existing OCR worker -> Study companion API.

Run from any directory with Python 3.11+. No store.json edits or server startup.
Use --dry-run to inventory; reruns reuse unchanged OCR and existing source markers.
"""
import argparse
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import urlparse

IMAGE_EXTS = {'.png', '.jpg', '.jpeg', '.webp', '.bmp', '.tif', '.tiff'}


def emit(**value):
    print(json.dumps(value, ensure_ascii=False), flush=True)


def api(base, path, payload=None):
    body = None if payload is None else json.dumps(payload, ensure_ascii=False).encode('utf-8')
    req = Request(base + path, data=body, headers={'Content-Type': 'application/json'})
    with urlopen(req, timeout=60) as response:
        return json.load(response)


def inventory(root, keywords):
    records = {}
    for file in sorted((root / 'data/xhs').rglob('*.jsonl')):
        for number, line in enumerate(file.read_text(encoding='utf-8-sig').splitlines(), 1):
            if not line.strip():
                continue
            try:
                item = json.loads(line)
            except ValueError:
                raise ValueError(f'Invalid JSONL: {file}:{number}')
            if item.get('type') != 'normal' or item.get('source_keyword') not in keywords:
                continue
            note_id = str(item.get('note_id', ''))
            if not re.fullmatch(r'[a-zA-Z0-9_-]+', note_id):
                continue
            directory = root / 'data/xhs/media' / note_id
            images = sorted(p for p in directory.glob('*') if p.is_file() and p.suffix.lower() in IMAGE_EXTS and p.stat().st_size)
            urls = item.get('image_list', '')
            expected = len(set(filter(None, urls.split(',')))) if isinstance(urls, str) else len(urls)
            if len(images) < expected:
                emit(event='incomplete', noteId=note_id, expected=expected, downloaded=len(images))
                continue
            if images:
                records[(item['source_keyword'], note_id)] = (item, directory, images)
    return list(records.values())


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--app-root', type=Path, default=Path(__file__).resolve().parents[1])
    ap.add_argument('--crawler-root', type=Path, default=Path.home() / 'Desktop/MediaCrawler')
    ap.add_argument('--api', default='http://127.0.0.1:8765')
    ap.add_argument('--keywords', default='大肠杆菌转化,菌种活化,PCR 实验')
    ap.add_argument('--limit', type=int, default=0, help='0 imports all available notes')
    ap.add_argument('--dry-run', action='store_true')
    args = ap.parse_args()
    if urlparse(args.api).hostname not in ('127.0.0.1', 'localhost', '::1'):
        ap.error('--api must be a local server')
    keywords = args.keywords.split(',')
    records = inventory(args.crawler_root, keywords)
    counts = {k: sum(r[0]['source_keyword'] == k for r in records) for k in keywords}
    emit(event='inventory', counts=counts, imageNotes=len(records))
    if args.dry_run:
        return
    if not records:
        raise RuntimeError('No image notes with nonempty downloaded images; finish crawling first.')
    state = api(args.api, '/api/state')
    books = {b['title']: b for b in state['notebooks']}
    sources = state['sources']
    out_dir = args.crawler_root / 'data/xhs/markdown'
    out_dir.mkdir(parents=True, exist_ok=True)
    imported = skipped = failed = 0
    for item, directory, images in (records[:args.limit] if args.limit > 0 else records):
        note_id = item['note_id']
        try:
            digest = hashlib.sha256()
            for image in images:
                digest.update(image.name.encode())
                digest.update(image.read_bytes())
            fingerprint = digest.hexdigest()
            marker = f'<!-- xhs-note:{note_id} images:{fingerprint} -->'
            book_title = '小红书实验学习 · ' + item['source_keyword']
            book = books.get(book_title)
            if book and any(s.get('notebookId') == book['id'] and marker in s.get('content', '') for s in sources):
                skipped += 1
                emit(event='skip', noteId=note_id, reason='already imported')
                continue
            ocr_file = out_dir / f'{note_id}.{fingerprint[:12]}.ocr.md'
            if not ocr_file.exists():
                command = [str(args.app_root / '.venv-ocr/Scripts/python.exe'), str(args.app_root / 'ocr_worker.py'), str(directory), '--title', item.get('title', note_id)]
                emit(event='ocr-start', noteId=note_id, images=len(images))
                result = subprocess.run(command, capture_output=True, text=True, encoding='utf-8', errors='replace', timeout=600)
                if result.returncode:
                    raise RuntimeError(f'OCR exited {result.returncode}: {result.stdout[-600:]} {result.stderr[-300:]}')
                events = [json.loads(line) for line in result.stdout.splitlines() if line.startswith('{')]
                if not any(e.get('event') == 'progress' and e.get('chars', 0) > 0 for e in events):
                    raise RuntimeError('OCR did not recognize any text; inspect images manually.')
                final = next(e for e in events if e.get('event') == 'result')
                ocr_file.write_text(final['text'], encoding='utf-8')
            content = (f'{marker}\n\n来源：小红书，内容 ID：{note_id}\n'
                       f'原帖：https://www.xiaohongshu.com/explore/{note_id}\n'
                       f'关键词：{item["source_keyword"]}\n'
                       f'图片目录：{directory}\n\n'
                       '说明：以下为用户图文与机器 OCR，仅供学习核对。数字、单位及实验参数需对照原图和正式规程确认。\n\n'
                       f'## 原帖正文\n{item.get("desc", "")}\n\n## 图片识别\n'
                       + ocr_file.read_text(encoding='utf-8'))
            if len(content.encode('utf-16-le')) // 2 > 200000:
                raise RuntimeError('Text exceeds API limit; split it before importing.')
            output = out_dir / f'{note_id}.md'
            output.write_text(content, encoding='utf-8')
            if not book:
                book = api(args.api, '/api/notebooks', {'title': book_title})
                books[book_title] = book
            title = str(item.get('title') or note_id)[:140] + f' [{note_id}].md'
            source = api(args.api, '/api/sources', {'notebookId': book['id'], 'title': title, 'kind': 'text', 'content': content})
            sources.append(source)
            imported += 1
            emit(event='imported', noteId=note_id, notebookId=book['id'], sourceId=source['id'], markdown=str(output))
        except Exception as exc:
            failed += 1
            emit(event='error', noteId=note_id, error=str(exc))
    emit(event='complete', imported=imported, skipped=skipped, failed=failed, counts=counts)
    if failed:
        sys.exit(1)


if __name__ == '__main__':
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    main()
