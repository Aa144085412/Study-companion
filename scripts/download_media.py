"""Download a Douyin / Xiaohongshu video into data/media-inbox/<sid>/ with
metadata, a 16 kHz mono WAV (for faster-whisper) and a few keyframes (for the
vision LLM).

Run with the downloader venv (where yt-dlp lives):
  tools/.venv-dl/Scripts/python.exe scripts/download_media.py --url URL --source douyin

This file is stdlib-only; it shells out to yt-dlp (venv) and ffmpeg (PATH).
Douyin is downloaded via its mobile web API (aweme/v1/aweme/detail) + CDN
direct link, because yt-dlp's Douyin web-detail endpoint is 403-gated by the
X-Bogus anti-bot signature (which yt-dlp cannot compute). Xiaohongshu uses
yt-dlp.

No store.json edits, no server startup. Emits JSON-lines progress; the final
event is `complete` (ok) or `failed`.
"""
import argparse
import http.cookiejar
import json
import re
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

VIDEO_EXTS = {'.mp4', '.webm', '.mkv', '.mov', '.m4v'}
DY_UA = ('com.dy.ios9.0.0 (iPhone14,5; iOS 16.0; zh_CN; WiFi; '
         'tt-cid/; tt-wid/; cc/cn)')
DESKTOP_UA = ('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
              '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')


def emit(**value):
    print(json.dumps(value, ensure_ascii=False), flush=True)


def run(cmd, cwd=None, timeout=900):
    return subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8',
                          errors='replace', cwd=cwd, timeout=timeout)


def find_ffmpeg():
    return 'ffmpeg'


def load_cookies(path):
    cj = http.cookiejar.MozillaCookieJar()
    cj.load(str(path))
    return cj


def _douyin_get(url, cj):
    op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
    req = urllib.request.Request(url, headers={
        'User-Agent': DY_UA, 'Referer': 'https://www.douyin.com/'})
    return json.loads(op.open(req, timeout=30).read().decode('utf-8', 'replace'))


def resolve_douyin_id(url, cj):
    """Accept a /video/<id> page, a v.douyin.com short link, or a bare id."""
    m = re.search(r'douyin\.com/video/(\d+)', url)
    if m:
        return m.group(1)
    try:
        op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
        # 用桌面 UA 解析短链：移动端 app UA 会被导向 app 深链而非网页 /video/<id>
        final = op.open(urllib.request.Request(url, headers={'User-Agent': DESKTOP_UA}),
                        timeout=30).geturl()
        m = re.search(r'douyin\.com/video/(\d+)', final)
        if m:
            return m.group(1)
    except Exception:
        pass
    m = re.fullmatch(r'\d+', url.strip())
    return m.group(0) if m else None


def douyin_mobile_detail(video_id, cj):
    """aweme/v1/aweme/detail — the mobile web API. Returns aweme_detail or None."""
    data = _douyin_get('https://www.douyin.com/aweme/v1/aweme/detail/'
                       f'?aweme_id={video_id}', cj)
    return data.get('aweme_detail') or None


