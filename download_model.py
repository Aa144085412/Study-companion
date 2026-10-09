import os
from pathlib import Path
os.environ.setdefault('HF_HUB_DISABLE_XET', '1')
from huggingface_hub import snapshot_download

root = Path(__file__).resolve().parent
snapshot_download('Systran/faster-whisper-small', local_dir=root / 'models' / 'faster-whisper-small', allow_patterns=['model.bin', 'config.json', 'tokenizer.json', 'vocabulary.txt'], max_workers=2)
print('ASR_MODEL_READY')
