import opencc

c = opencc.OpenCC('t2s')
tr = '這是最喜歡繁體字測試，轉換為簡體。'
out = c.convert(tr)
checks = [
    ('这', '這' not in out and '这' in out),
    ('体', '體' not in out and '体' in out),
    ('转', '轉' not in out and '转' in out),
    ('简', '簡' not in out and '简' in out),
]
print('ALL_SIMPLIFIED:', all(v for _, v in checks))
for name, ok in checks:
    print(('PASS ' if ok else 'FAIL ') + name)
simp = '这一步的目的是什么?'
print('IDEMPOTENT:', c.convert(simp) == simp)
