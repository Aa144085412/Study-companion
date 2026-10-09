import asyncio
from pathlib import Path

import edge_tts

OUT = Path(__file__).resolve().parent / 'fixtures' / 'long-zh.mp3'

TEXT = (
    '今天我们继续讲解大肠杆菌转化实验。首先，感受态细胞要从负二十度取出，放在冰上十分钟，'
    '这样可以避免反复冻融损伤细胞膜。接下来加入质粒DNA，轻轻混匀，然后冰浴三十分钟，'
    '让DNA充分吸附到细胞表面。关键的一步是热激，把细胞放进四十二度水浴里加热四十五秒，'
    '这一步会让细胞膜暂时出现缝隙，帮助外源DNA进入细胞。热激之后必须立刻冰浴两分钟，'
    '迅速稳定进入细胞的DNA。然后加入九百微升不含抗性的LB培养基，在三十七度振荡复苏四十五分钟，'
    '让细胞恢复并少量表达质粒上的抗性基因。最后取一百微升涂布到含氨苄青霉素的LB平板上，'
    '三十七度培养过夜。第二天挑取单克隆，进行PCR鉴定。请特别注意，热激时间不能过长，'
    '否则细胞会失活；涂布前培养基必须冷却到大约五十度，否则会烫死细胞。'
)

async def main():
    communicate = edge_tts.Communicate(TEXT, voice='zh-CN-XiaoxiaoNeural')
    await communicate.save(str(OUT))
    print('WROTE', OUT, OUT.stat().st_size, 'bytes')

asyncio.run(main())
