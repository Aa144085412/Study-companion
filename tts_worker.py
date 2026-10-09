"""Kokoro TTS worker. JSON lines are the only stdout protocol."""
import argparse
import json
import sys
from pathlib import Path


def emit(value):
    print(json.dumps(value, ensure_ascii=False), flush=True)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('input')
    parser.add_argument('--out', required=True)
    parser.add_argument('--voice', default='zf_xiaobei')
    args = parser.parse_args()
    text = Path(args.input).read_text(encoding='utf-8').strip()
    if not text:
        emit({'event': 'error', 'error': '没有可朗读的文字'})
        sys.exit(1)
    root = Path(__file__).resolve().parent
    model = root / 'models' / 'kokoro' / 'kokoro-v1.0.int8.onnx'
    voices = root / 'models' / 'kokoro' / 'voices-v1.0.bin'
    if not (model.is_file() and voices.is_file()):
        emit({'event': 'error', 'error': '本地朗读模型未安装，请运行 setup-tts.ps1'})
        sys.exit(1)
    emit({'event': 'loading'})
    from kokoro_onnx import Kokoro, EspeakConfig
    import soundfile as sf
    pipe = Kokoro(str(model), str(voices), EspeakConfig())
    available = pipe.get_voices()
    voice = args.voice if args.voice in available else available[0]
    audio, _ = pipe.create(text, voice=voice, lang='cmn')
    import numpy as np
    arr = np.asarray(audio, dtype='float32')
    if not arr.size:
        emit({'event': 'error', 'error': '没有生成音频'})
        sys.exit(1)
    sf.write(str(args.out), arr, 24000)
    emit({'event': 'result', 'file': str(Path(args.out).resolve()), 'sampleRate': 24000, 'voice': voice})


if __name__ == '__main__':
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    try:
        main()
    except Exception as exc:
        emit({'event': 'error', 'error': str(exc)[:500]})
        sys.exit(1)
