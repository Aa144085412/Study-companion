"""Download a Douyin / Xiaohongshu video into data/media-inbox/<sid>/ with
metadata, a 16 kHz mono WAV (for faster-whisper) and a few keyframes (for the
vision LLM).

Run with the downloader venv (where yt-dlp lives):
  tools/.venv-dl/Scripts/python.exe scripts/download_media.py --url URL --source douyin

This file is stdlib-only; it shells out to yt-dlp (venv) and ffmpeg (PATH).
No store.json edits, no server startup. Emits JSON-lines progress; the final
event is `complete` (ok) or `failed`.
"""
import argparse
import json
import subprocess
import sys
import time
from pathlib import Path

VIDEO_EXTS = {'.mp4', '.webm', '.mkv', '.mov', '.m4v'}


def emit(**value):
    print(json.dumps(value, ensure_ascii=False), flush=True)


def run(cmd, cwd=None, timeout=900):
    return subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8',
                          errors='replace', cwd=cwd, timeout=timeout)


def find_ffmpeg():
    return 'ffmpeg'


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--url', required=True, help='视频页链接（抖音 / 小红书视频）')
    ap.add_argument('--source', choices=['douyin', 'xhs-video'], default='douyin')
    ap.add_argument('--app-root', type=Path, default=Path(__file__).resolve().parents[1])
    ap.add_argument('--out', type=Path, default=None, help='默认 <app-root>/data/media-inbox')
    ap.add_argument('--cookie-file', type=Path, default=None, help='cookies.txt（小红书等需登录时用）')
    ap.add_argument('--frames', type=int, default=8, help='最多抽多少关键帧（0=不抽）')
    args = ap.parse_args()

    app_root = args.app_root
    venv_py = app_root / 'tools' / '.venv-dl' / 'Scripts' / 'python.exe'
    if not venv_py.exists():
        raise RuntimeError('yt-dlp venv 缺失：tools/.venv-dl（先建 venv 装 yt-dlp）')
    out_root = args.out or (app_root / 'data' / 'media-inbox')
    sid = time.strftime('%Y%m%d-%H%M%S')
    work = out_root / sid
    work.mkdir(parents=True, exist_ok=True)
    frames_dir = work / 'frames'
    frames_dir.mkdir(exist_ok=True)
    emit(event='started', source=args.source, url=args.url, dir=str(work))

    # 1a) yt-dlp: 下载视频 + info.json（必需）。字幕放在独立的 1b 尽力步骤，
    #     避免字幕 429/多语言请求拖累甚至中断视频下载——音轨转写才是主文本源。
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

    # 1b) yt-dlp: 尽力补字幕（zh/en），失败仅告警、不中断。
    sub = None
    subs_pass = [str(venv_py), '-m', 'yt_dlp',
                 '--no-playlist', '--skip-download',
                 '--write-subs', '--write-auto-subs',
                 '--sub-langs', 'zh-Hans,zh-CN,zh,en', '--convert-subs', 'srt',
                 '-o', str(work / f'{sid}.%(ext)s'),
                 '--restrict-filenames', '--no-warnings']
    if args.cookie_file:
        subs_pass += ['--cookies', str(args.cookie_file)]
    subs_pass.append(args.url)
    rs = run(subs_pass, timeout=300)
    sub = next((p for p in work.glob(f'{sid}.*.srt')), None)
    if rs.returncode and not sub:
        emit(event='warn', stage='subs', rc=rs.returncode,
             detail='字幕获取失败（可能 429/无字幕），已跳过；音轨转写不受影响')
    emit(event='downloaded', video=str(video), title=info.get('title') or '',
         duration=info.get('duration'), uploader=info.get('uploader') or info.get('channel') or '',
         subs=str(sub) if sub else None)

    result = {
        'source': args.source, 'url': args.url, 'sid': sid, 'dir': str(work),
        'video': str(video),
        'title': info.get('title') or '', 'description': info.get('description') or '',
        'duration': info.get('duration'), 'uploader': info.get('uploader') or info.get('channel') or '',
        'webpage_url': info.get('webpage_url') or args.url,
        'subs': str(sub) if sub else None, 'audio': None, 'frames': [],
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
        probe = run([find_ffmpeg(), '-i', str(video), '-map', '0:v', '-frames:v', '1',
                     '-f', 'null', '-'], timeout=60)
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
