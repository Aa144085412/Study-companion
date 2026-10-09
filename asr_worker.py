"""Offline transcription worker. JSON lines are the only stdout protocol."""
import argparse
import json
import sys
from pathlib import Path


def emit(value):
    print(json.dumps(value, ensure_ascii=False), flush=True)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('input')
    parser.add_argument('--model', required=True)
    args = parser.parse_args()
    if not (Path(args.model) / 'model.bin').is_file():
        raise RuntimeError('本地识别模型未安装，请运行 setup-asr.ps1。')
    from faster_whisper import WhisperModel
    from opencc import OpenCC
    conv = OpenCC('t2s')
    emit({'event': 'loading', 'progress': 0})
    model = WhisperModel(args.model, device='cpu', compute_type='int8', cpu_threads=4, local_files_only=True)
    segments, info = model.transcribe(args.input, language='zh', beam_size=5, vad_filter=True, condition_on_previous_text=False)
    emit({'event': 'ready', 'duration': info.duration})
    result = []
    for s in segments:
        item = {'start': round(s.start * 1000), 'end': round(s.end * 1000), 'text': conv.convert(s.text.strip())}
        result.append(item)
        emit({'event': 'progress', 'progress': min(99, round(100 * s.end / max(info.duration, 1)))})
    emit({'event': 'result', 'segments': result, 'text': '\n'.join(x['text'] for x in result), 'duration': info.duration, 'model': 'faster-whisper-small / CPU int8'})


if __name__ == '__main__':
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    try:
        main()
    except Exception as exc:
        emit({'event': 'error', 'error': str(exc)[:500]})
        sys.exit(1)
