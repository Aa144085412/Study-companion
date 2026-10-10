// 把研习伴里综合好的实验笔记写入 Obsidian vault（带 frontmatter + 交叉链接 + 来源链接 + MOC）。
// 用法：node scripts/write_obsidian.mjs [importReport.json] [obsidianVaultDir]
// 依赖：data/_organize/nb{1,2,3}/note.md（各笔记本综合笔记正文）+ import-report（noteId/标题）。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ORG = path.join(ROOT, 'data', '_organize');
const REPORT = process.argv[2] || 'C:/Users/a1440/Desktop/MediaCrawler/data/xhs/import-report-2026-10-10.json';
const VAULT = process.argv[3] || 'C:/D盘备份/obsidian-storage/PHD-research/Clippings';
const OUT = path.join(VAULT, '实验笔记');

const rep = JSON.parse(fs.readFileSync(REPORT, 'utf8'));
const byKeyword = {};
for (const n of rep.notes) (byKeyword[n.keyword] ??= []).push({ noteId: n.noteId, title: n.title });

const cards = [
  {
    n: 1, file: '大肠杆菌转化（感受态）化学转化.md', keyword: '大肠杆菌转化',
    title: '大肠杆菌转化（感受态）化学转化',
    tags: ['实验', '分子克隆', '大肠杆菌', '感受态'],
    nb: '21de8d2a-4206-4268-8814-0dac3f0cb86b',
    related: [
      ['细菌菌种活化、扩增与保藏', '转化前需挑单菌落、复苏与逐级复壮'],
      ['PCR·qPCR·菌落PCR', '转化产物用菌落PCR 初步鉴定是否插入目的片段'],
    ],
  },
  {
    n: 2, file: '细菌菌种活化、扩增与保藏.md', keyword: '菌种活化',
    title: '细菌菌种活化、扩增与保藏',
    tags: ['实验', '微生物', '菌种保藏', '甘油保菌'],
    nb: 'dc211790-cbd6-4f73-bc0f-6b8b6508b048',
    related: [
      ['大肠杆菌转化（感受态）化学转化', '复壮/活化后的菌用于感受态制备与转化'],
      ['PCR·qPCR·菌落PCR', '大量扩增与摇菌为下游 PCR 提供模板/菌落'],
    ],
  },
  {
    n: 3, file: 'PCR·qPCR·菌落PCR.md', keyword: 'PCR 实验',
    title: 'PCR·qPCR·菌落PCR',
    tags: ['实验', 'PCR', 'qPCR', '分子生物学'],
    nb: '0e2da1c9-9ebb-4ad3-a232-8c32dd0f3e62',
    related: [
      ['大肠杆菌转化（感受态）化学转化', '菌落PCR 鉴定转化克隆是否插入目的片段'],
      ['细菌菌种活化、扩增与保藏', '摇菌/单菌落为菌落PCR 提供模板'],
    ],
  },
];

fs.mkdirSync(OUT, { recursive: true });
const written = [];

for (const c of cards) {
  // note.md 正文末尾自带一个「### 资料来源」（noteId 纯文本，不可点）；
  // 这里去掉它，统一用下方带链接的「## 原始资料」区块。
  const rawFull = fs.readFileSync(path.join(ORG, 'nb' + c.n, 'note.md'), 'utf8');
  const cut = rawFull.indexOf('### 资料来源');
  const raw = (cut >= 0 ? rawFull.slice(0, cut) : rawFull).replace(/\n+-{3,}\s*$/, '').replace(/\s+$/, '');
  const src = byKeyword[c.keyword];
  const fm = [
    '---',
    `title: ${c.title}`,
    'type: 实验笔记',
    `source: 小红书（${src.length} 篇图文 OCR）`,
    `tags: [${c.tags.join(', ')}]`,
    `notebook: ${c.nb}`,
    'created: 2026-10-10',
    '---',
    '',
  ].join('\n');
  const sources = src.map((s, i) => {
    const url = `https://www.xiaohongshu.com/explore/${s.noteId}`;
    return `- S${i + 1} [${s.title}](${url})`;
  }).join('\n');
  const relBlock = c.related.map(([t, why]) => `- [[${t}]] — ${why}`).join('\n');
  const foot = [
    '',
    '## 相关笔记',
    relBlock,
    '',
    '## 原始资料（小红书图文，8 篇）',
    sources,
    '',
    '> 由研习伴整理，参数需对照正式 SOP 与试剂说明书核对。',
    '',
  ].join('\n');
  const full = fm + raw.trim() + '\n' + foot;
  fs.writeFileSync(path.join(OUT, c.file), full, 'utf8');
  written.push([c.file, full.length]);
}

const index = [
  '# 实验笔记 · 索引（MOC）',
  '',
  '> 由研习伴从 3 个小红书笔记本（各 8 篇图文 OCR）综合整理的实验笔记。参数需对照正式 SOP 与试剂说明书核对后再执行。',
  '',
  '## 实验操作',
  '- [[大肠杆菌转化（感受态）化学转化]] — 感受态制备 + 化学转化（热击法）+ 转化效率',
  '- [[细菌菌种活化、扩增与保藏]] — 复苏/挑菌/逐级复壮/甘油保菌 + 革兰氏染色',
  '- [[PCR·qPCR·菌落PCR]] — 常规 PCR / qPCR / RT-qPCR / 菌落PCR + ΔΔCt 处理',
  '',
  '## 流程串联（典型克隆流程）',
  '1. [[细菌菌种活化、扩增与保藏]] 复苏并复壮感受态宿主菌',
  '2. [[大肠杆菌转化（感受态）化学转化]] 转化重组质粒',
  '3. [[PCR·qPCR·菌落PCR]] 菌落PCR 初筛阳性克隆，再测序确认',
  '',
  '## 相关主题（本库现有笔记，可继续补链接）',
  '- [[基因敲除敲入全策略]]',
  '- [[实验方案设计与评估]]',
  '- [[全湿实验流程]]',
  '',
  '## 来源',
  '3 个笔记本：大肠杆菌转化 / 菌种活化 / PCR 实验；每本 8 篇小红书图文（OCR）。',
  '来源清单：MediaCrawler/data/xhs/import-report-*.json（原帖链接见各笔记「原始资料」）',
  '',
].join('\n');
fs.writeFileSync(path.join(OUT, '实验笔记索引.md'), index, 'utf8');

console.log('Wrote to:', OUT);
for (const [f, n] of written) console.log('  ', f, n, 'chars');
console.log('   实验笔记索引.md', fs.statSync(path.join(OUT, '实验笔记索引.md')).size, 'chars');
