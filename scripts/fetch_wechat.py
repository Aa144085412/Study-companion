"""Fetch a single 微信公众号 article (mp.weixin.qq.com/s/...) to Markdown + local
images, ready to import into Study companion as a text source.

Run: python scripts/fetch_wechat.py --url "https://mp.weixin.qq.com/s/XXXX"

Stdlib-only (urllib + html.parser). No third-party deps. Emits JSON-lines
progress; final event is `complete` (ok) or `failed`. The produced markdown ends
with a `图片目录：<dir>` line so the app's vision path auto-loads the article
images (same convention as import_xhs.py).
"""
import argparse
import hashlib
import json
import re
import sys
import urllib.request
from html.parser import HTMLParser
from pathlib import Path

UA = ('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
      '(KHTML, like Gecko) Chrome/124.0 Safari/537.36')


def emit(**value):
    print(json.dumps(value, ensure_ascii=False), flush=True)


def http_get(url, referer=None, timeout=30):
    headers = {'User-Agent': UA}
    if referer:
        headers['Referer'] = referer
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read(), resp.headers


BLOCK = {'p', 'div', 'section', 'article', 'figure', 'blockquote', 'pre',
         'table', 'tr', 'ul', 'ol'}
HEADING = {f'h{i}' for i in range(1, 7)}
SKIP = {'script', 'style'}


