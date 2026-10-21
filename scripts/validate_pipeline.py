import json, sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from src.schemas.pipeline import PipelineArtifact, VerifiedQuizItem
if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    data=json.loads(Path(sys.argv[2]).read_text(encoding='utf-8'))
    if sys.argv[1]=='quiz':
        for q in data: VerifiedQuizItem.model_validate(q)
    else: PipelineArtifact.model_validate(data)
    print(json.dumps({'valid':True,'contract':sys.argv[1]}))
