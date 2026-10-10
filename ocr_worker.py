"""OCR worker: read a folder of images (in natural filename order), emit one markdown file.

JSON-lines stdout protocol (only stdout is the protocol):
  {'event': 'loading', 'images': N}
  {'event': 'progress', 'image': i, 'total': N, 'chars': c}
  {'event': 'result', 'text': md, 'images': N, 'out': path_or_null}
  {'event': 'error', 'error': str}

Usage: ocr_worker.py <image_dir> [--out <file.md>] [--label "图"] [--title "标题"]
"""
import argparse
import json
import re
import sys
from pathlib import Path

IMG_EXTS = {'.jpg', '.jpeg', '.png', '.webp', '.bmp'}


def emit(value):
    print(json.dumps(value, ensure_ascii=False), flush=True)


def natural_key(p: Path):
    m = re.findall(r'\d+', p.name)
    return (int(m[0]) if m else 0, p.name.lower())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('image_dir')
    ap.add_argument('--out', default='')
    ap.add_argument('--label', default='图')
    ap.add_argument('--title', default='')
    args = ap.parse_args()

    d = Path(args.image_dir)
    if not d.is_dir():
        raise RuntimeError(f'目录不存在：{d}')
    files = sorted(
        [f for f in d.iterdir() if f.is_file() and f.suffix.lower() in IMG_EXTS],
        key=natural_key,
    )
    if not files:
        raise RuntimeError(f'目录里没有图片（支持 {sorted(IMG_EXTS)}）')

    emit({'event': 'loading', 'images': len(files)})
    from rapidocr_onnxruntime import RapidOCR
    ocr = RapidOCR()

    parts = []
    if args.title:
        parts.append(f'# {args.title}')
    for i, f in enumerate(files, 1):
        result, _elapse = ocr(str(f))
        lines = []
        for item in (result or []):
            try:
                _box, text, _score = item
            except (ValueError, TypeError):
                continue
            text = str(text).strip()
            if text:
                lines.append(text)
        text = '\n'.join(lines)
        parts.append(f'## {args.label} {i}（{f.name}）\n{text}')
        emit({'event': 'progress', 'image': i, 'total': len(files), 'chars': len(text)})

    md = '\n\n'.join(parts)
    outp = None
    if args.out:
        outp = Path(args.out)
        outp.parent.mkdir(parents=True, exist_ok=True)
        outp.write_text(md, encoding='utf-8')
    emit({'event': 'result', 'text': md, 'images': len(files), 'out': str(outp) if outp else None})


if __name__ == '__main__':
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    try:
        main()
    except Exception as exc:
        emit({'event': 'error', 'error': str(exc)[:500]})
        sys.exit(1)
