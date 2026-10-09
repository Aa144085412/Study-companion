"""edge-tts read-aloud worker. JSON lines are the only stdout protocol.

edge-tts streams raw Opus frames (no container), so this worker decodes them
with ffmpeg into a clean 24 kHz 16-bit mono WAV — the format the server and
browser already expect. edge-tts is Microsoft's cloud neural voice service,
so a network connection is required (text is sent to Microsoft).
"""
import argparse
import asyncio
import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

# Microsoft mainland-Chinese neural voices offered in the settings dropdown.
DEFAULT_VOICE = 'zh-CN-XiaoxiaoNeural'
KNOWN_VOICES = {
    'zh-CN-XiaoxiaoNeural', 'zh-CN-XiaoyiNeural', 'zh-CN-YunjianNeural',
    'zh-CN-YunxiNeural', 'zh-CN-YunxiaNeural', 'zh-CN-YunyangNeural',
    'zh-CN-liaoning-XiaobeiNeural', 'zh-TW-HsiaoChenNeural',
    'zh-TW-HsiaoYuNeural', 'zh-TW-YunJheNeural', 'zh-HK-HiuGaaiNeural',
}
# A few old Kokoro names that may still be stored — map them to a close match.
LEGACY_MAP = {
    'zf_xiaobei': 'zh-CN-XiaoxiaoNeural', 'zf_xiaoxiao': 'zh-CN-XiaoxiaoNeural',
    'zf_xiaoyi': 'zh-CN-XiaoyiNeural', 'zf_xiaoni': 'zh-CN-XiaoyiNeural',
    'zm_yunjian': 'zh-CN-YunjianNeural', 'zm_yunxi': 'zh-CN-YunxiNeural',
    'zm_yunxia': 'zh-CN-YunxiaNeural', 'zm_yunyang': 'zh-CN-YunyangNeural',
}


def emit(value):
    print(json.dumps(value, ensure_ascii=False), flush=True)


def resolve_voice(name):
    name = (name or '').strip()
    if not name:
        return DEFAULT_VOICE
    if name in KNOWN_VOICES:
        return name
    return LEGACY_MAP.get(name, DEFAULT_VOICE)


def run_ffmpeg(ffmpeg, src, out):
    cmd = [ffmpeg, '-hide_banner', '-loglevel', 'error', '-y',
           '-i', src, '-ar', '24000', '-ac', '1', '-c:a', 'pcm_s16le', out]
    proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if proc.returncode != 0 or not Path(out).is_file() or not Path(out).stat().st_size:
        tail = proc.stderr.decode('utf-8', 'ignore')[-400:]
        raise RuntimeError('ffmpeg 解码朗读音频失败：' + (tail or '未知错误'))


async def synth(text, voice, out):
    import edge_tts
    opus = os.path.join(tempfile.gettempdir(), 'study-tts-edge-{}.opus'.format(os.getpid()))
    try:
        await edge_tts.Communicate(text, voice).save(opus)
        if not Path(opus).is_file() or not Path(opus).stat().st_size:
            raise RuntimeError('edge-tts 未返回音频（可能是网络问题）')
        ffmpeg = shutil.which('ffmpeg')
        if not ffmpeg:
            raise RuntimeError('未找到 ffmpeg，请安装并加入 PATH（用于把 edge-tts 音频转成 WAV）')
        run_ffmpeg(ffmpeg, opus, out)
    finally:
        try:
            Path(opus).unlink()
        except OSError:
            pass


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('input')
    parser.add_argument('--out', required=True)
    parser.add_argument('--voice', default=DEFAULT_VOICE)
    args = parser.parse_args()
    text = Path(args.input).read_text(encoding='utf-8').strip()
    if not text:
        emit({'event': 'error', 'error': '没有可朗读的文字'})
        sys.exit(1)
    voice = resolve_voice(args.voice)
    try:
        asyncio.run(synth(text, voice, str(args.out)))
    except Exception as exc:
        emit({'event': 'error', 'error': str(exc)[:500]})
        sys.exit(1)
    emit({'event': 'result', 'file': str(Path(args.out).resolve()), 'sampleRate': 24000, 'voice': voice})


if __name__ == '__main__':
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    try:
        main()
    except SystemExit:
        raise
    except Exception as exc:
        emit({'event': 'error', 'error': str(exc)[:500]})
        sys.exit(1)