def _download_douyin(detail, work, sid, cj):
    """Download the first usable CDN play url. Returns (video_path, info_dict)."""
    v = detail.get('video') or {}
    cands = []
    for key in ('download_addr', 'play_addr', 'play_addr_h264',
               'play_addr_1080p', 'download_addr_h264'):
        lst = ((v.get(key) or {}).get('url_list')) or []
        cands.extend(lst)
    urls = [u for u in cands if u]
    if not urls:
        raise RuntimeError('抖音详情无可用播放地址')
    last_err = None
    for i, u in enumerate(urls):
        out = work / f'{sid}.mp4'
        req = urllib.request.Request(u, headers={'User-Agent': DY_UA,
                                                 'Referer': 'https://www.douyin.com/'})
        try:
            with urllib.request.urlopen(req, timeout=180) as r, open(out, 'wb') as f:
                f.write(r.read())
        except Exception as e:
            last_err = e
            continue
        if out.exists() and out.stat().st_size:
            # 移动端接口 video.duration 单位是毫秒，统一换算成秒（与 yt-dlp 一致）
            duration_ms = (detail.get('video') or {}).get('duration')
            info = {
                'title': detail.get('desc') or '',
                'description': detail.get('desc') or '',
                'duration': (round(duration_ms / 1000, 1) if duration_ms else None),
                'uploader': ((detail.get('author') or {}).get('nickname')) or '',
                'webpage_url': f'https://www.douyin.com/video/{detail.get("aweme_id")}',
            }
            emit(event='downloaded', video=str(out), via='douyin-mobile-api',
                 title=info['title'], duration=info['duration'],
                 uploader=info['uploader'], subs=None)
            return out, info
    raise RuntimeError(f'抖音 CDN 直链全部下载失败: {last_err}')


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--url', required=True, help='视频页链接（抖音 / 小红书视频 / B站）')
    ap.add_argument('--source', choices=['douyin', 'xhs-video', 'bilibili'], default='douyin')
    ap.add_argument('--app-root', type=Path, default=Path(__file__).resolve().parents[1])
    ap.add_argument('--out', type=Path, default=None, help='默认 <app-root>/data/media-inbox')
    ap.add_argument('--cookie-file', type=Path, default=None, help='cookies.txt（抖音/小红书需登录时用）')
    ap.add_argument('--frames', type=int, default=8, help='最多抽多少关键帧（0=不抽）')
    args = ap.parse_args()

    app_root = args.app_root
    venv_py = app_root / 'tools' / '.venv-dl' / 'Scripts' / 'python.exe'
    # 抖音/小红书需"新鲜 cookie"（不一定登录）。未显式给 --cookie-file 时，默认用 <app-root>/cookies.txt（若存在）。
    if args.source != 'bilibili' and not args.cookie_file and (app_root / 'cookies.txt').exists():
        args.cookie_file = app_root / 'cookies.txt'
    if args.cookie_file:
        emit(event='cookies', file=str(args.cookie_file))
    out_root = args.out or (app_root / 'data' / 'media-inbox')
    sid = time.strftime('%Y%m%d-%H%M%S')
    work = out_root / sid
    work.mkdir(parents=True, exist_ok=True)
    frames_dir = work / 'frames'
    frames_dir.mkdir(exist_ok=True)
    emit(event='started', source=args.source, url=args.url, dir=str(work))

    video = None
    info = {}
    cj = load_cookies(args.cookie_file) if args.cookie_file else http.cookiejar.CookieJar()

    # ---- 抖音：优先走移动接口直连（绕过 yt-dlp 网页接口被 X-Bogus 反爬 403）----
    if args.source == 'douyin':
        try:
            vid = resolve_douyin_id(args.url, cj)
            emit(event='douyin-id', id=vid)
            detail = douyin_mobile_detail(vid, cj) if vid else None
            if detail:
                video, info = _download_douyin(detail, work, sid, cj)
                # 尽力补字幕：抖音网页接口常被 403，失败不影响音轨转写
                sub = None
                yts = [str(venv_py), '-m', 'yt_dlp', '--no-playlist', '--skip-download',
                       '--write-subs', '--write-auto-subs',
                       '--sub-langs', 'zh-Hans,zh-CN,zh,en', '--convert-subs', 'srt',
                       '-o', str(work / f'{sid}.%(ext)s'), '--restrict-filenames',
                       '--no-warnings']
                if args.cookie_file:
                    yts += ['--cookies', str(args.cookie_file)]
                yts += [f'https://www.douyin.com/video/{vid}']
                rs = run(yts, timeout=180)
                sub = next((p for p in work.glob(f'{sid}.*.srt')), None)
                if sub:
                    info['subs'] = str(sub)
                else:
                    emit(event='warn', stage='subs', rc=rs.returncode,
                         detail='字幕获取失败/无字幕（抖音网页接口受限），已跳过；音轨转写不受影响')
            else:
                emit(event='warn', stage='douyin-mobile',
                     detail='移动接口未返回 aweme_detail（可能被过滤/需登录），回退 yt-dlp')
        except Exception as e:
            emit(event='warn', stage='douyin-mobile', detail=f'移动接口直连失败: {e}')

    # ---- 回退 / 小红书：yt-dlp 下载视频 + info.json ----
    if not video:
        ytdlp = [str(venv_py), '-m', 'yt_dlp',
                 '--no-playlist', '-f', 'bv*+ba/b',
                 '-o', str(work / f'{sid}.%(ext)s'),
                 '--write-info-json', '--restrict-filenames',
                 '--no-warnings', '--sleep-interval', '2']
        if args.cookie_file:
            ytdlp += ['--cookies', str(args.cookie_file)]
        ytdlp.append(args.url)
        emit(event='downloading', via='yt-dlp', version_cmd='tools/.venv-dl yt-dlp')
        r = run(ytdlp, timeout=1200)

        video = next((p for p in work.glob(f'{sid}.*') if p.suffix.lower() in VIDEO_EXTS), None)
        info_file = work / f'{sid}.info.json'
        info = json.loads(info_file.read_text(encoding='utf-8')) if info_file.exists() else {}
        video_ok = bool(video and video.stat().st_size)
        if not video_ok:
            emit(event='failed', stage='download' if r.returncode else 'locate',
                 rc=r.returncode, detail='未得到可用视频文件（可能为纯音频/需登录/无网络）',
                 log=(r.stdout[-1500:] + '\n---\n' + r.stderr[-1500:]))
            sys.exit(1)
        sub = next((p for p in work.glob(f'{sid}.*.srt')), None)
        info.setdefault('subs', str(sub) if sub else None)
        emit(event='downloaded', video=str(video),
             title=info.get('title') or '',
             duration=info.get('duration'),
             uploader=info.get('uploader') or info.get('channel') or '',
             subs=str(sub) if sub else None)

    result = {
        'source': args.source, 'url': args.url, 'sid': sid, 'dir': str(work),
        'video': str(video),
        'title': info.get('title') or '', 'description': info.get('description') or '',
        'duration': info.get('duration'), 'uploader': info.get('uploader') or info.get('channel') or '',
        'webpage_url': info.get('webpage_url') or args.url,
        'subs': info.get('subs') or None, 'audio': None, 'frames': [],
    }

    # 2) ffmpeg: 抽 16kHz 单声道音频（供 faster-whisper）
    audio = work / f'{sid}.wav'
    emit(event='extracting-audio', to=str(audio))
    r = run([find_ffmpeg(), '-y', '-i', str(video), '-vn', '-ac', '1', '-ar', '16000', str(audio)], timeout=600)
    if r.returncode or not audio.exists() or not audio.stat().st_size:
        emit(event='warn', stage='audio', detail=(r.stderr[-300:] or '音频抽取失败/空'))
    else:
        result['audio'] = str(audio)
        emit(event='audio-done', audio=str(audio), bytes=audio.stat().st_size)

    # 3) ffmpeg: 抽关键帧（供视觉 LLM 理解画面）
    if args.frames > 0:
        emit(event='extracting-frames', max=args.frames)
        # 简单按每 (duration/frames) 秒抽一帧；duration 缺失时用 fps 兜底
        dur = info.get('duration') or 0
        step = max(1, int(dur / args.frames)) if dur else 5
        vf = f'fps=1/{step}'
        r = run([find_ffmpeg(), '-y', '-i', str(video), '-vf', vf,
                 '-frames:v', str(args.frames),
                 str(frames_dir / 'frame_%03d.jpg')], timeout=600)
        frames = sorted(frames_dir.glob('frame_*.jpg'))
        result['frames'] = [str(p) for p in frames]
        emit(event='frames-done', count=len(frames))

    emit(event='complete', ok=True, result=result)


if __name__ == '__main__':
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    main()
