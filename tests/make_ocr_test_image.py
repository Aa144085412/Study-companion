"""Generate 3 Chinese experiment-note test images for OCR validation (no network, no model)."""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parent / 'fixtures' / 'ocr-test'
OUT.mkdir(parents=True, exist_ok=True)

LINES = [
    ('1.png', [
        '实验笔记：大肠杆菌 DH5α 转化表达 GFP',
        '第一步 制备感受态细胞',
        '取 -20℃ 保存的感受态细胞，置于冰上解冻 10 分钟，',
        '避免反复冻融损伤细胞膜。',
    ]),
    ('2.png', [
        '第二步 加入质粒 DNA',
        '向冰上的感受态细胞中加入约 5 μL 质粒（约 50 ng/μL），',
        '轻柔混匀后放回冰上冰浴 30 分钟。',
        '注意：全程无菌操作，防止污染。',
    ]),
    ('3.png', [
        '第三步 热激与复苏',
        '42℃ 水浴热激 45 秒，立即冰浴 2 分钟。',
        '加 900 μL LB 培养基，37℃ 振荡培养 45 分钟复苏。',
        '取 100 μL 涂布含氨苄青霉素 LB 平板，37℃ 过夜。',
    ]),
]


def font(size):
    for name in ('msyh.ttc', 'simhei.ttf', 'C:\\Windows\\Fonts\\msyh.ttc',
                 'C:\\Windows\\Fonts\\simhei.ttf'):
        try:
            return ImageFont.truetype(name, size)
        except Exception:
            continue
    return ImageFont.load_default()


def main():
    f = font(40)
    line_h, pad = 70, 30
    meas = ImageDraw.Draw(Image.new('RGB', (10, 10), 'white'))
    for name, lines in LINES:
        width = max(1100, max(meas.textbbox((0, 0), ln, font=f)[2] for ln in lines) + pad * 2)
        height = pad * 2 + line_h * len(lines)
        img = Image.new('RGB', (width, height), 'white')
        d = ImageDraw.Draw(img)
        y = pad
        for line in lines:
            d.text((pad, y), line, fill='black', font=f)
            y += line_h
        img.save(OUT / name)
        print('WROTE', OUT / name)


if __name__ == '__main__':
    main()