class WeChatMD(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.lines = []          # finished markdown blocks
        self.cur = []            # current inline buffer
        self.heading = 0         # heading level for the current block, else 0
        self.list_indent = 0     # nested list depth
        self.in_skip = 0
        self.images = []         # image urls in order
        self.title = ''
        self._in_title = False
        self._in_h = False

    # -- helpers --
    def _flush(self):
        text = re.sub(r'[ \t]+', ' ', ''.join(self.cur)).strip()
        self.cur = []
        if not text:
            return
        if self.heading:
            self.lines.append('#' * self.heading + ' ' + text)
        else:
            prefix = '    ' * self.list_indent + ('- ' if self.list_indent else '')
            self.lines.append(prefix + text)
        self.heading = 0

    def _inline(self, tag):
        marker = {'strong': '**', 'b': '**', 'em': '*', 'i': '*', 'code': '`'}
        return marker.get(tag)

    # -- parser hooks --
    def handle_starttag(self, tag, attrs):
        if tag in SKIP:
            self.in_skip += 1
            return
        if self.in_skip:
            return
        a = dict(attrs)
        if tag == 'h1' or tag in HEADING:
            self._flush()
            self._in_h = True
            self.heading = int(tag[1])
        elif tag == 'li':
            self._flush()
            self.list_indent = max(1, self.list_indent)
        elif tag in ('ul', 'ol'):
            self._flush()
        elif tag == 'br':
            self._flush()
            self.lines.append('')
        elif tag in BLOCK:
            self._flush()
        elif tag == 'img':
            src = a.get('data-src') or a.get('src') or ''
            if src:
                self.images.append(src)
                n = len(self.images)
                self.cur.append(f'![图{n}](img/{n:02d}.jpg) ')
        elif tag == 'a':
            href = a.get('href') or ''
            self.cur.append('[')
            self._href = href
        elif tag in ('strong', 'b', 'em', 'i', 'code'):
            self.cur.append(self._inline(tag))
        elif tag == 'title':
            self._in_title = True

    def handle_endtag(self, tag):
        if tag in SKIP:
            self.in_skip = max(0, self.in_skip - 1)
            return
        if self.in_skip:
            return
        if tag in HEADING:
            self._flush()
            self._in_h = False
        elif tag == 'li':
            self._flush()
            self.list_indent = max(0, self.list_indent - 1)
        elif tag in BLOCK:
            self._flush()
        elif tag == 'a':
            href = getattr(self, '_href', '')
            self.cur.append(f']({href})' if href else ']')
        elif tag in ('strong', 'b', 'em', 'i', 'code'):
            self.cur.append(self._inline(tag))
        elif tag == 'title':
            self._in_title = False

    def handle_data(self, data):
        if self.in_skip:
            return
        if self._in_title:
            self.title = (self.title + data).strip()
            return
        self.cur.append(data)


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--url', required=True)
    ap.add_argument('--app-root', type=Path, default=Path(__file__).resolve().parents[1])
    ap.add_argument('--out', type=Path, default=None)
    ap.add_argument('--max-images', type=int, default=40)
    args = ap.parse_args()

    if 'mp.weixin.qq.com' not in args.url:
        raise RuntimeError('URL 需为 mp.weixin.qq.com 公众号文章链接')
    out_root = args.out or (args.app_root / 'data' / 'wechat')
    slug = 'wechat-' + hashlib.sha1(args.url.encode()).hexdigest()[:12]
    work = out_root / slug
    img_dir = work / 'img'
    img_dir.mkdir(parents=True, exist_ok=True)
    emit(event='started', url=args.url, dir=str(work))

    raw, headers = http_get(args.url)
    html = raw.decode('utf-8', errors='replace')

    # title / author / date
    title = ''
    m = re.search(r'<meta\s+property="og:title"\s+content="([^"]+)"', html)
    if m:
        title = m.group(1)
    author = ''
    m = re.search(r'id="js_name"[^>]*>\s*([^<]+?)\s*<', html)
    if m:
        author = m.group(1)
    date = ''
    m = re.search(r"var\s+ct\s*=\s*\"(\d+)\"", html) or re.search(r'var\s+ct\s*=\s*\'(\d+)\'', html)
    if m:
        import datetime
        date = datetime.datetime.fromtimestamp(int(m.group(1))).strftime('%Y-%m-%d')

    # body -> markdown
    m = re.search(r'id="js_content"[^>]*>(.*)', html, re.S)
    body_html = m.group(1) if m else html
    parser = WeChatMD()
    parser.feed(body_html)
    parser._flush()
    if not parser.title:
        parser.title = title
    lines = [l for i, l in enumerate(parser.lines) if l.strip() or (i and parser.lines[i-1].strip() == '' )]
    # collapse runs of blank lines
    md_body = []
    blank = 0
    for l in lines:
        if l.strip() == '':
            blank += 1
            if blank > 1:
                continue
        else:
            blank = 0
        md_body.append(l)
    body_md = '\n'.join(md_body).strip()

    # download images
    saved = []
    for idx, url in enumerate(parser.images[:args.max_images], 1):
        ext = '.jpg'
        mext = re.search(r'\.(jpe?g|png|webp|gif)(\?|$)', url, re.I)
        if mext:
            ext = '.' + mext.group(1).lower()
            if ext == '.jpeg':
                ext = '.jpg'
        fname = f'{idx:02d}{ext}'
        dest = img_dir / fname
        if not dest.exists():
            try:
                data, _ = http_get(url, referer='https://mp.weixin.qq.com/')
                dest.write_bytes(data)
            except Exception as exc:
                emit(event='warn', image=idx, detail=str(exc))
                continue
        saved.append(fname)
    emit(event='images', requested=len(parser.images), saved=len(saved))

    title = parser.title or title or slug
    marker = f'<!-- wechat {slug} url:{args.url} -->'
    content = (
        f'{marker}\n\n'
        f'来源：微信公众号\n'
        f'公众号：{author or "未知"}\n'
        f'标题：{title}\n'
        f'原文链接：{args.url}\n'
        f'发布：{date or "未知"}\n\n'
        f'## {title}\n\n'
        f'{body_md}\n\n'
        f'说明：以下为公众号原文与正文配图，仅供学习核对；数字与实验参数需对照原文与正式规程确认。\n\n'
        f'图片目录：{img_dir}\n'
    )
    if len(content.encode('utf-16-le')) // 2 > 200000:
        raise RuntimeError('正文超过 200,000 字符，请拆分后导入')
    md_file = work / 'article.md'
    md_file.write_text(content, encoding='utf-8')
    emit(event='complete', ok=True, markdown=str(md_file), title=title,
         author=author, url=args.url, images=saved, dir=str(work))


if __name__ == '__main__':
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    main()
